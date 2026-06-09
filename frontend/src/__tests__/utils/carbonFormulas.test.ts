/**
 * EcoTrace AI — Carbon Formula Unit Tests
 *
 * Jest tests for all emission calculation functions.
 * Verifies IPCC AR6 factor accuracy.
 */

import {
  calculateTransportCO2,
  calculateFoodCO2,
  calculateEnergyCO2,
  calculateShoppingCO2,
  getCO2Equivalences,
  calculateTotalBreakdown,
} from '../../utils/carbonFormulas';
import type { TransportData, FoodData, EnergyData, ShoppingData } from '../../types';

// ─── Transport Tests ─────────────────────────────────────

describe('calculateTransportCO2', () => {
  test('petrol car 100km = 19.2 kg CO2', () => {
    const data: TransportData = { mode: 'car', distanceKm: 100, fuelType: 'petrol' };
    const result = calculateTransportCO2(data);
    expect(result).toBeCloseTo(19.2, 1);
  });

  test('diesel car 100km = 17.1 kg CO2', () => {
    const data: TransportData = { mode: 'car', distanceKm: 100, fuelType: 'diesel' };
    expect(calculateTransportCO2(data)).toBeCloseTo(17.1, 1);
  });

  test('EV 100km = 5.3 kg CO2', () => {
    const data: TransportData = { mode: 'ev', distanceKm: 100 };
    expect(calculateTransportCO2(data)).toBeCloseTo(5.3, 1);
  });

  test('walking and biking produce zero emissions', () => {
    expect(calculateTransportCO2({ mode: 'walk', distanceKm: 10 })).toBe(0);
    expect(calculateTransportCO2({ mode: 'bike', distanceKm: 50 })).toBe(0);
  });

  test('carpooling (4 people) reduces per-person emissions by 75%', () => {
    const solo = calculateTransportCO2({ mode: 'car', distanceKm: 100, fuelType: 'petrol' });
    const shared = calculateTransportCO2({ mode: 'car', distanceKm: 100, fuelType: 'petrol', passengerCount: 4 });
    expect(shared).toBeCloseTo(solo / 4, 1);
  });

  test('zero distance produces zero emissions', () => {
    expect(calculateTransportCO2({ mode: 'car', distanceKm: 0 })).toBe(0);
  });

  test('domestic flight 500km', () => {
    const data: TransportData = { mode: 'flight_domestic', distanceKm: 500 };
    expect(calculateTransportCO2(data)).toBeCloseTo(127.5, 1);
  });
});

// ─── Food Tests ──────────────────────────────────────────

describe('calculateFoodCO2', () => {
  test('1kg beef = 27 kg CO2', () => {
    const data: FoodData = { items: [{ category: 'beef', weightKg: 1 }] };
    expect(calculateFoodCO2(data)).toBeCloseTo(27.0, 1);
  });

  test('local sourcing reduces emissions by 20%', () => {
    const imported: FoodData = { items: [{ category: 'beef', weightKg: 1, source: 'imported' }] };
    const local: FoodData = { items: [{ category: 'beef', weightKg: 1, source: 'local' }] };
    expect(calculateFoodCO2(local)).toBeCloseTo(calculateFoodCO2(imported) * 0.8, 1);
  });

  test('multiple items sum correctly', () => {
    const data: FoodData = {
      items: [
        { category: 'chicken', weightKg: 1 },
        { category: 'vegetables', weightKg: 2 },
      ],
    };
    expect(calculateFoodCO2(data)).toBeCloseTo(6.9 + 4.0, 1);
  });

  test('empty items produce zero', () => {
    expect(calculateFoodCO2({ items: [] })).toBe(0);
  });
});

// ─── Energy Tests ────────────────────────────────────────

describe('calculateEnergyCO2', () => {
  test('300 kWh in India = ~212.4 kg CO2', () => {
    const data: EnergyData = { electricityKwh: 300, country: 'IN' };
    expect(calculateEnergyCO2(data)).toBeCloseTo(212.4, 0);
  });

  test('100% renewable = zero electricity emissions', () => {
    const data: EnergyData = { electricityKwh: 300, country: 'IN', renewablePercent: 100 };
    expect(calculateEnergyCO2(data)).toBe(0);
  });

  test('50% renewable halves electricity emissions', () => {
    const full: EnergyData = { electricityKwh: 300, country: 'IN' };
    const half: EnergyData = { electricityKwh: 300, country: 'IN', renewablePercent: 50 };
    expect(calculateEnergyCO2(half)).toBeCloseTo(calculateEnergyCO2(full) / 2, 0);
  });

  test('includes natural gas and LPG', () => {
    const data: EnergyData = {
      electricityKwh: 0,
      country: 'IN',
      naturalGasM3: 10,
      lpgKg: 5,
    };
    const result = calculateEnergyCO2(data);
    expect(result).toBeCloseTo(10 * 2.204 + 5 * 2.983, 1);
  });

  test('France has much lower grid factor than India', () => {
    const france = calculateEnergyCO2({ electricityKwh: 100, country: 'FR' });
    const india = calculateEnergyCO2({ electricityKwh: 100, country: 'IN' });
    expect(france).toBeLessThan(india * 0.1); // France ~10x cleaner
  });
});

// ─── Shopping Tests ──────────────────────────────────────

describe('calculateShoppingCO2', () => {
  test('1 clothing item = 20 kg CO2', () => {
    const data: ShoppingData = { items: [{ category: 'clothing', quantity: 1 }] };
    expect(calculateShoppingCO2(data)).toBe(20);
  });

  test('other category uses spend-based calculation', () => {
    const data: ShoppingData = {
      items: [{ category: 'other', quantity: 1, estimatedValueINR: 2000 }],
    };
    expect(calculateShoppingCO2(data)).toBeCloseTo(1.0, 1); // 2000/1000 * 0.5
  });
});

// ─── Equivalences Tests ─────────────────────────────────

describe('getCO2Equivalences', () => {
  test('100 kg CO2 equivalences', () => {
    const eq = getCO2Equivalences(100);
    expect(eq.treesNeededYear).toBe(5);       // 100/21
    expect(eq.kmByPetrolCar).toBe(521);       // 100/0.192
    expect(eq.smartphoneCharges).toBe(12500);  // 100/0.008
  });

  test('zero emissions return zero equivalences', () => {
    const eq = getCO2Equivalences(0);
    expect(eq.treesNeededYear).toBe(0);
    expect(eq.kmByPetrolCar).toBe(0);
    expect(eq.smartphoneCharges).toBe(0);
  });
});

// ─── Total Breakdown Tests ──────────────────────────────

describe('calculateTotalBreakdown', () => {
  test('sums all categories correctly', () => {
    const result = calculateTotalBreakdown(
      { mode: 'car', distanceKm: 100, fuelType: 'petrol' },
      { items: [{ category: 'chicken', weightKg: 1 }] },
      { electricityKwh: 100, country: 'IN' },
      { items: [{ category: 'clothing', quantity: 1 }] }
    );

    expect(result.totalKgCO2).toBeGreaterThan(0);
    expect(result.breakdown.transportKg).toBeCloseTo(19.2, 1);
    expect(result.breakdown.foodKg).toBeCloseTo(6.9, 1);
    expect(result.breakdown.energyKg).toBeCloseTo(70.8, 0);
    expect(result.breakdown.shoppingKg).toBe(20);
  });
});
