/**
 * EcoTrace AI — Carbon Summary Card
 *
 * Displays total carbon emissions with animated counter
 * and equivalence comparisons.
 */

import React, { useMemo } from 'react';
import { useCarbonContext } from '../../context/CarbonContext';
import { getCO2Equivalences } from '../../utils/carbonFormulas';

export const CarbonSummaryCard = React.memo(function CarbonSummaryCard() {
  const { state } = useCarbonContext();

  const stats = useMemo(() => {
    const totalCO2 = state.entries.reduce((sum, e) => sum + e.totalKgCO2, 0);
    const equivalences = getCO2Equivalences(totalCO2);
    const avgDaily = state.entries.length > 0 ? totalCO2 / state.entries.length : 0;

    return { totalCO2, equivalences, avgDaily, entryCount: state.entries.length };
  }, [state.entries]);

  return (
    <section
      className="glass-card p-6 animate-fade-in"
      aria-labelledby="summary-heading"
    >
      <h2 id="summary-heading" className="text-lg font-semibold text-white mb-4">
        Your Carbon Footprint
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {/* Total CO2 */}
        <div className="text-center sm:text-left">
          <p className="stat-label" id="total-label">Total Emissions</p>
          <p
            className="stat-value gradient-text"
            aria-labelledby="total-label"
          >
            {stats.totalCO2.toFixed(1)}
          </p>
          <p className="text-sm text-slate-400">kg CO₂</p>
        </div>

        {/* Daily Average */}
        <div className="text-center sm:text-left">
          <p className="stat-label" id="avg-label">Daily Average</p>
          <p
            className="stat-value text-sky-400"
            aria-labelledby="avg-label"
          >
            {stats.avgDaily.toFixed(1)}
          </p>
          <p className="text-sm text-slate-400">kg CO₂ / entry</p>
        </div>

        {/* Entries */}
        <div className="text-center sm:text-left">
          <p className="stat-label" id="entries-label">Entries Tracked</p>
          <p
            className="stat-value text-purple-400"
            aria-labelledby="entries-label"
          >
            {stats.entryCount}
          </p>
          <p className="text-sm text-slate-400">total entries</p>
        </div>
      </div>

      {/* Equivalences */}
      {stats.totalCO2 > 0 && (
        <div className="mt-6 pt-4 border-t border-white/5">
          <p className="text-xs text-slate-500 mb-3 uppercase tracking-wider">
            That's equivalent to...
          </p>
          <div className="flex flex-wrap gap-4">
            <span className="badge badge-eco">
              🌳 {stats.equivalences.treesNeededYear} trees needed for 1 year
            </span>
            <span className="badge badge-warn">
              🚗 {stats.equivalences.kmByPetrolCar.toLocaleString()} km by petrol car
            </span>
            <span className="badge badge-info">
              📱 {stats.equivalences.smartphoneCharges.toLocaleString()} phone charges
            </span>
          </div>
        </div>
      )}

      {stats.entryCount === 0 && (
        <p className="mt-4 text-sm text-slate-500 text-center py-4">
          No entries yet. Head to the{' '}
          <a href="/calculator" className="text-emerald-400 hover:underline">
            Calculator
          </a>{' '}
          to log your first carbon footprint!
        </p>
      )}
    </section>
  );
});
