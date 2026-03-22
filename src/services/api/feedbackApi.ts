// ============================================================
// Q-TRAIN API - System Feedback Wrapper
// ============================================================

import {
  getAllFeedback as _getAllFeedback,
  getFeedback as _getFeedback,
  createFeedback as _createFeedback,
  updateFeedbackStatus as _updateFeedbackStatus,
  addComment as _addComment,
  uploadScreenshots as _uploadScreenshots,
} from '@/services/systemFeedbackService';

export const getAllFeedback = _getAllFeedback;
export const getFeedback = _getFeedback;
export const createFeedback = _createFeedback;
export const updateFeedbackStatus = _updateFeedbackStatus;
export const addFeedbackComment = _addComment;
export const uploadFeedbackScreenshots = _uploadScreenshots;
