/**
 * HR V2 연계 분석 서비스
 *
 * HR V2 데이터와 Q-TRAIN 교육 데이터를 연계하여 6가지 분석 기능 제공:
 * 1. 교육 효과 측정 (Training Effectiveness)
 * 2. 위험 직원 교육 우선순위 (Risk-Based Training)
 * 3. 신입 TQC 자동 등록 현황 (New Hire Training)
 * 4. 품질 데이터 양방향 비교 (Quality Data Sync)
 * 5. 부서별 교육 완료율 (Department Completion)
 * 6. 이직률 ↔ 교육 상관관계 (Turnover Analysis)
 */

import {
  db,
  collection,
  query,
  where,
  getDocs,
  limit,
} from '@/services/firebase';
import {
  fetchHREmployees,
  getHRSummary,
  type HREmployeeRecord,
} from '@/services/hrIntegrationService';
import { logger } from '@/utils/logger';

// ============================================================
// 타입 정의
// ============================================================

/** 시나리오 1: 교육 효과 측정 */
export interface TrainingEffectivenessResult {
  employeeId: string;
  employeeName: string;
  programCode: string;
  trainingDate: string;
  beforeMetrics: { aqlPassRate?: number; fivePrsPassRate?: number; riskScore?: number };
  afterMetrics: { aqlPassRate?: number; fivePrsPassRate?: number; riskScore?: number };
  improvement: { aqlChange?: number; fivePrsChange?: number; riskChange?: number };
}

/** 시나리오 2: 위험 직원 교육 추천 */
export interface RiskBasedRecommendation {
  employeeId: string;
  employeeName: string;
  team: string;
  building: string;
  riskScore: number;
  riskLevel: string;
  riskFactors: string[];
  recommendedPrograms: string[];
  currentTrainingStatus: 'none' | 'in_progress' | 'completed';
}

/** 시나리오 3: 신입 교육 현황 */
export interface NewHireTrainingStatus {
  employeeId: string;
  employeeName: string;
  hireDate: string;
  team: string;
  building: string;
  daysEmployed: number;
  tqcStatus: 'not_enrolled' | 'in_training' | 'completed' | 'failed';
  tqcEnrollDate?: string;
  requiredPrograms: string[];
  completedPrograms: string[];
  completionRate: number;
}

/** 시나리오 4: 품질 데이터 비교 */
export interface QualitySync {
  employeeId: string;
  employeeName: string;
  qtrain: { aqlFailRate?: number; fivePrsFailRate?: number; inspectionGrade?: string };
  hrV2: { aqlPassRate?: number; fivePrsPassRate?: number; qualityGrade?: string };
  discrepancy: boolean;
  lastSynced?: string;
}

/** 시나리오 5: 부서별 교육 완료율 */
export interface DepartmentTrainingRate {
  department: string;
  totalEmployees: number;
  activeEmployees: number;
  requiredPrograms: number;
  completedPrograms: number;
  completionRate: number;
  avgScore: number;
  passRate: number;
  topPerformers: string[];
  needsAttention: string[];
}

/** 시나리오 6: 이직률 ↔ 교육 상관관계 */
export interface TurnoverTrainingCorrelation {
  period: string;
  totalResignations: number;
  resignedWithTraining: number;
  resignedWithoutTraining: number;
  trainingRetentionRate: number;
  noTrainingRetentionRate: number;
  tqcCompletionSurvivalRate: number;
  avgTrainingHoursResigned: number;
  avgTrainingHoursRetained: number;
}

// ============================================================
// 내부 유틸
// ============================================================

const MONTH_NAMES = [
  'january', 'february', 'march', 'april', 'may', 'june',
  'july', 'august', 'september', 'october', 'november', 'december',
];

function getPreviousMonth(month: string, year: number): { month: string; year: number } {
  const idx = MONTH_NAMES.indexOf(month);
  if (idx <= 0) return { month: MONTH_NAMES[11], year: year - 1 };
  return { month: MONTH_NAMES[idx - 1], year };
}

function getNextMonth(month: string, year: number): { month: string; year: number } {
  const idx = MONTH_NAMES.indexOf(month);
  if (idx >= 11) return { month: MONTH_NAMES[0], year: year + 1 };
  return { month: MONTH_NAMES[idx + 1], year };
}

/** 날짜 문자열에서 경과 일수 계산 */
function daysSince(dateStr: string): number {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return 0;
  return Math.floor((Date.now() - d.getTime()) / (1000 * 60 * 60 * 24));
}

/** HR V2 직원 데이터 안전 fetch (실패 시 빈 배열) */
async function safelyFetchHREmployees(month: string, year: number): Promise<HREmployeeRecord[]> {
  try {
    return await fetchHREmployees(month, year);
  } catch (error) {
    logger.warn('[hrAnalytics] HR V2 직원 데이터 접근 실패 (Q-TRAIN 데이터만 사용):', error);
    return [];
  }
}

/** Q-TRAIN employees 컬렉션 조회 */
async function fetchQTrainEmployees(): Promise<Map<string, {
  employee_id: string;
  employee_name: string;
  department: string;
  position: string;
  building: string;
  hire_date: string;
  status: string;
}>> {
  const snapshot = await getDocs(query(collection(db, 'employees'), limit(5000)));
  const map = new Map<string, {
    employee_id: string;
    employee_name: string;
    department: string;
    position: string;
    building: string;
    hire_date: string;
    status: string;
  }>();
  snapshot.docs.forEach((d) => {
    const data = d.data();
    map.set(d.id, {
      employee_id: (data.employee_id as string) || d.id,
      employee_name: (data.employee_name as string) || '',
      department: (data.department as string) || '',
      position: (data.position as string) || '',
      building: (data.building as string) || '',
      hire_date: (data.hire_date as string) || '',
      status: (data.status as string) || 'ACTIVE',
    });
  });
  return map;
}

/** Q-TRAIN 교육 결과 조회 */
async function fetchTrainingResults(filters?: {
  employeeId?: string;
  startDate?: string;
  endDate?: string;
}): Promise<Array<{
  employee_id: string;
  program_code: string;
  training_date: string;
  score: number | null;
  result: string;
  grade: string | null;
}>> {
  const constraints = [];
  if (filters?.employeeId) {
    constraints.push(where('employee_id', '==', filters.employeeId));
  }
  constraints.push(limit(2000));
  const q = query(collection(db, 'training_results'), ...constraints);
  const snapshot = await getDocs(q);
  let results = snapshot.docs.map((d) => {
    const data = d.data();
    return {
      employee_id: (data.employee_id as string) || '',
      program_code: (data.program_code as string) || '',
      training_date: (data.training_date as string) || '',
      score: (data.score as number | null) ?? null,
      result: (data.result as string) || 'ABSENT',
      grade: (data.grade as string | null) ?? null,
    };
  });
  if (filters?.startDate) {
    results = results.filter((r) => r.training_date >= filters.startDate!);
  }
  if (filters?.endDate) {
    results = results.filter((r) => r.training_date <= filters.endDate!);
  }
  return results;
}

/** Q-TRAIN 교육 프로그램 조회 */
async function fetchPrograms(): Promise<Map<string, {
  program_code: string;
  program_name: string;
  category: string;
  duration_hours: number;
  target_positions: string[];
}>> {
  const snapshot = await getDocs(query(collection(db, 'training_programs'), limit(500)));
  const map = new Map();
  snapshot.docs.forEach((d) => {
    const data = d.data();
    map.set((data.program_code as string) || d.id, {
      program_code: (data.program_code as string) || d.id,
      program_name: (data.program_name as string) || '',
      category: (data.category as string) || '',
      duration_hours: (data.duration_hours as number) || 0,
      target_positions: (data.target_positions as string[]) || [],
    });
  });
  return map;
}

// ============================================================
// 시나리오 1: 교육 효과 측정
// ============================================================

/**
 * 교육 효과 측정: 교육 전후 HR 품질 지표 비교
 * HR V2의 월별 aql_pass_rate, five_prs_pass_rate를 교육 전월/후월로 비교
 */
export async function analyzeTrainingEffectiveness(
  month: string,
  year: number,
): Promise<TrainingEffectivenessResult[]> {
  const results: TrainingEffectivenessResult[] = [];

  try {
    // 전월/후월 HR 데이터
    const prev = getPreviousMonth(month, year);
    const next = getNextMonth(month, year);

    const [beforeHR, afterHR, currentHR] = await Promise.all([
      safelyFetchHREmployees(prev.month, prev.year),
      safelyFetchHREmployees(next.month, next.year),
      safelyFetchHREmployees(month, year),
    ]);

    // 교육 결과 조회 (해당 월)
    const monthIdx = MONTH_NAMES.indexOf(month);
    const startDate = `${year}-${String(monthIdx + 1).padStart(2, '0')}-01`;
    const endDate = `${year}-${String(monthIdx + 1).padStart(2, '0')}-31`;
    const trainingResults = await fetchTrainingResults({ startDate, endDate });

    if (trainingResults.length === 0) return results;

    // 직원별 교육 결과 매핑
    const beforeMap = new Map(beforeHR.map((e) => [e.employee_id, e]));
    const afterMap = new Map(afterHR.map((e) => [e.employee_id, e]));
    const currentMap = new Map(currentHR.map((e) => [e.employee_id, e]));

    // 직원별로 교육 전후 비교
    const processedEmployees = new Set<string>();
    for (const tr of trainingResults) {
      const key = `${tr.employee_id}_${tr.program_code}`;
      if (processedEmployees.has(key)) continue;
      processedEmployees.add(key);

      const before = beforeMap.get(tr.employee_id);
      const after = afterMap.get(tr.employee_id);
      const current = currentMap.get(tr.employee_id);
      const emp = current || before || after;
      if (!emp) continue;

      const beforeMetrics: { aqlPassRate?: number; fivePrsPassRate?: number; riskScore?: number } = {
        aqlPassRate: undefined,
        fivePrsPassRate: undefined,
        riskScore: before?.risk_score,
      };
      const afterMetrics: { aqlPassRate?: number; fivePrsPassRate?: number; riskScore?: number } = {
        aqlPassRate: undefined,
        fivePrsPassRate: undefined,
        riskScore: after?.risk_score,
      };

      // HR V2 Summary에서 전체 지표 가져오기
      try {
        const [beforeSummary, afterSummary] = await Promise.all([
          getHRSummary(prev.month, prev.year),
          getHRSummary(next.month, next.year),
        ]);
        if (beforeSummary) {
          beforeMetrics.aqlPassRate = beforeSummary.aqlPassRate;
          beforeMetrics.fivePrsPassRate = beforeSummary.fivePrsPassRate;
        }
        if (afterSummary) {
          afterMetrics.aqlPassRate = afterSummary.aqlPassRate;
          afterMetrics.fivePrsPassRate = afterSummary.fivePrsPassRate;
        }
      } catch {
        // HR 요약 데이터 없으면 무시
      }

      results.push({
        employeeId: tr.employee_id,
        employeeName: emp.employee_name,
        programCode: tr.program_code,
        trainingDate: tr.training_date,
        beforeMetrics,
        afterMetrics,
        improvement: {
          aqlChange:
            beforeMetrics.aqlPassRate !== undefined && afterMetrics.aqlPassRate !== undefined
              ? afterMetrics.aqlPassRate - beforeMetrics.aqlPassRate
              : undefined,
          fivePrsChange:
            beforeMetrics.fivePrsPassRate !== undefined && afterMetrics.fivePrsPassRate !== undefined
              ? afterMetrics.fivePrsPassRate - beforeMetrics.fivePrsPassRate
              : undefined,
          riskChange:
            beforeMetrics.riskScore !== undefined && afterMetrics.riskScore !== undefined
              ? beforeMetrics.riskScore - afterMetrics.riskScore
              : undefined,
        },
      });
    }
  } catch (error) {
    logger.error('[hrAnalytics] analyzeTrainingEffectiveness 실패:', error);
  }

  return results;
}

// ============================================================
// 시나리오 2: 위험 직원 교육 우선순위
// ============================================================

/**
 * 위험 직원 교육 추천: risk_score >= 25인 직원에게 맞춤 교육 추천
 */
export async function getHighRiskTrainingRecommendations(
  month: string,
  year: number,
): Promise<RiskBasedRecommendation[]> {
  const results: RiskBasedRecommendation[] = [];

  try {
    const hrEmployees = await safelyFetchHREmployees(month, year);
    const highRiskEmployees = hrEmployees.filter((e) => e.risk_score >= 25 && e.is_active);

    if (highRiskEmployees.length === 0) {
      // HR V2 데이터 없으면 Q-TRAIN 직원 중 신입 기반 추천
      const qtEmployees = await fetchQTrainEmployees();
      for (const [, emp] of qtEmployees) {
        if (emp.status !== 'ACTIVE') continue;
        const days = daysSince(emp.hire_date);
        if (days > 0 && days < 60) {
          results.push({
            employeeId: emp.employee_id,
            employeeName: emp.employee_name,
            team: emp.department,
            building: emp.building,
            riskScore: 30,
            riskLevel: 'medium',
            riskFactors: ['60일 미만 신입'],
            recommendedPrograms: ['NEWCOMER'],
            currentTrainingStatus: 'none',
          });
        }
      }
      return results;
    }

    // 교육 결과 조회
    const allResults = await fetchTrainingResults();
    const employeeResultMap = new Map<string, string[]>();
    for (const r of allResults) {
      if (r.result === 'PASS') {
        const existing = employeeResultMap.get(r.employee_id) || [];
        existing.push(r.program_code);
        employeeResultMap.set(r.employee_id, existing);
      }
    }

    for (const emp of highRiskEmployees) {
      const riskFactors: string[] = [];
      const recommendedPrograms: string[] = [];

      if (emp.unauthorized_absent_days > 0) {
        riskFactors.push('무단결근');
        recommendedPrograms.push('QIP-001');
      }
      if (emp.absent_days > 3) {
        riskFactors.push('높은 결근율');
      }
      if (emp.working_days < 60) {
        riskFactors.push('60일 미만 근무');
        recommendedPrograms.push('NEWCOMER');
      }
      if (emp.risk_score >= 50) {
        riskFactors.push('매우 높은 위험 점수');
        recommendedPrograms.push('RETRAINING');
      }

      if (recommendedPrograms.length === 0) {
        recommendedPrograms.push('QIP-001');
      }

      const completedPrograms = employeeResultMap.get(emp.employee_id) || [];
      let status: 'none' | 'in_progress' | 'completed' = 'none';
      if (completedPrograms.length > 0) {
        status = recommendedPrograms.every((p) => completedPrograms.includes(p))
          ? 'completed'
          : 'in_progress';
      }

      results.push({
        employeeId: emp.employee_id,
        employeeName: emp.employee_name,
        team: emp.team,
        building: emp.building,
        riskScore: emp.risk_score,
        riskLevel: emp.risk_score >= 50 ? 'high' : emp.risk_score >= 25 ? 'medium' : 'low',
        riskFactors,
        recommendedPrograms: [...new Set(recommendedPrograms)],
        currentTrainingStatus: status,
      });
    }

    // 위험 점수 내림차순 정렬
    results.sort((a, b) => b.riskScore - a.riskScore);
  } catch (error) {
    logger.error('[hrAnalytics] getHighRiskTrainingRecommendations 실패:', error);
  }

  return results;
}

// ============================================================
// 시나리오 3: 신입 TQC 자동 등록 현황
// ============================================================

/**
 * 신입 교육 현황: hired_this_month + under_60_days 직원의 TQC/NEWCOMER 교육 이수 현황
 */
export async function getNewHireTrainingStatus(
  month: string,
  year: number,
): Promise<NewHireTrainingStatus[]> {
  const results: NewHireTrainingStatus[] = [];

  try {
    const hrEmployees = await safelyFetchHREmployees(month, year);

    // 신입 또는 60일 미만 직원 필터
    let newHires: Array<{
      employee_id: string;
      employee_name: string;
      entrance_date: string;
      team: string;
      building: string;
      working_days: number;
    }>;

    if (hrEmployees.length > 0) {
      newHires = hrEmployees
        .filter((e) => (e.hired_this_month || e.working_days < 60) && e.is_active)
        .map((e) => ({
          employee_id: e.employee_id,
          employee_name: e.employee_name,
          entrance_date: e.entrance_date,
          team: e.team,
          building: e.building,
          working_days: e.working_days,
        }));
    } else {
      // HR V2 미사용 시 Q-TRAIN employees에서 신입 감지
      const qtEmployees = await fetchQTrainEmployees();
      newHires = [];
      for (const [, emp] of qtEmployees) {
        if (emp.status !== 'ACTIVE') continue;
        const days = daysSince(emp.hire_date);
        if (days > 0 && days < 60) {
          newHires.push({
            employee_id: emp.employee_id,
            employee_name: emp.employee_name,
            entrance_date: emp.hire_date,
            team: emp.department,
            building: emp.building,
            working_days: days,
          });
        }
      }
    }

    if (newHires.length === 0) return results;

    // TQC 교육생 데이터 조회
    const tqcSnapshot = await getDocs(query(collection(db, 'tqc_trainees'), limit(1000)));
    const tqcMap = new Map<string, { status: string; created_at?: string }>();
    tqcSnapshot.docs.forEach((d) => {
      const data = d.data();
      const empId = (data.employee_id as string) || '';
      if (empId) {
        tqcMap.set(empId, {
          status: (data.status as string) || 'IN_TRAINING',
          created_at: (data.created_at as string) || undefined,
        });
      }
    });

    // 교육 결과 조회
    const allResults = await fetchTrainingResults();
    const employeeCompletedMap = new Map<string, string[]>();
    for (const r of allResults) {
      if (r.result === 'PASS') {
        const existing = employeeCompletedMap.get(r.employee_id) || [];
        existing.push(r.program_code);
        employeeCompletedMap.set(r.employee_id, existing);
      }
    }

    // NEWCOMER 카테고리 프로그램 목록
    const programs = await fetchPrograms();
    const newcomerPrograms = Array.from(programs.values())
      .filter((p) => p.category === 'NEWCOMER')
      .map((p) => p.program_code);

    for (const hire of newHires) {
      const tqc = tqcMap.get(hire.employee_id);
      let tqcStatus: NewHireTrainingStatus['tqcStatus'] = 'not_enrolled';
      if (tqc) {
        if (tqc.status === 'PASSED') tqcStatus = 'completed';
        else if (tqc.status === 'FAILED') tqcStatus = 'failed';
        else tqcStatus = 'in_training';
      }

      const completed = employeeCompletedMap.get(hire.employee_id) || [];
      const requiredPrograms = newcomerPrograms.length > 0 ? newcomerPrograms : ['NEWCOMER'];
      const completedPrograms = completed.filter((p) => requiredPrograms.includes(p));
      const completionRate =
        requiredPrograms.length > 0
          ? Math.round((completedPrograms.length / requiredPrograms.length) * 100)
          : 0;

      results.push({
        employeeId: hire.employee_id,
        employeeName: hire.employee_name,
        hireDate: hire.entrance_date,
        team: hire.team,
        building: hire.building,
        daysEmployed: hire.working_days,
        tqcStatus,
        tqcEnrollDate: tqc?.created_at,
        requiredPrograms,
        completedPrograms,
        completionRate,
      });
    }

    // 입사일 최신순 정렬
    results.sort((a, b) => b.hireDate.localeCompare(a.hireDate));
  } catch (error) {
    logger.error('[hrAnalytics] getNewHireTrainingStatus 실패:', error);
  }

  return results;
}

// ============================================================
// 시나리오 4: 품질 데이터 양방향 비교
// ============================================================

/**
 * 품질 데이터 비교: Q-TRAIN AQL/5PRS vs HR V2 품질 지표
 * 불일치 발견 시 알림
 */
export async function compareQualityData(
  month: string,
  year: number,
): Promise<QualitySync[]> {
  const results: QualitySync[] = [];

  try {
    const hrEmployees = await safelyFetchHREmployees(month, year);
    const hrSummary = await getHRSummary(month, year).catch(() => null);

    // Q-TRAIN 직원 목록
    const qtEmployees = await fetchQTrainEmployees();

    // AQL enrollment logs에서 직원별 fail rate 조회
    const aqlLogsSnapshot = await getDocs(
      query(collection(db, 'aql_enrollment_logs'), limit(1000))
    );
    const aqlFailRateMap = new Map<string, number>();
    aqlLogsSnapshot.docs.forEach((d) => {
      const data = d.data();
      const empId = (data.employee_id as string) || '';
      const failRate = (data.fail_rate as number) ?? null;
      if (empId && failRate !== null) {
        aqlFailRateMap.set(empId, failRate);
      }
    });

    // 검사 결과에서 grade 조회
    const inspResults = await getDocs(
      query(collection(db, 'inspection_results'), limit(1000))
    );
    const inspGradeMap = new Map<string, string>();
    inspResults.docs.forEach((d) => {
      const data = d.data();
      const empId = (data.employee_id as string) || '';
      const grade = (data.grade as string) || '';
      if (empId && grade) {
        inspGradeMap.set(empId, grade);
      }
    });

    // HR V2 직원이 있으면 HR 기준, 없으면 Q-TRAIN 기준
    const hrMap = new Map(hrEmployees.map((e) => [e.employee_id, e]));

    const employeeIds = new Set([
      ...qtEmployees.keys(),
      ...hrMap.keys(),
    ]);

    for (const empId of employeeIds) {
      const qtEmp = qtEmployees.get(empId);
      const hrEmp = hrMap.get(empId);
      if (!qtEmp && !hrEmp) continue;
      if (qtEmp && qtEmp.status !== 'ACTIVE') continue;

      const aqlFailRate = aqlFailRateMap.get(empId);
      const inspGrade = inspGradeMap.get(empId);

      const qtrainData = {
        aqlFailRate: aqlFailRate ?? undefined,
        fivePrsFailRate: undefined as number | undefined,
        inspectionGrade: inspGrade ?? undefined,
      };

      const hrV2Data = {
        aqlPassRate: hrSummary?.aqlPassRate ?? undefined,
        fivePrsPassRate: hrSummary?.fivePrsPassRate ?? undefined,
        qualityGrade: undefined as string | undefined,
      };

      // 불일치 확인: AQL 기준 (Q-TRAIN fail rate vs HR pass rate)
      let discrepancy = false;
      if (aqlFailRate !== undefined && hrSummary?.aqlPassRate !== undefined) {
        const expectedPassRate = 100 - aqlFailRate;
        if (Math.abs(expectedPassRate - hrSummary.aqlPassRate) > 10) {
          discrepancy = true;
        }
      }

      results.push({
        employeeId: empId,
        employeeName: qtEmp?.employee_name || hrEmp?.employee_name || '',
        qtrain: qtrainData,
        hrV2: hrV2Data,
        discrepancy,
        lastSynced: hrSummary?.syncedAt,
      });
    }

    // 불일치 항목 우선 정렬
    results.sort((a, b) => (b.discrepancy ? 1 : 0) - (a.discrepancy ? 1 : 0));
  } catch (error) {
    logger.error('[hrAnalytics] compareQualityData 실패:', error);
  }

  return results;
}

// ============================================================
// 시나리오 5: 부서별 교육 완료율
// ============================================================

/**
 * 부서별 교육 완료율 분석
 */
export async function getDepartmentTrainingRates(): Promise<DepartmentTrainingRate[]> {
  const results: DepartmentTrainingRate[] = [];

  try {
    const qtEmployees = await fetchQTrainEmployees();
    const programs = await fetchPrograms();
    const allResults = await fetchTrainingResults();

    // 부서별 직원 그룹화
    const deptEmployees = new Map<string, Array<{
      employee_id: string;
      employee_name: string;
      status: string;
      position: string;
    }>>();
    for (const [, emp] of qtEmployees) {
      const dept = emp.department || 'OTHER';
      const list = deptEmployees.get(dept) || [];
      list.push(emp);
      deptEmployees.set(dept, list);
    }

    // 직원별 합격 프로그램
    const employeePassedMap = new Map<string, Set<string>>();
    const employeeScores = new Map<string, number[]>();
    const employeePassCount = new Map<string, number>();

    for (const r of allResults) {
      if (r.result === 'PASS') {
        const passed = employeePassedMap.get(r.employee_id) || new Set();
        passed.add(r.program_code);
        employeePassedMap.set(r.employee_id, passed);

        const count = (employeePassCount.get(r.employee_id) || 0) + 1;
        employeePassCount.set(r.employee_id, count);
      }
      if (r.score !== null) {
        const scores = employeeScores.get(r.employee_id) || [];
        scores.push(r.score);
        employeeScores.set(r.employee_id, scores);
      }
    }

    for (const [dept, employees] of deptEmployees) {
      const activeEmployees = employees.filter((e) => e.status === 'ACTIVE');
      if (activeEmployees.length === 0) continue;

      // 해당 부서에 필요한 프로그램 수 (직원 position 기반)
      let totalRequired = 0;
      let totalCompleted = 0;
      const scores: number[] = [];
      let passCount = 0;
      let totalCount = 0;

      const performerMap: Array<{ name: string; count: number }> = [];
      const needsAttentionList: string[] = [];

      for (const emp of activeEmployees) {
        const targetPrograms = Array.from(programs.values()).filter(
          (p) => p.target_positions.length === 0 || p.target_positions.includes(emp.position)
        );
        totalRequired += targetPrograms.length;

        const passed = employeePassedMap.get(emp.employee_id);
        const completedCount = passed
          ? targetPrograms.filter((p) => passed.has(p.program_code)).length
          : 0;
        totalCompleted += completedCount;

        const empScores = employeeScores.get(emp.employee_id) || [];
        scores.push(...empScores);

        const empPassCount = employeePassCount.get(emp.employee_id) || 0;
        passCount += empPassCount;
        totalCount += empScores.length || (empPassCount > 0 ? empPassCount : 0);

        performerMap.push({ name: emp.employee_name, count: empPassCount });

        if (completedCount === 0 && targetPrograms.length > 0) {
          needsAttentionList.push(emp.employee_name);
        }
      }

      performerMap.sort((a, b) => b.count - a.count);

      results.push({
        department: dept,
        totalEmployees: employees.length,
        activeEmployees: activeEmployees.length,
        requiredPrograms: totalRequired,
        completedPrograms: totalCompleted,
        completionRate: totalRequired > 0 ? Math.round((totalCompleted / totalRequired) * 100) : 0,
        avgScore:
          scores.length > 0
            ? Math.round(scores.reduce((s, v) => s + v, 0) / scores.length)
            : 0,
        passRate: totalCount > 0 ? Math.round((passCount / totalCount) * 100) : 0,
        topPerformers: performerMap.slice(0, 3).map((p) => p.name),
        needsAttention: needsAttentionList.slice(0, 5),
      });
    }

    // 완료율 내림차순 정렬
    results.sort((a, b) => b.completionRate - a.completionRate);
  } catch (error) {
    logger.error('[hrAnalytics] getDepartmentTrainingRates 실패:', error);
  }

  return results;
}

// ============================================================
// 시나리오 6: 이직률 ↔ 교육 상관관계
// ============================================================

/**
 * 이직률 ↔ 교육 상관관계 분석
 * 최근 N개월간 월별 분석
 */
export async function analyzeTurnoverTrainingCorrelation(
  months: number = 6,
): Promise<TurnoverTrainingCorrelation[]> {
  const results: TurnoverTrainingCorrelation[] = [];

  try {
    const now = new Date();
    const programs = await fetchPrograms();
    const allResults = await fetchTrainingResults();

    // 직원별 교육시간 계산
    const employeeTrainingHours = new Map<string, number>();
    for (const r of allResults) {
      if (r.result === 'PASS') {
        const program = programs.get(r.program_code);
        const hours = program?.duration_hours || 1;
        const current = employeeTrainingHours.get(r.employee_id) || 0;
        employeeTrainingHours.set(r.employee_id, current + hours);
      }
    }

    // 직원별 교육 완료 여부
    const employeeHasTraining = new Set<string>();
    for (const r of allResults) {
      if (r.result === 'PASS') {
        employeeHasTraining.add(r.employee_id);
      }
    }

    // TQC 수료자
    const tqcSnapshot = await getDocs(query(collection(db, 'tqc_trainees'), limit(1000)));
    const tqcCompletedSet = new Set<string>();
    tqcSnapshot.docs.forEach((d) => {
      const data = d.data();
      if ((data.status as string) === 'PASSED') {
        tqcCompletedSet.add((data.employee_id as string) || '');
      }
    });

    for (let i = 0; i < months; i++) {
      const targetDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const m = MONTH_NAMES[targetDate.getMonth()];
      const y = targetDate.getFullYear();
      const period = `${m}_${y}`;

      const hrEmployees = await safelyFetchHREmployees(m, y);

      if (hrEmployees.length === 0) {
        results.push({
          period,
          totalResignations: 0,
          resignedWithTraining: 0,
          resignedWithoutTraining: 0,
          trainingRetentionRate: 0,
          noTrainingRetentionRate: 0,
          tqcCompletionSurvivalRate: 0,
          avgTrainingHoursResigned: 0,
          avgTrainingHoursRetained: 0,
        });
        continue;
      }

      const resigned = hrEmployees.filter((e) => e.resigned_this_month);
      const active = hrEmployees.filter((e) => e.is_active);
      const totalResignations = resigned.length;

      const resignedWithTraining = resigned.filter(
        (e) => employeeHasTraining.has(e.employee_id)
      ).length;
      const resignedWithoutTraining = totalResignations - resignedWithTraining;

      // 잔류율 계산
      const trainedActive = active.filter((e) => employeeHasTraining.has(e.employee_id)).length;
      const trainedTotal = trainedActive + resignedWithTraining;
      const trainingRetentionRate =
        trainedTotal > 0 ? Math.round((trainedActive / trainedTotal) * 100) : 0;

      const untrainedActive = active.filter(
        (e) => !employeeHasTraining.has(e.employee_id)
      ).length;
      const untrainedTotal = untrainedActive + resignedWithoutTraining;
      const noTrainingRetentionRate =
        untrainedTotal > 0 ? Math.round((untrainedActive / untrainedTotal) * 100) : 0;

      // TQC 수료자 3개월 생존율
      const tqcCompleted = active.filter((e) => tqcCompletedSet.has(e.employee_id)).length;
      const tqcTotal = tqcCompleted + resigned.filter(
        (e) => tqcCompletedSet.has(e.employee_id)
      ).length;
      const tqcCompletionSurvivalRate =
        tqcTotal > 0 ? Math.round((tqcCompleted / tqcTotal) * 100) : 0;

      // 평균 교육시간
      const resignedHours = resigned
        .map((e) => employeeTrainingHours.get(e.employee_id) || 0)
        .reduce((s, v) => s + v, 0);
      const retainedHours = active
        .map((e) => employeeTrainingHours.get(e.employee_id) || 0)
        .reduce((s, v) => s + v, 0);

      results.push({
        period,
        totalResignations,
        resignedWithTraining,
        resignedWithoutTraining,
        trainingRetentionRate,
        noTrainingRetentionRate,
        tqcCompletionSurvivalRate,
        avgTrainingHoursResigned:
          resigned.length > 0 ? Math.round(resignedHours / resigned.length) : 0,
        avgTrainingHoursRetained:
          active.length > 0 ? Math.round((retainedHours / active.length) * 10) / 10 : 0,
      });
    }

    // 최신순 정렬
    results.reverse();
  } catch (error) {
    logger.error('[hrAnalytics] analyzeTurnoverTrainingCorrelation 실패:', error);
  }

  return results;
}
