/**
 * useKPIAnomalies Hook
 *
 * Custom hook that loads KPI snapshots from Firestore and runs
 * anomaly detection against the current KPI values.
 *
 * Uses a 6-month historical window for computing the baseline
 * moving average and standard deviation.
 */

import { useState, useEffect, useRef } from 'react';
import { getKPISnapshots } from '@/services/kpiSnapshotService';
import { detectAnomalies, type KPIAnomaly } from '@/utils/kpiAnomalyDetector';

/** Number of months of historical snapshots to use for anomaly detection */
const HISTORY_MONTHS = 6;

interface UseKPIAnomaliesReturn {
  /** Detected anomalies sorted by severity */
  anomalies: KPIAnomaly[];
  /** Whether snapshots are currently being loaded */
  isLoading: boolean;
  /** Error message if snapshot loading failed */
  error: string | null;
}

/**
 * Load KPI snapshots and detect anomalies against current KPI values.
 *
 * @param currentKPIs - Current KPI values as Record<string, number>.
 *   Pass null to skip detection (e.g., while current KPIs are still loading).
 * @returns Object with anomalies array, loading state, and error state
 */
export function useKPIAnomalies(
  currentKPIs: Record<string, number> | null
): UseKPIAnomaliesReturn {
  const [anomalies, setAnomalies] = useState<KPIAnomaly[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef(false);

  useEffect(() => {
    // Reset abort flag on each run
    abortRef.current = false;

    // Skip if current KPIs are not yet available
    if (!currentKPIs) {
      setAnomalies([]);
      setIsLoading(false);
      setError(null);
      return;
    }

    const loadAndDetect = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const snapshots = await getKPISnapshots(HISTORY_MONTHS);

        // Don't update state if the effect was cleaned up
        if (abortRef.current) return;

        const detected = detectAnomalies(snapshots, currentKPIs);
        setAnomalies(detected);
      } catch (err) {
        if (abortRef.current) return;

        const message = err instanceof Error ? err.message : 'Failed to load KPI snapshots';
        setError(message);
        setAnomalies([]);
      } finally {
        if (!abortRef.current) {
          setIsLoading(false);
        }
      }
    };

    loadAndDetect();

    return () => {
      abortRef.current = true;
    };
  }, [currentKPIs]);

  return { anomalies, isLoading, error };
}
