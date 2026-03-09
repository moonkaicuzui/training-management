import { useTranslation } from 'react-i18next';
import {
  Calendar,
  Target,
  Users,
  BarChart3,
  ChevronRight,
  Building2,
  FileText,
  Edit,
  AlertTriangle,
  Clock,
  CheckCircle2,
  XCircle,
  RefreshCw,
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
import type { AnnualPlan } from '@/services/trainingPlanService';

// --- Shared Types ---

export interface DepartmentStat {
  name: string;
  total: number;
  completed: number;
  rate: number;
}

export interface QualityMetrics {
  retrainingCount: number;
  expiringCount: number;
  passRate: number;
}

// --- MonthlyCalendarView ---

export function MonthlyCalendarView({ plan }: { plan: AnnualPlan }) {
  const { t } = useTranslation();
  const months = [
    t('trainingPlan.months.jan'), t('trainingPlan.months.feb'), t('trainingPlan.months.mar'),
    t('trainingPlan.months.apr'), t('trainingPlan.months.may'), t('trainingPlan.months.jun'),
    t('trainingPlan.months.jul'), t('trainingPlan.months.aug'), t('trainingPlan.months.sep'),
    t('trainingPlan.months.oct'), t('trainingPlan.months.nov'), t('trainingPlan.months.dec'),
  ];

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
              <p className="text-xs text-muted-foreground">{t('trainingPlan.status.scheduled')}</p>
            </div>
            {programsInMonth.length > 0 && (
              <div className="mt-2 space-y-1">
                {programsInMonth.slice(0, 2).map((prog) => (
                  <Badge key={prog.program_code} variant="outline" className="text-xs w-full justify-start truncate">
                    {prog.program_name}
                  </Badge>
                ))}
                {programsInMonth.length > 2 && (
                  <p className="text-xs text-muted-foreground text-center">+{programsInMonth.length - 2}{t('trainingPlan.countUnit')}</p>
                )}
              </div>
            )}
          </Card>
        );
      })}
    </div>
  );
}

// --- DepartmentTrainingStatus ---

export function DepartmentTrainingStatus({ departments }: { departments: DepartmentStat[] }) {
  const { t } = useTranslation();
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Building2 className="h-5 w-5" />
          {t('trainingPlan.departmentTrainingStatus')}
        </CardTitle>
        <CardDescription>
          {t('trainingPlan.departmentAnnualStatus')}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {departments.map((dept) => (
            <div key={dept.name} className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">{dept.name}</span>
                <span className="text-muted-foreground">
                  {dept.completed}/{dept.total}{t('trainingPlan.personUnit')} ({dept.rate}%)
                </span>
              </div>
              <Progress value={dept.rate} className="h-2" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// --- OverviewTabContent ---

export function OverviewTabContent({
  currentYearPlan,
  stats,
  filteredPlans,
  selectedYear,
  onYearChange,
  onViewDetail,
}: {
  currentYearPlan: AnnualPlan | undefined;
  stats: { programs: number; sessions: number; participants: number; progress: number };
  filteredPlans: AnnualPlan[];
  selectedYear: string;
  onYearChange: (year: string) => void;
  onViewDetail: (plan: AnnualPlan) => void;
}) {
  const { t } = useTranslation();

  return (
    <>
      {/* 금년 계획 요약 */}
      {currentYearPlan && (
        <Card className="bg-gradient-to-r from-primary/10 to-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              {t('trainingPlan.yearPlanStatus', { year: new Date().getFullYear() })}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-4">
              <div className="text-center p-4 bg-white rounded-lg shadow-sm">
                <Target className="h-8 w-8 text-blue-500 mx-auto mb-2" />
                <p className="text-2xl font-bold">{stats.programs}</p>
                <p className="text-xs text-muted-foreground">{t('trainingPlan.trainingPrograms')}</p>
              </div>
              <div className="text-center p-4 bg-white rounded-lg shadow-sm">
                <Calendar className="h-8 w-8 text-green-500 mx-auto mb-2" />
                <p className="text-2xl font-bold">{stats.sessions}</p>
                <p className="text-xs text-muted-foreground">{t('trainingPlan.plannedSessions')}</p>
              </div>
              <div className="text-center p-4 bg-white rounded-lg shadow-sm">
                <Users className="h-8 w-8 text-purple-500 mx-auto mb-2" />
                <p className="text-2xl font-bold">{stats.participants}</p>
                <p className="text-xs text-muted-foreground">{t('trainingPlan.targetParticipants')}</p>
              </div>
              <div className="text-center p-4 bg-white rounded-lg shadow-sm">
                <BarChart3 className="h-8 w-8 text-orange-500 mx-auto mb-2" />
                <p className="text-2xl font-bold">{stats.progress}%</p>
                <p className="text-xs text-muted-foreground">{t('trainingPlan.progressRate')}</p>
              </div>
            </div>
            <div className="mt-4">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm">{t('trainingPlan.annualProgress')}</span>
                <span className="text-sm font-bold">{stats.progress}%</span>
              </div>
              <Progress value={stats.progress} className="h-3" />
            </div>
            <div className="mt-4 flex justify-end">
              <Button variant="outline" onClick={() => onViewDetail(currentYearPlan)}>
                {t('trainingPlan.viewDetail')}
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
            <CardTitle>{t('trainingPlan.monthlySchedule')}</CardTitle>
            <CardDescription>{t('trainingPlan.monthlyScheduleDescription', { year: new Date().getFullYear() })}</CardDescription>
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
              <CardTitle>{t('trainingPlan.planList')}</CardTitle>
              <CardDescription>{t('trainingPlan.planListDescription')}</CardDescription>
            </div>
            <Select value={selectedYear} onValueChange={onYearChange}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('common.all')}</SelectItem>
                <SelectItem value="2025">2025</SelectItem>
                <SelectItem value="2024">2024</SelectItem>
                <SelectItem value="2023">2023</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('trainingPlan.planName')}</TableHead>
                <TableHead>{t('trainingPlan.year')}</TableHead>
                <TableHead>{t('trainingPlan.period')}</TableHead>
                <TableHead>{t('trainingPlan.program')}</TableHead>
                <TableHead>{t('trainingPlan.sessions')}</TableHead>
                <TableHead>{t('trainingPlan.budget')}</TableHead>
                <TableHead>{t('common.status')}</TableHead>
                <TableHead>{t('trainingPlan.progressRate')}</TableHead>
                <TableHead className="text-right">{t('common.actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPlans.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                    <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    {t('trainingPlan.noPlans')}
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
                      <TableCell>{plan.year}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {plan.period === 'YEARLY' ? t('trainingPlan.periodType.yearly') :
                           plan.period === 'QUARTERLY' ? t('trainingPlan.periodType.quarterly') : t('trainingPlan.periodType.monthly')}
                        </Badge>
                      </TableCell>
                      <TableCell>{plan.planned_programs.length}</TableCell>
                      <TableCell>{totalSessions}</TableCell>
                      <TableCell>
                        {plan.total_budget ? `${(plan.total_budget / 100000000).toFixed(1)}${t('trainingPlan.hundredMillionUnit')}` : '-'}
                      </TableCell>
                      <TableCell>
                        <Badge variant={
                          plan.status === 'COMPLETED' ? 'success' :
                          plan.status === 'IN_PROGRESS' ? 'default' :
                          plan.status === 'APPROVED' ? 'secondary' : 'outline'
                        }>
                          {plan.status === 'DRAFT' ? t('trainingPlan.status.draft') :
                           plan.status === 'APPROVED' ? t('trainingPlan.status.approved') :
                           plan.status === 'IN_PROGRESS' ? t('trainingPlan.status.inProgress') : t('trainingPlan.status.completed')}
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
                          <Button variant="ghost" size="sm" onClick={() => onViewDetail(plan)}>
                            {t('common.detail')}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label={t('trainingPlan.editPlan')}
                            onClick={() => onViewDetail(plan)}
                          >
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
    </>
  );
}

// --- DepartmentsTabContent ---

export function DepartmentsTabContent({
  departmentStats,
  qualityMetrics,
}: {
  departmentStats: DepartmentStat[];
  qualityMetrics: QualityMetrics;
}) {
  const { t } = useTranslation();

  return (
    <>
      <DepartmentTrainingStatus departments={departmentStats} />

      {/* 부서별 상세 현황 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t('trainingPlan.departmentCompletionDetail')}</CardTitle>
          <CardDescription>
            {t('trainingPlan.departmentCompletionDescription')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('trainingPlan.department')}</TableHead>
                <TableHead className="text-center">{t('trainingPlan.totalEmployees')}</TableHead>
                <TableHead className="text-center">{t('trainingPlan.completedCount')}</TableHead>
                <TableHead className="text-center">{t('trainingPlan.incompleteCount')}</TableHead>
                <TableHead className="text-center">{t('trainingPlan.completionRate')}</TableHead>
                <TableHead className="text-center">{t('common.status')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {departmentStats.map((dept) => (
                <TableRow key={dept.name}>
                  <TableCell className="font-medium">{dept.name}</TableCell>
                  <TableCell className="text-center">{dept.total}</TableCell>
                  <TableCell className="text-center text-green-600 font-medium">
                    {dept.completed}
                  </TableCell>
                  <TableCell className="text-center text-red-600 font-medium">
                    {dept.total - dept.completed}
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center gap-2">
                      <Progress value={dept.rate} className="w-16 h-2" />
                      <span className="text-sm font-medium">{dept.rate}%</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    {dept.rate >= 95 ? (
                      <Badge variant="success">{t('trainingPlan.rating.excellent')}</Badge>
                    ) : dept.rate >= 80 ? (
                      <Badge variant="secondary">{t('trainingPlan.rating.good')}</Badge>
                    ) : dept.rate >= 60 ? (
                      <Badge variant="warning">{t('trainingPlan.rating.caution')}</Badge>
                    ) : (
                      <Badge variant="destructive">{t('trainingPlan.rating.poor')}</Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* 권고사항 */}
      <Card className="border-blue-200 bg-blue-50/50">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-blue-500" />
            {t('trainingPlan.qualityManagerRecommendations')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm">
            {departmentStats.filter(d => d.rate < 80).map((dept) => (
              <li key={dept.name} className="flex items-start gap-2">
                <XCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                <span>
                  {t('trainingPlan.recommendation.belowTarget', { dept: dept.name, rate: dept.rate })}
                </span>
              </li>
            ))}
            {qualityMetrics.retrainingCount > 0 && (
              <li className="flex items-start gap-2">
                <RefreshCw className="h-4 w-4 text-orange-500 mt-0.5 flex-shrink-0" />
                <span>
                  {t('trainingPlan.recommendation.includeRetraining', { count: qualityMetrics.retrainingCount })}
                </span>
              </li>
            )}
            {qualityMetrics.expiringCount > 0 && (
              <li className="flex items-start gap-2">
                <Clock className="h-4 w-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                <span>
                  {t('trainingPlan.recommendation.expiringTraining', { count: qualityMetrics.expiringCount })}
                </span>
              </li>
            )}
            {departmentStats.every(d => d.rate >= 80) && qualityMetrics.retrainingCount === 0 && (
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span>
                  {t('trainingPlan.recommendation.allTargetsMet')}
                </span>
              </li>
            )}
          </ul>
        </CardContent>
      </Card>
    </>
  );
}
