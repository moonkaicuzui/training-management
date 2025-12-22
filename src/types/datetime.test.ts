import { describe, it, expect } from 'vitest';
import {
  isISODate,
  isISODateTime,
  isTimeString,
  isYearMonth,
  createISODate,
  createISODateTime,
  addMonths,
  isExpiring,
  isExpired,
  getDaysUntilExpiry,
} from './datetime';

describe('DateTime Types', () => {
  describe('isISODate', () => {
    it('should return true for valid ISO dates', () => {
      expect(isISODate('2024-01-15')).toBe(true);
      expect(isISODate('2023-12-31')).toBe(true);
    });

    it('should return false for invalid formats', () => {
      expect(isISODate('2024/01/15')).toBe(false);
      expect(isISODate('01-15-2024')).toBe(false);
      expect(isISODate('invalid')).toBe(false);
      expect(isISODate('')).toBe(false);
    });
  });

  describe('isISODateTime', () => {
    it('should return true for valid ISO datetimes', () => {
      expect(isISODateTime('2024-01-15T10:30:00')).toBe(true);
      expect(isISODateTime('2024-01-15T10:30:00Z')).toBe(true);
      expect(isISODateTime('2024-01-15T10:30:00.000Z')).toBe(true);
    });

    it('should return false for invalid formats', () => {
      expect(isISODateTime('2024-01-15')).toBe(false);
      expect(isISODateTime('invalid')).toBe(false);
    });
  });

  describe('isTimeString', () => {
    it('should return true for valid time strings', () => {
      expect(isTimeString('10:30')).toBe(true);
      expect(isTimeString('23:59')).toBe(true);
      expect(isTimeString('00:00')).toBe(true);
    });

    it('should return false for invalid formats', () => {
      expect(isTimeString('25:00')).toBe(false);
      expect(isTimeString('10:60')).toBe(false);
      expect(isTimeString('10:30:00')).toBe(false);
    });
  });

  describe('isYearMonth', () => {
    it('should return true for valid year-month', () => {
      expect(isYearMonth('2024-01')).toBe(true);
      expect(isYearMonth('2023-12')).toBe(true);
    });

    it('should return false for invalid formats', () => {
      expect(isYearMonth('2024-13')).toBe(false);
      expect(isYearMonth('2024-1')).toBe(false);
    });
  });

  describe('createISODate', () => {
    it('should return ISODate for valid input', () => {
      expect(createISODate('2024-01-15')).toBe('2024-01-15');
    });

    it('should return null for invalid input', () => {
      expect(createISODate('invalid')).toBeNull();
    });
  });

  describe('createISODateTime', () => {
    it('should return ISODateTime for valid input', () => {
      expect(createISODateTime('2024-01-15T10:30:00')).toBe('2024-01-15T10:30:00');
    });

    it('should return null for invalid input', () => {
      expect(createISODateTime('invalid')).toBeNull();
    });
  });

  describe('addMonths', () => {
    it('should add months to date correctly', () => {
      const result = addMonths('2024-01-15' as any, 3);
      expect(result).toBe('2024-04-15');
    });

    it('should handle year rollover', () => {
      const result = addMonths('2024-11-15' as any, 3);
      expect(result).toBe('2025-02-15');
    });
  });

  describe('getDaysUntilExpiry', () => {
    it('should return positive days for future dates', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 10);
      const isoDate = futureDate.toISOString().split('T')[0];

      const days = getDaysUntilExpiry(isoDate as any);
      expect(days).toBeGreaterThanOrEqual(9);
      expect(days).toBeLessThanOrEqual(11);
    });

    it('should return negative days for past dates', () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 10);
      const isoDate = pastDate.toISOString().split('T')[0];

      const days = getDaysUntilExpiry(isoDate as any);
      expect(days).toBeLessThan(0);
    });
  });

  describe('isExpiring', () => {
    it('should return true for dates within threshold', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 15);
      const isoDate = futureDate.toISOString().split('T')[0];

      expect(isExpiring(isoDate as any, 30)).toBe(true);
      expect(isExpiring(isoDate as any, 10)).toBe(false);
    });
  });

  describe('isExpired', () => {
    it('should return true for past dates', () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 1);
      const isoDate = pastDate.toISOString().split('T')[0];

      expect(isExpired(isoDate as any)).toBe(true);
    });

    it('should return false for future dates', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 10);
      const isoDate = futureDate.toISOString().split('T')[0];

      expect(isExpired(isoDate as any)).toBe(false);
    });
  });
});
