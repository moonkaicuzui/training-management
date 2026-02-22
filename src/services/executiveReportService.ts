/**
 * Executive Report Service (Client)
 *
 * Calls the Cloud Function endpoint to generate AI-powered executive reports.
 */

const FETCH_TIMEOUT_MS = 60000; // 60s for AI generation

export interface ExecReportRequest {
  period: string;
  language: 'ko' | 'en' | 'vi';
  sections: {
    includeKPI: boolean;
    includeCAPA: boolean;
    includeTQC: boolean;
    include5PRS: boolean;
    includeTraining: boolean;
  };
}

export interface ExecReportResponse {
  success: boolean;
  report: string;
  provider: string;
  dataSnapshot: Record<string, unknown>;
  error?: string;
}

export async function generateExecutiveReport(
  request: ExecReportRequest
): Promise<ExecReportResponse> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const response = await fetch('/api/ai/executive-report', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
      signal: controller.signal,
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error || `HTTP ${response.status}`);
    }

    return response.json();
  } finally {
    clearTimeout(timeoutId);
  }
}
