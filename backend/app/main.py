
# app/main.py

from contextlib import asynccontextmanager
import logging
from fastapi import FastAPI
from app.api.shipments import router as shipment_router

# 1. Define the lifespan logic
@asynccontextmanager
async def app_lifespan(app: FastAPI):
    # ─── STARTUP ZONE ───
    # This runs BEFORE the server starts accepting requests
    app.state.mock_db = [
            {
                "id": 1,
                "content": "Wooden table",
                "destination": "Hyderabad",
                "status": "created",
                "weight": 100,
                "distance": 1000,
                "cost": 5000
            },
            {
                "id": 2,
                "content": "Wooden chair",
                "destination": "Bangalore",
                "status": "created",
                "weight": 125,
                "distance": 9867,
                "cost": 61668.75
            },
            {
                "id": 3,
                "content": "Wooden shelf",
                "destination": "Mumbai",
                "status": "created",
                "weight": 97,
                "distance": 10342,
                "cost": 50158.7
            }
        ]
    print("🚀 In-memory database initialized on application state.")
    
    yield  # 💻 The app is now running and serving requests!
    
    # ─── SHUTDOWN ZONE ───
    # This runs AFTER the server is told to stop, but BEFORE it exits
    app.state.mock_db.clear()
    print("🧹 In-memory database cleared.")

logging.basicConfig(
    level=logging.INFO, # 👈 Force Python to accept INFO-level logs instead of just WARNINGs
    format="%(levelname)s:     %(message)s", # Matches default Uvicorn terminal formatting
)

app = FastAPI(
    title="Shipment Management API",
    description="A FastAPI application to manage shipments",
    version="1.0.0",
    lifespan=app_lifespan
)

app.include_router(shipment_router)


@app.get("/")
def home():
    return {
        "message": "Welcome to Shipment Management API"
    }