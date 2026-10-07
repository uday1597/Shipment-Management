
# app/main.py

from contextlib import asynccontextmanager
import logging
from fastapi import FastAPI
from app.api.shipments import router as shipment_router
from fastapi.middleware.cors import CORSMiddleware

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
        },
        {
            "id": 4,
            "content": "Office Desk",
            "destination": "Chennai",
            "status": "created",
            "weight": 85,
            "distance": 630,
            "cost": 4250
        },
        {
            "id": 5,
            "content": "Conference Table",
            "destination": "Pune",
            "status": "created",
            "weight": 150,
            "distance": 560,
            "cost": 7500
        },
        {
            "id": 6,
            "content": "Computer Hardware",
            "destination": "Delhi",
            "status": "created",
            "weight": 45,
            "distance": 1570,
            "cost": 6750
        },
        {
            "id": 7,
            "content": "Industrial Equipment",
            "destination": "Ahmedabad",
            "status": "created",
            "weight": 250,
            "distance": 1240,
            "cost": 12500
        },
        {
            "id": 8,
            "content": "Office Chairs",
            "destination": "Kolkata",
            "status": "created",
            "weight": 75,
            "distance": 1500,
            "cost": 8250
        },
        {
            "id": 9,
            "content": "Electronic Components",
            "destination": "Gurgaon",
            "status": "created",
            "weight": 60,
            "distance": 1480,
            "cost": 7200
        },
        {
            "id": 10,
            "content": "Warehouse Supplies",
            "destination": "Jaipur",
            "status": "created",
            "weight": 180,
            "distance": 1390,
            "cost": 9800
        },
        {
            "id": 11,
            "content": "Glass Panels",
            "destination": "Kochi",
            "status": "created",
            "weight": 120,
            "distance": 1450,
            "cost": 6800
        },
        {
            "id": 12,
            "content": "Steel Components",
            "destination": "Nagpur",
            "status": "created",
            "weight": 320,
            "distance": 720,
            "cost": 14200
        },
        {
            "id": 13,
            "content": "LED Lighting Equipment",
            "destination": "Visakhapatnam",
            "status": "created",
            "weight": 65,
            "distance": 620,
            "cost": 4850
        },
        {
            "id": 14,
            "content": "Kitchen Appliances",
            "destination": "Coimbatore",
            "status": "created",
            "weight": 95,
            "distance": 500,
            "cost": 6100
        },
        {
            "id": 15,
            "content": "Packaging Materials",
            "destination": "Surat",
            "status": "created",
            "weight": 210,
            "distance": 1320,
            "cost": 8900
        },
        {
            "id": 16,
            "content": "Solar Equipment",
            "destination": "Bhopal",
            "status": "created",
            "weight": 175,
            "distance": 1150,
            "cost": 10250
        },
        {
            "id": 17,
            "content": "Pharmaceutical Supplies",
            "destination": "Lucknow",
            "status": "created",
            "weight": 55,
            "distance": 1450,
            "cost": 7350
        },
        {
            "id": 18,
            "content": "Automotive Spare Parts",
            "destination": "Mysore",
            "status": "created",
            "weight": 190,
            "distance": 680,
            "cost": 9150
        },
        {
            "id": 19,
            "content": "Textile Machinery",
            "destination": "Indore",
            "status": "created",
            "weight": 280,
            "distance": 980,
            "cost": 13500
        },
        {
            "id": 20,
            "content": "Computer Monitors",
            "destination": "Noida",
            "status": "created",
            "weight": 72,
            "distance": 1520,
            "cost": 8450
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
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(shipment_router)


@app.get("/")
def home():
    return {
        "message": "Welcome to Shipment Management API"
    }