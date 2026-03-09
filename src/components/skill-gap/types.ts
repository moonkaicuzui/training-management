import type { CompetencyGapSummary } from '@/types/curriculum';

export interface SkillGapStats {
  high: number;
  medium: number;
  low: number;
  avgGap: number;
}

export interface GapChartDataItem {
  name: string;
  gap: number;
  atTarget: number;
}

export interface SkillGapFiltersProps {
  deptFilter: string;
  setDeptFilter: (value: string) => void;
  categoryFilter: string;
  setCategoryFilter: (value: string) => void;
  departments: string[];
}

export interface SkillGapStatsCardsProps {
  stats: SkillGapStats;
}

export interface GapBarChartCardProps {
  data: GapChartDataItem[];
}

export interface GapRadarChartCardProps {
  employees: import('@/types').Employee[];
  competencies: import('@/types/curriculum').Competency[];
  employeeCompetencies: import('@/types/curriculum').EmployeeCompetency[];
  deptFilter: string;
  categoryFilter: string;
}

export interface GapPriorityTableProps {
  gapSummaries: CompetencyGapSummary[];
  getRelatedPrograms: (competencyId: string) => import('@/types').TrainingProgram[];
  onViewActionPlan: (gap: CompetencyGapSummary) => void;
}

export interface ActionPlanDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedGap: CompetencyGapSummary | null;
  getRelatedPrograms: (competencyId: string) => import('@/types').TrainingProgram[];
  learningPaths: import('@/types/curriculum').LearningPath[];
}
