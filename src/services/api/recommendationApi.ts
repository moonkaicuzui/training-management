// ============================================================
// Q-TRAIN Recommendation API
// 5PRS Training Recommendation: thresholds, mappings, links, enrollment logs
// ============================================================

import * as recommendationService from '../recommendationService';

import type {
  RecommendationThreshold,
  DefectTrainingMapping,
  TqcEmployeeLink,
  FivePrsEnrollmentLog,
} from '@/types/recommendation';

// ========== Thresholds ==========

export async function getRecommendationThresholds(): Promise<RecommendationThreshold> {
  return recommendationService.getThresholds();
}

export async function updateRecommendationThresholds(
  updates: Partial<RecommendationThreshold>
): Promise<void> {
  return recommendationService.updateThresholds(updates);
}

// ========== Defect-Training Mappings ==========

export async function getRecommendationMappings(): Promise<DefectTrainingMapping[]> {
  return recommendationService.getMappings();
}

export async function createRecommendationMapping(
  input: Omit<DefectTrainingMapping, 'mapping_id' | 'created_at' | 'updated_at'>
): Promise<DefectTrainingMapping> {
  return recommendationService.createMapping(input);
}

export async function updateRecommendationMapping(
  mappingId: string,
  updates: Partial<DefectTrainingMapping>
): Promise<void> {
  return recommendationService.updateMapping(mappingId, updates);
}

export async function deleteRecommendationMapping(mappingId: string): Promise<void> {
  return recommendationService.deleteMapping(mappingId);
}

// ========== TQC-Employee Links ==========

export async function getRecommendationLinks(): Promise<TqcEmployeeLink[]> {
  return recommendationService.getLinks();
}

export async function createRecommendationLink(
  input: Omit<TqcEmployeeLink, 'link_id' | 'created_at'>
): Promise<TqcEmployeeLink> {
  return recommendationService.createLink(input);
}

export async function deleteRecommendationLink(linkId: string): Promise<void> {
  return recommendationService.deleteLink(linkId);
}

// ========== Enrollment Logs (APPEND-ONLY) ==========

export async function getRecommendationEnrollmentLogs(): Promise<FivePrsEnrollmentLog[]> {
  return recommendationService.getEnrollmentLogs();
}

export async function checkRecommendationEnrollmentDuplicate(
  employeeId: string,
  programCode: string,
): Promise<FivePrsEnrollmentLog | null> {
  return recommendationService.checkEnrollmentDuplicate(employeeId, programCode);
}

export async function createRecommendationEnrollmentLog(
  input: Omit<FivePrsEnrollmentLog, 'log_id' | 'enrolled_at'>
): Promise<FivePrsEnrollmentLog> {
  return recommendationService.createEnrollmentLog(input);
}
