/**
 * Skill Gap Dashboard Page
 * - Department-wise competency gap visualization
 * - Bar chart: gap percentage by competency
 * - Department average levels vs targets
 * - Priority table: HIGH/MEDIUM/LOW gap items
 */

import { useEffect, useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Loader2, AlertTriangle, CheckCircle2, AlertCircle, BookOpen, ExternalLink } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { LazyBarChart } from '@/components/charts/LazyCharts';
import { CompetencyRadar } from '@/components/competency/CompetencyRadar';
import { useToast } from '@/hooks/use-toast';
import * as api from '@/services/api';
import { cn } from '@/lib/utils';
import type { Employee, Department, TrainingProgram } from '@/types';
import type {
  Competency,
  CompetencyCategory,
  EmployeeCompetency,
  CompetencyGapSummary,
  LearningPath,
} from '@/types/curriculum';
import { COMPETENCY_LEVEL_VALUES } from '@/types/curriculum';

const CATEGORIES: CompetencyCategory[] = [
  'TECHNICAL',
  'QUALITY',
  'SAFETY',
  'LEADERSHIP',
  'COMMUNICATION',
  'PROCESS',
];

export default function SkillGapPage() {
  const { t } = useTranslation();
  const { toast } = useToast();

  const [competencies, setCompetencies] = useState<Competency[]>([]);
  const [employeeCompetencies, setEmployeeCompetencies] = useState<EmployeeCompetency[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [programs, setPrograms] = useState<TrainingProgram[]>([]);
  const [learningPaths, setLearningPaths] = useState<LearningPath[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [deptFilter, setDeptFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  // Action plan dialog
  const [actionDialogOpen, setActionDialogOpen] = useState(false);
  const [selectedGap, setSelectedGap] = useState<CompetencyGapSummary | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [comps, empComps, emps, progs, paths] = await Promise.all([
        api.getCompetencies(),
        api.getEmployeeCompetencies(),
        api.getEmployees(),
        api.getPrograms(),
        api.getLearningPaths(),
      ]);
      setCompetencies(comps.filter((c) => c.is_active));
      setEmployeeCompetencies(empComps);
      setEmployees(emps.filter((e) => e.status === 'ACTIVE'));
      setPrograms(progs.filter((p) => p.is_active));
      setLearningPaths(paths.filter((lp) => lp.is_active));
    } catch (error) {
      toast({ title: t('messages.loadError'), variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  // Find related training programs for a competency gap
  const getRelatedPrograms = (competencyId: string): TrainingProgram[] => {
    // Check learning paths that require this competency
    const relatedProgramCodes = new Set<string>();
    for (const path of learningPaths) {
      const requiresComp = path.required_competencies?.some(
        (rc) => rc.competency_id === competencyId
      );
      if (requiresComp) {
        path.programs.forEach((p) => relatedProgramCodes.add(p.program_code));
      }
    }
    // If found via learning paths, use those
    if (relatedProgramCodes.size > 0) {
      return programs.filter((p) => relatedProgramCodes.has(p.program_code));
    }
    // Fallback: match by competency category → program category
    const comp = competencies.find((c) => c.competency_id === competencyId);
    if (!comp) return [];
    const categoryMap: Record<string, string[]> = {
      TECHNICAL: ['QIP', 'Technical'],
      QUALITY: ['QIP', 'Quality'],
      SAFETY: ['Safety'],
      LEADERSHIP: ['Leadership', 'Promotion'],
      COMMUNICATION: ['General'],
      PROCESS: ['Process', 'Production'],
    };
    const targetCategories = categoryMap[comp.category] || [];
    return programs.filter((p) =>
      targetCategories.some((cat) =>
        p.category?.toLowerCase().includes(cat.toLowerCase())
      )
    ).slice(0, 5);
  };

  const departments = useMemo(() => {
    return Array.from(new Set(employees.map((e) => e.department))).sort();
  }, [employees]);

  // Calculate gap summaries
  const gapSummaries = useMemo<CompetencyGapSummary[]>(() => {
    const filteredEmployees =
      deptFilter === 'all'
        ? employees
        : employees.filter((e) => e.department === deptFilter);

    const employeeIds = new Set(filteredEmployees.map((e) => e.employee_id));

    let filteredComps = competencies;
    if (categoryFilter !== 'all') {
      filteredComps = competencies.filter((c) => c.category === categoryFilter);
    }

    return filteredComps
      .map((comp) => {
        const records = employeeCompetencies.filter(
          (ec) =>
            ec.competency_id === comp.competency_id &&
            employeeIds.has(ec.employee_id)
        );

        const totalEmployees = filteredEmployees.length;
        const assessedEmployees = records.length;
        const belowTarget = records.filter(
          (ec) =>
            COMPETENCY_LEVEL_VALUES[ec.current_level] <
            COMPETENCY_LEVEL_VALUES[ec.target_level]
        ).length;
        const atTarget = assessedEmployees - belowTarget;

        // Include unassessed employees as below target
        const totalBelowTarget = belowTarget + (totalEmployees - assessedEmployees);
        const gapPercentage =
          totalEmployees > 0
            ? Math.round((totalBelowTarget / totalEmployees) * 100)
            : 0;

        let priority: 'HIGH' | 'MEDIUM' | 'LOW' = 'LOW';
        if (gapPercentage >= 60) priority = 'HIGH';
        else if (gapPercentage >= 30) priority = 'MEDIUM';

        return {
          competency: comp,
          total_employees: totalEmployees,
          at_target: atTarget,
          below_target: totalBelowTarget,
          gap_percentage: gapPercentage,
          priority,
        };
      })
      .sort((a, b) => b.gap_percentage - a.gap_percentage);
  }, [competencies, employeeCompetencies, employees, deptFilter, categoryFilter]);

  // Stats
  const stats = useMemo(() => {
    const high = gapSummaries.filter((g) => g.priority === 'HIGH').length;
    const medium = gapSummaries.filter((g) => g.priority === 'MEDIUM').length;
    const low = gapSummaries.filter((g) => g.priority === 'LOW').length;
    const avgGap =
      gapSummaries.length > 0
        ? Math.round(
            gapSummaries.reduce((sum, g) => sum + g.gap_percentage, 0) /
              gapSummaries.length
          )
        : 0;
    return { high, medium, low, avgGap };
  }, [gapSummaries]);

  // Chart data: gap percentage by competency (top 15)
  const gapChartData = useMemo(() => {
    return gapSummaries.slice(0, 15).map((g) => ({
      name: g.competency.competency_code,
      gap: g.gap_percentage,
      atTarget: 100 - g.gap_percentage,
    }));
  }, [gapSummaries]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div>
        <h1 className="text-2xl font-bold">{t('skillGap.title')}</h1>
        <p className="text-muted-foreground">{t('skillGap.description')}</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <Select value={deptFilter} onValueChange={setDeptFilter}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder={t('skillGap.allDepartments')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('skillGap.allDepartments')}</SelectItem>
            {departments.map((dept) => (
              <SelectItem key={dept} value={dept}>
                {t(`department.${dept}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder={t('competency.allCategories')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('common.all')}</SelectItem>
            {CATEGORIES.map((cat) => (
              <SelectItem key={cat} value={cat}>
                {t(`competency.category.${cat}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Summary Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>{t('skillGap.avgGap')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.avgGap}%</div>
          </CardContent>
        </Card>
        <Card className="border-destructive/50">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1">
              <AlertTriangle className="h-3.5 w-3.5 text-destructive" />
              {t('skillGap.highPriority')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{stats.high}</div>
          </CardContent>
        </Card>
        <Card className="border-yellow-500/50">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1">
              <AlertCircle className="h-3.5 w-3.5 text-yellow-600" />
              {t('skillGap.mediumPriority')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.medium}</div>
          </CardContent>
        </Card>
        <Card className="border-green-500/50">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1">
              <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
              {t('skillGap.lowPriority')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.low}</div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Gap Percentage by Competency */}
        <Card>
          <CardHeader>
            <CardTitle>{t('skillGap.gapChart.title')}</CardTitle>
            <CardDescription>{t('skillGap.gapChart.description')}</CardDescription>
          </CardHeader>
          <CardContent>
            {gapChartData.length > 0 ? (
              <LazyBarChart
                data={gapChartData}
                height={350}
                xAxisKey="name"
                bars={[
                  {
                    dataKey: 'gap',
                    name: t('skillGap.gapChart.belowTarget'),
                    fill: '#ef4444',
                    radius: [4, 4, 0, 0],
                    stackId: 'stack',
                  },
                  {
                    dataKey: 'atTarget',
                    name: t('skillGap.gapChart.atTarget'),
                    fill: '#22c55e',
                    radius: [4, 4, 0, 0],
                    stackId: 'stack',
                  },
                ]}
              />
            ) : (
              <div className="flex items-center justify-center h-[350px] text-muted-foreground">
                {t('common.noData')}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Department Average vs Target */}
        <Card>
          <CardHeader>
            <CardTitle>{t('skillGap.radarChart.title')}</CardTitle>
            <CardDescription>{t('skillGap.radarChart.description')}</CardDescription>
          </CardHeader>
          <CardContent>
            <CompetencyRadar
              employees={employees}
              competencies={
                categoryFilter !== 'all'
                  ? competencies.filter((c) => c.category === categoryFilter)
                  : competencies
              }
              employeeCompetencies={employeeCompetencies}
              department={deptFilter !== 'all' ? (deptFilter as Department) : undefined}
            />
          </CardContent>
        </Card>
      </div>

      {/* Priority Table */}
      <Card>
        <CardHeader>
          <CardTitle>{t('skillGap.priorityTable.title')}</CardTitle>
          <CardDescription>{t('skillGap.priorityTable.description')}</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('skillGap.priorityTable.priority')}</TableHead>
                <TableHead>{t('competency.code')}</TableHead>
                <TableHead>{t('competency.name')}</TableHead>
                <TableHead>{t('competency.categoryLabel')}</TableHead>
                <TableHead className="text-right">{t('skillGap.priorityTable.gapPercent')}</TableHead>
                <TableHead className="text-right">{t('skillGap.priorityTable.belowTarget')}</TableHead>
                <TableHead className="text-right">{t('skillGap.priorityTable.total')}</TableHead>
                <TableHead>{t('skillGap.recommendedPrograms', { defaultValue: 'Recommended' })}</TableHead>
                <TableHead className="text-right">{t('common.actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {gapSummaries.map((gap) => {
                const relatedProgs = getRelatedPrograms(gap.competency.competency_id);
                return (
                  <TableRow key={gap.competency.competency_id}>
                    <TableCell>
                      <Badge
                        variant={
                          gap.priority === 'HIGH'
                            ? 'destructive'
                            : gap.priority === 'MEDIUM'
                            ? 'default'
                            : 'secondary'
                        }
                        className={cn(
                          gap.priority === 'MEDIUM' && 'bg-yellow-500 hover:bg-yellow-600'
                        )}
                      >
                        {t(`skillGap.priority.${gap.priority}`)}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {gap.competency.competency_code}
                    </TableCell>
                    <TableCell>{gap.competency.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {t(`competency.category.${gap.competency.category}`)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      <span
                        className={cn(
                          gap.gap_percentage >= 60
                            ? 'text-destructive'
                            : gap.gap_percentage >= 30
                            ? 'text-yellow-600'
                            : 'text-green-600'
                        )}
                      >
                        {gap.gap_percentage}%
                      </span>
                    </TableCell>
                    <TableCell className="text-right">{gap.below_target}</TableCell>
                    <TableCell className="text-right">{gap.total_employees}</TableCell>
                    <TableCell>
                      {relatedProgs.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {relatedProgs.slice(0, 2).map((p) => (
                            <Badge key={p.program_code} variant="outline" className="text-[10px]">
                              <BookOpen className="h-3 w-3 mr-1" />
                              {p.program_code}
                            </Badge>
                          ))}
                          {relatedProgs.length > 2 && (
                            <Badge variant="outline" className="text-[10px]">
                              +{relatedProgs.length - 2}
                            </Badge>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedGap(gap);
                          setActionDialogOpen(true);
                        }}
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
              {gapSummaries.length === 0 && (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                    {t('common.noData')}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Action Plan Dialog */}
      <Dialog open={actionDialogOpen} onOpenChange={setActionDialogOpen}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              {t('skillGap.actionPlan.title', { defaultValue: 'Action Plan' })}
            </DialogTitle>
            <DialogDescription>
              {selectedGap?.competency.name} - {selectedGap?.competency.competency_code}
            </DialogDescription>
          </DialogHeader>
          {selectedGap && (
            <div className="space-y-4 py-2">
              {/* Gap Summary */}
              <div className="grid grid-cols-3 gap-3">
                <div className="text-center p-3 bg-muted rounded-lg">
                  <div className="text-2xl font-bold text-destructive">{selectedGap.gap_percentage}%</div>
                  <div className="text-xs text-muted-foreground">{t('skillGap.actionPlan.gapRate', { defaultValue: 'Gap Rate' })}</div>
                </div>
                <div className="text-center p-3 bg-muted rounded-lg">
                  <div className="text-2xl font-bold">{selectedGap.below_target}</div>
                  <div className="text-xs text-muted-foreground">{t('skillGap.actionPlan.needTraining', { defaultValue: 'Need Training' })}</div>
                </div>
                <div className="text-center p-3 bg-muted rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{selectedGap.at_target}</div>
                  <div className="text-xs text-muted-foreground">{t('skillGap.actionPlan.atTarget', { defaultValue: 'At Target' })}</div>
                </div>
              </div>

              {/* Recommended Training Programs */}
              <div>
                <h4 className="text-sm font-medium mb-2">
                  {t('skillGap.actionPlan.recommendedPrograms', { defaultValue: 'Recommended Training Programs' })}
                </h4>
                {(() => {
                  const relatedProgs = getRelatedPrograms(selectedGap.competency.competency_id);
                  if (relatedProgs.length === 0) {
                    return (
                      <p className="text-sm text-muted-foreground">
                        {t('skillGap.actionPlan.noPrograms', { defaultValue: 'No matching programs found. Consider creating a training program for this competency.' })}
                      </p>
                    );
                  }
                  return (
                    <div className="space-y-2">
                      {relatedProgs.map((prog) => (
                        <div
                          key={prog.program_code}
                          className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50"
                        >
                          <div>
                            <div className="text-sm font-medium">{prog.program_name}</div>
                            <div className="text-xs text-muted-foreground">
                              {prog.program_code} · {prog.category}
                            </div>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              window.open(`/schedule?program=${prog.program_code}`, '_blank');
                            }}
                          >
                            {t('skillGap.actionPlan.createSession', { defaultValue: 'Schedule' })}
                          </Button>
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </div>

              {/* Related Learning Paths */}
              {learningPaths.filter((lp) =>
                lp.required_competencies?.some(
                  (rc) => rc.competency_id === selectedGap.competency.competency_id
                )
              ).length > 0 && (
                <div>
                  <h4 className="text-sm font-medium mb-2">
                    {t('skillGap.actionPlan.relatedPaths', { defaultValue: 'Related Learning Paths' })}
                  </h4>
                  <div className="space-y-1">
                    {learningPaths
                      .filter((lp) =>
                        lp.required_competencies?.some(
                          (rc) => rc.competency_id === selectedGap.competency.competency_id
                        )
                      )
                      .map((lp) => (
                        <div key={lp.path_id} className="flex items-center gap-2 text-sm p-2 border rounded">
                          <Badge variant="outline" className="text-[10px]">{lp.type}</Badge>
                          <span>{lp.name}</span>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
