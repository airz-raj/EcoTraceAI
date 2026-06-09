/**
 * EcoTrace AI — Device Footprint Card
 *
 * Displays digital infrastructure carbon data from CLI agent.
 */

import type { DigitalFootprint } from '../../types';

interface DeviceFootprintCardProps {
  data?: DigitalFootprint | null;
}

export function DeviceFootprintCard({ data }: DeviceFootprintCardProps) {
  if (!data) {
    return (
      <div className="glass-card p-6 text-center">
        <div className="text-4xl mb-3" role="img" aria-hidden="true">💻</div>
        <h3 className="text-white font-semibold mb-2">Digital Footprint</h3>
        <p className="text-sm text-slate-500 mb-4">
          Run the CLI agent to track your device's carbon emissions.
        </p>
        <div className="p-3 rounded-lg bg-white/3 text-left">
          <p className="text-xs text-slate-400 mb-1">Quick Start:</p>
          <code className="text-xs text-emerald-400 font-mono">
            cd cli-agent && python ecotrace_agent.py --country IN
          </code>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card p-6 animate-fade-in" role="region" aria-label="Device carbon footprint">
      <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
        💻 Device Footprint
      </h3>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <p className="stat-label">CPU Model</p>
          <p className="text-sm text-white font-medium">{data.cpuModel}</p>
        </div>
        <div>
          <p className="stat-label">CPU Usage</p>
          <p className="text-lg font-bold text-sky-400">{data.avgCpuPercent.toFixed(1)}%</p>
        </div>
        <div>
          <p className="stat-label">Power Draw</p>
          <p className="text-lg font-bold text-orange-400">{data.drawWatts.toFixed(1)}W</p>
        </div>
        <div>
          <p className="stat-label">Monthly CO₂</p>
          <p className="text-lg font-bold text-emerald-400">{data.co2Kg.toFixed(2)} kg</p>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-slate-400">Daily Energy</span>
          <span className="text-white">{data.dailyKwh.toFixed(4)} kWh</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-slate-400">Monthly Energy</span>
          <span className="text-white">{data.monthlyKwh.toFixed(3)} kWh</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-slate-400">RAM</span>
          <span className="text-white">{data.ramTotalGb.toFixed(1)} GB</span>
        </div>
      </div>
    </div>
  );
}
