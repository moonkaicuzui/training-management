import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { UserPlus, UserMinus, ArrowRightLeft, Building2, ExternalLink, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { HRChangeEvent } from '@/services/api';

function EventIcon({ type }: { type: HRChangeEvent['type'] }) {
  switch (type) {
    case 'NEW_HIRE':
      return <UserPlus className="h-4 w-4 text-green-600" />;
    case 'RESIGNATION':
      return <UserMinus className="h-4 w-4 text-red-600" />;
    case 'DEPARTMENT_CHANGE':
      return <ArrowRightLeft className="h-4 w-4 text-blue-600" />;
    case 'BUILDING_CHANGE':
      return <Building2 className="h-4 w-4 text-orange-600" />;
  }
}

function EventBadge({ type, t }: { type: HRChangeEvent['type']; t: (key: string) => string }) {
  const variants: Record<HRChangeEvent['type'], { variant: 'default' | 'destructive' | 'secondary' | 'outline'; label: string }> = {
    NEW_HIRE: { variant: 'default', label: t('hrSync.eventType.newHire') },
    RESIGNATION: { variant: 'destructive', label: t('hrSync.eventType.resignation') },
    DEPARTMENT_CHANGE: { variant: 'secondary', label: t('hrSync.eventType.departmentChange') },
    BUILDING_CHANGE: { variant: 'outline', label: t('hrSync.eventType.buildingChange') },
  };
  const { variant, label } = variants[type];
  return <Badge variant={variant}>{label}</Badge>;
}

function EventDetails({ event, t }: { event: HRChangeEvent; t: (key: string) => string }) {
  switch (event.type) {
    case 'NEW_HIRE':
      return (
        <span className="text-sm text-muted-foreground">
          {t('hrSync.detail.hireDate')}: {event.details.hireDate || '-'} | {t('hrSync.detail.team')}: {event.details.team || '-'} | {t('hrSync.detail.building')}: {event.details.building || '-'}
        </span>
      );
    case 'RESIGNATION':
      return (
        <span className="text-sm text-muted-foreground">
          {t('hrSync.detail.resignDate')}: {event.details.resignDate || '-'} | {t('hrSync.detail.previousTeam')}: {event.details.previousTeam || '-'}
        </span>
      );
    case 'DEPARTMENT_CHANGE':
    case 'BUILDING_CHANGE':
      return (
        <span className="text-sm text-muted-foreground">
          {event.details.from} → {event.details.to}
        </span>
      );
  }
}

interface HREventTableProps {
  events: HRChangeEvent[];
  deactivatingIds: Set<string>;
  onDeactivate: (employeeId: string) => void;
}

export default function HREventTable({ events, deactivatingIds, onDeactivate }: HREventTableProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  if (events.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{t('hrSync.eventList')}</CardTitle>
        <CardDescription>{t('hrSync.eventListDesc', { count: events.length })}</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]">#</TableHead>
              <TableHead>{t('hrSync.table.type')}</TableHead>
              <TableHead>{t('hrSync.table.employeeId')}</TableHead>
              <TableHead>{t('hrSync.table.employeeName')}</TableHead>
              <TableHead>{t('hrSync.table.details')}</TableHead>
              <TableHead className="text-right">{t('hrSync.table.action')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {events.map((event, idx) => (
              <TableRow key={`${event.type}-${event.employeeId}-${idx}`}>
                <TableCell className="text-muted-foreground">{idx + 1}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <EventIcon type={event.type} />
                    <EventBadge type={event.type} t={t} />
                  </div>
                </TableCell>
                <TableCell className="font-mono text-sm">{event.employeeId}</TableCell>
                <TableCell className="font-medium">{event.employeeName}</TableCell>
                <TableCell><EventDetails event={event} t={t} /></TableCell>
                <TableCell className="text-right">
                  {event.type === 'NEW_HIRE' && (
                    <Button variant="outline" size="sm" onClick={() => navigate('/new-tqc/trainees')}>
                      <ExternalLink className="h-3 w-3 mr-1" />{t('hrSync.action.goTQC')}
                    </Button>
                  )}
                  {event.type === 'RESIGNATION' && (
                    <Button variant="destructive" size="sm" disabled={deactivatingIds.has(event.employeeId)} onClick={() => onDeactivate(event.employeeId)}>
                      {deactivatingIds.has(event.employeeId) ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <UserMinus className="h-3 w-3 mr-1" />}
                      {t('hrSync.action.deactivate')}
                    </Button>
                  )}
                  {(event.type === 'DEPARTMENT_CHANGE' || event.type === 'BUILDING_CHANGE') && (
                    <Button variant="outline" size="sm" onClick={() => navigate('/programs')}>
                      <ExternalLink className="h-3 w-3 mr-1" />{t('hrSync.action.checkPrograms')}
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
