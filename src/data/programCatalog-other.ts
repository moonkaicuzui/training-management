// ============================================================
// Q-TRAIN 2026 Program Catalog - Non-QIP Categories
// PRODUCTION, RETRAINING, NEWCOMER, PROMOTION, INSPECTION
// ============================================================

import type { TrainingProgram } from '@/types';

/**
 * Non-QIP category programs.
 * Currently includes INSPECTION training (INS-001).
 * Future PRODUCTION, RETRAINING, NEWCOMER, PROMOTION programs
 * should be added here.
 */
export const programCatalogOther: TrainingProgram[] = [
  // ========== Inspection Training Program ==========
  {
    program_code: 'INS-001',
    program_name: 'AQL/5PRS Inspection Competency Training',
    program_name_vn: 'Đào tạo năng lực kiểm tra AQL/5PRS',
    program_name_kr: 'AQL/5PRS 검사 역량 교육',
    category: 'INSPECTION',
    tags: ['inspection', 'AQL', '5PRS', 'practical'],
    target_positions: ['QIP_TQC', 'QIP_RQC', 'QIP_CFA'],
    evaluation_type: 'INSPECTION_MATCH',
    passing_score: 80,
    grade_aa: 100,
    grade_a: 95,
    grade_b: 85,
    duration_hours: 4,
    validity_months: 6,
    training_level: 'LEVEL_1',
    training_type: 'SPECIAL',
    is_active: true,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  },
];
