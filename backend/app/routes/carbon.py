"""
EcoTrace AI — Carbon Routes

POST /api/carbon — Calculate and store carbon emissions.
GET  /api/carbon — Retrieve carbon entries with pagination.
"""

import json
import logging
import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, Query
import aiosqlite

from app.constants import DEFAULT_ENTRIES_LIMIT, MAX_ENTRIES_LIMIT
from app.models.schemas import CarbonEntryInput, CarbonEntryResponse, CarbonBreakdown
from app.services.carbon_service import calculate_emissions
from app.db.database import get_db

logger = logging.getLogger("ecotrace.carbon")
router = APIRouter()


@router.post("/carbon", response_model=CarbonEntryResponse)
async def create_carbon_entry(
    entry: CarbonEntryInput,
    db: aiosqlite.Connection = Depends(get_db),
) -> CarbonEntryResponse:
    """
    Calculate emissions and store a new carbon entry.

    Computes CO₂ breakdown across transport, food, energy, shopping,
    and digital categories using IPCC AR6 emission factors.
    """
    breakdown = calculate_emissions(entry)
    total = sum(vars(breakdown).values())

    entry_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()

    await db.execute(
        """INSERT INTO carbon_entries
           (id, date, total_kg_co2, transport_kg, food_kg, energy_kg, shopping_kg, digital_kg, raw_data)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)""",
        (
            entry_id,
            now,
            round(total, 3),
            breakdown.transport_kg,
            breakdown.food_kg,
            breakdown.energy_kg,
            breakdown.shopping_kg,
            breakdown.digital_kg,
            json.dumps(entry.model_dump()),
        ),
    )
    await db.commit()

    logger.info("Created carbon entry %s: %.3f kg CO₂", entry_id, total)

    return CarbonEntryResponse(
        id=entry_id,
        date=now,
        total_kg_co2=round(total, 3),
        breakdown=breakdown,
    )


@router.get("/carbon")
async def get_carbon_entries(
    limit: int = Query(
        default=DEFAULT_ENTRIES_LIMIT,
        ge=1,
        le=MAX_ENTRIES_LIMIT,
        description="Maximum number of entries to return",
    ),
    offset: int = Query(
        default=0,
        ge=0,
        description="Number of entries to skip for pagination",
    ),
    db: aiosqlite.Connection = Depends(get_db),
) -> list[dict]:
    """
    Retrieve recent carbon entries with pagination.

    Returns entries ordered by date (newest first).
    Supports limit/offset pagination for efficient data loading.
    """
    cursor = await db.execute(
        "SELECT * FROM carbon_entries ORDER BY date DESC LIMIT ? OFFSET ?",
        (limit, offset),
    )
    rows = await cursor.fetchall()

    return [
        {
            "id": row["id"],
            "date": row["date"],
            "total_kg_co2": row["total_kg_co2"],
            "breakdown": {
                "transport_kg": row["transport_kg"],
                "food_kg": row["food_kg"],
                "energy_kg": row["energy_kg"],
                "shopping_kg": row["shopping_kg"],
                "digital_kg": row["digital_kg"],
            },
        }
        for row in rows
    ]
