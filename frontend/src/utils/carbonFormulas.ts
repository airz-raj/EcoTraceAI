/**
 * EcoTrace AI — Carbon Emission Formula Engine
 *
 * Implements scientifically-backed emission calculations using
 * IPCC AR6, UK BEIS 2023, India CEA 2022, and EPA 2023 factors.
 *
 * All factors are in kg CO2 equivalent per unit.
 */

import type {
  TransportData,
  TransportMode,
  FuelType,
  FoodData,
  FoodCategory,
  EnergyData,
  ShoppingData,
  ShoppingCategory,
  CarbonBreakdown,
  CO2Equivalences,
  DigitalFootprint,
} from '../types';
import { getGridFactor } from './gridFactors';

// ─── Transport Emission Factors (kg CO2 per km) ─────────────

/**
 * Transport emission factors by mode and fuel type.
 * Sources: IPCC AR6, UK BEIS 2023, EPA 2023
 */
const TRANSPORT_FACTORS: Record<TransportMode, Record<FuelType | 'default', number>> = {
  car:                  { petrol: 0.192, diesel: 0.171, electric: 0.053, hybrid: 0.106, cng: 0.153, default: 0.192 },
  motorcycle:           { petrol: 0.114, diesel: 0.114, electric: 0.022, hybrid: 0.060, cng: 0.090, default: 0.114 },
  bus:                  { petrol: 0.089, diesel: 0.089, electric: 0.040, hybrid: 0.065, cng: 0.070, default: 0.089 },
  train:                { petrol: 0.041, diesel: 0.041, electric: 0.028, hybrid: 0.035, cng: 0.041, default: 0.041 },
  flight_domestic:      { petrol: 0.255, diesel: 0.255, electric: 0.255, hybrid: 0.255, cng: 0.255, default: 0.255 },
  flight_international: { petrol: 0.195, diesel: 0.195, electric: 0.195, hybrid: 0.195, cng: 0.195, default: 0.195 },
  ev:                   { petrol: 0.053, diesel: 0.053, electric: 0.053, hybrid: 0.053, cng: 0.053, default: 0.053 },
  bike:                 { petrol: 0, diesel: 0, electric: 0, hybrid: 0, cng: 0, default: 0 },
  walk:                 { petrol: 0, diesel: 0, electric: 0, hybrid: 0, cng: 0, default: 0 },
};

// ─── Food Emission Factors (kg CO2 per kg of food) ──────────

/**
 * Food emission factors by category.
 * Sources: Poore & Nemecek 2018, Our World in Data
 */
const FOOD_FACTORS_KG_PER_KG: Record<FoodCategory, number> = {
  beef:       27.0,
  lamb:       39.2,
  pork:       12.1,
  chicken:     6.9,
  fish:        6.1,
  dairy:       3.2,
  eggs:        4.5,
  vegetables:  2.0,
  fruits:      1.1,
  legumes:     0.9,
  grains:      1.4,
  processed:   3.8,
};

// ─── Shopping Emission Factors (kg CO2 per item) ────────────

/**
 * Average emission factors for shopping categories.
 * Sources: Various LCA studies, UK WRAP data
 */
const SHOPPING_FACTORS: Record<ShoppingCategory, number> = {
  clothing:    20.0,
  electronics: 50.0,
  furniture:   80.0,
  delivery:     2.5,
  other:        5.0,
};

/** Cost-based factor for 'other' category (kg CO2 per 1000 INR) */
const SPEND_BASED_FACTOR_PER_1000_INR = 0.5;

// ─── Calculation Functions ───────────────────────────────────

/**
 * Calculate transport CO2 emissions.
 *
 * @param data - Transport data including mode, distance, fuel type
 * @returns CO2 emissions in kg, rounded to 3 decimal places
 *
 * @example
 * ```ts
 * calculateTransportCO2({ mode: 'car', distanceKm: 100, fuelType: 'petrol' })
 * // Returns: 19.2
 * ```
 */
export function calculateTransportCO2(data: TransportData): number {
  const factors = TRANSPORT_FACTORS[data.mode];
  const factorKey = data.fuelType ?? 'default';
  const baseFactor = factors[factorKey] ?? factors.default;

  let co2 = baseFactor * data.distanceKm;

  // Carpooling discount: split emissions among passengers
  if (data.passengerCount && data.passengerCount > 1) {
    co2 = co2 / data.passengerCount;
  }

  return Math.round(co2 * 1000) / 1000;
}

/**
 * Calculate food CO2 emissions.
 *
 * @param data - Food data with items, weights, and sourcing
 * @returns Total CO2 emissions in kg
 *
 * @example
 * ```ts
 * calculateFoodCO2({ items: [{ category: 'beef', weightKg: 1 }] })
 * // Returns: 27.0
 * ```
 */
export function calculateFoodCO2(data: FoodData): number {
  return data.items.reduce((total, item) => {
    const baseFactor = FOOD_FACTORS_KG_PER_KG[item.category] ?? 0;
    const sourceFactor = item.source === 'local' ? 0.8 : 1.0;
    return total + baseFactor * item.weightKg * sourceFactor;
  }, 0);
}

/**
 * Calculate energy CO2 emissions (electricity, gas, LPG).
 *
 * @param data - Energy data with kWh, country, gas/LPG usage
 * @returns Total CO2 emissions in kg
 *
 * @example
 * ```ts
 * calculateEnergyCO2({ electricityKwh: 300, country: 'IN' })
 * // Returns: 212.4  (300 * 0.708)
 * ```
 */
export function calculateEnergyCO2(data: EnergyData): number {
  const gridFactor = getGridFactor(data.country);
  const effectiveFactor = gridFactor * (1 - (data.renewablePercent ?? 0) / 100);

  const electricityCO2 = data.electricityKwh * effectiveFactor;
  const gasCO2 = (data.naturalGasM3 ?? 0) * 2.204;  // kg CO2 per m³ natural gas
  const lpgCO2 = (data.lpgKg ?? 0) * 2.983;           // kg CO2 per kg LPG

  return Math.round((electricityCO2 + gasCO2 + lpgCO2) * 1000) / 1000;
}

/**
 * Calculate shopping/consumption CO2 emissions.
 *
 * @param data - Shopping data with items and categories
 * @returns Total CO2 emissions in kg
 */
export function calculateShoppingCO2(data: ShoppingData): number {
  return data.items.reduce((total, item) => {
    if (item.category === 'other' && item.estimatedValueINR) {
      return total + (item.estimatedValueINR / 1000) * SPEND_BASED_FACTOR_PER_1000_INR * item.quantity;
    }
    const factor = SHOPPING_FACTORS[item.category] ?? SHOPPING_FACTORS.other;
    return total + factor * item.quantity;
  }, 0);
}

/**
 * Calculate digital device CO2 emissions from CLI agent telemetry.
 *
 * @param digital - Digital footprint data from CLI agent
 * @param country - Country code for grid factor
 * @returns CO2 emissions in kg for the monitoring period
 */
export function calculateDigitalCO2(digital: DigitalFootprint, country: string): number {
  const gridFactor = getGridFactor(country);
  return Math.round(digital.monthlyKwh * gridFactor * 1000) / 1000;
}

/**
 * Calculate complete carbon breakdown across all categories.
 *
 * @param transport - Transport data
 * @param food - Food data
 * @param energy - Energy data
 * @param shopping - Shopping data
 * @param digital - Optional digital footprint
 * @param country - Country code for grid factor
 * @returns Full breakdown with per-category and total emissions
 */
export function calculateTotalBreakdown(
  transport: TransportData,
  food: FoodData,
  energy: EnergyData,
  shopping: ShoppingData,
  digital?: DigitalFootprint,
  country: string = 'IN'
): { breakdown: CarbonBreakdown; totalKgCO2: number } {
  const transportKg = calculateTransportCO2(transport);
  const foodKg = calculateFoodCO2(food);
  const energyKg = calculateEnergyCO2(energy);
  const shoppingKg = calculateShoppingCO2(shopping);
  const digitalKg = digital ? calculateDigitalCO2(digital, country) : 0;

  const breakdown: CarbonBreakdown = {
    transportKg,
    foodKg,
    energyKg,
    shoppingKg,
    digitalKg,
  };

  const totalKgCO2 = transportKg + foodKg + energyKg + shoppingKg + digitalKg;

  return { breakdown, totalKgCO2: Math.round(totalKgCO2 * 1000) / 1000 };
}

/**
 * Convert raw CO2 kg into human-friendly equivalences.
 *
 * @param kgCO2 - CO2 amount in kilograms
 * @returns Relatable equivalences (trees, car km, phone charges)
 *
 * @example
 * ```ts
 * getCO2Equivalences(100)
 * // { treesNeededYear: 5, kmByPetrolCar: 521, smartphoneCharges: 12500 }
 * ```
 */
export function getCO2Equivalences(kgCO2: number): CO2Equivalences {
  return {
    treesNeededYear: Math.round(kgCO2 / 21),
    kmByPetrolCar: Math.round(kgCO2 / 0.192),
    smartphoneCharges: Math.round(kgCO2 / 0.008),
  };
}
