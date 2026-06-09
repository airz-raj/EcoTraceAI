/**
 * EcoTrace AI — Shopping Calculator Form
 */

import { useState } from 'react';
import type { ShoppingData, ShoppingItem, ShoppingCategory } from '../../types';
import { calculateShoppingCO2 } from '../../utils/carbonFormulas';

const CATEGORIES: { value: ShoppingCategory; label: string; icon: string }[] = [
  { value: 'clothing', label: 'Clothing', icon: '👕' },
  { value: 'electronics', label: 'Electronics', icon: '📱' },
  { value: 'furniture', label: 'Furniture', icon: '🪑' },
  { value: 'delivery', label: 'Online Delivery', icon: '📦' },
  { value: 'other', label: 'Other', icon: '🛒' },
];

interface ShoppingFormProps {
  onCalculate: (data: ShoppingData, co2: number) => void;
}

export function ShoppingForm({ onCalculate }: ShoppingFormProps) {
  const [items, setItems] = useState<ShoppingItem[]>([
    { category: 'clothing', quantity: 0 },
  ]);
  const [result, setResult] = useState<number | null>(null);

  const addItem = () => {
    setItems([...items, { category: 'other', quantity: 0 }]);
  };

  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const updateItem = (index: number, field: keyof ShoppingItem, value: string | number) => {
    setItems(
      items.map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      )
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validItems = items.filter((item) => item.quantity > 0);
    if (validItems.length === 0) return;

    const data: ShoppingData = { items: validItems };
    const co2 = calculateShoppingCO2(data);
    setResult(co2);
    onCalculate(data, co2);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4" aria-label="Shopping emission calculator">
      <fieldset>
        <legend className="input-label mb-3">Shopping Items</legend>

        {items.map((item, index) => (
          <div
            key={index}
            className="flex flex-wrap gap-2 mb-3 p-3 rounded-lg bg-white/3 border border-white/5"
          >
            <div className="flex-1 min-w-[140px]">
              <label htmlFor={`shop-cat-${index}`} className="input-label">Category</label>
              <select
                id={`shop-cat-${index}`}
                className="input-field text-sm"
                value={item.category}
                onChange={(e) => updateItem(index, 'category', e.target.value as ShoppingCategory)}
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.icon} {cat.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="w-24">
              <label htmlFor={`shop-qty-${index}`} className="input-label">Quantity</label>
              <input
                id={`shop-qty-${index}`}
                type="number"
                min="0"
                className="input-field text-sm"
                value={item.quantity || ''}
                onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 0)}
                required
              />
            </div>

            {item.category === 'other' && (
              <div className="w-32">
                <label htmlFor={`shop-val-${index}`} className="input-label">Value (₹)</label>
                <input
                  id={`shop-val-${index}`}
                  type="number"
                  min="0"
                  className="input-field text-sm"
                  placeholder="₹"
                  value={item.estimatedValueINR || ''}
                  onChange={(e) => updateItem(index, 'estimatedValueINR', parseFloat(e.target.value) || 0)}
                />
              </div>
            )}

            {items.length > 1 && (
              <button
                type="button"
                onClick={() => removeItem(index)}
                className="self-end p-2 text-red-400 hover:text-red-300 rounded-lg"
                aria-label={`Remove item ${index + 1}`}
              >
                ✕
              </button>
            )}
          </div>
        ))}

        <button type="button" onClick={addItem} className="btn-secondary text-sm w-full">
          + Add Another Item
        </button>
      </fieldset>

      <button type="submit" className="btn-primary w-full">
        Calculate Shopping Emissions
      </button>

      {result !== null && (
        <div
          className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/20 text-center animate-fade-in"
          role="status"
          aria-live="polite"
        >
          <p className="text-sm text-slate-400">Shopping Emissions</p>
          <p className="text-2xl font-bold text-purple-400">{result.toFixed(1)} kg CO₂</p>
        </div>
      )}
    </form>
  );
}
