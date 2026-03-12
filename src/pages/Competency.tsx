/**
 * Competency Management Page (Orchestrator)
 * - Tab 1: Competency List (CRUD table)
 * - Tab 2: Skill Matrix (heat map grid)
 * - Tab 3: Learning Paths (CRUD)
 */

import { useEffect, useState, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Loader2 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CompetencyListTab } from '@/components/competency/CompetencyListTab';
import { CompetencyMatrix } from '@/components/competency/CompetencyMatrix';
import { CompetencyFormDialog } from '@/components/competency/CompetencyFormDialog';
import { BulkAssignmentDialog } from '@/components/competency/BulkAssignmentDialog';
import { LearningPathSection } from '@/components/competency/LearningPathSection';
import { useToast } from '@/hooks/use-toast';
import * as api from '@/services/api';
import type { Employee } from '@/types';
import type {
  Competency,
  EmployeeCompetency,
  LearningPath,
} from '@/types/curriculum';

export default function CompetencyPage() {
  const { t } = useTranslation();
  const { toast } = useToast();

  // Data state
  const [competencies, setCompetencies] = useState<Competency[]>([]);
  const [employeeCompetencies, setEmployeeCompetencies] = useState<EmployeeCompetency[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [learningPaths, setLearningPaths] = useState<LearningPath[]>([]);
  const [loading, setLoading] = useState(true);

  // Dialog state
  const [competencyDialogOpen, setCompetencyDialogOpen] = useState(false);
  const [editingCompetency, setEditingCompetency] = useState<Competency | null>(null);
  const [bulkDialogOpen, setBulkDialogOpen] = useState(false);

  // Load data
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [comps, empComps, emps, paths] = await Promise.all([
        api.getCompetencies(),
        api.getEmployeeCompetencies(),
        api.getEmployees(),
        api.getLearningPaths(),
      ]);
      setCompetencies(comps);
      setEmployeeCompetencies(empComps);
      setEmployees(emps.filter((e) => e.status === 'ACTIVE'));
      setLearningPaths(paths);
    } catch {
      toast({
        title: t('messages.loadError'),
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Open competency dialog for create/edit
  const openCompetencyDialog = useCallback(
    (comp?: Competency) => {
      setEditingCompetency(comp ?? null);
      setCompetencyDialogOpen(true);
    },
    []
  );

  // Unique departments from employees
  const departments = useMemo(() => {
    return Array.from(new Set(employees.map((e) => e.department))).sort();
  }, [employees]);

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
        <h1 className="text-2xl font-bold">{t('competency.title')}</h1>
        <p className="text-muted-foreground">{t('competency.description')}</p>
      </div>

      <Tabs defaultValue="list">
        <TabsList>
          <TabsTrigger value="list">
            {t('competency.tabs.list')}
          </TabsTrigger>
          <TabsTrigger value="matrix">
            {t('competency.tabs.matrix')}
          </TabsTrigger>
          <TabsTrigger value="paths">
            {t('competency.tabs.paths')}
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Competency List */}
        <TabsContent value="list" className="space-y-4">
          <CompetencyListTab
            competencies={competencies}
            employeeCompetencies={employeeCompetencies}
            employees={employees}
            onEditCompetency={(comp) => openCompetencyDialog(comp)}
            onAddCompetency={() => openCompetencyDialog()}
            onOpenBulkDialog={() => setBulkDialogOpen(true)}
            onDataChanged={loadData}
          />
        </TabsContent>

        {/* Tab 2: Skill Matrix */}
        <TabsContent value="matrix" className="space-y-4">
          <CompetencyMatrix
            employees={employees}
            competencies={competencies}
            employeeCompetencies={employeeCompetencies}
            departments={departments}
            onDataChanged={loadData}
          />
        </TabsContent>

        {/* Tab 3: Learning Paths */}
        <TabsContent value="paths" className="space-y-4">
          <LearningPathSection
            learningPaths={learningPaths}
            onDataChanged={loadData}
          />
        </TabsContent>
      </Tabs>

      {/* Competency Add/Edit Dialog */}
      <CompetencyFormDialog
        open={competencyDialogOpen}
        onOpenChange={setCompetencyDialogOpen}
        editingCompetency={editingCompetency}
        onDataChanged={loadData}
      />

      {/* Bulk Assignment Dialog */}
      <BulkAssignmentDialog
        open={bulkDialogOpen}
        onOpenChange={setBulkDialogOpen}
        competencies={competencies}
        employees={employees}
        departments={departments}
        onDataChanged={loadData}
      />
    </div>
  );
}
