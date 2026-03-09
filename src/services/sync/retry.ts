import { logger } from '@/utils/logger';

const MAX_RETRIES = 3;
const BASE_DELAY_MS = 1000;
const MAX_DELAY_MS = 10000;

function calculateBackoffDelay(attempt: number): number {
  const exponentialDelay = BASE_DELAY_MS * Math.pow(2, attempt);
  const cappedDelay = Math.min(exponentialDelay, MAX_DELAY_MS);
  const jitter = cappedDelay * Math.random() * 0.25;
  return cappedDelay + jitter;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  context: string,
  maxRetries: number = MAX_RETRIES
): Promise<T> {
  let lastError: Error | undefined;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (attempt < maxRetries) {
        const delay = calculateBackoffDelay(attempt);
        logger.warn(
          `[SyncService] ${context} failed (attempt ${attempt + 1}/${maxRetries + 1}). ` +
            `Retrying in ${Math.round(delay)}ms...`,
          { error: lastError.message }
        );
        await sleep(delay);
      } else {
        logger.error(
          `[SyncService] ${context} failed after ${maxRetries + 1} attempts.`,
          { error: lastError.message }
        );
      }
    }
  }

  throw lastError!;
}
