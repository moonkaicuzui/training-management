import { Badge } from '@/components/ui/badge';
import type { NewTQCTraineeStatus, NewTQCMeetingStatus } from '@/types/newTqc';

interface TraineeStatusBadgeProps {
  status: NewTQCTraineeStatus;
  className?: string;
}

const statusConfig: Record<
  NewTQCTraineeStatus,
  { label: string; labelVi: string; variant: 'default' | 'success' | 'destructive' | 'secondary' }
> = {
  IN_TRAINING: {
    label: '교육중',
    labelVi: 'Đang đào tạo',
    variant: 'default',
  },
  COMPLETED: {
    label: '교육완료',
    labelVi: 'Hoàn thành',
    variant: 'success',
  },
  RESIGNED: {
    label: '퇴사',
    labelVi: 'Đã nghỉ',
    variant: 'destructive',
  },
};

export function TraineeStatusBadge({ status, className }: TraineeStatusBadgeProps) {
  const config = statusConfig[status];

  return (
    <Badge variant={config.variant} className={className}>
      {config.label}
    </Badge>
  );
}

// Color Blind 검사 결과 뱃지
interface ColorBlindBadgeProps {
  result: 'PASS' | 'FAIL' | null;
  className?: string;
}

export function ColorBlindBadge({ result, className }: ColorBlindBadgeProps) {
  if (result === null) {
    return (
      <Badge variant="secondary" className={className}>
        미검사
      </Badge>
    );
  }

  return (
    <Badge variant={result === 'PASS' ? 'success' : 'destructive'} className={className}>
      {result === 'PASS' ? '정상' : '색맹'}
    </Badge>
  );
}

// 미팅 상태 뱃지
interface MeetingStatusBadgeProps {
  status: NewTQCMeetingStatus;
  className?: string;
}

export function MeetingStatusBadge({ status, className }: MeetingStatusBadgeProps) {
  const config: Record<
    NewTQCMeetingStatus,
    { label: string; variant: 'default' | 'success' | 'destructive' | 'secondary' }
  > = {
    SCHEDULED: { label: '예정', variant: 'default' },
    COMPLETED: { label: '완료', variant: 'success' },
    MISSED: { label: '미실시', variant: 'destructive' },
    RESCHEDULED: { label: '재조정', variant: 'secondary' },
  };

  const { label, variant } = config[status];

  return (
    <Badge variant={variant} className={className}>
      {label}
    </Badge>
  );
}

// 교육 단계 상태 뱃지
interface StageStatusBadgeProps {
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
  className?: string;
}

export function StageStatusBadge({ status, className }: StageStatusBadgeProps) {
  const config: Record<
    'PENDING' | 'IN_PROGRESS' | 'COMPLETED',
    { label: string; variant: 'default' | 'success' | 'secondary' }
  > = {
    PENDING: { label: '대기', variant: 'secondary' },
    IN_PROGRESS: { label: '진행중', variant: 'default' },
    COMPLETED: { label: '완료', variant: 'success' },
  };

  const { label, variant } = config[status];

  return (
    <Badge variant={variant} className={className}>
      {label}
    </Badge>
  );
}
