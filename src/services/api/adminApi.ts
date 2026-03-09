// ============================================================
// Q-TRAIN Admin API
// Materials, Evaluations, Notifications, Audit Logs, Trainers,
// Training Plans, Audit Compliance, Certificates, Competency,
// Tech Models, Inspector Stickers
// ============================================================

import * as materialService from '../materialService';
import * as evaluationService from '../evaluationService';
import * as notificationService from '../notificationService';
import * as auditLogService from '../auditLogService';
import * as trainerService from '../trainerService';
import * as trainingPlanService from '../trainingPlanService';
import * as auditComplianceService from '../auditComplianceService';
import * as certificateService from '../certificateService';
import * as competencyService from '../competencyService';
import * as techModelService from '../techModelService';
import * as inspectorStickerService from '../inspectorStickerService';

import type { TrainingMaterial, MaterialFolder, MaterialFilters } from '@/types/material';
import type {
  TrainingEvaluation,
  EvaluationFilters,
} from '../evaluationService';
import type {
  NotificationSettingsData,
  NotificationQueryFilters,
} from '../notificationService';
import type { Notification } from '@/types/notification';
import type { AuditLogEntry, AuditLogFilters } from '@/types';
import type {
  Certificate,
  CertificateTemplate,
  CertificateFilters,
} from '../certificateService';
import type {
  Competency,
  CompetencyCategory,
  EmployeeCompetency,
  LearningPath,
  EmployeeLearningPath,
  IndividualDevelopmentPlan,
} from '@/types/curriculum';
import type {
  TechModel,
  TechReviewGuideline,
  TechModelFilters,
} from '@/types/techModel';
import type {
  InspectorSticker,
  InspectorStickerInput,
  InspectorStickerUpdate,
} from '@/types/inspectorSticker';

import {
  invalidateMaterialCache,
  invalidateEvaluationCache,
  invalidateNotificationCache,
  invalidateCertificateCache,
} from './common';

// Re-export types
export type { Certificate, CertificateTemplate, CertificateFilters };

// ========== Materials API ==========

export async function getMaterials(filters?: MaterialFilters): Promise<TrainingMaterial[]> {
  return materialService.getMaterials(filters);
}

export async function getMaterial(id: string): Promise<TrainingMaterial | null> {
  return materialService.getMaterial(id);
}

export async function createMaterial(data: Omit<TrainingMaterial, 'updatedAt'>): Promise<TrainingMaterial> {
  const result = await materialService.createMaterial(data);
  invalidateMaterialCache();
  return result;
}

export async function updateMaterial(id: string, updates: Partial<TrainingMaterial>): Promise<void> {
  await materialService.updateMaterial(id, updates);
  invalidateMaterialCache();
}

export async function deleteMaterial(id: string): Promise<void> {
  await materialService.deleteMaterial(id);
  invalidateMaterialCache();
}

export async function getFolders(parentId?: string | null): Promise<MaterialFolder[]> {
  return materialService.getFolders(parentId);
}

export async function createFolder(data: Omit<MaterialFolder, 'createdAt' | 'updatedAt'>): Promise<MaterialFolder> {
  const result = await materialService.createFolder(data);
  invalidateMaterialCache();
  return result;
}

export async function updateFolder(id: string, updates: Partial<MaterialFolder>): Promise<void> {
  await materialService.updateFolder(id, updates);
  invalidateMaterialCache();
}

export async function deleteFolder(id: string): Promise<void> {
  await materialService.deleteFolder(id);
  invalidateMaterialCache();
}

// ========== Evaluations API ==========

export async function getEvaluations(filters?: EvaluationFilters): Promise<TrainingEvaluation[]> {
  return evaluationService.getEvaluations(filters);
}

export async function getEvaluation(id: string): Promise<TrainingEvaluation | null> {
  return evaluationService.getEvaluation(id);
}

export async function getEvaluationsByProgram(programId: string): Promise<TrainingEvaluation[]> {
  return evaluationService.getEvaluationsByProgram(programId);
}

export async function createEvaluation(data: Omit<TrainingEvaluation, 'submittedAt'>): Promise<TrainingEvaluation> {
  const result = await evaluationService.createEvaluation(data);
  invalidateEvaluationCache();
  return result;
}

export async function updateEvaluation(id: string, updates: Partial<TrainingEvaluation>): Promise<void> {
  await evaluationService.updateEvaluation(id, updates);
  invalidateEvaluationCache();
}

// ========== Notifications API ==========

export async function getNotifications(userId?: string, filters?: NotificationQueryFilters): Promise<Notification[]> {
  return notificationService.getNotifications(userId, filters);
}

export async function createNotification(data: Omit<Notification, 'created_at'>): Promise<Notification> {
  const result = await notificationService.createNotification(data);
  invalidateNotificationCache();
  return result;
}

export async function markNotificationAsRead(id: string): Promise<void> {
  await notificationService.markAsRead(id);
  invalidateNotificationCache();
}

export async function markAllNotificationsAsRead(userId: string): Promise<void> {
  await notificationService.markAllAsRead(userId);
  invalidateNotificationCache();
}

export async function deleteNotification(id: string): Promise<void> {
  await notificationService.deleteNotification(id);
  invalidateNotificationCache();
}

export async function batchDeleteNotifications(ids: string[]): Promise<void> {
  await notificationService.batchDeleteNotifications(ids);
  invalidateNotificationCache();
}

export async function getNotificationSettings(userId: string): Promise<NotificationSettingsData | null> {
  return notificationService.getSettings(userId);
}

export async function updateNotificationSettings(userId: string, data: Partial<NotificationSettingsData>): Promise<void> {
  return notificationService.updateSettings(userId, data);
}

// ========== Audit Logs API ==========

export async function getAuditLogs(filters?: AuditLogFilters): Promise<AuditLogEntry[]> {
  return auditLogService.getAuditLogs(filters);
}

export async function createAuditLog(data: Omit<AuditLogEntry, 'changed_at'>): Promise<AuditLogEntry> {
  return auditLogService.createAuditLog(data);
}

// ========== Trainer API ==========

export async function getTrainers(status?: string) {
  return trainerService.getTrainers(status);
}

export async function getTrainer(id: string) {
  return trainerService.getTrainer(id);
}

export async function createTrainer(data: Parameters<typeof trainerService.createTrainer>[0]) {
  const result = await trainerService.createTrainer(data);
  return result;
}

export async function updateTrainer(id: string, updates: Parameters<typeof trainerService.updateTrainer>[1]) {
  await trainerService.updateTrainer(id, updates);
}

export async function deleteTrainer(id: string) {
  await trainerService.deleteTrainer(id);
}

// ========== Training Plan API ==========

export async function getTrainingPlans() {
  return trainingPlanService.getTrainingPlans();
}

export async function getTrainingPlan(id: string) {
  return trainingPlanService.getTrainingPlan(id);
}

export async function createTrainingPlan(data: Parameters<typeof trainingPlanService.createTrainingPlan>[0]) {
  return trainingPlanService.createTrainingPlan(data);
}

export async function updateTrainingPlan(id: string, updates: Parameters<typeof trainingPlanService.updateTrainingPlan>[1]) {
  await trainingPlanService.updateTrainingPlan(id, updates);
}

export async function deleteTrainingPlan(id: string) {
  await trainingPlanService.deleteTrainingPlan(id);
}

// ========== Audit Compliance API ==========

export async function getAuditMetrics() {
  return auditComplianceService.getAuditMetrics();
}

export async function updateAuditMetric(id: string, updates: Parameters<typeof auditComplianceService.updateAuditMetric>[1]) {
  await auditComplianceService.updateAuditMetric(id, updates);
}

export async function createAuditMetric(data: Parameters<typeof auditComplianceService.createAuditMetric>[0]) {
  return auditComplianceService.createAuditMetric(data);
}

export async function getAuditFindings() {
  return auditComplianceService.getAuditFindings();
}

export async function createAuditFinding(data: Parameters<typeof auditComplianceService.createAuditFinding>[0]) {
  return auditComplianceService.createAuditFinding(data);
}

export async function getCorrectiveActions() {
  return auditComplianceService.getCorrectiveActions();
}

export async function createCorrectiveAction(data: Parameters<typeof auditComplianceService.createCorrectiveAction>[0]) {
  return auditComplianceService.createCorrectiveAction(data);
}

export async function updateCorrectiveAction(id: string, updates: Parameters<typeof auditComplianceService.updateCorrectiveAction>[1]) {
  await auditComplianceService.updateCorrectiveAction(id, updates);
}

// ========== Certificate API ==========

export async function getCertificates(filters?: CertificateFilters): Promise<Certificate[]> {
  return certificateService.getCertificates(filters);
}

export async function getCertificate(id: string): Promise<Certificate | null> {
  return certificateService.getCertificate(id);
}

export async function createCertificate(
  data: Omit<Certificate, 'created_at'>
): Promise<Certificate> {
  const result = await certificateService.createCertificate(data);
  invalidateCertificateCache();
  return result;
}

export async function createCertificatesBatch(
  certificates: Omit<Certificate, 'created_at'>[]
): Promise<Certificate[]> {
  const results = await certificateService.createCertificatesBatch(certificates);
  invalidateCertificateCache();
  return results;
}

export async function revokeCertificate(
  certificateId: string,
  revokedBy: string,
  reason: string
): Promise<void> {
  await certificateService.revokeCertificate(certificateId, revokedBy, reason);
  invalidateCertificateCache();
}

export async function getCertificateTemplates(activeOnly = true): Promise<CertificateTemplate[]> {
  return certificateService.getCertificateTemplates(activeOnly);
}

export async function getCertificateTemplate(id: string): Promise<CertificateTemplate | null> {
  return certificateService.getCertificateTemplate(id);
}

export async function createCertificateTemplate(
  data: Omit<CertificateTemplate, 'template_id' | 'created_at' | 'updated_at'>
): Promise<CertificateTemplate> {
  const result = await certificateService.createCertificateTemplate(data);
  invalidateCertificateCache();
  return result;
}

export async function updateCertificateTemplate(
  templateId: string,
  updates: Partial<CertificateTemplate>
): Promise<void> {
  await certificateService.updateCertificateTemplate(templateId, updates);
  invalidateCertificateCache();
}

export async function deleteCertificateTemplate(templateId: string): Promise<void> {
  await certificateService.deleteCertificateTemplate(templateId);
  invalidateCertificateCache();
}

// ========== Competency & Skill Gap API ==========

export async function getCompetencies(
  category?: CompetencyCategory
): Promise<Competency[]> {
  return competencyService.getCompetencies(category);
}

export async function createCompetency(
  data: Omit<Competency, 'competency_id' | 'created_at' | 'updated_at'>
): Promise<Competency> {
  return competencyService.createCompetency(data);
}

export async function updateCompetency(
  id: string,
  updates: Partial<Competency>
): Promise<void> {
  return competencyService.updateCompetency(id, updates);
}

export async function deleteCompetency(id: string): Promise<void> {
  return competencyService.deleteCompetency(id);
}

export async function getEmployeeCompetencies(
  employeeId?: string
): Promise<EmployeeCompetency[]> {
  return competencyService.getEmployeeCompetencies(employeeId);
}

export async function updateEmployeeCompetency(
  data: EmployeeCompetency
): Promise<void> {
  return competencyService.updateEmployeeCompetency(data);
}

export async function getLearningPaths(): Promise<LearningPath[]> {
  return competencyService.getLearningPaths();
}

export async function createLearningPath(
  data: Omit<LearningPath, 'path_id' | 'created_at' | 'updated_at'>
): Promise<LearningPath> {
  return competencyService.createLearningPath(data);
}

export async function updateLearningPath(
  id: string,
  updates: Partial<LearningPath>
): Promise<void> {
  return competencyService.updateLearningPath(id, updates);
}

export async function getEmployeeLearningPaths(
  employeeId?: string
): Promise<EmployeeLearningPath[]> {
  return competencyService.getEmployeeLearningPaths(employeeId);
}

export async function updateEmployeeLearningPath(
  data: EmployeeLearningPath
): Promise<void> {
  return competencyService.updateEmployeeLearningPath(data);
}

export async function getDevelopmentPlans(
  employeeId?: string
): Promise<IndividualDevelopmentPlan[]> {
  return competencyService.getDevelopmentPlans(employeeId);
}

export async function createDevelopmentPlan(
  data: Omit<IndividualDevelopmentPlan, 'plan_id' | 'created_at' | 'updated_at'>
): Promise<IndividualDevelopmentPlan> {
  return competencyService.createDevelopmentPlan(data);
}

export async function updateDevelopmentPlan(
  id: string,
  updates: Partial<IndividualDevelopmentPlan>
): Promise<void> {
  return competencyService.updateDevelopmentPlan(id, updates);
}

// ========== Tech Model API ==========

export const techModel = {
  getModels: (filters?: TechModelFilters) => techModelService.getModels(filters),
  createModel: (data: Omit<TechModel, 'id' | 'createdAt' | 'updatedAt'>) =>
    techModelService.createModel(data),
  updateModel: (id: string, data: Partial<Omit<TechModel, 'id' | 'createdAt' | 'createdBy'>>) =>
    techModelService.updateModel(id, data),
  deleteModel: (id: string) => techModelService.deleteModel(id),
  getGuidelines: (modelId?: string) => techModelService.getGuidelines(modelId),
  createGuideline: (data: Omit<TechReviewGuideline, 'id' | 'createdAt' | 'updatedAt'>) =>
    techModelService.createGuideline(data),
  updateGuideline: (id: string, data: Partial<Omit<TechReviewGuideline, 'id' | 'createdAt' | 'createdBy'>>) =>
    techModelService.updateGuideline(id, data),
  deleteGuideline: (id: string) => techModelService.deleteGuideline(id),
};

// ========== Inspector Sticker API ==========

export const inspectorSticker = {
  getStickers: (status?: string): Promise<InspectorSticker[]> =>
    inspectorStickerService.getStickers(status),
  getSticker: (id: string): Promise<InspectorSticker | null> =>
    inspectorStickerService.getSticker(id),
  getStickerByStickerID: (stickerId: string): Promise<InspectorSticker | null> =>
    inspectorStickerService.getStickerByStickerID(stickerId),
  createSticker: (data: InspectorStickerInput): Promise<InspectorSticker> =>
    inspectorStickerService.createSticker(data),
  updateSticker: (id: string, updates: InspectorStickerUpdate): Promise<void> =>
    inspectorStickerService.updateSticker(id, updates),
  deleteSticker: (id: string): Promise<void> =>
    inspectorStickerService.deleteSticker(id),
};
