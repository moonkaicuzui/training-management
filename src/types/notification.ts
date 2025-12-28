/**
 * Notification Types
 * 알림/리마인더 시스템 타입 정의
 */

export type NotificationType =
  | 'TRAINING_REMINDER'      // 교육 예정 알림
  | 'EXPIRY_WARNING'         // 교육 만료 임박
  | 'RETRAINING_REQUIRED'    // 재교육 필요
  | 'SESSION_CANCELLED'      // 세션 취소
  | 'RESULT_AVAILABLE'       // 결과 확인 가능
  | 'CERTIFICATE_READY'      // 이수증 발급 완료
  | 'SYSTEM';                // 시스템 알림

export type NotificationPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export interface Notification {
  notification_id: string;
  type: NotificationType;
  priority: NotificationPriority;
  title: string;
  message: string;
  recipient_id?: string; // employee_id or 'ALL'
  recipient_type: 'EMPLOYEE' | 'DEPARTMENT' | 'ALL';
  related_entity?: {
    type: 'SESSION' | 'PROGRAM' | 'EMPLOYEE' | 'RESULT';
    id: string;
  };
  is_read: boolean;
  created_at: string;
  expires_at?: string;
}

export interface NotificationSettings {
  user_id: string;
  email_notifications: boolean;
  in_app_notifications: boolean;
  reminder_days: number[]; // [30, 14, 7, 1] - 며칠 전 알림
  notification_types: NotificationType[];
}

export interface NotificationFilter {
  type?: NotificationType;
  priority?: NotificationPriority;
  is_read?: boolean;
  from_date?: string;
  to_date?: string;
}

// 알림 타입별 아이콘/색상
export const NOTIFICATION_CONFIG: Record<NotificationType, {
  icon: string;
  color: string;
  label: { ko: string; en: string; vi: string };
}> = {
  TRAINING_REMINDER: {
    icon: 'Calendar',
    color: 'text-blue-500',
    label: { ko: '교육 일정', en: 'Training Schedule', vi: 'Lịch đào tạo' },
  },
  EXPIRY_WARNING: {
    icon: 'Clock',
    color: 'text-orange-500',
    label: { ko: '만료 임박', en: 'Expiry Warning', vi: 'Sắp hết hạn' },
  },
  RETRAINING_REQUIRED: {
    icon: 'AlertTriangle',
    color: 'text-red-500',
    label: { ko: '재교육 필요', en: 'Retraining Required', vi: 'Cần đào tạo lại' },
  },
  SESSION_CANCELLED: {
    icon: 'XCircle',
    color: 'text-gray-500',
    label: { ko: '세션 취소', en: 'Session Cancelled', vi: 'Hủy buổi học' },
  },
  RESULT_AVAILABLE: {
    icon: 'CheckCircle',
    color: 'text-green-500',
    label: { ko: '결과 확인', en: 'Result Available', vi: 'Kết quả có sẵn' },
  },
  CERTIFICATE_READY: {
    icon: 'Award',
    color: 'text-purple-500',
    label: { ko: '이수증 발급', en: 'Certificate Ready', vi: 'Chứng chỉ sẵn sàng' },
  },
  SYSTEM: {
    icon: 'Bell',
    color: 'text-gray-600',
    label: { ko: '시스템', en: 'System', vi: 'Hệ thống' },
  },
};
