/**
 * 퀵 액션 버튼 그리드
 *
 * 멤버, 과제, 캘린더, 설정 바로가기
 */

import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Users, CheckCircle2, Calendar, Settings } from 'lucide-react';

export function ProjectQuickActions() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
      <Button
        variant="outline"
        className="h-20 flex flex-col items-center justify-center gap-2"
        onClick={() => navigate('/projects/members')}
      >
        <Users className="h-6 w-6" />
        <span>{t('projects.members.title')}</span>
      </Button>
      <Button
        variant="outline"
        className="h-20 flex flex-col items-center justify-center gap-2"
        onClick={() => navigate('/projects/tasks')}
      >
        <CheckCircle2 className="h-6 w-6" />
        <span>{t('projects.tasks.title')}</span>
      </Button>
      <Button
        variant="outline"
        className="h-20 flex flex-col items-center justify-center gap-2"
        onClick={() => navigate('/projects/calendar')}
      >
        <Calendar className="h-6 w-6" />
        <span>{t('projects.calendar.title')}</span>
      </Button>
      <Button
        variant="outline"
        className="h-20 flex flex-col items-center justify-center gap-2"
        onClick={() => navigate('/projects/settings')}
      >
        <Settings className="h-6 w-6" />
        <span>{t('projects.settings.title')}</span>
      </Button>
    </div>
  );
}
