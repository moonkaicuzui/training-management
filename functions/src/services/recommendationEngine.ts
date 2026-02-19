/**
 * 5PRS Training Recommendation Engine (Cloud Functions / Node.js)
 *
 * Server-side port of the frontend `src/utils/recommendationAnalyzer.ts`.
 * Analyzes 5PRS inspection data to identify TQC inspectors needing training,
 * detects defect surges, classifies priorities, and matches training programs.
 */

import { logger } from "firebase-functions";
import {
  type FivePrsRawRow,
  type TqcRecord,
  processRawData,
  parseDateValue,
  parseDefectTypes,
} from "./fivePrsApi";

// ========== Types (server-side copies, no frontend imports) ==========

export type RecommendationPriority = "IMMEDIATE" | "PREVENTIVE" | "SURGE";

export type EnrollmentStatus = "PENDING" | "ENROLLED" | "SKIPPED";

export interface RecommendationThreshold {
  immediate_rate: number;
  preventive_rate_min: number;
  preventive_rate_max: number;
  min_validation_count: number;
  surge_multiplier: number;
  surge_min_rate: number;
  surge_recent_days: number;
  surge_past_days: number;
}

export interface DefectTrainingMapping {
  mapping_id: string;
  defect_type: string;
  program_codes: string[];
  description?: string;
  is_active: boolean;
}

export interface TqcEmployeeLink {
  link_id: string;
  tqc_id: string;
  tqc_name: string;
  employee_id: string;
  employee_name: string;
}

export interface SurgeDetection {
  building: string;
  defect: string;
  recentRate: number;
  pastRate: number;
  increasePercent: number;
  problemTqcIds: string[];
}

export interface RecommendedProgram {
  program_code: string;
  program_name: string;
  match_reason: string;
}

export interface ServerEmployee {
  employee_id: string;
  employee_name: string;
  status: string;
}

export interface ServerTrainingProgram {
  program_code: string;
  program_name: string;
  is_active: boolean;
}

export interface TrainingRecommendation {
  tqc_id: string;
  tqc_name: string;
  buildings: string[];
  totalValidation: number;
  totalReject: number;
  rejectRate: number;
  priority: RecommendationPriority;
  priorityScore: number;
  topDefects: Array<{ type: string; count: number }>;
  recommendedPrograms: RecommendedProgram[];
  linkedEmployee?: {
    employee_id: string;
    employee_name: string;
  };
  surgeInfo?: SurgeDetection;
  enrollmentStatus: EnrollmentStatus;
}

// ========== Surge Detection ==========

/**
 * Detect defect surges by comparing recent rates vs. past baseline
 * for each building + defect combination.
 */
export function detectSurges(
  rawData: FivePrsRawRow[],
  buildingNames: string[],
  defectNames: string[],
  thresholds: RecommendationThreshold
): SurgeDetection[] {
  if (!rawData || rawData.length === 0) return [];

  const surges: SurgeDetection[] = [];
  const now = new Date();

  const recentCutoff = new Date(now);
  recentCutoff.setDate(recentCutoff.getDate() - thresholds.surge_recent_days);

  const pastCutoff = new Date(now);
  pastCutoff.setDate(pastCutoff.getDate() - thresholds.surge_past_days);

  for (const building of buildingNames) {
    for (const defect of defectNames) {
      let recentCount = 0;
      let recentValidation = 0;
      let pastCount = 0;
      let pastValidation = 0;

      for (const row of rawData) {
        const date = parseDateValue(row["Inspection Date"]);
        if (!date || row["Building"] !== building) continue;

        const validationQty = parseInt(row["Validation Qty"]) || 0;
        const rejectQty = parseInt(row["Reject Qty"]) || 0;
        const hasDefect = row["Error"]?.includes(defect);

        if (date >= recentCutoff) {
          recentValidation += validationQty;
          if (hasDefect && rejectQty > 0) {
            const defectList = parseDefectTypes(row["Error"]);
            recentCount += rejectQty / (defectList.length || 1);
          }
        } else if (date >= pastCutoff && date < recentCutoff) {
          pastValidation += validationQty;
          if (hasDefect && rejectQty > 0) {
            const defectList = parseDefectTypes(row["Error"]);
            pastCount += rejectQty / (defectList.length || 1);
          }
        }
      }

      const recentRate =
        recentValidation > 0 ? (recentCount / recentValidation) * 100 : 0;
      const pastRate =
        pastValidation > 0 ? (pastCount / pastValidation) * 100 : 0;

      if (
        pastRate > 0 &&
        recentRate > pastRate * thresholds.surge_multiplier &&
        recentRate > thresholds.surge_min_rate
      ) {
        const increasePercent = Math.round(
          ((recentRate - pastRate) / pastRate) * 100
        );

        // Find problem TQC IDs for this surge
        const tqcDefectRates: Record<
          string,
          { validation: number; defectCount: number }
        > = {};

        for (const row of rawData) {
          if (row["Building"] !== building || !row["TQC ID"]) continue;
          const hasDefect = row["Error"]?.includes(defect);
          const validationQty = parseInt(row["Validation Qty"]) || 0;
          const rejectQty = parseInt(row["Reject Qty"]) || 0;
          const tqcId = row["TQC ID"];

          if (!tqcDefectRates[tqcId]) {
            tqcDefectRates[tqcId] = { validation: 0, defectCount: 0 };
          }
          tqcDefectRates[tqcId].validation += validationQty;
          if (hasDefect && rejectQty > 0) {
            const defectList = parseDefectTypes(row["Error"]);
            tqcDefectRates[tqcId].defectCount +=
              rejectQty / (defectList.length || 1);
          }
        }

        const problemTqcIds: string[] = [];
        Object.entries(tqcDefectRates)
          .map(([tqcId, data]) => ({
            tqcId,
            rate:
              data.validation > 0
                ? (data.defectCount / data.validation) * 100
                : 0,
          }))
          .filter((t) => t.rate > thresholds.surge_min_rate)
          .sort((a, b) => b.rate - a.rate)
          .slice(0, 3)
          .forEach((t) => problemTqcIds.push(t.tqcId));

        surges.push({
          building,
          defect,
          recentRate: Math.round(recentRate * 100) / 100,
          pastRate: Math.round(pastRate * 100) / 100,
          increasePercent,
          problemTqcIds,
        });
      }
    }
  }

  return surges.sort((a, b) => b.recentRate - a.recentRate);
}

// ========== Priority Classification ==========

/**
 * Classify a TQC record into IMMEDIATE, PREVENTIVE, or SURGE priority.
 * Returns null if the record does not meet any threshold.
 */
export function classifyPriority(
  tqcRecord: TqcRecord,
  thresholds: RecommendationThreshold,
  surgeMap: Map<string, SurgeDetection>
): RecommendationPriority | null {
  const { rejectRate, totalValidation, id } = tqcRecord;

  // IMMEDIATE: reject rate > threshold AND validation count sufficient
  if (
    rejectRate > thresholds.immediate_rate &&
    totalValidation >= thresholds.min_validation_count
  ) {
    return "IMMEDIATE";
  }

  // SURGE: TQC appears in surge detection results
  if (surgeMap.has(id)) {
    return "SURGE";
  }

  // PREVENTIVE: reject rate between min-max AND validation count sufficient
  if (
    rejectRate >= thresholds.preventive_rate_min &&
    rejectRate < thresholds.preventive_rate_max &&
    totalValidation >= thresholds.min_validation_count
  ) {
    return "PREVENTIVE";
  }

  return null;
}

// ========== Priority Score ==========

function calculatePriorityScore(
  tqcRecord: TqcRecord,
  priority: RecommendationPriority,
  surgeInfo?: SurgeDetection
): number {
  let score = 0;

  switch (priority) {
    case "IMMEDIATE":
      score = 70;
      break;
    case "SURGE":
      score = 50;
      break;
    case "PREVENTIVE":
      score = 30;
      break;
  }

  // Add reject rate factor (0-15 points)
  score += Math.min(15, Math.round(tqcRecord.rejectRate * 2));

  // Add validation volume factor (0-10 points)
  score += Math.min(10, Math.round(tqcRecord.totalValidation / 100));

  // Add surge increase factor (0-5 points)
  if (surgeInfo) {
    score += Math.min(5, Math.round(surgeInfo.increasePercent / 50));
  }

  return Math.min(100, score);
}

// ========== Program Matching ==========

/**
 * Match top defect types to training programs via the defect-training mapping table.
 */
export function matchPrograms(
  topDefects: Array<{ type: string; count: number }>,
  mappings: DefectTrainingMapping[],
  programs: ServerTrainingProgram[]
): RecommendedProgram[] {
  const recommended: RecommendedProgram[] = [];
  const addedCodes = new Set<string>();

  for (const defect of topDefects) {
    const mapping = mappings.find(
      (m) =>
        m.is_active &&
        m.defect_type.toLowerCase() === defect.type.toLowerCase()
    );

    if (mapping) {
      for (const code of mapping.program_codes) {
        if (addedCodes.has(code)) continue;
        const program = programs.find(
          (p) => p.program_code === code && p.is_active
        );
        if (program) {
          addedCodes.add(code);
          recommended.push({
            program_code: code,
            program_name: program.program_name,
            match_reason: defect.type,
          });
        }
      }
    }
  }

  return recommended;
}

// ========== Employee Matching ==========

function matchEmployee(
  tqcId: string,
  links: TqcEmployeeLink[],
  employees: ServerEmployee[]
): TrainingRecommendation["linkedEmployee"] | undefined {
  const link = links.find((l) => l.tqc_id === tqcId);
  if (!link) return undefined;

  const employee = employees.find((e) => e.employee_id === link.employee_id);
  if (!employee) return undefined;

  return {
    employee_id: employee.employee_id,
    employee_name: employee.employee_name,
  };
}

// ========== Main Analysis ==========

/**
 * Full analysis pipeline: raw data -> processed -> surges -> classify -> match.
 *
 * @param rawData       - Raw 5PRS inspection rows from the GAS API
 * @param thresholds    - Recommendation threshold configuration
 * @param mappings      - Active defect -> training program mappings
 * @param links         - TQC ID <-> Employee ID links
 * @param employees     - Active employees
 * @param programs      - Active training programs
 * @returns Sorted array of training recommendations
 */
export function analyzeFromRawData(
  rawData: FivePrsRawRow[],
  thresholds: RecommendationThreshold,
  mappings: DefectTrainingMapping[],
  links: TqcEmployeeLink[],
  employees: ServerEmployee[],
  programs: ServerTrainingProgram[]
): TrainingRecommendation[] {
  logger.info(
    `analyzeFromRawData: ${rawData.length} rows, ${mappings.length} mappings, ${links.length} links, ${employees.length} employees, ${programs.length} programs`
  );

  // Step 0: Process raw data
  const processed = processRawData(rawData);
  const { tqcRecords, buildingRecords, defectTypes } = processed;

  logger.info(
    `Processed: ${tqcRecords.length} TQC records, ${buildingRecords.length} buildings, ${defectTypes.length} defect types`
  );

  // Step 1: Detect surges
  const buildingNames = buildingRecords.map((b) => b.building);
  const defectNames = defectTypes.map((d) => d.type);
  const surges = detectSurges(rawData, buildingNames, defectNames, thresholds);

  logger.info(`Detected ${surges.length} defect surges`);

  // Build surge lookup: TQC ID -> SurgeDetection
  const surgeMap = new Map<string, SurgeDetection>();
  for (const surge of surges) {
    for (const tqcId of surge.problemTqcIds) {
      if (!surgeMap.has(tqcId)) {
        surgeMap.set(tqcId, surge);
      }
    }
  }

  // Step 2: Classify each TQC and build recommendations
  const recommendations: TrainingRecommendation[] = [];

  for (const tqcRecord of tqcRecords) {
    const priority = classifyPriority(tqcRecord, thresholds, surgeMap);
    if (!priority) continue;

    const surgeInfo = surgeMap.get(tqcRecord.id);

    const topDefects = Object.entries(tqcRecord.defects)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([type, count]) => ({ type, count: Math.round(count) }));

    const recommendedPrograms = matchPrograms(topDefects, mappings, programs);
    const linkedEmployee = matchEmployee(tqcRecord.id, links, employees);

    const priorityScore = calculatePriorityScore(
      tqcRecord,
      priority,
      surgeInfo
    );

    recommendations.push({
      tqc_id: tqcRecord.id,
      tqc_name: tqcRecord.name,
      buildings: tqcRecord.buildings,
      totalValidation: tqcRecord.totalValidation,
      totalReject: tqcRecord.totalReject,
      rejectRate: tqcRecord.rejectRate,
      priority,
      priorityScore,
      topDefects,
      recommendedPrograms,
      linkedEmployee,
      surgeInfo,
      enrollmentStatus: "PENDING",
    });
  }

  // Step 3: Sort by priority score descending
  const sorted = recommendations.sort(
    (a, b) => b.priorityScore - a.priorityScore
  );

  logger.info(
    `Analysis complete: ${sorted.length} recommendations (` +
      `IMMEDIATE=${sorted.filter((r) => r.priority === "IMMEDIATE").length}, ` +
      `PREVENTIVE=${sorted.filter((r) => r.priority === "PREVENTIVE").length}, ` +
      `SURGE=${sorted.filter((r) => r.priority === "SURGE").length})`
  );

  return sorted;
}
