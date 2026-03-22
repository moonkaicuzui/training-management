// ============================================================
// Q-TRAIN API - Factory Line Wrapper
// ============================================================

import {
  getFactoryLines as _getFactoryLines,
  extractMDFactoryLines as _extractMDFactoryLines,
} from '@/services/factoryLineService';

export const getFactoryLines = _getFactoryLines;
export const extractMDFactoryLines = _extractMDFactoryLines;
