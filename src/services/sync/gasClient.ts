import { withRetry } from './retry';

export async function callGAS(action: string, payload: Record<string, unknown> = {}): Promise<unknown> {
  return withRetry(
    async () => {
      const response = await fetch('/api/sync/collection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          ...payload,
        }),
      });

      if (!response.ok) {
        throw new Error(`Sync request failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Sync failed');
      }

      return data.data;
    },
    `Sync action "${action}"`
  );
}
