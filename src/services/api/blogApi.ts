// ============================================================
// Q-TRAIN API - Quality Blog Wrapper
// ============================================================

import {
  uploadImage as _uploadImage,
  uploadImages as _uploadImages,
} from '@/services/qualityBlogService';

export const uploadBlogImage = _uploadImage;
export const uploadBlogImages = _uploadImages;
