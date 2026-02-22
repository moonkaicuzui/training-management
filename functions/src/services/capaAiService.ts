/**
 * CAPA AI Root Cause Analysis Service
 *
 * Queries the capa_root_cause_kb knowledge base and past CAPAs,
 * then calls AI to suggest root causes, corrective/preventive actions.
 */

import { logger } from "firebase-functions";
import * as admin from "firebase-admin";
import { callAIWithFallback } from "./aiService";

// Lazy init — db is accessed only after initializeApp() runs in index.ts
function getDb() {
  return admin.firestore();
}

// ========== Types ==========

export interface CAPAAnalysisInput {
  problemDescription: string;
  affectedArea: string;
  severity: "critical" | "major" | "minor";
  source: string;
  language?: "ko" | "en" | "vi";
}

interface KBEntry {
  kb_id: string;
  problem_category: string;
  problem_area: string;
  root_cause: string;
  corrective_actions: string[];
  preventive_actions: string[];
  confidence_score: number;
  adoption_count: number;
  rejection_count: number;
  tags: string[];
}

export interface CAPAAnalysisResult {
  suggestedRootCauses: Array<{
    cause: string;
    confidence: number;
    reasoning: string;
    source: "ai" | "kb" | "historical";
    kb_id?: string;
  }>;
  suggestedCorrectiveActions: Array<{ action: string; priority: string }>;
  suggestedPreventiveActions: Array<{ action: string; priority: string }>;
  provider: string;
}

// ========== KB Query ==========

async function queryKnowledgeBase(
  problemDescription: string,
  affectedArea: string
): Promise<KBEntry[]> {
  const entries: KBEntry[] = [];

  try {
    // Query by affected area with high confidence
    const areaSnap = await getDb()
      .collection("capa_root_cause_kb")
      .where("problem_area", "==", affectedArea)
      .orderBy("confidence_score", "desc")
      .limit(10)
      .get();

    for (const doc of areaSnap.docs) {
      const d = doc.data();
      entries.push({
        kb_id: doc.id,
        problem_category: d.problem_category || "",
        problem_area: d.problem_area || "",
        root_cause: d.root_cause || "",
        corrective_actions: d.corrective_actions || [],
        preventive_actions: d.preventive_actions || [],
        confidence_score: d.confidence_score || 0,
        adoption_count: d.adoption_count || 0,
        rejection_count: d.rejection_count || 0,
        tags: d.tags || [],
      });
    }

    // Also query by tags matching keywords from problem description
    const keywords = problemDescription
      .toLowerCase()
      .split(/[\s,;.]+/)
      .filter((w) => w.length > 3)
      .slice(0, 5);

    if (keywords.length > 0) {
      const tagSnap = await getDb()
        .collection("capa_root_cause_kb")
        .where("tags", "array-contains-any", keywords)
        .orderBy("confidence_score", "desc")
        .limit(10)
        .get();

      const existingIds = new Set(entries.map((e) => e.kb_id));
      for (const doc of tagSnap.docs) {
        if (existingIds.has(doc.id)) continue;
        const d = doc.data();
        entries.push({
          kb_id: doc.id,
          problem_category: d.problem_category || "",
          problem_area: d.problem_area || "",
          root_cause: d.root_cause || "",
          corrective_actions: d.corrective_actions || [],
          preventive_actions: d.preventive_actions || [],
          confidence_score: d.confidence_score || 0,
          adoption_count: d.adoption_count || 0,
          rejection_count: d.rejection_count || 0,
          tags: d.tags || [],
        });
      }
    }
  } catch (err) {
    logger.warn("KB query failed (may need indexes):", err);
  }

  return entries.sort((a, b) => b.confidence_score - a.confidence_score);
}

// ========== Past CAPA Query ==========

async function queryPastCAPAs(
  affectedArea: string,
  source: string
): Promise<Array<{ rootCause: string; actions: string[] }>> {
  const results: Array<{ rootCause: string; actions: string[] }> = [];

  try {
    const snap = await getDb()
      .collection("capas")
      .where("status", "==", "closed")
      .limit(20)
      .get();

    for (const doc of snap.docs) {
      const d = doc.data();
      const discovery = d.discovery || {};
      const investigation = d.investigation || {};
      const action = d.action || {};

      // Match by affected area or source
      if (
        discovery.affectedArea === affectedArea ||
        discovery.source === source
      ) {
        const rootCause = investigation.rootCauseAnalysis;
        if (rootCause) {
          const correctiveActions = (action.correctiveActions || []).map(
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (a: any) => a.description || ""
          );
          results.push({ rootCause, actions: correctiveActions });
        }
      }
    }
  } catch (err) {
    logger.warn("Past CAPA query failed:", err);
  }

  return results.slice(0, 5);
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

function buildCAPASystemPrompt(lang: string): string {
  return [
    `You are a Senior Quality Engineer at HWK Vietnam (화승비나), a footwear manufacturing company.`,
    `Analyze the problem described below and suggest root causes, corrective actions, and preventive actions.`,
    ``,
    `RESPOND ENTIRELY IN ${langName(lang)}.`,
    ``,
    `RESPOND IN VALID JSON with this exact structure:`,
    `{`,
    `  "rootCauses": [`,
    `    { "cause": "...", "confidence": 0-100, "reasoning": "..." }`,
    `  ],`,
    `  "correctiveActions": [`,
    `    { "action": "...", "priority": "high|medium|low" }`,
    `  ],`,
    `  "preventiveActions": [`,
    `    { "action": "...", "priority": "high|medium|low" }`,
    `  ]`,
    `}`,
    ``,
    `Provide 2-4 root causes ranked by likelihood.`,
    `Provide 3-5 corrective actions and 2-4 preventive actions.`,
    `Be specific and actionable. Reference manufacturing best practices.`,
  ].join("\n");
}

function buildCAPAUserPrompt(
  input: CAPAAnalysisInput,
  kbEntries: KBEntry[],
  pastCAPAs: Array<{ rootCause: string; actions: string[] }>
): string {
  const lines: string[] = [
    `## Problem Description`,
    input.problemDescription,
    ``,
    `## Context`,
    `- Affected Area: ${input.affectedArea}`,
    `- Severity: ${input.severity}`,
    `- Source: ${input.source}`,
    ``,
  ];

  if (kbEntries.length > 0) {
    lines.push(`## Knowledge Base (similar past issues, ranked by confidence):`);
    for (const entry of kbEntries.slice(0, 5)) {
      lines.push(
        `- [Confidence: ${entry.confidence_score}%] Root cause: "${entry.root_cause}" | ` +
          `Area: ${entry.problem_area} | Adopted ${entry.adoption_count} times`
      );
    }
    lines.push("");
  }

  if (pastCAPAs.length > 0) {
    lines.push(`## Past resolved CAPAs for similar issues:`);
    for (const capa of pastCAPAs) {
      lines.push(
        `- Root cause: "${capa.rootCause}" → Actions: ${capa.actions.join("; ")}`
      );
    }
    lines.push("");
  }

  return lines.join("\n");
}

// ========== Main Analysis Function ==========

export async function analyzeCAPARootCause(
  input: CAPAAnalysisInput
): Promise<CAPAAnalysisResult> {
  const lang = input.language || "en";

  // 1. Query KB and past CAPAs
  const [kbEntries, pastCAPAs] = await Promise.all([
    queryKnowledgeBase(input.problemDescription, input.affectedArea),
    queryPastCAPAs(input.affectedArea, input.source),
  ]);

  logger.info(
    `CAPA AI: Found ${kbEntries.length} KB entries, ${pastCAPAs.length} past CAPAs`
  );

  // 2. Build prompts
  const systemPrompt = buildCAPASystemPrompt(lang);
  const userPrompt = buildCAPAUserPrompt(input, kbEntries, pastCAPAs);

  // 3. Call AI
  const { text, provider } = await callAIWithFallback(systemPrompt, userPrompt);

  // 4. Parse JSON response
  let parsed: {
    rootCauses: Array<{ cause: string; confidence: number; reasoning: string }>;
    correctiveActions: Array<{ action: string; priority: string }>;
    preventiveActions: Array<{ action: string; priority: string }>;
  };

  try {
    // Extract JSON from potential markdown code blocks
    const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/) || [
      null,
      text,
    ];
    const jsonStr = (jsonMatch[1] || text).trim();
    parsed = JSON.parse(jsonStr);
  } catch {
    logger.warn("CAPA AI: Failed to parse JSON, attempting fallback parse");
    // Return basic structure if parsing fails
    parsed = {
      rootCauses: [
        {
          cause: text.slice(0, 200),
          confidence: 50,
          reasoning: "AI response could not be parsed as structured JSON",
        },
      ],
      correctiveActions: [],
      preventiveActions: [],
    };
  }

  // 5. Build result, mixing KB entries with AI suggestions
  const suggestedRootCauses: CAPAAnalysisResult["suggestedRootCauses"] = [];

  // Add high-confidence KB entries first
  for (const kb of kbEntries.filter((e) => e.confidence_score >= 70)) {
    suggestedRootCauses.push({
      cause: kb.root_cause,
      confidence: kb.confidence_score,
      reasoning: `Based on ${kb.adoption_count} past adoptions in area "${kb.problem_area}"`,
      source: "kb",
      kb_id: kb.kb_id,
    });
  }

  // Add AI suggestions
  for (const rc of parsed.rootCauses || []) {
    suggestedRootCauses.push({
      cause: rc.cause,
      confidence: rc.confidence || 50,
      reasoning: rc.reasoning || "",
      source: "ai",
    });
  }

  // Add historical patterns
  for (const past of pastCAPAs.slice(0, 2)) {
    const alreadyExists = suggestedRootCauses.some(
      (s) => s.cause.toLowerCase() === past.rootCause.toLowerCase()
    );
    if (!alreadyExists) {
      suggestedRootCauses.push({
        cause: past.rootCause,
        confidence: 60,
        reasoning: "Based on similar resolved CAPA",
        source: "historical",
      });
    }
  }

  return {
    suggestedRootCauses: suggestedRootCauses
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 6),
    suggestedCorrectiveActions: parsed.correctiveActions || [],
    suggestedPreventiveActions: parsed.preventiveActions || [],
    provider,
  };
}
