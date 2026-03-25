/**
 * 관리 프레임 시드 데이터
 * 품질 이슈 유형별 사전 정의된 액션 템플릿
 *
 * Firestore: config/action_frames 에 저장
 * 관리자가 UI에서 추가/수정 가능
 */

export interface ActionFrameAction {
  id: string;
  description: { ko: string; en: string; vi: string };
  defaultDeadline: 'immediate' | 'same_day' | '2_days' | '1_week' | '2_weeks';
  required: boolean;
  order: number;
}

export interface ActionFrameMatchCondition {
  defectCategories: string[];       // QOS defectStandards category
  severities: ('critical' | 'major' | 'minor')[];
  discoveryPoints: ('in_production' | 'incoming_inspection' | 'outgoing_inspection' | 'customer_return')[];
}

export interface ActionFrame {
  id: string;
  name: { ko: string; en: string; vi: string };
  description: { ko: string; en: string; vi: string };
  matchConditions: ActionFrameMatchCondition;
  defaultActions: ActionFrameAction[];
  isActive: boolean;
  usageCount: number;
  avgEffectiveness: number;
}

// ────────────────────────────────────────────────────
// 5종 기본 프레임 시드 데이터
// ────────────────────────────────────────────────────

export const DEFAULT_ACTION_FRAMES: ActionFrame[] = [
  {
    id: 'FRAME-001',
    name: {
      ko: '추가생산품 동일 이슈 방지 액션',
      en: 'Additional Production Issue Prevention',
      vi: 'Hành động phòng ngừa lỗi sản xuất bổ sung',
    },
    description: {
      ko: '생산 중 불량 발견 시, 추가 생산품에 동일 이슈가 발생하지 않도록 검사 강화 및 업체 시정 조치',
      en: 'When defects found during production, strengthen inspection and request supplier corrective action to prevent same issue in additional production',
      vi: 'Khi phát hiện lỗi trong sản xuất, tăng cường kiểm tra và yêu cầu nhà cung cấp khắc phục để ngăn ngừa lỗi tương tự',
    },
    matchConditions: {
      defectCategories: ['BONDING', 'PRESSING', 'PAINTING', 'CONTAMINATION'],
      severities: ['major', 'critical'],
      discoveryPoints: ['in_production'],
    },
    defaultActions: [
      {
        id: 'act-001-1',
        description: {
          ko: '해당 라인 전수검사 실시',
          en: '100% inspection on affected line',
          vi: 'Kiểm tra 100% trên chuyền bị ảnh hưởng',
        },
        defaultDeadline: 'immediate',
        required: true,
        order: 1,
      },
      {
        id: 'act-001-2',
        description: {
          ko: '불량 유형별 테스트 실시 (1족/일)',
          en: 'Conduct defect-specific test (1 pair/day)',
          vi: 'Thực hiện kiểm tra theo loại lỗi (1 đôi/ngày)',
        },
        defaultDeadline: 'same_day',
        required: true,
        order: 2,
      },
      {
        id: 'act-001-3',
        description: {
          ko: '재고품 리패킹/격리',
          en: 'Repack/isolate existing stock',
          vi: 'Đóng gói lại/cách ly hàng tồn kho',
        },
        defaultDeadline: 'same_day',
        required: false,
        order: 3,
      },
      {
        id: 'act-001-4',
        description: {
          ko: '업체 시정조치 요청서 발송',
          en: 'Send corrective action request to supplier',
          vi: 'Gửi yêu cầu khắc phục cho nhà cung cấp',
        },
        defaultDeadline: '2_days',
        required: true,
        order: 4,
      },
      {
        id: 'act-001-5',
        description: {
          ko: '후속 라인 검사원 배치',
          en: 'Deploy additional line inspectors',
          vi: 'Bố trí thêm nhân viên kiểm tra chuyền',
        },
        defaultDeadline: 'immediate',
        required: false,
        order: 5,
      },
    ],
    isActive: true,
    usageCount: 0,
    avgEffectiveness: 0,
  },
  {
    id: 'FRAME-002',
    name: {
      ko: '긴급 라인 정지 + 전수검사',
      en: 'Emergency Line Stop + Full Inspection',
      vi: 'Dừng chuyền khẩn cấp + Kiểm tra toàn bộ',
    },
    description: {
      ko: '심각한 안전 또는 품질 이슈 발생 시 즉시 라인을 정지하고 전수검사 실시',
      en: 'Immediately stop the line and conduct full inspection for serious safety or quality issues',
      vi: 'Dừng chuyền ngay lập tức và kiểm tra toàn bộ khi có vấn đề an toàn hoặc chất lượng nghiêm trọng',
    },
    matchConditions: {
      defectCategories: ['BONDING', 'SHAPE', 'SPEC_QC'],
      severities: ['critical'],
      discoveryPoints: ['in_production', 'outgoing_inspection'],
    },
    defaultActions: [
      {
        id: 'act-002-1',
        description: { ko: '해당 라인 즉시 정지', en: 'Immediately stop affected line', vi: 'Dừng chuyền bị ảnh hưởng ngay lập tức' },
        defaultDeadline: 'immediate',
        required: true,
        order: 1,
      },
      {
        id: 'act-002-2',
        description: { ko: '라인 내 전수검사 실시', en: 'Conduct full inspection on line', vi: 'Kiểm tra toàn bộ trên chuyền' },
        defaultDeadline: 'immediate',
        required: true,
        order: 2,
      },
      {
        id: 'act-002-3',
        description: { ko: '불량품 격리 및 수량 파악', en: 'Isolate defective products and count', vi: 'Cách ly sản phẩm lỗi và đếm số lượng' },
        defaultDeadline: 'immediate',
        required: true,
        order: 3,
      },
      {
        id: 'act-002-4',
        description: { ko: '원인 조사 (5-Why 분석)', en: 'Root cause investigation (5-Why)', vi: 'Điều tra nguyên nhân (5-Why)' },
        defaultDeadline: 'same_day',
        required: true,
        order: 4,
      },
      {
        id: 'act-002-5',
        description: { ko: '재가동 조건 수립 및 확인', en: 'Establish and verify restart conditions', vi: 'Thiết lập và xác minh điều kiện khởi động lại' },
        defaultDeadline: '2_days',
        required: true,
        order: 5,
      },
      {
        id: 'act-002-6',
        description: { ko: '관리자 보고', en: 'Report to management', vi: 'Báo cáo cho quản lý' },
        defaultDeadline: 'immediate',
        required: true,
        order: 6,
      },
    ],
    isActive: true,
    usageCount: 0,
    avgEffectiveness: 0,
  },
  {
    id: 'FRAME-003',
    name: {
      ko: '리워크/재작업 프레임',
      en: 'Rework Frame',
      vi: 'Khung làm lại',
    },
    description: {
      ko: '수리 가능한 불량 발견 시 리워크 지시 및 재검사',
      en: 'Rework instruction and re-inspection for repairable defects',
      vi: 'Hướng dẫn làm lại và kiểm tra lại cho các lỗi có thể sửa chữa',
    },
    matchConditions: {
      defectCategories: ['APPEARANCE', 'FINISHING', 'PAINTING', 'PRESSING'],
      severities: ['major', 'minor'],
      discoveryPoints: ['in_production', 'outgoing_inspection'],
    },
    defaultActions: [
      {
        id: 'act-003-1',
        description: { ko: '리워크 대상 분류 및 수량 파악', en: 'Classify rework targets and count', vi: 'Phân loại đối tượng làm lại và đếm' },
        defaultDeadline: 'immediate',
        required: true,
        order: 1,
      },
      {
        id: 'act-003-2',
        description: { ko: '리워크 작업 지시', en: 'Issue rework instruction', vi: 'Phát lệnh làm lại' },
        defaultDeadline: 'same_day',
        required: true,
        order: 2,
      },
      {
        id: 'act-003-3',
        description: { ko: '리워크 완료 후 재검사', en: 'Re-inspect after rework', vi: 'Kiểm tra lại sau khi làm lại' },
        defaultDeadline: '2_days',
        required: true,
        order: 3,
      },
      {
        id: 'act-003-4',
        description: { ko: '재출고 승인', en: 'Approve re-release', vi: 'Phê duyệt xuất lại' },
        defaultDeadline: '2_days',
        required: true,
        order: 4,
      },
    ],
    isActive: true,
    usageCount: 0,
    avgEffectiveness: 0,
  },
  {
    id: 'FRAME-004',
    name: {
      ko: '업체 리턴 + 클레임',
      en: 'Supplier Return + Claim',
      vi: 'Trả hàng nhà cung cấp + Khiếu nại',
    },
    description: {
      ko: '자재 자체 결함으로 인한 불량 시 업체 리턴 및 클레임 처리',
      en: 'Return to supplier and process claim for material defects',
      vi: 'Trả hàng cho nhà cung cấp và xử lý khiếu nại về lỗi vật liệu',
    },
    matchConditions: {
      defectCategories: ['BONDING', 'COLOR', 'CONTAMINATION', 'SHAPE'],
      severities: ['major', 'critical'],
      discoveryPoints: ['incoming_inspection'],
    },
    defaultActions: [
      {
        id: 'act-004-1',
        description: { ko: '불량 자재 격리', en: 'Isolate defective materials', vi: 'Cách ly vật liệu lỗi' },
        defaultDeadline: 'immediate',
        required: true,
        order: 1,
      },
      {
        id: 'act-004-2',
        description: { ko: '업체 통보 (사진 + 상세 내역)', en: 'Notify supplier with photos and details', vi: 'Thông báo nhà cung cấp với hình ảnh và chi tiết' },
        defaultDeadline: 'same_day',
        required: true,
        order: 2,
      },
      {
        id: 'act-004-3',
        description: { ko: '리턴 처리', en: 'Process return', vi: 'Xử lý trả hàng' },
        defaultDeadline: '2_days',
        required: true,
        order: 3,
      },
      {
        id: 'act-004-4',
        description: { ko: '대체 자재 투입 확인', en: 'Verify replacement material deployment', vi: 'Xác minh triển khai vật liệu thay thế' },
        defaultDeadline: '1_week',
        required: false,
        order: 4,
      },
      {
        id: 'act-004-5',
        description: { ko: '클레임 서류 작성', en: 'Prepare claim documents', vi: 'Chuẩn bị tài liệu khiếu nại' },
        defaultDeadline: '1_week',
        required: true,
        order: 5,
      },
    ],
    isActive: true,
    usageCount: 0,
    avgEffectiveness: 0,
  },
  {
    id: 'FRAME-005',
    name: {
      ko: '자재 격리 + 대체 투입',
      en: 'Material Isolation + Replacement',
      vi: 'Cách ly vật liệu + Thay thế',
    },
    description: {
      ko: '오염 또는 이물질 발견 시 해당 자재를 격리하고 대체 자재 투입',
      en: 'Isolate contaminated materials and deploy replacement',
      vi: 'Cách ly vật liệu bị ô nhiễm và triển khai thay thế',
    },
    matchConditions: {
      defectCategories: ['CONTAMINATION', 'COLOR'],
      severities: ['major', 'critical'],
      discoveryPoints: ['incoming_inspection', 'in_production'],
    },
    defaultActions: [
      {
        id: 'act-005-1',
        description: { ko: '오염 자재 즉시 격리', en: 'Immediately isolate contaminated material', vi: 'Cách ly ngay vật liệu bị ô nhiễm' },
        defaultDeadline: 'immediate',
        required: true,
        order: 1,
      },
      {
        id: 'act-005-2',
        description: { ko: '대체 자재 확보 및 투입', en: 'Secure and deploy replacement material', vi: 'Đảm bảo và triển khai vật liệu thay thế' },
        defaultDeadline: 'same_day',
        required: true,
        order: 2,
      },
      {
        id: 'act-005-3',
        description: { ko: '업체 원인 조사 요청', en: 'Request supplier root cause investigation', vi: 'Yêu cầu nhà cung cấp điều tra nguyên nhân' },
        defaultDeadline: '2_days',
        required: true,
        order: 3,
      },
      {
        id: 'act-005-4',
        description: { ko: '재발 방지 대책 수립', en: 'Establish recurrence prevention measures', vi: 'Thiết lập biện pháp phòng ngừa tái phát' },
        defaultDeadline: '1_week',
        required: false,
        order: 4,
      },
    ],
    isActive: true,
    usageCount: 0,
    avgEffectiveness: 0,
  },
];

/**
 * 이슈 유형(defect category)에 따라 관리 프레임을 매칭하고 추천 점수 반환
 */
export function matchActionFrames(
  defectCategory: string,
  severity: 'critical' | 'major' | 'minor',
  discoveryPoint: string,
  frames: ActionFrame[] = DEFAULT_ACTION_FRAMES
): { frame: ActionFrame; score: number }[] {
  return frames
    .filter(f => f.isActive)
    .map(f => {
      let score = 0;
      const mc = f.matchConditions;

      // 카테고리 매칭 (40%)
      if (mc.defectCategories.includes(defectCategory.toUpperCase())) score += 40;

      // 심각도 매칭 (30%)
      if (mc.severities.includes(severity)) score += 30;

      // 발견 시점 매칭 (30%)
      if (mc.discoveryPoints.includes(discoveryPoint as typeof mc.discoveryPoints[number])) score += 30;

      return { frame: f, score };
    })
    .filter(r => r.score > 0)
    .sort((a, b) => b.score - a.score);
}
