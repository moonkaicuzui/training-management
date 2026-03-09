/**
 * CompetencyMatrix - Skill matrix tab with department/category filters and level dialog
 */

import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { SkillMatrix } from '@/components/competency/SkillMatrix';
import { useToast } from '@/hooks/use-toast';
import * as api from '@/services/api';
import type { Employee } from '@/types';
import type {
  Competency,
  CompetencyCategory,
  CompetencyLevel,
  EmployeeCompetency,
} from '@/types/curriculum';

const CATEGORIES: CompetencyCategory[] = [
  'TECHNICAL',
  'QUALITY',
  'SAFETY',
  'LEADERSHIP',
  'COMMUNICATION',
  'PROCESS',
];

const LEVELS: CompetencyLevel[] = [
  'NOVICE',
  'BEGINNER',
  'COMPETENT',
  'PROFICIENT',
  'EXPERT',
];

interface CompetencyMatrixProps {
  employees: Employee[];
  competencies: Competency[];
  employeeCompetencies: EmployeeCompetency[];
  departments: string[];
  onDataChanged: () => void;
}

export function CompetencyMatrix({
  employees,
  competencies,
  employeeCompetencies,
  departments,
  onDataChanged,
}: CompetencyMatrixProps) {
  const { t } = useTranslation();
  const { toast } = useToast();

  const [matrixDeptFilter, setMatrixDeptFilter] = useState<string>('all');
  const [matrixCategoryFilter, setMatrixCategoryFilter] = useState<string>('all');
  const [levelDialogOpen, setLevelDialogOpen] = useState(false);
  const [levelDialogData, setLevelDialogData] = useState<{
    employeeId: string;
    competencyId: string;
    currentLevel: CompetencyLevel;
  } | null>(null);

  const handleCellClick = useCallback(
    (employeeId: string, competencyId: string, currentLevel: CompetencyLevel) => {
      setLevelDialogData({ employeeId, competencyId, currentLevel });
      setLevelDialogOpen(true);
    },
    []
  );

  const saveLevelFromMatrix = async (newLevel: CompetencyLevel) => {
    if (!levelDialogData) return;
    try {
      await api.updateEmployeeCompetency({
        employee_id: levelDialogData.employeeId,
        competency_id: levelDialogData.competencyId,
        current_level: newLevel,
        target_level: 'COMPETENT',
        last_assessed_at: new Date().toISOString(),
        assessed_by: 'admin',
        evidence: [],
      });
      toast({ title: t('messages.saveSuccess') });
      setLevelDialogOpen(false);
      onDataChanged();
    } catch {
      toast({ title: t('messages.saveError'), variant: 'destructive' });
    }
  };

  return (
    <>
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <Select value={matrixDeptFilter} onValueChange={setMatrixDeptFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder={t('competency.matrix.allDepts')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('common.all')}</SelectItem>
            {departments.map((dept) => (
              <SelectItem key={dept} value={dept}>
                {t(`department.${dept}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={matrixCategoryFilter} onValueChange={setMatrixCategoryFilter}>
          <SelectTrigger className="w-[180px]">
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

      <Card>
        <CardHeader>
          <CardTitle>{t('competency.matrix.title')}</CardTitle>
          <CardDescription>
            {t('competency.matrix.description')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SkillMatrix
            employees={employees}
            competencies={competencies}
            employeeCompetencies={employeeCompetencies}
            departmentFilter={matrixDeptFilter}
            categoryFilter={matrixCategoryFilter as CompetencyCategory}
            onCellClick={handleCellClick}
          />
        </CardContent>
      </Card>

      {/* Set Level Dialog (from matrix cell click) */}
      <Dialog open={levelDialogOpen} onOpenChange={setLevelDialogOpen}>
        <DialogContent className="sm:max-w-[350px]">
          <DialogHeader>
            <DialogTitle>{t('competency.matrix.setLevel')}</DialogTitle>
            <DialogDescription>
              {t('competency.matrix.setLevelDesc')}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-4">
            {LEVELS.map((level) => (
              <Button
                key={level}
                variant={levelDialogData?.currentLevel === level ? 'default' : 'outline'}
                className="w-full justify-start"
                onClick={() => saveLevelFromMatrix(level)}
              >
                <span className="font-mono mr-2">
                  {LEVELS.indexOf(level) + 1}
                </span>
                {t(`competency.level.${level}`)}
              </Button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
