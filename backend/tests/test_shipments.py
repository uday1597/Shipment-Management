
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
        json={"weight": 20},
    )

    assert response.status_code == 200

    data = response.json()
    assert data["weight"] == 20
    assert data["distance"] == 100
    assert data["cost"] == 100
    assert data["status"] == "updated"


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
