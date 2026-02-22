/**
 * Executive Report AI Service
 *
 * Collects data from Firestore (KPI snapshots, CAPAs, training results, TQC)
 * and generates an AI-powered executive summary report.
 */

import { logger } from "firebase-functions";
import * as admin from "firebase-admin";
import { callAIWithFallback } from "./aiService";

// Lazy init — db is accessed only after initializeApp() runs in index.ts
function getDb() {
  return admin.firestore();
}

// ========== Types ==========

export interface ExecReportInput {
  period: string; // "YYYY-MM"
  language: "ko" | "en" | "vi";
  sections: {
    includeKPI: boolean;
    includeCAPA: boolean;
    includeTQC: boolean;
    include5PRS: boolean;
    includeTraining: boolean;
  };
}

export interface ExecReportResult {
  report: string; // Markdown
  provider: string;
  dataSnapshot: Record<string, unknown>;
}

// ========== Data Collection ==========

async function collectKPIData(period: string) {
  try {
    const currentSnap = await getDb()
      .collection("kpi_snapshots")
      .doc(period)
      .get();

    // Get previous month
    const [year, month] = period.split("-").map(Number);
    const prevMonth = month === 1 ? 12 : month - 1;
    const prevYear = month === 1 ? year - 1 : year;
    const prevPeriod = `${prevYear}-${String(prevMonth).padStart(2, "0")}`;

    const prevSnap = await getDb()
      .collection("kpi_snapshots")
      .doc(prevPeriod)
      .get();

    return {
      current: currentSnap.exists ? currentSnap.data() : null,
      previous: prevSnap.exists ? prevSnap.data() : null,
      period,
      previousPeriod: prevPeriod,
    };
  } catch (err) {
    logger.warn("Failed to collect KPI data:", err);
    return { current: null, previous: null, period, previousPeriod: "" };
  }
}

async function collectCAPAData() {
  try {
    const snap = await getDb().collection("capas").get();
    const statuses: Record<string, number> = {};
    let overdue = 0;

    for (const doc of snap.docs) {
      const d = doc.data();
      const status = d.status || "unknown";
      statuses[status] = (statuses[status] || 0) + 1;

      if (
        d.dueDate &&
        d.status !== "closed" &&
        d.status !== "rejected"
      ) {
        const dueDate = d.dueDate.toDate
          ? d.dueDate.toDate()
          : new Date(d.dueDate);
        if (dueDate < new Date()) overdue++;
      }
    }

    return { total: snap.size, byStatus: statuses, overdue };
  } catch (err) {
    logger.warn("Failed to collect CAPA data:", err);
    return { total: 0, byStatus: {}, overdue: 0 };
  }
}

async function collectTrainingData(period: string) {
  try {
    const resultsSnap = await getDb().collection("training_results").get();

    let totalResults = 0;
    let passCount = 0;
    let periodResults = 0;
    let periodPass = 0;

    for (const doc of resultsSnap.docs) {
      const d = doc.data();
      totalResults++;
      if (d.result === "pass") passCount++;

      // Check if result is in current period
      const date = d.training_date || d.created_at || "";
      if (typeof date === "string" && date.startsWith(period)) {
        periodResults++;
        if (d.result === "pass") periodPass++;
      }
    }

    return {
      totalResults,
      passCount,
      passRate: totalResults > 0
        ? Math.round((passCount / totalResults) * 100 * 100) / 100
        : 0,
      periodResults,
      periodPass,
      periodPassRate: periodResults > 0
        ? Math.round((periodPass / periodResults) * 100 * 100) / 100
        : 0,
    };
  } catch (err) {
    logger.warn("Failed to collect training data:", err);
    return {
      totalResults: 0,
      passCount: 0,
      passRate: 0,
      periodResults: 0,
      periodPass: 0,
      periodPassRate: 0,
    };
  }
}

async function collectTQCData() {
  try {
    const traineesSnap = await getDb().collection("tqc_trainees").get();
    const resignationsSnap = await getDb().collection("tqc_resignations").get();

    const statusCounts: Record<string, number> = {};
    for (const doc of traineesSnap.docs) {
      const status = doc.data().status || "unknown";
      statusCounts[status] = (statusCounts[status] || 0) + 1;
    }

    return {
      totalTrainees: traineesSnap.size,
      byStatus: statusCounts,
      totalResignations: resignationsSnap.size,
    };
  } catch (err) {
    logger.warn("Failed to collect TQC data:", err);
    return { totalTrainees: 0, byStatus: {}, totalResignations: 0 };
  }
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

function buildExecSystemPrompt(lang: string): string {
  return [
    `You are the Senior Quality Assurance Manager at HWK Vietnam (화승비나), a major footwear manufacturing company.`,
    `Write a professional executive report for management based on the data provided.`,
    ``,
    `RESPOND ENTIRELY IN ${langName(lang)}.`,
    `Use Markdown formatting for the report.`,
    ``,
    `Structure:`,
    `# Monthly Quality & Training Report`,
    `## Executive Summary (3-4 key highlights)`,
    `## KPI Performance (if data available)`,
    `## Training Activities (if data available)`,
    `## CAPA Status (if data available)`,
    `## TQC New Employee Training (if data available)`,
    `## Risks & Concerns`,
    `## Recommendations for Next Month`,
    ``,
    `Be concise, data-driven, and actionable. Use bullet points.`,
    `Include period-over-period comparisons where possible.`,
    `Keep the report between 600-1000 words.`,
  ].join("\n");
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildExecUserPrompt(period: string, data: Record<string, any>): string {
  const lines: string[] = [`## Report Data for ${period}`, ""];

  if (data.kpi?.current) {
    lines.push(`### KPI Data (Current Month)`);
    const kpi = data.kpi.current;
    lines.push(`- Overall Completion Rate: ${kpi.overallCompletionRate ?? "N/A"}%`);
    lines.push(`- Pass Rate: ${kpi.passRate ?? "N/A"}%`);
    lines.push(`- Average Score: ${kpi.averageScore ?? "N/A"}`);
    lines.push(`- Retraining Count: ${kpi.retrainingCount ?? "N/A"}`);
    lines.push(`- Expiring Certificates: ${kpi.expiringCount ?? "N/A"}`);
    lines.push(`- Total Employees: ${kpi.totalEmployees ?? "N/A"}`);

    if (data.kpi.previous) {
      const prev = data.kpi.previous;
      lines.push(`### KPI Data (Previous Month: ${data.kpi.previousPeriod})`);
      lines.push(`- Overall Completion Rate: ${prev.overallCompletionRate ?? "N/A"}%`);
      lines.push(`- Pass Rate: ${prev.passRate ?? "N/A"}%`);
      lines.push(`- Average Score: ${prev.averageScore ?? "N/A"}`);
    }
    lines.push("");
  }

  if (data.capa) {
    lines.push(`### CAPA Summary`);
    lines.push(`- Total: ${data.capa.total}`);
    lines.push(`- By Status: ${JSON.stringify(data.capa.byStatus)}`);
    lines.push(`- Overdue: ${data.capa.overdue}`);
    lines.push("");
  }

  if (data.training) {
    lines.push(`### Training Results`);
    lines.push(`- Total Results: ${data.training.totalResults}`);
    lines.push(`- Overall Pass Rate: ${data.training.passRate}%`);
    lines.push(`- Period Results: ${data.training.periodResults}`);
    lines.push(`- Period Pass Rate: ${data.training.periodPassRate}%`);
    lines.push("");
  }

  if (data.tqc) {
    lines.push(`### New TQC Training`);
    lines.push(`- Total Trainees: ${data.tqc.totalTrainees}`);
    lines.push(`- By Status: ${JSON.stringify(data.tqc.byStatus)}`);
    lines.push(`- Total Resignations: ${data.tqc.totalResignations}`);
    lines.push("");
  }

  return lines.join("\n");
}

// ========== Main Export ==========

export async function generateExecutiveReport(
  input: ExecReportInput
): Promise<ExecReportResult> {
  const { period, language, sections } = input;

  logger.info(`Generating executive report for ${period} in ${language}`);

  // Collect data in parallel
  const [kpi, capa, training, tqc] = await Promise.all([
    sections.includeKPI ? collectKPIData(period) : Promise.resolve(null),
    sections.includeCAPA ? collectCAPAData() : Promise.resolve(null),
    sections.includeTraining
      ? collectTrainingData(period)
      : Promise.resolve(null),
    sections.includeTQC ? collectTQCData() : Promise.resolve(null),
  ]);

  const dataSnapshot = { kpi, capa, training, tqc };

  // Build prompts
  const systemPrompt = buildExecSystemPrompt(language);
  const userPrompt = buildExecUserPrompt(period, dataSnapshot);

  // Call AI
  const { text, provider } = await callAIWithFallback(systemPrompt, userPrompt);

  return {
    report: text,
    provider,
    dataSnapshot,
  };
}
