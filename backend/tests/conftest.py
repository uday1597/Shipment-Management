
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.database import Base, get_db
from app.main import app
from app.models import (
    Shipment,
    ShipmentStatusHistory,
    ProofOfDeliveryPhoto,
)
test_engine = create_engine(
    "sqlite://",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)

TestingSessionLocal = sessionmaker(
    bind=test_engine,
    autoflush=False,
    expire_on_commit=False,
)
@pytest.fixture
def client():
    Base.metadata.create_all(bind=test_engine)
    print("After create_all:", test_engine.dialect.name,
          Base.metadata.tables.keys())

    def override_get_db():
        db = TestingSessionLocal()
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = override_get_db

    try:
        with TestClient(
            app,
            raise_server_exceptions=False,
        ) as test_client:
            yield test_client
    finally:
        app.dependency_overrides.clear()
        Base.metadata.drop_all(bind=test_engine)


@pytest.fixture
def get_history_count(client):
    def _get_history_count(shipment_id: int) -> int:
        with TestingSessionLocal() as db:
            return (
                db.query(ShipmentStatusHistory)
                .filter(
                    ShipmentStatusHistory.shipment_id == shipment_id
                )
                .count()
            )

    return _get_history_count
