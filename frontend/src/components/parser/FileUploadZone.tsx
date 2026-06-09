/**
 * EcoTrace AI — File Upload Zone
 *
 * Accessible drag & drop file upload with OCR progress.
 * WCAG: Supports Space/Enter activation, aria-live progress.
 */

import React, { useRef, useState } from 'react';
import { parseElectricityBill, parseGroceryReceipt, detectBillType } from '../../services/billParser';
import type { ParsedBillData, ParsedReceiptData } from '../../types';

interface FileUploadZoneProps {
  onBillParsed: (data: ParsedBillData) => void;
  onReceiptParsed: (data: ParsedReceiptData) => void;
}

export function FileUploadZone({ onBillParsed, onReceiptParsed }: FileUploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [ocrProgress, setOcrProgress] = useState(0);
  const [status, setStatus] = useState<'idle' | 'processing' | 'done' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // WCAG: Space AND Enter for custom interactive elements
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      inputRef.current?.click();
    }
  };

  const handleFile = (file: File) => {
    // File size validation (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      setStatus('error');
      setErrorMsg('File too large. Maximum size is 10MB.');
      return;
    }

    // MIME type validation
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    if (!validTypes.includes(file.type)) {
      setStatus('error');
      setErrorMsg('Invalid file type. Please upload JPEG, PNG, WebP, or PDF.');
      return;
    }

    setStatus('processing');
    setOcrProgress(0);
    setErrorMsg('');

    // Use Web Worker for OCR
    try {
      const worker = new Worker(
        new URL('../../workers/ocr.worker.ts', import.meta.url),
        { type: 'module' }
      );

      worker.postMessage({ imageFile: file });

      worker.onmessage = (e) => {
        if (e.data.type === 'progress') {
          setOcrProgress(e.data.progress);
        }

        if (e.data.type === 'complete') {
          const text = e.data.text;
          const billType = detectBillType(text);

          if (billType === 'electricity') {
            const parsed = parseElectricityBill(text);
            onBillParsed(parsed);
          } else {
            const parsed = parseGroceryReceipt(text);
            onReceiptParsed(parsed);
          }

          setStatus('done');
          worker.terminate();
        }

        if (e.data.type === 'error') {
          setStatus('error');
          setErrorMsg(e.data.message || 'OCR processing failed');
          worker.terminate();
        }
      };

      worker.onerror = () => {
        setStatus('error');
        setErrorMsg('OCR worker crashed. Please try again.');
        worker.terminate();
      };
    } catch {
      setStatus('error');
      setErrorMsg('OCR is not available in your browser.');
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  return (
    <section aria-labelledby="upload-heading">
      <h2 id="upload-heading" className="sr-only">Upload Your Bill</h2>

      <div
        role="button"
        tabIndex={0}
        aria-label="Upload file. Drag and drop or press Enter or Space to browse."
        onKeyDown={handleKeyDown}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`upload-zone ${isDragging ? 'dragging' : ''}`}
      >
        <div className="text-4xl mb-3" role="img" aria-hidden="true">📄</div>
        <p className="text-slate-300 mb-1">
          Drag & drop your electricity bill or grocery receipt here
        </p>
        <p className="text-sm text-slate-500">
          or click to browse (JPEG, PNG, WebP, PDF — max 10MB)
        </p>
        <p className="text-xs text-emerald-500 mt-2">
          🔒 Processed entirely in your browser. Data never leaves your device.
        </p>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,application/pdf"
        className="sr-only"
        aria-hidden="true"
        onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
      />

      {/* Live status region for screen readers */}
      <div aria-live="polite" aria-atomic="true" className="mt-4">
        {status === 'processing' && (
          <div
            role="progressbar"
            aria-valuenow={ocrProgress}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="OCR scanning progress"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="flex-1 progress-bar">
                <div className="progress-fill" style={{ width: `${ocrProgress}%` }} />
              </div>
              <span className="text-sm text-emerald-400 w-12 text-right">{ocrProgress}%</span>
            </div>
            <p className="text-sm text-slate-400">Scanning document...</p>
          </div>
        )}

        {status === 'done' && (
          <p className="text-sm text-emerald-400 flex items-center gap-2">
            ✅ Document processed successfully!
          </p>
        )}

        {status === 'error' && (
          <p role="alert" className="text-sm text-red-400 flex items-center gap-2">
            ❌ {errorMsg}
          </p>
        )}
      </div>
    </section>
  );
}
