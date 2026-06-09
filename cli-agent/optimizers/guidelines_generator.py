"""
EcoTrace AI — Safe Guidelines Generator

AUDIT FIX: Generates text optimization guidelines.
NO executable scripts. NO sudo commands. NO subprocess calls.
Replaces the original unsafe linux_optimizer.sh approach.
"""


class GuidelinesOptimizer:
    """Generate safe, non-executable optimization guidelines."""

    def generate(self, report: dict) -> str:
        """
        Generate human-readable optimization guidelines.

        SECURITY: Returns plain text only. No scripts.
        No sudo. No automated commands.

        Args:
            report: Full telemetry report dict

        Returns:
            Formatted text guidelines string
        """
        telemetry = report.get("telemetry", {})
        power = report.get("power", {})
        device = report.get("device", {})

        monthly_kwh = power.get("monthly_kwh", 0)
        potential_saving_kwh = monthly_kwh * 0.2

        lines = [
            "",
            "💡 ECOTRACE HARDWARE OPTIMIZATION GUIDELINES",
            "=" * 50,
            f"Device: {device.get('cpu_model', 'Unknown')}",
            f"Estimated Monthly Energy: {monthly_kwh:.3f} kWh",
            f"Estimated Monthly Savings: ~{potential_saving_kwh:.3f} kWh (20%)",
            "",
            "1. CPU Power Governor:",
            f"   Your system is running with idle power around "
            f"{power.get('draw_watts', 0) * 0.15:.1f}W.",
            "   Consider switching your power governor to 'powersave' mode.",
            "   (Reference: check your OS power management settings)",
            "",
            "2. Background Load:",
            f"   Average CPU load is {telemetry.get('avg_cpu_percent', 0):.1f}%.",
        ]

        if telemetry.get("avg_cpu_percent", 0) > 30:
            lines.append(
                "   ⚠️  High idle load detected. Check for unnecessary background"
            )
            lines.append("   processes consuming CPU resources.")
        else:
            lines.append("   ✅ Background load is within normal range.")

        lines.extend([
            "",
            "3. Display & Disk:",
            "   Set your display sleep to 5 minutes to significantly",
            "   reduce idle power draw.",
            "   Consider SSD over HDD for lower power consumption.",
            "",
            "4. Scheduling:",
            "   Schedule heavy workloads (builds, training) during",
            "   off-peak grid hours for lower carbon intensity.",
            "",
            "=" * 50,
            "🔒 These are guidelines only. No commands are auto-executed.",
            "",
        ])

        return "\n".join(lines)
