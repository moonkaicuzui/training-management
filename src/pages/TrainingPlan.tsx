import { useState, useMemo } from 'react';
import {
  Calendar,
  Plus,
  Target,
  Users,
  ChevronRight,
  ChevronDown,
  FileText,
  BarChart3,
  Download,
  Edit,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';

interface PlannedProgramLocal {
  program_code: string;
  program_name: string;
  planned_sessions: number;
  target_participants: number;
  scheduled_months: number[];
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  budget?: number;
  actual_sessions: number;
  actual_participants: number;
  completion_rate: number;
}

interface AnnualPlan {
  plan_id: string;
  plan_name: string;
  year: number;
  period: 'YEARLY' | 'QUARTERLY' | 'MONTHLY';
  status: 'DRAFT' | 'APPROVED' | 'IN_PROGRESS' | 'COMPLETED';
  planned_programs: PlannedProgramLocal[];
  total_budget?: number;
  created_by: string;
  created_at: string;
}

// 샘플 연간 계획 데이터
const samplePlans: AnnualPlan[] = [
  {
    plan_id: 'PLAN-2025-001',
    plan_name: '2025년 연간 교육 계획',
    year: 2025,
    period: 'YEARLY',
    status: 'IN_PROGRESS',
    total_budget: 500000000,
    created_by: 'admin',
    created_at: '2024-12-01',
    planned_programs: [
      {
        program_code: 'QIP-001',
        program_name: 'QIP 기본 교육',
        planned_sessions: 12,
        target_participants: 240,
        scheduled_months: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
        priority: 'HIGH',
        budget: 50000000,
        actual_sessions: 0,
        actual_participants: 0,
        completion_rate: 0,
      },
      {
        program_code: 'QIP-002',
        program_name: 'SPC 교육',
        planned_sessions: 6,
        target_participants: 120,
        scheduled_months: [1, 3, 5, 7, 9, 11],
        priority: 'HIGH',
        budget: 30000000,
        actual_sessions: 0,
        actual_participants: 0,
        completion_rate: 0,
      },
      {
        program_code: 'QIP-003',
        program_name: '검사 기법',
        planned_sessions: 4,
        target_participants: 80,
        scheduled_months: [2, 5, 8, 11],
        priority: 'MEDIUM',
        budget: 20000000,
        actual_sessions: 0,
        actual_participants: 0,
        completion_rate: 0,
      },
      {
        program_code: 'PRO-001',
        program_name: '생산 관리',
        planned_sessions: 6,
        target_participants: 180,
        scheduled_months: [1, 3, 5, 7, 9, 11],
        priority: 'HIGH',
        budget: 40000000,
        actual_sessions: 0,
        actual_participants: 0,
        completion_rate: 0,
      },
    ],
  },
  {
    plan_id: 'PLAN-2024-001',
    plan_name: '2024년 연간 교육 계획',
    year: 2024,
    period: 'YEARLY',
    status: 'COMPLETED',
    total_budget: 450000000,
    created_by: 'admin',
    created_at: '2023-12-01',
    planned_programs: [
      {
        program_code: 'QIP-001',
        program_name: 'QIP 기본 교육',
        planned_sessions: 12,
        target_participants: 240,
        scheduled_months: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
        priority: 'HIGH',
        budget: 45000000,
        actual_sessions: 12,
        actual_participants: 235,
        completion_rate: 100,
      },
      {
        program_code: 'QIP-002',
        program_name: 'SPC 교육',
        planned_sessions: 6,
        target_participants: 120,
        scheduled_months: [1, 3, 5, 7, 9, 11],
        priority: 'HIGH',
        budget: 28000000,
        actual_sessions: 6,
        actual_participants: 118,
        completion_rate: 100,
      },
    ],
  },
];

// 월별 캘린더 뷰 컴포넌트
function MonthlyCalendarView({ plan }: { plan: AnnualPlan }) {
  const months = ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'];

  return (
    <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
      {months.map((month, idx) => {
        const monthNum = idx + 1;
        const programsInMonth = plan.planned_programs.filter(p =>
          p.scheduled_months?.includes(monthNum)
        );
        const currentMonth = new Date().getMonth() + 1;
        const isPast = plan.year < new Date().getFullYear() ||
          (plan.year === new Date().getFullYear() && monthNum < currentMonth);
        const isCurrent = plan.year === new Date().getFullYear() && monthNum === currentMonth;

        return (
          <Card
            key={month}
            className={`p-2 ${isCurrent ? 'ring-2 ring-primary' : ''} ${isPast ? 'opacity-60' : ''}`}
          >
            <div className="text-center">
              <p className={`text-sm font-medium ${isCurrent ? 'text-primary' : ''}`}>{month}</p>
              <p className="text-2xl font-bold">{programsInMonth.length}</p>
              <p className="text-xs text-muted-foreground">교육 예정</p>
            </div>
            {programsInMonth.length > 0 && (
              <div className="mt-2 space-y-1">
                {programsInMonth.slice(0, 2).map((prog) => (
                  <Badge key={prog.program_code} variant="outline" className="text-xs w-full justify-start truncate">
                    {prog.program_name}
                  </Badge>
                ))}
                {programsInMonth.length > 2 && (
                  <p className="text-xs text-muted-foreground text-center">+{programsInMonth.length - 2}개</p>
                )}
              </div>
            )}
          </Card>
        );
      })}
    </div>
  );
}

// 계획 상세 다이얼로그
function PlanDetailDialog({
  open,
  onClose,
  plan,
}: {
  open: boolean;
  onClose: () => void;
  plan: AnnualPlan | null;
}) {
  const [expandedPrograms, setExpandedPrograms] = useState<Set<string>>(new Set());

  if (!plan) return null;

  const toggleProgram = (code: string) => {
    const newExpanded = new Set(expandedPrograms);
    if (newExpanded.has(code)) {
      newExpanded.delete(code);
    } else {
      newExpanded.add(code);
    }
    setExpandedPrograms(newExpanded);
  };

  const totalStats = plan.planned_programs.reduce(
    (acc, prog) => ({
      sessions: acc.sessions + prog.planned_sessions,
      participants: acc.participants + prog.target_participants,
      actualSessions: acc.actualSessions + prog.actual_sessions,
      actualParticipants: acc.actualParticipants + prog.actual_participants,
    }),
    { sessions: 0, participants: 0, actualSessions: 0, actualParticipants: 0 }
  );

  const overallProgress = totalStats.sessions > 0
    ? Math.round((totalStats.actualSessions / totalStats.sessions) * 100)
    : 0;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            {plan.plan_name}
          </DialogTitle>
          <DialogDescription>
            기간: {plan.year}년 | 상태: {
              plan.status === 'DRAFT' ? '초안' :
              plan.status === 'APPROVED' ? '승인됨' :
              plan.status === 'IN_PROGRESS' ? '진행중' : '완료'
            }
          </DialogDescription>
        </DialogHeader>

        {/* 전체 진행률 */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">전체 진행률</span>
              <span className="text-sm font-bold">{overallProgress}%</span>
            </div>
            <Progress value={overallProgress} className="h-2" />
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div className="text-center p-2 bg-muted rounded">
                <p className="text-lg font-bold">{totalStats.actualSessions}/{totalStats.sessions}</p>
                <p className="text-xs text-muted-foreground">완료/계획 세션</p>
              </div>
              <div className="text-center p-2 bg-muted rounded">
                <p className="text-lg font-bold">{totalStats.actualParticipants}/{totalStats.participants}</p>
                <p className="text-xs text-muted-foreground">완료/목표 인원</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 월별 캘린더 */}
        <div>
          <h4 className="text-sm font-medium mb-3">월별 교육 일정</h4>
          <MonthlyCalendarView plan={plan} />
        </div>

        {/* 프로그램별 상세 */}
        <div>
          <h4 className="text-sm font-medium mb-3">프로그램별 계획</h4>
          <div className="space-y-2">
            {plan.planned_programs.map((prog) => {
              const isExpanded = expandedPrograms.has(prog.program_code);

              return (
                <Collapsible key={prog.program_code} open={isExpanded} onOpenChange={() => toggleProgram(prog.program_code)}>
                  <Card>
                    <CollapsibleTrigger className="w-full">
                      <CardContent className="p-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                            <div className="text-left">
                              <p className="font-medium">{prog.program_name}</p>
                              <p className="text-xs text-muted-foreground">{prog.program_code}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <Badge variant={
                              prog.priority === 'HIGH' ? 'destructive' :
                              prog.priority === 'MEDIUM' ? 'warning' : 'secondary'
                            }>
                              {prog.priority === 'HIGH' ? '높음' : prog.priority === 'MEDIUM' ? '보통' : '낮음'}
                            </Badge>
                            <div className="text-right">
                              <p className="text-sm font-bold">{prog.completion_rate}%</p>
                              <p className="text-xs text-muted-foreground">완료율</p>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <CardContent className="pt-0 pb-3 px-3">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-3 bg-muted rounded-lg">
                          <div>
                            <p className="text-xs text-muted-foreground">계획 세션</p>
                            <p className="font-bold">{prog.planned_sessions}회</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">완료 세션</p>
                            <p className="font-bold">{prog.actual_sessions}회</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">목표 인원</p>
                            <p className="font-bold">{prog.target_participants}명</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">실제 참여</p>
                            <p className="font-bold">{prog.actual_participants}명</p>
                          </div>
                        </div>
                        <div className="mt-3">
                          <p className="text-xs text-muted-foreground mb-1">예정 월</p>
                          <div className="flex flex-wrap gap-1">
                            {prog.scheduled_months?.map((month) => (
                              <Badge key={month} variant="outline" className="text-xs">
                                {month}월
                              </Badge>
                            ))}
                          </div>
                        </div>
                        {prog.budget && (
                          <div className="mt-2">
                            <p className="text-xs text-muted-foreground">예산</p>
                            <p className="font-medium">{prog.budget.toLocaleString()}원</p>
                          </div>
                        )}
                      </CardContent>
                    </CollapsibleContent>
                  </Card>
                </Collapsible>
              );
            })}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            닫기
          </Button>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            내보내기
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function TrainingPlanPage() {
  const [plans] = useState<AnnualPlan[]>(samplePlans);
  const [selectedYear, setSelectedYear] = useState<string>(new Date().getFullYear().toString());
  const [selectedPlan, setSelectedPlan] = useState<AnnualPlan | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);

  // 연도별 계획 필터링
  const filteredPlans = useMemo(() => {
    return plans.filter(plan =>
      selectedYear === 'all' || plan.year.toString() === selectedYear
    );
  }, [plans, selectedYear]);

  // 현재 연도 계획
  const currentYearPlan = plans.find(p => p.year === new Date().getFullYear());

  // 통계
  const stats = useMemo(() => {
    if (!currentYearPlan) return { programs: 0, sessions: 0, participants: 0, progress: 0 };

    const totalSessions = currentYearPlan.planned_programs.reduce((acc, p) => acc + p.planned_sessions, 0);
    const completedSessions = currentYearPlan.planned_programs.reduce((acc, p) => acc + p.actual_sessions, 0);

    return {
      programs: currentYearPlan.planned_programs.length,
      sessions: totalSessions,
      participants: currentYearPlan.planned_programs.reduce((acc, p) => acc + p.target_participants, 0),
      progress: totalSessions > 0 ? Math.round((completedSessions / totalSessions) * 100) : 0,
    };
  }, [currentYearPlan]);

  const handleViewDetail = (plan: AnnualPlan) => {
    setSelectedPlan(plan);
    setDetailDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">연간 교육 계획</h1>
          <p className="text-muted-foreground">교육 계획 수립 및 진행 현황 관리</p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          새 계획 수립
        </Button>
      </div>

      {/* 금년 계획 요약 */}
      {currentYearPlan && (
        <Card className="bg-gradient-to-r from-primary/10 to-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              {new Date().getFullYear()}년 교육 계획 현황
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-4">
              <div className="text-center p-4 bg-white rounded-lg shadow-sm">
                <Target className="h-8 w-8 text-blue-500 mx-auto mb-2" />
                <p className="text-2xl font-bold">{stats.programs}</p>
                <p className="text-xs text-muted-foreground">교육 프로그램</p>
              </div>
              <div className="text-center p-4 bg-white rounded-lg shadow-sm">
                <Calendar className="h-8 w-8 text-green-500 mx-auto mb-2" />
                <p className="text-2xl font-bold">{stats.sessions}</p>
                <p className="text-xs text-muted-foreground">계획 세션</p>
              </div>
              <div className="text-center p-4 bg-white rounded-lg shadow-sm">
                <Users className="h-8 w-8 text-purple-500 mx-auto mb-2" />
                <p className="text-2xl font-bold">{stats.participants}</p>
                <p className="text-xs text-muted-foreground">목표 인원</p>
              </div>
              <div className="text-center p-4 bg-white rounded-lg shadow-sm">
                <BarChart3 className="h-8 w-8 text-orange-500 mx-auto mb-2" />
                <p className="text-2xl font-bold">{stats.progress}%</p>
                <p className="text-xs text-muted-foreground">진행률</p>
              </div>
            </div>
            <div className="mt-4">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm">연간 진행률</span>
                <span className="text-sm font-bold">{stats.progress}%</span>
              </div>
              <Progress value={stats.progress} className="h-3" />
            </div>
            <div className="mt-4 flex justify-end">
              <Button variant="outline" onClick={() => handleViewDetail(currentYearPlan)}>
                상세 보기
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 월별 캘린더 미리보기 */}
      {currentYearPlan && (
        <Card>
          <CardHeader>
            <CardTitle>월별 교육 일정</CardTitle>
            <CardDescription>{new Date().getFullYear()}년 월별 교육 예정 현황</CardDescription>
          </CardHeader>
          <CardContent>
            <MonthlyCalendarView plan={currentYearPlan} />
          </CardContent>
        </Card>
      )}

      {/* 계획 목록 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>교육 계획 목록</CardTitle>
              <CardDescription>연도별 교육 계획 관리</CardDescription>
            </div>
            <Select value={selectedYear} onValueChange={setSelectedYear}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체</SelectItem>
                <SelectItem value="2025">2025년</SelectItem>
                <SelectItem value="2024">2024년</SelectItem>
                <SelectItem value="2023">2023년</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>계획명</TableHead>
                <TableHead>연도</TableHead>
                <TableHead>기간</TableHead>
                <TableHead>프로그램</TableHead>
                <TableHead>세션</TableHead>
                <TableHead>예산</TableHead>
                <TableHead>상태</TableHead>
                <TableHead>진행률</TableHead>
                <TableHead className="text-right">액션</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPlans.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                    <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    등록된 교육 계획이 없습니다
                  </TableCell>
                </TableRow>
              ) : (
                filteredPlans.map((plan) => {
                  const totalSessions = plan.planned_programs.reduce((acc, p) => acc + p.planned_sessions, 0);
                  const completedSessions = plan.planned_programs.reduce((acc, p) => acc + p.actual_sessions, 0);
                  const progress = totalSessions > 0 ? Math.round((completedSessions / totalSessions) * 100) : 0;

                  return (
                    <TableRow key={plan.plan_id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{plan.plan_name}</p>
                          <p className="text-xs text-muted-foreground">{plan.plan_id}</p>
                        </div>
                      </TableCell>
                      <TableCell>{plan.year}년</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {plan.period === 'YEARLY' ? '연간' :
                           plan.period === 'QUARTERLY' ? '분기' : '월간'}
                        </Badge>
                      </TableCell>
                      <TableCell>{plan.planned_programs.length}개</TableCell>
                      <TableCell>{totalSessions}회</TableCell>
                      <TableCell>
                        {plan.total_budget ? `${(plan.total_budget / 100000000).toFixed(1)}억` : '-'}
                      </TableCell>
                      <TableCell>
                        <Badge variant={
                          plan.status === 'COMPLETED' ? 'success' :
                          plan.status === 'IN_PROGRESS' ? 'default' :
                          plan.status === 'APPROVED' ? 'secondary' : 'outline'
                        }>
                          {plan.status === 'DRAFT' ? '초안' :
                           plan.status === 'APPROVED' ? '승인됨' :
                           plan.status === 'IN_PROGRESS' ? '진행중' : '완료'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Progress value={progress} className="w-16 h-2" />
                          <span className="text-sm">{progress}%</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button variant="ghost" size="sm" onClick={() => handleViewDetail(plan)}>
                            상세
                          </Button>
                          <Button variant="ghost" size="icon">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* 계획 상세 다이얼로그 */}
      <PlanDetailDialog
        open={detailDialogOpen}
        onClose={() => setDetailDialogOpen(false)}
        plan={selectedPlan}
      />
    </div>
  );
}
