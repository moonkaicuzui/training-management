/**
 * 프로젝트 관리 대시보드 페이지
 *
 * 프로젝트 현황, 긴급 알림, 팀 성과, 최근 활동 표시
 */

import { useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  LayoutDashboard,
  Users,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Plus,
  ArrowRight,
  Calendar,
  TrendingUp,
} from 'lucide-react';
import { useProjectStore } from '@/stores/projectStore';
import { TASK_STATUS_COLORS, TASK_PRIORITY_COLORS } from '@/types/project';
import type { TaskStatus } from '@/types/project';

// 상태별 라벨
const STATUS_LABELS: Record<TaskStatus, string> = {
  todo: '예정',
  in_progress: '진행중',
  delayed_start: '시작지연',
  delayed_complete: '완료지연',
  review: '검토중',
  done: '완료',
};

export default function ProjectsDashboard() {
  const navigate = useNavigate();
  const {
    members,
    projects,
    tasks,
    fetchMembers,
    fetchProjects,
    isMembersLoading,
    isProjectsLoading,
    subscribeMembersRealtime,
    subscribeProjectsRealtime,
  } = useProjectStore();

  // Use ref to prevent double initialization (anti-pattern fix)
  const initializedRef = useRef(false);

  useEffect(() => {
    if (!initializedRef.current) {
      initializedRef.current = true;
      fetchMembers();
      fetchProjects();
      subscribeMembersRealtime();
      subscribeProjectsRealtime();
    }
  }, [fetchMembers, fetchProjects, subscribeMembersRealtime, subscribeProjectsRealtime]);

  // 통계 계산
  const activeMembers = members.filter((m) => m.status === 'active');
  const activeProjects = projects.filter((p) => p.status === 'active');

  const taskStats = {
    total: tasks.length,
    todo: tasks.filter((t) => t.status === 'todo').length,
    inProgress: tasks.filter((t) => t.status === 'in_progress').length,
    delayed: tasks.filter((t) => t.status === 'delayed_start' || t.status === 'delayed_complete').length,
    done: tasks.filter((t) => t.status === 'done').length,
  };

  const completionRate = taskStats.total > 0
    ? Math.round((taskStats.done / taskStats.total) * 100)
    : 0;

  // 긴급 과제 (마감 3일 이내 또는 지연)
  const urgentTasks = useMemo(() => {
    const now = new Date();
    return tasks.filter((task) => {
      if (task.status === 'delayed_start' || task.status === 'delayed_complete') return true;
      if (task.dueDate) {
        const dueDate = task.dueDate instanceof Date ? task.dueDate : task.dueDate.toDate();
        const daysUntilDue = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        return daysUntilDue <= 3 && daysUntilDue >= 0 && task.status !== 'done';
      }
      return false;
    });
  }, [tasks]);

  const isLoading = isMembersLoading || isProjectsLoading;

  // Show loading only if actively fetching AND no data loaded yet
  if (isLoading && members.length === 0 && projects.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">로딩 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <LayoutDashboard className="h-6 w-6" />
            프로젝트 관리
          </h1>
          <p className="text-muted-foreground mt-1">
            품질 부서 협업 프로젝트 현황을 확인하세요
          </p>
        </div>
        <Button onClick={() => navigate('/projects/tasks')}>
          <Plus className="h-4 w-4 mr-2" />
          새 과제
        </Button>
      </div>

      {/* 통계 카드 */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <Card
          className="cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => navigate('/projects/members')}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">팀원</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeMembers.length}</div>
            <p className="text-xs text-muted-foreground">활성 팀원</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">프로젝트</CardTitle>
            <LayoutDashboard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeProjects.length}</div>
            <p className="text-xs text-muted-foreground">진행중인 프로젝트</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">과제 완료율</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completionRate}%</div>
            <Progress value={completionRate} className="h-2 mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">지연 과제</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">{taskStats.delayed}</div>
            <p className="text-xs text-muted-foreground">즉시 조치 필요</p>
          </CardContent>
        </Card>
      </div>

      {/* 메인 콘텐츠 그리드 */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* 과제 현황 */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">과제 현황</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => navigate('/projects/tasks')}>
              전체보기 <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {(['todo', 'in_progress', 'delayed_start', 'delayed_complete', 'done'] as TaskStatus[]).map((status) => {
                const count = tasks.filter((t) => t.status === status).length;
                const percentage = taskStats.total > 0 ? (count / taskStats.total) * 100 : 0;

                return (
                  <div key={status} className="flex items-center gap-4">
                    <div className="w-24 text-sm font-medium">{STATUS_LABELS[status]}</div>
                    <div className="flex-1">
                      <div
                        className="h-2 rounded-full"
                        style={{
                          width: `${percentage}%`,
                          backgroundColor: TASK_STATUS_COLORS[status],
                          minWidth: count > 0 ? '8px' : '0',
                        }}
                      />
                    </div>
                    <div className="w-8 text-right text-sm text-muted-foreground">
                      {count}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* 긴급 알림 */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              긴급 알림
            </CardTitle>
            <Badge variant="destructive">{urgentTasks.length}건</Badge>
          </CardHeader>
          <CardContent>
            {urgentTasks.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <CheckCircle2 className="h-12 w-12 mx-auto mb-2 text-green-500" />
                <p>긴급한 과제가 없습니다</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[300px] overflow-y-auto">
                {urgentTasks.slice(0, 5).map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center justify-between p-3 bg-muted/50 rounded-lg cursor-pointer hover:bg-muted transition-colors"
                    onClick={() => navigate('/projects/tasks')}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{task.title}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge
                          variant="outline"
                          style={{
                            borderColor: TASK_STATUS_COLORS[task.status],
                            color: TASK_STATUS_COLORS[task.status],
                          }}
                        >
                          {STATUS_LABELS[task.status]}
                        </Badge>
                        {task.dueDate && (
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {(task.dueDate instanceof Date
                              ? task.dueDate
                              : task.dueDate.toDate()
                            ).toLocaleDateString('ko-KR')}
                          </span>
                        )}
                      </div>
                    </div>
                    <Badge
                      style={{
                        backgroundColor: TASK_PRIORITY_COLORS[task.priority],
                      }}
                    >
                      {task.priority === 'urgent' ? '긴급' : task.priority === 'high' ? '높음' : '보통'}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 퀵 액션 */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
        <Button
          variant="outline"
          className="h-20 flex flex-col items-center justify-center gap-2"
          onClick={() => navigate('/projects/members')}
        >
          <Users className="h-6 w-6" />
          <span>팀원 관리</span>
        </Button>
        <Button
          variant="outline"
          className="h-20 flex flex-col items-center justify-center gap-2"
          onClick={() => navigate('/projects/tasks')}
        >
          <CheckCircle2 className="h-6 w-6" />
          <span>과제 관리</span>
        </Button>
        <Button
          variant="outline"
          className="h-20 flex flex-col items-center justify-center gap-2"
          onClick={() => navigate('/projects/calendar')}
        >
          <Calendar className="h-6 w-6" />
          <span>캘린더</span>
        </Button>
        <Button
          variant="outline"
          className="h-20 flex flex-col items-center justify-center gap-2"
          onClick={() => navigate('/projects/settings')}
        >
          <TrendingUp className="h-6 w-6" />
          <span>설정</span>
        </Button>
      </div>
    </div>
  );
}
