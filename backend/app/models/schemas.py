"""
EcoTrace AI — Pydantic v2 Schemas

Strict input validation with boundaries (ge=0) and length limits.
All API endpoints enforce these schemas.
"""

from enum import Enum
from typing import Literal, Optional

from pydantic import BaseModel, Field, field_validator


# ─── Enums ─────────────────────────────────────────────────

class TransportMode(str, Enum):
    """Supported transportation modes."""
    CAR = "car"
    BUS = "bus"
    TRAIN = "train"
    FLIGHT_DOMESTIC = "flight_domestic"
    FLIGHT_INTERNATIONAL = "flight_international"
    BIKE = "bike"
    WALK = "walk"
    MOTORCYCLE = "motorcycle"
    EV = "ev"


class FuelType(str, Enum):
    """Types of fuel for transport vehicles."""
    PETROL = "petrol"
    DIESEL = "diesel"
    ELECTRIC = "electric"
    HYBRID = "hybrid"
    CNG = "cng"


class FoodCategory(str, Enum):
    """Categorization of food items for carbon footprint."""
    BEEF = "beef"
    LAMB = "lamb"
    PORK = "pork"
    CHICKEN = "chicken"
    FISH = "fish"
    DAIRY = "dairy"
    EGGS = "eggs"
    VEGETABLES = "vegetables"
    FRUITS = "fruits"
    LEGUMES = "legumes"
    GRAINS = "grains"
    PROCESSED = "processed"


class ShoppingCategory(str, Enum):
    """Categories of shopping items."""
    CLOTHING = "clothing"
    ELECTRONICS = "electronics"
    FURNITURE = "furniture"
    DELIVERY = "delivery"
    OTHER = "other"


# ─── Request Schemas ───────────────────────────────────────

class TransportInput(BaseModel):
    """Strict transport data validation."""
    mode: TransportMode
    distance_km: float = Field(ge=0, le=50000, description="Distance in km")
    fuel_type: Optional[FuelType] = None
    passenger_count: Optional[int] = Field(default=1, ge=1, le=50)


class FoodItemInput(BaseModel):
    """Single food item with validation."""
    category: FoodCategory
    weight_kg: float = Field(ge=0, le=1000, description="Weight in kg")
    source: Optional[Literal["local", "imported"]] = "local"


class FoodInput(BaseModel):
    """Collection of food items."""
    items: list[FoodItemInput] = Field(min_length=1, max_length=50)


class EnergyInput(BaseModel):
    """Energy consumption data."""
    electricity_kwh: float = Field(ge=0, le=100000, description="kWh consumed")
    country: str = Field(min_length=2, max_length=3, default="IN")
    natural_gas_m3: Optional[float] = Field(default=0, ge=0, le=10000)
    lpg_kg: Optional[float] = Field(default=0, ge=0, le=10000)
    renewable_percent: Optional[float] = Field(default=0, ge=0, le=100)

    @field_validator("country")
    @classmethod
    def validate_country(cls, v: str) -> str:
        """Validate and normalize country code to uppercase."""
        return v.upper()


class ShoppingItemInput(BaseModel):
    """Single shopping item."""
    category: ShoppingCategory
    quantity: int = Field(ge=0, le=1000)
    estimated_value_inr: Optional[float] = Field(default=None, ge=0, le=10000000)


class ShoppingInput(BaseModel):
    """Collection of shopping items."""
    items: list[ShoppingItemInput] = Field(min_length=1, max_length=50)


class CarbonEntryInput(BaseModel):
    """Complete carbon footprint entry submission."""
    transport: Optional[TransportInput] = None
    food: Optional[FoodInput] = None
    energy: Optional[EnergyInput] = None
    shopping: Optional[ShoppingInput] = None


# ─── Response Schemas ──────────────────────────────────────

class CarbonBreakdown(BaseModel):
    """Component-level breakdown of carbon emissions."""
    transport_kg: float
    food_kg: float
    energy_kg: float
    shopping_kg: float
    digital_kg: float = 0.0


class CarbonEntryResponse(BaseModel):
    """Response returned after processing a carbon entry."""
    id: str
    date: str
    total_kg_co2: float
    breakdown: CarbonBreakdown


class DigitalFootprintInput(BaseModel):
    """CLI agent telemetry data."""
    cpu_model: str = Field(max_length=200)
    avg_cpu_percent: float = Field(ge=0, le=100)
    ram_total_gb: float = Field(ge=0, le=1024)
    draw_watts: float = Field(ge=0, le=5000)
    daily_kwh: float = Field(ge=0, le=120)
    monthly_kwh: float = Field(ge=0, le=3600)
    country: str = Field(min_length=2, max_length=3, default="IN")


class HealthResponse(BaseModel):
    """Standard health check response schema."""
    status: str
    service: str
