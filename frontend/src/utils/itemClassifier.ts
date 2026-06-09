/**
 * EcoTrace AI — Food Item Classifier
 *
 * Maps receipt text / food item names to FoodCategory enum values
 * using keyword matching. Used by the bill parser and food form.
 */

import type { FoodCategory } from '../types';

/** Keyword → FoodCategory mapping for receipt text classification */
const FOOD_KEYWORDS: Record<FoodCategory, string[]> = {
  beef: ['beef', 'steak', 'burger', 'mince', 'ribeye', 'sirloin', 'brisket', 'veal'],
  lamb: ['lamb', 'mutton', 'goat', 'keema'],
  pork: ['pork', 'bacon', 'ham', 'sausage', 'salami', 'pepperoni', 'prosciutto'],
  chicken: ['chicken', 'poultry', 'hen', 'wings', 'breast', 'thigh', 'broiler', 'turkey', 'duck'],
  fish: ['fish', 'salmon', 'tuna', 'shrimp', 'prawn', 'crab', 'lobster', 'cod', 'mackerel', 'sardine', 'seafood'],
  dairy: ['milk', 'cheese', 'butter', 'yogurt', 'dahi', 'cream', 'paneer', 'ghee', 'curd', 'whey'],
  eggs: ['egg', 'eggs', 'omelette', 'omelet'],
  vegetables: ['spinach', 'tomato', 'potato', 'aloo', 'onion', 'pyaz', 'carrot', 'broccoli', 'cabbage', 'lettuce', 'pepper', 'cucumber', 'beans', 'peas', 'corn', 'mushroom', 'garlic', 'ginger', 'cauliflower', 'capsicum', 'bhindi', 'okra', 'gobi', 'palak'],
  fruits: ['apple', 'banana', 'orange', 'mango', 'grape', 'strawberry', 'watermelon', 'papaya', 'pineapple', 'kiwi', 'peach', 'plum', 'cherry', 'guava', 'pomegranate', 'lychee', 'berry'],
  legumes: ['lentil', 'dal', 'daal', 'chickpea', 'chole', 'rajma', 'kidney bean', 'soybean', 'tofu', 'moong', 'urad', 'masoor', 'toor', 'chana'],
  grains: ['rice', 'wheat', 'flour', 'atta', 'bread', 'pasta', 'noodle', 'roti', 'naan', 'oat', 'barley', 'quinoa', 'cereal', 'maida', 'suji', 'semolina'],
  processed: ['chips', 'biscuit', 'cookie', 'candy', 'chocolate', 'cake', 'instant', 'frozen', 'canned', 'ready to eat', 'packaged', 'snack', 'soda', 'soft drink', 'juice', 'processed'],
};

/**
 * Classify a food item name into a FoodCategory.
 *
 * @param itemName - Raw item name from receipt or user input
 * @returns Matching FoodCategory or null if unrecognized
 *
 * @example
 * ```ts
 * classifyFoodItem('chicken breast 500g') // 'chicken'
 * classifyFoodItem('paneer tikka')         // 'dairy'
 * classifyFoodItem('xyz unknown')          // null
 * ```
 */
export function classifyFoodItem(itemName: string): FoodCategory | null {
  const normalized = itemName.toLowerCase().trim();

  for (const [category, keywords] of Object.entries(FOOD_KEYWORDS) as [FoodCategory, string[]][]) {
    for (const keyword of keywords) {
      if (normalized.includes(keyword)) {
        return category;
      }
    }
  }

  return null;
}

/**
 * Classify multiple items and return matches with confidence scores.
 *
 * @param items - Array of item name strings
 * @returns Classified items with category and confidence
 */
export function classifyMultipleItems(
  items: string[]
): Array<{ name: string; category: FoodCategory; confidence: number }> {
  return items
    .map((name) => {
      const category = classifyFoodItem(name);
      if (!category) return null;

      // Higher confidence for exact keyword matches
      const normalized = name.toLowerCase().trim();
      const exactMatch = FOOD_KEYWORDS[category].some(
        (kw) => normalized === kw || normalized.startsWith(kw + ' ')
      );

      return {
        name,
        category,
        confidence: exactMatch ? 0.95 : 0.75,
      };
    })
    .filter((item): item is NonNullable<typeof item> => item !== null);
}

/**
 * Get all food categories with their display labels.
 */
export function getFoodCategoryLabels(): Record<FoodCategory, string> {
  return {
    beef: 'Beef & Veal',
    lamb: 'Lamb & Mutton',
    pork: 'Pork',
    chicken: 'Chicken & Poultry',
    fish: 'Fish & Seafood',
    dairy: 'Dairy Products',
    eggs: 'Eggs',
    vegetables: 'Vegetables',
    fruits: 'Fruits',
    legumes: 'Legumes & Pulses',
    grains: 'Grains & Cereals',
    processed: 'Processed Food',
  };
}
