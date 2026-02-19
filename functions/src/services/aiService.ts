/**
 * AI Briefing Service — Multi-Provider Fallback
 *
 * Fallback order:
 *   1. Gemini (Main)      — GEMINI_API_KEY
 *   2. Gemini (Backup)    — GEMINI_BACKUP_KEY
 *   3. Groq               — GROQ_API_KEY      (llama-3.1-70b-versatile)
 *   4. OpenRouter          — OPENROUTER_API_KEY (llama-3.1-8b-instruct:free)
 *
 * All API keys are stored in Firebase Secret Manager.
 * Keys are accessed via process.env at runtime (declared in onRequest secrets).
 */

import { logger } from "firebase-functions";

// ========== Provider Configuration ==========

interface ProviderConfig {
  name: string;
  envKey: string;
}

const PROVIDERS: ProviderConfig[] = [
  { name: "Gemini (Main)", envKey: "GEMINI_API_KEY" },
  { name: "Gemini (Backup)", envKey: "GEMINI_BACKUP_KEY" },
  { name: "Groq", envKey: "GROQ_API_KEY" },
  { name: "OpenRouter", envKey: "OPENROUTER_API_KEY" },
];

// ========== Provider Implementations ==========

async function callGemini(
  apiKey: string,
  systemPrompt: string,
  userPrompt: string
): Promise<string> {
  const url =
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent" +
    `?key=${apiKey}`;

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      systemInstruction: {
        parts: [{ text: systemPrompt }],
      },
      contents: [
        {
          role: "user",
          parts: [{ text: userPrompt }],
        },
      ],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 4096,
      },
    }),
  });

  if (!response.ok) {
    const errText = await response.text().catch(() => "");
    throw new Error(`Gemini ${response.status}: ${errText.slice(0, 300)}`);
  }

  const data = await response.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error("Gemini returned empty content");
  return text;
}

async function callOpenAICompat(
  baseUrl: string,
  model: string,
  apiKey: string,
  systemPrompt: string,
  userPrompt: string,
  extraHeaders?: Record<string, string>
): Promise<string> {
  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
      ...extraHeaders,
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.7,
      max_tokens: 4096,
    }),
  });

  if (!response.ok) {
    const errText = await response.text().catch(() => "");
    throw new Error(`${model} ${response.status}: ${errText.slice(0, 300)}`);
  }

  const data = await response.json();
  const text = data?.choices?.[0]?.message?.content;
  if (!text) throw new Error(`${model} returned empty content`);
  return text;
}

/**
 * Dispatch to the correct provider implementation.
 */
function callProvider(
  providerName: string,
  apiKey: string,
  systemPrompt: string,
  userPrompt: string
): Promise<string> {
  if (providerName.startsWith("Gemini")) {
    return callGemini(apiKey, systemPrompt, userPrompt);
  }

  if (providerName === "Groq") {
    return callOpenAICompat(
      "https://api.groq.com/openai/v1",
      "llama-3.1-70b-versatile",
      apiKey,
      systemPrompt,
      userPrompt
    );
  }

  if (providerName === "OpenRouter") {
    return callOpenAICompat(
      "https://openrouter.ai/api/v1",
      "meta-llama/llama-3.1-8b-instruct:free",
      apiKey,
      systemPrompt,
      userPrompt,
      {
        "HTTP-Referer": "https://q-train-web.web.app/",
        "X-Title": "Q-TRAIN",
      }
    );
  }

  return Promise.reject(new Error(`Unknown provider: ${providerName}`));
}

// ========== Prompt Building ==========

function langName(lang: string): string {
  switch (lang) {
    case "ko":
      return "Korean (한국어)";
    case "vi":
      return "Vietnamese (Tiếng Việt)";
    default:
      return "English";
  }
}

function buildSystemPrompt(lang: string): string {
  return [
    `You are a Senior Quality Assurance Analyst for HWK Vietnam (화승비나), a footwear manufacturing company.`,
    `Analyze the 5PRS (5-Point Random Sampling) inspection data below and generate a quality briefing.`,
    ``,
    `RESPOND ENTIRELY IN ${langName(lang)}.`,
    ``,
    `Structure your briefing with these sections:`,
    ``,
    `## 📊 Overall Quality Summary`,
    `Key metrics, reject rate trend, comparison with industry benchmark (~2-3%).`,
    ``,
    `## 🚨 Critical Issues`,
    `Top defect types with counts and patterns. Flag sudden increases.`,
    ``,
    `## 👤 TQC Inspector Analysis`,
    `Inspectors with high reject rates (>5% is critical). Buildings/lines they cover.`,
    ``,
    `## 🏭 Building / Location Analysis`,
    `Building-level quality comparison. Worst-performing locations.`,
    ``,
    `## ⚠️ Risk Assessment`,
    `High-risk POs, buildings, or lines. Defect concentration patterns.`,
    ``,
    `## 💡 Recommendations`,
    `- Immediate actions (critical items)`,
    `- Short-term improvements (1-2 weeks)`,
    `- Preventive measures`,
    ``,
    `Use markdown. Be data-driven and reference actual numbers.`,
    `Keep the briefing between 800-1200 words.`,
  ].join("\n");
}

/* eslint-disable @typescript-eslint/no-explicit-any */
function buildUserPrompt(req: any): string {
  const lines: string[] = [
    `## Inspection Data`,
    `- Period: ${req.date} (${req.yearMonth})`,
    `- Range: ${req.firstDate} ~ ${req.lastDate}`,
    ``,
    `### Statistics`,
    `- Total Validations: ${req.stats.totalValidation}`,
    `- Total Rejects: ${req.stats.totalReject}`,
    `- Overall Reject Rate: ${req.stats.totalRejectRate}%`,
    `- Avg Daily Validations: ${req.stats.avgDailyValidation}`,
    ``,
  ];

  if (req.topTqcIssues?.length) {
    lines.push(`### Top TQC Issues`);
    for (const t of req.topTqcIssues) {
      lines.push(
        `- **${t.name}** (${t.id}): ${t.rejectRate}% reject | ` +
          `${t.totalReject}/${t.totalValidation} | ` +
          `Bldg: ${t.buildings.join(",")} | ` +
          `Main: ${t.mainDefect} | ` +
          `Defects: ${t.defects.map((d: any) => `${d.type}(${d.count})`).join(", ")}`
      );
    }
    lines.push("");
  }

  if (req.topDefects?.length) {
    lines.push(`### Top Defects`);
    for (const d of req.topDefects) {
      lines.push(`- **${d.type}**: ${d.count} (${d.ratio}%)`);
    }
    lines.push("");
  }

  if (req.modelDefects?.length) {
    lines.push(`### Model Defects`);
    for (const m of req.modelDefects) {
      lines.push(
        `- **${m.model}**: ${m.rejectRate}% | ${m.totalReject}/${m.totalValidation} | ` +
          `${m.defects.map((d: any) => `${d.type}(${d.count})`).join(", ")}`
      );
    }
    lines.push("");
  }

  if (req.buildingIssues?.length) {
    lines.push(`### Building Issues`);
    for (const b of req.buildingIssues) {
      lines.push(
        `- **${b.building}**: ${b.rejectRate}% (${b.totalValidation} validations)`
      );
    }
    lines.push("");
  }

  if (req.riskItems) {
    lines.push(`### Risk Items`);
    const ri = req.riskItems;
    if (ri.highRiskPOs?.length)
      lines.push(`- High-Risk POs: ${ri.highRiskPOs.join(", ")}`);
    if (ri.highRiskBuildings?.length)
      lines.push(`- High-Risk Buildings: ${ri.highRiskBuildings.join(", ")}`);
    if (ri.highRiskLines?.length)
      lines.push(`- High-Risk Lines: ${ri.highRiskLines.join(", ")}`);
    lines.push("");
  }

  return lines.join("\n");
}
/* eslint-enable @typescript-eslint/no-explicit-any */

// ========== Main Export ==========

/**
 * Generates an AI briefing using multi-provider fallback.
 * Tries each configured provider in order until one succeeds.
 */
export async function generateAiBriefing(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  request: any
): Promise<{ briefing: string; provider: string }> {
  const systemPrompt = buildSystemPrompt(request.lang || "en");
  const userPrompt = buildUserPrompt(request);

  const errors: string[] = [];

  for (const provider of PROVIDERS) {
    const apiKey = process.env[provider.envKey];
    if (!apiKey) {
      logger.info(
        `AI Fallback: Skip ${provider.name} — no key (${provider.envKey})`
      );
      continue;
    }

    try {
      logger.info(`AI Fallback: Trying ${provider.name}...`);
      const briefing = await callProvider(
        provider.name,
        apiKey,
        systemPrompt,
        userPrompt
      );

      if (!briefing?.trim()) {
        errors.push(`${provider.name}: empty response`);
        continue;
      }

      logger.info(
        `AI Fallback: ${provider.name} succeeded (${briefing.length} chars)`
      );
      return { briefing, provider: provider.name };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      logger.warn(`AI Fallback: ${provider.name} failed — ${msg}`);
      errors.push(`${provider.name}: ${msg}`);
    }
  }

  throw new Error(
    `All AI providers failed:\n${errors.map((e) => `  - ${e}`).join("\n")}`
  );
}
