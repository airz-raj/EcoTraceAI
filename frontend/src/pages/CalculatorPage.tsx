/**
 * EcoTrace AI — Calculator Page
 *
 * Tabbed interface for Transport, Food, Energy, and Shopping calculators.
 * Each form calculates emissions and allows saving to entries.
 */

import { useState, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { TransportForm } from '../components/calculator/TransportForm';
import { FoodForm } from '../components/calculator/FoodForm';
import { EnergyForm } from '../components/calculator/EnergyForm';
import { ShoppingForm } from '../components/calculator/ShoppingForm';
import { useCarbonContext } from '../context/CarbonContext';
import type { TransportData, FoodData, EnergyData, ShoppingData, CarbonEntry } from '../types';

type Tab = 'transport' | 'food' | 'energy' | 'shopping';

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: 'transport', label: 'Transport', icon: '🚗' },
  { id: 'food', label: 'Food', icon: '🍽️' },
  { id: 'energy', label: 'Energy', icon: '⚡' },
  { id: 'shopping', label: 'Shopping', icon: '🛍️' },
];

export function CalculatorPage() {
  const [activeTab, setActiveTab] = useState<Tab>('transport');
  const { addEntry, state } = useCarbonContext();

  // Accumulated calculation results for the current session
  const [results, setResults] = useState<{
    transport?: { data: TransportData; co2: number };
    food?: { data: FoodData; co2: number };
    energy?: { data: EnergyData; co2: number };
    shopping?: { data: ShoppingData; co2: number };
  }>({});

  const handleTransportCalc = useCallback((data: TransportData, co2: number) => {
    setResults((prev) => ({ ...prev, transport: { data, co2 } }));
  }, []);

  const handleFoodCalc = useCallback((data: FoodData, co2: number) => {
    setResults((prev) => ({ ...prev, food: { data, co2 } }));
  }, []);

  const handleEnergyCalc = useCallback((data: EnergyData, co2: number) => {
    setResults((prev) => ({ ...prev, energy: { data, co2 } }));
  }, []);

  const handleShoppingCalc = useCallback((data: ShoppingData, co2: number) => {
    setResults((prev) => ({ ...prev, shopping: { data, co2 } }));
  }, []);

  const totalCO2 = Object.values(results).reduce((sum, r) => sum + (r?.co2 ?? 0), 0);
  const hasResults = Object.keys(results).length > 0;

  const handleSaveEntry = () => {
    if (!hasResults) return;

    const entry: CarbonEntry = {
      id: uuidv4(),
      date: new Date().toISOString(),
      transport: results.transport?.data ?? { mode: 'walk', distanceKm: 0 },
      food: results.food?.data ?? { items: [] },
      energy: results.energy?.data ?? { electricityKwh: 0, country: state.userCountry },
      shopping: results.shopping?.data ?? { items: [] },
      totalKgCO2: totalCO2,
      breakdown: {
        transportKg: results.transport?.co2 ?? 0,
        foodKg: results.food?.co2 ?? 0,
        energyKg: results.energy?.co2 ?? 0,
        shoppingKg: results.shopping?.co2 ?? 0,
        digitalKg: 0,
      },
    };

    addEntry(entry);
    setResults({});
  };

  return (
    <div className="space-y-6">
      <header className="animate-fade-in">
        <h1 className="text-3xl font-bold text-white mb-1">
          <span className="gradient-text">Carbon Calculator</span>
        </h1>
        <p className="text-slate-400">
          Calculate your emissions across transport, food, energy & shopping
        </p>
      </header>

      {/* Tab Navigation */}
      <div
        className="flex gap-1 p-1 rounded-xl bg-white/5 overflow-x-auto"
        role="tablist"
        aria-label="Calculator categories"
      >
        {TABS.map((tab) => (
          <button
            key={tab.id}
            role="tab"
            aria-selected={activeTab === tab.id}
            aria-controls={`panel-${tab.id}`}
            id={`tab-${tab.id}`}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
              activeTab === tab.id
                ? 'bg-emerald-500/20 text-emerald-300 shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <span role="img" aria-hidden="true">{tab.icon}</span>
            {tab.label}
            {results[tab.id] && (
              <span className="badge badge-eco text-xs ml-1">
                {results[tab.id]!.co2.toFixed(1)}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab Panels */}
      <div className="glass-card p-6">
        <div
          id="panel-transport"
          role="tabpanel"
          aria-labelledby="tab-transport"
          hidden={activeTab !== 'transport'}
        >
          {activeTab === 'transport' && <TransportForm onCalculate={handleTransportCalc} />}
        </div>
        <div
          id="panel-food"
          role="tabpanel"
          aria-labelledby="tab-food"
          hidden={activeTab !== 'food'}
        >
          {activeTab === 'food' && <FoodForm onCalculate={handleFoodCalc} />}
        </div>
        <div
          id="panel-energy"
          role="tabpanel"
          aria-labelledby="tab-energy"
          hidden={activeTab !== 'energy'}
        >
          {activeTab === 'energy' && <EnergyForm onCalculate={handleEnergyCalc} />}
        </div>
        <div
          id="panel-shopping"
          role="tabpanel"
          aria-labelledby="tab-shopping"
          hidden={activeTab !== 'shopping'}
        >
          {activeTab === 'shopping' && <ShoppingForm onCalculate={handleShoppingCalc} />}
        </div>
      </div>

      {/* Total & Save */}
      {hasResults && (
        <div className="glass-card p-6 animate-slide-up">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="stat-label">Session Total</p>
              <p className="stat-value gradient-text">{totalCO2.toFixed(1)} kg CO₂</p>
            </div>
            <button onClick={handleSaveEntry} className="btn-primary">
              💾 Save Entry
            </button>
          </div>

          {/* Per-category breakdown */}
          <div className="flex flex-wrap gap-3">
            {results.transport && (
              <span className="badge badge-eco">🚗 {results.transport.co2.toFixed(1)} kg</span>
            )}
            {results.food && (
              <span className="badge badge-warn">🍽️ {results.food.co2.toFixed(1)} kg</span>
            )}
            {results.energy && (
              <span className="badge badge-info">⚡ {results.energy.co2.toFixed(1)} kg</span>
            )}
            {results.shopping && (
              <span className="badge" style={{ background: 'rgba(168,85,247,0.15)', color: '#c084fc' }}>
                🛍️ {results.shopping.co2.toFixed(1)} kg
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
