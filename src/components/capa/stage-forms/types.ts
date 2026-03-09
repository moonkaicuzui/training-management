/**
 * CAPA Stage Form Types
 * Form data interfaces + color constants shared across stage dialogs
 */

import type { CAPAStatus, CAPASeverity } from '@/types/capa';

// Stage-specific form data interfaces
export interface InvestigationFormData {
  rootCauseAnalysis: string;
  impactAssessment: string;
  findings: string;
  investigatedBy: string;
}

export interface ActionFormData {
  actionNotes: string;
  plannedBy: string;
}

export interface VerificationFormData {
  verificationMethod: string;
  effectivenessScore: string;
  isEffective: boolean;
  verificationNotes: string;
  verifiedBy: string;
}

export interface ClosureFormData {
  finalReview: string;
  lessonsLearned: string;
  documentationComplete: boolean;
  knowledgeShared: boolean;
  closedBy: string;
}

// Status badge colors (shared with CAPADetail, CAPAInfoCards)
export const STATUS_COLORS: Record<CAPAStatus, string> = {
  discovery: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
  investigation: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
  action: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
  verification: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
  closed: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  rejected: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300',
};

export const SEVERITY_COLORS: Record<CAPASeverity, string> = {
  critical: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
  major: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
  minor: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
};
