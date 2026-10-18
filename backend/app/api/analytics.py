
from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.database import get_db
from fastapi import Query
router = APIRouter(
    prefix="/analytics",
    tags=["Analytics"],
)

DatabaseSession = Annotated[Session, Depends(get_db)]


@router.get("/overview")
def get_analytics_overview(db: DatabaseSession):
    """Return summary metrics for the shipment dashboard."""

    query = text("""
        SELECT
            COUNT(*) AS total_shipments,
            COALESCE(SUM(cost), 0) AS total_cost,
            COALESCE(AVG(cost), 0) AS average_cost,
            COALESCE(AVG(weight), 0) AS average_weight,
            COALESCE(SUM(distance), 0) AS total_distance
        FROM shipments
    """)

    row = db.execute(query).mappings().one()

    return {
        "total_shipments": row["total_shipments"],
        "total_cost": float(row["total_cost"]),
        "average_cost": float(row["average_cost"]),
        "average_weight": float(row["average_weight"]),
        "total_distance": float(row["total_distance"]),
    }


@router.get("/status-breakdown")
def get_status_breakdown(db: DatabaseSession):
    """Return shipment counts grouped by their actual status values."""

    query = text("""
        SELECT
            status,
            COUNT(*) AS shipment_count
        FROM shipments
        GROUP BY status
        ORDER BY shipment_count DESC, status ASC
    """)

    rows = db.execute(query).mappings().all()

    return [
        {
            "status": row["status"],
            "count": row["shipment_count"],
        }
        for row in rows
    ]


@router.get("/destinations")
def get_destination_breakdown(db: DatabaseSession):
    """Return shipment counts grouped by destination."""

    query = text("""
        SELECT
            destination,
            COUNT(*) AS shipment_count,
            COALESCE(SUM(cost), 0) AS total_cost
        FROM shipments
        GROUP BY destination
        ORDER BY shipment_count DESC, destination ASC
    """)

    rows = db.execute(query).mappings().all()

    return [
        {
            "destination": row["destination"],
            "shipment_count": row["shipment_count"],
            "total_cost": float(row["total_cost"]),
        }
        for row in rows
    ]


@router.get("/costs")
def get_cost_breakdown(db: DatabaseSession):
    """Return the ten highest-cost shipments."""

    query = text("""
        SELECT
            id,
            destination,
            status,
            cost,
            weight,
            distance
        FROM shipments
        ORDER BY cost DESC, id ASC
        LIMIT 10
    """)

    rows = db.execute(query).mappings().all()

    return [
        {
            "id": row["id"],
            "destination": row["destination"],
            "status": row["status"],
            "cost": float(row["cost"]),
            "weight": float(row["weight"]),
            "distance": float(row["distance"]),
        }
        for row in rows
    ]

@router.get("/status-history")
def get_status_history(
    db: DatabaseSession,
    limit: int = 100,
):
    """Return recent shipment status transitions."""

    limit = max(1, min(limit, 500))

    query = text("""
        SELECT
            h.id,
            h.shipment_id,
            h.old_status,
            h.new_status,
            h.changed_at,
            h.notes
        FROM shipment_status_history AS h
        ORDER BY h.changed_at DESC, h.id DESC
        LIMIT :limit
    """)

    rows = db.execute(query, {"limit": limit}).mappings().all()

    return [
        {
            "id": row["id"],
            "shipment_id": row["shipment_id"],
            "old_status": row["old_status"],
            "new_status": row["new_status"],
            "changed_at": row["changed_at"].isoformat(),
            "notes": row["notes"],
        }
        for row in rows
    ]

@router.get("/shipments-over-time")
def get_shipments_over_time(
    db: DatabaseSession,
    days: int = Query(default=30, ge=7, le=365),
):
    query = text("""
        WITH calendar AS (
            SELECT generate_series(
                CURRENT_DATE - (:days - 1),
                CURRENT_DATE,
                INTERVAL '1 day'
            )::date AS day
        ),
        daily AS (
            SELECT
                created_at::date AS day,
                COUNT(*) AS shipment_count
            FROM shipments
            WHERE created_at >= CURRENT_DATE - (:days - 1)
              AND created_at < CURRENT_DATE + INTERVAL '1 day'
            GROUP BY created_at::date
        )
        SELECT
            calendar.day,
            COALESCE(daily.shipment_count, 0) AS shipment_count
        FROM calendar
        LEFT JOIN daily ON daily.day = calendar.day
        ORDER BY calendar.day
    """)

    rows = db.execute(query, {"days": days}).mappings().all()

    return [
        {
            "date": row["day"].isoformat(),
            "shipment_count": row["shipment_count"],
        }
        for row in rows
    ]
