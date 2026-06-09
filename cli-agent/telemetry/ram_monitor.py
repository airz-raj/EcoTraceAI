"""
EcoTrace AI — CLI Agent: RAM Monitor
"""

import psutil


class RAMMonitor:
    """Monitor RAM usage."""

    def collect(self) -> dict:
        """
        Collect RAM utilization.

        Returns:
            Dict with ram_total_gb, ram_used_gb, ram_percent
        """
        mem = psutil.virtual_memory()

        return {
            "ram_total_gb": round(mem.total / (1024 ** 3), 2),
            "ram_used_gb": round(mem.used / (1024 ** 3), 2),
            "ram_percent": mem.percent,
            "ram_available_gb": round(mem.available / (1024 ** 3), 2),
        }
