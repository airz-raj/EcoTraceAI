/**
 * EcoTrace AI — Bill Insight Card
 *
 * Displays parsed bill/receipt results with confidence scores.
 */

import type { ParsedBillData, ParsedReceiptData } from '../../types';

interface BillInsightCardProps {
  billData?: ParsedBillData | null;
  receiptData?: ParsedReceiptData | null;
}

export function BillInsightCard({ billData, receiptData }: BillInsightCardProps) {
  if (!billData && !receiptData) return null;

  return (
    <div className="glass-card p-5 animate-slide-up" role="region" aria-label="Parsed bill results">
      {billData && (
        <div>
          <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
            ⚡ Electricity Bill Results
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-slate-400">kWh Consumed</span>
              <span className="text-white font-medium">
                {billData.kwhConsumed !== null
                  ? `${billData.kwhConsumed} kWh`
                  : 'Not detected'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Billing Period</span>
              <span className="text-white font-medium capitalize">
                {billData.billingPeriod || 'Not detected'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Confidence</span>
              <span className={`font-medium ${
                billData.confidence > 0.7 ? 'text-emerald-400' :
                billData.confidence > 0.4 ? 'text-yellow-400' : 'text-red-400'
              }`}>
                {Math.round(billData.confidence * 100)}%
              </span>
            </div>
          </div>
        </div>
      )}

      {receiptData && (
        <div>
          <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
            🧾 Receipt Items Detected
          </h3>
          {receiptData.items.length > 0 ? (
            <div className="space-y-2">
              {receiptData.items.map((item, idx) => (
                <div
                  key={idx}
                  className="flex justify-between items-center p-2 rounded-lg bg-white/3"
                >
                  <span className="text-slate-300 text-sm">{item.name}</span>
                  <div className="flex items-center gap-2">
                    <span className="badge badge-eco text-xs">{item.category}</span>
                    <span className="text-xs text-slate-500">
                      {Math.round(item.confidence * 100)}%
                    </span>
                  </div>
                </div>
              ))}
              {receiptData.totalAmount && (
                <div className="pt-2 border-t border-white/5 flex justify-between">
                  <span className="text-slate-400">Total Amount</span>
                  <span className="text-white font-medium">₹{receiptData.totalAmount}</span>
                </div>
              )}
            </div>
          ) : (
            <p className="text-sm text-slate-500">No food items detected in this receipt.</p>
          )}
        </div>
      )}
    </div>
  );
}
