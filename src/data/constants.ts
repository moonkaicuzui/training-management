// ============================================================
// Q-TRAIN Constants
// Centralized constants for the training management system
// ============================================================

import type {
  TrainingLevel,
  TrainingType,
  WorkingArea,
  Building,
  Department,
  Position,
  ProgramCategory,
  SessionStatus,
  Grade,
  TrainingResult,
} from '@/types';

// ========== Training Levels (2026 Curriculum) ==========

export const TRAINING_LEVELS: { value: TrainingLevel; label: string; labelVn: string; labelKr: string; description: string }[] = [
  {
    value: 'LEVEL_1',
    label: 'Level 1 - TQC / New TQC',
    labelVn: 'Cấp 1 - TQC / New TQC',
    labelKr: 'Level 1 - TQC / New TQC',
    description: 'Quality Inspection',
  },
  {
    value: 'LEVEL_2',
    label: 'Level 2 - RQC / Line Leader',
    labelVn: 'Cấp 2 - RQC / Line Leader',
    labelKr: 'Level 2 - RQC / Line Leader',
    description: 'Quality Control - 24 courses',
  },
  {
    value: 'LEVEL_3',
    label: 'Level 3 - Group Leader up',
    labelVn: 'Cấp 3 - Group Leader trở lên',
    labelKr: 'Level 3 - Group Leader 이상',
    description: 'Quality Assurance - 13 courses',
  },
  {
    value: 'LEVEL_4',
    label: 'Level 4 - QA & Management',
    labelVn: 'Cấp 4 - QA & Quản lý',
    labelKr: 'Level 4 - QA & 관리',
    description: 'Overall Quality Management',
  },
];

// ========== Training Types ==========

export const TRAINING_TYPES: { value: TrainingType; label: string; labelVn: string; labelKr: string }[] = [
  { value: 'REGULAR', label: 'Regular', labelVn: 'Thường xuyên', labelKr: '정기' },
  { value: 'SPECIAL', label: 'Special', labelVn: 'Đặc biệt', labelKr: '특별' },
];

// ========== Working Areas (16 areas for New TQC) ==========

export const WORKING_AREAS: { value: WorkingArea; label: string; labelVn: string; labelKr: string }[] = [
  { value: 'ASSEMBLY', label: 'Assembly', labelVn: 'Lắp ráp', labelKr: '조립' },
  { value: 'STITCHING', label: 'Stitching', labelVn: 'May', labelKr: '재봉' },
  { value: 'CUTTING', label: 'Cutting', labelVn: 'Cắt', labelKr: '재단' },
  { value: 'BOTTOM', label: 'Bottom', labelVn: 'Đế', labelKr: '바닥' },
  { value: 'STOCKFIT', label: 'Stockfit', labelVn: 'Stockfit', labelKr: 'Stockfit' },
  { value: 'OSC', label: 'OSC', labelVn: 'OSC', labelKr: 'OSC' },
  { value: 'MTL_HAPPO', label: 'MTL Happo', labelVn: 'MTL Happo', labelKr: 'MTL Happo' },
  { value: 'MTL_HAPPO_EZ', label: 'MTL Happo EZ', labelVn: 'MTL Happo EZ', labelKr: 'MTL Happo EZ' },
  { value: 'MTL_LEATHER', label: 'MTL Leather', labelVn: 'MTL Da', labelKr: 'MTL 가죽' },
  { value: 'MTL_SUBSHI', label: 'MTL Subshi', labelVn: 'MTL Subshi', labelKr: 'MTL Subshi' },
  { value: 'MTL_TEXTILE', label: 'MTL Textile', labelVn: 'MTL Dệt', labelKr: 'MTL 직물' },
  { value: 'QA', label: 'QA', labelVn: 'QA', labelKr: 'QA' },
  { value: 'OFFICE', label: 'Office', labelVn: 'Văn phòng', labelKr: '사무실' },
  { value: 'REPACKING', label: 'Repacking', labelVn: 'Đóng gói lại', labelKr: '리패킹' },
  { value: 'AQL', label: 'AQL', labelVn: 'AQL', labelKr: 'AQL' },
  { value: 'OCPT', label: 'OCPT', labelVn: 'OCPT', labelKr: 'OCPT' },
];

// ========== Buildings (Extended) ==========

export const BUILDINGS: { value: Building; label: string; labelVn: string; labelKr: string }[] = [
  { value: 'BUILDING_A', label: 'Building A', labelVn: 'Tòa nhà A', labelKr: 'A동' },
  { value: 'BUILDING_A1', label: 'Building A1', labelVn: 'Tòa nhà A1', labelKr: 'A1동' },
  { value: 'BUILDING_A2', label: 'Building A2', labelVn: 'Tòa nhà A2', labelKr: 'A2동' },
  { value: 'BUILDING_B', label: 'Building B', labelVn: 'Tòa nhà B', labelKr: 'B동' },
  { value: 'BUILDING_B1', label: 'Building B1', labelVn: 'Tòa nhà B1', labelKr: 'B1동' },
  { value: 'BUILDING_B2', label: 'Building B2', labelVn: 'Tòa nhà B2', labelKr: 'B2동' },
  { value: 'BUILDING_B3', label: 'Building B3', labelVn: 'Tòa nhà B3', labelKr: 'B3동' },
  { value: 'BUILDING_C', label: 'Building C', labelVn: 'Tòa nhà C', labelKr: 'C동' },
  { value: 'BUILDING_D', label: 'Building D', labelVn: 'Tòa nhà D', labelKr: 'D동' },
  { value: 'BUILDING_E1', label: 'Building E1', labelVn: 'Tòa nhà E1', labelKr: 'E1동' },
  { value: 'BUILDING_E2', label: 'Building E2', labelVn: 'Tòa nhà E2', labelKr: 'E2동' },
  { value: 'BUILDING_EZ_HAPPO', label: 'EZ Happo', labelVn: 'EZ Happo', labelKr: 'EZ Happo' },
  { value: 'BUILDING_FG_WH', label: 'FG Warehouse', labelVn: 'Kho FG', labelKr: 'FG 창고' },
  { value: 'BUILDING_INHOUSE_EZ', label: 'Inhouse EZ', labelVn: 'Inhouse EZ', labelKr: 'Inhouse EZ' },
  { value: 'BUILDING_INHOUSE_PRINTING', label: 'Inhouse Printing', labelVn: 'Inhouse In ấn', labelKr: 'Inhouse 인쇄' },
  { value: 'BUILDING_MTL_WH', label: 'MTL Warehouse', labelVn: 'Kho MTL', labelKr: 'MTL 창고' },
  { value: 'BUILDING_OSC_A', label: 'OSC A', labelVn: 'OSC A', labelKr: 'OSC A' },
  { value: 'BUILDING_QA_OFFICE', label: 'QA Office', labelVn: 'Văn phòng QA', labelKr: 'QA 사무실' },
  { value: 'BUILDING_QIP_OFFICE', label: 'QIP Office', labelVn: 'Văn phòng QIP', labelKr: 'QIP 사무실' },
];

// ========== Grade Thresholds ==========

export const GRADE_THRESHOLDS = {
  AA: { min: 100, label: 'AA', result: 'PASS' as const },
  A: { min: 90, label: 'A', result: 'PASS' as const },
  B: { min: 80, label: 'B', result: 'PASS' as const },
  C: { min: 0, max: 70, label: 'C', result: 'FAIL' as const },
};

export function calculateGrade(score: number): { grade: string; result: 'PASS' | 'FAIL' } {
  if (score === 100) return { grade: 'AA', result: 'PASS' };
  if (score >= 90) return { grade: 'A', result: 'PASS' };
  if (score >= 80) return { grade: 'B', result: 'PASS' };
  return { grade: 'C', result: 'FAIL' };
}

// ========== Attendance Status ==========

export const ATTENDANCE_STATUS = [
  { value: 'PRESENT', label: 'Present', labelVn: 'Có mặt', labelKr: '출석' },
  { value: 'ABSENT', label: 'Absent', labelVn: 'Vắng mặt', labelKr: '결석' },
  { value: 'ABSENT_WITH_REASON', label: 'Absent with Reason', labelVn: 'Vắng có lý do', labelKr: '사유 결석' },
] as const;

// ========== UI Filter Options (Dropdown) ==========

export const departments: { value: Department; label: string }[] = [
  { value: 'ASSEMBLY', label: 'Assembly' },
  { value: 'STITCHING', label: 'Stitching' },
  { value: 'CUTTING', label: 'Cutting' },
  { value: 'OSC', label: 'OSC' },
  { value: 'MTL', label: 'MTL' },
  { value: 'BOTTOM', label: 'Bottom' },
  { value: 'AQL', label: 'AQL' },
  { value: 'REPACKING', label: 'Repacking' },
  { value: 'QA', label: 'QA' },
  { value: 'OFFICE', label: 'Office' },
  { value: 'NEW', label: 'New' },
];

export const positions: { value: Position; label: string }[] = [
  { value: 'QIP_TQC', label: 'TQC' },
  { value: 'QIP_RQC', label: 'RQC' },
  { value: 'QIP_CFA', label: 'CFA' },
  { value: 'QIP_QA', label: 'QA' },
  { value: 'QIP_LINE_LEADER', label: 'QIP Line Leader' },
  { value: 'QIP_GROUP_LEADER', label: 'QIP Group Leader' },
  { value: 'QIP_SUPERVISOR', label: 'QIP Supervisor' },
  { value: 'QIP_MANAGER_PLUS', label: 'Manager+' },
  { value: 'QIP_OFFICE', label: 'Office Staff' },
  { value: 'QIP_NEW_MEMBER', label: 'New Member' },
  { value: 'PRO_WORKER', label: 'Production Worker' },
  { value: 'PRO_LINE_LEADER', label: 'Production Line Leader' },
  { value: 'PRO_GROUP_PLUS', label: 'Production Group+' },
];

export const buildings: { value: Building; label: string }[] = [
  { value: 'BUILDING_A', label: 'Building A' },
  { value: 'BUILDING_A1', label: 'Building A1' },
  { value: 'BUILDING_A2', label: 'Building A2' },
  { value: 'BUILDING_B', label: 'Building B' },
  { value: 'BUILDING_B1', label: 'Building B1' },
  { value: 'BUILDING_B2', label: 'Building B2' },
  { value: 'BUILDING_B3', label: 'Building B3' },
  { value: 'BUILDING_C', label: 'Building C' },
  { value: 'BUILDING_D', label: 'Building D' },
  { value: 'BUILDING_E1', label: 'Building E1' },
  { value: 'BUILDING_E2', label: 'Building E2' },
  { value: 'BUILDING_EZ_HAPPO', label: 'EZ Happo' },
  { value: 'BUILDING_FG_WH', label: 'FG Warehouse' },
  { value: 'BUILDING_INHOUSE_EZ', label: 'Inhouse EZ' },
  { value: 'BUILDING_INHOUSE_PRINTING', label: 'Inhouse Printing' },
  { value: 'BUILDING_MTL_WH', label: 'MTL Warehouse' },
  { value: 'BUILDING_OSC_A', label: 'OSC A' },
  { value: 'BUILDING_QA_OFFICE', label: 'QA Office' },
  { value: 'BUILDING_QIP_OFFICE', label: 'QIP Office' },
];

export const categories: { value: ProgramCategory; label: string }[] = [
  { value: 'QIP', label: 'QIP' },
  { value: 'PRODUCTION', label: 'Production' },
  { value: 'RETRAINING', label: 'Retraining' },
  { value: 'NEWCOMER', label: 'Newcomer' },
  { value: 'PROMOTION', label: 'Promotion' },
];

export const sessionStatuses: { value: SessionStatus; label: string }[] = [
  { value: 'PLANNED', label: 'Planned' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'CANCELLED', label: 'Cancelled' },
];

export const grades: { value: Grade; label: string }[] = [
  { value: 'AA', label: 'AA' },
  { value: 'A', label: 'A' },
  { value: 'B', label: 'B' },
  { value: 'C', label: 'C' },
];

export const trainingResults: { value: TrainingResult; label: string }[] = [
  { value: 'PASS', label: 'Pass' },
  { value: 'FAIL', label: 'Fail' },
  { value: 'ABSENT', label: 'Absent' },
];

// ========== New TQC Filter Options ==========

export const newTQCTraineeStatuses: { value: string; label: string }[] = [
  { value: 'IN_TRAINING', label: 'Đang đào tạo' },
  { value: 'COMPLETED', label: 'Hoàn thành' },
  { value: 'RESIGNED', label: 'Đã nghỉ' },
];

export const newTQCMeetingTypes: { value: string; label: string }[] = [
  { value: '1WEEK', label: '1 Tuần' },
  { value: '1MONTH', label: '1 Tháng' },
  { value: '3MONTH', label: '3 Tháng' },
];

export const newTQCResignationReasons: { value: string; label: string; labelVn: string }[] = [
  { value: 'HEALTH_ISSUE', label: 'Health Issue', labelVn: 'Vấn đề sức khỏe' },
  { value: 'FAMILY_MATTERS', label: 'Family Matters', labelVn: 'Việc gia đình' },
  { value: 'DISTANCE', label: 'Distance', labelVn: 'Khoảng cách xa' },
  { value: 'LOW_SALARY', label: 'Low Salary', labelVn: 'Lương thấp' },
  { value: 'JOB_CHANGE', label: 'Job Change', labelVn: 'Đổi việc' },
  { value: 'ABSENCE', label: 'Absence', labelVn: 'Vắng mặt' },
  { value: 'ACCIDENT', label: 'Accident', labelVn: 'Tai nạn' },
  { value: 'OTHER', label: 'Other', labelVn: 'Khác' },
];
