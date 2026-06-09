"""
EcoTrace AI — Digital Footprint Routes

POST /api/digital-footprint — Receive CLI agent telemetry data.
"""

import uuid

from fastapi import APIRouter, Depends
import aiosqlite

from app.models.schemas import DigitalFootprintInput
from app.db.database import get_db

# Grid emission factors (same as frontend)
GRID_FACTORS = {
    "IN": 0.708, "US": 0.386, "GB": 0.233, "DE": 0.366,
    "FR": 0.052, "CN": 0.581, "AU": 0.790, "CA": 0.160,
    "BR": 0.074, "DEFAULT": 0.475,
}

router = APIRouter()


@router.post("/digital-footprint")
async def submit_digital_footprint(
    data: DigitalFootprintInput,
    db: aiosqlite.Connection = Depends(get_db),
):
    """
    Receive and store digital infrastructure telemetry from CLI agent.

    Calculates CO₂ from device power consumption using country grid factor.
    """
    grid_factor = GRID_FACTORS.get(data.country.upper(), GRID_FACTORS["DEFAULT"])
    co2_kg = round(data.monthly_kwh * grid_factor, 4)

    footprint_id = str(uuid.uuid4())

    await db.execute(
        """INSERT INTO device_footprints
           (id, cpu_model, avg_cpu_percent, ram_total_gb, draw_watts,
            daily_kwh, monthly_kwh, co2_kg, country)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)""",
        (
            footprint_id,
            data.cpu_model,
            data.avg_cpu_percent,
            data.ram_total_gb,
            data.draw_watts,
            data.daily_kwh,
            data.monthly_kwh,
            co2_kg,
            data.country.upper(),
        ),
    )
    await db.commit()

    return {
        "id": footprint_id,
        "co2_kg": co2_kg,
        "grid_factor": grid_factor,
        "draw_watts": data.draw_watts,
        "monthly_kwh": data.monthly_kwh,
    }
