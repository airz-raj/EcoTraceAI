"""
EcoTrace AI — Application Constants

Centralized configuration constants used across the application.
Eliminates magic numbers and prevents duplication between modules.

Sources:
    - Grid factors: IEA Emission Factors 2023, India CEA 2022
    - Emission factors: IPCC AR6 (2021), UK BEIS (2023)
"""

from typing import Final

# ─── Grid Emission Factors (kg CO₂ per kWh) ──────────────────
# Country ISO 3166-1 alpha-2 → emission factor
GRID_FACTORS: Final[dict[str, float]] = {
    "IN": 0.708,  # India — Central Electricity Authority 2022
    "US": 0.386,  # USA — EPA eGRID 2023
    "GB": 0.233,  # UK — BEIS 2023
    "DE": 0.366,  # Germany — UBA 2023
    "FR": 0.052,  # France — RTE 2023 (nuclear-heavy grid)
    "CN": 0.581,  # China — IEA 2023
    "AU": 0.790,  # Australia — DISER 2023
    "CA": 0.160,  # Canada — ECCC 2023
    "BR": 0.074,  # Brazil — SIN 2023 (hydro-heavy grid)
    "DEFAULT": 0.475,  # Global weighted average — IEA 2023
}

# ─── API Limits ───────────────────────────────────────────────
MAX_ENTRIES_LIMIT: Final[int] = 200
DEFAULT_ENTRIES_LIMIT: Final[int] = 50
MAX_CHAT_MESSAGE_LENGTH: Final[int] = 2000
MAX_CHAT_HISTORY_LENGTH: Final[int] = 20
MAX_FILE_SIZE_BYTES: Final[int] = 10 * 1024 * 1024  # 10 MB

# ─── Database ─────────────────────────────────────────────────
DB_POOL_SIZE: Final[int] = 5
DB_WAL_MODE: Final[str] = "wal"
