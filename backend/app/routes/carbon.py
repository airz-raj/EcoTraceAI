"""
EcoTrace AI — Carbon Routes

POST /api/carbon — Calculate and store carbon emissions.
GET /api/carbon — Retrieve carbon entries.
"""

import json
import uuid
from datetime import datetime

from fastapi import APIRouter, Depends
import aiosqlite

from app.models.schemas import CarbonEntryInput, CarbonEntryResponse, CarbonBreakdown
from app.services.carbon_service import calculate_emissions
from app.db.database import get_db

router = APIRouter()


@router.post("/carbon", response_model=CarbonEntryResponse)
async def create_carbon_entry(
    entry: CarbonEntryInput,
    db: aiosqlite.Connection = Depends(get_db),
):
    """Calculate emissions and store a new carbon entry."""
    breakdown = calculate_emissions(entry)
    total = sum(vars(breakdown).values())

    entry_id = str(uuid.uuid4())
    now = datetime.utcnow().isoformat()

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

    return CarbonEntryResponse(
        id=entry_id,
        date=now,
        total_kg_co2=round(total, 3),
        breakdown=breakdown,
    )


@router.get("/carbon")
async def get_carbon_entries(
    limit: int = 50,
    db: aiosqlite.Connection = Depends(get_db),
):
    """Retrieve recent carbon entries."""
    cursor = await db.execute(
        "SELECT * FROM carbon_entries ORDER BY date DESC LIMIT ?",
        (min(limit, 200),),
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
