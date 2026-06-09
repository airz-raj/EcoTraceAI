/**
 * EcoTrace AI — Three-Tier AI Orchestrator
 *
 * Implements a cascading AI strategy:
 *   TIER 3 → Ollama (local LLM — richest output, optional)
 *   TIER 2 → Browser AI (Transformers.js via Web Worker)
 *   TIER 1 → Algorithmic (rule-based recommendations — always available)
 *
 * Short-circuits to the highest available tier for efficiency.
 */

import type { CarbonEntry, AIInsightResponse, AITier, Recommendation } from '../types';
import { generateRecommendations } from './recommendationEngine';

/** Cache Ollama availability to avoid repeated checks */
let ollamaAvailable: boolean | null = null;

// ─── Tier 3: Ollama (Local LLM) ────────────────────────────

/**
 * Check if Ollama server is running locally.
 * Result is cached after first check.
 */
async function checkOllama(): Promise<boolean> {
  if (ollamaAvailable !== null) return ollamaAvailable;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000);

    const res = await fetch('http://localhost:11434/api/tags', {
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    ollamaAvailable = res.ok;
  } catch {
    ollamaAvailable = false;
  }

  return ollamaAvailable;
}

/**
 * Enrich recommendations using Ollama local LLM.
 */
async function enrichWithOllama(
  algorithmicRecs: Recommendation[],
  entry: CarbonEntry
): Promise<Recommendation[]> {
  const prompt = `You are an environmental advisor. Based on this carbon footprint data:
- Transport: ${entry.breakdown.transportKg.toFixed(1)} kg CO₂
- Food: ${entry.breakdown.foodKg.toFixed(1)} kg CO₂
- Energy: ${entry.breakdown.energyKg.toFixed(1)} kg CO₂
- Total: ${entry.totalKgCO2.toFixed(1)} kg CO₂

Provide 3 specific, actionable recommendations to reduce carbon emissions. Return as JSON array with fields: title, description, potentialSavingKg, difficulty (easy/medium/hard).`;

  const response = await fetch('http://localhost:11434/api/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'llama3.2',
      prompt,
      stream: false,
      format: 'json',
    }),
  });

  if (!response.ok) throw new Error('Ollama request failed');

  const data = await response.json();

  try {
    const parsed = JSON.parse(data.response);
    const ollamaRecs: Recommendation[] = (parsed.recommendations || parsed || [])
      .slice(0, 3)
      .map((rec: Record<string, unknown>, idx: number) => ({
        id: `ollama_${idx}_${Date.now()}`,
        category: 'transportKg' as const, // Ollama recs are general
        title: String(rec.title || 'AI Recommendation'),
        description: String(rec.description || ''),
        potentialSavingKg: Number(rec.potentialSavingKg) || 0,
        difficulty: (['easy', 'medium', 'hard'].includes(String(rec.difficulty))
          ? String(rec.difficulty)
          : 'medium') as 'easy' | 'medium' | 'hard',
        priority: 95 - idx * 5,
      }));

    return [...ollamaRecs, ...algorithmicRecs];
  } catch {
    // If JSON parsing fails, return algorithmic recs only
    return algorithmicRecs;
  }
}

// ─── Tier 2: Browser AI (Transformers.js Worker) ────────────

/**
 * Run classification via Transformers.js Web Worker.
 * Offloaded to prevent UI freezing.
 */
async function runBrowserAIWorker(
  algorithmicRecs: Recommendation[]
): Promise<Recommendation[]> {
  return new Promise((resolve, reject) => {
    try {
      const worker = new Worker(
        new URL('../workers/ai.worker.ts', import.meta.url),
        { type: 'module' }
      );

      const timeout = setTimeout(() => {
        worker.terminate();
        reject(new Error('Browser AI worker timed out'));
      }, 30000);

      worker.postMessage({
        type: 'classify',
        recommendations: algorithmicRecs.map((r) => ({
          title: r.title,
          description: r.description,
        })),
      });

      worker.onmessage = (e) => {
        clearTimeout(timeout);
        if (e.data.type === 'result') {
          // Enrich with priority scores from AI classification
          const enhanced = algorithmicRecs.map((rec, idx) => ({
            ...rec,
            priority: e.data.scores?.[idx] ?? rec.priority,
          }));
          worker.terminate();
          resolve(enhanced.sort((a, b) => b.priority - a.priority));
        } else if (e.data.type === 'error') {
          worker.terminate();
          reject(new Error(e.data.message));
        }
      };

      worker.onerror = () => {
        clearTimeout(timeout);
        worker.terminate();
        reject(new Error('Browser AI worker crashed'));
      };
    } catch {
      reject(new Error('Browser AI not available'));
    }
  });
}

// ─── Main Orchestrator ──────────────────────────────────────

/**
 * Get AI-powered recommendations using the highest available tier.
 *
 * Cascade: Ollama → Browser AI → Algorithmic
 * Each tier gracefully falls back to the next on failure.
 *
 * @param entry - Carbon entry to analyze
 * @returns Recommendations and which AI tier was used
 */
export async function getAIRecommendations(
  entry: CarbonEntry
): Promise<AIInsightResponse> {
  // TIER 1 (always available): Generate algorithmic recommendations
  const algorithmicRecs = generateRecommendations(entry);

  // TIER 3: Try Ollama first (richest output)
  if (await checkOllama()) {
    try {
      const enriched = await enrichWithOllama(algorithmicRecs, entry);
      return { recommendations: enriched, tier: 'ollama' as AITier };
    } catch {
      // Fall through to Tier 2
    }
  }

  // TIER 2: Try Browser AI (Transformers.js via Worker)
  try {
    const classified = await runBrowserAIWorker(algorithmicRecs);
    return { recommendations: classified, tier: 'browser_ai' as AITier };
  } catch {
    // Fall through to Tier 1
  }

  // TIER 1: Return algorithmic recommendations
  return { recommendations: algorithmicRecs, tier: 'algorithmic' as AITier };
}

/**
 * Reset Ollama availability cache.
 * Call this when user wants to retry Ollama connection.
 */
export function resetOllamaCache(): void {
  ollamaAvailable = null;
}
