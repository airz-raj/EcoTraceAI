/**
 * EcoTrace AI — Transport Calculator Form
 *
 * Accessible form for transport emission calculations.
 */

import { useState } from 'react';
import type { TransportMode, FuelType, TransportData } from '../../types';
import { calculateTransportCO2 } from '../../utils/carbonFormulas';

const TRANSPORT_MODES: { value: TransportMode; label: string; icon: string }[] = [
  { value: 'car', label: 'Car', icon: '🚗' },
  { value: 'motorcycle', label: 'Motorcycle', icon: '🏍️' },
  { value: 'bus', label: 'Bus', icon: '🚌' },
  { value: 'train', label: 'Train', icon: '🚆' },
  { value: 'flight_domestic', label: 'Domestic Flight', icon: '✈️' },
  { value: 'flight_international', label: 'International Flight', icon: '🌏' },
  { value: 'ev', label: 'Electric Vehicle', icon: '⚡' },
  { value: 'bike', label: 'Bicycle', icon: '🚲' },
  { value: 'walk', label: 'Walking', icon: '🚶' },
];

const FUEL_TYPES: { value: FuelType; label: string }[] = [
  { value: 'petrol', label: 'Petrol' },
  { value: 'diesel', label: 'Diesel' },
  { value: 'electric', label: 'Electric' },
  { value: 'hybrid', label: 'Hybrid' },
  { value: 'cng', label: 'CNG' },
];

interface TransportFormProps {
  onCalculate: (data: TransportData, co2: number) => void;
}

export function TransportForm({ onCalculate }: TransportFormProps) {
  const [mode, setMode] = useState<TransportMode>('car');
  const [distanceKm, setDistanceKm] = useState('');
  const [fuelType, setFuelType] = useState<FuelType>('petrol');
  const [passengerCount, setPassengerCount] = useState('1');
  const [result, setResult] = useState<number | null>(null);

  const showFuelType = ['car', 'motorcycle'].includes(mode);
  const showPassengers = ['car', 'bus'].includes(mode);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const distance = parseFloat(distanceKm);
    if (isNaN(distance) || distance <= 0) return;

    const data: TransportData = {
      mode,
      distanceKm: distance,
      ...(showFuelType && { fuelType }),
      ...(showPassengers && { passengerCount: parseInt(passengerCount) || 1 }),
    };

    const co2 = calculateTransportCO2(data);
    setResult(co2);
    onCalculate(data, co2);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5" aria-label="Transport emission calculator">
      {/* Transport Mode */}
      <fieldset>
        <legend className="input-label">Transport Mode</legend>
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 mt-1">
          {TRANSPORT_MODES.map((tm) => (
            <button
              key={tm.value}
              type="button"
              onClick={() => setMode(tm.value)}
              className={`p-2 rounded-lg text-center text-xs transition-all ${
                mode === tm.value
                  ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-300'
                  : 'bg-white/5 border border-white/10 text-slate-400 hover:bg-white/10'
              }`}
              aria-pressed={mode === tm.value}
              aria-label={tm.label}
            >
              <span className="text-lg block mb-0.5" role="img" aria-hidden="true">{tm.icon}</span>
              {tm.label}
            </button>
          ))}
        </div>
      </fieldset>

      {/* Distance */}
      <div>
        <label htmlFor="transport-distance" className="input-label">
          Distance (km)
        </label>
        <input
          id="transport-distance"
          type="number"
          min="0"
          step="0.1"
          className="input-field"
          placeholder="e.g., 25"
          value={distanceKm}
          onChange={(e) => setDistanceKm(e.target.value)}
          required
          aria-required="true"
        />
      </div>

      {/* Fuel Type (conditional) */}
      {showFuelType && (
        <div>
          <label htmlFor="transport-fuel" className="input-label">
            Fuel Type
          </label>
          <select
            id="transport-fuel"
            className="input-field"
            value={fuelType}
            onChange={(e) => setFuelType(e.target.value as FuelType)}
          >
            {FUEL_TYPES.map((ft) => (
              <option key={ft.value} value={ft.value}>
                {ft.label}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Passenger Count (conditional) */}
      {showPassengers && (
        <div>
          <label htmlFor="transport-passengers" className="input-label">
            Number of Passengers (for carpooling discount)
          </label>
          <input
            id="transport-passengers"
            type="number"
            min="1"
            max="20"
            className="input-field"
            value={passengerCount}
            onChange={(e) => setPassengerCount(e.target.value)}
          />
        </div>
      )}

      {/* Submit */}
      <button type="submit" className="btn-primary w-full">
        Calculate Transport Emissions
      </button>

      {/* Result */}
      {result !== null && (
        <div
          className="mt-4 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-center animate-fade-in"
          role="status"
          aria-live="polite"
        >
          <p className="text-sm text-slate-400">Transport Emissions</p>
          <p className="text-2xl font-bold text-emerald-400">{result.toFixed(1)} kg CO₂</p>
        </div>
      )}
    </form>
  );
}
