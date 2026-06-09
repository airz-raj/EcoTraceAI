/**
 * EcoTrace AI — Core Type Definitions
 *
 * Centralized type system driving the entire application.
 * All emission calculations, API payloads, and UI components
 * derive their types from this file.
 *
 * Sources: IPCC AR6 categories, UK BEIS 2023, India CEA 2022
 */

// ─── Transport ───────────────────────────────────────────────

/** Supported modes of transport for carbon calculation */
export type TransportMode =
  | 'car'
  | 'bus'
  | 'train'
  | 'flight_domestic'
  | 'flight_international'
  | 'bike'
  | 'walk'
  | 'motorcycle'
  | 'ev';

/** Fuel types applicable to motorized transport */
export type FuelType = 'petrol' | 'diesel' | 'electric' | 'hybrid' | 'cng';

/** User-submitted transport data for emission calculation */
export interface TransportData {
  /** Selected mode of transportation */
  mode: TransportMode;
  /** Distance traveled in kilometers */
  distanceKm: number;
  /** Fuel type (relevant for cars, motorcycles) */
  fuelType?: FuelType;
  /** Number of passengers for carpooling discount (>1 splits emissions) */
  passengerCount?: number;
}

// ─── Food ────────────────────────────────────────────────────

/** Recognized food categories with emission factors */
export type FoodCategory =
  | 'beef'
  | 'lamb'
  | 'pork'
  | 'chicken'
  | 'fish'
  | 'dairy'
  | 'eggs'
  | 'vegetables'
  | 'fruits'
  | 'legumes'
  | 'grains'
  | 'processed';

/** Individual food item with weight and optional source */
export interface FoodItem {
  /** Food category mapped to emission factor */
  category: FoodCategory;
  /** Weight in kilograms */
  weightKg: number;
  /** Local sourcing reduces emissions by 20% */
  source?: 'local' | 'imported';
}

/** Collection of food items for daily/weekly tracking */
export interface FoodData {
  items: FoodItem[];
}

// ─── Energy ──────────────────────────────────────────────────

/** Energy consumption data for household emission calculations */
export interface EnergyData {
  /** Electricity consumed in kilowatt-hours */
  electricityKwh: number;
  /** ISO 3166-1 alpha-2 country code for grid factor lookup */
  country: string;
  /** Natural gas consumption in cubic meters */
  naturalGasM3?: number;
  /** LPG consumption in kilograms */
  lpgKg?: number;
  /** Percentage of energy from renewable sources (solar/green tariff) */
  renewablePercent?: number;
}

// ─── Shopping ────────────────────────────────────────────────

/** Shopping item categories with estimated emission factors */
export type ShoppingCategory =
  | 'clothing'
  | 'electronics'
  | 'furniture'
  | 'delivery'
  | 'other';

/** Individual shopping purchase */
export interface ShoppingItem {
  /** Category of purchased item */
  category: ShoppingCategory;
  /** Number of items purchased */
  quantity: number;
  /** Estimated value in INR for spend-based calculation ('other' category) */
  estimatedValueINR?: number;
}

/** Collection of shopping items */
export interface ShoppingData {
  items: ShoppingItem[];
}

// ─── Digital Footprint ───────────────────────────────────────

/** Digital device power consumption data from CLI agent */
export interface DigitalFootprint {
  /** CPU model identifier */
  cpuModel: string;
  /** Average CPU utilization percentage */
  avgCpuPercent: number;
  /** Total RAM in gigabytes */
  ramTotalGb: number;
  /** Estimated power draw in watts */
  drawWatts: number;
  /** Estimated daily energy consumption in kWh */
  dailyKwh: number;
  /** Estimated monthly energy consumption in kWh */
  monthlyKwh: number;
  /** Carbon emissions from device usage in kg CO2 */
  co2Kg: number;
}

// ─── Parsed Bill Data ────────────────────────────────────────

/** Result from OCR bill/receipt parsing */
export interface ParsedBillData {
  /** Detected kWh consumption (null if extraction failed) */
  kwhConsumed: number | null;
  /** Detected billing period */
  billingPeriod: string | null;
  /** Confidence score 0-1 of the OCR extraction */
  confidence: number;
  /** Raw extracted text for user verification */
  rawText?: string;
}

/** Result from receipt item parsing */
export interface ParsedReceiptData {
  /** Identified food items from receipt */
  items: Array<{
    name: string;
    category: FoodCategory;
    confidence: number;
  }>;
  /** Total amount detected */
  totalAmount?: number;
}

// ─── Carbon Entry (Core Data Model) ─────────────────────────

/** Complete carbon footprint entry with all category breakdowns */
export interface CarbonEntry {
  /** Unique entry identifier */
  id: string;
  /** ISO 8601 date string */
  date: string;
  /** Transport emission data */
  transport: TransportData;
  /** Food emission data */
  food: FoodData;
  /** Energy consumption data */
  energy: EnergyData;
  /** Shopping/consumption data */
  shopping: ShoppingData;
  /** Optional digital device footprint from CLI agent */
  digital?: DigitalFootprint;
  /** Optional parsed bill data from OCR */
  parsed?: ParsedBillData;
  /** Total calculated CO2 emissions in kg */
  totalKgCO2: number;
  /** Breakdown by category in kg CO2 */
  breakdown: CarbonBreakdown;
}

/** Category-level emission breakdown */
export interface CarbonBreakdown {
  transportKg: number;
  foodKg: number;
  energyKg: number;
  shoppingKg: number;
  digitalKg: number;
}

// ─── CO2 Equivalences ────────────────────────────────────────

/** Human-friendly equivalences for CO2 amounts */
export interface CO2Equivalences {
  /** Trees needed to absorb this CO2 in one year */
  treesNeededYear: number;
  /** Equivalent km driven by a petrol car */
  kmByPetrolCar: number;
  /** Equivalent smartphone charges */
  smartphoneCharges: number;
}

// ─── AI & Recommendations ───────────────────────────────────

/** AI processing tier used for recommendations */
export type AITier = 'algorithmic' | 'browser_ai' | 'ollama';

/** Personalized recommendation from AI orchestrator */
export interface Recommendation {
  /** Unique recommendation ID */
  id: string;
  /** Category this recommendation applies to */
  category: keyof CarbonBreakdown;
  /** Short title */
  title: string;
  /** Detailed recommendation text */
  description: string;
  /** Estimated CO2 savings in kg if followed */
  potentialSavingKg: number;
  /** Difficulty level for user */
  difficulty: 'easy' | 'medium' | 'hard';
  /** Priority score (higher = more impactful) */
  priority: number;
}

/** Response from AI orchestrator */
export interface AIInsightResponse {
  recommendations: Recommendation[];
  /** Which AI tier produced the result */
  tier: AITier;
}

// ─── App State ───────────────────────────────────────────────

/** Global application state managed via React Context + useReducer */
export interface AppState {
  /** All carbon entries */
  entries: CarbonEntry[];
  /** Currently active entry being edited */
  currentEntry: Partial<CarbonEntry> | null;
  /** User's country for grid factor calculations */
  userCountry: string;
  /** Loading state for async operations */
  isLoading: boolean;
  /** Error message if any */
  error: string | null;
  /** AI-generated recommendations */
  insights: AIInsightResponse | null;
  /** Dark mode toggle */
  darkMode: boolean;
}

/** All possible actions for the app reducer */
export type AppAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'ADD_ENTRY'; payload: CarbonEntry }
  | { type: 'UPDATE_ENTRY'; payload: CarbonEntry }
  | { type: 'DELETE_ENTRY'; payload: string }
  | { type: 'SET_CURRENT_ENTRY'; payload: Partial<CarbonEntry> | null }
  | { type: 'SET_COUNTRY'; payload: string }
  | { type: 'SET_INSIGHTS'; payload: AIInsightResponse | null }
  | { type: 'TOGGLE_DARK_MODE' }
  | { type: 'LOAD_ENTRIES'; payload: CarbonEntry[] };
