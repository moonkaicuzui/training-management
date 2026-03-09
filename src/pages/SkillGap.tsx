/**
 * Skill Gap Dashboard Page
 * - Department-wise competency gap visualization
 * - Bar chart: gap percentage by competency
 * - Department average levels vs targets
 * - Priority table: HIGH/MEDIUM/LOW gap items
 */

import { useEffect, useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import * as api from '@/services/api';
import type { Employee, TrainingProgram } from '@/types';
import type {
  Competency,
  EmployeeCompetency,
  CompetencyGapSummary,
  LearningPath,
} from '@/types/curriculum';
import { COMPETENCY_LEVEL_VALUES } from '@/types/curriculum';
import {
  SkillGapFilters,
  SkillGapStatsCards,
  GapBarChartCard,
  GapRadarChartCard,
  GapPriorityTable,
  ActionPlanDialog,
} from '@/components/skill-gap';

export default function SkillGapPage() {
  const { t } = useTranslation();
  const { toast } = useToast();

  const [competencies, setCompetencies] = useState<Competency[]>([]);
  const [employeeCompetencies, setEmployeeCompetencies] = useState<EmployeeCompetency[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [programs, setPrograms] = useState<TrainingProgram[]>([]);
  const [learningPaths, setLearningPaths] = useState<LearningPath[]>([]);
  const [loading, setLoading] = useState(true);

  const [deptFilter, setDeptFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

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

  const getRelatedPrograms = (competencyId: string): TrainingProgram[] => {
    const relatedProgramCodes = new Set<string>();
    for (const path of learningPaths) {
      const requiresComp = path.required_competencies?.some(
        (rc) => rc.competency_id === competencyId
      );
      if (requiresComp) {
        path.programs.forEach((p) => relatedProgramCodes.add(p.program_code));
      }
    }
    if (relatedProgramCodes.size > 0) {
      return programs.filter((p) => relatedProgramCodes.has(p.program_code));
    }
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

      <SkillGapFilters
        deptFilter={deptFilter}
        setDeptFilter={setDeptFilter}
        categoryFilter={categoryFilter}
        setCategoryFilter={setCategoryFilter}
        departments={departments}
      />

      <SkillGapStatsCards stats={stats} />

      <div className="grid gap-4 lg:grid-cols-2">
        <GapBarChartCard data={gapChartData} />
        <GapRadarChartCard
          employees={employees}
          competencies={competencies}
          employeeCompetencies={employeeCompetencies}
          deptFilter={deptFilter}
          categoryFilter={categoryFilter}
        />
      </div>

      <GapPriorityTable
        gapSummaries={gapSummaries}
        getRelatedPrograms={getRelatedPrograms}
        onViewActionPlan={(gap) => {
          setSelectedGap(gap);
          setActionDialogOpen(true);
        }}
      />

      <ActionPlanDialog
        open={actionDialogOpen}
        onOpenChange={setActionDialogOpen}
        selectedGap={selectedGap}
        getRelatedPrograms={getRelatedPrograms}
        learningPaths={learningPaths}
      />
    </div>
  );
}
