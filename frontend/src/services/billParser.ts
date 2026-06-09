/**
 * EcoTrace AI — Bill & Receipt Parser Service
 *
 * Extracts structured data from OCR text output.
 * Handles electricity bills and grocery receipts.
 */

import type { ParsedBillData, ParsedReceiptData, FoodCategory } from '../types';
import { classifyMultipleItems } from '../utils/itemClassifier';

// ─── Electricity Bill Patterns ───────────────────────────────

/** Regex patterns for kWh extraction from electricity bills */
const ELECTRICITY_PATTERNS: RegExp[] = [
  /(\d+(?:\.\d+)?)\s*kwh/gi,
  /units\s*(?:consumed|used)?\s*:?\s*(\d+(?:\.\d+)?)/gi,
  /energy\s*(?:consumed|used|charges?)?\s*:?\s*(\d+(?:\.\d+)?)\s*(?:kwh|units)/gi,
  /consumption\s*:?\s*(\d+(?:\.\d+)?)\s*(?:kwh|units)/gi,
  /total\s*units?\s*:?\s*(\d+(?:\.\d+)?)/gi,
];

/** Regex pattern for billing period extraction */
const MONTH_PATTERN = /(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*/gi;

/** Regex pattern for total amount extraction */
const AMOUNT_PATTERNS: RegExp[] = [
  /(?:total|amount|net)\s*(?:payable|due|amount)?\s*:?\s*(?:rs\.?|₹|inr)?\s*(\d+(?:,\d{3})*(?:\.\d{2})?)/gi,
  /(?:rs\.?|₹|inr)\s*(\d+(?:,\d{3})*(?:\.\d{2})?)/gi,
];

// ─── Parse Functions ─────────────────────────────────────────

/**
 * Parse electricity bill text to extract kWh consumption and billing period.
 *
 * @param text - Raw OCR text from electricity bill image
 * @returns Structured bill data with confidence score
 *
 * @example
 * ```ts
 * parseElectricityBill("Units Consumed: 245 kWh\nBilling Period: January 2024")
 * // { kwhConsumed: 245, billingPeriod: 'january', confidence: 0.9 }
 * ```
 */
export function parseElectricityBill(text: string): ParsedBillData {
  const normalizedText = text.toLowerCase().replace(/\s+/g, ' ');

  let kwhConsumed: number | null = null;

  // Try each pattern until we find a match
  for (const pattern of ELECTRICITY_PATTERNS) {
    // Reset regex state for each attempt
    pattern.lastIndex = 0;
    const match = pattern.exec(normalizedText);
    if (match) {
      kwhConsumed = parseFloat(match[1]);
      break;
    }
  }

  // Extract billing period
  const months = [...normalizedText.matchAll(MONTH_PATTERN)].map((m) => m[0]);

  return {
    kwhConsumed,
    billingPeriod: months[0] ?? null,
    confidence: kwhConsumed !== null ? 0.9 : 0.3,
    rawText: text,
  };
}

/**
 * Parse grocery receipt text to identify food items and categories.
 *
 * @param text - Raw OCR text from receipt image
 * @returns Classified food items with confidence scores
 */
export function parseGroceryReceipt(text: string): ParsedReceiptData {
  // Split text into lines, filter out empty ones
  const lines = text
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 2);

  // Classify each line as a potential food item
  const classifiedItems = classifyMultipleItems(lines);

  // Weight extraction patterns (500g, 1kg, 1.5L, etc.)
  const WEIGHT_PATTERN = /(\d+(?:\.\d+)?)\s*(?:kg|kgs)/gi;
  const GRAMS_PATTERN = /(\d+(?:\.\d+)?)\s*(?:g|gm|gms|gram)/gi;
  const LITRE_PATTERN = /(\d+(?:\.\d+)?)\s*(?:l|lt|ltr|litre|liter)/gi;

  // Default weights per category (kg) when weight can't be extracted
  const DEFAULT_WEIGHTS: Record<string, number> = {
    beef: 0.5, lamb: 0.5, pork: 0.5, chicken: 0.5,
    fish: 0.3, dairy: 0.5, eggs: 0.36, // ~6 eggs
    vegetables: 0.5, fruits: 0.5, legumes: 0.5,
    grains: 1.0, processed: 0.3,
  };

  // Extract total amount
  let totalAmount: number | undefined;
  for (const pattern of AMOUNT_PATTERNS) {
    pattern.lastIndex = 0;
    const match = pattern.exec(text.toLowerCase());
    if (match) {
      totalAmount = parseFloat(match[1].replace(/,/g, ''));
      break;
    }
  }

  return {
    items: classifiedItems.map((item) => {
      let estimatedWeightKg = DEFAULT_WEIGHTS[item.category] ?? 0.5;

      // Try to extract actual weight from the line
      const line = item.name.toLowerCase();

      WEIGHT_PATTERN.lastIndex = 0;
      const kgMatch = WEIGHT_PATTERN.exec(line);
      if (kgMatch) {
        estimatedWeightKg = parseFloat(kgMatch[1]);
      } else {
        GRAMS_PATTERN.lastIndex = 0;
        const gMatch = GRAMS_PATTERN.exec(line);
        if (gMatch) {
          estimatedWeightKg = parseFloat(gMatch[1]) / 1000;
        } else {
          LITRE_PATTERN.lastIndex = 0;
          const lMatch = LITRE_PATTERN.exec(line);
          if (lMatch) {
            estimatedWeightKg = parseFloat(lMatch[1]); // 1L ≈ 1kg
          }
        }
      }

      return {
        name: item.name,
        category: item.category as FoodCategory,
        confidence: item.confidence,
        estimatedWeightKg,
      };
    }),
    totalAmount,
  };
}

/**
 * Determine if text looks like an electricity bill or grocery receipt.
 *
 * @param text - Raw OCR text
 * @returns 'electricity' | 'receipt' | 'unknown'
 */
export function detectBillType(text: string): 'electricity' | 'receipt' | 'unknown' {
  const lower = text.toLowerCase();

  const electricityKeywords = ['kwh', 'units consumed', 'electricity', 'meter', 'tariff', 'billing period', 'power'];
  const receiptKeywords = ['total', 'qty', 'quantity', 'price', 'amount', 'bill no', 'invoice', 'receipt'];

  const electricityScore = electricityKeywords.filter((kw) => lower.includes(kw)).length;
  const receiptScore = receiptKeywords.filter((kw) => lower.includes(kw)).length;

  if (electricityScore >= 2) return 'electricity';
  if (receiptScore >= 2) return 'receipt';
  if (electricityScore > receiptScore) return 'electricity';
  if (receiptScore > electricityScore) return 'receipt';
  return 'unknown';
}
