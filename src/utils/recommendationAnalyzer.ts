/**
 * 5PRS Training Recommendation Analyzer
 *
 * Analyzes 5PRS inspection data to identify TQC inspectors needing training.
 * Ported from actionsTab.js with TypeScript types and enhanced logic.
 */

import type {
  ProcessedData,
  TqcRecord,
  FivePrsRawRow,
} from '@/types/fivePrs';
import type {
  RecommendationThreshold,
  DefectTrainingMapping,
  TqcEmployeeLink,
  TrainingRecommendation,
  SurgeDetection,
  RecommendedProgram,
  RecommendationPriority,
} from '@/types/recommendation';
import type { Employee, TrainingProgram } from '@/types';

// ========== Date Helpers ==========

function parseDate(dateValue: string): Date | null {
  if (!dateValue) return null;
  const standardDate = new Date(dateValue);
  if (!isNaN(standardDate.getTime())) return standardDate;

  const parts = dateValue.match(/(\d+)/g);
  if (parts && parts.length === 3) {
    let y = parts[0].length === 4 ? parts[0] : parts[2];
    const m = parts[0].length === 4 ? parts[1] : parts[0];
    const d = parts[0].length === 4 ? parts[2] : parts[1];
    if (y.length === 2) y = `20${y}`;
    const date = new Date(`${y}-${m}-${d}`);
    if (!isNaN(date.getTime())) return date;
  }
  return null;
}

function parseDefectTypes(errorString: string): string[] {
  if (!errorString || typeof errorString !== 'string' || errorString.trim() === '') return [];
  return errorString.split(',').map((d) => d.trim()).filter(Boolean);
}

// ========== Surge Detection ==========

export function detectDefectSurges(
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
        const date = parseDate(row['Inspection Date']);
        if (!date || row['Building'] !== building) continue;

        const validationQty = parseInt(row['Validation Qty']) || 0;
        const rejectQty = parseInt(row['Reject Qty']) || 0;
        const hasDefect = row['Error']?.includes(defect);

        if (date >= recentCutoff) {
          recentValidation += validationQty;
          if (hasDefect && rejectQty > 0) {
            const defectList = parseDefectTypes(row['Error']);
            recentCount += rejectQty / (defectList.length || 1);
          }
        } else if (date >= pastCutoff && date < recentCutoff) {
          pastValidation += validationQty;
          if (hasDefect && rejectQty > 0) {
            const defectList = parseDefectTypes(row['Error']);
            pastCount += rejectQty / (defectList.length || 1);
          }
        }
      }

      const recentRate = recentValidation > 0 ? (recentCount / recentValidation) * 100 : 0;
      const pastRate = pastValidation > 0 ? (pastCount / pastValidation) * 100 : 0;

      if (
        pastRate > 0 &&
        recentRate > pastRate * thresholds.surge_multiplier &&
        recentRate > thresholds.surge_min_rate
      ) {
        const increasePercent = Math.round(((recentRate - pastRate) / pastRate) * 100);

        // Find problem TQC IDs for this surge
        const problemTqcIds: string[] = [];
        const tqcDefectRates: Record<string, { validation: number; defectCount: number }> = {};

        for (const row of rawData) {
          if (row['Building'] !== building || !row['TQC ID']) continue;
          const hasDefect = row['Error']?.includes(defect);
          const validationQty = parseInt(row['Validation Qty']) || 0;
          const rejectQty = parseInt(row['Reject Qty']) || 0;
          const tqcId = row['TQC ID'];

          if (!tqcDefectRates[tqcId]) {
            tqcDefectRates[tqcId] = { validation: 0, defectCount: 0 };
          }
          tqcDefectRates[tqcId].validation += validationQty;
          if (hasDefect && rejectQty > 0) {
            const defectList = parseDefectTypes(row['Error']);
            tqcDefectRates[tqcId].defectCount += rejectQty / (defectList.length || 1);
          }
        }

        Object.entries(tqcDefectRates)
          .map(([tqcId, data]) => ({
            tqcId,
            rate: data.validation > 0 ? (data.defectCount / data.validation) * 100 : 0,
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

function classifyTqcPriority(
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
    return 'IMMEDIATE';
  }

  // SURGE: TQC appears in surge detection results
  if (surgeMap.has(id)) {
    return 'SURGE';
  }

  // PREVENTIVE: reject rate between min-max AND validation count sufficient
  if (
    rejectRate >= thresholds.preventive_rate_min &&
    rejectRate < thresholds.preventive_rate_max &&
    totalValidation >= thresholds.min_validation_count
  ) {
    return 'PREVENTIVE';
  }

  return null;
}

// ========== Priority Score Calculation ==========

function calculatePriorityScore(
  tqcRecord: TqcRecord,
  priority: RecommendationPriority,
  surgeInfo?: SurgeDetection
): number {
  let score = 0;

  // Base score by priority type
  switch (priority) {
    case 'IMMEDIATE':
      score = 70;
      break;
    case 'SURGE':
      score = 50;
      break;
    case 'PREVENTIVE':
      score = 30;
      break;
  }

  // Add reject rate factor (0-15 points)
  score += Math.min(15, Math.round(tqcRecord.rejectRate * 2));

  // Add validation volume factor (0-10 points, more data = more reliable)
  score += Math.min(10, Math.round(tqcRecord.totalValidation / 100));

  // Add surge increase factor (0-5 points)
  if (surgeInfo) {
    score += Math.min(5, Math.round(surgeInfo.increasePercent / 50));
  }

  return Math.min(100, score);
}

// ========== Program Matching ==========

function matchPrograms(
  topDefects: Array<{ type: string; count: number }>,
  mappings: DefectTrainingMapping[],
  programs: TrainingProgram[]
): RecommendedProgram[] {
  const recommended: RecommendedProgram[] = [];
  const addedCodes = new Set<string>();

  for (const defect of topDefects) {
    const mapping = mappings.find(
      (m) => m.is_active && m.defect_type.toLowerCase() === defect.type.toLowerCase()
    );

    if (mapping) {
      for (const code of mapping.program_codes) {
        if (addedCodes.has(code)) continue;
        const program = programs.find((p) => p.program_code === code && p.is_active);
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
  employees: Employee[]
): TrainingRecommendation['linkedEmployee'] | undefined {
  const link = links.find((l) => l.tqc_id === tqcId);
  if (!link) return undefined;

  const employee = employees.find((e) => e.employee_id === link.employee_id);
  if (!employee) return undefined;

  return {
    employee_id: employee.employee_id,
    employee_name: employee.employee_name,
  };
}

// ========== Main Analysis Function ==========

export function analyzeRecommendations(
  processedData: ProcessedData,
  rawData: FivePrsRawRow[],
  thresholds: RecommendationThreshold,
  mappings: DefectTrainingMapping[],
  links: TqcEmployeeLink[],
  employees: Employee[],
  programs: TrainingProgram[]
): TrainingRecommendation[] {
  const { tqcRecords, buildingRecords, defectTypes } = processedData;

  // Step 1: Detect surges
  const buildingNames = buildingRecords.map((b) => b.building);
  const defectNames = defectTypes.map((d) => d.type);
  const surges = detectDefectSurges(rawData, buildingNames, defectNames, thresholds);

  // Build surge lookup: TQC ID → SurgeDetection
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
    const priority = classifyTqcPriority(tqcRecord, thresholds, surgeMap);
    if (!priority) continue;

    const surgeInfo = surgeMap.get(tqcRecord.id);

    const topDefects = Object.entries(tqcRecord.defects)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([type, count]) => ({ type, count: Math.round(count) }));

    const recommendedPrograms = matchPrograms(topDefects, mappings, programs);
    const linkedEmployee = matchEmployee(tqcRecord.id, links, employees);

    const priorityScore = calculatePriorityScore(tqcRecord, priority, surgeInfo);

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
      enrollmentStatus: 'PENDING',
    });
  }

  // Step 3: Sort by priority score descending
  return recommendations.sort((a, b) => b.priorityScore - a.priorityScore);
}
