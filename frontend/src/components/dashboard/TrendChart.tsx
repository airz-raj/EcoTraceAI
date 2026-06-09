/**
 * EcoTrace AI — Trend Chart
 *
 * Recharts line chart showing emission trends over time.
 * Paired with a sr-only data table for screen reader accessibility.
 */

import { useMemo } from 'react';
import {
  Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Area, AreaChart,
} from 'recharts';
import { useCarbonContext } from '../../context/CarbonContext';
import { DataTable } from '../common/DataTable';

export function TrendChart() {
  const { state } = useCarbonContext();

  const chartData = useMemo(() => {
    return state.entries
      .slice()
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .map((entry) => ({
        date: new Date(entry.date).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
        }),
        total: Math.round(entry.totalKgCO2 * 10) / 10,
        transport: Math.round(entry.breakdown.transportKg * 10) / 10,
        food: Math.round(entry.breakdown.foodKg * 10) / 10,
        energy: Math.round(entry.breakdown.energyKg * 10) / 10,
      }));
  }, [state.entries]);

  if (chartData.length === 0) {
    return (
      <div className="glass-card p-6 text-center">
        <p className="text-slate-500">No data to display yet. Start tracking to see trends!</p>
      </div>
    );
  }

  return (
    <section className="glass-card p-6 animate-fade-in" aria-labelledby="trend-heading">
      <h2 id="trend-heading" className="text-lg font-semibold text-white mb-4">
        Emission Trends
      </h2>

      {/* Visual chart (hidden from screen readers) */}
      <div aria-hidden="true" className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
            <defs>
              <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis
              dataKey="date"
              tick={{ fill: '#94a3b8', fontSize: 12 }}
              axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
            />
            <YAxis
              tick={{ fill: '#94a3b8', fontSize: 12 }}
              axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
              label={{
                value: 'kg CO₂',
                angle: -90,
                position: 'insideLeft',
                fill: '#94a3b8',
                fontSize: 11,
              }}
            />
            <Tooltip
              contentStyle={{
                background: 'rgba(30,27,46,0.95)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '10px',
                color: '#e2e8f0',
              }}
              formatter={(value: unknown) => [`${value} kg CO₂`, '']}
            />
            <Area
              type="monotone"
              dataKey="total"
              stroke="#10b981"
              strokeWidth={2}
              fill="url(#colorTotal)"
              name="Total"
            />
            <Line
              type="monotone"
              dataKey="transport"
              stroke="#0ea5e9"
              strokeWidth={1.5}
              dot={false}
              name="Transport"
            />
            <Line
              type="monotone"
              dataKey="food"
              stroke="#f97316"
              strokeWidth={1.5}
              dot={false}
              name="Food"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Screen-reader accessible data table */}
      <DataTable
        srOnly
        caption="Carbon emission trends over time"
        columns={[
          { key: 'date', label: 'Date' },
          { key: 'total', label: 'Total (kg CO₂)' },
          { key: 'transport', label: 'Transport (kg CO₂)' },
          { key: 'food', label: 'Food (kg CO₂)' },
          { key: 'energy', label: 'Energy (kg CO₂)' },
        ]}
        data={chartData}
      />
    </section>
  );
}
