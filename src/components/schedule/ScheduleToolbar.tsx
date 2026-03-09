import { useTranslation } from 'react-i18next';
import { ChevronLeft, ChevronRight, Calendar, CalendarDays, CalendarRange } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  CardDescription,
  CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

type ViewMode = 'day' | 'week' | 'month';

interface ScheduleToolbarProps {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  periodTitle: string;
  sessionsCount: number;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
}

export default function ScheduleToolbar({
  viewMode,
  onViewModeChange,
  periodTitle,
  sessionsCount,
  onPrev,
  onNext,
  onToday,
}: ScheduleToolbarProps) {
  const { t } = useTranslation();

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <CardTitle>{periodTitle}</CardTitle>
          <CardDescription>
            {t('schedule.sessionsCount', { count: sessionsCount })}
          </CardDescription>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={onToday}>
            {t('schedule.today')}
          </Button>
          <Button variant="outline" size="icon" onClick={onPrev}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={onNext}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
      {/* View Mode Tabs */}
      <Tabs value={viewMode} onValueChange={(v) => onViewModeChange(v as ViewMode)} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="day" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            <span className="hidden sm:inline">{t('schedule.dayView')}</span>
          </TabsTrigger>
          <TabsTrigger value="week" className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4" />
            <span className="hidden sm:inline">{t('schedule.weekView')}</span>
          </TabsTrigger>
          <TabsTrigger value="month" className="flex items-center gap-2">
            <CalendarRange className="h-4 w-4" />
            <span className="hidden sm:inline">{t('schedule.monthView')}</span>
          </TabsTrigger>
        </TabsList>
      </Tabs>
    </div>
  );
}
