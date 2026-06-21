/**
 * EcoTrace AI — API Client Service
 *
 * Axios-based HTTP client with interceptors for
 * request/response standardization and error handling.
 */

import axios, { type AxiosInstance, type AxiosError } from 'axios';

/** API base URL — points to deployed Cloud Run backend if env var is missing */
const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://ecotrace-api-mwzc2e6ffq-el.a.run.app/api';

/** Request timeout in milliseconds */
const TIMEOUT_MS = 15000;

/**
 * Configured Axios instance with interceptors.
 * Automatically handles JSON serialization, timeouts, and error formatting.
 */
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: TIMEOUT_MS,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// ─── Request Interceptor ─────────────────────────────────────

apiClient.interceptors.request.use(
  (config) => {
    // Note: Previously added timestamp here to prevent caching.
    // Removed to allow proper ETags and Cache-Control headers to work efficiently.
    return config;
  },
  (error) => Promise.reject(error)
);

// ─── Response Interceptor ────────────────────────────────────

apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<{ detail?: string }>) => {
    const message =
      error.response?.data?.detail ||
      error.message ||
      'An unexpected error occurred';

    console.error(`[API Error] ${error.config?.method?.toUpperCase()} ${error.config?.url}: ${message}`);

    return Promise.reject(new Error(message));
  }
);

// ─── API Functions ───────────────────────────────────────────

/** Carbon entry submission */
export async function submitCarbonEntry(entryData: Record<string, unknown>): Promise<Record<string, unknown>> {
  const { data } = await apiClient.post('/carbon', entryData);
  return data;
}

/** Upload electricity bill for parsing */
export async function uploadElectricityBill(file: File): Promise<Record<string, unknown>> {
  const formData = new FormData();
  formData.append('file', file);

  const { data } = await apiClient.post('/parse/electricity-bill', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 30000, // Longer timeout for file processing
  });
  return data;
}

/** Upload receipt for parsing */
export async function uploadReceipt(file: File): Promise<Record<string, unknown>> {
  const formData = new FormData();
  formData.append('file', file);

  const { data } = await apiClient.post('/parse/receipt', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 30000,
  });
  return data;
}

/** Submit digital footprint data from CLI agent */
export async function submitDigitalFootprint(footprintData: Record<string, unknown>): Promise<Record<string, unknown>> {
  const { data } = await apiClient.post('/digital-footprint', footprintData);
  return data;
}

/** Health check endpoint */
export async function checkHealth(): Promise<boolean> {
  try {
    const { data } = await apiClient.get('/health');
    return data?.status === 'ok';
  } catch {
    return false;
  }
}

/** Send message to AI chatbot */
export async function sendChatMessage(messages: {role: string, content: string}[], contextData?: Record<string, unknown>): Promise<{response: string, source: string}> {
  const { data } = await apiClient.post('/chat', { messages, contextData });
  return data;
}

export default apiClient;
