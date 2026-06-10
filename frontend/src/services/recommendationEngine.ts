/**
 * EcoTrace AI — Recommendation Engine
 *
 * Rule-based recommendation system that analyzes carbon entries
 * and generates personalized reduction suggestions.
 * This is the algorithmic (Tier 1) fallback — always available.
 */

import type { CarbonEntry, CarbonBreakdown, Recommendation } from '../types';

let recommendationIdCounter = 0;

function nextId(): string {
  recommendationIdCounter += 1;
  return `rec_${recommendationIdCounter}_${Date.now()}`;
}

/**
 * Generate personalized carbon reduction recommendations
 * based on the user's emission breakdown.
 *
 * @param entry - The carbon entry to analyze
 * @returns Array of prioritized recommendations
 */
export function generateRecommendations(entry: CarbonEntry): Recommendation[] {
  const recommendations: Recommendation[] = [];
  const { breakdown } = entry;

  // ── Transport Recommendations ─────────────────────────────
  if (breakdown.transportKg > 5) {
    if (entry.transport.mode === 'car' && (!entry.transport.passengerCount || entry.transport.passengerCount <= 1)) {
      recommendations.push({
        id: nextId(),
        category: 'transportKg',
        title: 'Try Carpooling',
        description: `Sharing your ride with just 1 other person would cut your transport emissions by 50%. That's ${(breakdown.transportKg / 2).toFixed(1)} kg CO₂ saved per trip.`,
        potentialSavingKg: breakdown.transportKg / 2,
        difficulty: 'easy',
        priority: 90,
      });
    }

    if (['car', 'motorcycle'].includes(entry.transport.mode) && entry.transport.distanceKm < 15) {
      recommendations.push({
        id: nextId(),
        category: 'transportKg',
        title: 'Switch to Public Transit',
        description: 'For short distances under 15 km, buses and trains emit up to 75% less CO₂ per passenger than private vehicles.',
        potentialSavingKg: breakdown.transportKg * 0.6,
        difficulty: 'easy',
        priority: 85,
      });
    }

    if (entry.transport.mode === 'car' && entry.transport.fuelType === 'petrol') {
      recommendations.push({
        id: nextId(),
        category: 'transportKg',
        title: 'Consider an Electric Vehicle',
        description: 'EVs produce up to 72% less CO₂ than petrol cars. Even with India\'s grid, the savings are significant.',
        potentialSavingKg: breakdown.transportKg * 0.72,
        difficulty: 'hard',
        priority: 60,
      });
    }

    if (entry.transport.mode.includes('flight')) {
      recommendations.push({
        id: nextId(),
        category: 'transportKg',
        title: 'Reduce Air Travel',
        description: 'A single round-trip domestic flight can emit more CO₂ than a month of driving. Consider trains for distances under 500 km.',
        potentialSavingKg: breakdown.transportKg * 0.4,
        difficulty: 'medium',
        priority: 75,
      });
    }
  }

  // ── Food Recommendations ──────────────────────────────────
  if (breakdown.foodKg > 3) {
    const hasBeefOrLamb = entry.food.items.some((item) =>
      ['beef', 'lamb'].includes(item.category)
    );
    if (hasBeefOrLamb) {
      recommendations.push({
        id: nextId(),
        category: 'foodKg',
        title: 'Reduce Red Meat Consumption',
        description: 'Beef and lamb have the highest food emissions (27-39 kg CO₂/kg). Switching to chicken or legumes can cut food emissions by 75%.',
        potentialSavingKg: breakdown.foodKg * 0.5,
        difficulty: 'medium',
        priority: 88,
      });
    }

    const hasImported = entry.food.items.some((item) => item.source === 'imported');
    if (hasImported) {
      recommendations.push({
        id: nextId(),
        category: 'foodKg',
        title: 'Buy Local Produce',
        description: 'Locally sourced food has ~20% lower emissions due to reduced transportation. Visit your nearest farmer\'s market!',
        potentialSavingKg: breakdown.foodKg * 0.15,
        difficulty: 'easy',
        priority: 70,
      });
    }

    recommendations.push({
      id: nextId(),
      category: 'foodKg',
      title: 'Try Plant-Based Meals',
      description: 'Even 1-2 meatless days per week can significantly reduce your food carbon footprint. Legumes and grains emit 10-30x less CO₂ than meat.',
      potentialSavingKg: breakdown.foodKg * 0.25,
      difficulty: 'easy',
      priority: 65,
    });
  }

  // ── Energy Recommendations ────────────────────────────────
  if (breakdown.energyKg > 10) {
    if (!entry.energy.renewablePercent || entry.energy.renewablePercent < 50) {
      recommendations.push({
        id: nextId(),
        category: 'energyKg',
        title: 'Switch to Green Energy',
        description: 'Consider a solar rooftop installation or a green energy tariff. Even 50% renewable energy can halve your electricity emissions.',
        potentialSavingKg: breakdown.energyKg * 0.4,
        difficulty: 'hard',
        priority: 80,
      });
    }

    if (entry.energy.electricityKwh > 200) {
      recommendations.push({
        id: nextId(),
        category: 'energyKg',
        title: 'Optimize Energy Usage',
        description: 'Switch to LED bulbs, use energy-efficient appliances, and set AC to 24°C. Small changes can save 15-30% on electricity.',
        potentialSavingKg: breakdown.energyKg * 0.2,
        difficulty: 'easy',
        priority: 75,
      });
    }
  }

  // ── Shopping Recommendations ──────────────────────────────
  if (breakdown.shoppingKg > 10) {
    recommendations.push({
      id: nextId(),
      category: 'shoppingKg',
      title: 'Buy Fewer, Better Quality Items',
      description: 'Fast fashion and disposable electronics have a huge carbon footprint. Investing in quality items that last longer reduces waste and emissions.',
      potentialSavingKg: breakdown.shoppingKg * 0.3,
      difficulty: 'medium',
      priority: 55,
    });
  }

  // ── Digital Recommendations ───────────────────────────────
  if (breakdown.digitalKg > 2) {
    recommendations.push({
      id: nextId(),
      category: 'digitalKg',
      title: 'Enable Power Saving Mode',
      description: 'Set your display to sleep after 5 minutes and enable CPU power-saving mode. This can reduce device power consumption by 20%.',
      potentialSavingKg: breakdown.digitalKg * 0.2,
      difficulty: 'easy',
      priority: 40,
    });
  }

  // Sort by priority (highest first)
  const sorted = recommendations.sort((a, b) => b.priority - a.priority);

  // Fallback if emissions are exceptionally low
  if (sorted.length === 0) {
    sorted.push({
      id: nextId(),
      category: 'transportKg', // using a valid category key
      title: 'Maintain Your Low Footprint',
      description: 'Your emissions are remarkably low! Keep practicing your current sustainable habits.',
      potentialSavingKg: 0,
      difficulty: 'easy',
      priority: 100,
    });
  }

  return sorted;
}

/**
 * Calculate total potential savings from all recommendations.
 *
 * @param recommendations - Array of recommendations
 * @returns Total potential CO2 savings in kg
 */
export function getTotalPotentialSavings(recommendations: Recommendation[]): number {
  return recommendations.reduce((total, rec) => total + rec.potentialSavingKg, 0);
}

/**
 * Find the highest-impact category in the breakdown.
 *
 * @param breakdown - Carbon breakdown by category
 * @returns The category key with highest emissions
 */
export function getHighestImpactCategory(breakdown: CarbonBreakdown): keyof CarbonBreakdown {
  const entries = Object.entries(breakdown) as [keyof CarbonBreakdown, number][];
  return entries.reduce((max, curr) => (curr[1] > max[1] ? curr : max))[0];
}
