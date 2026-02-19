/**
 * Competency Management Page
 * - Tab 1: Competency List (CRUD table)
 * - Tab 2: Skill Matrix (heat map grid)
 * - Tab 3: Learning Paths (CRUD)
 */

import { useEffect, useState, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Loader2, Plus, Search, Pencil, Trash2, Users, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { SkillMatrix } from '@/components/competency/SkillMatrix';
import { useToast } from '@/hooks/use-toast';
import * as api from '@/services/api';
import type { Employee } from '@/types';
import type {
  Competency,
  CompetencyCategory,
  CompetencyLevel,
  EmployeeCompetency,
  LearningPath,
  LearningPathType,
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

const PATH_TYPES: LearningPathType[] = [
  'ONBOARDING',
  'POSITION',
  'PROMOTION',
  'SPECIALIZATION',
  'REMEDIAL',
];

const LEVELS: CompetencyLevel[] = [
  'NOVICE',
  'BEGINNER',
  'COMPETENT',
  'PROFICIENT',
  'EXPERT',
];

export default function CompetencyPage() {
  const { t } = useTranslation();
  const { toast } = useToast();

  // Data state
  const [competencies, setCompetencies] = useState<Competency[]>([]);
  const [employeeCompetencies, setEmployeeCompetencies] = useState<EmployeeCompetency[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [learningPaths, setLearningPaths] = useState<LearningPath[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [matrixDeptFilter, setMatrixDeptFilter] = useState<string>('all');
  const [matrixCategoryFilter, setMatrixCategoryFilter] = useState<string>('all');

  // Dialog state
  const [competencyDialogOpen, setCompetencyDialogOpen] = useState(false);
  const [editingCompetency, setEditingCompetency] = useState<Competency | null>(null);
  const [pathDialogOpen, setPathDialogOpen] = useState(false);
  const [editingPath, setEditingPath] = useState<LearningPath | null>(null);
  const [levelDialogOpen, setLevelDialogOpen] = useState(false);
  const [levelDialogData, setLevelDialogData] = useState<{
    employeeId: string;
    competencyId: string;
    currentLevel: CompetencyLevel;
  } | null>(null);

  // Bulk assignment dialog
  const [bulkDialogOpen, setBulkDialogOpen] = useState(false);
  const [bulkCompetencyId, setBulkCompetencyId] = useState<string>('');
  const [bulkTargetLevel, setBulkTargetLevel] = useState<CompetencyLevel>('COMPETENT');
  const [bulkDeptFilter, setBulkDeptFilter] = useState<string>('all');
  const [bulkSelectedEmployees, setBulkSelectedEmployees] = useState<Set<string>>(new Set());
  const [bulkAssigning, setBulkAssigning] = useState(false);

  // Form state for competency
  const [compForm, setCompForm] = useState({
    competency_code: '',
    name: '',
    name_vn: '',
    name_kr: '',
    description: '',
    category: 'TECHNICAL' as CompetencyCategory,
    is_core: false,
  });

  // Form state for learning path
  const [pathForm, setPathForm] = useState({
    path_code: '',
    name: '',
    name_vn: '',
    name_kr: '',
    description: '',
    type: 'ONBOARDING' as LearningPathType,
    estimated_duration_hours: 0,
    is_mandatory: false,
  });

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
    } catch (error) {
      toast({
        title: t('messages.loadError'),
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Filtered competencies
  const filteredCompetencies = useMemo(() => {
    return competencies.filter((c) => {
      const matchesSearch =
        !searchTerm ||
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.competency_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.name_vn.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory =
        categoryFilter === 'all' || c.category === categoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [competencies, searchTerm, categoryFilter]);

  // Open competency dialog for create/edit
  const openCompetencyDialog = useCallback(
    (comp?: Competency) => {
      if (comp) {
        setEditingCompetency(comp);
        setCompForm({
          competency_code: comp.competency_code,
          name: comp.name,
          name_vn: comp.name_vn,
          name_kr: comp.name_kr,
          description: comp.description,
          category: comp.category,
          is_core: comp.is_core,
        });
      } else {
        setEditingCompetency(null);
        setCompForm({
          competency_code: '',
          name: '',
          name_vn: '',
          name_kr: '',
          description: '',
          category: 'TECHNICAL',
          is_core: false,
        });
      }
      setCompetencyDialogOpen(true);
    },
    []
  );

  // Save competency
  const saveCompetency = async () => {
    if (!compForm.competency_code || !compForm.name) {
      toast({ title: t('messages.requiredFields'), variant: 'destructive' });
      return;
    }

    try {
      if (editingCompetency) {
        await api.updateCompetency(editingCompetency.competency_id, {
          ...compForm,
          is_active: true,
        });
      } else {
        await api.createCompetency({
          ...compForm,
          is_active: true,
        });
      }
      toast({ title: t('messages.saveSuccess') });
      setCompetencyDialogOpen(false);
      loadData();
    } catch {
      toast({ title: t('messages.saveError'), variant: 'destructive' });
    }
  };

  // Delete competency
  const handleDeleteCompetency = async (id: string) => {
    try {
      await api.deleteCompetency(id);
      toast({ title: t('messages.deleteSuccess') });
      loadData();
    } catch {
      toast({ title: t('messages.deleteError'), variant: 'destructive' });
    }
  };

  // Open path dialog
  const openPathDialog = useCallback(
    (path?: LearningPath) => {
      if (path) {
        setEditingPath(path);
        setPathForm({
          path_code: path.path_code,
          name: path.name,
          name_vn: path.name_vn,
          name_kr: path.name_kr,
          description: path.description,
          type: path.type,
          estimated_duration_hours: path.estimated_duration_hours,
          is_mandatory: path.is_mandatory,
        });
      } else {
        setEditingPath(null);
        setPathForm({
          path_code: '',
          name: '',
          name_vn: '',
          name_kr: '',
          description: '',
          type: 'ONBOARDING',
          estimated_duration_hours: 0,
          is_mandatory: false,
        });
      }
      setPathDialogOpen(true);
    },
    []
  );

  // Save learning path
  const savePath = async () => {
    if (!pathForm.path_code || !pathForm.name) {
      toast({ title: t('messages.requiredFields'), variant: 'destructive' });
      return;
    }

    try {
      if (editingPath) {
        await api.updateLearningPath(editingPath.path_id, {
          ...pathForm,
          is_active: true,
          target_positions: editingPath.target_positions,
          target_departments: editingPath.target_departments,
          required_competencies: editingPath.required_competencies,
          programs: editingPath.programs,
          validity_months: editingPath.validity_months,
        });
      } else {
        await api.createLearningPath({
          ...pathForm,
          is_active: true,
          target_positions: [],
          target_departments: [],
          required_competencies: [],
          programs: [],
          validity_months: null,
        });
      }
      toast({ title: t('messages.saveSuccess') });
      setPathDialogOpen(false);
      loadData();
    } catch {
      toast({ title: t('messages.saveError'), variant: 'destructive' });
    }
  };

  // Handle skill matrix cell click
  const handleCellClick = useCallback(
    (employeeId: string, competencyId: string, currentLevel: CompetencyLevel) => {
      setLevelDialogData({ employeeId, competencyId, currentLevel });
      setLevelDialogOpen(true);
    },
    []
  );

  // Save level from matrix
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
      loadData();
    } catch {
      toast({ title: t('messages.saveError'), variant: 'destructive' });
    }
  };

  // Bulk assign competency to selected employees
  const handleBulkAssign = async () => {
    if (!bulkCompetencyId || bulkSelectedEmployees.size === 0) return;
    setBulkAssigning(true);
    try {
      const promises = Array.from(bulkSelectedEmployees).map((empId) =>
        api.updateEmployeeCompetency({
          employee_id: empId,
          competency_id: bulkCompetencyId,
          current_level: 'NOVICE',
          target_level: bulkTargetLevel,
          last_assessed_at: new Date().toISOString(),
          assessed_by: 'admin',
          evidence: [],
        })
      );
      await Promise.all(promises);
      toast({
        title: t('messages.saveSuccess'),
        description: `${bulkSelectedEmployees.size} ${t('competency.bulk.employeesAssigned', { defaultValue: 'employees assigned' })}`,
      });
      setBulkDialogOpen(false);
      setBulkSelectedEmployees(new Set());
      loadData();
    } catch {
      toast({ title: t('messages.saveError'), variant: 'destructive' });
    } finally {
      setBulkAssigning(false);
    }
  };

  // Employees for bulk assignment (filtered by dept)
  const bulkFilteredEmployees = useMemo(() => {
    if (bulkDeptFilter === 'all') return employees;
    return employees.filter((e) => e.department === bulkDeptFilter);
  }, [employees, bulkDeptFilter]);

  // Competency achievement stats for list display
  const competencyStats = useMemo(() => {
    const stats: Record<string, { assessed: number; atTarget: number; total: number }> = {};
    for (const comp of competencies) {
      const records = employeeCompetencies.filter((ec) => ec.competency_id === comp.competency_id);
      const atTarget = records.filter(
        (ec) => COMPETENCY_LEVEL_VALUES[ec.current_level] >= COMPETENCY_LEVEL_VALUES[ec.target_level]
      ).length;
      stats[comp.competency_id] = {
        assessed: records.length,
        atTarget,
        total: employees.length,
      };
    }
    return stats;
  }, [competencies, employeeCompetencies, employees]);

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
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t('competency.searchPlaceholder')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
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
            <Button
              variant="outline"
              onClick={() => {
                setBulkCompetencyId('');
                setBulkTargetLevel('COMPETENT');
                setBulkDeptFilter('all');
                setBulkSelectedEmployees(new Set());
                setBulkDialogOpen(true);
              }}
            >
              <Users className="h-4 w-4 mr-2" />
              {t('competency.bulk.assign', { defaultValue: 'Bulk Assign' })}
            </Button>
            <Button onClick={() => openCompetencyDialog()}>
              <Plus className="h-4 w-4 mr-2" />
              {t('competency.addCompetency')}
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>{t('competency.listTitle')}</CardTitle>
              <CardDescription>
                {t('competency.listCount', { count: filteredCompetencies.length })}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('competency.code')}</TableHead>
                    <TableHead>{t('competency.name')}</TableHead>
                    <TableHead>{t('competency.categoryLabel')}</TableHead>
                    <TableHead>{t('competency.coreLabel')}</TableHead>
                    <TableHead>{t('competency.achievementRate', { defaultValue: 'Achievement' })}</TableHead>
                    <TableHead>{t('common.status')}</TableHead>
                    <TableHead className="text-right">{t('common.actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCompetencies.map((comp) => (
                    <TableRow key={comp.competency_id}>
                      <TableCell className="font-mono text-sm">
                        {comp.competency_code}
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{comp.name}</div>
                          {comp.name_vn && (
                            <div className="text-xs text-muted-foreground">
                              {comp.name_vn}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {t(`competency.category.${comp.category}`)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {comp.is_core && (
                          <Badge variant="default">
                            {t('competency.core')}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {(() => {
                          const stat = competencyStats[comp.competency_id];
                          if (!stat || stat.total === 0) return <span className="text-xs text-muted-foreground">-</span>;
                          const rate = stat.assessed > 0
                            ? Math.round((stat.atTarget / stat.total) * 100)
                            : 0;
                          return (
                            <div className="flex items-center gap-2 min-w-[120px]">
                              <Progress value={rate} className="h-2 flex-1" />
                              <span className="text-xs text-muted-foreground whitespace-nowrap">
                                {stat.atTarget}/{stat.total}
                              </span>
                            </div>
                          );
                        })()}
                      </TableCell>
                      <TableCell>
                        <Badge variant={comp.is_active ? 'default' : 'secondary'}>
                          {comp.is_active ? t('common.active') : t('common.inactive')}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openCompetencyDialog(comp)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteCompetency(comp.competency_id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredCompetencies.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        {t('common.noData')}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 2: Skill Matrix */}
        <TabsContent value="matrix" className="space-y-4">
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
        </TabsContent>

        {/* Tab 3: Learning Paths */}
        <TabsContent value="paths" className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => openPathDialog()}>
              <Plus className="h-4 w-4 mr-2" />
              {t('competency.paths.add')}
            </Button>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {learningPaths.map((path) => (
              <Card key={path.path_id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-base">{path.name}</CardTitle>
                      <CardDescription className="text-xs mt-1">
                        {path.path_code}
                      </CardDescription>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openPathDialog(path)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="outline">
                      {t(`competency.paths.type.${path.type}`)}
                    </Badge>
                    {path.is_mandatory && (
                      <Badge variant="destructive">
                        {t('competency.paths.mandatory')}
                      </Badge>
                    )}
                  </div>
                  {path.description && (
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {path.description}
                    </p>
                  )}
                  <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t">
                    <span>
                      {t('competency.paths.duration', {
                        hours: path.estimated_duration_hours,
                      })}
                    </span>
                    <span>
                      {t('competency.paths.programCount', {
                        count: path.programs.length,
                      })}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
            {learningPaths.length === 0 && (
              <div className="col-span-full text-center py-8 text-muted-foreground">
                {t('common.noData')}
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Competency Add/Edit Dialog */}
      <Dialog open={competencyDialogOpen} onOpenChange={setCompetencyDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {editingCompetency
                ? t('competency.editCompetency')
                : t('competency.addCompetency')}
            </DialogTitle>
            <DialogDescription>
              {editingCompetency
                ? t('competency.editDescription')
                : t('competency.addDescription')}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t('competency.code')} *</Label>
                <Input
                  value={compForm.competency_code}
                  onChange={(e) =>
                    setCompForm((f) => ({ ...f, competency_code: e.target.value }))
                  }
                  placeholder="COMP-001"
                />
              </div>
              <div className="space-y-2">
                <Label>{t('competency.categoryLabel')} *</Label>
                <Select
                  value={compForm.category}
                  onValueChange={(v) =>
                    setCompForm((f) => ({ ...f, category: v as CompetencyCategory }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {t(`competency.category.${cat}`)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>{t('competency.nameEn')} *</Label>
              <Input
                value={compForm.name}
                onChange={(e) => setCompForm((f) => ({ ...f, name: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t('competency.nameVn')}</Label>
                <Input
                  value={compForm.name_vn}
                  onChange={(e) =>
                    setCompForm((f) => ({ ...f, name_vn: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>{t('competency.nameKr')}</Label>
                <Input
                  value={compForm.name_kr}
                  onChange={(e) =>
                    setCompForm((f) => ({ ...f, name_kr: e.target.value }))
                  }
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>{t('competency.descriptionLabel')}</Label>
              <Textarea
                value={compForm.description}
                onChange={(e) =>
                  setCompForm((f) => ({ ...f, description: e.target.value }))
                }
                rows={3}
              />
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                checked={compForm.is_core}
                onCheckedChange={(v) => setCompForm((f) => ({ ...f, is_core: v }))}
              />
              <Label>{t('competency.isCoreLabel')}</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCompetencyDialogOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button onClick={saveCompetency}>{t('common.save')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Learning Path Add/Edit Dialog */}
      <Dialog open={pathDialogOpen} onOpenChange={setPathDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {editingPath
                ? t('competency.paths.edit')
                : t('competency.paths.add')}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t('competency.paths.code')} *</Label>
                <Input
                  value={pathForm.path_code}
                  onChange={(e) =>
                    setPathForm((f) => ({ ...f, path_code: e.target.value }))
                  }
                  placeholder="LP-001"
                />
              </div>
              <div className="space-y-2">
                <Label>{t('competency.paths.typeLabel')} *</Label>
                <Select
                  value={pathForm.type}
                  onValueChange={(v) =>
                    setPathForm((f) => ({ ...f, type: v as LearningPathType }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PATH_TYPES.map((pt) => (
                      <SelectItem key={pt} value={pt}>
                        {t(`competency.paths.type.${pt}`)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>{t('competency.nameEn')} *</Label>
              <Input
                value={pathForm.name}
                onChange={(e) => setPathForm((f) => ({ ...f, name: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t('competency.nameVn')}</Label>
                <Input
                  value={pathForm.name_vn}
                  onChange={(e) =>
                    setPathForm((f) => ({ ...f, name_vn: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>{t('competency.nameKr')}</Label>
                <Input
                  value={pathForm.name_kr}
                  onChange={(e) =>
                    setPathForm((f) => ({ ...f, name_kr: e.target.value }))
                  }
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>{t('competency.descriptionLabel')}</Label>
              <Textarea
                value={pathForm.description}
                onChange={(e) =>
                  setPathForm((f) => ({ ...f, description: e.target.value }))
                }
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t('competency.paths.durationLabel')}</Label>
                <Input
                  type="number"
                  value={pathForm.estimated_duration_hours}
                  onChange={(e) =>
                    setPathForm((f) => ({
                      ...f,
                      estimated_duration_hours: Number(e.target.value),
                    }))
                  }
                />
              </div>
              <div className="flex items-center space-x-2 pt-6">
                <Switch
                  checked={pathForm.is_mandatory}
                  onCheckedChange={(v) => setPathForm((f) => ({ ...f, is_mandatory: v }))}
                />
                <Label>{t('competency.paths.mandatory')}</Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPathDialogOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button onClick={savePath}>{t('common.save')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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

      {/* Bulk Assignment Dialog */}
      <Dialog open={bulkDialogOpen} onOpenChange={setBulkDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              {t('competency.bulk.title', { defaultValue: 'Bulk Assign Competency' })}
            </DialogTitle>
            <DialogDescription>
              {t('competency.bulk.description', {
                defaultValue: 'Assign a competency with target level to multiple employees at once.',
              })}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2 flex-1 overflow-hidden flex flex-col">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t('competency.bulk.selectCompetency', { defaultValue: 'Competency' })} *</Label>
                <Select value={bulkCompetencyId} onValueChange={setBulkCompetencyId}>
                  <SelectTrigger>
                    <SelectValue placeholder={t('competency.bulk.choosePlaceholder', { defaultValue: 'Select competency...' })} />
                  </SelectTrigger>
                  <SelectContent>
                    {competencies.filter((c) => c.is_active).map((c) => (
                      <SelectItem key={c.competency_id} value={c.competency_id}>
                        {c.competency_code} - {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-1">
                  <Target className="h-3.5 w-3.5" />
                  {t('competency.bulk.targetLevel', { defaultValue: 'Target Level' })}
                </Label>
                <Select value={bulkTargetLevel} onValueChange={(v) => setBulkTargetLevel(v as CompetencyLevel)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {LEVELS.map((level) => (
                      <SelectItem key={level} value={level}>
                        {LEVELS.indexOf(level) + 1} - {t(`competency.level.${level}`)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>{t('competency.bulk.filterByDept', { defaultValue: 'Filter by Department' })}</Label>
              <Select value={bulkDeptFilter} onValueChange={setBulkDeptFilter}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue />
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
            </div>
            <div className="flex items-center justify-between">
              <Label className="text-sm">
                {t('competency.bulk.selectEmployees', { defaultValue: 'Select Employees' })}
                {' '}
                <span className="text-muted-foreground">
                  ({bulkSelectedEmployees.size}/{bulkFilteredEmployees.length})
                </span>
              </Label>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  if (bulkSelectedEmployees.size === bulkFilteredEmployees.length) {
                    setBulkSelectedEmployees(new Set());
                  } else {
                    setBulkSelectedEmployees(new Set(bulkFilteredEmployees.map((e) => e.employee_id)));
                  }
                }}
              >
                {bulkSelectedEmployees.size === bulkFilteredEmployees.length
                  ? t('common.deselectAll', { defaultValue: 'Deselect All' })
                  : t('common.selectAll', { defaultValue: 'Select All' })}
              </Button>
            </div>
            <div className="flex-1 overflow-auto border rounded-md max-h-[250px]">
              {bulkFilteredEmployees.map((emp) => (
                <label
                  key={emp.employee_id}
                  className="flex items-center gap-3 px-3 py-2 hover:bg-muted/50 cursor-pointer border-b last:border-b-0"
                >
                  <Checkbox
                    checked={bulkSelectedEmployees.has(emp.employee_id)}
                    onCheckedChange={(checked) => {
                      const next = new Set(bulkSelectedEmployees);
                      if (checked) next.add(emp.employee_id);
                      else next.delete(emp.employee_id);
                      setBulkSelectedEmployees(next);
                    }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{emp.employee_name}</div>
                    <div className="text-xs text-muted-foreground">
                      {emp.employee_id} · {t(`department.${emp.department}`)}
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBulkDialogOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button
              onClick={handleBulkAssign}
              disabled={!bulkCompetencyId || bulkSelectedEmployees.size === 0 || bulkAssigning}
            >
              {bulkAssigning && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {t('competency.bulk.assignButton', {
                defaultValue: `Assign to ${bulkSelectedEmployees.size} employees`,
                count: bulkSelectedEmployees.size,
              })}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
