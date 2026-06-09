#!/usr/bin/env python3
"""
EcoTrace AI — CLI Agent Entry Point

Standalone Python tool for tracking digital infrastructure carbon footprint.

Usage:
    python ecotrace_agent.py --country IN
    python ecotrace_agent.py --country US --duration 30 --json

Security:
    - Uses psutil and py-cpuinfo only (NO subprocess)
    - Outputs safe text guidelines (NO executable scripts)
    - No sudo or admin privileges required
"""

import argparse
import json
import sys

from telemetry.cpu_monitor import CPUMonitor
from telemetry.ram_monitor import RAMMonitor
from telemetry.power_estimator import PowerEstimator
from calculators.power_to_co2 import power_to_co2
from optimizers.guidelines_generator import GuidelinesOptimizer


def main():
    parser = argparse.ArgumentParser(
        description="EcoTrace AI — Digital Infrastructure Carbon Tracker",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
    python ecotrace_agent.py --country IN
    python ecotrace_agent.py --country US --duration 30
    python ecotrace_agent.py --json > report.json
        """,
    )
    parser.add_argument(
        "--country",
        type=str,
        default="IN",
        help="ISO country code for grid factor (default: IN)",
    )
    parser.add_argument(
        "--duration",
        type=int,
        default=10,
        help="CPU sampling duration in seconds (default: 10)",
    )
    parser.add_argument(
        "--json",
        action="store_true",
        help="Output raw JSON report (for piping to dashboard)",
    )

    args = parser.parse_args()

    # 1. Collect telemetry
    print("🔍 Collecting system telemetry...", file=sys.stderr)
    cpu_monitor = CPUMonitor(sample_duration_seconds=args.duration)
    ram_monitor = RAMMonitor()

    cpu_data = cpu_monitor.collect()
    ram_data = ram_monitor.collect()

    telemetry = {**cpu_data, **ram_data}

    # 2. Estimate power
    print("⚡ Estimating power consumption...", file=sys.stderr)
    estimator = PowerEstimator()
    power = estimator.estimate(telemetry)

    # 3. Calculate CO₂
    co2 = power_to_co2(power["monthly_kwh"], args.country)

    # 4. Build report
    report = {
        "telemetry": telemetry,
        "power": power,
        "co2": co2,
        "device": {
            "cpu_model": power["cpu_model"],
            "cpu_tdp_watts": power["cpu_tdp_watts"],
        },
    }

    # 5. Output
    if args.json:
        print(json.dumps(report, indent=2))
    else:
        print(f"\n🌍 EcoTrace AI — Digital Footprint Report")
        print("=" * 50)
        print(f"CPU Model:    {power['cpu_model']}")
        print(f"CPU TDP:      {power['cpu_tdp_watts']}W")
        print(f"Avg CPU Load: {telemetry['avg_cpu_percent']}%")
        print(f"RAM:          {telemetry['ram_total_gb']} GB")
        print(f"Power Draw:   {power['draw_watts']}W")
        print(f"Daily Energy: {power['daily_kwh']} kWh")
        print(f"Monthly Energy: {power['monthly_kwh']} kWh")
        print(f"Monthly CO₂:  {co2['monthly_co2_kg']} kg")
        print(f"Yearly CO₂:   {co2['yearly_co2_kg']} kg")
        print(f"Grid Factor:  {co2['grid_factor_used']} ({co2['country']})")

        # 6. Optimization guidelines
        optimizer = GuidelinesOptimizer()
        guidelines = optimizer.generate(report)
        print(guidelines)


if __name__ == "__main__":
    main()
