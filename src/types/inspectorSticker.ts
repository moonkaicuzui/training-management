/**
 * Inspector Sticker Types
 *
 * 제품 검사원의 정품 인증 스티커 마스터 데이터 타입 정의.
 * 스티커 ID → 검사원 매핑으로 불량 제품 추적에 활용.
 */

export type StickerStatus = 'ACTIVE' | 'INACTIVE';

export interface InspectorSticker {
  id: string;
  sticker_id: string;
  employee_id: string;
  employee_name: string;
  department?: string;
  building?: string;
  line?: string;
  status: StickerStatus;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface InspectorStickerInput {
  sticker_id: string;
  employee_id: string;
  employee_name: string;
  department?: string;
  building?: string;
  line?: string;
  notes?: string;
}

export interface InspectorStickerUpdate {
  sticker_id?: string;
  employee_id?: string;
  employee_name?: string;
  department?: string;
  building?: string;
  line?: string;
  status?: StickerStatus;
  notes?: string;
}
