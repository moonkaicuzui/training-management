/**
 * Logger Utility Tests
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Note: We need to mock import.meta.env before importing logger
// Since logger reads import.meta.env.DEV at module load time,
// we test the behavior by spying on console methods

describe('logger', () => {
  beforeEach(() => {
    // Spy on console methods
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'info').mockImplementation(() => {});
    vi.spyOn(console, 'debug').mockImplementation(() => {});
    vi.spyOn(console, 'group').mockImplementation(() => {});
    vi.spyOn(console, 'groupEnd').mockImplementation(() => {});
    vi.spyOn(console, 'time').mockImplementation(() => {});
    vi.spyOn(console, 'timeEnd').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('in development mode', () => {
    // Since Vitest runs in dev mode by default, we can test the dev behavior
    it('should have all logging methods defined', async () => {
      const { logger } = await import('./logger');

      expect(typeof logger.log).toBe('function');
      expect(typeof logger.warn).toBe('function');
      expect(typeof logger.error).toBe('function');
      expect(typeof logger.info).toBe('function');
      expect(typeof logger.debug).toBe('function');
      expect(typeof logger.group).toBe('function');
      expect(typeof logger.groupEnd).toBe('function');
      expect(typeof logger.time).toBe('function');
      expect(typeof logger.timeEnd).toBe('function');
    });

    it('logger.error should always log errors', async () => {
      const { logger } = await import('./logger');
      const errorMessage = 'Test error message';

      logger.error(errorMessage);

      expect(console.error).toHaveBeenCalledWith(errorMessage);
    });

    it('logger.error should log multiple arguments', async () => {
      const { logger } = await import('./logger');
      const arg1 = 'Error:';
      const arg2 = { code: 500 };

      logger.error(arg1, arg2);

      expect(console.error).toHaveBeenCalledWith(arg1, arg2);
    });
  });

  describe('Logger interface', () => {
    it('should export a default logger instance', async () => {
      const { default: defaultLogger, logger } = await import('./logger');

      expect(defaultLogger).toBe(logger);
    });

    it('should accept any type of arguments', async () => {
      const { logger } = await import('./logger');

      // These should not throw
      expect(() => logger.log('string')).not.toThrow();
      expect(() => logger.log(123)).not.toThrow();
      expect(() => logger.log({ key: 'value' })).not.toThrow();
      expect(() => logger.log(['array'])).not.toThrow();
      expect(() => logger.log(null)).not.toThrow();
      expect(() => logger.log(undefined)).not.toThrow();
    });

    it('should handle multiple arguments', async () => {
      const { logger } = await import('./logger');

      expect(() => logger.log('arg1', 'arg2', 'arg3')).not.toThrow();
      expect(() => logger.warn('warning:', { detail: 'test' })).not.toThrow();
      expect(() => logger.info('info', 1, 2, 3)).not.toThrow();
    });
  });

  describe('console.group and timing methods', () => {
    it('group should accept a label', async () => {
      const { logger } = await import('./logger');

      expect(() => logger.group('Test Group')).not.toThrow();
    });

    it('groupEnd should work without arguments', async () => {
      const { logger } = await import('./logger');

      expect(() => logger.groupEnd()).not.toThrow();
    });

    it('time should accept a label', async () => {
      const { logger } = await import('./logger');

      expect(() => logger.time('Timer Label')).not.toThrow();
    });

    it('timeEnd should accept a label', async () => {
      const { logger } = await import('./logger');

      expect(() => logger.timeEnd('Timer Label')).not.toThrow();
    });
  });
});
