/**
 * Zod validation schemas for forms
 */
import { z } from 'zod';

// ========== CAPA Schemas ==========

export const capaFormSchema = z.object({
  title: z.string().min(1, 'validation.required'),
  description: z.string().min(1, 'validation.required'),
  type: z.enum(['corrective', 'preventive']),
  severity: z.enum(['critical', 'major', 'minor']),
  priority: z.enum(['high', 'medium', 'low']),
  source: z.enum(['audit', 'customer', 'internal', 'supplier', 'process', 'training']),
  problemDescription: z.string().min(1, 'validation.required'),
  affectedArea: z.string().min(1, 'validation.required'),
  immediateActions: z.string().optional(),
  dueDate: z.string().optional(),
});

export type CAPAFormValues = z.infer<typeof capaFormSchema>;

// ========== Employee Schemas ==========

export const employeeFormSchema = z.object({
  employee_id: z.string().min(1, 'validation.required'),
  employee_name: z.string().min(1, 'validation.required'),
  department: z.string().min(1, 'validation.required'),
  position: z.string().min(1, 'validation.required'),
  building: z.string().min(1, 'validation.required'),
  line: z.string().optional(),
  hire_date: z.string().min(1, 'validation.required'),
  status: z.enum(['ACTIVE', 'INACTIVE']),
});

export type EmployeeFormValues = z.infer<typeof employeeFormSchema>;

// ========== Program Schemas ==========

export const programFormSchema = z.object({
  program_code: z.string().min(1, 'validation.required'),
  program_name: z.string().min(1, 'validation.required'),
  program_name_vn: z.string().optional(),
  program_name_kr: z.string().optional(),
  category: z.string().min(1, 'validation.required'),
  target_positions: z.array(z.string()).min(1, 'validation.required'),
  passing_score: z.number().min(0).max(100),
  training_hours: z.number().min(0),
  validity_months: z.number().min(0),
  is_active: z.boolean(),
});

export type ProgramFormValues = z.infer<typeof programFormSchema>;

// ========== Training Result Schemas ==========

export const resultFormSchema = z.object({
  session_id: z.string().min(1, 'validation.required'),
  employee_id: z.string().min(1, 'validation.required'),
  score: z.number().min(0).max(100).optional(),
  result: z.enum(['PASS', 'FAIL', 'ABSENT']),
  remarks: z.string().optional(),
});

export type ResultFormValues = z.infer<typeof resultFormSchema>;
