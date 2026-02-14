import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { Badge } from '@/components/ui/badge';
import type { NewTQCTraineeStatus, NewTQCMeetingStatus } from '@/types/newTqc';

interface TraineeStatusBadgeProps {
  status: NewTQCTraineeStatus;
  className?: string;
}

const statusVariant: Record<
  NewTQCTraineeStatus,
  'default' | 'success' | 'destructive' | 'secondary'
> = {
  IN_TRAINING: 'default',
  COMPLETED: 'success',
  RESIGNED: 'destructive',
};

const statusI18nKey: Record<NewTQCTraineeStatus, string> = {
  IN_TRAINING: 'newTqc.status.inTraining',
  COMPLETED: 'newTqc.status.completed',
  RESIGNED: 'newTqc.status.resigned',
};

export const TraineeStatusBadge = memo(function TraineeStatusBadge({
  status,
  className,
}: TraineeStatusBadgeProps) {
  const { t } = useTranslation();

  return (
    <Badge variant={statusVariant[status]} className={className}>
      {t(statusI18nKey[status])}
    </Badge>
  );
});

// Color Blind 검사 결과 뱃지
interface ColorBlindBadgeProps {
  result: 'PASS' | 'FAIL' | null;
  className?: string;
}

export const ColorBlindBadge = memo(function ColorBlindBadge({
  result,
  className,
}: ColorBlindBadgeProps) {
  const { t } = useTranslation();

  if (result === null) {
    return (
      <Badge variant="secondary" className={className}>
        {t('newTqc.colorBlind.notTested')}
      </Badge>
    );
  }

  return (
    <Badge variant={result === 'PASS' ? 'success' : 'destructive'} className={className}>
      {result === 'PASS' ? t('newTqc.colorBlind.pass') : t('newTqc.colorBlind.fail')}
    </Badge>
  );
});

// 미팅 상태 뱃지
interface MeetingStatusBadgeProps {
  status: NewTQCMeetingStatus;
  className?: string;
}

const meetingStatusVariant: Record<
  NewTQCMeetingStatus,
  'default' | 'success' | 'destructive' | 'secondary'
> = {
  SCHEDULED: 'default',
  COMPLETED: 'success',
  MISSED: 'destructive',
  RESCHEDULED: 'secondary',
};

const meetingStatusI18nKey: Record<NewTQCMeetingStatus, string> = {
  SCHEDULED: 'newTqc.meetingStatus.scheduled',
  COMPLETED: 'newTqc.meetingStatus.completed',
  MISSED: 'newTqc.meetingStatus.missed',
  RESCHEDULED: 'newTqc.meetingStatus.rescheduled',
};

export const MeetingStatusBadge = memo(function MeetingStatusBadge({
  status,
  className,
}: MeetingStatusBadgeProps) {
  const { t } = useTranslation();

  return (
    <Badge variant={meetingStatusVariant[status]} className={className}>
      {t(meetingStatusI18nKey[status])}
    </Badge>
  );
});

// 교육 단계 상태 뱃지
interface StageStatusBadgeProps {
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
  className?: string;
}

const stageStatusVariant: Record<
  'PENDING' | 'IN_PROGRESS' | 'COMPLETED',
  'default' | 'success' | 'secondary'
> = {
  PENDING: 'secondary',
  IN_PROGRESS: 'default',
  COMPLETED: 'success',
};

const stageStatusI18nKey: Record<'PENDING' | 'IN_PROGRESS' | 'COMPLETED', string> = {
  PENDING: 'newTqc.stageStatus.pending',
  IN_PROGRESS: 'newTqc.stageStatus.inProgress',
  COMPLETED: 'newTqc.stageStatus.completed',
};

export const StageStatusBadge = memo(function StageStatusBadge({
  status,
  className,
}: StageStatusBadgeProps) {
  const { t } = useTranslation();

  return (
    <Badge variant={stageStatusVariant[status]} className={className}>
      {t(stageStatusI18nKey[status])}
    </Badge>
  );
});
