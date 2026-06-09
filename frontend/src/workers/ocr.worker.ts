/**
 * EcoTrace AI — OCR Web Worker
 *
 * Runs Tesseract.js in a dedicated thread to prevent UI blocking.
 * Communicates progress and results via postMessage.
 *
 * AUDIT FIX: Extracted WASM operations into Web Workers
 * to maintain main-thread performance.
 */

import { createWorker } from 'tesseract.js';

self.onmessage = async (e: MessageEvent) => {
  const { imageFile } = e.data;

  try {
    const worker = await createWorker('eng', 1, {
      logger: (m) => {
        if (m.status === 'recognizing text') {
          self.postMessage({
            type: 'progress',
            progress: Math.round(m.progress * 100),
          });
        }
      },
    });

    const { data } = await worker.recognize(imageFile);

    await worker.terminate();

    self.postMessage({
      type: 'complete',
      text: data.text,
      confidence: data.confidence,
    });
  } catch (error) {
    self.postMessage({
      type: 'error',
      message: error instanceof Error ? error.message : 'OCR processing failed',
    });
  }
};
