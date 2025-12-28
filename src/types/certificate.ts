/**
 * Certificate Types
 * 교육 이수증 발급 타입 정의
 */

import type { EmployeeId, ProgramCode } from './branded';

export interface Certificate {
  certificate_id: string;
  certificate_number: string; // 고유 이수증 번호 (예: CERT-2024-001234)
  employee_id: EmployeeId;
  employee_name: string;
  program_code: ProgramCode;
  program_name: string;
  training_date: string;
  completion_date: string;
  expiry_date?: string;
  score?: number;
  grade?: string;
  trainer_name?: string;
  issued_at: string;
  issued_by: string;
  is_valid: boolean;
  pdf_url?: string;
}

export interface CertificateTemplate {
  template_id: string;
  template_name: string;
  program_codes: ProgramCode[]; // 적용 프로그램 (빈 배열이면 전체)
  header_logo?: string;
  footer_logo?: string;
  background_image?: string;
  title_text: string;
  body_template: string;
  signature_image?: string;
  signature_name: string;
  signature_title: string;
  is_default: boolean;
}

export interface CertificateGenerateRequest {
  employee_id: EmployeeId;
  program_code: ProgramCode;
  result_id: string;
  template_id?: string;
}

export interface CertificateBulkRequest {
  session_id: string;
  template_id?: string;
  only_passed?: boolean; // true면 합격자만
}

// 이수증 번호 생성
export function generateCertificateNumber(year: number, sequence: number): string {
  return `CERT-${year}-${String(sequence).padStart(6, '0')}`;
}
