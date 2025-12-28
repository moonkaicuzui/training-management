/**
 * Attendance Types
 * 교육 세션 출석 관리 타입 정의
 */

import type { EmployeeId, SessionId } from './branded';

export type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED';

export interface Attendance {
  attendance_id: string;
  session_id: SessionId;
  employee_id: EmployeeId;
  status: AttendanceStatus;
  check_in_time?: string; // ISO datetime
  check_out_time?: string; // ISO datetime
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface AttendanceInput {
  session_id: SessionId;
  employee_id: EmployeeId;
  status: AttendanceStatus;
  check_in_time?: string;
  notes?: string;
}

export interface AttendanceSummary {
  session_id: SessionId;
  total_expected: number;
  present: number;
  absent: number;
  late: number;
  excused: number;
  attendance_rate: number; // percentage
}

export interface BulkAttendanceInput {
  session_id: SessionId;
  attendances: {
    employee_id: EmployeeId;
    status: AttendanceStatus;
    notes?: string;
  }[];
}

// 출석 상태 라벨
export const ATTENDANCE_STATUS_LABELS: Record<AttendanceStatus, { ko: string; en: string; vi: string }> = {
  PRESENT: { ko: '출석', en: 'Present', vi: 'Có mặt' },
  ABSENT: { ko: '결석', en: 'Absent', vi: 'Vắng mặt' },
  LATE: { ko: '지각', en: 'Late', vi: 'Đến muộn' },
  EXCUSED: { ko: '사유결석', en: 'Excused', vi: 'Có phép' },
};

// 출석 상태 색상
export const ATTENDANCE_STATUS_COLORS: Record<AttendanceStatus, string> = {
  PRESENT: 'bg-green-100 text-green-800 border-green-200',
  ABSENT: 'bg-red-100 text-red-800 border-red-200',
  LATE: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  EXCUSED: 'bg-blue-100 text-blue-800 border-blue-200',
};
