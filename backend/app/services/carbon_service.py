"""
EcoTrace AI — Carbon Calculation Service

Server-side emission calculations using IPCC AR6 factors.
Mirrors the frontend logic for validation and consistency.
"""

from app.models.schemas import (
    CarbonEntryInput,
    CarbonBreakdown,
    TransportMode,
    FuelType,
    FoodCategory,
    ShoppingCategory,
)

# ─── Emission Factors ─────────────────────────────────────

TRANSPORT_FACTORS: dict[str, dict[str, float]] = {
    "car":                  {"petrol": 0.192, "diesel": 0.171, "electric": 0.053, "hybrid": 0.106, "cng": 0.153, "default": 0.192},
    "motorcycle":           {"petrol": 0.114, "default": 0.114},
    "bus":                  {"default": 0.089},
    "train":                {"default": 0.041},
    "flight_domestic":      {"default": 0.255},
    "flight_international": {"default": 0.195},
    "ev":                   {"default": 0.053},
    "bike":                 {"default": 0.0},
    "walk":                 {"default": 0.0},
}

FOOD_FACTORS: dict[str, float] = {
    "beef": 27.0, "lamb": 39.2, "pork": 12.1, "chicken": 6.9,
    "fish": 6.1, "dairy": 3.2, "eggs": 4.5, "vegetables": 2.0,
    "fruits": 1.1, "legumes": 0.9, "grains": 1.4, "processed": 3.8,
}

GRID_FACTORS: dict[str, float] = {
    "IN": 0.708, "US": 0.386, "GB": 0.233, "DE": 0.366,
    "FR": 0.052, "CN": 0.581, "AU": 0.790, "CA": 0.160,
    "BR": 0.074, "DEFAULT": 0.475,
}

SHOPPING_FACTORS: dict[str, float] = {
    "clothing": 20.0, "electronics": 50.0, "furniture": 80.0,
    "delivery": 2.5, "other": 5.0,
}


def calculate_emissions(entry: CarbonEntryInput) -> CarbonBreakdown:
    """
    Calculate CO₂ emissions across all categories.

    Args:
        entry: Validated carbon entry input

    Returns:
        Breakdown of emissions by category in kg CO₂
    """
    transport_kg = 0.0
    food_kg = 0.0
    energy_kg = 0.0
    shopping_kg = 0.0

    # Transport
    if entry.transport:
        t = entry.transport
        factors = TRANSPORT_FACTORS.get(t.mode.value, {"default": 0})
        factor_key = t.fuel_type.value if t.fuel_type else "default"
        base_factor = factors.get(factor_key, factors.get("default", 0))
        co2 = base_factor * t.distance_km
        if t.passenger_count and t.passenger_count > 1:
            co2 /= t.passenger_count
        transport_kg = round(co2, 3)

    # Food
    if entry.food:
        for item in entry.food.items:
            base = FOOD_FACTORS.get(item.category.value, 0)
            source_factor = 0.8 if item.source == "local" else 1.0
            food_kg += base * item.weight_kg * source_factor
        food_kg = round(food_kg, 3)

    # Energy
    if entry.energy:
        e = entry.energy
        grid_factor = GRID_FACTORS.get(e.country, GRID_FACTORS["DEFAULT"])
        effective = grid_factor * (1 - (e.renewable_percent or 0) / 100)
        elec_co2 = e.electricity_kwh * effective
        gas_co2 = (e.natural_gas_m3 or 0) * 2.204
        lpg_co2 = (e.lpg_kg or 0) * 2.983
        energy_kg = round(elec_co2 + gas_co2 + lpg_co2, 3)

    # Shopping
    if entry.shopping:
        for item in entry.shopping.items:
            if item.category == ShoppingCategory.OTHER and item.estimated_value_inr:
                shopping_kg += (item.estimated_value_inr / 1000) * 0.5 * item.quantity
            else:
                factor = SHOPPING_FACTORS.get(item.category.value, 5.0)
                shopping_kg += factor * item.quantity
        shopping_kg = round(shopping_kg, 3)

    return CarbonBreakdown(
        transport_kg=transport_kg,
        food_kg=food_kg,
        energy_kg=energy_kg,
        shopping_kg=shopping_kg,
        digital_kg=0.0,
    )
