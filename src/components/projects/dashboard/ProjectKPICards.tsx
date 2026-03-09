/**
 * 프로젝트 대시보드 KPI 카드
 *
 * 멤버 수, 프로젝트 수, 완료율, 지연 과제 카드
 */

import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Users, LayoutDashboard, CheckCircle2, AlertTriangle } from 'lucide-react';

interface TaskStats {
  total: number;
  delayed: number;
  delayedStart: number;
  delayedComplete: number;
  done: number;
}

interface ProjectKPICardsProps {
  activeMembersCount: number;
  activeProjectsCount: number;
  completionRate: number;
  taskStats: TaskStats;
  onMembersClick: () => void;
  onProjectsClick: () => void;
  onCompletionClick: () => void;
  onDelayedClick: () => void;
}

export function ProjectKPICards({
  activeMembersCount,
  activeProjectsCount,
  completionRate,
  taskStats,
  onMembersClick,
  onProjectsClick,
  onCompletionClick,
  onDelayedClick,
}: ProjectKPICardsProps) {
  const { t } = useTranslation();

  return (
    <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
      <Card
        className="cursor-pointer hover:shadow-md transition-shadow"
        onClick={onMembersClick}
      >
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{t('projects.members.title')}</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{activeMembersCount}</div>
          <p className="text-xs text-muted-foreground">{t('projects.members.activeMembers')}</p>
        </CardContent>
      </Card>

      <Card
        className="cursor-pointer hover:shadow-md transition-shadow"
        onClick={onProjectsClick}
      >
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{t('projects.title')}</CardTitle>
          <LayoutDashboard className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{activeProjectsCount}</div>
          <p className="text-xs text-muted-foreground">{t('projects.dashboard.activeProjects')}</p>
        </CardContent>
      </Card>

      <Card
        className="cursor-pointer hover:shadow-md transition-shadow"
        onClick={onCompletionClick}
      >
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{t('projects.dashboard.completedTasks')}</CardTitle>
          <CheckCircle2 className="h-4 w-4 text-green-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{completionRate}%</div>
          <Progress value={completionRate} className="h-2 mt-2" />
        </CardContent>
      </Card>

      <Card
        className="cursor-pointer hover:shadow-md transition-shadow"
        onClick={onDelayedClick}
      >
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{t('projects.dashboard.overdueTasks')}</CardTitle>
          <AlertTriangle className="h-4 w-4 text-red-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-500">{taskStats.delayed}</div>
          <p className="text-xs text-muted-foreground">
            {t('projects.dashboard.delayedStartShort')} {taskStats.delayedStart} / {t('projects.dashboard.delayedCompleteShort')} {taskStats.delayedComplete}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
