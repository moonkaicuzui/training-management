// ============================================================
// Q-TRAIN Humidity Monitor API
// 온도-습도 모니터링 장치 점검 관리
// ============================================================

import * as hmMonitorService from '../hmMonitorService';

import type {
  HMDevice,
  HMInspection,
  HMCheckResult,
  HMFilters,
  HMDashboardKPI,
  HMTrendItem,
  HMBuildingStats,
  HMRepeatedIssue,
} from '@/types/humidityMonitor';

import { apiCache } from './common';

// ========== Cache Invalidation ==========

export function invalidateHMMonitorCache(): void {
  apiCache.invalidate('hmMonitor');
}

// ========== Device API ==========

export async function getDevices(): Promise<HMDevice[]> {
  return hmMonitorService.getDevices();
}

export async function createDevice(
  data: Omit<HMDevice, 'id' | 'createdAt' | 'updatedAt'>,
): Promise<HMDevice> {
  const device = await hmMonitorService.createDevice(data);
  invalidateHMMonitorCache();
  return device;
}

export async function updateDevice(
  id: string,
  data: Partial<HMDevice>,
): Promise<void> {
  await hmMonitorService.updateDevice(id, data);
  invalidateHMMonitorCache();
}

export async function deleteDevice(id: string): Promise<void> {
  await hmMonitorService.deleteDevice(id);
  invalidateHMMonitorCache();
}

export async function seedDevices(
  devices: Omit<HMDevice, 'id' | 'createdAt' | 'updatedAt'>[],
): Promise<number> {
  const count = await hmMonitorService.seedDevices(devices);
  invalidateHMMonitorCache();
  return count;
}

// ========== Inspection API ==========

export async function getInspections(filters?: HMFilters): Promise<HMInspection[]> {
  return hmMonitorService.getInspections(filters);
}

export async function getInspectionById(id: string): Promise<HMInspection | null> {
  return hmMonitorService.getInspectionById(id);
}

export async function createInspection(
  inspectionDate: string,
  inspector: string,
  results: HMCheckResult[],
): Promise<HMInspection> {
  const inspection = await hmMonitorService.createInspection(inspectionDate, inspector, results);
  invalidateHMMonitorCache();
  return inspection;
}

export async function updateInspection(
  id: string,
  results: HMCheckResult[],
  inspector?: string,
): Promise<void> {
  await hmMonitorService.updateInspection(id, results, inspector);
  invalidateHMMonitorCache();
}

export async function deleteInspection(id: string): Promise<void> {
  await hmMonitorService.deleteInspection(id);
  invalidateHMMonitorCache();
}

// ========== Analytics API ==========

export async function getDashboardKPI(filters?: HMFilters): Promise<HMDashboardKPI> {
  return hmMonitorService.getDashboardKPI(filters);
}

export async function getTrend(count?: number): Promise<HMTrendItem[]> {
  return hmMonitorService.getTrend(count);
}

export async function getBuildingComparison(): Promise<HMBuildingStats[]> {
  return hmMonitorService.getBuildingComparison();
}

export async function getRepeatedIssues(minConsecutive?: number): Promise<HMRepeatedIssue[]> {
  return hmMonitorService.getRepeatedIssues(minConsecutive);
}
