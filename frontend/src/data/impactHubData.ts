export const PARIS_BUDGET_TONNES = 2.3;
export const INDIA_AVG_TONNES = 1.9;
export const GLOBAL_AVG_TONNES = 4.7;
export const US_AVG_TONNES = 14.9;

export interface Scenario {
  id: string;
  title: string;
  description: string;
  icon: string;
  savingKgPerMonth: number;
  difficulty: 'easy' | 'medium' | 'hard';
  category: 'transport' | 'food' | 'energy' | 'lifestyle';
}

export const SCENARIOS: Scenario[] = [
  { id: 'bus-commute', title: 'Switch to bus/metro for commute', description: 'Replace 20km daily car commute with public transport', icon: '🚌', savingKgPerMonth: 72, difficulty: 'medium', category: 'transport' },
  { id: 'carpool', title: 'Carpool with 3 colleagues', description: 'Share your car ride — split emissions by 4', icon: '🚗', savingKgPerMonth: 48, difficulty: 'easy', category: 'transport' },
  { id: 'wfh-2days', title: 'Work from home 2 days/week', description: 'Eliminate 40% of weekly commute emissions', icon: '🏠', savingKgPerMonth: 29, difficulty: 'easy', category: 'transport' },
  { id: 'veg-3days', title: 'Go vegetarian 3 days/week', description: 'Replace meat meals with plant-based alternatives', icon: '🥬', savingKgPerMonth: 35, difficulty: 'easy', category: 'food' },
  { id: 'no-beef', title: 'Cut beef entirely', description: 'Beef produces 27x more CO₂ than vegetables per kg', icon: '🐄', savingKgPerMonth: 54, difficulty: 'medium', category: 'food' },
  { id: 'local-food', title: 'Buy local produce only', description: 'Reduce transport emissions from imported food by 20%', icon: '🧑‍🌾', savingKgPerMonth: 12, difficulty: 'easy', category: 'food' },
  { id: 'solar', title: 'Switch to rooftop solar', description: 'Eliminate grid electricity emissions entirely', icon: '☀️', savingKgPerMonth: 150, difficulty: 'hard', category: 'energy' },
  { id: 'led-all', title: 'Replace all lights with LEDs', description: 'LEDs use 75% less energy than incandescent bulbs', icon: '💡', savingKgPerMonth: 8, difficulty: 'easy', category: 'energy' },
  { id: 'ac-26', title: 'Set AC to 26°C (not 22°C)', description: 'Each degree warmer saves ~6% on cooling energy', icon: '❄️', savingKgPerMonth: 25, difficulty: 'easy', category: 'energy' },
  { id: 'no-fast-fashion', title: 'Stop fast fashion — buy second-hand', description: 'Fashion industry emits more CO₂ than aviation', icon: '👕', savingKgPerMonth: 15, difficulty: 'medium', category: 'lifestyle' },
  { id: 'no-domestic-flight', title: 'Take train instead of domestic flight', description: 'Trains emit ~90% less CO₂ than flights per km', icon: '🚆', savingKgPerMonth: 42, difficulty: 'medium', category: 'transport' },
  { id: 'compost', title: 'Compost food waste', description: 'Prevent methane from landfill decomposition', icon: '♻️', savingKgPerMonth: 9, difficulty: 'medium', category: 'lifestyle' },
];

export interface ChallengeWeek {
  week: number;
  title: string;
  tasks: string[];
  savingKg: number;
}

export const CHALLENGE_WEEKS: ChallengeWeek[] = [
  { week: 1, title: '🔍 Awareness Week', tasks: ['Calculate your full carbon footprint using EcoTrace', 'Upload your electricity bill to see your energy impact', 'Track 3 days of transport and food choices'], savingKg: 0 },
  { week: 2, title: '🚌 Transport Shift', tasks: ['Take public transport twice this week', 'Walk/bike for trips under 2km', 'Combine errands into one trip'], savingKg: 8 },
  { week: 3, title: '🥗 Food Conscious', tasks: ['Have 3 fully vegetarian days', 'Buy only local produce this week', 'Eliminate food waste — plan meals ahead'], savingKg: 12 },
  { week: 4, title: '⚡ Energy Audit', tasks: ['Set AC to 26°C and monitor comfort', 'Unplug devices on standby (TV, chargers)', 'Switch off lights in unused rooms — build the habit'], savingKg: 6 },
  { week: 5, title: '🔄 Reduce & Reuse', tasks: ['Carry reusable bags and water bottle all week', 'Repair something instead of replacing it', "Donate clothes you haven't worn in 6 months"], savingKg: 4 },
  { week: 6, title: '🏡 Home Optimization', tasks: ['Replace 3 incandescent bulbs with LEDs', 'Run washing machine only with full loads', 'Dry clothes naturally instead of using a dryer'], savingKg: 7 },
  { week: 7, title: '🌿 Community Action', tasks: ['Share EcoTrace with 3 friends/family', 'Start composting kitchen waste', 'Plant a tree or support a plantation drive'], savingKg: 5 },
  { week: 8, title: '📊 Review & Level Up', tasks: ['Re-calculate your footprint — compare with Week 1', 'Set a monthly carbon budget for next 6 months', 'Pick 2 permanent lifestyle changes from What-If scenarios'], savingKg: 10 },
];

export interface ClimateDataPoint {
  title: string;
  value: string;
  description: string;
  source: string;
  severity: 'warning' | 'critical' | 'info';
  icon: string;
}

export const INDIA_CLIMATE_DATA: ClimateDataPoint[] = [
  { title: 'Heatwave Deaths (2024)', value: '40,000+', description: 'India recorded over 40,000 suspected heat-related deaths. Temperature records were broken in 20+ cities.', source: 'India Meteorological Department, 2024', severity: 'critical', icon: '🌡️' },
  { title: 'Monsoon Disruption', value: '±30% variance', description: 'Rainfall patterns have shifted dramatically — causing both severe floods and droughts in the same season.', source: 'IMD Climate Report 2024', severity: 'warning', icon: '🌧️' },
  { title: 'Crop Yield Impact', value: '-15% wheat', description: 'Extreme heat reduced wheat yields in Punjab, Haryana, and UP. Rice paddies face increasing water stress.', source: 'ICAR Agricultural Statistics 2024', severity: 'critical', icon: '🌾' },
  { title: 'Glacier Retreat', value: '40% lost', description: 'Himalayan glaciers have lost 40% of their area since 1850. This threatens water supply for 1.6 billion people.', source: 'ICIMOD Hindu Kush Assessment', severity: 'critical', icon: '🏔️' },
  { title: 'Air Quality Crisis', value: '7 of top 10', description: "7 of the world's 10 most polluted cities are in India. Air pollution causes 1.67 million premature deaths annually.", source: 'Lancet Planetary Health 2024', severity: 'critical', icon: '😷' },
  { title: 'Sea Level Rise', value: '+3.3mm/year', description: 'Indian Ocean sea levels rising faster than global average. Mumbai, Chennai, and Kolkata face inundation risk by 2050.', source: 'IPCC AR6 WG2', severity: 'warning', icon: '🌊' },
];
