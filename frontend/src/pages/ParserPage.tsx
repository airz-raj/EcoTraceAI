/**
 * EcoTrace AI — Bill Parser Page
 */

import { useState } from 'react';
import { FileUploadZone } from '../components/parser/FileUploadZone';
import { BillInsightCard } from '../components/parser/BillInsightCard';
import type { ParsedBillData, ParsedReceiptData } from '../types';

export function ParserPage() {
  const [billData, setBillData] = useState<ParsedBillData | null>(null);
  const [receiptData, setReceiptData] = useState<ParsedReceiptData | null>(null);

  return (
    <div className="space-y-6">
      <header className="animate-fade-in">
        <h1 className="text-3xl font-bold text-white mb-1">
          <span className="gradient-text">Bill & Receipt Parser</span>
        </h1>
        <p className="text-slate-400">
          Upload electricity bills or grocery receipts — OCR runs entirely in your browser
        </p>
      </header>

      <div className="glass-card p-6">
        <FileUploadZone
          onBillParsed={(data) => { setBillData(data); setReceiptData(null); }}
          onReceiptParsed={(data) => { setReceiptData(data); setBillData(null); }}
        />
      </div>

      <BillInsightCard billData={billData} receiptData={receiptData} />

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
