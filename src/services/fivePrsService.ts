/**
 * 5 PRS API Service
 *
 * All API calls go through Cloud Functions via Firebase Hosting rewrites.
 * AI briefing is handled server-side (Gemini with secrets) — no client-side API keys.
 */

import type {
  MonthsResponse,
  DataResponse,
  AiBriefingRequest,
  AiBriefingResponse,
} from '@/types/fivePrs';

const FETCH_TIMEOUT_MS = 30000;

// ========== Shared Utilities ==========

async function fetchWithTimeout(
  url: string,
  options?: RequestInit
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    return response;
  } finally {
    clearTimeout(timeoutId);
  }
}

async function fetchWithTimeoutStrict(
  url: string,
  options?: RequestInit
): Promise<Response> {
  const response = await fetchWithTimeout(url, options);
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || `HTTP ${response.status}`);
  }
  return response;
}

// ========== Drive Data API (Cloud Functions) ==========

export async function fetchMonths(): Promise<MonthsResponse> {
  const res = await fetchWithTimeoutStrict('/api/drive/months');
  return res.json();
}

export async function fetchMonthData(yearMonth: string): Promise<DataResponse> {
  const res = await fetchWithTimeoutStrict(`/api/drive/data/${yearMonth}`);
  return res.json();
}

export async function fetchLatestData(): Promise<DataResponse> {
  const res = await fetchWithTimeoutStrict('/api/drive/latest');
  return res.json();
}

// ========== AI Briefing (Cloud Function at /api/ai/briefing) ==========

export async function generateAiBriefing(
  data: AiBriefingRequest
): Promise<AiBriefingResponse> {
  const res = await fetchWithTimeout('/api/ai/briefing', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `HTTP ${res.status}`);
  }

  const result: AiBriefingResponse = await res.json();
  if (!result.success || !result.briefing) {
    throw new Error('AI returned empty response');
  }

  return result;
}
