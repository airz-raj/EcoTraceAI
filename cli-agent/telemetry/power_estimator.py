"""
EcoTrace AI — CLI Agent: Power Estimator

Uses py-cpuinfo for safe hardware detection (NO subprocess calls).
AUDIT FIX: Prevents command injection via subprocess.
"""

import json
from pathlib import Path

# Safe hardware info — NO subprocess.run or os.system
try:
    import cpuinfo
except ImportError:
    cpuinfo = None

TDP_DB_PATH = Path(__file__).parent.parent / "data" / "cpu_tdp_database.json"


class PowerEstimator:
    """Estimates device power consumption based on CPU TDP and system load."""

    def __init__(self):
        self.cpu_tdp = self._get_cpu_tdp()
        self.cpu_model = self._get_cpu_model()

    def _load_tdp_db(self) -> list:
        """Load CPU TDP database from JSON file."""
        try:
            return json.loads(TDP_DB_PATH.read_text())
        except (FileNotFoundError, json.JSONDecodeError):
            return []

    def _get_cpu_model(self) -> str:
        """Get CPU model using safe py-cpuinfo API."""
        if cpuinfo is None:
            return "Unknown CPU"
        try:
            info = cpuinfo.get_cpu_info()
            return info.get("brand_raw", "Unknown CPU")
        except Exception:
            return "Unknown CPU"

    def _get_cpu_tdp(self) -> float:
        """
        Look up CPU TDP using safe hardware polling.

        NO subprocess calls — uses py-cpuinfo native Python API.
        """
        if cpuinfo is None:
            return 45.0  # Safe laptop fallback

        try:
            info = cpuinfo.get_cpu_info()
            cpu_model = info.get("brand_raw", "Unknown CPU")

            tdp_db = self._load_tdp_db()
            for entry in tdp_db:
                if entry["model"].lower() in cpu_model.lower():
                    return float(entry["tdp_watts"])
        except Exception:
            pass

        return 45.0  # Safe laptop fallback

    def estimate(self, telemetry: dict) -> dict:
        """
        Estimate power consumption from system telemetry.

        Args:
            telemetry: Dict with avg_cpu_percent and ram_total_gb

        Returns:
            Power consumption estimates (watts, daily/monthly kWh)
        """
        cpu_percent = telemetry["avg_cpu_percent"] / 100

        # Idle power is ~15% of TDP
        idle_power = self.cpu_tdp * 0.15
        # Scale linearly from idle to full TDP
        cpu_power = idle_power + cpu_percent * (self.cpu_tdp - idle_power)

        # RAM: ~3W per 8GB
        ram_power = (telemetry["ram_total_gb"] / 8) * 3.0

        # System overhead: display, disk, peripherals
        system_overhead = 8.0

        total_watts = cpu_power + ram_power + system_overhead

        return {
            "cpu_model": self.cpu_model,
            "cpu_tdp_watts": self.cpu_tdp,
            "draw_watts": round(total_watts, 2),
            "daily_kwh": round(total_watts * 24 / 1000, 4),
            "monthly_kwh": round(total_watts * 24 * 30 / 1000, 3),
        }
