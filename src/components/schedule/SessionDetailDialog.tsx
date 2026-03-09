import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { format } from 'date-fns';
import type { Locale } from 'date-fns';
import type { TrainingSession, TrainingProgram } from '@/types';

function getStatusBadgeVariant(status: string) {
  switch (status) {
    case 'PLANNED':
      return 'default';
    case 'COMPLETED':
      return 'success';
    case 'CANCELLED':
      return 'destructive';
    default:
      return 'secondary';
  }
}

interface SessionDetailDialogProps {
  session: TrainingSession | null;
  onClose: () => void;
  programs: TrainingProgram[];
  locale: Locale;
}

export default function SessionDetailDialog({
  session,
  onClose,
  programs,
  locale,
}: SessionDetailDialogProps) {
  const { t } = useTranslation();

  return (
    <Dialog open={!!session} onOpenChange={() => onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('schedule.detailTitle')}</DialogTitle>
          <DialogDescription>
            {session?.program_code}
          </DialogDescription>
        </DialogHeader>
        {session && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">{t('schedule.programLabel')}</p>
                <p className="font-medium">
                  {programs.find(p => p.program_code === session.program_code)?.program_name || session.program_code}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t('schedule.statusLabel')}</p>
                <Badge variant={getStatusBadgeVariant(session.status)}>
                  {session.status === 'PLANNED' ? t('session.planned') :
                   session.status === 'COMPLETED' ? t('session.completed') :
                   t('session.cancelled')}
                </Badge>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">{t('schedule.dateLabel')}</p>
                <p className="font-medium">
                  {format(new Date(session.session_date), 'PPP (E)', { locale })}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t('schedule.timeLabel')}</p>
                <p className="font-medium">{session.session_time}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">{t('schedule.trainerDetailLabel')}</p>
                <p className="font-medium">{session.trainer || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t('schedule.locationDetailLabel')}</p>
                <p className="font-medium">{session.location || '-'}</p>
              </div>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{t('schedule.attendeesLabel')}</p>
              <p className="font-medium">
                {t('schedule.attendeesCount', { current: session.attendees.length, max: session.max_attendees })}
              </p>
            </div>
            {session.notes && (
              <div>
                <p className="text-sm text-muted-foreground">{t('schedule.memoLabel')}</p>
                <p>{session.notes}</p>
              </div>
            )}
          </div>
        )}
        <DialogFooter>
          <Button onClick={onClose}>{t('common.close')}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
