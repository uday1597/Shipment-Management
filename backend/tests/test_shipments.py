import pytest
from app.repositories.shipment_repository import ShipmentRepository
from app.services.shipment_service import ShipmentService
from app.database import Base
from app.models import Shipment,ShipmentStatusHistory
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.orm.exc import StaleDataError
from tests.conftest import TestingSessionLocal
from sqlalchemy import inspect
from tests.conftest import test_engine

def create_shipment(client):
    response = client.post(
        "/shipments/",
        json={
            "content": "Wooden table",
            "destination": "Hyderabad",
            "weight": 10,
            "distance": 100,
        },
    )
    assert response.status_code in (200, 201)
    return response.json()


def test_get_shipments_empty(client):
    response = client.get("/shipments/")

    assert response.status_code == 200
    assert response.json() == []


def test_create_shipment(client):
    response = client.post(
        "/shipments/",
        json={
            "content": "Wooden table",
            "destination": "Hyderabad",
            "weight": 10,
            "distance": 100,
        },
    )

    assert response.status_code in (200, 201)

    data = response.json()
    assert data["id"] is not None
    assert data["content"] == "Wooden table"
    assert data["destination"] == "Hyderabad"
    assert data["status"] == "created"
    assert data["cost"] == 50


def test_get_shipment_by_id(client):
    created = create_shipment(client)

    response = client.get(f"/shipments/{created['id']}")

    assert response.status_code == 200
    assert response.json()["id"] == created["id"]


def test_update_shipment(client):
    created = create_shipment(client)

    response = client.patch(
        f"/shipments/{created['id']}",
        json={
            "weight": 20,
            "expected_version": created["version"],
        },
    )

    assert response.status_code == 200

    data = response.json()
    assert data["weight"] == 20
    assert data["distance"] == 100
    assert data["cost"] == 100
    assert data["status"] == "updated"
    assert data["version"] == created["version"] + 1


def test_update_shipment_rejects_stale_version(client):
    created = create_shipment(client)
    shipment_id = created["id"]
    original_version = created["version"]

    # Client A updates successfully using the original version.
    first_response = client.patch(
        f"/shipments/{shipment_id}",
        json={
            "weight": 20,
            "expected_version": original_version,
        },
    )

    assert first_response.status_code == 200
    assert first_response.json()["version"] == original_version + 1

    # Client B tries to update using the now-stale version.
    stale_response = client.patch(
        f"/shipments/{shipment_id}",
        json={
            "destination": "Guntur",
            "expected_version": original_version,
        },
    )

    assert stale_response.status_code == 409

    # Verify that the rejected update did not change the shipment.
    get_response = client.get(f"/shipments/{shipment_id}")

    assert get_response.status_code == 200
    final_data = get_response.json()
    assert final_data["destination"] == created["destination"]
    assert final_data["weight"] == 20
    assert final_data["version"] == original_version + 1



def test_delete_shipment(client):
    created = create_shipment(client)
    shipment_id = created["id"]

    response = client.delete(f"/shipments/{shipment_id}")

    assert response.status_code in (200, 204)

    response = client.get(f"/shipments/{shipment_id}")
    assert response.status_code == 404


def test_get_nonexistent_shipment(client):
    response = client.get("/shipments/999999")

    assert response.status_code == 404


def test_create_shipment_invalid_data(client):
    response = client.post(
        "/shipments/",
        json={
            "content": "Box",
            "destination": "Hyderabad",
            "weight": -10,
            "distance": 100,
        },
    )

    assert response.status_code == 422


def test_create_shipment_rolls_back_on_failure(
    client,
    monkeypatch,
):
    original_create = ShipmentRepository.create

    def create_then_fail(self, shipment_data):
        original_create(self, shipment_data)
        raise RuntimeError("Simulated failure after flush")

    monkeypatch.setattr(
        ShipmentRepository,
        "create",
        create_then_fail,
    )

    response = client.post(
        "/shipments/",
        json={
            "content": "Wooden table",
            "destination": "Hyderabad",
            "weight": 10,
            "distance": 100,
        },
    )

    assert response.status_code == 500
    assert response.json() == {"detail": "Internal server error"}

    shipments_response = client.get("/shipments/")

    assert shipments_response.status_code == 200
    assert shipments_response.json() == []

def test_unexpected_error_returns_safe_500_response(
    client,
    monkeypatch,
):
    def raise_unexpected_error(*args, **kwargs):
        raise RuntimeError("Simulated unexpected error")
        
    monkeypatch.setattr(
        ShipmentService,
        "get_shipments",
        raise_unexpected_error,
    )

    response = client.get("/shipments/")

    assert response.status_code == 500
    assert response.json() == {
        "detail": "Internal server error"
    }
    assert "Sensitive internal database details" not in response.text

def test_get_shipments_with_limit(client):
    for index in range(3):
        response = client.post(
            "/shipments/",
            json={
                "content": f"Package {index + 1}",
                "destination": "Hyderabad",
                "weight": 10,
                "distance": 100,
            },
        )
        assert response.status_code == 201

    response = client.get("/shipments/?limit=2")

    assert response.status_code == 200
    assert len(response.json()) == 2
    assert [item["content"] for item in response.json()] == [
        "Package 1",
        "Package 2",
    ]


def test_get_shipments_with_offset(client):
    for index in range(3):
        client.post(
            "/shipments/",
            json={
                "content": f"Package {index + 1}",
                "destination": "Hyderabad",
                "weight": 10,
                "distance": 100,
            },
        )

    response = client.get("/shipments/?limit=2&offset=2")

    assert response.status_code == 200
    assert len(response.json()) == 1
    assert response.json()[0]["content"] == "Package 3"


def test_get_shipments_rejects_invalid_pagination(client):
    assert client.get("/shipments/?limit=0").status_code == 422
    assert client.get("/shipments/?limit=101").status_code == 422
    assert client.get("/shipments/?offset=-1").status_code == 422

def test_sqlalchemy_detects_concurrent_update(tmp_path):
    # Use a separate, temporary database for this test.
    engine = create_engine(
        f"sqlite:///{tmp_path / 'optimistic_locking.db'}"
    )
    TestSessionLocal = sessionmaker(
        bind=engine,
        expire_on_commit=False,
    )

    Base.metadata.create_all(bind=engine)

    session_a = TestSessionLocal()
    session_b = TestSessionLocal()

    try:
        # Create a shipment.
        shipment = Shipment(
            content="Wooden table",
            destination="Hyderabad",
            status="created",
            weight=10,
            distance=100,
            cost=50,
        )
        session_a.add(shipment)
        session_a.commit()
        shipment_id = shipment.id

        # Both sessions load the same version.
        shipment_a = session_a.get(Shipment, shipment_id)
        shipment_b = session_b.get(Shipment, shipment_id)

        assert shipment_a is not None
        assert shipment_b is not None
        assert shipment_a.version == shipment_b.version

        # Session A updates and commits first.
        shipment_a.weight = 20
        session_a.commit()

        assert shipment_a.version == shipment_b.version + 1

        # Session B tries to save its stale copy.
        shipment_b.destination = "Guntur"

        with pytest.raises(StaleDataError):
            session_b.commit()

        session_b.rollback()
        # Session B can be used again after rollback.
        reloaded_shipment_b = session_b.get(Shipment, shipment_id)

        assert reloaded_shipment_b is not None
        assert reloaded_shipment_b.weight == 20
        assert reloaded_shipment_b.destination == "Hyderabad"
        # Verify that Session A's update was preserved.
        with TestSessionLocal() as verification_session:
            final_shipment = verification_session.get(
                Shipment, shipment_id
            )

            assert final_shipment is not None
            assert final_shipment.weight == 20
            assert final_shipment.destination == "Hyderabad"
            assert final_shipment.version == shipment_a.version

    finally:
        session_a.close()
        session_b.close()
        Base.metadata.drop_all(bind=engine)
        engine.dispose()

def test_update_shipment_rolls_back_if_status_history_fails(
    client,
    monkeypatch,
):
    created = create_shipment(client)

    def fail_add_status_history(*args, **kwargs):
        raise RuntimeError("Simulated status history failure")

    monkeypatch.setattr(
        ShipmentRepository,
        "add_status_history",
        fail_add_status_history,
    )

    response = client.patch(
        f"/shipments/{created['id']}",
        json={
            "weight": 20,
            "expected_version": created["version"],
        },
    )

    assert response.status_code == 500
    assert response.json() == {
        "detail": "Internal server error"
    }

    # The shipment update must have been rolled back.
    get_response = client.get(
        f"/shipments/{created['id']}"
    )

    assert get_response.status_code == 200

    final_data = get_response.json()
    assert final_data["weight"] == 10
    assert final_data["cost"] == 50
    assert final_data["version"] == created["version"]


def test_update_shipment_rolls_back_after_history_flush(
    client, monkeypatch, get_history_count
):
    created = create_shipment(client)
    shipment_id = created["id"]

    history_count_before = get_history_count(shipment_id)

    original_add_status_history = ShipmentRepository.add_status_history

    def add_history_then_fail(self, *args, **kwargs):
        original_add_status_history(self, *args, **kwargs)
        raise RuntimeError("Simulated failure after history flush")

    monkeypatch.setattr(
        ShipmentRepository,
        "add_status_history",
        add_history_then_fail,
    )

    response = client.patch(
        f"/shipments/{shipment_id}",
        json={
            "weight": 20,
            "expected_version": created["version"],
        },
    )

    assert response.status_code == 500
    assert response.json() == {"detail": "Internal server error"}

    # The shipment update must have rolled back.
    shipment_response = client.get(f"/shipments/{shipment_id}")
    assert shipment_response.status_code == 200

    final_shipment = shipment_response.json()
    assert final_shipment["weight"] == 10
    assert final_shipment["cost"] == 50
    assert final_shipment["version"] == created["version"]

    # The flushed history record must have rolled back too.
    history_count_after = get_history_count(shipment_id)
    assert history_count_after == history_count_before

def test_update_shipment_commits_status_history(client, get_history_count):
    created = create_shipment(client)
    shipment_id = created["id"]

    history_count_before = get_history_count(shipment_id)

    response = client.patch(
        f"/shipments/{shipment_id}",
        json={
            "weight": 20,
            "expected_version": created["version"],
        },
    )

    assert response.status_code == 200

    updated_shipment = response.json()

    # Verify that the shipment update was committed.
    assert updated_shipment["weight"] == 20
    assert updated_shipment["cost"] == 100
    assert updated_shipment["version"] == created["version"] + 1

    # Verify that the status-history entry was committed too.
    history_count_after = get_history_count(shipment_id)
    assert history_count_after == history_count_before + 1
