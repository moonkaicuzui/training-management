// ============================================================
// Q-TRAIN API - Trainer Directive Wrapper
// ============================================================

import {
  getTodayDirective as _getTodayDirective,
  getRecentDirectives as _getRecentDirectives,
  markDirectiveAsRead as _markDirectiveAsRead,
  acknowledgeDirective as _acknowledgeDirective,
  getEffectivenessReports as _getEffectivenessReports,
} from '@/services/trainerDirectiveService';

export const getTodayDirective = _getTodayDirective;
export const getRecentDirectives = _getRecentDirectives;
export const markDirectiveAsRead = _markDirectiveAsRead;
export const acknowledgeDirective = _acknowledgeDirective;
export const getEffectivenessReports = _getEffectivenessReports;
