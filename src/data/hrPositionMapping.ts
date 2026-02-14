// ============================================================
// HR Position Mapping
// Maps HR system values to Q-TRAIN standardized values
// ============================================================

import type { Position, Department, Building } from '@/types';

/**
 * Maps 62 HR position names (QIP POSITION 3RD NAME) to Q-TRAIN Position codes
 */
export const HR_POSITION_MAPPING: Record<string, Position> = {
  // QIP_TQC mappings
  'ASSEMBLY FULL PROCESS QUALITY': 'QIP_TQC',
  'ASSEMBLY PROCESS QUALITY': 'QIP_TQC',
  'BOTTOM PROCESS QUALITY': 'QIP_TQC',
  'CUTTING PROCESS QUALITY': 'QIP_TQC',
  'MTL INCOMING QUALITY': 'QIP_TQC',
  'OSC PROCESS QUALITY': 'QIP_TQC',
  'STITCHING PROCESS QUALITY': 'QIP_TQC',
  'STOCKFIT PROCESS QUALITY': 'QIP_TQC',

  // QIP_RQC mappings
  'ASSEMBLY ROVING QUALITY': 'QIP_RQC',
  'BOTTOM ROVING QUALITY': 'QIP_RQC',
  'CUTTING ROVING QUALITY': 'QIP_RQC',
  'STITCHING ROVING QUALITY': 'QIP_RQC',
  'MTL ROVING QUALITY': 'QIP_RQC',
  'OSC ROVING QUALITY': 'QIP_RQC',

  // QIP_CFA mappings
  'AQL INSPECTOR': 'QIP_CFA',

  // QIP_QA mappings
  'QA': 'QIP_QA',
  'AUDIT & TRAINING TEAM': 'QIP_QA',
  'MODEL MASTER': 'QIP_QA',

  // QIP_LINE_LEADER mappings
  'ASSEMBLY LINE PO COMPLETION QUALITY': 'QIP_LINE_LEADER',
  'ASSEMBLY FINAL QUALITY': 'QIP_LINE_LEADER',
  'BOTTOM LINE PO COMPLETION QUALITY': 'QIP_LINE_LEADER',
  'CUTTING LINE PO COMPLETION QUALITY': 'QIP_LINE_LEADER',
  'STITCHING LINE PO COMPLETION QUALITY': 'QIP_LINE_LEADER',
  'MTL LINE PO COMPLETION QUALITY': 'QIP_LINE_LEADER',
  'OSC LINE PO COMPLETION QUALITY': 'QIP_LINE_LEADER',

  // QIP_GROUP_LEADER mappings
  'ASSEMBLY GROUP LEADER': 'QIP_GROUP_LEADER',
  'BOTTOM GROUP LEADER': 'QIP_GROUP_LEADER',
  'CUTTING GROUP LEADER': 'QIP_GROUP_LEADER',
  'STITCHING GROUP LEADER': 'QIP_GROUP_LEADER',
  'MTL GROUP LEADER': 'QIP_GROUP_LEADER',
  'OSC GROUP LEADER': 'QIP_GROUP_LEADER',
  'REPACKING GROUP LEADER': 'QIP_GROUP_LEADER',
  'AQL GROUP LEADER': 'QIP_GROUP_LEADER',

  // QIP_SUPERVISOR mappings
  'ASSEMBLY SUPERVISOR': 'QIP_SUPERVISOR',
  'BOTTOM SUPERVISOR': 'QIP_SUPERVISOR',
  'CUTTING SUPERVISOR': 'QIP_SUPERVISOR',
  'STITCHING SUPERVISOR': 'QIP_SUPERVISOR',
  'MTL SUPERVISOR': 'QIP_SUPERVISOR',
  'OSC SUPERVISOR': 'QIP_SUPERVISOR',
  'AQL SUPERVISOR': 'QIP_SUPERVISOR',
  'REPACKING SUPERVISOR': 'QIP_SUPERVISOR',

  // QIP_MANAGER_PLUS mappings
  'MANAGER': 'QIP_MANAGER_PLUS',
  'A MANAGER': 'QIP_MANAGER_PLUS',
  'A_MANAGER': 'QIP_MANAGER_PLUS',

  // QIP_OFFICE mappings
  'STAFF': 'QIP_OFFICE',
  'ADMIN': 'QIP_OFFICE',
  'OCPT': 'QIP_OFFICE',
  'PLANNING': 'QIP_OFFICE',

  // QIP_NEW_MEMBER mappings
  'NEW': 'QIP_NEW_MEMBER',
  'NEW MEMBER': 'QIP_NEW_MEMBER',
  'TRAINEE': 'QIP_NEW_MEMBER',
};

/**
 * Maps HR team names (QIP POSITION 3RD NAME group) to Q-TRAIN Department codes
 */
export const HR_TEAM_MAPPING: Record<string, Department> = {
  'ASSEMBLY': 'ASSEMBLY',
  'STITCHING': 'STITCHING',
  'CUTTING': 'CUTTING',
  'BOTTOM': 'BOTTOM',
  'OSC': 'OSC',
  'MTL': 'MTL',
  'AQL': 'AQL',
  'REPACKING': 'REPACKING',
  'QA': 'QA',
  'OFFICE': 'OFFICE',
  'QIP_MANAGER_OFFICE_OCPT': 'OFFICE',
  'NEW': 'NEW',
};

/**
 * Maps HR building names to Q-TRAIN Building codes
 */
export const HR_BUILDING_MAPPING: Record<string, Building> = {
  'A': 'BUILDING_A',
  'A1': 'BUILDING_A1',
  'A2': 'BUILDING_A2',
  'B': 'BUILDING_B',
  'B1': 'BUILDING_B1',
  'B2': 'BUILDING_B2',
  'B3': 'BUILDING_B3',
  'C': 'BUILDING_C',
  'D': 'BUILDING_D',
  'E1': 'BUILDING_E1',
  'E2': 'BUILDING_E2',
  'EZ HAPPO': 'BUILDING_EZ_HAPPO',
  'FG WH': 'BUILDING_FG_WH',
  'INHOUSE EZ': 'BUILDING_INHOUSE_EZ',
  'INHOUSE PRINTING': 'BUILDING_INHOUSE_PRINTING',
  'MTL WH': 'BUILDING_MTL_WH',
  'OSC A': 'BUILDING_OSC_A',
  'QA OFFICE': 'BUILDING_QA_OFFICE',
  'QIP OFFICE': 'BUILDING_QIP_OFFICE',
};

/**
 * Convert HR date format (MM/DD/YYYY) to Q-TRAIN format (YYYY-MM-DD)
 */
export function convertHRDate(hrDate: string): string {
  if (!hrDate) return '';
  const parts = hrDate.split('/');
  if (parts.length !== 3) return hrDate;
  const [month, day, year] = parts;
  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
}

/**
 * Determine employee status based on HR data
 */
export function getEmployeeStatus(stopWorkingDate: string | null | undefined): 'ACTIVE' | 'INACTIVE' {
  return stopWorkingDate ? 'INACTIVE' : 'ACTIVE';
}

/**
 * Resolve position from HR position name
 */
export function resolvePosition(hrPositionName: string): Position {
  const normalized = hrPositionName.trim().toUpperCase();
  return HR_POSITION_MAPPING[normalized] || HR_POSITION_MAPPING[hrPositionName] || 'QIP_TQC';
}

/**
 * Resolve department/team from HR position name
 */
export function resolveDepartment(hrPositionName: string): Department {
  const normalized = hrPositionName.trim().toUpperCase();
  // Extract team from position name (first word usually indicates the area)
  const firstWord = normalized.split(' ')[0];
  return HR_TEAM_MAPPING[firstWord] || 'OFFICE';
}

/**
 * Resolve building from HR building name
 */
export function resolveBuilding(hrBuildingName: string): Building {
  const normalized = hrBuildingName.trim().toUpperCase();
  return HR_BUILDING_MAPPING[normalized] || 'BUILDING_A';
}
