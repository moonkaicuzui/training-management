/**
 * Material Types
 * 교육 자료 관리 타입 정의
 */

export type MaterialType = 'document' | 'video' | 'image' | 'archive' | 'other';

export interface MaterialFolder {
  id: string;
  name: string;
  parentId: string | null;
  createdAt: string;
  updatedAt: string;
  itemCount: number;
}

export interface TrainingMaterial {
  id: string;
  name: string;
  type: MaterialType;
  mimeType: string;
  size: number;
  folderId: string | null;
  programId: string | null;
  programName: string | null;
  description: string;
  tags: string[];
  version: string;
  uploadedBy: string;
  uploadedAt: string;
  updatedAt: string;
  downloadCount: number;
  isStarred: boolean;
  isPublic: boolean;
  url: string;
}

export interface MaterialFilters {
  folderId?: string | null;
  type?: MaterialType;
  search?: string;
  isStarred?: boolean;
}
