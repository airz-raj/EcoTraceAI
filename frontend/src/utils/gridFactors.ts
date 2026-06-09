/**
 * EcoTrace AI — Grid Emission Factors
 *
 * Country-specific electricity grid emission factors.
 * Sources: IEA 2023, India CEA 2022, EPA eGRID 2023
 *
 * Values in kg CO2 per kWh of electricity consumed.
 */

/** Grid emission factors by ISO 3166-1 alpha-2 country code */
const GRID_FACTORS_KG_PER_KWH: Record<string, number> = {
  IN: 0.708,    // India — Central Electricity Authority 2022
  US: 0.386,    // USA — EPA eGRID 2023 average
  GB: 0.233,    // UK — BEIS 2023
  DE: 0.366,    // Germany — UBA 2023
  FR: 0.052,    // France — largely nuclear
  CN: 0.581,    // China — IEA 2023
  AU: 0.790,    // Australia — high coal share
  CA: 0.160,    // Canada — hydro-dominant
  BR: 0.074,    // Brazil — hydro-dominant
  JP: 0.457,    // Japan — IEA 2023
  KR: 0.459,    // South Korea
  ZA: 0.928,    // South Africa — highest coal dependency
  RU: 0.339,    // Russia
  SE: 0.013,    // Sweden — near-zero grid
  NO: 0.008,    // Norway — near-zero grid
  NZ: 0.100,    // New Zealand
  SG: 0.408,    // Singapore
  AE: 0.555,    // UAE
  SA: 0.622,    // Saudi Arabia
  MX: 0.423,    // Mexico
  DEFAULT: 0.475, // World average fallback
};

/** All supported country codes */
export const SUPPORTED_COUNTRIES = Object.keys(GRID_FACTORS_KG_PER_KWH).filter(
  (k) => k !== 'DEFAULT'
);

/** Country display names for UI dropdowns */
export const COUNTRY_NAMES: Record<string, string> = {
  IN: 'India',
  US: 'United States',
  GB: 'United Kingdom',
  DE: 'Germany',
  FR: 'France',
  CN: 'China',
  AU: 'Australia',
  CA: 'Canada',
  BR: 'Brazil',
  JP: 'Japan',
  KR: 'South Korea',
  ZA: 'South Africa',
  RU: 'Russia',
  SE: 'Sweden',
  NO: 'Norway',
  NZ: 'New Zealand',
  SG: 'Singapore',
  AE: 'UAE',
  SA: 'Saudi Arabia',
  MX: 'Mexico',
};

/**
 * Get the grid emission factor for a given country.
 *
 * @param countryCode - ISO 3166-1 alpha-2 country code
 * @returns Emission factor in kg CO2 per kWh
 */
export function getGridFactor(countryCode: string): number {
  return GRID_FACTORS_KG_PER_KWH[countryCode.toUpperCase()] ?? GRID_FACTORS_KG_PER_KWH.DEFAULT;
}

/**
 * Get the grid cleanliness rating for a country.
 *
 * @param countryCode - ISO 3166-1 alpha-2 country code
 * @returns Rating from 'very_clean' to 'very_dirty'
 */
export function getGridRating(countryCode: string): 'very_clean' | 'clean' | 'moderate' | 'dirty' | 'very_dirty' {
  const factor = getGridFactor(countryCode);
  if (factor < 0.1) return 'very_clean';
  if (factor < 0.25) return 'clean';
  if (factor < 0.45) return 'moderate';
  if (factor < 0.7) return 'dirty';
  return 'very_dirty';
}
