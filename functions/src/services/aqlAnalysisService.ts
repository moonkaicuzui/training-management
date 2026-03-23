/**
 * AQL Analysis Service (Server-side)
 *
 * Ports client-side AQL analysis logic for use in Cloud Functions.
 * Processes raw AQL data, identifies failing inspectors,
 * and auto-enrolls CRITICAL/HIGH priority targets into INS-001.
 */

import { logger } from "firebase-functions";
import * as admin from "firebase-admin";
import { fetchAqlMonthData } from "./aqlApi";
import type { AqlRawRow } from "./aqlApi";

// Lazy init: db accessed at runtime, not module load
function getDb() {
  return admin.firestore();
}

// ========== Types ==========

interface AqlInspectorRecord {
  employee_no: string;
  employee_name: string;          // Resolved from HR employees (by EMPLOYEE NO)
  tqc_num: string;                // TQC NUM from AQL data
  official_inspector: string;     // OFFICIAL INSPECTOR (auditor, for reference)
  buildings: string[];
  total_inspections: number;
  pass_count: number;
  fail_count: number;
  fail_rate: number;
  parsed_defects: Record<string, number>;
}

interface AqlEmployeeLink {
  link_id: string;
  aql_employee_no: string;
  aql_employee_name: string;
  employee_id: string;
  employee_name: string;
}

type AqlPriority = "CRITICAL" | "HIGH" | "MEDIUM";

interface AqlRecommendation {
  aql_employee_no: string;
  aql_employee_name: string;
  buildings: string[];
  fail_rate: number;
  fail_count: number;
  total_inspections: number;
  priority: AqlPriority;
  priority_score: number;
  top_defects: Array<{ type: string; count: number }>;
  linked_employee?: { employee_id: string; employee_name: string };
  enrollment_reason: "INSPECTOR_FAIL" | "SUPERVISOR_ESCALATION";
}

// ========== Data Processing (ported from aqlDataProcessor.ts) ==========

function parseDefectCounts(description: string): Record<string, number> {
  if (!description || typeof description !== "string" || description.trim() === "") {
    return {};
  }

  const counts: Record<string, number> = {};
  const parts = description.split(",");

  for (const part of parts) {
    const trimmed = part.trim();
    if (!trimmed) continue;

    const match = trimmed.match(/^(.+?)(?:\((\d+)\))?$/);
    if (match) {
      const name = match[1].trim();
      const count = match[2] ? parseInt(match[2], 10) : 1;
      if (name) {
        counts[name] = (counts[name] || 0) + count;
      }
    }
  }

  return counts;
}

function processRawData(
  rows: AqlRawRow[],
  employeeMap?: Map<string, string>,
): AqlInspectorRecord[] {
  if (!rows || rows.length === 0) return [];

  const inspectorMap: Record<string, {
    employee_no: string;
    employee_name: string;
    tqc_num: string;
    official_inspector: string;
    buildings: Set<string>;
    total: number;
    pass: number;
    fail: number;
    defects: Record<string, number>;
  }> = {};

  for (const row of rows) {
    const employeeNo = row["EMPLOYEE NO"]?.trim();
    if (!employeeNo) continue;

    const result = (row["RESULT"] || "").trim().toUpperCase();
    const isFail = result === "FAIL";
    const isPass = result === "PASS";

    if (!isFail && !isPass) continue;

    if (!inspectorMap[employeeNo]) {
      const tqcNum = (row["TQC NUM"] || "").trim();
      const officialInspector = (row["OFFICIAL INSPECTOR"] || "").trim();
      // Resolve name: HR employee data → TQC NUM → EMPLOYEE NO fallback
      const resolvedName = employeeMap?.get(employeeNo) || tqcNum || employeeNo;

      inspectorMap[employeeNo] = {
        employee_no: employeeNo,
        employee_name: resolvedName,
        tqc_num: tqcNum,
        official_inspector: officialInspector,
        buildings: new Set(),
        total: 0,
        pass: 0,
        fail: 0,
        defects: {},
      };
    }

    const inspector = inspectorMap[employeeNo];
    inspector.total++;
    if (isPass) inspector.pass++;
    if (isFail) {
      inspector.fail++;

      const defectCounts = parseDefectCounts(row["DESCRIPTION"] || "");
      for (const [defect, count] of Object.entries(defectCounts)) {
        inspector.defects[defect] = (inspector.defects[defect] || 0) + count;
      }
      if (Object.keys(defectCounts).length === 0) {
        inspector.defects["Unspecified"] = (inspector.defects["Unspecified"] || 0) + 1;
      }
    }

    const building = (row["BUILDING"] || "Unknown").trim();
    inspector.buildings.add(building);
  }

  return Object.values(inspectorMap)
    .map((i) => ({
      employee_no: i.employee_no,
      employee_name: i.employee_name,
      tqc_num: i.tqc_num,
      official_inspector: i.official_inspector,
      buildings: Array.from(i.buildings),
      total_inspections: i.total,
      pass_count: i.pass,
      fail_count: i.fail,
      fail_rate: i.total > 0 ? Math.round((i.fail / i.total) * 10000) / 100 : 0,
      parsed_defects: i.defects,
    }))
    .sort((a, b) => b.fail_rate - a.fail_rate);
}

// ========== Analysis (ported from aqlAnalyzer.ts) ==========

function classifyPriority(failRate: number): AqlPriority | null {
  if (failRate > 30) return "CRITICAL";
  if (failRate >= 10) return "HIGH";
  if (failRate > 0) return "MEDIUM";
  return null;
}

function calculatePriorityScore(record: AqlInspectorRecord, priority: AqlPriority): number {
  let score = 0;

  switch (priority) {
    case "CRITICAL": score = 70; break;
    case "HIGH": score = 50; break;
    case "MEDIUM": score = 30; break;
  }

  score += Math.min(15, Math.round(record.fail_rate / 2));
  score += Math.min(10, Math.round(record.total_inspections / 10));
  score += Math.min(5, record.fail_count);

  return Math.min(100, score);
}

function analyzeInspectors(
  records: AqlInspectorRecord[],
  aqlLinks: AqlEmployeeLink[],
  employees: Array<{ employee_id: string; employee_name: string }>,
): AqlRecommendation[] {
  const recommendations: AqlRecommendation[] = [];

  for (const record of records) {
    if (record.fail_count === 0) continue;

    const priority = classifyPriority(record.fail_rate);
    if (!priority) continue;

    const priorityScore = calculatePriorityScore(record, priority);

    const topDefects = Object.entries(record.parsed_defects)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([type, count]) => ({ type, count: Math.round(count) }));

    // Match employee: direct match first (EMPLOYEE NO = TQC/RQC 사번)
    // employees 배열은 이미 ACTIVE만 포함 (line 283 where 필터)
    let linkedEmployee: AqlRecommendation["linked_employee"];
    const direct = employees.find((e) => e.employee_id === record.employee_no);
    if (direct) {
      linkedEmployee = { employee_id: direct.employee_id, employee_name: direct.employee_name };
    }
    // Fallback: legacy AQL link (deprecated)
    if (!linkedEmployee) {
      const link = aqlLinks.find((l) => l.aql_employee_no === record.employee_no);
      if (link) {
        const emp = employees.find((e) => e.employee_id === link.employee_id);
        if (emp) linkedEmployee = { employee_id: emp.employee_id, employee_name: emp.employee_name };
      }
    }

    recommendations.push({
      aql_employee_no: record.employee_no,
      aql_employee_name: record.employee_name,
      buildings: record.buildings,
      fail_rate: record.fail_rate,
      fail_count: record.fail_count,
      total_inspections: record.total_inspections,
      priority,
      priority_score: priorityScore,
      top_defects: topDefects,
      linked_employee: linkedEmployee,
      enrollment_reason: "INSPECTOR_FAIL",
    });
  }

  return recommendations;
}

// ========== Main Function ==========

export interface ResignedEmployeeInfo {
  employee_no: string;
  employee_name: string;
  fail_rate: number;
  priority: string;
}

export interface WeeklyAqlResult {
  yearMonth: string;
  totalInspectors: number;
  criticalCount: number;
  highCount: number;
  mediumCount: number;
  autoEnrolled: number;
  skippedAlreadyEnrolled: number;
  skippedNoLink: number;
  skippedResigned: number;
  resignedEmployees: ResignedEmployeeInfo[];
}

export async function runWeeklyAqlAnalysisAndEnroll(): Promise<WeeklyAqlResult> {
  // 1. Determine current month
  const now = new Date();
  const yearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  logger.info(`[AQL Analysis] Starting for ${yearMonth}`);

  // 2. Fetch AQL raw data
  const rawData = await fetchAqlMonthData(yearMonth);
  logger.info(`[AQL Analysis] Fetched ${rawData.length} raw rows`);

  if (rawData.length === 0) {
    logger.info("[AQL Analysis] No data for current month, skipping");
    return {
      yearMonth,
      totalInspectors: 0,
      criticalCount: 0,
      highCount: 0,
      mediumCount: 0,
      autoEnrolled: 0,
      skippedAlreadyEnrolled: 0,
      skippedNoLink: 0,
      skippedResigned: 0,
      resignedEmployees: [],
    };
  }

  // 3. Load config from Firestore (needed for employee name resolution)
  const db = getDb();
  const [aqlLinksSnap, activeEmployeesSnap, allEmployeesSnap] = await Promise.all([
    db.collection("aql_employee_links").get(),
    db.collection("employees").where("status", "in", ["active", "ACTIVE"]).get(),
    db.collection("employees").where("status", "in", ["inactive", "INACTIVE"]).get(),
  ]);

  // 퇴사자(INACTIVE) 맵 — 보고서에 포함용
  const resignedMap = new Map<string, string>();
  allEmployeesSnap.docs.forEach((doc) => {
    const d = doc.data();
    resignedMap.set(d.employee_id || doc.id, d.employee_name || "");
  });
  const employeesSnap = activeEmployeesSnap;

  const aqlLinks: AqlEmployeeLink[] = aqlLinksSnap.docs.map((doc) => {
    const d = doc.data();
    return {
      link_id: doc.id,
      aql_employee_no: d.aql_employee_no,
      aql_employee_name: d.aql_employee_name,
      employee_id: d.employee_id,
      employee_name: d.employee_name,
    };
  });

  const employees = employeesSnap.docs.map((doc) => {
    const d = doc.data();
    return {
      employee_id: d.employee_id || doc.id,
      employee_name: d.employee_name || "",
      position: (d.position as string) || "",
    };
  });

  logger.info(`[AQL Analysis] Loaded ${aqlLinks.length} AQL links, ${employees.length} employees`);

  // 4. Build employee lookup map and process raw data
  const employeeMap = new Map<string, string>();
  for (const emp of employees) {
    employeeMap.set(emp.employee_id, emp.employee_name);
  }
  const inspectorRecords = processRawData(rawData, employeeMap);
  logger.info(`[AQL Analysis] ${inspectorRecords.length} inspectors processed`);

  // 5. Analyze recommendations
  const recommendations = analyzeInspectors(inspectorRecords, aqlLinks, employees);

  const criticalCount = recommendations.filter((r) => r.priority === "CRITICAL").length;
  const highCount = recommendations.filter((r) => r.priority === "HIGH").length;
  const mediumCount = recommendations.filter((r) => r.priority === "MEDIUM").length;

  logger.info(
    `[AQL Analysis] Recommendations: CRITICAL=${criticalCount}, HIGH=${highCount}, MEDIUM=${mediumCount}`
  );

  // 6. Auto-enroll CRITICAL and HIGH priority inspectors into INS-001
  // Position allowlist: only actual inspectors should be auto-enrolled
  const INSPECTOR_POSITIONS = new Set([
    "QIP_TQC", "QIP_RQC", "QIP_QA", "QIP_LINE_LEADER",
    "Worker",
  ]);

  const autoEnrollTargets = recommendations.filter(
    (r) => (r.priority === "CRITICAL" || r.priority === "HIGH") && r.linked_employee
  );

  // Load existing PENDING/SCHEDULED enrollments to avoid duplicates
  const existingEnrollSnap = await db
    .collection("inspection_enrollments")
    .where("program_code", "==", "INS-001")
    .where("status", "in", ["PENDING", "SCHEDULED"])
    .get();

  const alreadyEnrolledIds = new Set(
    existingEnrollSnap.docs.map((doc) => doc.data().employee_id)
  );

  let autoEnrolled = 0;
  let skippedAlreadyEnrolled = 0;
  let skippedNoLink = 0;
  let skippedNonInspector = 0;
  const batch = db.batch();
  let batchCount = 0;

  for (const rec of autoEnrollTargets) {
    if (!rec.linked_employee) {
      skippedNoLink++;
      continue;
    }

    if (alreadyEnrolledIds.has(rec.linked_employee.employee_id)) {
      skippedAlreadyEnrolled++;
      logger.info(
        `[AQL Analysis] Skipping ${rec.linked_employee.employee_id} - already enrolled in INS-001`
      );
      continue;
    }

    // Check position - only enroll actual inspectors, not CFA/supervisors/managers
    const emp = employees.find((e) => e.employee_id === rec.linked_employee!.employee_id);
    if (emp && !INSPECTOR_POSITIONS.has(emp.position)) {
      skippedNonInspector++;
      logger.info(
        `[AQL Analysis] Skipping enrollment for ${emp.employee_name} (${emp.employee_id}) - position "${emp.position}" is not an inspector role`
      );
      continue;
    }

    // Create inspection_enrollments record
    const enrollmentId = `ENR-AQL-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const enrollRef = db.collection("inspection_enrollments").doc(enrollmentId);
    batch.set(enrollRef, {
      enrollment_id: enrollmentId,
      employee_id: rec.linked_employee.employee_id,
      employee_name: rec.linked_employee.employee_name,
      program_code: "INS-001",
      source: "AQL_RECOMMENDATION",
      enrolled_by: "system:weeklyAqlAnalysis",
      enrolled_at: admin.firestore.FieldValue.serverTimestamp(),
      status: "PENDING",
    });

    // Create aql_enrollment_log record
    const logId = `AQL-AUTO-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const logRef = db.collection("aql_enrollment_logs").doc(logId);
    batch.set(logRef, {
      log_id: logId,
      aql_employee_no: rec.aql_employee_no,
      aql_employee_name: rec.aql_employee_name,
      employee_id: rec.linked_employee.employee_id,
      employee_name: rec.linked_employee.employee_name,
      program_code: "INS-001",
      program_name: "Inspection Competency Training",
      reason: rec.enrollment_reason,
      defect_types: rec.top_defects.map((d) => d.type),
      fail_rate: rec.fail_rate,
      fail_po_numbers: [],
      enrolled_by: "system:weeklyAqlAnalysis",
      enrolled_at: admin.firestore.FieldValue.serverTimestamp(),
      year_month: yearMonth,
    });

    // Mark as enrolled to prevent duplicates within same batch
    alreadyEnrolledIds.add(rec.linked_employee.employee_id);
    autoEnrolled++;
    batchCount += 2;

    // Commit batch if approaching limit
    if (batchCount >= 450) {
      await batch.commit();
      batchCount = 0;
      logger.info("[AQL Analysis] Committed enrollment batch (limit reached)");
    }
  }

  if (batchCount > 0) {
    await batch.commit();
  }

  // Count no-link skips from all CRITICAL/HIGH
  const noLinkCount = recommendations.filter(
    (r) => (r.priority === "CRITICAL" || r.priority === "HIGH") && !r.linked_employee
  ).length;
  skippedNoLink += noLinkCount;

  // 퇴사자 감지: AQL 데이터에 있지만 ACTIVE 직원에 없고, INACTIVE 직원에 있는 경우
  const resignedEmployees: ResignedEmployeeInfo[] = [];
  for (const rec of recommendations) {
    if (rec.linked_employee) continue; // 이미 매칭된 ACTIVE 직원
    const resignedName = resignedMap.get(rec.aql_employee_no);
    if (resignedName !== undefined) {
      resignedEmployees.push({
        employee_no: rec.aql_employee_no,
        employee_name: resignedName || rec.aql_employee_name,
        fail_rate: rec.fail_rate,
        priority: rec.priority,
      });
    }
  }

  logger.info(
    `[AQL Analysis] Auto-enrolled: ${autoEnrolled}, ` +
    `Skipped (already enrolled): ${skippedAlreadyEnrolled}, ` +
    `Skipped (non-inspector position): ${skippedNonInspector}, ` +
    `Skipped (no link): ${skippedNoLink}, ` +
    `Skipped (resigned): ${resignedEmployees.length}`
  );

  return {
    yearMonth,
    totalInspectors: inspectorRecords.length,
    criticalCount,
    highCount,
    mediumCount,
    autoEnrolled,
    skippedAlreadyEnrolled,
    skippedNoLink,
    skippedResigned: resignedEmployees.length,
    resignedEmployees,
  };
}
