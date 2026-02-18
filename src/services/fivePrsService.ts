/**
 * 5 PRS API Service
 *
 * - Drive data: Cloud Functions API via Firebase Hosting rewrite
 * - AI Briefing: Multi-provider fallback (Gemini → Groq → OpenRouter)
 */

import type {
  MonthsResponse,
  DataResponse,
  AiBriefingRequest,
  AiBriefingResponse,
} from '@/types/fivePrs';

const FETCH_TIMEOUT_MS = 30000;

// ========== AI Provider Configuration ==========

interface AIProvider {
  name: string;
  type: 'gemini' | 'openai-compat';
  endpoint: string;
  apiKey: string;
  model: string;
  headers?: Record<string, string>;
}

const AI_PROVIDERS: AIProvider[] = [
  {
    name: 'Gemini (메인)',
    type: 'gemini',
    endpoint: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent',
    apiKey: 'REDACTED',
    model: 'gemini-2.0-flash',
  },
  {
    name: 'Groq (Llama 3.1 70B)',
    type: 'openai-compat',
    endpoint: 'https://api.groq.com/openai/v1/chat/completions',
    apiKey: 'REDACTED',
    model: 'llama-3.1-70b-versatile',
  },
  {
    name: 'OpenRouter (Llama 3.1 8B)',
    type: 'openai-compat',
    endpoint: 'https://openrouter.ai/api/v1/chat/completions',
    apiKey: 'REDACTED',
    model: 'meta-llama/llama-3.1-8b-instruct:free',
    headers: {
      'HTTP-Referer': 'https://q-train-web.web.app',
      'X-Title': 'Q-TRAIN 5PRS',
    },
  },
];

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

// ========== AI Briefing — Prompt Building ==========

function getSystemInstruction(lang: string): string {
  const instructions: Record<string, string> = {
    ko: '당신은 QIP 품질 관리 전문가입니다. 트레이너가 즉시 행동할 수 있는 구체적인 브리핑을 작성하세요. 마크다운 형식으로 **핵심어**를 굵게 표시하고, 항목별로 줄바꿈하세요.',
    en: 'You are a QIP quality management expert. Write a specific briefing that trainers can act on immediately. Use markdown format with **bold keywords** and line breaks between items.',
    vi: 'Bạn là chuyên gia quản lý chất lượng QIP. Viết bản tóm tắt cụ thể mà huấn luyện viên có thể hành động ngay lập tức. Sử dụng định dạng markdown với **từ khóa in đậm** và ngắt dòng giữa các mục.',
  };
  return instructions[lang] || instructions.ko;
}

function sanitize(value: unknown, maxLen = 100): string {
  if (typeof value !== 'string') return String(value ?? '');
  return value.replace(/[\r\n]/g, ' ').replace(/[=\-]{2,}/g, '').substring(0, maxLen);
}

function buildPrompt(data: AiBriefingRequest): string {
  const { stats, topTqcIssues, topDefects, buildingIssues, riskItems } = data;
  const s = sanitize;
  const n = (v: unknown) => Number(v) || 0;

  let prompt = `[${s(data.date)}] 5PRS 품질 브리핑 (${s(data.yearMonth)})`;
  if (data.firstDate && data.lastDate) {
    prompt += ` | ${s(data.firstDate)} ~ ${s(data.lastDate)}`;
  }
  prompt += '\n\n';

  prompt += `KPI: 검증 ${n(stats.totalValidation).toLocaleString()}, 불량 ${n(stats.totalReject).toLocaleString()}, 불량률 ${n(stats.totalRejectRate)}%, 일평균 ${n(stats.avgDailyValidation).toLocaleString()}\n\n`;

  if (topTqcIssues?.length) {
    prompt += `고위험 TQC:\n`;
    topTqcIssues.slice(0, 5).forEach((t, i) => {
      prompt += `${i + 1}. ${s(t.name)}(${s(t.id)}): ${n(t.rejectRate)}%, ${n(t.totalReject)}건, ${s(t.mainDefect)}\n`;
    });
    prompt += '\n';
  }

  if (topDefects?.length) {
    prompt += `TOP 불량: ${topDefects.slice(0, 5).map((d) => `${s(d.type)} ${n(d.count)}건(${n(d.ratio)}%)`).join(', ')}\n\n`;
  }

  if (buildingIssues?.length) {
    prompt += `구역: ${buildingIssues.slice(0, 8).map((b) => `${s(b.building)} ${n(b.rejectRate)}%`).join(', ')}\n\n`;
  }

  if (riskItems) {
    const parts: string[] = [];
    if (riskItems.highRiskPOs?.length) parts.push(`PO: ${riskItems.highRiskPOs.slice(0, 3).map(s).join(',')}`);
    if (riskItems.highRiskBuildings?.length) parts.push(`구역: ${riskItems.highRiskBuildings.slice(0, 3).map(s).join(',')}`);
    if (riskItems.highRiskLines?.length) parts.push(`라인: ${riskItems.highRiskLines.slice(0, 3).map(s).join(',')}`);
    if (parts.length) prompt += `고위험: ${parts.join(' | ')}\n\n`;
  }

  prompt += `지시: 1.최우선 3대 과제 우선순위별 제시 2.TQC명/불량유형/구역 구체적 명시 3.즉시 조치 vs 이번주 조치 구분 4.숫자+근거 필수 5.3문단 이내`;

  return prompt;
}

// ========== AI Briefing — Provider Calls ==========

/** Call Gemini REST API */
async function callGemini(
  provider: AIProvider,
  systemInstruction: string,
  prompt: string
): Promise<string> {
  const url = `${provider.endpoint}?key=${provider.apiKey}`;

  const res = await fetchWithTimeout(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      system_instruction: { parts: [{ text: systemInstruction }] },
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.3, maxOutputTokens: 800 },
    }),
  });

  if (!res.ok) {
    const status = res.status;
    const err = await res.json().catch(() => ({}));
    const msg = err?.error?.message || err?.error || `HTTP ${status}`;
    throw new Error(`[${provider.name}] ${msg} (${status})`);
  }

  const result = await res.json();
  const text = result?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
  if (!text) throw new Error(`[${provider.name}] Empty response`);
  return text;
}

/** Call OpenAI-compatible API (Groq, OpenRouter) */
async function callOpenAICompat(
  provider: AIProvider,
  systemInstruction: string,
  prompt: string
): Promise<string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${provider.apiKey}`,
    ...provider.headers,
  };

  const res = await fetchWithTimeout(provider.endpoint, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      model: provider.model,
      messages: [
        { role: 'system', content: systemInstruction },
        { role: 'user', content: prompt },
      ],
      temperature: 0.3,
      max_tokens: 800,
    }),
  });

  if (!res.ok) {
    const status = res.status;
    const err = await res.json().catch(() => ({}));
    const msg = err?.error?.message || err?.error || `HTTP ${status}`;
    throw new Error(`[${provider.name}] ${msg} (${status})`);
  }

  const result = await res.json();
  const text = result?.choices?.[0]?.message?.content?.trim();
  if (!text) throw new Error(`[${provider.name}] Empty response`);
  return text;
}

// ========== AI Briefing — Fallback Engine ==========

/** Generate AI briefing with automatic provider fallback */
export async function generateAiBriefing(
  data: AiBriefingRequest
): Promise<AiBriefingResponse> {
  const prompt = buildPrompt(data);
  const systemInstruction = getSystemInstruction(data.lang);
  const errors: string[] = [];

  for (const provider of AI_PROVIDERS) {
    try {
      console.log(`[5PRS AI] Trying: ${provider.name}`);

      const briefing =
        provider.type === 'gemini'
          ? await callGemini(provider, systemInstruction, prompt)
          : await callOpenAICompat(provider, systemInstruction, prompt);

      console.log(`[5PRS AI] Success: ${provider.name}`);
      return { success: true, briefing, cached: false };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.warn(`[5PRS AI] Failed: ${provider.name} — ${msg}`);
      errors.push(msg);
    }
  }

  // All providers failed
  const allErrors = errors.join(' → ');
  console.error(`[5PRS AI] All providers failed: ${allErrors}`);
  throw new Error(`모든 AI 서비스 실패: ${allErrors}`);
}
