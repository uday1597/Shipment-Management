
import logging
import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.shipments import router as shipment_router


logging.basicConfig(
    level=logging.INFO,
    format="%(levelname)s: %(message)s",
)

app = FastAPI(
    title="Shipment Management API",
    description="A FastAPI application to manage shipments",
    version="1.0.0",
)

allowed_origins = [
    origin.strip()
    for origin in os.getenv(
        "FRONTEND_ORIGINS",
        "http://localhost:5173",
    ).split(",")
    if origin.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://localhost",  # Capacitor Android WebView
        "http://localhost:5173",  # Vite development
        "https://shipment-management-1-g8ky.onrender.com",  # Add your deployed frontend origin here
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(shipment_router)


@app.get("/")
def home():
    return {"message": "Welcome to Shipment Management API"}


@app.get("/health")
def health():
    return {"status": "ok"}
