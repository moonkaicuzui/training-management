import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { logger } from '@/utils/logger';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ExportDropdown } from '@/components/common/ExportDropdown';
import { useExport } from '@/hooks/useExport';
import { useShallow } from 'zustand/react/shallow';
import { useTrainingStore } from '@/stores/trainingStore';
import { useUIStore } from '@/stores/uiStore';
import { PageLoading } from '@/components/common/LoadingSpinner';
import type { ProgramCategory, TrainingProgram } from '@/types';
import {
  ProgramFilters,
  ProgramTable,
  ProgramFormDialog,
  ProgramDetailDialog,
  DeleteConfirmDialog,
} from '@/components/programs';
import type { ProgramFormData } from '@/components/programs';

const emptyFormData: ProgramFormData = {
  program_code: '',
  program_name: '',
  program_name_vn: '',
  program_name_kr: '',
  category: 'QIP' as ProgramCategory,
  tags: '',
  target_positions: [] as string[],
  evaluation_type: 'SCORE',
  passing_score: 80,
  grade_aa: 100,
  grade_a: 90,
  grade_b: 80,
  duration_hours: 1,
  validity_months: 12 as number | null,
  training_level: '',
  training_type: '',
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
  const [formData, setFormData] = useState<ProgramFormData>(emptyFormData);
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

  const handleRequestDelete = (programCode: string) => {
    setProgramToDelete(programCode);
    setDeleteDialogOpen(true);
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
      logger.error('[Programs] Save error:', error);
      addToast({ type: 'error', title: t('messages.saveError') + ': ' + (error instanceof Error ? error.message : String(error)) });
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
      <ProgramFilters
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        categoryFilter={categoryFilter}
        onCategoryFilterChange={setCategoryFilter}
        showInactive={showInactive}
        onShowInactiveChange={setShowInactive}
      />

      {/* Programs Table */}
      <ProgramTable
        programs={programs}
        language={language}
        onViewDetail={handleOpenDetail}
        onEdit={handleOpenEdit}
        onDelete={handleRequestDelete}
        onCreateNew={handleOpenCreate}
      />

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleDelete}
      />

      {/* Create/Edit Program Dialog */}
      <ProgramFormDialog
        open={formDialogOpen}
        onOpenChange={setFormDialogOpen}
        formData={formData}
        onFormDataChange={setFormData}
        isEditing={!!editingProgram}
        onSave={handleSaveProgram}
      />

      {/* View Detail Dialog */}
      <ProgramDetailDialog
        open={detailDialogOpen}
        onOpenChange={setDetailDialogOpen}
        program={viewingProgram}
        language={language}
        onEdit={handleOpenEdit}
      />
    </div>
  );
}
