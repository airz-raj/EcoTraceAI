/**
 * EcoTrace AI — Bill Parser Unit Tests
 */

import { parseElectricityBill, parseGroceryReceipt, detectBillType } from '../../services/billParser';

describe('parseElectricityBill', () => {
  test('extracts kWh from standard format', () => {
    const result = parseElectricityBill('Units Consumed: 245 kWh');
    expect(result.kwhConsumed).toBe(245);
    expect(result.confidence).toBeGreaterThan(0.7);
  });

  test('extracts kWh from alternative format', () => {
    const result = parseElectricityBill('Total Energy Consumed 312 kwh');
    expect(result.kwhConsumed).toBe(312);
  });

  test('extracts billing period month', () => {
    const result = parseElectricityBill('Billing Period: January 2024 Units Consumed: 200 kWh');
    expect(result.billingPeriod).toBe('january');
  });

  test('returns null for unrecognizable text', () => {
    const result = parseElectricityBill('random text with no numbers');
    expect(result.kwhConsumed).toBeNull();
    expect(result.confidence).toBeLessThan(0.5);
  });

  test('preserves raw text', () => {
    const text = 'Some bill text 100 kWh';
    const result = parseElectricityBill(text);
    expect(result.rawText).toBe(text);
  });
});

describe('parseGroceryReceipt', () => {
  test('classifies food items from receipt text', () => {
    const text = 'chicken breast 500g\nspinach 200g\nmilk 1L';
    const result = parseGroceryReceipt(text);
    expect(result.items.length).toBeGreaterThan(0);
    expect(result.items.some(i => i.category === 'chicken')).toBe(true);
  });

  test('extracts total amount', () => {
    const text = 'chicken breast\nTotal: Rs. 450.00';
    const result = parseGroceryReceipt(text);
    expect(result.totalAmount).toBe(450);
  });

  test('handles empty text', () => {
    const result = parseGroceryReceipt('');
    expect(result.items).toHaveLength(0);
  });
});

describe('detectBillType', () => {
  test('detects electricity bill', () => {
    expect(detectBillType('units consumed 200 kwh meter reading')).toBe('electricity');
  });

  test('detects receipt', () => {
    expect(detectBillType('qty 2 price 100 total amount receipt')).toBe('receipt');
  });

  test('returns unknown for ambiguous text', () => {
    expect(detectBillType('hello world')).toBe('unknown');
  });
});
