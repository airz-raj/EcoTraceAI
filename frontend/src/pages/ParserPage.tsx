/**
 * EcoTrace AI — Bill Parser Page
 *
 * Complete flow: Upload → OCR → Parse → Calculate CO₂ → Save Entry
 * Now actually converts parsed electricity/receipt data into
 * carbon footprint entries with full breakdown.
 */

import { useState, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { FileUploadZone } from '../components/parser/FileUploadZone';
import { BillInsightCard } from '../components/parser/BillInsightCard';
import { useCarbonContext } from '../context/CarbonContext';
import { calculateEnergyCO2, calculateFoodCO2 } from '../utils/carbonFormulas';
import type {
  ParsedBillData,
  ParsedReceiptData,
  CarbonEntry,
  FoodData,
  FoodItem,
  EnergyData,
} from '../types';

export function ParserPage() {
  const { addEntry, state } = useCarbonContext();
  const [billData, setBillData] = useState<ParsedBillData | null>(null);
  const [receiptData, setReceiptData] = useState<ParsedReceiptData | null>(null);
  const [co2Result, setCo2Result] = useState<{
    totalKg: number;
    category: 'energy' | 'food';
    details: string;
  } | null>(null);
  const [saved, setSaved] = useState(false);

  // ─── Handle Electricity Bill ────────────────────────────
  const handleBillParsed = useCallback(
    (data: ParsedBillData) => {
      setBillData(data);
      setReceiptData(null);
      setSaved(false);

      if (data.kwhConsumed !== null && data.kwhConsumed > 0) {
        const energyData: EnergyData = {
          electricityKwh: data.kwhConsumed,
          country: state.userCountry,
        };
        const co2 = calculateEnergyCO2(energyData);
        setCo2Result({
          totalKg: co2,
          category: 'energy',
          details: `${data.kwhConsumed} kWh × ${state.userCountry} grid factor`,
        });
      } else {
        setCo2Result(null);
      }
    },
    [state.userCountry]
  );

  // ─── Handle Grocery Receipt ─────────────────────────────
  const handleReceiptParsed = useCallback((data: ParsedReceiptData) => {
    setReceiptData(data);
    setBillData(null);
    setSaved(false);

    if (data.items.length > 0) {
      // Convert parsed items to FoodData
      const foodItems: FoodItem[] = data.items.map((item) => ({
        category: item.category as FoodItem['category'],
        weightKg: item.estimatedWeightKg ?? 0.5, // default 500g per item
        source: 'local' as const,
      }));

      const foodData: FoodData = { items: foodItems };
      const co2 = calculateFoodCO2(foodData);
      setCo2Result({
        totalKg: co2,
        category: 'food',
        details: `${data.items.length} food items detected`,
      });
    } else {
      setCo2Result(null);
    }
  }, []);

  // ─── Save as Carbon Entry ───────────────────────────────
  const handleSaveEntry = useCallback(() => {
    if (!co2Result) return;

    const entry: CarbonEntry = {
      id: uuidv4(),
      date: new Date().toISOString(),
      transport: { mode: 'walk', distanceKm: 0 },
      food:
        co2Result.category === 'food' && receiptData
          ? {
              items: receiptData.items.map((i) => ({
                category: i.category as FoodItem['category'],
                weightKg: i.estimatedWeightKg ?? 0.5,
                source: 'local' as const,
              })),
            }
          : { items: [] },
      energy:
        co2Result.category === 'energy' && billData
          ? {
              electricityKwh: billData.kwhConsumed ?? 0,
              country: state.userCountry,
            }
          : { electricityKwh: 0, country: state.userCountry },
      shopping: { items: [] },
      totalKgCO2: co2Result.totalKg,
      breakdown: {
        transportKg: 0,
        foodKg: co2Result.category === 'food' ? co2Result.totalKg : 0,
        energyKg: co2Result.category === 'energy' ? co2Result.totalKg : 0,
        shoppingKg: 0,
        digitalKg: 0,
      },
    };

    addEntry(entry);
    setSaved(true);
  }, [co2Result, billData, receiptData, state.userCountry, addEntry]);

  return (
    <div className="space-y-6">
      <header className="animate-fade-in">
        <h1 className="text-3xl font-bold text-white mb-1">
          <span className="gradient-text">Bill & Receipt Parser</span>
        </h1>
        <p className="text-slate-400">
          Upload electricity bills or grocery receipts — OCR runs entirely in your browser,
          then we calculate your carbon footprint automatically
        </p>
      </header>

      {/* Upload Zone */}
      <div className="glass-card p-6">
        <FileUploadZone
          onBillParsed={handleBillParsed}
          onReceiptParsed={handleReceiptParsed}
        />
      </div>

      {/* Parsed Data Display */}
      <BillInsightCard billData={billData} receiptData={receiptData} />

      {/* ─── Carbon Footprint Result ──────────────────────── */}
      {co2Result && (
        <div className="glass-card p-6 animate-slide-up" role="region" aria-label="Carbon footprint result">
          <h3 className="text-lg font-semibold text-white mb-4">
            🌍 Carbon Footprint from{' '}
            {co2Result.category === 'energy' ? 'Electricity Bill' : 'Grocery Receipt'}
          </h3>

          {/* Main result */}
          <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">
                Estimated Emissions
              </p>
              <p className="text-4xl font-bold gradient-text">
                {co2Result.totalKg.toFixed(1)} kg CO₂
              </p>
              <p className="text-sm text-slate-500 mt-1">{co2Result.details}</p>
            </div>

            <div className="flex flex-col gap-2">
              {!saved ? (
                <button onClick={handleSaveEntry} className="btn-primary">
                  💾 Save to Dashboard
                </button>
              ) : (
                <p className="text-sm text-emerald-400 flex items-center gap-2">
                  ✅ Saved to your entries!
                </p>
              )}
            </div>
          </div>

          {/* Breakdown for electricity */}
          {co2Result.category === 'energy' && billData?.kwhConsumed && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3 rounded-xl bg-sky-500/10 border border-sky-500/15 text-center">
                <p className="stat-label">kWh Consumed</p>
                <p className="text-xl font-bold text-sky-400">{billData.kwhConsumed}</p>
              </div>
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/15 text-center">
                <p className="stat-label">Grid Factor ({state.userCountry})</p>
                <p className="text-xl font-bold text-emerald-400">
                  {(co2Result.totalKg / billData.kwhConsumed).toFixed(3)} kg/kWh
                </p>
              </div>
              <div className="p-3 rounded-xl bg-orange-500/10 border border-orange-500/15 text-center">
                <p className="stat-label">Equivalent</p>
                <p className="text-xl font-bold text-orange-400">
                  🌳 {Math.ceil(co2Result.totalKg / 21)} trees/year
                </p>
              </div>
            </div>
          )}

          {/* Breakdown for food */}
          {co2Result.category === 'food' && receiptData && receiptData.items.length > 0 && (
            <div>
              <p className="text-sm text-slate-400 mb-3">Per-item breakdown:</p>
              <div className="space-y-2">
                {receiptData.items.map((item, idx) => {
                  const weight = item.estimatedWeightKg ?? 0.5;
                  // Quick per-item CO₂ estimate
                  const itemCo2 = calculateFoodCO2({
                    items: [
                      {
                        category: item.category as FoodItem['category'],
                        weightKg: weight,
                        source: 'local',
                      },
                    ],
                  });
                  return (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-3 rounded-lg bg-white/3 border border-white/5"
                    >
                      <div className="flex items-center gap-3">
                        <span className="badge badge-eco text-xs">{item.category}</span>
                        <span className="text-sm text-slate-300">{item.name}</span>
                      </div>
                      <span className="text-sm font-medium text-orange-400">
                        {itemCo2.toFixed(1)} kg CO₂
                      </span>
                    </div>
                  );
                })}
              </div>
              {receiptData.totalAmount && (
                <div className="mt-3 pt-3 border-t border-white/5 flex justify-between">
                  <span className="text-slate-400">Receipt Total</span>
                  <span className="text-white font-medium">₹{receiptData.totalAmount}</span>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Confidence warning */}
      {co2Result && billData && billData.confidence < 0.5 && (
        <div
          className="glass-card p-4 border-l-4 border-yellow-500/50"
          role="alert"
        >
          <p className="text-sm text-yellow-400 font-medium">
            ⚠️ Low OCR Confidence ({Math.round(billData.confidence * 100)}%)
          </p>
          <p className="text-xs text-slate-500 mt-1">
            The kWh value may be inaccurate. You can manually adjust it in the{' '}
            <a href="/calculator" className="text-emerald-400 hover:underline">
              Calculator
            </a>{' '}
            for a more precise result.
          </p>
        </div>
      )}

      {/* Privacy notice */}
      <div className="glass-card p-4 text-center text-xs text-slate-500">
        <p>
          🔒 <strong>Privacy First:</strong> All OCR processing happens locally in your browser
          using Tesseract.js. No images or data are sent to any server.
        </p>
      </div>
    </div>
  );
}
