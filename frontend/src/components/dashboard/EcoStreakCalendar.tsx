/**
 * EcoTrace AI — Eco Streak Calendar
 *
 * GitHub-style contribution heatmap for tracking daily eco-actions.
 * Shows 16 weeks of activity with intensity-based coloring.
 * Persists streak data in localStorage.
 *
 * "Small things make big changes" — daily consistency > grand gestures.
 */

import { useState, useMemo, useCallback, useEffect } from 'react';

// ─── Daily Eco-Actions ──────────────────────────────────────

export interface EcoAction {
  id: string;
  label: string;
  icon: string;
  co2SavedKg: number;
  category: 'transport' | 'food' | 'energy' | 'lifestyle';
}

const DAILY_ACTIONS: EcoAction[] = [
  { id: 'walked',         label: 'Walked / cycled instead of driving',  icon: '🚶', co2SavedKg: 2.5,  category: 'transport' },
  { id: 'public-transit', label: 'Used public transport',              icon: '🚌', co2SavedKg: 1.8,  category: 'transport' },
  { id: 'veg-meal',       label: 'Had a fully vegetarian day',         icon: '🥗', co2SavedKg: 3.2,  category: 'food' },
  { id: 'no-waste',       label: 'Zero food waste today',              icon: '🗑️', co2SavedKg: 0.9,  category: 'food' },
  { id: 'local-food',     label: 'Bought local produce',               icon: '🧑‍🌾', co2SavedKg: 0.6,  category: 'food' },
  { id: 'lights-off',     label: 'Turned off unused lights & devices', icon: '💡', co2SavedKg: 0.4,  category: 'energy' },
  { id: 'ac-26',          label: 'Kept AC at 26°C+',                   icon: '❄️', co2SavedKg: 0.8,  category: 'energy' },
  { id: 'reusable',       label: 'Used reusable bag / bottle',         icon: '♻️', co2SavedKg: 0.2,  category: 'lifestyle' },
  { id: 'no-online-order',label: 'Skipped an online order',            icon: '📦', co2SavedKg: 1.1,  category: 'lifestyle' },
  { id: 'planted',        label: 'Planted / watered a plant',          icon: '🌱', co2SavedKg: 0.05, category: 'lifestyle' },
];

// ─── Storage ────────────────────────────────────────────────

interface DayLog {
  date: string; // YYYY-MM-DD
  actions: string[]; // action IDs
  co2SavedKg: number;
}

const STORAGE_KEY = 'ecotrace_streak_data';

function loadStreakData(): Record<string, DayLog> {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
  } catch {
    return {};
  }
}

function saveStreakData(data: Record<string, DayLog>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

// ─── Helpers ────────────────────────────────────────────────

function getDateKey(date: Date): string {
  return date.toISOString().split('T')[0];
}

function getDayName(date: Date): string {
  return date.toLocaleDateString('en', { weekday: 'short' });
}

function getMonthLabel(date: Date): string {
  return date.toLocaleDateString('en', { month: 'short' });
}

function calcStreak(data: Record<string, DayLog>): number {
  let streak = 0;
  const today = new Date();
  
  for (let i = 0; i < 365; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const key = getDateKey(d);
    if (data[key] && data[key].actions.length > 0) {
      streak++;
    } else if (i > 0) {
      break; // streak broken
    }
  }
  return streak;
}

// ─── Intensity Colors ───────────────────────────────────────

function getIntensityClass(actionCount: number): string {
  if (actionCount === 0) return 'bg-white/3';
  if (actionCount <= 1) return 'bg-emerald-900/60';
  if (actionCount <= 3) return 'bg-emerald-700/60';
  if (actionCount <= 5) return 'bg-emerald-500/60';
  return 'bg-emerald-400/80';
}

function getIntensityLabel(actionCount: number): string {
  if (actionCount === 0) return 'No actions';
  if (actionCount <= 1) return 'Getting started';
  if (actionCount <= 3) return 'Good effort';
  if (actionCount <= 5) return 'Great day!';
  return 'Eco champion!';
}

// ─── Component ──────────────────────────────────────────────

export function EcoStreakCalendar() {
  const [streakData, setStreakData] = useState<Record<string, DayLog>>(loadStreakData);
  const [selectedDate, setSelectedDate] = useState<string>(getDateKey(new Date()));
  const [showChecklist, setShowChecklist] = useState(true);

  // Persist on change
  useEffect(() => {
    saveStreakData(streakData);
  }, [streakData]);

  const todayKey = getDateKey(new Date());
  const todayLog = streakData[todayKey] || { date: todayKey, actions: [], co2SavedKg: 0 };
  const selectedLog = streakData[selectedDate] || { date: selectedDate, actions: [], co2SavedKg: 0 };
  const currentStreak = useMemo(() => calcStreak(streakData), [streakData]);

  // Total stats
  const totalStats = useMemo(() => {
    const logs = Object.values(streakData);
    return {
      totalDays: logs.filter(l => l.actions.length > 0).length,
      totalActions: logs.reduce((s, l) => s + l.actions.length, 0),
      totalCo2Saved: logs.reduce((s, l) => s + l.co2SavedKg, 0),
    };
  }, [streakData]);

  // Generate calendar grid (16 weeks = 112 days)
  const calendarDays = useMemo(() => {
    const days: { date: Date; key: string }[] = [];
    const today = new Date();
    
    // Start from 111 days ago
    for (let i = 111; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      days.push({ date: d, key: getDateKey(d) });
    }
    return days;
  }, []);

  // Month labels for the calendar header
  const monthLabels = useMemo(() => {
    const labels: { label: string; colStart: number }[] = [];
    let lastMonth = -1;
    
    calendarDays.forEach((day, idx) => {
      const month = day.date.getMonth();
      if (month !== lastMonth) {
        labels.push({ label: getMonthLabel(day.date), colStart: Math.floor(idx / 7) });
        lastMonth = month;
      }
    });
    return labels;
  }, [calendarDays]);

  // Toggle action for today
  const toggleAction = useCallback((actionId: string) => {
    setStreakData((prev) => {
      const dayLog = prev[todayKey] || { date: todayKey, actions: [], co2SavedKg: 0 };
      const isActive = dayLog.actions.includes(actionId);
      const action = DAILY_ACTIONS.find(a => a.id === actionId);
      
      const newActions = isActive
        ? dayLog.actions.filter(id => id !== actionId)
        : [...dayLog.actions, actionId];
      
      const newCo2 = isActive
        ? dayLog.co2SavedKg - (action?.co2SavedKg ?? 0)
        : dayLog.co2SavedKg + (action?.co2SavedKg ?? 0);

      return {
        ...prev,
        [todayKey]: {
          ...dayLog,
          actions: newActions,
          co2SavedKg: Math.max(0, Math.round(newCo2 * 100) / 100),
        },
      };
    });
  }, [todayKey]);

  // Group weeks for grid rendering
  const weeks = useMemo(() => {
    const w: { date: Date; key: string }[][] = [];
    for (let i = 0; i < calendarDays.length; i += 7) {
      w.push(calendarDays.slice(i, i + 7));
    }
    return w;
  }, [calendarDays]);

  const isToday = selectedDate === todayKey;

  return (
    <section className="glass-card p-6 space-y-5" aria-labelledby="streak-heading">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 id="streak-heading" className="text-lg font-semibold text-white">
            🔥 Eco Streak Calendar
          </h2>
          <p className="text-sm text-slate-400">
            Small things make big changes — track your daily eco-actions
          </p>
        </div>

        {/* Streak badge */}
        <div className="flex items-center gap-4">
          <div className="text-center">
            <p className={`text-2xl font-bold ${currentStreak > 0 ? 'text-orange-400' : 'text-slate-600'}`}>
              {currentStreak > 0 ? '🔥' : '💤'} {currentStreak}
            </p>
            <p className="text-[10px] text-slate-500">day streak</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-emerald-400">
              {totalStats.totalCo2Saved.toFixed(1)}
            </p>
            <p className="text-[10px] text-slate-500">kg CO₂ saved</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-sky-400">
              {totalStats.totalDays}
            </p>
            <p className="text-[10px] text-slate-500">active days</p>
          </div>
        </div>
      </div>

      {/* ─── Heatmap Calendar ──────────────────────────── */}
      <div className="overflow-x-auto" role="img" aria-label={`Activity calendar showing ${totalStats.totalDays} active days`}>
        {/* Month labels */}
        <div className="flex gap-[3px] mb-1 ml-8">
          {weeks.map((_week, wi) => {
            const label = monthLabels.find(l => l.colStart === wi);
            return (
              <div key={wi} className="w-[14px] flex-shrink-0">
                {label && (
                  <span className="text-[9px] text-slate-500">{label.label}</span>
                )}
              </div>
            );
          })}
        </div>

        {/* Grid: 7 rows (days) × 16 columns (weeks) */}
        <div className="flex gap-[3px]">
          {/* Day labels */}
          <div className="flex flex-col gap-[3px] pr-1">
            {['Mon', '', 'Wed', '', 'Fri', '', 'Sun'].map((label, i) => (
              <div key={i} className="h-[14px] flex items-center">
                <span className="text-[9px] text-slate-600 w-6 text-right">{label}</span>
              </div>
            ))}
          </div>

          {/* Cells */}
          {weeks.map((week, wi) => (
            <div key={wi} className="flex flex-col gap-[3px]">
              {week.map((day) => {
                const log = streakData[day.key];
                const count = log?.actions.length ?? 0;
                const isSel = selectedDate === day.key;
                
                return (
                  <button
                    key={day.key}
                    onClick={() => setSelectedDate(day.key)}
                    className={`w-[14px] h-[14px] rounded-[3px] transition-all ${getIntensityClass(count)} ${
                      isSel ? 'ring-1 ring-white/40 ring-offset-1 ring-offset-[#0f0d1a]' : ''
                    } ${day.key === todayKey ? 'ring-1 ring-emerald-500/40' : ''}`}
                    title={`${day.date.toLocaleDateString('en', { month: 'short', day: 'numeric' })}: ${count} actions`}
                    aria-label={`${day.date.toLocaleDateString()}: ${count} eco-actions, ${getIntensityLabel(count)}`}
                  />
                );
              })}
            </div>
          ))}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-2 mt-2 ml-8">
          <span className="text-[9px] text-slate-600">Less</span>
          <div className="w-[10px] h-[10px] rounded-[2px] bg-white/3" />
          <div className="w-[10px] h-[10px] rounded-[2px] bg-emerald-900/60" />
          <div className="w-[10px] h-[10px] rounded-[2px] bg-emerald-700/60" />
          <div className="w-[10px] h-[10px] rounded-[2px] bg-emerald-500/60" />
          <div className="w-[10px] h-[10px] rounded-[2px] bg-emerald-400/80" />
          <span className="text-[9px] text-slate-600">More</span>
        </div>
      </div>

      {/* ─── Selected Day Detail ───────────────────────── */}
      {selectedDate !== todayKey && selectedLog.actions.length > 0 && (
        <div className="p-3 rounded-xl bg-white/3 border border-white/5">
          <p className="text-xs text-slate-400 mb-2">
            {new Date(selectedDate + 'T12:00:00').toLocaleDateString('en', { 
              weekday: 'long', month: 'long', day: 'numeric' 
            })} — {selectedLog.actions.length} actions, {selectedLog.co2SavedKg.toFixed(1)} kg CO₂ saved
          </p>
          <div className="flex flex-wrap gap-1.5">
            {selectedLog.actions.map(id => {
              const action = DAILY_ACTIONS.find(a => a.id === id);
              return action ? (
                <span key={id} className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400">
                  {action.icon} {action.label}
                </span>
              ) : null;
            })}
          </div>
        </div>
      )}

      {/* ─── Today's Checklist ─────────────────────────── */}
      <div>
        <button
          onClick={() => setShowChecklist(v => !v)}
          className="flex items-center gap-2 text-sm text-white font-medium mb-3 hover:text-emerald-400 transition-colors"
          aria-expanded={showChecklist}
        >
          <span className="text-xs transition-transform" style={{ 
            transform: showChecklist ? 'rotate(90deg)' : 'rotate(0deg)',
            display: 'inline-block',
          }}>▶</span>
          Today's Eco-Actions ({todayLog.actions.length}/{DAILY_ACTIONS.length})
          {todayLog.co2SavedKg > 0 && (
            <span className="text-xs text-emerald-500 ml-1">
              — {todayLog.co2SavedKg.toFixed(1)} kg CO₂ saved today!
            </span>
          )}
        </button>

        {showChecklist && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 animate-fade-in">
            {DAILY_ACTIONS.map((action) => {
              const isChecked = todayLog.actions.includes(action.id);
              return (
                <label
                  key={action.id}
                  className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all border ${
                    isChecked
                      ? 'bg-emerald-500/8 border-emerald-500/20'
                      : 'bg-white/2 border-white/5 hover:bg-white/4 hover:border-white/8'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => toggleAction(action.id)}
                    className="accent-emerald-500 w-4 h-4 flex-shrink-0"
                  />
                  <span className="text-lg flex-shrink-0">{action.icon}</span>
                  <div className="min-w-0 flex-1">
                    <p className={`text-sm leading-tight ${isChecked ? 'text-emerald-400' : 'text-slate-300'}`}>
                      {action.label}
                    </p>
                    <p className="text-[10px] text-slate-600">
                      −{action.co2SavedKg} kg CO₂
                    </p>
                  </div>
                </label>
              );
            })}
          </div>
        )}
      </div>

      {/* Motivational nudge */}
      {currentStreak >= 3 && (
        <div className="p-3 rounded-xl bg-gradient-to-r from-orange-500/5 to-yellow-500/5 border border-orange-500/10 text-center animate-fade-in">
          <p className="text-sm text-orange-300">
            {currentStreak >= 30
              ? `🏆 ${currentStreak}-day streak! You're an Eco Legend. That's ${totalStats.totalCo2Saved.toFixed(0)} kg CO₂ saved!`
              : currentStreak >= 14
              ? `⭐ ${currentStreak} days strong! You've built a real habit. Keep going!`
              : currentStreak >= 7
              ? `🌟 ${currentStreak}-day streak! One week of consistent climate action!`
              : `🔥 ${currentStreak} days in a row! Every day counts.`
            }
          </p>
        </div>
      )}
    </section>
  );
}
