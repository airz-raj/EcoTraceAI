/**
 * EcoTrace AI — Interactive Device Simulator
 *
 * Web-based simulation of the CLI agent's telemetry.
 * Lets users pick a device profile, adjust CPU load,
 * and see real-time power draw + CO₂ calculations.
 *
 * Features:
 * - 6 preset device profiles + custom mode
 * - Animated CPU usage chart (live time-series)
 * - Real-time power/CO₂ calculation
 * - Country-specific grid factor & electricity cost
 * - Carbon rating with equivalences
 */

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from 'recharts';
import {
  DEVICE_PROFILES,
  runSimulation,
  simulateCpuTimeSeries,
  detectDeviceSpecs,
  getCostCurrency,
  type SimulationConfig,
  type SimulationResult,
} from '../../services/deviceSimulator';
import { SUPPORTED_COUNTRIES, COUNTRY_NAMES } from '../../utils/gridFactors';
import { useCarbonContext } from '../../context/CarbonContext';

// ─── Rating Colors ──────────────────────────────────────────

const RATING_CONFIG: Record<string, { color: string; bg: string; label: string; icon: string }> = {
  very_low:  { color: 'text-emerald-300', bg: 'bg-emerald-500/15', label: 'Very Low', icon: '🌿' },
  low:       { color: 'text-green-400',   bg: 'bg-green-500/15',   label: 'Low',      icon: '🍃' },
  moderate:  { color: 'text-yellow-400',  bg: 'bg-yellow-500/15',  label: 'Moderate',  icon: '⚡' },
  high:      { color: 'text-orange-400',  bg: 'bg-orange-500/15',  label: 'High',      icon: '🔥' },
  very_high: { color: 'text-red-400',     bg: 'bg-red-500/15',     label: 'Very High', icon: '🚨' },
};

export function DeviceSimulator() {
  const { state } = useCarbonContext();

  // ─── Configuration State ────────────────────────────────
  const [config, setConfig] = useState<SimulationConfig>(() => {
    const detected = detectDeviceSpecs();
    return {
      profileIndex: 0,
      cpuModel: DEVICE_PROFILES[0].cpuModel,
      tdpWatts: DEVICE_PROFILES[0].tdpWatts,
      cores: detected.cores || DEVICE_PROFILES[0].cores,
      ramGb: DEVICE_PROFILES[0].ramGb,
      cpuLoadPercent: DEVICE_PROFILES[0].baseLoadPercent,
      hoursPerDay: 8,
      country: state.userCountry,
    };
  });

  const [result, setResult] = useState<SimulationResult | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [cpuSeries, setCpuSeries] = useState<{ time: number; cpu: number }[]>([]);
  const [progress, setProgress] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const isCustom = config.profileIndex === DEVICE_PROFILES.length - 1;

  // ─── Profile Selection ──────────────────────────────────
  const selectProfile = useCallback((index: number) => {
    const profile = DEVICE_PROFILES[index];
    setConfig((prev) => ({
      ...prev,
      profileIndex: index,
      cpuModel: profile.cpuModel,
      tdpWatts: profile.tdpWatts,
      cores: profile.cores,
      ramGb: profile.ramGb,
      cpuLoadPercent: profile.baseLoadPercent,
    }));
    setResult(null);
    setCpuSeries([]);
  }, []);



  // ─── Run Simulation ─────────────────────────────────────
  const runSim = useCallback(() => {
    setIsRunning(true);
    setProgress(0);
    setCpuSeries([]);

    // Generate CPU time series (simulates 60s of monitoring)
    const series = simulateCpuTimeSeries(config.cpuLoadPercent, 60, 0.3);
    const avgCpu = series.reduce((a, b) => a + b, 0) / series.length;

    let tick = 0;
    intervalRef.current = setInterval(() => {
      tick++;
      const pct = Math.min(100, Math.round((tick / 60) * 100));
      setProgress(pct);

      // Stream CPU data points
      setCpuSeries((prev) => [
        ...prev,
        { time: tick, cpu: series[tick - 1] ?? avgCpu },
      ]);

      if (tick >= 60) {
        clearInterval(intervalRef.current!);

        // Run the full calculation
        const simResult = runSimulation({
          ...config,
          cpuLoadPercent: Math.round(avgCpu * 10) / 10,
        });
        setResult(simResult);
        setIsRunning(false);
      }
    }, 50); // 50ms intervals = 3s total (60 * 50ms)
  }, [config]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const currency = useMemo(() => getCostCurrency(config.country), [config.country]);

  return (
    <section className="space-y-6" aria-labelledby="simulator-heading">
      <div className="glass-card p-6">
        <h2 id="simulator-heading" className="text-lg font-semibold text-white mb-1">
          🖥️ Device Simulator
        </h2>
        <p className="text-sm text-slate-400 mb-5">
          Simulate your device's carbon footprint — no CLI installation required
        </p>

        {/* ─── Device Profile Cards ─────────────────────── */}
        <fieldset className="mb-6">
          <legend className="input-label mb-3">Select Device Profile</legend>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
            {DEVICE_PROFILES.map((profile, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => selectProfile(idx)}
                aria-pressed={config.profileIndex === idx}
                className={`p-3 rounded-xl text-left transition-all text-sm ${
                  config.profileIndex === idx
                    ? 'bg-emerald-500/15 border border-emerald-500/40 shadow-md shadow-emerald-900/20'
                    : 'bg-white/3 border border-white/8 hover:bg-white/6 hover:border-white/15'
                }`}
              >
                <p className={`font-medium ${
                  config.profileIndex === idx ? 'text-emerald-300' : 'text-slate-300'
                }`}>
                  {profile.label}
                </p>
                <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">
                  {profile.description}
                </p>
                <div className="flex gap-2 mt-2 text-xs text-slate-500">
                  <span>{profile.tdpWatts}W TDP</span>
                  <span>·</span>
                  <span>{profile.ramGb}GB</span>
                </div>
              </button>
            ))}
          </div>
        </fieldset>

        {/* ─── Configuration Sliders ────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
          {/* CPU Load */}
          <div>
            <label htmlFor="sim-cpu-load" className="input-label">
              Average CPU Load
            </label>
            <div className="flex items-center gap-3">
              <input
                id="sim-cpu-load"
                type="range"
                min="1"
                max="100"
                step="1"
                className="flex-1 accent-emerald-500"
                value={config.cpuLoadPercent}
                onChange={(e) =>
                  setConfig((prev) => ({
                    ...prev,
                    cpuLoadPercent: parseInt(e.target.value),
                  }))
                }
              />
              <span className="text-sm font-medium text-emerald-400 w-12 text-right">
                {config.cpuLoadPercent}%
              </span>
            </div>
            <p className="text-xs text-slate-600 mt-1">
              {config.cpuLoadPercent < 15
                ? 'Idle / browsing'
                : config.cpuLoadPercent < 40
                ? 'Light work / coding'
                : config.cpuLoadPercent < 70
                ? 'Build / compile workload'
                : 'Heavy compute / gaming'}
            </p>
          </div>

          {/* Hours per day */}
          <div>
            <label htmlFor="sim-hours" className="input-label">
              Daily Usage Hours
            </label>
            <div className="flex items-center gap-3">
              <input
                id="sim-hours"
                type="range"
                min="1"
                max="24"
                step="1"
                className="flex-1 accent-sky-500"
                value={config.hoursPerDay}
                onChange={(e) =>
                  setConfig((prev) => ({
                    ...prev,
                    hoursPerDay: parseInt(e.target.value),
                  }))
                }
              />
              <span className="text-sm font-medium text-sky-400 w-12 text-right">
                {config.hoursPerDay}h
              </span>
            </div>
          </div>

          {/* Country */}
          <div>
            <label htmlFor="sim-country" className="input-label">
              Country (grid emission factor)
            </label>
            <select
              id="sim-country"
              className="input-field text-sm"
              value={config.country}
              onChange={(e) =>
                setConfig((prev) => ({ ...prev, country: e.target.value }))
              }
            >
              {SUPPORTED_COUNTRIES.map((code) => (
                <option key={code} value={code}>
                  {COUNTRY_NAMES[code] || code}
                </option>
              ))}
            </select>
          </div>

          {/* Custom TDP (only in custom mode) */}
          {isCustom && (
            <div>
              <label htmlFor="sim-tdp" className="input-label">
                CPU TDP (Watts)
              </label>
              <input
                id="sim-tdp"
                type="number"
                min="5"
                max="300"
                className="input-field text-sm"
                value={config.tdpWatts}
                onChange={(e) =>
                  setConfig((prev) => ({
                    ...prev,
                    tdpWatts: parseInt(e.target.value) || 45,
                  }))
                }
              />
            </div>
          )}

          {/* Custom RAM (only in custom mode) */}
          {isCustom && (
            <div>
              <label htmlFor="sim-ram" className="input-label">
                RAM (GB)
              </label>
              <input
                id="sim-ram"
                type="number"
                min="2"
                max="256"
                className="input-field text-sm"
                value={config.ramGb}
                onChange={(e) =>
                  setConfig((prev) => ({
                    ...prev,
                    ramGb: parseInt(e.target.value) || 16,
                  }))
                }
              />
            </div>
          )}
        </div>

        {/* ─── Run Button ───────────────────────────────── */}
        <button
          onClick={runSim}
          disabled={isRunning}
          className="btn-primary w-full text-lg py-3"
          aria-busy={isRunning}
        >
          {isRunning ? (
            <span className="flex items-center justify-center gap-2">
              <span className="animate-spin">⏳</span>
              Simulating... {progress}%
            </span>
          ) : (
            '🔬 Run Simulation'
          )}
        </button>

        {/* ─── Progress Bar ─────────────────────────────── */}
        {isRunning && (
          <div
            className="mt-3"
            role="progressbar"
            aria-valuenow={progress}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Simulation progress"
          >
            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* ─── Live CPU Chart ──────────────────────────────── */}
      {cpuSeries.length > 0 && (
        <div className="glass-card p-6 animate-fade-in">
          <h3 className="text-white font-semibold mb-3">
            📈 Simulated CPU Utilization
          </h3>
          <div className="h-48" aria-hidden="true">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={cpuSeries} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
                <defs>
                  <linearGradient id="cpuGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis
                  dataKey="time"
                  tick={{ fill: '#64748b', fontSize: 10 }}
                  axisLine={{ stroke: 'rgba(255,255,255,0.08)' }}
                  label={{
                    value: 'Time (s)',
                    position: 'insideBottomRight',
                    fill: '#64748b',
                    fontSize: 10,
                    offset: -5,
                  }}
                />
                <YAxis
                  domain={[0, 100]}
                  tick={{ fill: '#64748b', fontSize: 10 }}
                  axisLine={{ stroke: 'rgba(255,255,255,0.08)' }}
                  label={{
                    value: 'CPU %',
                    angle: -90,
                    position: 'insideLeft',
                    fill: '#64748b',
                    fontSize: 10,
                  }}
                />
                <Tooltip
                  contentStyle={{
                    background: 'rgba(30,27,46,0.95)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '10px',
                    color: '#e2e8f0',
                    fontSize: '12px',
                  }}
                  formatter={(value: unknown) => [`${value}%`, 'CPU']}
                />
                <Area
                  type="monotone"
                  dataKey="cpu"
                  stroke="#10b981"
                  strokeWidth={2}
                  fill="url(#cpuGrad)"
                  isAnimationActive={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <p className="text-xs text-slate-500 mt-2">
            Simulated 60-second CPU monitoring with random walk + mean-reversion model
          </p>
        </div>
      )}

      {/* ─── Results Panel ───────────────────────────────── */}
      {result && (
        <div className="space-y-4 animate-slide-up" role="region" aria-label="Simulation results">
          {/* Carbon Rating Banner */}
          <div className={`glass-card p-6 ${RATING_CONFIG[result.rating].bg}`}>
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">
                  Carbon Intensity Rating
                </p>
                <p className={`text-2xl font-bold ${RATING_CONFIG[result.rating].color}`}>
                  {RATING_CONFIG[result.rating].icon} {RATING_CONFIG[result.rating].label}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-slate-400">Monthly CO₂</p>
                <p className="text-3xl font-bold gradient-text">
                  {result.footprint.co2Kg.toFixed(2)} kg
                </p>
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="glass-card p-4 text-center">
              <p className="stat-label">Power Draw</p>
              <p className="text-lg font-bold text-orange-400">
                {result.footprint.drawWatts}W
              </p>
            </div>
            <div className="glass-card p-4 text-center">
              <p className="stat-label">Daily Energy</p>
              <p className="text-lg font-bold text-sky-400">
                {result.footprint.dailyKwh} kWh
              </p>
            </div>
            <div className="glass-card p-4 text-center">
              <p className="stat-label">Monthly Energy</p>
              <p className="text-lg font-bold text-purple-400">
                {result.footprint.monthlyKwh} kWh
              </p>
            </div>
            <div className="glass-card p-4 text-center">
              <p className="stat-label">Yearly CO₂</p>
              <p className="text-lg font-bold text-emerald-400">
                {result.yearlyCo2Kg} kg
              </p>
            </div>
          </div>

          {/* Equivalences & Cost */}
          <div className="glass-card p-6">
            <h3 className="text-white font-semibold mb-4">Impact & Equivalences</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-white/3">
                <span className="text-2xl">🌳</span>
                <div>
                  <p className="text-sm text-white font-medium">
                    {result.treesNeeded} tree{result.treesNeeded !== 1 ? 's' : ''}
                  </p>
                  <p className="text-xs text-slate-500">needed to offset yearly emissions</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-white/3">
                <span className="text-2xl">💰</span>
                <div>
                  <p className="text-sm text-white font-medium">
                    {currency}{result.monthlyCostEstimate}/month
                  </p>
                  <p className="text-xs text-slate-500">estimated electricity cost</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-white/3">
                <span className="text-2xl">📱</span>
                <div>
                  <p className="text-sm text-white font-medium">
                    {Math.round(result.footprint.monthlyKwh / 0.008).toLocaleString()} charges
                  </p>
                  <p className="text-xs text-slate-500">smartphone equivalents</p>
                </div>
              </div>
            </div>
          </div>

          {/* Reduction Tips */}
          <div className="glass-card p-6">
            <h3 className="text-white font-semibold mb-3">
              💡 Optimization Tips
            </h3>
            <div className="space-y-2">
              {result.footprint.drawWatts > 40 && (
                <div className="flex items-start gap-2 p-3 rounded-lg bg-orange-500/5 border border-orange-500/10">
                  <span className="text-orange-400 mt-0.5">⚡</span>
                  <div>
                    <p className="text-sm text-white">
                      Consider switching to a lower-TDP processor
                    </p>
                    <p className="text-xs text-slate-500">
                      ARM-based chips (Apple M-series) use 50-75% less power than x86
                    </p>
                  </div>
                </div>
              )}
              {config.hoursPerDay > 12 && (
                <div className="flex items-start gap-2 p-3 rounded-lg bg-sky-500/5 border border-sky-500/10">
                  <span className="text-sky-400 mt-0.5">⏰</span>
                  <div>
                    <p className="text-sm text-white">
                      Enable aggressive sleep/hibernate settings
                    </p>
                    <p className="text-xs text-slate-500">
                      Reducing daily usage by 2 hours saves ~{Math.round(result.footprint.drawWatts * 2 * 30 / 1000 * 100) / 100} kWh/month
                    </p>
                  </div>
                </div>
              )}
              {config.cpuLoadPercent > 30 && (
                <div className="flex items-start gap-2 p-3 rounded-lg bg-purple-500/5 border border-purple-500/10">
                  <span className="text-purple-400 mt-0.5">🔧</span>
                  <div>
                    <p className="text-sm text-white">
                      High idle CPU load detected
                    </p>
                    <p className="text-xs text-slate-500">
                      Check for unnecessary background processes consuming CPU resources
                    </p>
                  </div>
                </div>
              )}
              <div className="flex items-start gap-2 p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/10">
                <span className="text-emerald-400 mt-0.5">🌍</span>
                <div>
                  <p className="text-sm text-white">
                    Schedule heavy workloads during off-peak hours
                  </p>
                  <p className="text-xs text-slate-500">
                    Grid carbon intensity varies by time of day — build at night for lower emissions
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
