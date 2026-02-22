/**
 * Attrition Risk Calculator
 * TQC 신입 교육생 이탈 위험도 예측 알고리즘
 *
 * Rule-based scoring system (total 100 points)
 * - Training progress delay: 0-25 points
 * - Meeting attendance: 0-20 points
 * - Historical patterns: 0-20 points
 * - Assessment results: 0-15 points
 * - Tenure risk: 0-10 points
 * - Engagement: 0-10 points
 */

// ========== Types ==========

export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface RiskFactor {
  name: string;
  score: number;
  maxScore: number;
  description: string;
}

export interface AttritionRiskResult {
  totalScore: number;
  level: RiskLevel;
  factors: RiskFactor[];
}

export interface TraineeRiskInput {
  // trainee data
  startDate: string;
  progressPercentage: number;
  status: string;
  trainerId?: string;
  teamId?: string;
  building?: string;
  // meetings
  meetings: Array<{ meetingType: string; status: string }>;
  // color blind test
  colorBlindResult?: 'PASS' | 'FAIL';
  // assessment score (optional, normalized 0-100)
  assessmentScore?: number;
  averageAssessmentScore?: number;
  // stage data
  latestStageUpdateDate?: string;
  latestRecordUpdateDate?: string;
  // historical rates
  trainerResignationRate?: number;
  teamResignationRate?: number;
  buildingResignationRate?: number;
  averageResignationRate?: number;
}

// ========== Constants ==========

const TRAINING_DURATION_DAYS = 90;

const RISK_THRESHOLDS = {
  LOW: 30,
  MEDIUM: 60,
  HIGH: 80,
} as const;

// ========== Helper Functions ==========

/**
 * Calculate the number of days between two dates
 */
function daysBetween(dateA: Date, dateB: Date): number {
  const msPerDay = 1000 * 60 * 60 * 24;
  return Math.floor(Math.abs(dateB.getTime() - dateA.getTime()) / msPerDay);
}

/**
 * Calculate expected progress percentage based on days since start
 * 90 days = 100% expected progress
 */
function getExpectedProgress(startDate: string, now: Date = new Date()): number {
  const start = new Date(startDate);
  const daysSinceStart = daysBetween(start, now);
  const expected = (daysSinceStart / TRAINING_DURATION_DAYS) * 100;
  return Math.min(expected, 100);
}

// ========== Factor Calculators ==========

/**
 * Factor 1: Training progress delay (0-25 points)
 * Compares actual progress against expected timeline
 */
function calculateProgressDelay(input: TraineeRiskInput): RiskFactor {
  const expected = getExpectedProgress(input.startDate);
  const actual = input.progressPercentage;
  const gap = expected - actual;

  let score = 0;
  let description = '';

  if (gap > 30) {
    score = 25;
    description = `Progress gap ${gap.toFixed(0)}% (> 30%) - severely behind schedule`;
  } else if (gap > 15) {
    score = 15;
    description = `Progress gap ${gap.toFixed(0)}% (> 15%) - behind schedule`;
  } else {
    score = 0;
    description = `Progress gap ${gap.toFixed(0)}% - on track`;
  }

  return {
    name: 'Training Progress Delay',
    score,
    maxScore: 25,
    description,
  };
}

/**
 * Factor 2: Meeting attendance (0-20 points)
 * Missed meetings are a strong predictor of attrition
 */
function calculateMeetingAttendance(input: TraineeRiskInput): RiskFactor {
  let score = 0;
  const missedMeetings: string[] = [];

  for (const meeting of input.meetings) {
    if (meeting.status === 'MISSED') {
      if (meeting.meetingType === 'WEEK_1') {
        score += 10;
        missedMeetings.push('Week-1');
      } else if (meeting.meetingType === 'MONTH_1') {
        score += 15;
        missedMeetings.push('Month-1');
      } else if (meeting.meetingType === 'MONTH_3') {
        score += 20;
        missedMeetings.push('Month-3');
      }
    }
  }

  // Cap at max 20 points
  score = Math.min(score, 20);

  const description =
    missedMeetings.length > 0
      ? `Missed meetings: ${missedMeetings.join(', ')}`
      : 'All meetings attended or scheduled';

  return {
    name: 'Meeting Attendance',
    score,
    maxScore: 20,
    description,
  };
}

/**
 * Factor 3: Historical patterns (0-20 points)
 * Same trainer/team/building resignation rates compared to average
 */
function calculateHistoricalPatterns(input: TraineeRiskInput): RiskFactor {
  const avg = input.averageResignationRate ?? 0;
  let score = 0;
  const details: string[] = [];

  if (
    input.trainerResignationRate !== undefined &&
    input.trainerResignationRate > avg
  ) {
    score += 10;
    details.push(`Trainer rate ${(input.trainerResignationRate * 100).toFixed(1)}% > avg ${(avg * 100).toFixed(1)}%`);
  }

  if (
    input.teamResignationRate !== undefined &&
    input.teamResignationRate > avg
  ) {
    score += 5;
    details.push(`Team rate ${(input.teamResignationRate * 100).toFixed(1)}% > avg`);
  }

  if (
    input.buildingResignationRate !== undefined &&
    input.buildingResignationRate > avg
  ) {
    score += 5;
    details.push(`Building rate ${(input.buildingResignationRate * 100).toFixed(1)}% > avg`);
  }

  // Cap at max 20 points
  score = Math.min(score, 20);

  const description =
    details.length > 0
      ? details.join('; ')
      : 'Historical rates within normal range';

  return {
    name: 'Historical Patterns',
    score,
    maxScore: 20,
    description,
  };
}

/**
 * Factor 4: Assessment results (0-15 points)
 * Color blind test failure and below-average test scores
 */
function calculateAssessmentResults(input: TraineeRiskInput): RiskFactor {
  let score = 0;
  const details: string[] = [];

  if (input.colorBlindResult === 'FAIL') {
    score += 10;
    details.push('Color blind test: FAIL');
  }

  if (
    input.assessmentScore !== undefined &&
    input.averageAssessmentScore !== undefined &&
    input.assessmentScore < input.averageAssessmentScore
  ) {
    score += 5;
    details.push(
      `Test score ${input.assessmentScore} < avg ${input.averageAssessmentScore}`
    );
  }

  // Cap at max 15 points
  score = Math.min(score, 15);

  const description =
    details.length > 0
      ? details.join('; ')
      : 'Assessment results within normal range';

  return {
    name: 'Assessment Results',
    score,
    maxScore: 15,
    description,
  };
}

/**
 * Factor 5: Tenure risk (0-10 points)
 * Early tenure trainees are at higher risk
 */
function calculateTenureRisk(input: TraineeRiskInput): RiskFactor {
  const start = new Date(input.startDate);
  const now = new Date();
  const daysSinceStart = daysBetween(start, now);

  let score = 0;
  let description = '';

  if (daysSinceStart <= 14) {
    score = 10;
    description = `Within 2 weeks (${daysSinceStart} days) - highest risk period`;
  } else if (daysSinceStart <= 28) {
    score = 5;
    description = `3-4 weeks (${daysSinceStart} days) - elevated risk period`;
  } else {
    score = 0;
    description = `After 1 month (${daysSinceStart} days) - lower tenure risk`;
  }

  return {
    name: 'Tenure Risk',
    score,
    maxScore: 10,
    description,
  };
}

/**
 * Factor 6: Engagement (0-10 points)
 * Lack of recent activity signals disengagement
 */
function calculateEngagement(input: TraineeRiskInput): RiskFactor {
  const now = new Date();
  let score = 0;
  const details: string[] = [];

  if (input.latestStageUpdateDate) {
    const lastStageUpdate = new Date(input.latestStageUpdateDate);
    const daysSinceStage = daysBetween(lastStageUpdate, now);
    if (daysSinceStage >= 5) {
      score += 5;
      details.push(`No stage progress for ${daysSinceStage} days`);
    }
  }

  if (input.latestRecordUpdateDate) {
    const lastRecordUpdate = new Date(input.latestRecordUpdateDate);
    const daysSinceRecord = daysBetween(lastRecordUpdate, now);
    if (daysSinceRecord >= 7) {
      score += 5;
      details.push(`No record update for ${daysSinceRecord} days`);
    }
  }

  // Cap at max 10 points
  score = Math.min(score, 10);

  const description =
    details.length > 0
      ? details.join('; ')
      : 'Recent activity detected - engaged';

  return {
    name: 'Engagement',
    score,
    maxScore: 10,
    description,
  };
}

// ========== Main Functions ==========

/**
 * Determine risk level from total score
 */
export function getRiskLevel(score: number): RiskLevel {
  if (score <= RISK_THRESHOLDS.LOW) return 'LOW';
  if (score <= RISK_THRESHOLDS.MEDIUM) return 'MEDIUM';
  if (score <= RISK_THRESHOLDS.HIGH) return 'HIGH';
  return 'CRITICAL';
}

/**
 * Get tailwind-compatible color for a risk level
 */
export function getRiskColor(level: RiskLevel): string {
  switch (level) {
    case 'LOW':
      return 'green';
    case 'MEDIUM':
      return 'yellow';
    case 'HIGH':
      return 'orange';
    case 'CRITICAL':
      return 'red';
  }
}

/**
 * Calculate the full attrition risk assessment for a trainee
 */
export function calculateAttritionRisk(
  input: TraineeRiskInput
): AttritionRiskResult {
  const factors: RiskFactor[] = [
    calculateProgressDelay(input),
    calculateMeetingAttendance(input),
    calculateHistoricalPatterns(input),
    calculateAssessmentResults(input),
    calculateTenureRisk(input),
    calculateEngagement(input),
  ];

  const totalScore = Math.min(
    factors.reduce((sum, f) => sum + f.score, 0),
    100
  );

  return {
    totalScore,
    level: getRiskLevel(totalScore),
    factors,
  };
}
