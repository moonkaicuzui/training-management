/**
 * Trainer Daily Directive Service
 *
 * Generates daily actionable work directives for trainers by:
 * 1. Collecting previous day's 5PRS inspection results
 * 2. Checking training session statuses (PLANNED/OVERDUE)
 * 3. Tracking reject rate trends per inspector
 * 4. Using AI (Gemini) to generate specific instructions
 *
 * Multi-channel delivery: Email + In-app notification
 * Escalation: 24h unacknowledged → manager email
 */

import { logger } from "firebase-functions";
import * as admin from "firebase-admin";
import { callAIWithFallback } from "./aiService";
import { sendEmail } from "./emailService";
import type { FivePrsRawRow } from "./fivePrsApi";
import { fetchMonthData } from "./fivePrsApi";

// ========== Types ==========

export interface DirectiveAction {
  employee_id: string;
  employee_name: string;
  building: string;
  line: string;
  issue: string;
  reject_rate: number;
  threshold: number;
  trend: "increasing" | "stable" | "decreasing";
  instruction: string;
  program_code: string;
  deadline: string;
}

export interface OngoingSessions {
  planned: number;
  overdue: number;
  completed_this_week: number;
  avg_score: number;
}

export interface TrainerDirective {
  directive_id: string;
  date: string;
  generated_at: admin.firestore.Timestamp;
  immediate_actions: DirectiveAction[];
  preventive_actions: DirectiveAction[];
  ongoing_sessions: OngoingSessions;
  ai_recommendations: string[];
  status: "generated" | "sent" | "read" | "acknowledged";
  read_at: admin.firestore.Timestamp | null;
  acknowledged_at: admin.firestore.Timestamp | null;
}

export interface TrainerConfig {
  email: string;
  name: string;
  language: "ko" | "en" | "vi";
}

interface TqcDailyStats {
  tqc_id: string;
  tqc_name: string;
  building: string;
  line: string;
  total_validation: number;
  total_reject: number;
  reject_rate: number;
  defects: Record<string, number>;
  main_defect: string;
}

interface TqcTrend {
  tqc_id: string;
  tqc_name: string;
  building: string;
  line: string;
  current_rate: number;
  previous_rate: number;
  trend: "increasing" | "stable" | "decreasing";
  days_increasing: number;
}

// ========== Constants ==========

const IMMEDIATE_THRESHOLD = 5; // reject rate % that triggers immediate action
const PREVENTIVE_THRESHOLD = 3; // reject rate % that triggers preventive action
const ESCALATION_HOURS = 24;
const MANAGER_EMAIL = "ksmoon@hsvina.com";

// ========== Core Logic ==========

/**
 * Collect previous day's 5PRS inspection data
 */
async function collectYesterdayInspectionData(): Promise<TqcDailyStats[]> {
  const now = new Date();
  // Vietnam timezone offset: +7h
  const vnNow = new Date(now.getTime() + 7 * 60 * 60 * 1000);
  const yesterday = new Date(vnNow);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split("T")[0];

  const yearMonth = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, "0")}`;

  logger.info(`Collecting 5PRS data for ${yesterdayStr} (month: ${yearMonth})`);

  let rawData: FivePrsRawRow[];
  try {
    rawData = await fetchMonthData(yearMonth);
  } catch (err) {
    logger.warn(`Failed to fetch 5PRS data for ${yearMonth}:`, err);
    return [];
  }

  // Filter to yesterday's data
  const yesterdayData = rawData.filter((row) => {
    const inspDate = row["Inspection Date"];
    if (!inspDate) return false;
    // Handle various date formats
    const normalized = inspDate.includes("/")
      ? inspDate.split("/").reverse().join("-")
      : inspDate;
    return normalized.startsWith(yesterdayStr);
  });

  logger.info(`Found ${yesterdayData.length} rows for ${yesterdayStr}`);

  if (yesterdayData.length === 0) return [];

  // Aggregate by TQC
  const tqcMap = new Map<string, TqcDailyStats>();

  for (const row of yesterdayData) {
    const tqcId = row["TQC ID"] || "";
    const tqcName = row["TQC Name"] || "";
    if (!tqcId) continue;

    let stats = tqcMap.get(tqcId);
    if (!stats) {
      stats = {
        tqc_id: tqcId,
        tqc_name: tqcName,
        building: row.Building || "",
        line: row.Line || "",
        total_validation: 0,
        total_reject: 0,
        reject_rate: 0,
        defects: {},
        main_defect: "",
      };
      tqcMap.set(tqcId, stats);
    }

    const validation = parseInt(row["Validation Qty"] || "0", 10);
    const reject = parseInt(row["Reject Qty"] || "0", 10);
    stats.total_validation += validation;
    stats.total_reject += reject;

    // Parse defect types from Error column
    const errorStr = row.Error || "";
    if (errorStr && reject > 0) {
      const defectTypes = errorStr.split(/[,;/]/).map((d) => d.trim()).filter(Boolean);
      for (const defect of defectTypes) {
        stats.defects[defect] = (stats.defects[defect] || 0) + 1;
      }
    }
  }

  // Calculate rates and main defects
  const results: TqcDailyStats[] = [];
  for (const stats of tqcMap.values()) {
    if (stats.total_validation > 0) {
      stats.reject_rate = Math.round(
        (stats.total_reject / stats.total_validation) * 10000
      ) / 100;
    }

    // Find main defect
    let maxCount = 0;
    for (const [defect, count] of Object.entries(stats.defects)) {
      if (count > maxCount) {
        maxCount = count;
        stats.main_defect = defect;
      }
    }

    results.push(stats);
  }

  return results;
}

/**
 * Track reject rate trends from recent 5PRS data
 */
async function trackRejectRateTrends(
  currentStats: TqcDailyStats[]
): Promise<Map<string, TqcTrend>> {
  const db = admin.firestore();
  const trends = new Map<string, TqcTrend>();

  // Get recent directives to build trend data
  const recentDirectives = await db
    .collection("trainer_directives")
    .orderBy("generated_at", "desc")
    .limit(7)
    .get();

  // Build historical reject rates per TQC
  const historicalRates = new Map<string, number[]>();

  for (const doc of recentDirectives.docs) {
    const data = doc.data();
    const allActions = [
      ...(data.immediate_actions || []),
      ...(data.preventive_actions || []),
    ];
    for (const action of allActions) {
      if (!action.employee_id) continue;
      const rates = historicalRates.get(action.employee_id) || [];
      rates.push(action.reject_rate || 0);
      historicalRates.set(action.employee_id, rates);
    }
  }

  for (const stats of currentStats) {
    const previousRates = historicalRates.get(stats.tqc_id) || [];
    const avgPreviousRate = previousRates.length > 0
      ? previousRates.reduce((a, b) => a + b, 0) / previousRates.length
      : 0;

    let trendDirection: "increasing" | "stable" | "decreasing" = "stable";
    let daysIncreasing = 0;

    if (stats.reject_rate > avgPreviousRate + 0.5) {
      trendDirection = "increasing";
      // Count consecutive increasing days
      for (const rate of previousRates) {
        if (rate > avgPreviousRate) daysIncreasing++;
        else break;
      }
      daysIncreasing++;
    } else if (stats.reject_rate < avgPreviousRate - 0.5) {
      trendDirection = "decreasing";
    }

    trends.set(stats.tqc_id, {
      tqc_id: stats.tqc_id,
      tqc_name: stats.tqc_name,
      building: stats.building,
      line: stats.line,
      current_rate: stats.reject_rate,
      previous_rate: Math.round(avgPreviousRate * 100) / 100,
      trend: trendDirection,
      days_increasing: daysIncreasing,
    });
  }

  return trends;
}

/**
 * Check training session statuses
 */
async function checkSessionStatuses(): Promise<OngoingSessions> {
  const db = admin.firestore();
  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay() + 1); // Monday
  startOfWeek.setHours(0, 0, 0, 0);

  let planned = 0;
  let overdue = 0;
  let completedThisWeek = 0;
  let totalScore = 0;
  let scoreCount = 0;

  try {
    // Check PLANNED sessions
    const plannedSnap = await db
      .collection("training_sessions")
      .where("status", "==", "PLANNED")
      .get();
    planned = plannedSnap.size;

    // Check OVERDUE sessions (PLANNED but past date)
    for (const doc of plannedSnap.docs) {
      const sessionData = doc.data();
      const sessionDate = sessionData.session_date || sessionData.date;
      if (sessionDate) {
        const dateStr = typeof sessionDate === "string"
          ? sessionDate
          : sessionDate.toDate?.()?.toISOString().split("T")[0] || "";
        if (dateStr && dateStr < now.toISOString().split("T")[0]) {
          overdue++;
        }
      }
    }

    // Check completed this week
    const completedSnap = await db
      .collection("training_results")
      .where("result", "==", "pass")
      .get();

    for (const doc of completedSnap.docs) {
      const data = doc.data();
      const trainingDate = data.training_date || data.created_at || "";
      const dateStr = typeof trainingDate === "string"
        ? trainingDate
        : trainingDate.toDate?.()?.toISOString().split("T")[0] || "";

      if (dateStr >= startOfWeek.toISOString().split("T")[0]) {
        completedThisWeek++;
        if (data.score && typeof data.score === "number") {
          totalScore += data.score;
          scoreCount++;
        }
      }
    }
  } catch (err) {
    logger.warn("Error checking session statuses:", err);
  }

  return {
    planned,
    overdue,
    completed_this_week: completedThisWeek,
    avg_score: scoreCount > 0 ? Math.round(totalScore / scoreCount) : 0,
  };
}

/**
 * Resolve TQC IDs to employee information via tqc_employee_links
 */
async function resolveTqcToEmployees(
  tqcIds: string[]
): Promise<Map<string, { employee_id: string; employee_name: string }>> {
  const db = admin.firestore();
  const linkMap = new Map<string, { employee_id: string; employee_name: string }>();

  if (tqcIds.length === 0) return linkMap;

  const linksSnap = await db.collection("tqc_employee_links").get();
  for (const doc of linksSnap.docs) {
    const data = doc.data();
    if (tqcIds.includes(data.tqc_id)) {
      linkMap.set(data.tqc_id, {
        employee_id: data.employee_id,
        employee_name: data.employee_name || data.tqc_name,
      });
    }
  }

  return linkMap;
}

/**
 * Find matching training program for a defect type
 */
async function findProgramForDefect(defectType: string): Promise<string> {
  const db = admin.firestore();

  try {
    const mappingsSnap = await db
      .collection("defect_training_mappings")
      .where("is_active", "==", true)
      .get();

    for (const doc of mappingsSnap.docs) {
      const data = doc.data();
      const defectLower = defectType.toLowerCase();
      const mappingDefect = (data.defect_type || "").toLowerCase();

      if (defectLower.includes(mappingDefect) || mappingDefect.includes(defectLower)) {
        const codes = data.program_codes || [];
        if (codes.length > 0) return codes[0];
      }
    }
  } catch (err) {
    logger.warn("Error finding program for defect:", err);
  }

  // Default program code based on common defect patterns
  const defectLower = defectType.toLowerCase();
  if (defectLower.includes("stitch")) return "QC-STITCH";
  if (defectLower.includes("pack")) return "QC-PACK";
  if (defectLower.includes("sole") || defectLower.includes("bond")) return "QC-SOLE";
  if (defectLower.includes("cut")) return "QC-CUT";
  if (defectLower.includes("color") || defectLower.includes("shade")) return "QC-COLOR";
  return "QC-GENERAL";
}

/**
 * Generate AI recommendations using Gemini
 */
async function generateAIRecommendations(
  immediateActions: DirectiveAction[],
  preventiveActions: DirectiveAction[],
  sessions: OngoingSessions,
  trends: Map<string, TqcTrend>,
  dateStr: string
): Promise<string[]> {
  const systemPrompt = [
    "You are a Senior Quality Training Coordinator at HWK Vietnam (footwear manufacturing).",
    "Based on the daily inspection data and training status, generate 3-5 specific, actionable recommendations for the trainer.",
    "Focus on:",
    "- Patterns in defect data that need attention",
    "- Training session scheduling priorities",
    "- Inspector performance trends that need intervention",
    "- Any equipment or process issues suggested by the data",
    "",
    "Respond with a JSON array of strings. Each recommendation should be 1-2 sentences, specific and actionable.",
    "Example: [\"Building B Stitching defects increased 3 days in a row. Recommend line-level equipment inspection alongside training.\", ...]",
    "Respond ONLY with the JSON array, no markdown or explanation.",
  ].join("\n");

  const trendSummary = Array.from(trends.values())
    .filter((t) => t.trend === "increasing")
    .map((t) => `${t.tqc_name}: ${t.previous_rate}% -> ${t.current_rate}% (${t.days_increasing} days increasing)`)
    .join("\n");

  const userPrompt = [
    `Date: ${dateStr}`,
    "",
    `Immediate Actions (reject rate > ${IMMEDIATE_THRESHOLD}%): ${immediateActions.length}`,
    ...immediateActions.map(
      (a) => `  - ${a.employee_name} | ${a.building} ${a.line} | ${a.reject_rate}% | ${a.issue}`
    ),
    "",
    `Preventive Actions (approaching ${PREVENTIVE_THRESHOLD}-${IMMEDIATE_THRESHOLD}%): ${preventiveActions.length}`,
    ...preventiveActions.map(
      (a) => `  - ${a.employee_name} | ${a.building} ${a.line} | ${a.reject_rate}% | ${a.issue}`
    ),
    "",
    `Training Sessions: ${sessions.planned} planned, ${sessions.overdue} overdue, ${sessions.completed_this_week} completed this week`,
    sessions.avg_score > 0 ? `Average Score: ${sessions.avg_score}/100` : "",
    "",
    "Worsening Trends:",
    trendSummary || "  None detected",
  ].join("\n");

  try {
    const result = await callAIWithFallback(systemPrompt, userPrompt);
    const parsed = JSON.parse(result.text);
    if (Array.isArray(parsed)) {
      return parsed.filter((item): item is string => typeof item === "string");
    }
    return [result.text];
  } catch (err) {
    logger.warn("AI recommendation generation failed, using fallback:", err);
    // Fallback recommendations
    const fallback: string[] = [];
    if (immediateActions.length > 0) {
      fallback.push(
        `${immediateActions.length} inspector(s) exceed the ${IMMEDIATE_THRESHOLD}% reject threshold. Prioritize on-site visits today.`
      );
    }
    if (sessions.overdue > 0) {
      fallback.push(
        `${sessions.overdue} training session(s) are overdue. Reschedule immediately to maintain compliance.`
      );
    }
    if (preventiveActions.length > 0) {
      fallback.push(
        `${preventiveActions.length} inspector(s) are approaching the reject threshold. Schedule preventive training this week.`
      );
    }
    if (fallback.length === 0) {
      fallback.push("All metrics within acceptable range. Continue monitoring daily.");
    }
    return fallback;
  }
}

// ========== Email Template ==========

function buildDirectiveEmailHtml(
  directive: Omit<TrainerDirective, "generated_at" | "read_at" | "acknowledged_at">,
  language: "ko" | "en" | "vi"
): string {
  const labels = {
    ko: {
      title: "오늘의 업무 지시",
      immediate: "긴급 조치 (IMMEDIATE)",
      preventive: "예방 조치 (PREVENTIVE)",
      ongoingSessions: "진행 중 교육 현황",
      aiRecommendations: "AI 권고사항",
      problem: "문제",
      trend: "추이",
      instruction: "지시",
      program: "교육 프로그램",
      deadline: "완료 기한",
      plannedSessions: "예정된 세션",
      overdueSessions: "미완료 세션",
      completedThisWeek: "금주 완료",
      avgScore: "평균 점수",
      acknowledge: "확인",
      noActions: "오늘은 긴급 조치 사항이 없습니다.",
      trendIncreasing: "악화 중",
      trendStable: "안정",
      trendDecreasing: "개선 중",
      cases: "건",
    },
    en: {
      title: "Daily Work Directive",
      immediate: "Immediate Actions (URGENT)",
      preventive: "Preventive Actions",
      ongoingSessions: "Ongoing Training Status",
      aiRecommendations: "AI Recommendations",
      problem: "Issue",
      trend: "Trend",
      instruction: "Instruction",
      program: "Training Program",
      deadline: "Deadline",
      plannedSessions: "Planned Sessions",
      overdueSessions: "Overdue Sessions",
      completedThisWeek: "Completed This Week",
      avgScore: "Average Score",
      acknowledge: "Acknowledge",
      noActions: "No urgent actions required today.",
      trendIncreasing: "Worsening",
      trendStable: "Stable",
      trendDecreasing: "Improving",
      cases: "cases",
    },
    vi: {
      title: "Chi thi cong viec hang ngay",
      immediate: "Hanh dong khan cap (IMMEDIATE)",
      preventive: "Hanh dong phong ngua",
      ongoingSessions: "Tinh trang dao tao dang dien ra",
      aiRecommendations: "Khuyen nghi cua AI",
      problem: "Van de",
      trend: "Xu huong",
      instruction: "Chi thi",
      program: "Chuong trinh dao tao",
      deadline: "Han chot",
      plannedSessions: "Buoi da len ke hoach",
      overdueSessions: "Buoi qua han",
      completedThisWeek: "Hoan thanh tuan nay",
      avgScore: "Diem trung binh",
      acknowledge: "Xac nhan",
      noActions: "Hom nay khong co hanh dong khan cap.",
      trendIncreasing: "Xau di",
      trendStable: "On dinh",
      trendDecreasing: "Cai thien",
      cases: "vu",
    },
  };

  const l = labels[language];
  const trendLabel = (t: string) => {
    if (t === "increasing") return l.trendIncreasing;
    if (t === "decreasing") return l.trendDecreasing;
    return l.trendStable;
  };

  const renderActionRows = (actions: DirectiveAction[]) =>
    actions
      .map(
        (a, i) => `
      <tr style="background:${i % 2 === 0 ? "#ffffff" : "#f9fafb"};">
        <td style="padding:12px;border-bottom:1px solid #e5e7eb;font-weight:600;">${a.employee_name}</td>
        <td style="padding:12px;border-bottom:1px solid #e5e7eb;">${a.building}, ${a.line}</td>
        <td style="padding:12px;border-bottom:1px solid #e5e7eb;text-align:center;">
          <span style="font-weight:700;color:${a.reject_rate >= IMMEDIATE_THRESHOLD ? "#dc2626" : "#d97706"};">
            ${a.reject_rate}%
          </span>
        </td>
        <td style="padding:12px;border-bottom:1px solid #e5e7eb;">${a.issue}</td>
        <td style="padding:12px;border-bottom:1px solid #e5e7eb;">
          <span style="padding:2px 8px;border-radius:9999px;font-size:12px;font-weight:500;background:${
            a.trend === "increasing" ? "#fef2f2;color:#dc2626" : a.trend === "decreasing" ? "#ecfdf5;color:#059669" : "#f9fafb;color:#6b7280"
          };">${trendLabel(a.trend)}</span>
        </td>
        <td style="padding:12px;border-bottom:1px solid #e5e7eb;">${a.instruction}</td>
        <td style="padding:12px;border-bottom:1px solid #e5e7eb;">${a.program_code}</td>
        <td style="padding:12px;border-bottom:1px solid #e5e7eb;">${a.deadline}</td>
      </tr>`
      )
      .join("");

  const actionTableHeaders = `
    <tr style="background:#f3f4f6;">
      <th style="padding:10px 12px;text-align:left;font-size:13px;font-weight:600;color:#374151;border-bottom:2px solid #d1d5db;">Inspector</th>
      <th style="padding:10px 12px;text-align:left;font-size:13px;font-weight:600;color:#374151;border-bottom:2px solid #d1d5db;">Location</th>
      <th style="padding:10px 12px;text-align:center;font-size:13px;font-weight:600;color:#374151;border-bottom:2px solid #d1d5db;">Reject %</th>
      <th style="padding:10px 12px;text-align:left;font-size:13px;font-weight:600;color:#374151;border-bottom:2px solid #d1d5db;">${l.problem}</th>
      <th style="padding:10px 12px;text-align:left;font-size:13px;font-weight:600;color:#374151;border-bottom:2px solid #d1d5db;">${l.trend}</th>
      <th style="padding:10px 12px;text-align:left;font-size:13px;font-weight:600;color:#374151;border-bottom:2px solid #d1d5db;">${l.instruction}</th>
      <th style="padding:10px 12px;text-align:left;font-size:13px;font-weight:600;color:#374151;border-bottom:2px solid #d1d5db;">${l.program}</th>
      <th style="padding:10px 12px;text-align:left;font-size:13px;font-weight:600;color:#374151;border-bottom:2px solid #d1d5db;">${l.deadline}</th>
    </tr>`;

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
<table role="presentation" width="100%" style="background:#f3f4f6;">
<tr><td style="padding:24px 16px;">
<table role="presentation" width="700" style="max-width:700px;width:100%;margin:0 auto;background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.08);">

  <!-- Header -->
  <tr><td style="background:#1a56db;padding:24px 32px;">
    <table width="100%"><tr>
      <td><span style="font-size:24px;font-weight:700;color:#fff;">Q-TRAIN</span></td>
      <td style="text-align:right;"><span style="font-size:14px;color:rgba(255,255,255,0.8);">${directive.date}</span></td>
    </tr></table>
    <p style="margin:8px 0 0;font-size:18px;font-weight:600;color:#fff;">${l.title}</p>
  </td></tr>

  <!-- Body -->
  <tr><td style="padding:24px 32px;">

    ${directive.immediate_actions.length > 0 ? `
    <!-- Immediate Actions -->
    <div style="margin-bottom:24px;border-left:4px solid #dc2626;padding-left:16px;">
      <h2 style="margin:0 0 12px;font-size:16px;color:#dc2626;">&#x1F534; ${l.immediate}</h2>
      <div style="overflow-x:auto;">
        <table role="presentation" width="100%" style="border-collapse:collapse;border:1px solid #e5e7eb;border-radius:6px;font-size:13px;">
          ${actionTableHeaders}
          ${renderActionRows(directive.immediate_actions)}
        </table>
      </div>
    </div>` : `
    <div style="margin-bottom:24px;padding:16px;background:#ecfdf5;border-radius:8px;border:1px solid #a7f3d0;">
      <p style="margin:0;color:#059669;font-size:14px;">&#x2705; ${l.noActions}</p>
    </div>`}

    ${directive.preventive_actions.length > 0 ? `
    <!-- Preventive Actions -->
    <div style="margin-bottom:24px;border-left:4px solid #d97706;padding-left:16px;">
      <h2 style="margin:0 0 12px;font-size:16px;color:#d97706;">&#x1F7E1; ${l.preventive}</h2>
      <div style="overflow-x:auto;">
        <table role="presentation" width="100%" style="border-collapse:collapse;border:1px solid #e5e7eb;border-radius:6px;font-size:13px;">
          ${actionTableHeaders}
          ${renderActionRows(directive.preventive_actions)}
        </table>
      </div>
    </div>` : ""}

    <!-- Ongoing Sessions -->
    <div style="margin-bottom:24px;border-left:4px solid #1a56db;padding-left:16px;">
      <h2 style="margin:0 0 12px;font-size:16px;color:#1a56db;">&#x1F4CA; ${l.ongoingSessions}</h2>
      <table role="presentation" style="border-collapse:collapse;">
        <tr>
          <td style="padding:8px 16px 8px 0;color:#6b7280;font-size:14px;">${l.plannedSessions}:</td>
          <td style="padding:8px 0;font-weight:600;font-size:14px;">${directive.ongoing_sessions.planned} ${l.cases}</td>
        </tr>
        <tr>
          <td style="padding:8px 16px 8px 0;color:#6b7280;font-size:14px;">${l.overdueSessions}:</td>
          <td style="padding:8px 0;font-weight:600;font-size:14px;${directive.ongoing_sessions.overdue > 0 ? "color:#dc2626;" : ""}">${directive.ongoing_sessions.overdue} ${l.cases}</td>
        </tr>
        <tr>
          <td style="padding:8px 16px 8px 0;color:#6b7280;font-size:14px;">${l.completedThisWeek}:</td>
          <td style="padding:8px 0;font-weight:600;font-size:14px;">${directive.ongoing_sessions.completed_this_week} ${l.cases}</td>
        </tr>
        ${directive.ongoing_sessions.avg_score > 0 ? `
        <tr>
          <td style="padding:8px 16px 8px 0;color:#6b7280;font-size:14px;">${l.avgScore}:</td>
          <td style="padding:8px 0;font-weight:600;font-size:14px;">${directive.ongoing_sessions.avg_score}/100</td>
        </tr>` : ""}
      </table>
    </div>

    ${directive.ai_recommendations.length > 0 ? `
    <!-- AI Recommendations -->
    <div style="margin-bottom:24px;border-left:4px solid #7c3aed;padding-left:16px;">
      <h2 style="margin:0 0 12px;font-size:16px;color:#7c3aed;">&#x1F4A1; ${l.aiRecommendations}</h2>
      <ul style="margin:0;padding-left:20px;">
        ${directive.ai_recommendations.map((r) => `<li style="margin-bottom:8px;font-size:14px;color:#374151;line-height:1.5;">${r}</li>`).join("")}
      </ul>
    </div>` : ""}

    <!-- Acknowledge Button -->
    <div style="text-align:center;margin:32px 0 16px;">
      <a href="https://q-train-web.web.app/trainer-directives" target="_blank"
         style="display:inline-block;padding:14px 32px;background:#1a56db;color:#fff;text-decoration:none;border-radius:8px;font-weight:600;font-size:15px;">
        ${l.acknowledge}
      </a>
    </div>

  </td></tr>

  <!-- Footer -->
  <tr><td style="padding:16px 32px;border-top:1px solid #e5e7eb;background:#f9fafb;">
    <p style="margin:0;font-size:12px;color:#9ca3af;">HWK Vietnam | Q-TRAIN Training Management System</p>
    <p style="margin:4px 0 0;font-size:11px;color:#9ca3af;font-style:italic;">This email was automatically generated by Q-TRAIN.</p>
  </td></tr>

</table>
</td></tr></table>
</body></html>`;
}

// ========== Main Entry Point ==========

/**
 * Generate daily trainer directive
 * Called by scheduled Cloud Function at 07:30 Asia/Ho_Chi_Minh
 */
export async function generateDailyTrainerDirective(): Promise<void> {
  const db = admin.firestore();

  // Date for directive (today in Vietnam timezone)
  const now = new Date();
  const vnNow = new Date(now.getTime() + 7 * 60 * 60 * 1000);
  const dateStr = vnNow.toISOString().split("T")[0];
  const directiveId = `directive-${dateStr}`;

  logger.info(`Generating daily trainer directive for ${dateStr}`);

  // 1. Collect yesterday's inspection data
  const inspectionStats = await collectYesterdayInspectionData();
  logger.info(`Collected ${inspectionStats.length} TQC records`);

  // 2. Track reject rate trends
  const trends = await trackRejectRateTrends(inspectionStats);

  // 3. Check session statuses
  const sessions = await checkSessionStatuses();

  // 4. Resolve TQC IDs to employee info
  const tqcIds = inspectionStats.map((s) => s.tqc_id);
  const employeeMap = await resolveTqcToEmployees(tqcIds);

  // 5. Build immediate and preventive actions
  const immediateActions: DirectiveAction[] = [];
  const preventiveActions: DirectiveAction[] = [];

  for (const stats of inspectionStats) {
    if (stats.total_validation < 10) continue; // Skip very small samples

    const employee = employeeMap.get(stats.tqc_id);
    const trend = trends.get(stats.tqc_id);
    const trendDirection = trend?.trend || "stable";

    const programCode = await findProgramForDefect(stats.main_defect);

    const action: DirectiveAction = {
      employee_id: employee?.employee_id || stats.tqc_id,
      employee_name: employee?.employee_name || stats.tqc_name,
      building: stats.building,
      line: stats.line,
      issue: `${stats.main_defect} reject rate ${stats.reject_rate}% (${stats.total_reject}/${stats.total_validation})`,
      reject_rate: stats.reject_rate,
      threshold: IMMEDIATE_THRESHOLD,
      trend: trendDirection,
      instruction: "",
      program_code: programCode,
      deadline: "",
    };

    if (stats.reject_rate >= IMMEDIATE_THRESHOLD) {
      action.instruction = `Visit ${stats.building} ${stats.line} today. Conduct 1:1 ${stats.main_defect} defect identification training.`;
      action.deadline = `${dateStr} 12:00`;
      action.threshold = IMMEDIATE_THRESHOLD;
      immediateActions.push(action);
    } else if (stats.reject_rate >= PREVENTIVE_THRESHOLD) {
      action.instruction = `Schedule ${stats.main_defect} training session within this week.`;
      // Deadline: end of current week (Friday)
      const friday = new Date(vnNow);
      friday.setDate(friday.getDate() + (5 - friday.getDay()));
      action.deadline = friday.toISOString().split("T")[0];
      action.threshold = PREVENTIVE_THRESHOLD;
      preventiveActions.push(action);
    }
  }

  // Sort by reject rate descending
  immediateActions.sort((a, b) => b.reject_rate - a.reject_rate);
  preventiveActions.sort((a, b) => b.reject_rate - a.reject_rate);

  // 6. Generate AI recommendations
  const aiRecommendations = await generateAIRecommendations(
    immediateActions,
    preventiveActions,
    sessions,
    trends,
    dateStr
  );

  // 7. Save to Firestore
  const directiveData: Record<string, unknown> = {
    directive_id: directiveId,
    date: dateStr,
    generated_at: admin.firestore.FieldValue.serverTimestamp(),
    immediate_actions: immediateActions,
    preventive_actions: preventiveActions,
    ongoing_sessions: sessions,
    ai_recommendations: aiRecommendations,
    status: "generated",
    read_at: null,
    acknowledged_at: null,
  };

  await db.collection("trainer_directives").doc(directiveId).set(directiveData);
  logger.info(`Directive ${directiveId} saved to Firestore`);

  // 8. Send notification (in-app)
  await db.collection("notifications").add({
    type: "SYSTEM",
    priority: immediateActions.length > 0 ? "HIGH" : "MEDIUM",
    title: `Daily Directive - ${dateStr}`,
    message: `${immediateActions.length} immediate, ${preventiveActions.length} preventive actions. ${sessions.overdue} overdue sessions.`,
    recipient_type: "ALL",
    is_read: false,
    related_entity: {
      type: "SESSION",
      id: directiveId,
    },
    created_at: admin.firestore.FieldValue.serverTimestamp(),
  });

  // 9. Send email to trainers
  const emailUser = process.env.GMAIL_USER;
  const emailPass = process.env.GMAIL_APP_PASSWORD;

  if (emailUser && emailPass) {
    // Get trainer config
    let trainerConfigs: TrainerConfig[] = [];
    try {
      const configSnap = await db.collection("trainer_config").get();
      trainerConfigs = configSnap.docs.map((doc) => ({
        email: doc.data().email || "",
        name: doc.data().name || "",
        language: (doc.data().language as "ko" | "en" | "vi") || "en",
      }));
    } catch {
      // Default recipients
      trainerConfigs = [
        { email: "ksmoon@hsvina.com", name: "K.S. Moon", language: "en" },
        { email: "hwk_qa@hsvina.com", name: "QA Team", language: "en" },
      ];
    }

    if (trainerConfigs.length === 0) {
      trainerConfigs = [
        { email: "ksmoon@hsvina.com", name: "K.S. Moon", language: "en" },
      ];
    }

    for (const config of trainerConfigs) {
      if (!config.email) continue;

      const directiveForEmail = {
        directive_id: directiveId,
        date: dateStr,
        immediate_actions: immediateActions,
        preventive_actions: preventiveActions,
        ongoing_sessions: sessions,
        ai_recommendations: aiRecommendations,
        status: "sent" as const,
        read_at: null,
        acknowledged_at: null,
      };

      const html = buildDirectiveEmailHtml(directiveForEmail, config.language);

      await sendEmail(
        {
          to: config.email,
          subject: `[Q-TRAIN] Daily Trainer Directive - ${dateStr}`,
          html,
        },
        emailUser,
        emailPass
      );

      logger.info(`Directive email sent to ${config.email}`);
    }

    // Update status to "sent"
    await db.collection("trainer_directives").doc(directiveId).update({
      status: "sent",
    });
  } else {
    logger.warn("Gmail credentials not configured. Skipping directive email.");
  }

  logger.info(
    `Daily directive complete: ${immediateActions.length} immediate, ${preventiveActions.length} preventive, ${aiRecommendations.length} AI recommendations`
  );
}

/**
 * Check for unacknowledged directives and escalate
 * Called by scheduled Cloud Function at 07:00 (next day)
 */
export async function checkDirectiveEscalation(): Promise<void> {
  const db = admin.firestore();

  const cutoff = new Date();
  cutoff.setHours(cutoff.getHours() - ESCALATION_HOURS);
  const cutoffTimestamp = admin.firestore.Timestamp.fromDate(cutoff);

  try {
    const unacknowledged = await db
      .collection("trainer_directives")
      .where("status", "in", ["generated", "sent"])
      .where("generated_at", "<", cutoffTimestamp)
      .get();

    if (unacknowledged.empty) {
      logger.info("No unacknowledged directives to escalate.");
      return;
    }

    const emailUser = process.env.GMAIL_USER;
    const emailPass = process.env.GMAIL_APP_PASSWORD;

    if (!emailUser || !emailPass) {
      logger.warn("Gmail credentials not configured. Cannot send escalation.");
      return;
    }

    for (const doc of unacknowledged.docs) {
      const data = doc.data();
      const directiveDate = data.date;
      const immediateCount = (data.immediate_actions || []).length;

      await sendEmail(
        {
          to: MANAGER_EMAIL,
          subject: `[Q-TRAIN] ESCALATION: Unacknowledged Directive - ${directiveDate}`,
          html: `
            <h2>Unacknowledged Trainer Directive</h2>
            <p>The daily trainer directive for <strong>${directiveDate}</strong> has not been acknowledged after ${ESCALATION_HOURS} hours.</p>
            <p><strong>Immediate Actions:</strong> ${immediateCount}</p>
            <p><strong>Status:</strong> ${data.status}</p>
            <p><a href="https://q-train-web.web.app/trainer-directives" style="display:inline-block;padding:10px 24px;background:#dc2626;color:#fff;text-decoration:none;border-radius:6px;">View Directive</a></p>
          `,
        },
        emailUser,
        emailPass
      );

      logger.info(`Escalation sent for directive ${directiveDate}`);
    }
  } catch (err) {
    logger.error("Error during directive escalation check:", err);
  }
}

/**
 * Track training effectiveness (weekly)
 * Compares pre/post training reject rates
 */
export async function trackTrainingEffectiveness(): Promise<void> {
  const db = admin.firestore();
  const now = new Date();
  const vnNow = new Date(now.getTime() + 7 * 60 * 60 * 1000);
  const yearMonth = `${vnNow.getFullYear()}-${String(vnNow.getMonth() + 1).padStart(2, "0")}`;
  const effectivenessId = `effectiveness-${yearMonth}-W${Math.ceil(vnNow.getDate() / 7)}`;

  logger.info(`Running training effectiveness tracking: ${effectivenessId}`);

  try {
    // 1. Get completed training sessions from this month
    const resultsSnap = await db
      .collection("training_results")
      .where("result", "==", "pass")
      .get();

    // Filter to this month's results
    const monthlyResults = resultsSnap.docs.filter((doc) => {
      const data = doc.data();
      const date = data.training_date || data.created_at || "";
      return typeof date === "string" && date.startsWith(yearMonth);
    });

    if (monthlyResults.length === 0) {
      logger.info("No completed training this month. Skipping effectiveness tracking.");
      return;
    }

    // 2. Get employee IDs who completed training
    const trainedEmployeeIds = new Set<string>();
    const employeeProgramMap = new Map<string, string[]>();

    for (const doc of monthlyResults) {
      const data = doc.data();
      const empId = data.employee_id;
      if (empId) {
        trainedEmployeeIds.add(empId);
        const programs = employeeProgramMap.get(empId) || [];
        programs.push(data.program_code || "");
        employeeProgramMap.set(empId, programs);
      }
    }

    // 3. Get TQC links for these employees
    const linksSnap = await db.collection("tqc_employee_links").get();
    const employeeToTqc = new Map<string, string>();
    for (const doc of linksSnap.docs) {
      const data = doc.data();
      if (trainedEmployeeIds.has(data.employee_id)) {
        employeeToTqc.set(data.employee_id, data.tqc_id);
      }
    }

    // 4. Compare directive data before and after training
    const directiveSnap = await db
      .collection("trainer_directives")
      .orderBy("generated_at", "desc")
      .limit(30)
      .get();

    const employeeMetrics: Array<{
      employee_id: string;
      employee_name: string;
      programs_completed: string[];
      pre_training_rate: number;
      post_training_rate: number;
      improvement_rate: number;
    }> = [];

    for (const [empId, tqcId] of employeeToTqc) {
      const preRates: number[] = [];
      const postRates: number[] = [];

      for (const doc of directiveSnap.docs) {
        const data = doc.data();
        const allActions = [
          ...(data.immediate_actions || []),
          ...(data.preventive_actions || []),
        ];

        for (const action of allActions) {
          if (action.employee_id === empId || action.employee_id === tqcId) {
            // Simple heuristic: directives before mid-month are "pre", after are "post"
            const directiveDate = data.date || "";
            const day = parseInt(directiveDate.split("-")[2] || "15", 10);
            if (day <= 15) preRates.push(action.reject_rate || 0);
            else postRates.push(action.reject_rate || 0);
          }
        }
      }

      const preAvg = preRates.length > 0
        ? preRates.reduce((a, b) => a + b, 0) / preRates.length
        : 0;
      const postAvg = postRates.length > 0
        ? postRates.reduce((a, b) => a + b, 0) / postRates.length
        : preAvg;
      const improvement = preAvg > 0
        ? Math.round(((preAvg - postAvg) / preAvg) * 10000) / 100
        : 0;

      // Get employee name from links
      const linkDoc = linksSnap.docs.find((d) => d.data().employee_id === empId);
      const empName = linkDoc?.data().employee_name || empId;

      employeeMetrics.push({
        employee_id: empId,
        employee_name: empName,
        programs_completed: employeeProgramMap.get(empId) || [],
        pre_training_rate: Math.round(preAvg * 100) / 100,
        post_training_rate: Math.round(postAvg * 100) / 100,
        improvement_rate: improvement,
      });
    }

    // 5. Calculate aggregate metrics
    const totalTrained = employeeMetrics.length;
    const avgImprovement = totalTrained > 0
      ? Math.round(
          (employeeMetrics.reduce((sum, m) => sum + m.improvement_rate, 0) /
            totalTrained) * 100
        ) / 100
      : 0;
    const improvedCount = employeeMetrics.filter(
      (m) => m.improvement_rate > 0
    ).length;

    // 6. Save to Firestore
    await db.collection("training_effectiveness").doc(effectivenessId).set({
      effectiveness_id: effectivenessId,
      year_month: yearMonth,
      generated_at: admin.firestore.FieldValue.serverTimestamp(),
      total_trained_employees: totalTrained,
      average_improvement_rate: avgImprovement,
      improved_count: improvedCount,
      unchanged_count: totalTrained - improvedCount,
      employee_metrics: employeeMetrics,
    });

    // 7. Update unified_quality_metrics for Quality OS
    await db.collection("unified_quality_metrics").doc(`training-effectiveness-${yearMonth}`).set({
      metric_type: "training_effectiveness",
      year_month: yearMonth,
      source: "q-train",
      data: {
        total_trained: totalTrained,
        avg_improvement: avgImprovement,
        improved_count: improvedCount,
      },
      updated_at: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });

    logger.info(
      `Effectiveness tracking complete: ${totalTrained} employees, ${avgImprovement}% avg improvement`
    );
  } catch (err) {
    logger.error("Error during training effectiveness tracking:", err);
  }
}
