/**
 * EcoTrace AI — Energy Calculator Form
 *
 * Calculates emissions from electricity, gas, and LPG usage.
 */

import { useState } from 'react';
import type { EnergyData } from '../../types';
import { calculateEnergyCO2 } from '../../utils/carbonFormulas';
import { SUPPORTED_COUNTRIES, COUNTRY_NAMES, getGridRating } from '../../utils/gridFactors';
import { useCarbonContext } from '../../context/CarbonContext';

interface EnergyFormProps {
  onCalculate: (data: EnergyData, co2: number) => void;
}

const GRID_RATING_COLORS: Record<string, string> = {
  very_clean: 'text-emerald-300',
  clean: 'text-green-400',
  moderate: 'text-yellow-400',
  dirty: 'text-orange-400',
  very_dirty: 'text-red-400',
};

export function EnergyForm({ onCalculate }: EnergyFormProps) {
  const { state, setCountry } = useCarbonContext();
  const [electricityKwh, setElectricityKwh] = useState('');
  const [naturalGasM3, setNaturalGasM3] = useState('');
  const [lpgKg, setLpgKg] = useState('');
  const [renewablePercent, setRenewablePercent] = useState('0');
  const [result, setResult] = useState<number | null>(null);

  const gridRating = getGridRating(state.userCountry);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const kwh = parseFloat(electricityKwh);
    if (isNaN(kwh) || kwh < 0) return;

    const data: EnergyData = {
      electricityKwh: kwh,
      country: state.userCountry,
      naturalGasM3: parseFloat(naturalGasM3) || 0,
      lpgKg: parseFloat(lpgKg) || 0,
      renewablePercent: parseFloat(renewablePercent) || 0,
    };

    const co2 = calculateEnergyCO2(data);
    setResult(co2);
    onCalculate(data, co2);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5" aria-label="Energy emission calculator">
      {/* Country */}
      <div>
        <label htmlFor="energy-country" className="input-label">
          Country (for grid emission factor)
        </label>
        <select
          id="energy-country"
          className="input-field"
          value={state.userCountry}
          onChange={(e) => setCountry(e.target.value)}
        >
          {SUPPORTED_COUNTRIES.map((code) => (
            <option key={code} value={code}>
              {COUNTRY_NAMES[code] || code}
            </option>
          ))}
        </select>
        <p className={`text-xs mt-1 ${GRID_RATING_COLORS[gridRating]}`}>
          Grid rating: {gridRating.replace('_', ' ')}
        </p>
      </div>

      {/* Electricity */}
      <div>
        <label htmlFor="energy-kwh" className="input-label">
          Electricity Consumption (kWh)
        </label>
        <input
          id="energy-kwh"
          type="number"
          min="0"
          step="1"
          className="input-field"
          placeholder="e.g., 250"
          value={electricityKwh}
          onChange={(e) => setElectricityKwh(e.target.value)}
          required
          aria-required="true"
        />
      </div>

      {/* Renewable percentage */}
      <div>
        <label htmlFor="energy-renewable" className="input-label">
          Renewable Energy % (solar / green tariff)
        </label>
        <div className="flex items-center gap-3">
          <input
            id="energy-renewable"
            type="range"
            min="0"
            max="100"
            step="5"
            className="flex-1 accent-emerald-500"
            value={renewablePercent}
            onChange={(e) => setRenewablePercent(e.target.value)}
          />
          <span className="text-sm font-medium text-emerald-400 w-12 text-right">
            {renewablePercent}%
          </span>
        </div>
      </div>

      {/* Natural Gas */}
      <div>
        <label htmlFor="energy-gas" className="input-label">
          Natural Gas (m³) — optional
        </label>
        <input
          id="energy-gas"
          type="number"
          min="0"
          step="0.1"
          className="input-field"
          placeholder="0"
          value={naturalGasM3}
          onChange={(e) => setNaturalGasM3(e.target.value)}
        />
      </div>

      {/* LPG */}
      <div>
        <label htmlFor="energy-lpg" className="input-label">
          LPG (kg) — optional
        </label>
        <input
          id="energy-lpg"
          type="number"
          min="0"
          step="0.1"
          className="input-field"
          placeholder="0"
          value={lpgKg}
          onChange={(e) => setLpgKg(e.target.value)}
        />
      </div>

      <button type="submit" className="btn-primary w-full">
        Calculate Energy Emissions
      </button>

      {result !== null && (
        <div
          className="p-4 rounded-xl bg-sky-500/10 border border-sky-500/20 text-center animate-fade-in"
          role="status"
          aria-live="polite"
        >
          <p className="text-sm text-slate-400">Energy Emissions</p>
          <p className="text-2xl font-bold text-sky-400">{result.toFixed(1)} kg CO₂</p>
        </div>
      )}
    </form>
  );
}
