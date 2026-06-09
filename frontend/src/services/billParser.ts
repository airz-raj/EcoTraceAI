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
    items: classifiedItems.map((item) => ({
      name: item.name,
      category: item.category as FoodCategory,
      confidence: item.confidence,
    })),
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
