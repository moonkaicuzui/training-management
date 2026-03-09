import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Calendar,
  Plus,
  ChevronRight,
  ChevronDown,
  Download,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Card,
  CardContent,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MonthlyCalendarView } from './TrainingPlanCalendar';
import type { AnnualPlan } from '@/services/trainingPlanService';

// --- PlanDetailDialog ---

export function PlanDetailDialog({
  open,
  onClose,
  plan,
}: {
  open: boolean;
  onClose: () => void;
  plan: AnnualPlan | null;
}) {
  const { t } = useTranslation();
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
            {t('trainingPlan.year')}: {plan.year} | {t('common.status')}: {
              plan.status === 'DRAFT' ? t('trainingPlan.status.draft') :
              plan.status === 'APPROVED' ? t('trainingPlan.status.approved') :
              plan.status === 'IN_PROGRESS' ? t('trainingPlan.status.inProgress') : t('trainingPlan.status.completed')
            }
          </DialogDescription>
        </DialogHeader>

        {/* 전체 진행률 */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">{t('trainingPlan.overallProgress')}</span>
              <span className="text-sm font-bold">{overallProgress}%</span>
            </div>
            <Progress value={overallProgress} className="h-2" />
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div className="text-center p-2 bg-muted rounded">
                <p className="text-lg font-bold">{totalStats.actualSessions}/{totalStats.sessions}</p>
                <p className="text-xs text-muted-foreground">{t('trainingPlan.completedPlannedSessions')}</p>
              </div>
              <div className="text-center p-2 bg-muted rounded">
                <p className="text-lg font-bold">{totalStats.actualParticipants}/{totalStats.participants}</p>
                <p className="text-xs text-muted-foreground">{t('trainingPlan.completedTargetParticipants')}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 월별 캘린더 */}
        <div>
          <h4 className="text-sm font-medium mb-3">{t('trainingPlan.monthlySchedule')}</h4>
          <MonthlyCalendarView plan={plan} />
        </div>

        {/* 프로그램별 상세 */}
        <div>
          <h4 className="text-sm font-medium mb-3">{t('trainingPlan.programPlan')}</h4>
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
                              {prog.priority === 'HIGH' ? t('trainingPlan.priority.high') : prog.priority === 'MEDIUM' ? t('trainingPlan.priority.medium') : t('trainingPlan.priority.low')}
                            </Badge>
                            <div className="text-right">
                              <p className="text-sm font-bold">{prog.completion_rate}%</p>
                              <p className="text-xs text-muted-foreground">{t('trainingPlan.completionRate')}</p>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <CardContent className="pt-0 pb-3 px-3">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-3 bg-muted rounded-lg">
                          <div>
                            <p className="text-xs text-muted-foreground">{t('trainingPlan.plannedSessions')}</p>
                            <p className="font-bold">{prog.planned_sessions}{t('trainingPlan.sessionUnit')}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">{t('trainingPlan.completedSessions')}</p>
                            <p className="font-bold">{prog.actual_sessions}{t('trainingPlan.sessionUnit')}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">{t('trainingPlan.targetParticipants')}</p>
                            <p className="font-bold">{prog.target_participants}{t('trainingPlan.personUnit')}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">{t('trainingPlan.actualParticipants')}</p>
                            <p className="font-bold">{prog.actual_participants}{t('trainingPlan.personUnit')}</p>
                          </div>
                        </div>
                        <div className="mt-3">
                          <p className="text-xs text-muted-foreground mb-1">{t('trainingPlan.scheduledMonths')}</p>
                          <div className="flex flex-wrap gap-1">
                            {prog.scheduled_months?.map((month) => {
                              const monthKeys = ['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec'];
                              return (
                                <Badge key={month} variant="outline" className="text-xs">
                                  {t(`trainingPlan.months.${monthKeys[month - 1]}`)}
                                </Badge>
                              );
                            })}
                          </div>
                        </div>
                        {prog.budget && (
                          <div className="mt-2">
                            <p className="text-xs text-muted-foreground">{t('trainingPlan.budget')}</p>
                            <p className="font-medium">{prog.budget.toLocaleString()}{t('trainingPlan.currencyUnit')}</p>
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
            {t('common.close')}
          </Button>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            {t('common.export')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// --- CreatePlanDialog ---

export interface CreatePlanFormData {
  plan_name: string;
  year: number;
  period: AnnualPlan['period'];
  total_budget: number;
}

export function CreatePlanDialog({
  open,
  onOpenChange,
  formData,
  onFormDataChange,
  onSubmit,
  isCreating,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  formData: CreatePlanFormData;
  onFormDataChange: (data: CreatePlanFormData) => void;
  onSubmit: () => void;
  isCreating: boolean;
}) {
  const { t } = useTranslation();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            {t('trainingPlan.addPlan')}
          </DialogTitle>
          <DialogDescription>
            {t('trainingPlan.description')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="plan_name">{t('trainingPlan.planName')} *</Label>
            <Input
              id="plan_name"
              placeholder={t('trainingPlan.planNamePlaceholder')}
              value={formData.plan_name}
              onChange={(e) => onFormDataChange({ ...formData, plan_name: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="year">{t('trainingPlan.year')}</Label>
            <Select
              value={formData.year.toString()}
              onValueChange={(v) => onFormDataChange({ ...formData, year: parseInt(v) })}
            >
              <SelectTrigger id="year">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[2024, 2025, 2026, 2027, 2028].map((y) => (
                  <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="period">{t('trainingPlan.quarter')}</Label>
            <Select
              value={formData.period}
              onValueChange={(v) => onFormDataChange({ ...formData, period: v as AnnualPlan['period'] })}
            >
              <SelectTrigger id="period">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="YEARLY">{t('trainingPlan.periodType.yearly')}</SelectItem>
                <SelectItem value="QUARTERLY">{t('trainingPlan.periodType.quarterly')}</SelectItem>
                <SelectItem value="MONTHLY">{t('trainingPlan.periodType.monthly')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="total_budget">{t('trainingPlan.budgetLabel')}</Label>
            <Input
              id="total_budget"
              type="number"
              min={0}
              placeholder="0"
              value={formData.total_budget || ''}
              onChange={(e) => onFormDataChange({ ...formData, total_budget: parseInt(e.target.value) || 0 })}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isCreating}>
            {t('common.cancel')}
          </Button>
          <Button onClick={onSubmit} disabled={isCreating || !formData.plan_name.trim()}>
            {isCreating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {t('common.saving')}
              </>
            ) : (
              t('common.save')
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
