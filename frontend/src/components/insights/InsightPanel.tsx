/**
 * EcoTrace AI — Insight Panel
 *
 * Displays AI-generated recommendations with tier indicator.
 */

import { useState } from 'react';
import { useCarbonContext } from '../../context/CarbonContext';
import { getAIRecommendations } from '../../services/aiOrchestrator';
import { getTotalPotentialSavings } from '../../services/recommendationEngine';
import type { CarbonEntry, AITier } from '../../types';

const TIER_LABELS: Record<AITier, { label: string; color: string }> = {
  ollama: { label: 'Ollama LLM', color: 'text-purple-400' },
  browser_ai: { label: 'Browser AI', color: 'text-sky-400' },
  algorithmic: { label: 'Smart Rules', color: 'text-emerald-400' },
};

const DIFFICULTY_COLORS: Record<string, string> = {
  easy: 'badge-eco',
  medium: 'badge-info',
  hard: 'badge-warn',
};

export function InsightPanel() {
  const { state, setInsights } = useCarbonContext();
  const [isLoading, setIsLoading] = useState(false);

  const latestEntry = state.entries[0] as CarbonEntry | undefined;

  const handleGenerate = async () => {
    if (!latestEntry) return;
    setIsLoading(true);
    try {
      const result = await getAIRecommendations(latestEntry);
      setInsights(result);
    } catch {
      setInsights(null);
    } finally {
      setIsLoading(false);
    }
  };

  const { insights } = state;

  return (
    <section className="glass-card p-6 animate-fade-in" aria-labelledby="insights-heading">
      <div className="flex items-center justify-between mb-4">
        <h2 id="insights-heading" className="text-lg font-semibold text-white">
          AI Recommendations
        </h2>
        {insights && (
          <span className={`text-xs ${TIER_LABELS[insights.tier].color}`}>
            Powered by: {TIER_LABELS[insights.tier].label}
          </span>
        )}
      </div>

      {!latestEntry && (
        <p className="text-sm text-slate-500 py-4">
          Log a carbon entry first to get personalized recommendations.
        </p>
      )}

      {latestEntry && !insights && (
        <div className="text-center py-6">
          <button
            onClick={handleGenerate}
            disabled={isLoading}
            className="btn-primary"
            aria-busy={isLoading}
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <span className="animate-spin" aria-hidden="true">⏳</span>
                Analyzing...
              </span>
            ) : (
              '✨ Generate AI Insights'
            )}
          </button>
        </div>
      )}

      {insights && insights.recommendations.length > 0 && (
        <div className="space-y-3" role="list" aria-label="Recommendations">
          {insights.recommendations.slice(0, 6).map((rec, idx) => (
            <div
              key={rec.id}
              className={`p-4 rounded-xl bg-white/3 border border-white/5 animate-fade-in stagger-${Math.min(idx + 1, 4)}`}
              role="listitem"
              style={{ opacity: 0 }}
            >
              <div className="flex items-start justify-between mb-2">
                <h3 className="text-sm font-semibold text-white">{rec.title}</h3>
                <span className={`badge ${DIFFICULTY_COLORS[rec.difficulty]} text-xs`}>
                  {rec.difficulty}
                </span>
              </div>
              <p className="text-xs text-slate-400 mb-2">{rec.description}</p>
              <p className="text-xs text-emerald-400">
                💚 Potential saving: {rec.potentialSavingKg.toFixed(1)} kg CO₂
              </p>
            </div>
          ))}

          <div className="pt-3 border-t border-white/5 text-center">
            <p className="text-sm text-emerald-300">
              🌱 Total potential savings:{' '}
              <strong>{getTotalPotentialSavings(insights.recommendations).toFixed(1)} kg CO₂</strong>
            </p>
          </div>
        </div>
      )}
    </section>
  );
}
