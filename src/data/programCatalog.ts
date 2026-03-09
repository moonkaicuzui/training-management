// ============================================================
// Q-TRAIN 2026 Program Catalog
// 67+ Training Programs based on 2026 QIp Training Program
// Split into QIP and Other categories for maintainability
// ============================================================

import type { TrainingProgram } from '@/types';
import { programCatalogQIP } from './programCatalog-qip';
import { programCatalogOther } from './programCatalog-other';

/**
 * 2026 QIp Training Program - Combined catalog
 * QIP: Code 1-67 (programCatalog-qip.ts)
 * Other: INSPECTION, PRODUCTION, RETRAINING, NEWCOMER, PROMOTION (programCatalog-other.ts)
 */
export const programCatalog2026: TrainingProgram[] = [
  ...programCatalogQIP,
  ...programCatalogOther,
];

/**
 * Get programs by training level
 */
export function getProgramsByLevel(level: string): TrainingProgram[] {
  return programCatalog2026.filter(p => p.training_level === level);
}

/**
 * Get programs by training type
 */
export function getProgramsByType(type: string): TrainingProgram[] {
  return programCatalog2026.filter(p => p.training_type === type);
}
