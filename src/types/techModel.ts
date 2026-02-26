/**
 * TECH / NEW MODEL Types
 *
 * 시즌별 신규 모델 및 리뷰 지침 타입 정의
 */

// 자재 포인트
export type MaterialPoint = 'Upper' | 'Outsole' | 'Midsole' | 'Adhesive' | 'Accessories';

// 공정 포인트
export type ProcessPoint = 'Cutting' | 'Stitching' | 'Lasting' | 'Assembling' | 'Finishing';

// 표준 정보 부분
export type StandardInfo = 'Dimension' | 'Weight' | 'Color' | 'Strength' | 'Appearance';

// 신규 모델
export interface TechModel {
  id: string;
  season: string;        // "SS26", "FW26" 등
  modelName: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;     // user email
}

// 참조 사진
export interface ReferencePhoto {
  url: string;
  storagePath: string;
  originalName: string;
}

// 리뷰 지침
export interface TechReviewGuideline {
  id: string;
  modelId: string;
  materialPoint: MaterialPoint;
  processPoint: ProcessPoint;
  standardInfo: StandardInfo;
  processName: string;
  details: string;
  referencePhotos: ReferencePhoto[];
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

// 필터
export interface TechModelFilters {
  season?: string;
}
