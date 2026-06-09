/**
 * EcoTrace AI — Device Simulator Service
 *
 * Browser-based simulation of the CLI agent's telemetry collection.
 * Uses the Navigator API + performance.now() for real metrics where
 * available, and realistic statistical models for the rest.
 *
 * This lets users experience the Digital Tracker without installing
 * Python or the CLI agent.
 */

import type { DigitalFootprint } from '../types';
import { getGridFactor } from '../utils/gridFactors';

// ─── CPU TDP Database (mirrors cli-agent/data/cpu_tdp_database.json) ───

interface CpuEntry {
  model: string;
  tdpWatts: number;
}

const CPU_TDP_DB: CpuEntry[] = [
  { model: 'apple m1', tdpWatts: 20 },
  { model: 'apple m2', tdpWatts: 22 },
  { model: 'apple m3', tdpWatts: 25 },
  { model: 'apple m4', tdpWatts: 28 },
  { model: 'apple m1 pro', tdpWatts: 30 },
  { model: 'apple m2 pro', tdpWatts: 35 },
  { model: 'apple m1 max', tdpWatts: 60 },
  { model: 'intel core i3', tdpWatts: 35 },
  { model: 'intel core i5', tdpWatts: 45 },
  { model: 'intel core i7', tdpWatts: 65 },
  { model: 'intel core i9', tdpWatts: 95 },
  { model: 'amd ryzen 5', tdpWatts: 45 },
  { model: 'amd ryzen 7', tdpWatts: 65 },
  { model: 'amd ryzen 9', tdpWatts: 105 },
  { model: 'qualcomm snapdragon x elite', tdpWatts: 23 },
];

// ─── Realistic Preset Profiles ──────────────────────────────

interface DeviceProfile {
  label: string;
  cpuModel: string;
  tdpWatts: number;
  cores: number;
  ramGb: number;
  baseLoadPercent: number; // idle CPU %
  description: string;
}

export const DEVICE_PROFILES: DeviceProfile[] = [
  {
    label: 'MacBook Air M2',
    cpuModel: 'Apple M2',
    tdpWatts: 22,
    cores: 8,
    ramGb: 16,
    baseLoadPercent: 8,
    description: 'Ultra-efficient ARM laptop — great for low-carbon computing',
  },
  {
    label: 'MacBook Pro M1 Pro',
    cpuModel: 'Apple M1 Pro',
    tdpWatts: 30,
    cores: 10,
    ramGb: 32,
    baseLoadPercent: 12,
    description: 'High-performance ARM workstation laptop',
  },
  {
    label: 'Dell XPS 15 (i7)',
    cpuModel: 'Intel Core i7-13700H',
    tdpWatts: 65,
    cores: 14,
    ramGb: 16,
    baseLoadPercent: 15,
    description: 'Mid-range x86 laptop — moderate power draw',
  },
  {
    label: 'ThinkPad X1 Carbon (i5)',
    cpuModel: 'Intel Core i5-1340P',
    tdpWatts: 45,
    cores: 12,
    ramGb: 16,
    baseLoadPercent: 10,
    description: 'Business ultrabook — balanced efficiency',
  },
  {
    label: 'Gaming Desktop (Ryzen 9)',
    cpuModel: 'AMD Ryzen 9 7950X',
    tdpWatts: 170,
    cores: 16,
    ramGb: 64,
    baseLoadPercent: 5,
    description: '⚠️ High TDP desktop — significant carbon impact',
  },
  {
    label: 'Budget Chromebook',
    cpuModel: 'Intel Celeron N5100',
    tdpWatts: 10,
    cores: 4,
    ramGb: 4,
    baseLoadPercent: 20,
    description: 'Ultra-low-power device — minimal carbon footprint',
  },
  {
    label: 'Custom',
    cpuModel: 'Custom CPU',
    tdpWatts: 45,
    cores: 8,
    ramGb: 16,
    baseLoadPercent: 15,
    description: 'Configure your own device specs',
  },
];

// ─── Simulation State ───────────────────────────────────────

export interface SimulationConfig {
  profileIndex: number;
  cpuModel: string;
  tdpWatts: number;
  cores: number;
  ramGb: number;
  cpuLoadPercent: number;
  hoursPerDay: number;
  country: string;
}

export interface SimulationResult {
  footprint: DigitalFootprint;
  profile: DeviceProfile;
  /** Annualized CO₂ in kg */
  yearlyCo2Kg: number;
  /** Equivalent trees needed */
  treesNeeded: number;
  /** kWh cost estimate (₹/$ based on country) */
  monthlyCostEstimate: number;
  /** Carbon intensity rating */
  rating: 'very_low' | 'low' | 'moderate' | 'high' | 'very_high';
}

// ─── CPU Load Simulator ─────────────────────────────────────

/**
 * Simulate realistic CPU usage fluctuations using
 * a bounded random walk around the base load.
 */
export function simulateCpuTimeSeries(
  basePercent: number,
  samples: number = 60,
  volatility: number = 0.3,
): number[] {
  const series: number[] = [];
  let current = basePercent;

  for (let i = 0; i < samples; i++) {
    // Random walk with mean-reversion
    const noise = (Math.random() - 0.5) * 2 * volatility * basePercent;
    const meanReversion = (basePercent - current) * 0.1;
    current += noise + meanReversion;

    // Occasional spikes (simulates background tasks)
    if (Math.random() < 0.05) {
      current += basePercent * (0.5 + Math.random() * 1.5);
    }

    // Clamp to [1, 100]
    current = Math.max(1, Math.min(100, current));
    series.push(Math.round(current * 10) / 10);
  }

  return series;
}

// ─── Power Estimation ───────────────────────────────────────

/**
 * Estimate power draw from CPU load and TDP.
 * Mirrors cli-agent/telemetry/power_estimator.py logic.
 */
function estimatePower(config: SimulationConfig): {
  drawWatts: number;
  dailyKwh: number;
  monthlyKwh: number;
} {
  const cpuPercent = config.cpuLoadPercent / 100;

  // Idle power = 15% of TDP
  const idlePower = config.tdpWatts * 0.15;
  const cpuPower = idlePower + cpuPercent * (config.tdpWatts - idlePower);

  // RAM: ~3W per 8GB
  const ramPower = (config.ramGb / 8) * 3.0;

  // System overhead: display, disk, peripherals
  const systemOverhead = 8.0;

  const totalWatts = cpuPower + ramPower + systemOverhead;

  return {
    drawWatts: Math.round(totalWatts * 100) / 100,
    dailyKwh: Math.round((totalWatts * config.hoursPerDay) / 1000 * 10000) / 10000,
    monthlyKwh: Math.round((totalWatts * config.hoursPerDay * 30) / 1000 * 1000) / 1000,
  };
}

// ─── Country-specific electricity costs ─────────────────────

const ELECTRICITY_RATES: Record<string, { rate: number; currency: string }> = {
  IN: { rate: 7.5, currency: '₹' },   // ₹/kWh
  US: { rate: 0.16, currency: '$' },
  GB: { rate: 0.34, currency: '£' },
  DE: { rate: 0.40, currency: '€' },
  FR: { rate: 0.23, currency: '€' },
  CN: { rate: 0.08, currency: '¥' },
  AU: { rate: 0.30, currency: 'A$' },
  CA: { rate: 0.13, currency: 'C$' },
  BR: { rate: 0.15, currency: 'R$' },
  JP: { rate: 30, currency: '¥' },
};

// ─── Main Simulation Function ───────────────────────────────

/**
 * Run a complete device simulation.
 *
 * @param config - Device and usage configuration
 * @returns Full simulation result with CO₂, cost, and rating
 */
export function runSimulation(config: SimulationConfig): SimulationResult {
  const profile = DEVICE_PROFILES[config.profileIndex] ?? DEVICE_PROFILES[0];
  const power = estimatePower(config);
  const gridFactor = getGridFactor(config.country);

  const co2Kg = Math.round(power.monthlyKwh * gridFactor * 10000) / 10000;
  const yearlyCo2Kg = Math.round(co2Kg * 12 * 100) / 100;
  const treesNeeded = Math.ceil(yearlyCo2Kg / 21);

  // Electricity cost
  const costInfo = ELECTRICITY_RATES[config.country] ?? ELECTRICITY_RATES['IN'];
  const monthlyCost = Math.round(power.monthlyKwh * costInfo.rate * 100) / 100;

  // Carbon intensity rating
  let rating: SimulationResult['rating'];
  if (co2Kg < 0.5) rating = 'very_low';
  else if (co2Kg < 2) rating = 'low';
  else if (co2Kg < 5) rating = 'moderate';
  else if (co2Kg < 15) rating = 'high';
  else rating = 'very_high';

  const footprint: DigitalFootprint = {
    cpuModel: config.cpuModel,
    avgCpuPercent: config.cpuLoadPercent,
    ramTotalGb: config.ramGb,
    drawWatts: power.drawWatts,
    dailyKwh: power.dailyKwh,
    monthlyKwh: power.monthlyKwh,
    co2Kg,
  };

  return {
    footprint,
    profile,
    yearlyCo2Kg,
    treesNeeded,
    monthlyCostEstimate: monthlyCost,
    rating,
  };
}

/**
 * Try to detect real device specs from the browser.
 * Falls back to defaults where Navigator API is unavailable.
 */
export function detectDeviceSpecs(): Partial<SimulationConfig> {
  const specs: Partial<SimulationConfig> = {};

  // Detect logical CPU cores
  if (navigator.hardwareConcurrency) {
    specs.cores = navigator.hardwareConcurrency;
  }

  // Detect RAM (Chrome only, requires secure context)
  // @ts-expect-error — Navigator.deviceMemory is non-standard
  if (navigator.deviceMemory) {
    // @ts-expect-error — Navigator.deviceMemory is non-standard
    specs.ramGb = navigator.deviceMemory;
  }

  // Try to match CPU from user agent
  const ua = navigator.userAgent.toLowerCase();
  for (const entry of CPU_TDP_DB) {
    if (ua.includes(entry.model.split(' ').slice(0, 2).join(' '))) {
      specs.cpuModel = entry.model;
      specs.tdpWatts = entry.tdpWatts;
      break;
    }
  }

  return specs;
}

/**
 * Get the electricity cost currency for a country.
 */
export function getCostCurrency(country: string): string {
  return ELECTRICITY_RATES[country]?.currency ?? '₹';
}
