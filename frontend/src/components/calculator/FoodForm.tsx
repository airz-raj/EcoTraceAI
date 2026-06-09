/**
 * EcoTrace AI — Food Calculator Form
 *
 * Allows adding multiple food items with category and weight.
 */

import { useState } from 'react';
import type { FoodCategory, FoodData, FoodItem } from '../../types';
import { calculateFoodCO2 } from '../../utils/carbonFormulas';
import { getFoodCategoryLabels } from '../../utils/itemClassifier';

const categoryLabels = getFoodCategoryLabels();

interface FoodFormProps {
  onCalculate: (data: FoodData, co2: number) => void;
}

export function FoodForm({ onCalculate }: FoodFormProps) {
  const [items, setItems] = useState<FoodItem[]>([
    { category: 'chicken', weightKg: 0, source: 'local' },
  ]);
  const [result, setResult] = useState<number | null>(null);

  const addItem = () => {
    setItems([...items, { category: 'vegetables', weightKg: 0, source: 'local' }]);
  };

  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const updateItem = (index: number, field: keyof FoodItem, value: string | number) => {
    setItems(
      items.map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      )
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validItems = items.filter((item) => item.weightKg > 0);
    if (validItems.length === 0) return;

    const data: FoodData = { items: validItems };
    const co2 = calculateFoodCO2(data);
    setResult(co2);
    onCalculate(data, co2);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4" aria-label="Food emission calculator">
      <fieldset>
        <legend className="input-label mb-3">Food Items</legend>

        {items.map((item, index) => (
          <div
            key={index}
            className="flex flex-wrap gap-2 mb-3 p-3 rounded-lg bg-white/3 border border-white/5"
          >
            <div className="flex-1 min-w-[140px]">
              <label htmlFor={`food-cat-${index}`} className="input-label">
                Category
              </label>
              <select
                id={`food-cat-${index}`}
                className="input-field text-sm"
                value={item.category}
                onChange={(e) => updateItem(index, 'category', e.target.value as FoodCategory)}
              >
                {Object.entries(categoryLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            <div className="w-24">
              <label htmlFor={`food-weight-${index}`} className="input-label">
                Weight (kg)
              </label>
              <input
                id={`food-weight-${index}`}
                type="number"
                min="0"
                step="0.1"
                className="input-field text-sm"
                placeholder="0.5"
                value={item.weightKg || ''}
                onChange={(e) => updateItem(index, 'weightKg', parseFloat(e.target.value) || 0)}
                required
              />
            </div>

            <div className="w-28">
              <label htmlFor={`food-source-${index}`} className="input-label">
                Source
              </label>
              <select
                id={`food-source-${index}`}
                className="input-field text-sm"
                value={item.source || 'local'}
                onChange={(e) => updateItem(index, 'source', e.target.value as 'local' | 'imported')}
              >
                <option value="local">Local</option>
                <option value="imported">Imported</option>
              </select>
            </div>

            {items.length > 1 && (
              <button
                type="button"
                onClick={() => removeItem(index)}
                className="self-end p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
                aria-label={`Remove food item ${index + 1}`}
              >
                ✕
              </button>
            )}
          </div>
        ))}

        <button
          type="button"
          onClick={addItem}
          className="btn-secondary text-sm w-full"
        >
          + Add Another Item
        </button>
      </fieldset>

      <button type="submit" className="btn-primary w-full">
        Calculate Food Emissions
      </button>

      {result !== null && (
        <div
          className="p-4 rounded-xl bg-orange-500/10 border border-orange-500/20 text-center animate-fade-in"
          role="status"
          aria-live="polite"
        >
          <p className="text-sm text-slate-400">Food Emissions</p>
          <p className="text-2xl font-bold text-orange-400">{result.toFixed(1)} kg CO₂</p>
        </div>
      )}
    </form>
  );
}
