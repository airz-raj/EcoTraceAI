/**
 * EcoTrace AI — AI Web Worker
 *
 * Runs Transformers.js classification in a dedicated thread.
 * Used by the AI orchestrator (Tier 2) for recommendation prioritization.
 *
 * AUDIT FIX: Prevents TTI UI blocking from WASM operations.
 */

self.onmessage = async (e: MessageEvent) => {
  const { type, recommendations } = e.data;

  if (type !== 'classify') return;

  try {
    // Dynamically import transformers.js to avoid loading at startup
    const { pipeline } = await import('@xenova/transformers');

    const classifier = await pipeline(
      'zero-shot-classification',
      'Xenova/mobilebert-uncased-mnli'
    );

    const labels = [
      'high environmental impact',
      'medium environmental impact',
      'low environmental impact',
    ];

    const scores: number[] = [];

    for (const rec of recommendations) {
      try {
        const result = await classifier(`${rec.title}. ${rec.description}`, labels) as any;
        // Map classification to priority score
        const highScore = result.scores[result.labels.indexOf('high environmental impact')] ?? 0;
        scores.push(Math.round(50 + highScore * 50));
      } catch {
        scores.push(50); // Default mid priority
      }
    }

    self.postMessage({ type: 'result', scores });
  } catch (error) {
    self.postMessage({
      type: 'error',
      message: error instanceof Error ? error.message : 'AI classification failed',
    });
  }
};
