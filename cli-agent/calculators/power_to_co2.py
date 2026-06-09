"""
EcoTrace AI — Power to CO2 Calculator

Converts device power consumption to CO₂ emissions
using country-specific grid emission factors.
"""

GRID_FACTORS = {
    "IN": 0.708, "US": 0.386, "GB": 0.233, "DE": 0.366,
    "FR": 0.052, "CN": 0.581, "AU": 0.790, "CA": 0.160,
    "BR": 0.074, "JP": 0.457, "DEFAULT": 0.475,
}


def power_to_co2(monthly_kwh: float, country: str = "IN") -> dict:
    """
    Convert monthly kWh to CO₂ emissions.

    Args:
        monthly_kwh: Monthly energy consumption in kWh
        country: ISO country code for grid factor

    Returns:
        CO₂ emissions in kg with grid factor used
    """
    grid_factor = GRID_FACTORS.get(country.upper(), GRID_FACTORS["DEFAULT"])
    co2_kg = monthly_kwh * grid_factor

    return {
        "monthly_co2_kg": round(co2_kg, 4),
        "yearly_co2_kg": round(co2_kg * 12, 2),
        "grid_factor_used": grid_factor,
        "country": country.upper(),
    }
