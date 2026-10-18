
import logging
import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.shipments import router as shipment_router
from app.api.analytics import router as analytics_router
from fastapi import Request
from fastapi.responses import JSONResponse

from app.services.shipment_service import ShipmentNotFoundError

logging.basicConfig(
    level=os.getenv("LOG_LEVEL", "INFO").upper(),
    format=(
        "%(asctime)s | %(levelname)s | %(name)s | "
        "%(message)s"
    ),
    datefmt="%Y-%m-%d %H:%M:%S",
)


app = FastAPI(
    title="Shipment Management API",
    description="A FastAPI application to manage shipments",
    version="1.0.0",
)
@app.exception_handler(ShipmentNotFoundError)
async def shipment_not_found_handler(
    request: Request,
    exc: ShipmentNotFoundError,
):
    return JSONResponse(
        status_code=404,
        content={"detail": str(exc)},
    )

@app.exception_handler(Exception)
async def unexpected_exception_handler(
    request: Request,
    exc: Exception,
):
    logging.getLogger("app").error(
        "Unhandled exception for %s %s",
        request.method,
        request.url.path,
        exc_info=(type(exc), exc, exc.__traceback__),
    )

    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error"},
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
    allow_origins=allowed_origins + ["https://localhost","http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(shipment_router)
app.include_router(analytics_router)

@app.get("/")
def home():
    return {"message": "Welcome to Shipment Management API"}


@app.get("/health")
def health():
    return {"status": "ok"}
