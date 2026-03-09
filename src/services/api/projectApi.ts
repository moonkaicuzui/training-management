// ============================================================
// Q-TRAIN Project API
// Project Settings, ROI / Training Costs
// ============================================================

import * as projectService from '../projectService';
import * as roiService from '../roiService';

import type { ProjectSettings } from '@/types/project';

// ========== Project Settings API ==========

export async function getProjectSettings(projectId: string): Promise<ProjectSettings> {
  return projectService.getProjectSettings(projectId);
}

export async function updateProjectSettings(
  projectId: string,
  data: Partial<Pick<ProjectSettings, 'projectName' | 'projectDescription' | 'defaultView' | 'notifications'>>
): Promise<void> {
  return projectService.updateProjectSettings(projectId, data);
}

// ========== ROI / Training Costs API ==========

export async function getTrainingCosts(year?: number) {
  return roiService.getTrainingCosts(year);
}

export async function saveTrainingCost(data: Parameters<typeof roiService.saveTrainingCost>[0]) {
  return roiService.saveTrainingCost(data);
}
