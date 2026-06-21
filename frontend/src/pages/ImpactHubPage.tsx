/**
 * EcoTrace AI — Climate Action Hub
 *
 * The "soul" of the app — makes carbon data feel personal and urgent.
 *
 * Features:
 * 1. Personal Carbon Budget vs Paris Agreement 2.3t/year target
 * 2. "What If" Scenario Planner — toggle lifestyle swaps
 * 3. Collective Impact Amplifier — scale your changes to a community
 * 4. 90-Day Reduction Challenge — weekly actionable goals
 * 5. India Climate Reality — real data that hits home
 */

import { useState, useMemo, useCallback } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell,
  RadialBarChart, RadialBar,
} from 'recharts';
import { useCarbonContext } from '../context/CarbonContext';
import {
  PARIS_BUDGET_TONNES,
  INDIA_AVG_TONNES,
  GLOBAL_AVG_TONNES,
  US_AVG_TONNES,
  SCENARIOS,
  CHALLENGE_WEEKS,
  INDIA_CLIMATE_DATA
} from '../data/impactHubData';

// ─── Component ──────────────────────────────────────────────

export function ImpactHubPage() {
  const { state } = useCarbonContext();
  const [selectedScenarios, setSelectedScenarios] = useState<Set<string>>(new Set());
  const [communitySize, setCommunitySize] = useState(1000);
  const [challengeWeek, setChallengeWeek] = useState(0);
  const [completedTasks, setCompletedTasks] = useState<Set<string>>(new Set());

  // ─── Calculate user's annualized footprint ──────────────
  const userMonthlyKg = useMemo(() => {
    if (state.entries.length === 0) return 166; // India avg monthly
    const totalKg = state.entries.reduce((sum, e) => sum + e.totalKgCO2, 0);
    const daysCovered = Math.max(1,
      (new Date(state.entries[state.entries.length - 1].date).getTime() -
       new Date(state.entries[0].date).getTime()) / 86400000
    );
    return (totalKg / daysCovered) * 30;
  }, [state.entries]);

  const userYearlyTonnes = (userMonthlyKg * 12) / 1000;

  // ─── Scenario calculations ─────────────────────────────
  const totalSavingKgMonth = useMemo(() => {
    return SCENARIOS
      .filter((s) => selectedScenarios.has(s.id))
      .reduce((sum, s) => sum + s.savingKgPerMonth, 0);
  }, [selectedScenarios]);

  const projectedMonthlyKg = Math.max(0, userMonthlyKg - totalSavingKgMonth);
  const projectedYearlyTonnes = (projectedMonthlyKg * 12) / 1000;
  const reductionPercent = userMonthlyKg > 0
    ? Math.round((totalSavingKgMonth / userMonthlyKg) * 100)
    : 0;

  // ─── Collective impact ─────────────────────────────────
  const collectiveSavingTonnesYear = (totalSavingKgMonth * 12 * communitySize) / 1000;
  const collectiveTreesEquivalent = Math.round(collectiveSavingTonnesYear * 1000 / 21);
  const collectiveCarKmAvoided = Math.round(collectiveSavingTonnesYear * 1000 / 0.192);

  // ─── Budget gauge data ─────────────────────────────────
  const budgetPercent = Math.min(200, Math.round((userYearlyTonnes / PARIS_BUDGET_TONNES) * 100));
  const gaugeData = [{ value: budgetPercent, fill: budgetPercent > 100 ? '#ef4444' : '#10b981' }];

  // ─── Comparison bar data ───────────────────────────────
  const comparisonData = [
    { name: 'Paris Target', tonnes: PARIS_BUDGET_TONNES, fill: '#10b981' },
    { name: 'You', tonnes: userYearlyTonnes, fill: userYearlyTonnes > PARIS_BUDGET_TONNES ? '#ef4444' : '#22c55e' },
    { name: 'India Avg', tonnes: INDIA_AVG_TONNES, fill: '#f59e0b' },
    { name: 'World Avg', tonnes: GLOBAL_AVG_TONNES, fill: '#f97316' },
    { name: 'US Avg', tonnes: US_AVG_TONNES, fill: '#dc2626' },
  ];

  if (selectedScenarios.size > 0) {
    comparisonData.splice(2, 0, {
      name: 'You (After)',
      tonnes: projectedYearlyTonnes,
      fill: '#06b6d4',
    });
  }

  const toggleScenario = useCallback((id: string) => {
    setSelectedScenarios((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleTask = useCallback((taskId: string) => {
    setCompletedTasks((prev) => {
      const next = new Set(prev);
      if (next.has(taskId)) next.delete(taskId);
      else next.add(taskId);
      return next;
    });
  }, []);

  const challengeTotalSaved = CHALLENGE_WEEKS
    .slice(0, challengeWeek + 1)
    .reduce((sum, w) => sum + w.savingKg, 0);

  return (
    <div className="space-y-8">
      {/* ─── Header ──────────────────────────────────────── */}
      <header className="animate-fade-in">
        <h1 className="text-3xl font-bold text-white mb-1">
          <span className="gradient-text">Climate Action Hub</span>
        </h1>
        <p className="text-slate-400">
          Your carbon data is just the beginning — here's how to actually make a difference
        </p>
      </header>

      {/* ═══════════════════════════════════════════════════
          1. CARBON BUDGET vs PARIS AGREEMENT
          ═══════════════════════════════════════════════════ */}
      <section className="glass-card p-6" aria-labelledby="budget-heading">
        <h2 id="budget-heading" className="text-lg font-semibold text-white mb-1">
          🌡️ Your Carbon Budget
        </h2>
        <p className="text-sm text-slate-400 mb-5">
          The Paris Agreement says each person should emit &lt;{PARIS_BUDGET_TONNES}t CO₂/year to limit warming to 1.5°C
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Gauge */}
          <div className="flex flex-col items-center">
            <div className="h-48 w-48" aria-hidden="true">
              <ResponsiveContainer>
                <RadialBarChart
                  cx="50%" cy="50%"
                  innerRadius="70%" outerRadius="100%"
                  startAngle={180} endAngle={0}
                  data={gaugeData}
                >
                  <RadialBar
                    dataKey="value"
                    cornerRadius={10}
                    background={{ fill: 'rgba(255,255,255,0.05)' }}
                  />
                </RadialBarChart>
              </ResponsiveContainer>
            </div>
            <div className="text-center -mt-8">
              <p className={`text-3xl font-bold ${budgetPercent > 100 ? 'text-red-400' : 'text-emerald-400'}`}>
                {userYearlyTonnes.toFixed(1)}t
              </p>
              <p className="text-xs text-slate-500">
                {budgetPercent > 100
                  ? `${budgetPercent - 100}% over budget`
                  : `${100 - budgetPercent}% of budget remaining`
                }
              </p>
            </div>
          </div>

          {/* Comparison bars */}
          <div className="h-56" aria-hidden="true">
            <ResponsiveContainer>
              <BarChart data={comparisonData} layout="vertical" margin={{ left: 70, right: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis type="number" tick={{ fill: '#64748b', fontSize: 11 }} unit="t" />
                <YAxis dataKey="name" type="category" tick={{ fill: '#94a3b8', fontSize: 11 }} width={70} />
                <Tooltip
                  contentStyle={{
                    background: 'rgba(30,27,46,0.95)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '10px',
                    color: '#e2e8f0',
                    fontSize: '12px',
                  }}
                  formatter={(value: unknown) => [`${value}t CO₂/year`, '']}
                />
                <Bar dataKey="tonnes" radius={[0, 6, 6, 0]}>
                  {comparisonData.map((entry, i) => (
                    <Cell key={i} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Context message */}
        <div className={`mt-4 p-4 rounded-xl border ${
          userYearlyTonnes <= PARIS_BUDGET_TONNES
            ? 'bg-emerald-500/5 border-emerald-500/15'
            : 'bg-red-500/5 border-red-500/15'
        }`}>
          <p className={`text-sm font-medium ${
            userYearlyTonnes <= PARIS_BUDGET_TONNES ? 'text-emerald-400' : 'text-red-400'
          }`}>
            {userYearlyTonnes <= PARIS_BUDGET_TONNES
              ? `✅ You're within the Paris Agreement budget! Your lifestyle is compatible with a 1.5°C future.`
              : `⚠️ You're ${(userYearlyTonnes - PARIS_BUDGET_TONNES).toFixed(1)}t over budget. Use the "What If" planner below to find realistic reductions.`
            }
          </p>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════
          2. WHAT-IF SCENARIO PLANNER
          ═══════════════════════════════════════════════════ */}
      <section className="glass-card p-6" aria-labelledby="whatif-heading">
        <h2 id="whatif-heading" className="text-lg font-semibold text-white mb-1">
          🔮 "What If" Scenario Planner
        </h2>
        <p className="text-sm text-slate-400 mb-5">
          Toggle lifestyle changes and see your projected footprint. No commitment — just explore.
        </p>

        {/* Scenario Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
          {SCENARIOS.map((scenario) => {
            const isActive = selectedScenarios.has(scenario.id);
            return (
              <button
                key={scenario.id}
                type="button"
                onClick={() => toggleScenario(scenario.id)}
                aria-pressed={isActive}
                className={`p-4 rounded-xl text-left transition-all border ${
                  isActive
                    ? 'bg-emerald-500/10 border-emerald-500/30 shadow-md shadow-emerald-900/10'
                    : 'bg-white/2 border-white/5 hover:bg-white/5 hover:border-white/10'
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <span className="text-xl">{scenario.icon}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    scenario.difficulty === 'easy'
                      ? 'bg-green-500/15 text-green-400'
                      : scenario.difficulty === 'medium'
                      ? 'bg-yellow-500/15 text-yellow-400'
                      : 'bg-red-500/15 text-red-400'
                  }`}>
                    {scenario.difficulty}
                  </span>
                </div>
                <p className={`text-sm font-medium mb-1 ${isActive ? 'text-emerald-300' : 'text-slate-300'}`}>
                  {scenario.title}
                </p>
                <p className="text-xs text-slate-500 mb-2">{scenario.description}</p>
                <p className={`text-xs font-semibold ${isActive ? 'text-emerald-400' : 'text-slate-600'}`}>
                  −{scenario.savingKgPerMonth} kg CO₂/month
                </p>
              </button>
            );
          })}
        </div>

        {/* Projection result */}
        {selectedScenarios.size > 0 && (
          <div className="p-5 rounded-xl bg-gradient-to-r from-emerald-500/5 via-cyan-500/5 to-purple-500/5 border border-emerald-500/15 animate-fade-in">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <p className="stat-label">Monthly Savings</p>
                <p className="text-xl font-bold text-emerald-400">−{totalSavingKgMonth} kg</p>
              </div>
              <div>
                <p className="stat-label">Yearly Savings</p>
                <p className="text-xl font-bold text-cyan-400">−{(totalSavingKgMonth * 12 / 1000).toFixed(1)}t</p>
              </div>
              <div>
                <p className="stat-label">Reduction</p>
                <p className="text-xl font-bold text-purple-400">{reductionPercent}%</p>
              </div>
              <div>
                <p className="stat-label">Projected Yearly</p>
                <p className={`text-xl font-bold ${
                  projectedYearlyTonnes <= PARIS_BUDGET_TONNES ? 'text-emerald-400' : 'text-orange-400'
                }`}>
                  {projectedYearlyTonnes.toFixed(1)}t
                </p>
              </div>
            </div>

            {projectedYearlyTonnes <= PARIS_BUDGET_TONNES && userYearlyTonnes > PARIS_BUDGET_TONNES && (
              <p className="text-center text-sm text-emerald-400 mt-4 font-medium">
                🎉 These changes would bring you within the Paris Agreement budget!
              </p>
            )}
          </div>
        )}
      </section>

      {/* ═══════════════════════════════════════════════════
          3. COLLECTIVE IMPACT AMPLIFIER
          ═══════════════════════════════════════════════════ */}
      {selectedScenarios.size > 0 && (
        <section className="glass-card p-6 animate-slide-up" aria-labelledby="collective-heading">
          <h2 id="collective-heading" className="text-lg font-semibold text-white mb-1">
            🌍 Collective Impact — You're Not Alone
          </h2>
          <p className="text-sm text-slate-400 mb-4">
            Individual actions feel small, but collective action changes everything.
          </p>

          {/* Community size selector */}
          <div className="flex flex-wrap items-center gap-2 mb-5">
            <span className="text-sm text-slate-400">If</span>
            {[100, 1000, 10000, 100000, 1000000].map((size) => (
              <button
                key={size}
                onClick={() => setCommunitySize(size)}
                className={`px-3 py-1.5 rounded-lg text-sm transition-all ${
                  communitySize === size
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : 'bg-white/5 text-slate-400 border border-white/5 hover:bg-white/8'
                }`}
              >
                {size >= 1000000
                  ? `${size / 1000000}M`
                  : size >= 1000
                  ? `${size / 1000}K`
                  : size} people
              </button>
            ))}
            <span className="text-sm text-slate-400">made these changes:</span>
          </div>

          {/* Impact cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-5 rounded-xl bg-emerald-500/5 border border-emerald-500/10 text-center">
              <p className="text-3xl mb-1">🌳</p>
              <p className="text-2xl font-bold text-emerald-400">
                {collectiveTreesEquivalent.toLocaleString()}
              </p>
              <p className="text-xs text-slate-400 mt-1">
                trees' worth of CO₂ saved per year
              </p>
            </div>
            <div className="p-5 rounded-xl bg-sky-500/5 border border-sky-500/10 text-center">
              <p className="text-3xl mb-1">🚗</p>
              <p className="text-2xl font-bold text-sky-400">
                {(collectiveCarKmAvoided / 1000000).toFixed(1)}M km
              </p>
              <p className="text-xs text-slate-400 mt-1">
                of car driving emissions avoided
              </p>
            </div>
            <div className="p-5 rounded-xl bg-purple-500/5 border border-purple-500/10 text-center">
              <p className="text-3xl mb-1">⚡</p>
              <p className="text-2xl font-bold text-purple-400">
                {collectiveSavingTonnesYear.toLocaleString()}t
              </p>
              <p className="text-xs text-slate-400 mt-1">
                CO₂ reduced collectively per year
              </p>
            </div>
          </div>

          <p className="text-center text-xs text-slate-500 mt-4">
            That's equivalent to taking{' '}
            <strong className="text-slate-300">
              {Math.round(collectiveSavingTonnesYear / 4.6).toLocaleString()} cars
            </strong>{' '}
            off the road for a year.
          </p>
        </section>
      )}

      {/* ═══════════════════════════════════════════════════
          4. 90-DAY REDUCTION CHALLENGE
          ═══════════════════════════════════════════════════ */}
      <section className="glass-card p-6" aria-labelledby="challenge-heading">
        <h2 id="challenge-heading" className="text-lg font-semibold text-white mb-1">
          🏆 90-Day Carbon Reduction Challenge
        </h2>
        <p className="text-sm text-slate-400 mb-5">
          8 weeks of actionable steps — from awareness to lasting change. Start anytime.
        </p>

        {/* Week selector */}
        <div className="flex gap-1 overflow-x-auto pb-2 mb-5">
          {CHALLENGE_WEEKS.map((week, idx) => (
            <button
              key={idx}
              onClick={() => setChallengeWeek(idx)}
              className={`px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                challengeWeek === idx
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : 'bg-white/3 text-slate-500 border border-white/5 hover:bg-white/6'
              }`}
            >
              Wk {week.week}
            </button>
          ))}
        </div>

        {/* Current week */}
        <div className="p-5 rounded-xl bg-white/2 border border-white/5">
          <h3 className="text-white font-semibold mb-3">
            {CHALLENGE_WEEKS[challengeWeek].title}
          </h3>
          <div className="space-y-2">
            {CHALLENGE_WEEKS[challengeWeek].tasks.map((task, idx) => {
              const taskId = `w${challengeWeek}-t${idx}`;
              const isDone = completedTasks.has(taskId);
              return (
                <label
                  key={idx}
                  className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all ${
                    isDone
                      ? 'bg-emerald-500/5 border border-emerald-500/10'
                      : 'bg-white/2 border border-white/5 hover:bg-white/4'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isDone}
                    onChange={() => toggleTask(taskId)}
                    className="accent-emerald-500 w-4 h-4"
                  />
                  <span className={`text-sm ${isDone ? 'text-emerald-400 line-through' : 'text-slate-300'}`}>
                    {task}
                  </span>
                </label>
              );
            })}
          </div>
          {CHALLENGE_WEEKS[challengeWeek].savingKg > 0 && (
            <p className="text-xs text-emerald-500 mt-3">
              📉 Expected saving: ~{CHALLENGE_WEEKS[challengeWeek].savingKg} kg CO₂ this week
            </p>
          )}
        </div>

        {/* Challenge progress */}
        <div className="mt-4 p-4 rounded-lg bg-white/2 flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400">Challenge Progress</p>
            <p className="text-sm text-white font-medium">
              Week {challengeWeek + 1} of 8 — ~{challengeTotalSaved} kg CO₂ saved so far
            </p>
          </div>
          <div className="w-24 h-2 rounded-full bg-white/5">
            <div
              className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-cyan-400 transition-all"
              style={{ width: `${((challengeWeek + 1) / 8) * 100}%` }}
            />
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════
          5. INDIA CLIMATE REALITY
          ═══════════════════════════════════════════════════ */}
      <section className="glass-card p-6" aria-labelledby="climate-heading">
        <h2 id="climate-heading" className="text-lg font-semibold text-white mb-1">
          🇮🇳 Why This Matters — India Climate Reality
        </h2>
        <p className="text-sm text-slate-400 mb-5">
          Climate change isn't abstract — it's already reshaping India.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {INDIA_CLIMATE_DATA.map((point, idx) => (
            <div
              key={idx}
              className={`p-4 rounded-xl border transition-all hover:scale-[1.01] ${
                point.severity === 'critical'
                  ? 'bg-red-500/5 border-red-500/15'
                  : point.severity === 'warning'
                  ? 'bg-orange-500/5 border-orange-500/15'
                  : 'bg-sky-500/5 border-sky-500/15'
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xl">{point.icon}</span>
                <span className={`text-xl font-bold ${
                  point.severity === 'critical'
                    ? 'text-red-400'
                    : point.severity === 'warning'
                    ? 'text-orange-400'
                    : 'text-sky-400'
                }`}>
                  {point.value}
                </span>
              </div>
              <p className="text-sm text-white font-medium mb-1">{point.title}</p>
              <p className="text-xs text-slate-500 mb-2">{point.description}</p>
              <p className="text-[10px] text-slate-600 italic">{point.source}</p>
            </div>
          ))}
        </div>

        <div className="mt-5 p-4 rounded-xl bg-gradient-to-r from-red-500/5 via-orange-500/5 to-yellow-500/5 border border-orange-500/10">
          <p className="text-sm text-orange-300 font-medium text-center">
            "We are the first generation to feel the impact of climate change, and the last generation that can do something about it."
          </p>
          <p className="text-xs text-slate-500 text-center mt-1">— Barack Obama, 2014</p>
        </div>
      </section>
    </div>
  );
}
