import { describe, it, expect } from 'vitest';
import {
  normalizeEmployee,
  normalizeTrainingProgram,
  normalizeTrainingSession,
  normalizeTrainingResult,
  normalizeEmployees,
} from './normalized';
import type { Employee, TrainingProgram, TrainingSession, TrainingResultRecord } from './index';

describe('Normalization Functions', () => {
  describe('normalizeEmployee', () => {
    it('should convert legacy Employee to NormalizedEmployee', () => {
      const legacy: Employee = {
        employee_id: 'EMP001',
        employee_name: 'John Doe',
        department: 'QIP',
        position: 'TQC',
        building: 'BUILDING_A_F1',
        line: 'L1',
        hire_date: '2024-01-15',
        status: 'ACTIVE',
        updated_at: '2024-01-15T10:00:00Z',
      };

      const normalized = normalizeEmployee(legacy);

      expect(normalized.employee_id).toBe('EMP001');
      expect(normalized.employee_name).toBe('John Doe');
      expect(normalized.department).toBe('QIP');
      expect(normalized.position).toBe('TQC');
      expect(normalized.building).toBe('BUILDING_A_F1');
      expect(normalized.line).toBe('L1');
      expect(normalized.hire_date).toBe('2024-01-15');
      expect(normalized.status).toBe('ACTIVE');
    });

    it('should preserve all required fields', () => {
      const legacy: Employee = {
        employee_id: 'EMP002',
        employee_name: 'Jane Smith',
        department: 'PRODUCTION',
        position: 'RQC',
        building: 'BUILDING_C',
        line: 'L5',
        hire_date: '2023-06-01',
        status: 'INACTIVE',
        updated_at: '2024-02-01T08:30:00Z',
      };

      const normalized = normalizeEmployee(legacy);

      expect(Object.keys(normalized)).toContain('employee_id');
      expect(Object.keys(normalized)).toContain('employee_name');
      expect(Object.keys(normalized)).toContain('department');
      expect(Object.keys(normalized)).toContain('position');
      expect(Object.keys(normalized)).toContain('building');
      expect(Object.keys(normalized)).toContain('line');
      expect(Object.keys(normalized)).toContain('hire_date');
      expect(Object.keys(normalized)).toContain('status');
      expect(Object.keys(normalized)).toContain('updated_at');
    });
  });

  describe('normalizeTrainingProgram', () => {
    it('should convert legacy TrainingProgram to NormalizedTrainingProgram', () => {
      const legacy: TrainingProgram = {
        program_code: 'QIP-001',
        program_name: 'Basic QIP Training',
        program_name_vn: 'Dao tao QIP co ban',
        program_name_kr: 'QIP 기본 교육',
        category: 'QIP',
        tags: ['basic', 'required'],
        target_positions: ['TQC', 'RQC'],
        evaluation_type: 'SCORE',
        passing_score: 80,
        grade_aa: 95,
        grade_a: 90,
        grade_b: 80,
        duration_hours: 4,
        validity_months: 12,
        is_active: true,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-15T10:00:00Z',
      };

      const normalized = normalizeTrainingProgram(legacy);

      expect(normalized.program_code).toBe('QIP-001');
      expect(normalized.program_name).toBe('Basic QIP Training');
      expect(normalized.grade_thresholds).toEqual({ aa: 95, a: 90, b: 80 });
      expect(normalized.tags).toContain('basic');
      expect(normalized.target_positions).toContain('TQC');
      expect(normalized.is_active).toBe(true);
    });

    it('should freeze arrays for immutability', () => {
      const legacy: TrainingProgram = {
        program_code: 'PROD-001',
        program_name: 'Production Training',
        program_name_vn: 'Dao tao san xuat',
        program_name_kr: '생산 교육',
        category: 'PRODUCTION',
        tags: ['production'],
        target_positions: ['TQC'],
        evaluation_type: 'PASS_FAIL',
        passing_score: 70,
        grade_aa: 95,
        grade_a: 85,
        grade_b: 75,
        duration_hours: 2,
        validity_months: null,
        is_active: true,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-15T10:00:00Z',
      };

      const normalized = normalizeTrainingProgram(legacy);

      expect(Object.isFrozen(normalized.tags)).toBe(true);
      expect(Object.isFrozen(normalized.target_positions)).toBe(true);
    });
  });

  describe('normalizeTrainingSession', () => {
    it('should convert legacy TrainingSession to NormalizedTrainingSession', () => {
      const legacy: TrainingSession = {
        session_id: 'SESS-001',
        program_code: 'QIP-001',
        session_date: '2024-03-15',
        session_time: '09:00',
        trainer_name: 'Kim Trainer',
        trainer: 'Kim Trainer',
        location: 'Room A',
        max_attendees: 20,
        status: 'PLANNED',
        notes: 'Morning session',
        created_by: 'admin',
        created_at: '2024-03-01T00:00:00Z',
        attendees: ['EMP001', 'EMP002'],
      };

      const normalized = normalizeTrainingSession(legacy);

      expect(normalized.session_id).toBe('SESS-001');
      expect(normalized.program_code).toBe('QIP-001');
      expect(normalized.trainer.name).toBe('Kim Trainer');
      expect(normalized.attendees).toContain('EMP001');
      expect(Object.isFrozen(normalized.attendees)).toBe(true);
    });
  });

  describe('normalizeTrainingResult', () => {
    it('should convert legacy TrainingResultRecord to NormalizedTrainingResultRecord', () => {
      const legacy: TrainingResultRecord = {
        result_id: 'RES-001',
        session_id: 'SESS-001',
        employee_id: 'EMP001',
        program_code: 'QIP-001',
        training_date: '2024-03-15',
        score: 92,
        grade: 'A',
        result: 'PASS',
        needs_retraining: false,
        evaluated_by: 'trainer@example.com',
        remarks: 'Good performance',
        created_at: '2024-03-15T10:00:00Z',
        updated_at: null,
        updated_by: null,
      };

      const normalized = normalizeTrainingResult(legacy);

      expect(normalized.result_id).toBe('RES-001');
      expect(normalized.session_id).toBe('SESS-001');
      expect(normalized.employee_id).toBe('EMP001');
      expect(normalized.score).toBe(92);
      expect(normalized.grade).toBe('A');
      expect(normalized.result).toBe('PASS');
    });

    it('should handle null session_id', () => {
      const legacy: TrainingResultRecord = {
        result_id: 'RES-002',
        session_id: null,
        employee_id: 'EMP002',
        program_code: 'QIP-001',
        training_date: '2024-03-16',
        score: null,
        grade: null,
        result: 'ABSENT',
        needs_retraining: true,
        evaluated_by: 'trainer@example.com',
        remarks: '',
        created_at: '2024-03-16T10:00:00Z',
        updated_at: null,
        updated_by: null,
      };

      const normalized = normalizeTrainingResult(legacy);

      expect(normalized.session_id).toBeNull();
      expect(normalized.score).toBeNull();
      expect(normalized.grade).toBeNull();
    });
  });

  describe('normalizeEmployees', () => {
    it('should batch normalize multiple employees', () => {
      const legacyEmployees: Employee[] = [
        {
          employee_id: 'EMP001',
          employee_name: 'John Doe',
          department: 'QIP',
          position: 'TQC',
          building: 'BUILDING_A_F1',
          line: 'L1',
          hire_date: '2024-01-15',
          status: 'ACTIVE',
          updated_at: '2024-01-15T10:00:00Z',
        },
        {
          employee_id: 'EMP002',
          employee_name: 'Jane Smith',
          department: 'PRODUCTION',
          position: 'RQC',
          building: 'BUILDING_C',
          line: 'L5',
          hire_date: '2023-06-01',
          status: 'ACTIVE',
          updated_at: '2024-02-01T08:30:00Z',
        },
      ];

      const normalized = normalizeEmployees(legacyEmployees);

      expect(normalized).toHaveLength(2);
      expect(normalized[0].employee_id).toBe('EMP001');
      expect(normalized[1].employee_id).toBe('EMP002');
    });
  });
});
