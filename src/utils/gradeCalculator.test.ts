/**
 * Grade Calculator Tests
 */

import { describe, it, expect } from 'vitest';
import {
  calculateGrade,
  calculateResult,
  calculateInspectionGrade,
  calculateGradeWithResult,
  programThresholds,
  DEFAULT_GRADE_THRESHOLDS,
  INSPECTION_GRADE_THRESHOLDS,
} from './gradeCalculator';
import type { GradeThresholds } from './gradeCalculator';

// ========== Tests ==========

describe('calculateGrade', () => {
  describe('default thresholds (AA=100, A=90, B=80)', () => {
    it('should return AA for score 100', () => {
      expect(calculateGrade(100)).toBe('AA');
    });

    it('should return A for score 95', () => {
      expect(calculateGrade(95)).toBe('A');
    });

    it('should return B for score 85', () => {
      expect(calculateGrade(85)).toBe('B');
    });

    it('should return C for score 79', () => {
      expect(calculateGrade(79)).toBe('C');
    });
  });

  describe('boundary values', () => {
    it('should return A for score 90 (exact A threshold)', () => {
      expect(calculateGrade(90)).toBe('A');
    });

    it('should return B for score 89 (just below A threshold)', () => {
      expect(calculateGrade(89)).toBe('B');
    });

    it('should return B for score 80 (exact B threshold)', () => {
      expect(calculateGrade(80)).toBe('B');
    });

    it('should return C for score 79 (just below B threshold)', () => {
      expect(calculateGrade(79)).toBe('C');
    });

    it('should return A for score 99 (just below AA threshold)', () => {
      expect(calculateGrade(99)).toBe('A');
    });
  });

  describe('custom thresholds', () => {
    const customThresholds: GradeThresholds = { aa: 95, a: 85, b: 70 };

    it('should return AA for score >= custom aa threshold', () => {
      expect(calculateGrade(95, customThresholds)).toBe('AA');
      expect(calculateGrade(100, customThresholds)).toBe('AA');
    });

    it('should return A for score >= custom a threshold', () => {
      expect(calculateGrade(85, customThresholds)).toBe('A');
      expect(calculateGrade(94, customThresholds)).toBe('A');
    });

    it('should return B for score >= custom b threshold', () => {
      expect(calculateGrade(70, customThresholds)).toBe('B');
      expect(calculateGrade(84, customThresholds)).toBe('B');
    });

    it('should return C for score below custom b threshold', () => {
      expect(calculateGrade(69, customThresholds)).toBe('C');
    });
  });

  describe('edge cases', () => {
    it('should return C for score 0', () => {
      expect(calculateGrade(0)).toBe('C');
    });

    it('should return C for negative score', () => {
      expect(calculateGrade(-1)).toBe('C');
      expect(calculateGrade(-100)).toBe('C');
    });

    it('should return AA for score above 100', () => {
      expect(calculateGrade(105)).toBe('AA');
    });
  });
});

describe('calculateResult', () => {
  describe('basic pass/fail', () => {
    it('should return PASS when score >= passingScore', () => {
      expect(calculateResult(80, 80)).toBe('PASS');
      expect(calculateResult(100, 80)).toBe('PASS');
      expect(calculateResult(90, 80)).toBe('PASS');
    });

    it('should return FAIL when score < passingScore', () => {
      expect(calculateResult(79, 80)).toBe('FAIL');
      expect(calculateResult(0, 80)).toBe('FAIL');
      expect(calculateResult(50, 80)).toBe('FAIL');
    });
  });

  describe('boundary values', () => {
    it('should return PASS when score equals exactly passingScore', () => {
      expect(calculateResult(80, 80)).toBe('PASS');
    });

    it('should return FAIL when score is one below passingScore', () => {
      expect(calculateResult(79, 80)).toBe('FAIL');
    });
  });

  describe('null score', () => {
    it('should return FAIL when score is null', () => {
      expect(calculateResult(null, 80)).toBe('FAIL');
      expect(calculateResult(null, 0)).toBe('FAIL');
    });
  });

  describe('various passing scores', () => {
    it('should work with passingScore of 0', () => {
      expect(calculateResult(0, 0)).toBe('PASS');
      expect(calculateResult(-1, 0)).toBe('FAIL');
    });

    it('should work with passingScore of 100', () => {
      expect(calculateResult(100, 100)).toBe('PASS');
      expect(calculateResult(99, 100)).toBe('FAIL');
    });
  });
});

describe('calculateInspectionGrade', () => {
  describe('inspection thresholds (AA=100, A=95, B=85)', () => {
    it('should return AA for 100% match rate', () => {
      expect(calculateInspectionGrade(100)).toBe('AA');
    });

    it('should return A for 95% match rate', () => {
      expect(calculateInspectionGrade(95)).toBe('A');
    });

    it('should return B for 85% match rate', () => {
      expect(calculateInspectionGrade(85)).toBe('B');
    });

    it('should return C for 84% match rate', () => {
      expect(calculateInspectionGrade(84)).toBe('C');
    });
  });

  describe('boundary values', () => {
    it('should return A for exactly 95% (A threshold)', () => {
      expect(calculateInspectionGrade(95)).toBe('A');
    });

    it('should return B for 94% (just below A threshold)', () => {
      expect(calculateInspectionGrade(94)).toBe('B');
    });

    it('should return B for exactly 85% (B threshold)', () => {
      expect(calculateInspectionGrade(85)).toBe('B');
    });

    it('should return C for 84% (just below B threshold)', () => {
      expect(calculateInspectionGrade(84)).toBe('C');
    });

    it('should return A for 99% (just below AA threshold)', () => {
      expect(calculateInspectionGrade(99)).toBe('A');
    });
  });

  describe('edge cases', () => {
    it('should return C for 0% match rate', () => {
      expect(calculateInspectionGrade(0)).toBe('C');
    });
  });
});

describe('calculateGradeWithResult', () => {
  describe('grade + result combined', () => {
    it('should return AA grade with PASS result for score 100', () => {
      const result = calculateGradeWithResult(100);
      expect(result.grade).toBe('AA');
      expect(result.result).toBe('PASS');
    });

    it('should return A grade with PASS result for score 95', () => {
      const result = calculateGradeWithResult(95);
      expect(result.grade).toBe('A');
      expect(result.result).toBe('PASS');
    });

    it('should return B grade with PASS result for score 85', () => {
      const result = calculateGradeWithResult(85);
      expect(result.grade).toBe('B');
      expect(result.result).toBe('PASS');
    });

    it('should return C grade with FAIL result for score 79', () => {
      const result = calculateGradeWithResult(79);
      expect(result.grade).toBe('C');
      expect(result.result).toBe('FAIL');
    });
  });

  describe('boundary: B/C grade boundary determines PASS/FAIL', () => {
    it('should return B/PASS for score 80 (exact B threshold)', () => {
      const result = calculateGradeWithResult(80);
      expect(result.grade).toBe('B');
      expect(result.result).toBe('PASS');
    });

    it('should return C/FAIL for score 79 (just below B threshold)', () => {
      const result = calculateGradeWithResult(79);
      expect(result.grade).toBe('C');
      expect(result.result).toBe('FAIL');
    });
  });

  describe('with custom thresholds', () => {
    const customThresholds: GradeThresholds = { aa: 95, a: 85, b: 70 };

    it('should return AA/PASS with custom thresholds', () => {
      const result = calculateGradeWithResult(95, customThresholds);
      expect(result.grade).toBe('AA');
      expect(result.result).toBe('PASS');
    });

    it('should return C/FAIL with custom thresholds when below B', () => {
      const result = calculateGradeWithResult(69, customThresholds);
      expect(result.grade).toBe('C');
      expect(result.result).toBe('FAIL');
    });

    it('should return B/PASS at exact custom B threshold', () => {
      const result = calculateGradeWithResult(70, customThresholds);
      expect(result.grade).toBe('B');
      expect(result.result).toBe('PASS');
    });
  });

  describe('edge cases', () => {
    it('should return C/FAIL for score 0', () => {
      const result = calculateGradeWithResult(0);
      expect(result.grade).toBe('C');
      expect(result.result).toBe('FAIL');
    });

    it('should return C/FAIL for negative score', () => {
      const result = calculateGradeWithResult(-10);
      expect(result.grade).toBe('C');
      expect(result.result).toBe('FAIL');
    });
  });
});

describe('programThresholds', () => {
  it('should convert program fields to GradeThresholds object', () => {
    const thresholds = programThresholds(95, 90, 80);

    expect(thresholds).toEqual({ aa: 95, a: 90, b: 80 });
  });

  it('should work with default-like values', () => {
    const thresholds = programThresholds(100, 90, 80);

    expect(thresholds).toEqual(DEFAULT_GRADE_THRESHOLDS);
  });

  it('should work with inspection-like values', () => {
    const thresholds = programThresholds(100, 95, 85);

    expect(thresholds).toEqual(INSPECTION_GRADE_THRESHOLDS);
  });

  it('should work with custom values', () => {
    const thresholds = programThresholds(98, 88, 75);

    expect(thresholds.aa).toBe(98);
    expect(thresholds.a).toBe(88);
    expect(thresholds.b).toBe(75);
  });

  it('should be usable with calculateGrade', () => {
    const thresholds = programThresholds(95, 85, 70);

    expect(calculateGrade(95, thresholds)).toBe('AA');
    expect(calculateGrade(85, thresholds)).toBe('A');
    expect(calculateGrade(70, thresholds)).toBe('B');
    expect(calculateGrade(69, thresholds)).toBe('C');
  });
});

describe('constants', () => {
  it('DEFAULT_GRADE_THRESHOLDS should have correct values', () => {
    expect(DEFAULT_GRADE_THRESHOLDS).toEqual({ aa: 100, a: 90, b: 80 });
  });

  it('INSPECTION_GRADE_THRESHOLDS should have correct values', () => {
    expect(INSPECTION_GRADE_THRESHOLDS).toEqual({ aa: 100, a: 95, b: 85 });
  });
});
