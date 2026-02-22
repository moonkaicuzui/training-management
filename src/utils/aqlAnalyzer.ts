/**
 * AQL Training Recommendation Analyzer
 *
 * Analyzes AQL inspection data to identify inspectors with FAIL results
 * and generates training recommendations for both inspectors and their supervisors.
 * Reuses defect_training_mappings from 5PRS system.
 */

import type {
  AqlProcessedData,
  AqlInspectorRecord,
  AqlEmployeeLink,
  AqlSupervisorLink,
  AqlTrainingRecommendation,
  AqlRecommendedProgram,
  AqlPriority,
} from '@/types/aql';
import type { DefectTrainingMapping } from '@/types/recommendation';
import type { Employee, TrainingProgram } from '@/types';

// ========== Priority Classification ==========

function classifyPriority(failRate: number): AqlPriority | null {
  if (failRate > 30) return 'CRITICAL';
  if (failRate >= 10) return 'HIGH';
  if (failRate > 0) return 'MEDIUM';
  return null;
}

function calculatePriorityScore(
  record: AqlInspectorRecord,
  priority: AqlPriority
): number {
  let score = 0;

  // Base score by priority type
  switch (priority) {
    case 'CRITICAL':
      score = 70;
      break;
    case 'HIGH':
      score = 50;
      break;
    case 'MEDIUM':
      score = 30;
      break;
  }

  // Fail rate factor (0-15 points)
  score += Math.min(15, Math.round(record.fail_rate / 2));

  // Volume factor (0-10 points, more inspections = more reliable data)
  score += Math.min(10, Math.round(record.total_inspections / 10));

  // Fail count factor (0-5 points)
  score += Math.min(5, record.fail_count);

  return Math.min(100, score);
}

// ========== Program Matching ==========

function matchPrograms(
  topDefects: Array<{ type: string; count: number }>,
  mappings: DefectTrainingMapping[],
  programs: TrainingProgram[]
): AqlRecommendedProgram[] {
  const recommended: AqlRecommendedProgram[] = [];
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
  employeeNo: string,
  aqlLinks: AqlEmployeeLink[],
  employees: Employee[]
): AqlTrainingRecommendation['linked_employee'] | undefined {
  // 1. Check explicit AQL link first
  const link = aqlLinks.find((l) => l.aql_employee_no === employeeNo);
  if (link) {
    const employee = employees.find((e) => e.employee_id === link.employee_id);
    if (employee) {
      return {
        employee_id: employee.employee_id,
        employee_name: employee.employee_name,
      };
    }
  }

  // 2. Fallback: direct match by employee_id (same numbering system)
  const directMatch = employees.find((e) => e.employee_id === employeeNo);
  if (directMatch) {
    return {
      employee_id: directMatch.employee_id,
      employee_name: directMatch.employee_name,
    };
  }

  return undefined;
}

// ========== Supervisor Matching ==========

function matchSupervisor(
  employeeNo: string,
  supervisorLinks: AqlSupervisorLink[],
  aqlLinks: AqlEmployeeLink[],
  employees: Employee[]
): AqlTrainingRecommendation['supervisor'] | undefined {
  const supLink = supervisorLinks.find((l) => l.employee_no === employeeNo);
  if (!supLink || !supLink.supervisor_no) return undefined;

  // Check if supervisor is linked: explicit link first, then direct match
  const supAqlLink = aqlLinks.find((l) => l.aql_employee_no === supLink.supervisor_no);
  const linkedId = supAqlLink?.employee_id
    || (employees.find((e) => e.employee_id === supLink.supervisor_no)?.employee_id);

  return {
    employee_no: supLink.supervisor_no,
    employee_name: supLink.supervisor_name,
    linked_employee_id: linkedId,
  };
}

// ========== Main Analysis Function ==========

export function analyzeAqlRecommendations(
  processedData: AqlProcessedData,
  mappings: DefectTrainingMapping[],
  aqlLinks: AqlEmployeeLink[],
  supervisorLinks: AqlSupervisorLink[],
  employees: Employee[],
  programs: TrainingProgram[]
): AqlTrainingRecommendation[] {
  const recommendations: AqlTrainingRecommendation[] = [];

  for (const record of processedData.inspectorRecords) {
    // Only recommend for inspectors with failures
    if (record.fail_count === 0) continue;

    const priority = classifyPriority(record.fail_rate);
    if (!priority) continue;

    const priorityScore = calculatePriorityScore(record, priority);

    // Get top 5 defects
    const topDefects = Object.entries(record.parsed_defects)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([type, count]) => ({ type, count: Math.round(count) }));

    const recommendedPrograms = matchPrograms(topDefects, mappings, programs);
    const linkedEmployee = matchEmployee(record.employee_no, aqlLinks, employees);
    const supervisor = matchSupervisor(record.employee_no, supervisorLinks, aqlLinks, employees);

    // Inspector recommendation
    recommendations.push({
      aql_employee_no: record.employee_no,
      aql_employee_name: record.employee_name,
      buildings: record.buildings,
      total_inspections: record.total_inspections,
      fail_count: record.fail_count,
      fail_rate: record.fail_rate,
      priority,
      priority_score: priorityScore,
      top_defects: topDefects,
      recommended_programs: recommendedPrograms,
      linked_employee: linkedEmployee,
      supervisor,
      enrollment_status: 'PENDING',
      enrollment_reason: 'INSPECTOR_FAIL',
    });

    // Supervisor escalation recommendation (same programs, lower priority score)
    if (supervisor) {
      // Find supervisor's own AQL employee link
      const supLinkedEmployee = supervisor.linked_employee_id
        ? employees.find((e) => e.employee_id === supervisor.linked_employee_id)
        : undefined;

      recommendations.push({
        aql_employee_no: supervisor.employee_no,
        aql_employee_name: supervisor.employee_name,
        buildings: record.buildings,
        total_inspections: record.total_inspections,
        fail_count: record.fail_count,
        fail_rate: record.fail_rate,
        priority,
        priority_score: Math.max(0, priorityScore - 10), // Slightly lower score
        top_defects: topDefects,
        recommended_programs: recommendedPrograms,
        linked_employee: supLinkedEmployee
          ? { employee_id: supLinkedEmployee.employee_id, employee_name: supLinkedEmployee.employee_name }
          : undefined,
        supervisor: undefined,
        enrollment_status: 'PENDING',
        enrollment_reason: 'SUPERVISOR_ESCALATION',
      });
    }
  }

  // Deduplicate supervisor entries (a supervisor may appear multiple times)
  const deduped = deduplicateRecommendations(recommendations);

  // Sort by priority score descending
  return deduped.sort((a, b) => b.priority_score - a.priority_score);
}

/**
 * Deduplicate supervisor escalation entries.
 * If the same person appears as both inspector and supervisor escalation,
 * keep the inspector entry (higher relevance).
 * If the same supervisor appears from multiple subordinates,
 * keep the one with highest priority score.
 */
function deduplicateRecommendations(
  recs: AqlTrainingRecommendation[]
): AqlTrainingRecommendation[] {
  const seen = new Map<string, AqlTrainingRecommendation>();

  for (const rec of recs) {
    const key = `${rec.aql_employee_no}-${rec.enrollment_reason}`;
    const existing = seen.get(key);

    if (!existing) {
      seen.set(key, rec);
    } else if (rec.priority_score > existing.priority_score) {
      seen.set(key, rec);
    }
  }

  // If someone is both INSPECTOR_FAIL and SUPERVISOR_ESCALATION,
  // keep the inspector entry and remove the escalation
  const inspectorNos = new Set(
    Array.from(seen.values())
      .filter((r) => r.enrollment_reason === 'INSPECTOR_FAIL')
      .map((r) => r.aql_employee_no)
  );

  return Array.from(seen.values()).filter((r) => {
    if (r.enrollment_reason === 'SUPERVISOR_ESCALATION' && inspectorNos.has(r.aql_employee_no)) {
      return false; // Remove supervisor entry if they already have inspector entry
    }
    return true;
  });
}
