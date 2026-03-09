export interface TrainingResult {
  result_id: string;
  employee_id: string;
  employee_name: string;
  department: string;
  position: string;
  program_code: string;
  program_name: string;
  training_date: string;
  score: number | null;
  grade: string | null;
  result: 'PASS' | 'FAIL';
}

export interface ProgramOption {
  program_code: string;
  program_name: string;
}

export interface CertificateData {
  certificateNumber: string;
  employeeId: string;
  employeeName: string;
  department: string;
  position: string;
  programCode: string;
  programName: string;
  trainingDate: string;
  score: number | null;
  grade: string | null;
  issueDate: string;
}
