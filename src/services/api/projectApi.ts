// ============================================================
// Q-TRAIN Project API
// Project Settings, ROI / Training Costs
// ============================================================

import * as projectService from '../projectService';
import * as roiService from '../roiService';

import type { ProjectSettings, ProjectMember } from '@/types/project';

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

// ========== Project Member Auth API ==========

export async function getProjectMemberByUid(uid: string): Promise<ProjectMember | null> {
  return projectService.getMemberByUid(uid);
}

export async function getProjectMemberByEmail(email: string): Promise<ProjectMember | null> {
  return projectService.getMemberByEmail(email);
}

export async function linkProjectMemberToAuth(memberId: string, uid: string): Promise<void> {
  return projectService.linkMemberToAuth(memberId, uid);
}

// ========== ROI / Training Costs API ==========

export async function getTrainingCosts(year?: number) {
  return roiService.getTrainingCosts(year);
}

export async function saveTrainingCost(data: Parameters<typeof roiService.saveTrainingCost>[0]) {
  return roiService.saveTrainingCost(data);
}
