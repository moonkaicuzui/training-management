import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Search, MoreHorizontal, Pencil, Trash2, Eye, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ExportDropdown } from '@/components/common/ExportDropdown';
import { EmptyState } from '@/components/common/EmptyState';
import { useExport } from '@/hooks/useExport';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useShallow } from 'zustand/react/shallow';
import { useTrainingStore } from '@/stores/trainingStore';
import { useUIStore } from '@/stores/uiStore';
import { PageLoading } from '@/components/common/LoadingSpinner';
import type { ProgramCategory, TrainingProgram, TrainingLevel, TrainingType, EvaluationType } from '@/types';
import { categories, positions } from '@/data/constants';
import { TRAINING_LEVELS, TRAINING_TYPES } from '@/data/constants';

const emptyFormData = {
  program_code: '',
  program_name: '',
  program_name_vn: '',
  program_name_kr: '',
  category: 'QIP' as ProgramCategory,
  tags: '',
  target_positions: [] as string[],
  evaluation_type: 'SCORE' as EvaluationType,
  passing_score: 80,
  grade_aa: 100,
  grade_a: 90,
  grade_b: 80,
  duration_hours: 1,
  validity_months: 12 as number | null,
  training_level: '' as TrainingLevel | '',
  training_type: '' as TrainingType | '',
};

export default function Programs() {
  const { t } = useTranslation();
  const { programs, loading, fetchPrograms, createProgram, updateProgram, deleteProgram } = useTrainingStore(useShallow((state) => ({
    programs: state.programs,
    loading: state.loading,
    fetchPrograms: state.fetchPrograms,
    createProgram: state.createProgram,
    updateProgram: state.updateProgram,
    deleteProgram: state.deleteProgram,
  })));
  const { addToast, language } = useUIStore(useShallow((state) => ({
    addToast: state.addToast,
    language: state.language,
  })));
  const { exporting, exportExcel, exportPDF } = useExport();

  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [showInactive, setShowInactive] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [programToDelete, setProgramToDelete] = useState<string | null>(null);
  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [editingProgram, setEditingProgram] = useState<TrainingProgram | null>(null);
  const [formData, setFormData] = useState(emptyFormData);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [viewingProgram, setViewingProgram] = useState<TrainingProgram | null>(null);

  useEffect(() => {
    fetchPrograms({
      search: searchQuery || undefined,
      category: categoryFilter !== 'all' ? (categoryFilter as ProgramCategory) : undefined,
      showInactive,
    });
  }, [searchQuery, categoryFilter, showInactive]);

  const handleDelete = async () => {
    if (!programToDelete) return;

    try {
      await deleteProgram(programToDelete);
      addToast({
        type: 'success',
        title: t('messages.deleteSuccess'),
      });
    } catch {
      addToast({
        type: 'error',
        title: t('messages.deleteError'),
      });
    } finally {
      setDeleteDialogOpen(false);
      setProgramToDelete(null);
    }
  };

  const handleOpenCreate = () => {
    setEditingProgram(null);
    setFormData(emptyFormData);
    setFormDialogOpen(true);
  };

  const handleOpenEdit = (program: TrainingProgram) => {
    setEditingProgram(program);
    setFormData({
      program_code: program.program_code,
      program_name: program.program_name,
      program_name_vn: program.program_name_vn || '',
      program_name_kr: program.program_name_kr || '',
      category: program.category,
      tags: program.tags.join(', '),
      target_positions: program.target_positions as string[],
      evaluation_type: program.evaluation_type,
      passing_score: program.passing_score,
      grade_aa: program.grade_aa,
      grade_a: program.grade_a,
      grade_b: program.grade_b,
      duration_hours: program.duration_hours,
      validity_months: program.validity_months,
      training_level: program.training_level || '',
      training_type: program.training_type || '',
    });
    setFormDialogOpen(true);
  };

  const handleOpenDetail = (program: TrainingProgram) => {
    setViewingProgram(program);
    setDetailDialogOpen(true);
  };

  const handleSaveProgram = async () => {
    if (!formData.program_code || !formData.program_name) {
      addToast({ type: 'error', title: t('messages.requiredFields') });
      return;
    }

    try {
      const programPayload = {
        program_code: formData.program_code,
        program_name: formData.program_name,
        program_name_vn: formData.program_name_vn,
        program_name_kr: formData.program_name_kr,
        category: formData.category,
        tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean),
        target_positions: formData.target_positions as typeof programs[0]['target_positions'],
        evaluation_type: formData.evaluation_type,
        passing_score: formData.passing_score,
        grade_aa: formData.grade_aa,
        grade_a: formData.grade_a,
        grade_b: formData.grade_b,
        duration_hours: formData.duration_hours,
        validity_months: formData.validity_months,
        training_level: formData.training_level || undefined,
        training_type: formData.training_type || undefined,
        is_active: true,
      };

      if (editingProgram) {
        await updateProgram(editingProgram.program_code, programPayload);
      } else {
        await createProgram({
          ...programPayload,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        } as TrainingProgram);
      }

      addToast({ type: 'success', title: t('messages.saveSuccess') });
      setFormDialogOpen(false);
      setEditingProgram(null);
      setFormData(emptyFormData);
    } catch (error) {
      console.error('[Programs] Save error:', error);
      addToast({ type: 'error', title: t('messages.saveError') + ': ' + (error instanceof Error ? error.message : String(error)) });
    }
  };

  const getProgramName = (program: typeof programs[0]) => {
    switch (language) {
      case 'vi':
        return program.program_name_vn || program.program_name;
      case 'ko':
        return program.program_name_kr || program.program_name;
      default:
        return program.program_name;
    }
  };

  const getCategoryBadgeVariant = (category: string) => {
    switch (category) {
      case 'QIP':
        return 'default';
      case 'PRODUCTION':
        return 'secondary';
      case 'RETRAINING':
        return 'warning';
      case 'NEWCOMER':
        return 'success';
      case 'PROMOTION':
        return 'default';
      default:
        return 'outline';
    }
  };

  if (loading.programs) {
    return <PageLoading />;
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t('program.title')}</h1>
          <p className="text-muted-foreground">
            {t('program.description')}
          </p>
        </div>
        <div className="flex gap-2">
          <ExportDropdown
            onExportExcel={() =>
              exportExcel(programs as unknown as Record<string, unknown>[], {
                sheetName: 'Programs',
                filename: 'programs',
              })
            }
            onExportPDF={() =>
              exportPDF(
                programs as unknown as Record<string, unknown>[],
                [
                  { header: t('program.code'), dataKey: 'program_code' },
                  { header: t('program.name'), dataKey: 'program_name' },
                  { header: t('program.category'), dataKey: 'category' },
                  { header: t('program.passingScore'), dataKey: 'passing_score' },
                  { header: t('program.duration'), dataKey: 'duration_hours' },
                  { header: t('program.validity'), dataKey: 'validity_months' },
                ],
                { title: t('program.title'), filename: 'programs' }
              )
            }
            loading={exporting}
          />
          <Button onClick={handleOpenCreate}>
            <Plus className="h-4 w-4 mr-2" />
            {t('program.addProgram')}
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t('program.searchPlaceholder')}
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder={t('program.category')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('common.all')}</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {t(`category.${cat.value}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="showInactive"
                checked={showInactive}
                onCheckedChange={(checked) => setShowInactive(checked === true)}
              />
              <Label htmlFor="showInactive" className="text-sm">
                {t('program.includeInactive')}
              </Label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Programs Table */}
      <Card>
        <CardHeader>
          <CardTitle>{t('program.list')}</CardTitle>
          <CardDescription>{t('program.count', { count: programs.length })}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[80px]">{t('program.code')}</TableHead>
                <TableHead>{t('program.name')}</TableHead>
                <TableHead>{t('program.category')}</TableHead>
                <TableHead className="hidden md:table-cell">{t('program.targetPositions')}</TableHead>
                <TableHead className="text-center">{t('program.passingScore')}</TableHead>
                <TableHead className="text-center hidden sm:table-cell">{t('program.duration')}</TableHead>
                <TableHead className="text-center hidden sm:table-cell">{t('program.validity')}</TableHead>
                <TableHead className="hidden sm:table-cell">{t('common.status')}</TableHead>
                <TableHead className="w-[80px]">{t('common.actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {programs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9}>
                    <EmptyState
                      icon={BookOpen}
                      title={t('program.emptyTitle')}
                      description={t('program.emptyDescription')}
                      actionLabel={t('program.addProgram')}
                      onAction={() => setFormDialogOpen(true)}
                    />
                  </TableCell>
                </TableRow>
              ) : (
                programs.map((program) => (
                  <TableRow key={program.program_code}>
                    <TableCell className="font-mono font-medium">
                      {program.program_code}
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{getProgramName(program)}</div>
                      {program.tags.length > 0 && (
                        <div className="flex gap-1 mt-1">
                          {program.tags.slice(0, 3).map((tag) => (
                            <Badge key={tag} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={getCategoryBadgeVariant(program.category) as 'default'}>
                        {t(`category.${program.category}`)}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <div className="flex flex-wrap gap-1">
                        {program.target_positions.slice(0, 2).map((pos) => (
                          <Badge key={pos} variant="outline" className="text-xs">
                            {pos}
                          </Badge>
                        ))}
                        {program.target_positions.length > 2 && (
                          <Badge variant="outline" className="text-xs">
                            +{program.target_positions.length - 2}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-center font-medium">
                      {program.passing_score}{t('program.scoreUnit')}
                    </TableCell>
                    <TableCell className="text-center hidden sm:table-cell">
                      {program.duration_hours}{t('program.hours')}
                    </TableCell>
                    <TableCell className="text-center hidden sm:table-cell">
                      {program.validity_months
                        ? `${program.validity_months}${t('program.months')}`
                        : '-'}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <Badge variant={program.is_active ? 'success' : 'inactive'}>
                        {program.is_active ? t('common.active') : t('common.inactive')}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleOpenDetail(program)}>
                            <Eye className="h-4 w-4 mr-2" />
                            {t('program.viewDetail')}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleOpenEdit(program)}>
                            <Pencil className="h-4 w-4 mr-2" />
                            {t('common.edit')}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => {
                              setProgramToDelete(program.program_code);
                              setDeleteDialogOpen(true);
                            }}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            {t('common.delete')}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          </div>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('messages.confirmDeleteTitle')}</DialogTitle>
            <DialogDescription>
              {t('program.confirmDelete')}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              {t('common.delete')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create/Edit Program Dialog */}
      <Dialog open={formDialogOpen} onOpenChange={setFormDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingProgram ? t('program.editProgram') : t('program.addProgram')}
            </DialogTitle>
            <DialogDescription>
              {editingProgram ? t('program.editDescription') : t('program.createDescription')}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t('program.code')} *</Label>
                <Input
                  value={formData.program_code}
                  onChange={(e) => setFormData({ ...formData, program_code: e.target.value })}
                  placeholder="QIP-001"
                  disabled={!!editingProgram}
                />
              </div>
              <div className="space-y-2">
                <Label>{t('program.category')} *</Label>
                <Select
                  value={formData.category}
                  onValueChange={(v) => setFormData({ ...formData, category: v as ProgramCategory })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {t(`category.${cat.value}`)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>{t('program.name')} (EN) *</Label>
              <Input
                value={formData.program_name}
                onChange={(e) => setFormData({ ...formData, program_name: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t('program.name')} (VN)</Label>
                <Input
                  value={formData.program_name_vn}
                  onChange={(e) => setFormData({ ...formData, program_name_vn: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>{t('program.name')} (KR)</Label>
                <Input
                  value={formData.program_name_kr}
                  onChange={(e) => setFormData({ ...formData, program_name_kr: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t('trainingLevel.title')}</Label>
                <Select
                  value={formData.training_level || 'none'}
                  onValueChange={(v) => setFormData({ ...formData, training_level: v === 'none' ? '' : v as TrainingLevel })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t('common.select')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">-</SelectItem>
                    {TRAINING_LEVELS.map((level) => (
                      <SelectItem key={level.value} value={level.value}>
                        {t(`trainingLevel.${level.value}`)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{t('trainingType.title')}</Label>
                <Select
                  value={formData.training_type || 'none'}
                  onValueChange={(v) => setFormData({ ...formData, training_type: v === 'none' ? '' : v as TrainingType })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t('common.select')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">-</SelectItem>
                    {TRAINING_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {t(`trainingType.${type.value}`)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>{t('program.targetPositions')}</Label>
              <div className="flex flex-wrap gap-2 p-2 border rounded-md">
                {positions.map((pos) => (
                  <label key={pos.value} className="flex items-center gap-1.5 text-sm">
                    <Checkbox
                      checked={formData.target_positions.includes(pos.value)}
                      onCheckedChange={(checked) => {
                        setFormData({
                          ...formData,
                          target_positions: checked
                            ? [...formData.target_positions, pos.value]
                            : formData.target_positions.filter(p => p !== pos.value),
                        });
                      }}
                    />
                    {t(`position.${pos.value}`)}
                  </label>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>{t('program.passingScore')}</Label>
                <Input
                  type="number"
                  value={formData.passing_score}
                  onChange={(e) => setFormData({ ...formData, passing_score: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div className="space-y-2">
                <Label>{t('program.duration')}</Label>
                <Input
                  type="number"
                  value={formData.duration_hours}
                  onChange={(e) => setFormData({ ...formData, duration_hours: parseInt(e.target.value) || 1 })}
                />
              </div>
              <div className="space-y-2">
                <Label>{t('program.validity')}</Label>
                <Input
                  type="number"
                  value={formData.validity_months ?? ''}
                  onChange={(e) => setFormData({ ...formData, validity_months: e.target.value ? parseInt(e.target.value) : null })}
                  placeholder="-"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>{t('program.tags')}</Label>
              <Textarea
                value={formData.tags}
                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                placeholder={t('program.tagsPlaceholder')}
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFormDialogOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button onClick={handleSaveProgram}>
              {t('common.save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Detail Dialog */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{t('program.viewDetail')}</DialogTitle>
            <DialogDescription>{viewingProgram?.program_code}</DialogDescription>
          </DialogHeader>
          {viewingProgram && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">{t('program.code')}</p>
                  <p className="font-medium font-mono">{viewingProgram.program_code}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t('program.category')}</p>
                  <Badge variant={getCategoryBadgeVariant(viewingProgram.category) as 'default'}>
                    {t(`category.${viewingProgram.category}`)}
                  </Badge>
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t('program.name')}</p>
                <p className="font-medium">{getProgramName(viewingProgram)}</p>
              </div>
              {viewingProgram.training_level && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">{t('trainingLevel.title')}</p>
                    <p className="font-medium">{t(`trainingLevel.${viewingProgram.training_level}`)}</p>
                  </div>
                  {viewingProgram.training_type && (
                    <div>
                      <p className="text-sm text-muted-foreground">{t('trainingType.title')}</p>
                      <p className="font-medium">{t(`trainingType.${viewingProgram.training_type}`)}</p>
                    </div>
                  )}
                </div>
              )}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">{t('program.passingScore')}</p>
                  <p className="font-medium">{viewingProgram.passing_score}{t('program.scoreUnit')}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t('program.duration')}</p>
                  <p className="font-medium">{viewingProgram.duration_hours}{t('program.hours')}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t('program.validity')}</p>
                  <p className="font-medium">
                    {viewingProgram.validity_months ? `${viewingProgram.validity_months}${t('program.months')}` : '-'}
                  </p>
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t('program.targetPositions')}</p>
                <div className="flex flex-wrap gap-1 mt-1">
                  {viewingProgram.target_positions.map((pos) => (
                    <Badge key={pos} variant="outline">{t(`position.${pos}`)}</Badge>
                  ))}
                </div>
              </div>
              {viewingProgram.tags.length > 0 && (
                <div>
                  <p className="text-sm text-muted-foreground">{t('program.tags')}</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {viewingProgram.tags.map((tag) => (
                      <Badge key={tag} variant="secondary">{tag}</Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailDialogOpen(false)}>
              {t('common.close')}
            </Button>
            {viewingProgram && (
              <Button onClick={() => {
                setDetailDialogOpen(false);
                handleOpenEdit(viewingProgram);
              }}>
                <Pencil className="h-4 w-4 mr-2" />
                {t('common.edit')}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
