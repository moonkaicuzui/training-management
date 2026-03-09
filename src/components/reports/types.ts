export type ReportType = 'department' | 'program' | 'employee';

export interface DepartmentReport {
  department: string;
  totalEmployees: number;
  completedTrainings: number;
  pendingTrainings: number;
  completionRate: number;
  averageScore: number;
  passRate: number;
}

export interface ProgramReport {
  program_code: string;
  program_name: string;
  totalSessions: number;
  totalTrainees: number;
  passCount: number;
  failCount: number;
  passRate: number;
  averageScore: number;
  retrainingCount: number;
}

export interface EmployeeExportItem {
  employee_id: string;
  employee_name: string;
  department: string;
  position: string;
  building: string;
  line: string;
  hire_date: string;
  status: string;
  passCount: number;
  totalCount: number;
}
