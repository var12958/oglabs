// ═══════════════════════════════════════════════════════════════════════════════
// VaultSense — Centralized API Client
// ═══════════════════════════════════════════════════════════════════════════════
// Axios instance with timeout, retry logic, and interceptors.
// All service modules import this client for consistent request handling.
// ═══════════════════════════════════════════════════════════════════════════════

import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// ─── Axios Instance ──────────────────────────────────────────────────────────

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ─── Retry Configuration ─────────────────────────────────────────────────────

const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 1000;

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ─── Response Interceptor ────────────────────────────────────────────────────

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const config = error.config || {};
    const retryCount = config.__retryCount || 0;

    // Don't retry on 4xx client errors (except 429 Too Many Requests)
    const status = error.response?.status;
    if (status && status >= 400 && status < 500 && status !== 429) {
      return Promise.reject(error);
    }

    // Retry on network errors or 5xx server errors
    if (retryCount < MAX_RETRIES) {
      config.__retryCount = retryCount + 1;
      await delay(RETRY_DELAY_MS * (retryCount + 1)); // exponential-ish backoff
      return apiClient(config);
    }

    return Promise.reject(error);
  }
);

// ─── Generic Request Helpers ─────────────────────────────────────────────────

/**
 * apiGet(path, params)
 * Performs a GET request. Returns the parsed response data.
 * Throws an error with a user-friendly message on failure.
 */
export async function apiGet(path, params = {}) {
  try {
    const response = await apiClient.get(path, { params });
    return response.data;
  } catch (err) {
    const message =
      err.response?.data?.error ||
      err.message ||
      'Network request failed';
    throw new Error(message);
  }
}

/**
 * apiPost(path, body)
 * Performs a POST request. Returns the parsed response data.
 * Throws an error with a user-friendly message on failure.
 */
export async function apiPost(path, body = {}) {
  try {
    const response = await apiClient.post(path, body);
    return response.data;
  } catch (err) {
    const message =
      err.response?.data?.error ||
      err.message ||
      'Network request failed';
    throw new Error(message);
  }
}

export default apiClient;
