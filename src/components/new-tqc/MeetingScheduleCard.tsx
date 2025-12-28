import { Calendar, Clock, Users, CheckCircle, AlertCircle } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MeetingStatusBadge } from './TraineeStatusBadge';
import type { NewTQCMeeting, NewTQCMeetingType } from '@/types/newTqc';
import { format, differenceInDays, isPast, isToday } from 'date-fns';
import { cn } from '@/lib/utils';

interface MeetingScheduleCardProps {
  meeting: NewTQCMeeting;
  traineeName?: string;
  onComplete?: (meetingId: string) => void;
  onReschedule?: (meetingId: string) => void;
  className?: string;
}

const meetingTypeLabels: Record<NewTQCMeetingType, { label: string; description: string }> = {
  '1WEEK': { label: '1주차 면담', description: '입사 1주 후 적응 확인' },
  '1MONTH': { label: '1개월 면담', description: '입사 1개월 후 중간 점검' },
  '3MONTH': { label: '3개월 면담', description: '입사 3개월 후 배치 전 최종 면담' },
};

export function MeetingScheduleCard({
  meeting,
  traineeName,
  onComplete,
  onReschedule,
  className,
}: MeetingScheduleCardProps) {
  const typeConfig = meetingTypeLabels[meeting.meeting_type];
  const scheduledDate = new Date(meeting.scheduled_date);
  const daysUntil = differenceInDays(scheduledDate, new Date());
  const isOverdue = isPast(scheduledDate) && meeting.status === 'SCHEDULED';
  const isTodayMeeting = isToday(scheduledDate);

  return (
    <Card
      className={cn(
        'transition-all hover:shadow-md',
        isOverdue && 'border-destructive/50 bg-destructive/5',
        isTodayMeeting && meeting.status === 'SCHEDULED' && 'border-primary/50 bg-primary/5',
        className
      )}
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              {typeConfig.label}
              {isOverdue && <AlertCircle className="h-4 w-4 text-destructive" />}
            </CardTitle>
            <CardDescription>{typeConfig.description}</CardDescription>
          </div>
          <MeetingStatusBadge status={meeting.status} />
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Trainee name if provided */}
        {traineeName && (
          <div className="flex items-center gap-2 text-sm">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">{traineeName}</span>
          </div>
        )}

        {/* Scheduled date */}
        <div className="flex items-center gap-2 text-sm">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <span>{format(scheduledDate, 'yyyy-MM-dd (EEE)')}</span>
          {meeting.status === 'SCHEDULED' && (
            <span
              className={cn(
                'text-xs px-2 py-0.5 rounded-full',
                isOverdue
                  ? 'bg-destructive/10 text-destructive'
                  : isTodayMeeting
                    ? 'bg-primary/10 text-primary'
                    : 'bg-muted text-muted-foreground'
              )}
            >
              {isOverdue
                ? `${Math.abs(daysUntil)}일 지남`
                : isTodayMeeting
                  ? '오늘'
                  : `D-${daysUntil}`}
            </span>
          )}
        </div>

        {/* Completed date if exists */}
        {meeting.completed_date && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <CheckCircle className="h-4 w-4 text-status-pass" />
            <span>완료: {format(new Date(meeting.completed_date), 'yyyy-MM-dd')}</span>
          </div>
        )}

        {/* Attendees */}
        {meeting.attendees && meeting.attendees.length > 0 && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Users className="h-4 w-4" />
            <span>{meeting.attendees.join(', ')}</span>
          </div>
        )}

        {/* Notes */}
        {meeting.notes && (
          <p className="text-sm text-muted-foreground bg-muted/50 p-2 rounded">
            {meeting.notes}
          </p>
        )}

        {/* Actions for scheduled meetings */}
        {meeting.status === 'SCHEDULED' && (onComplete || onReschedule) && (
          <div className="flex gap-2 pt-2">
            {onComplete && (
              <Button
                size="sm"
                onClick={() => onComplete(meeting.meeting_id)}
                className="flex-1"
              >
                <CheckCircle className="h-4 w-4 mr-1" />
                완료
              </Button>
            )}
            {onReschedule && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => onReschedule(meeting.meeting_id)}
              >
                <Clock className="h-4 w-4 mr-1" />
                일정 변경
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Compact version for list views
interface MeetingListItemProps {
  meeting: NewTQCMeeting;
  traineeName?: string;
  onClick?: () => void;
}

export function MeetingListItem({ meeting, traineeName, onClick }: MeetingListItemProps) {
  const typeConfig = meetingTypeLabels[meeting.meeting_type];
  const scheduledDate = new Date(meeting.scheduled_date);
  const isOverdue = isPast(scheduledDate) && meeting.status === 'SCHEDULED';

  return (
    <div
      className={cn(
        'flex items-center justify-between p-3 border rounded-lg transition-colors',
        onClick && 'cursor-pointer hover:bg-accent',
        isOverdue && 'border-destructive/50'
      )}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      <div className="flex items-center gap-3">
        <div
          className={cn(
            'p-2 rounded-full',
            meeting.status === 'COMPLETED'
              ? 'bg-status-pass/10'
              : isOverdue
                ? 'bg-destructive/10'
                : 'bg-primary/10'
          )}
        >
          <Calendar
            className={cn(
              'h-4 w-4',
              meeting.status === 'COMPLETED'
                ? 'text-status-pass'
                : isOverdue
                  ? 'text-destructive'
                  : 'text-primary'
            )}
          />
        </div>
        <div>
          <p className="font-medium text-sm">
            {typeConfig.label}
            {traineeName && <span className="text-muted-foreground"> - {traineeName}</span>}
          </p>
          <p className="text-xs text-muted-foreground">
            {format(scheduledDate, 'yyyy-MM-dd')}
          </p>
        </div>
      </div>
      <MeetingStatusBadge status={meeting.status} />
    </div>
  );
}
