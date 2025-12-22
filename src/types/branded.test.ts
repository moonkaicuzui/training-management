import { describe, it, expect } from 'vitest';
import {
  isEmployeeId,
  isProgramCode,
  isSessionId,
  isResultId,
  createEmployeeId,
  createProgramCode,
  createSessionId,
  createResultId,
  unsafeEmployeeId,
} from './branded';

describe('Branded Types', () => {
  describe('isEmployeeId', () => {
    it('should return true for valid employee ID format', () => {
      expect(isEmployeeId('EMP001')).toBe(true);
      expect(isEmployeeId('EMP12345')).toBe(true);
      expect(isEmployeeId('E001')).toBe(true);
    });

    it('should return false for invalid formats', () => {
      expect(isEmployeeId('')).toBe(false);
      expect(isEmployeeId('123')).toBe(false);
      expect(isEmployeeId(null as any)).toBe(false);
      expect(isEmployeeId(undefined as any)).toBe(false);
    });
  });

  describe('isProgramCode', () => {
    it('should return true for valid program codes', () => {
      expect(isProgramCode('QIP-001')).toBe(true);
      expect(isProgramCode('PROD-BASIC')).toBe(true);
      expect(isProgramCode('NEW-01')).toBe(true);
    });

    it('should return false for invalid formats', () => {
      expect(isProgramCode('')).toBe(false);
      expect(isProgramCode('ab')).toBe(false);
    });
  });

  describe('isSessionId', () => {
    it('should return true for valid session IDs', () => {
      expect(isSessionId('SESS-2024-001')).toBe(true);
      expect(isSessionId('S001')).toBe(true);
    });

    it('should return false for invalid formats', () => {
      expect(isSessionId('')).toBe(false);
    });
  });

  describe('isResultId', () => {
    it('should return true for valid result IDs', () => {
      expect(isResultId('RES-001')).toBe(true);
      expect(isResultId('R12345')).toBe(true);
    });

    it('should return false for invalid formats', () => {
      expect(isResultId('')).toBe(false);
    });
  });

  describe('createEmployeeId', () => {
    it('should return EmployeeId for valid input', () => {
      const result = createEmployeeId('EMP001');
      expect(result).toBe('EMP001');
    });

    it('should return null for invalid input', () => {
      const result = createEmployeeId('');
      expect(result).toBeNull();
    });
  });

  describe('createProgramCode', () => {
    it('should return ProgramCode for valid input', () => {
      const result = createProgramCode('QIP-001');
      expect(result).toBe('QIP-001');
    });

    it('should return null for invalid input', () => {
      const result = createProgramCode('');
      expect(result).toBeNull();
    });
  });

  describe('createSessionId', () => {
    it('should return SessionId for valid input', () => {
      const result = createSessionId('SESS-001');
      expect(result).toBe('SESS-001');
    });

    it('should return null for invalid input', () => {
      const result = createSessionId('');
      expect(result).toBeNull();
    });
  });

  describe('createResultId', () => {
    it('should return ResultId for valid input', () => {
      const result = createResultId('RES-001');
      expect(result).toBe('RES-001');
    });

    it('should return null for invalid input', () => {
      const result = createResultId('');
      expect(result).toBeNull();
    });
  });

  describe('unsafe constructors', () => {
    it('should create branded type without validation', () => {
      const id = unsafeEmployeeId('any-string');
      expect(id).toBe('any-string');
    });
  });
});
