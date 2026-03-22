/** HR V2 직원 레코드 */
export interface HREmployeeRecord {
  employee_id: string;
  employee_name: string;
  team: string;
  position: string;
  position_3rd: string;
  building: string;
  entrance_date: string;
  resign_date: string | null;
  is_active: boolean;
  hired_this_month: boolean;
  resigned_this_month: boolean;
  working_days: number;
  absent_days: number;
  unauthorized_absent_days: number;
  risk_score: number;
  risk_level: string;
}

export type HRChangeType = 'NEW_HIRE' | 'RESIGNATION' | 'DEPARTMENT_CHANGE' | 'BUILDING_CHANGE';

export interface HRChangeEvent {
  type: HRChangeType;
  employeeId: string;
  employeeName: string;
  details: {
    hireDate?: string;
    team?: string;
    building?: string;
    position?: string;
    resignDate?: string;
    previousTeam?: string;
    from?: string;
    to?: string;
  };
}

export interface HRSyncResult {
  syncedAt: string;
  totalHREmployees: number;
  newEmployees: HRChangeEvent[];
  resignedEmployees: HRChangeEvent[];
  departmentChanges: HRChangeEvent[];
  buildingChanges: HRChangeEvent[];
  updatedCount: number;
  errors: string[];
}

export interface HRSummary {
  totalHeadcount: number;
  activeHeadcount: number;
  newHires: number;
  resignations: number;
  attendanceRate: number;
  absenceRate: number;
  unauthorizedAbsenceRate: number;
  turnoverRate: number;
  aqlPassRate: number;
  fivePrsPassRate: number;
  avgTenure: number;
  monthYear: string;
  syncedAt?: string;
}
