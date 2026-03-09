/**
 * Training Effectiveness Utils Tests
 * 교육 효과성 측정 유틸리티 함수 테스트
 *
 * [TAE] Test Automation Engineer
 */

import { describe, it, expect } from 'vitest';
import {
  calculateEffectiveness,
  getEffectivenessRating,
  summarizeProgramEffectiveness,
  summarizeByProgram,
  toChartData,
  getRatingColor,
  getRatingBadgeVariant,
} from './trainingEffectiveness';
import type { EffectivenessResult, ProgramEffectivenessSummary } from './trainingEffectiveness';

// ========== Test Data Factories ==========

const createEffectivenessResult = (
  overrides: Partial<EffectivenessResult> = {}
): EffectivenessResult => ({
  employeeId: 'EMP001',
  employeeName: 'Test Employee',
  programCode: 'PRG001',
  programName: 'Test Program',
  beforeFailRate: 20,
  afterFailRate: 10,
  improvementPoints: 10,
  improvementPercent: 50,
  rating: 'moderate',
  enrolledAt: '2024-01-15',
  ...overrides,
});

// ========== Tests ==========

describe('calculateEffectiveness', () => {
  it('불합격률 감소를 올바르게 계산한다 (개선)', () => {
    const result = calculateEffectiveness(20, 10);

    expect(result.improvementPoints).toBe(10);
    expect(result.improvementPercent).toBe(50);
    expect(result.rating).toBe('moderate');
  });

  it('큰 폭의 개선을 significant로 분류한다', () => {
    const result = calculateEffectiveness(30, 10);

    expect(result.improvementPoints).toBe(20);
    // (20/30)*100 = 66.67% → significant
    expect(result.improvementPercent).toBeCloseTo(66.67, 1);
    expect(result.rating).toBe('significant');
  });

  it('소폭 개선을 minimal로 분류한다', () => {
    const result = calculateEffectiveness(20, 18);

    expect(result.improvementPoints).toBe(2);
    // (2/20)*100 = 10% → minimal
    expect(result.improvementPercent).toBe(10);
    expect(result.rating).toBe('minimal');
  });

  it('개선 없음(동일)을 none으로 분류한다', () => {
    const result = calculateEffectiveness(20, 20);

    expect(result.improvementPoints).toBe(0);
    expect(result.improvementPercent).toBe(0);
    expect(result.rating).toBe('none');
  });

  it('악화(불합격률 증가)를 none으로 분류한다', () => {
    const result = calculateEffectiveness(10, 15);

    expect(result.improvementPoints).toBe(-5);
    expect(result.improvementPercent).toBe(-50);
    expect(result.rating).toBe('none');
  });

  it('beforeFailRate가 0일 때 division by zero를 방지한다', () => {
    const result = calculateEffectiveness(0, 5);

    expect(result.improvementPoints).toBe(-5);
    expect(result.improvementPercent).toBe(0);
    expect(result.rating).toBe('none');
  });

  it('beforeFailRate가 0이고 afterFailRate도 0이면 none', () => {
    const result = calculateEffectiveness(0, 0);

    expect(result.improvementPoints).toBe(0);
    expect(result.improvementPercent).toBe(0);
    expect(result.rating).toBe('none');
  });

  it('소수점 결과를 반올림한다', () => {
    const result = calculateEffectiveness(33, 22);

    // improvementPoints = 11, improvementPercent = (11/33)*100 = 33.33...
    expect(result.improvementPoints).toBe(11);
    expect(result.improvementPercent).toBeCloseTo(33.33, 1);
  });

  it('100% 불합격률에서 0%로 개선된 경우', () => {
    const result = calculateEffectiveness(100, 0);

    expect(result.improvementPoints).toBe(100);
    expect(result.improvementPercent).toBe(100);
    expect(result.rating).toBe('significant');
  });
});

describe('getEffectivenessRating', () => {
  it('>50%이면 significant를 반환한다', () => {
    expect(getEffectivenessRating(51)).toBe('significant');
    expect(getEffectivenessRating(100)).toBe('significant');
    expect(getEffectivenessRating(75)).toBe('significant');
  });

  it('20-50%이면 moderate를 반환한다', () => {
    expect(getEffectivenessRating(20)).toBe('moderate');
    expect(getEffectivenessRating(35)).toBe('moderate');
    expect(getEffectivenessRating(50)).toBe('moderate');
  });

  it('1-20% 미만이면 minimal을 반환한다', () => {
    expect(getEffectivenessRating(1)).toBe('minimal');
    expect(getEffectivenessRating(10)).toBe('minimal');
    expect(getEffectivenessRating(19.99)).toBe('minimal');
  });

  it('0% 이하이면 none을 반환한다', () => {
    expect(getEffectivenessRating(0)).toBe('none');
    expect(getEffectivenessRating(-10)).toBe('none');
    expect(getEffectivenessRating(-100)).toBe('none');
  });

  it('경계값 50은 moderate이다 (>50이 significant)', () => {
    expect(getEffectivenessRating(50)).toBe('moderate');
  });

  it('경계값 0.01은 minimal이다', () => {
    expect(getEffectivenessRating(0.01)).toBe('minimal');
  });
});

describe('summarizeProgramEffectiveness', () => {
  it('빈 배열이면 null을 반환한다', () => {
    const result = summarizeProgramEffectiveness([]);
    expect(result).toBeNull();
  });

  it('단일 결과에 대해 올바른 요약을 생성한다', () => {
    const results = [
      createEffectivenessResult({
        beforeFailRate: 20,
        afterFailRate: 10,
        improvementPoints: 10,
        improvementPercent: 50,
        rating: 'moderate',
      }),
    ];

    const summary = summarizeProgramEffectiveness(results);

    expect(summary).not.toBeNull();
    expect(summary!.programCode).toBe('PRG001');
    expect(summary!.programName).toBe('Test Program');
    expect(summary!.employeeCount).toBe(1);
    expect(summary!.avgBeforeFailRate).toBe(20);
    expect(summary!.avgAfterFailRate).toBe(10);
    expect(summary!.avgImprovementPoints).toBe(10);
    expect(summary!.avgImprovementPercent).toBe(50);
    expect(summary!.rating).toBe('moderate');
  });

  it('여러 결과에 대해 평균을 올바르게 계산한다', () => {
    const results = [
      createEffectivenessResult({
        employeeId: 'EMP001',
        beforeFailRate: 30,
        afterFailRate: 10,
        improvementPoints: 20,
        improvementPercent: 66.67,
        rating: 'significant',
      }),
      createEffectivenessResult({
        employeeId: 'EMP002',
        beforeFailRate: 20,
        afterFailRate: 15,
        improvementPoints: 5,
        improvementPercent: 25,
        rating: 'moderate',
      }),
    ];

    const summary = summarizeProgramEffectiveness(results);

    expect(summary).not.toBeNull();
    expect(summary!.employeeCount).toBe(2);
    expect(summary!.avgBeforeFailRate).toBe(25); // (30+20)/2
    expect(summary!.avgAfterFailRate).toBe(12.5); // (10+15)/2
    expect(summary!.avgImprovementPoints).toBe(12.5); // (20+5)/2
  });

  it('ratingDistribution을 올바르게 계산한다', () => {
    const results = [
      createEffectivenessResult({ rating: 'significant' }),
      createEffectivenessResult({ employeeId: 'EMP002', rating: 'significant' }),
      createEffectivenessResult({ employeeId: 'EMP003', rating: 'moderate' }),
      createEffectivenessResult({ employeeId: 'EMP004', rating: 'none' }),
    ];

    const summary = summarizeProgramEffectiveness(results);

    expect(summary!.ratingDistribution).toEqual({
      significant: 2,
      moderate: 1,
      minimal: 0,
      none: 1,
    });
  });
});

describe('summarizeByProgram', () => {
  it('빈 배열이면 빈 배열을 반환한다', () => {
    const result = summarizeByProgram([]);
    expect(result).toEqual([]);
  });

  it('프로그램별로 그룹화하여 요약한다', () => {
    const results = [
      createEffectivenessResult({
        programCode: 'PRG001',
        programName: 'Program A',
        improvementPercent: 60,
      }),
      createEffectivenessResult({
        employeeId: 'EMP002',
        programCode: 'PRG001',
        programName: 'Program A',
        improvementPercent: 40,
      }),
      createEffectivenessResult({
        programCode: 'PRG002',
        programName: 'Program B',
        improvementPercent: 30,
      }),
    ];

    const summaries = summarizeByProgram(results);

    expect(summaries).toHaveLength(2);
    // avgImprovementPercent 내림차순 정렬: PRG001(50%) > PRG002(30%)
    expect(summaries[0].programCode).toBe('PRG001');
    expect(summaries[0].employeeCount).toBe(2);
    expect(summaries[1].programCode).toBe('PRG002');
    expect(summaries[1].employeeCount).toBe(1);
  });

  it('avgImprovementPercent 내림차순으로 정렬한다', () => {
    const results = [
      createEffectivenessResult({
        programCode: 'PRG_LOW',
        programName: 'Low Program',
        improvementPercent: 10,
      }),
      createEffectivenessResult({
        programCode: 'PRG_HIGH',
        programName: 'High Program',
        improvementPercent: 80,
      }),
    ];

    const summaries = summarizeByProgram(results);

    expect(summaries[0].programCode).toBe('PRG_HIGH');
    expect(summaries[1].programCode).toBe('PRG_LOW');
  });
});

describe('toChartData', () => {
  it('ProgramEffectivenessSummary를 차트 데이터로 변환한다', () => {
    const summaries: ProgramEffectivenessSummary[] = [
      {
        programCode: 'PRG001',
        programName: 'Program A',
        employeeCount: 5,
        avgBeforeFailRate: 25,
        avgAfterFailRate: 10,
        avgImprovementPoints: 15,
        avgImprovementPercent: 60,
        rating: 'significant',
        ratingDistribution: { significant: 3, moderate: 2, minimal: 0, none: 0 },
      },
    ];

    const chartData = toChartData(summaries);

    expect(chartData).toHaveLength(1);
    expect(chartData[0]).toEqual({
      programName: 'Program A',
      programCode: 'PRG001',
      before: 25,
      after: 10,
      improvement: 15,
    });
  });

  it('빈 배열이면 빈 배열을 반환한다', () => {
    expect(toChartData([])).toEqual([]);
  });
});

describe('getRatingColor', () => {
  it('significant는 green 색상을 반환한다', () => {
    expect(getRatingColor('significant')).toBe('text-green-600');
  });

  it('moderate는 blue 색상을 반환한다', () => {
    expect(getRatingColor('moderate')).toBe('text-blue-600');
  });

  it('minimal은 yellow 색상을 반환한다', () => {
    expect(getRatingColor('minimal')).toBe('text-yellow-600');
  });

  it('none은 red 색상을 반환한다', () => {
    expect(getRatingColor('none')).toBe('text-red-600');
  });
});

describe('getRatingBadgeVariant', () => {
  it('significant는 default 배지를 반환한다', () => {
    expect(getRatingBadgeVariant('significant')).toBe('default');
  });

  it('moderate는 secondary 배지를 반환한다', () => {
    expect(getRatingBadgeVariant('moderate')).toBe('secondary');
  });

  it('minimal은 outline 배지를 반환한다', () => {
    expect(getRatingBadgeVariant('minimal')).toBe('outline');
  });

  it('none은 destructive 배지를 반환한다', () => {
    expect(getRatingBadgeVariant('none')).toBe('destructive');
  });
});
