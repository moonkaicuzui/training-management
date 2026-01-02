import { memo, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  GraduationCap,
  AlertTriangle,
  Calendar,
  UserMinus,
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import type { NewTQCDashboardStats } from '@/types/newTqc';

interface NewTQCStatsCardsProps {
  stats: NewTQCDashboardStats | null;
  isLoading?: boolean;
}

export const NewTQCStatsCards = memo(function NewTQCStatsCards({
  stats,
  isLoading,
}: NewTQCStatsCardsProps) {
  const navigate = useNavigate();

  // useMemo로 statItems 배열 최적화
  const statItems = useMemo(() => [
    {
      title: '교육중 인원',
      value: stats?.inTraining ?? 0,
      icon: Users,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
      link: '/new-tqc/trainees?status=IN_TRAINING',
    },
    {
      title: '전체 교육생',
      value: stats?.totalTrainees ?? 0,
      icon: GraduationCap,
      color: 'text-status-pass',
      bgColor: 'bg-status-pass/10',
      link: '/new-tqc/trainees',
    },
    {
      title: '교육 완료',
      value: stats?.completed ?? 0,
      icon: GraduationCap,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
      link: '/new-tqc/trainees?status=COMPLETED',
    },
    {
      title: '퇴사',
      value: stats?.resigned ?? 0,
      icon: UserMinus,
      color: 'text-destructive',
      bgColor: 'bg-destructive/10',
      link: '/new-tqc/resignations',
    },
    {
      title: '예정된 미팅',
      value: stats?.meetingsPending ?? 0,
      icon: Calendar,
      color: 'text-orange-500',
      bgColor: 'bg-orange-500/10',
      link: '/new-tqc/meetings',
    },
    {
      title: '색맹 검사 필요',
      value: stats?.colorBlindPending ?? 0,
      icon: AlertTriangle,
      color: 'text-yellow-500',
      bgColor: 'bg-yellow-500/10',
      link: '/new-tqc/trainees?color_blind=null',
    },
  ], [stats]);

  // 클릭 핸들러 useCallback으로 최적화
  const handleNavigate = useCallback((link: string) => {
    navigate(link);
  }, [navigate]);

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {Array.from({ length: 6 }).map((_, index) => (
          <Card key={`skeleton-${index}`} className="animate-pulse">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="h-4 bg-muted rounded w-20" />
              <div className="h-8 w-8 bg-muted rounded-full" />
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-muted rounded w-16" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      {statItems.map((stat) => (
        <Card
          key={stat.link}
          className="cursor-pointer transition-all hover:shadow-lg hover:-translate-y-1 group"
          onClick={() => handleNavigate(stat.link)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && handleNavigate(stat.link)}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
            <div
              className={`p-2 rounded-full ${stat.bgColor} group-hover:scale-110 transition-transform`}
            >
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stat.value}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
});

// Team Stats card for dashboard
interface TeamStatsProps {
  stats: NewTQCDashboardStats | null;
}

export const NewTQCTeamStats = memo(function NewTQCTeamStats({ stats }: TeamStatsProps) {
  if (!stats) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <GraduationCap className="h-5 w-5" />
          교육 현황 요약
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">평균 진행률</span>
            <span className="font-bold">{stats.averageProgress}%</span>
          </div>
          <div className="w-full bg-muted rounded-full h-2">
            <div
              className="bg-primary rounded-full h-2 transition-all"
              style={{ width: `${stats.averageProgress}%` }}
            />
          </div>

          <div className="grid grid-cols-2 gap-4 pt-2">
            <div className="text-center p-3 bg-status-pass/10 rounded-lg">
              <p className="text-2xl font-bold text-status-pass">{stats.completed}</p>
              <p className="text-xs text-muted-foreground">완료</p>
            </div>
            <div className="text-center p-3 bg-destructive/10 rounded-lg">
              <p className="text-2xl font-bold text-destructive">{stats.resigned}</p>
              <p className="text-xs text-muted-foreground">퇴사</p>
            </div>
          </div>

          <div className="pt-2 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">퇴사율</span>
              <span className="font-medium">{stats.resignationRate}%</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">이번주 미팅</span>
              <span className="font-medium">{stats.meetingsThisWeek}건</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
});

// Compact stats for sidebar or summary
interface CompactStatsProps {
  stats: NewTQCDashboardStats | null;
}

export const NewTQCCompactStats = memo(function NewTQCCompactStats({
  stats,
}: CompactStatsProps) {
  if (!stats) return null;

  return (
    <div className="grid grid-cols-2 gap-3">
      <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
        <Users className="h-5 w-5 text-primary" />
        <div>
          <p className="text-xs text-muted-foreground">교육중</p>
          <p className="text-lg font-bold">{stats.inTraining}</p>
        </div>
      </div>
      <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
        <GraduationCap className="h-5 w-5 text-status-pass" />
        <div>
          <p className="text-xs text-muted-foreground">완료</p>
          <p className="text-lg font-bold">{stats.completed}</p>
        </div>
      </div>
      <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
        <Calendar className="h-5 w-5 text-orange-500" />
        <div>
          <p className="text-xs text-muted-foreground">예정 미팅</p>
          <p className="text-lg font-bold">{stats.meetingsPending}</p>
        </div>
      </div>
      <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
        <UserMinus className="h-5 w-5 text-destructive" />
        <div>
          <p className="text-xs text-muted-foreground">퇴사</p>
          <p className="text-lg font-bold">{stats.resigned}</p>
        </div>
      </div>
    </div>
  );
});
