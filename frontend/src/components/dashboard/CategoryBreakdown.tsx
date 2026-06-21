/**
 * EcoTrace AI — Category Breakdown
 *
 * Pie/bar chart showing emission breakdown by category.
 */

import React, { useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { useCarbonContext } from '../../context/CarbonContext';

const COLORS = ['#10b981', '#0ea5e9', '#f97316', '#a855f7', '#ec4899'];
const LABELS: Record<string, string> = {
  transportKg: 'Transport',
  foodKg: 'Food',
  energyKg: 'Energy',
  shoppingKg: 'Shopping',
  digitalKg: 'Digital',
};

export const CategoryBreakdown = React.memo(function CategoryBreakdown() {
  const { state } = useCarbonContext();

  const breakdown = useMemo(() => {
    const totals = {
      transportKg: 0,
      foodKg: 0,
      energyKg: 0,
      shoppingKg: 0,
      digitalKg: 0,
    };

    state.entries.forEach((entry) => {
      totals.transportKg += entry.breakdown.transportKg;
      totals.foodKg += entry.breakdown.foodKg;
      totals.energyKg += entry.breakdown.energyKg;
      totals.shoppingKg += entry.breakdown.shoppingKg;
      totals.digitalKg += entry.breakdown.digitalKg;
    });

    return Object.entries(totals)
      .map(([key, value]) => ({
        name: LABELS[key] || key,
        value: Math.round(value * 10) / 10,
        key,
      }))
      .filter((d) => d.value > 0);
  }, [state.entries]);

  const totalKg = breakdown.reduce((sum, d) => sum + d.value, 0);

  if (breakdown.length === 0) {
    return (
      <div className="glass-card p-6 text-center">
        <p className="text-slate-500">No breakdown data available yet.</p>
      </div>
    );
  }

  return (
    <section className="glass-card p-6 animate-fade-in" aria-labelledby="breakdown-heading">
      <h2 id="breakdown-heading" className="text-lg font-semibold text-white mb-4">
        Category Breakdown
      </h2>

      <div className="flex flex-col md:flex-row items-center gap-6">
        {/* Pie Chart */}
        <div aria-hidden="true" className="w-48 h-48 flex-shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={breakdown}
                cx="50%"
                cy="50%"
                innerRadius={45}
                outerRadius={75}
                paddingAngle={3}
                dataKey="value"
              >
                {breakdown.map((_, idx) => (
                  <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  background: 'rgba(30,27,46,0.95)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '10px',
                  color: '#e2e8f0',
                }}
                formatter={(value: unknown) => [`${value} kg CO₂`, '']}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Legend & percentages */}
        <div className="flex-1 space-y-3 w-full">
          {breakdown.map((item, idx) => {
            const pct = totalKg > 0 ? ((item.value / totalKg) * 100).toFixed(1) : '0';
            return (
              <div key={item.key} className="flex items-center gap-3">
                <div
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                  aria-hidden="true"
                />
                <div className="flex-1">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm text-slate-300">{item.name}</span>
                    <span className="text-sm font-medium text-white">
                      {item.value} kg ({pct}%)
                    </span>
                  </div>
                  <div className="progress-bar">
                    <div
                      className="progress-fill"
                      style={{
                        width: `${pct}%`,
                        background: COLORS[idx % COLORS.length],
                      }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Screen reader accessible breakdown */}
      <table className="sr-only">
        <caption>Carbon emission breakdown by category</caption>
        <thead>
          <tr>
            <th scope="col">Category</th>
            <th scope="col">Emissions (kg CO₂)</th>
            <th scope="col">Percentage</th>
          </tr>
        </thead>
        <tbody>
          {breakdown.map((item) => (
            <tr key={item.key}>
              <td>{item.name}</td>
              <td>{item.value}</td>
              <td>{totalKg > 0 ? ((item.value / totalKg) * 100).toFixed(1) : '0'}%</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
});
