"""
EcoTrace AI — CLI Agent: CPU Monitor

Collects CPU utilization metrics via psutil.
"""

import psutil
import time


class CPUMonitor:
    """Monitor CPU usage over a sampling period."""

    def __init__(self, sample_duration_seconds: int = 10, interval: float = 1.0):
        self.sample_duration = sample_duration_seconds
        self.interval = interval

    def collect(self) -> dict:
        """
        Collect CPU utilization samples.

        Returns:
            Dict with avg_cpu_percent, max_cpu_percent, core_count
        """
        samples = []
        end_time = time.time() + self.sample_duration

        while time.time() < end_time:
            usage = psutil.cpu_percent(interval=self.interval)
            samples.append(usage)

        return {
            "avg_cpu_percent": round(sum(samples) / len(samples), 2) if samples else 0,
            "max_cpu_percent": round(max(samples), 2) if samples else 0,
            "sample_count": len(samples),
            "core_count": psutil.cpu_count(logical=True),
            "core_count_physical": psutil.cpu_count(logical=False),
        }
