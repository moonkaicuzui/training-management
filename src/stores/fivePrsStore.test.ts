/**
 * 5PRS Store Tests
 * 5PRS 검사 데이터 스토어 기능 테스트
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import type {
  MonthOption,
  ProcessedData,
} from '@/types/fivePrs';

// ========== Mock Setup ==========

const mockFetchMonths = vi.fn();
const mockFetchMonthData = vi.fn();
const mockGenerateAiBriefing = vi.fn();
const mockProcessRawData = vi.fn();
const mockExtractBriefingPayload = vi.fn();

vi.mock('@/services/fivePrsService', () => ({
  fetchMonths: (...args: unknown[]) => mockFetchMonths(...args),
  fetchMonthData: (...args: unknown[]) => mockFetchMonthData(...args),
  generateAiBriefing: (...args: unknown[]) => mockGenerateAiBriefing(...args),
}));

vi.mock('@/utils/fivePrsDataProcessor', () => ({
  processRawData: (...args: unknown[]) => mockProcessRawData(...args),
  extractBriefingPayload: (...args: unknown[]) => mockExtractBriefingPayload(...args),
}));

import { useFivePrsStore } from './fivePrsStore';

// ========== Test Data ==========

const mockMonths: MonthOption[] = [
  { year_month: '2024-01', label: 'January 2024' },
  { year_month: '2023-12', label: 'December 2023' },
];

const mockProcessed: ProcessedData = {
  buildings: [],
  summary: { totalInspections: 50, totalFails: 5, failRate: 10 },
} as unknown as ProcessedData;

// ========== Tests ==========

describe('FivePrsStore', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useFivePrsStore.setState({
      months: [],
      selectedMonth: '',
      rawData: [],
      processedData: null,
      aiBriefing: null,
      isLoadingMonths: false,
      isLoadingData: false,
      isLoadingBriefing: false,
      error: null,
    });
  });

  // ========== fetchMonths ==========

  describe('fetchMonths', () => {
    it('5PRS 월 목록을 가져온다', async () => {
      mockFetchMonths.mockResolvedValueOnce({ months: mockMonths });

      await useFivePrsStore.getState().fetchMonths();

      const state = useFivePrsStore.getState();
      expect(state.months).toHaveLength(2);
      expect(state.selectedMonth).toBe('2024-01');
      expect(state.isLoadingMonths).toBe(false);
      expect(state.error).toBeNull();
    });

    it('이미 selectedMonth가 있으면 변경하지 않는다', async () => {
      useFivePrsStore.setState({ selectedMonth: '2023-12' });
      mockFetchMonths.mockResolvedValueOnce({ months: mockMonths });

      await useFivePrsStore.getState().fetchMonths();

      expect(useFivePrsStore.getState().selectedMonth).toBe('2023-12');
    });

    it('월 목록 조회 실패 시 에러를 저장한다', async () => {
      mockFetchMonths.mockRejectedValueOnce(new Error('Network error'));

      await useFivePrsStore.getState().fetchMonths();

      expect(useFivePrsStore.getState().error).toBe('Network error');
      expect(useFivePrsStore.getState().isLoadingMonths).toBe(false);
    });

    it('Error가 아닌 객체가 throw되면 기본 메시지를 사용한다', async () => {
      mockFetchMonths.mockRejectedValueOnce('string error');

      await useFivePrsStore.getState().fetchMonths();

      expect(useFivePrsStore.getState().error).toBe('Failed to fetch months');
    });
  });

  // ========== fetchData ==========

  describe('fetchData', () => {
    it('5PRS 데이터를 가져오고 처리한다', async () => {
      useFivePrsStore.setState({ selectedMonth: '2024-01' });
      const rawData = [{ building: 'A', result: 'FAIL' }];
      mockFetchMonthData.mockResolvedValueOnce({ data: rawData });
      mockProcessRawData.mockReturnValueOnce(mockProcessed);

      await useFivePrsStore.getState().fetchData();

      const state = useFivePrsStore.getState();
      expect(state.rawData).toEqual(rawData);
      expect(state.processedData).toEqual(mockProcessed);
      expect(state.isLoadingData).toBe(false);
      expect(state.aiBriefing).toBeNull();
    });

    it('yearMonth 파라미터로 selectedMonth를 업데이트한다', async () => {
      useFivePrsStore.setState({ selectedMonth: '2023-12' });
      mockFetchMonthData.mockResolvedValueOnce({ data: [] });
      mockProcessRawData.mockReturnValueOnce(mockProcessed);

      await useFivePrsStore.getState().fetchData('2024-01');

      expect(useFivePrsStore.getState().selectedMonth).toBe('2024-01');
    });

    it('selectedMonth가 없으면 아무것도 하지 않는다', async () => {
      await useFivePrsStore.getState().fetchData();

      expect(mockFetchMonthData).not.toHaveBeenCalled();
    });

    it('데이터 조회 실패 시 에러를 저장한다', async () => {
      useFivePrsStore.setState({ selectedMonth: '2024-01' });
      mockFetchMonthData.mockRejectedValueOnce(new Error('Data error'));

      await useFivePrsStore.getState().fetchData();

      expect(useFivePrsStore.getState().error).toBe('Data error');
      expect(useFivePrsStore.getState().isLoadingData).toBe(false);
    });

    it('Error가 아닌 객체가 throw되면 기본 메시지를 사용한다', async () => {
      useFivePrsStore.setState({ selectedMonth: '2024-01' });
      mockFetchMonthData.mockRejectedValueOnce(42);

      await useFivePrsStore.getState().fetchData();

      expect(useFivePrsStore.getState().error).toBe('Failed to fetch data');
    });
  });

  // ========== generateBriefing ==========

  describe('generateBriefing', () => {
    it('AI 브리핑을 생성한다', async () => {
      useFivePrsStore.setState({
        processedData: mockProcessed,
        selectedMonth: '2024-01',
      });
      mockExtractBriefingPayload.mockReturnValueOnce({ data: 'payload' });
      mockGenerateAiBriefing.mockResolvedValueOnce({ briefing: 'AI analysis...' });

      await useFivePrsStore.getState().generateBriefing('ko');

      const state = useFivePrsStore.getState();
      expect(state.aiBriefing).toBe('AI analysis...');
      expect(state.isLoadingBriefing).toBe(false);
      expect(mockExtractBriefingPayload).toHaveBeenCalledWith(mockProcessed, '2024-01', 'ko');
    });

    it('processedData가 없으면 아무것도 하지 않는다', async () => {
      await useFivePrsStore.getState().generateBriefing('ko');

      expect(mockGenerateAiBriefing).not.toHaveBeenCalled();
    });

    it('브리핑 생성 실패 시 에러를 저장한다', async () => {
      useFivePrsStore.setState({
        processedData: mockProcessed,
        selectedMonth: '2024-01',
      });
      mockExtractBriefingPayload.mockReturnValueOnce({});
      mockGenerateAiBriefing.mockRejectedValueOnce(new Error('AI error'));

      await useFivePrsStore.getState().generateBriefing('ko');

      expect(useFivePrsStore.getState().error).toBe('AI error');
      expect(useFivePrsStore.getState().isLoadingBriefing).toBe(false);
    });

    it('Error가 아닌 객체가 throw되면 기본 메시지를 사용한다', async () => {
      useFivePrsStore.setState({
        processedData: mockProcessed,
        selectedMonth: '2024-01',
      });
      mockExtractBriefingPayload.mockReturnValueOnce({});
      mockGenerateAiBriefing.mockRejectedValueOnce('error');

      await useFivePrsStore.getState().generateBriefing('ko');

      expect(useFivePrsStore.getState().error).toBe('AI briefing failed');
    });
  });

  // ========== UI Actions ==========

  describe('setSelectedMonth', () => {
    it('선택된 월을 변경한다', () => {
      useFivePrsStore.getState().setSelectedMonth('2024-02');

      expect(useFivePrsStore.getState().selectedMonth).toBe('2024-02');
    });
  });

  describe('clearError', () => {
    it('에러를 초기화한다', () => {
      useFivePrsStore.setState({ error: '이전 에러' });

      useFivePrsStore.getState().clearError();

      expect(useFivePrsStore.getState().error).toBeNull();
    });
  });
});
