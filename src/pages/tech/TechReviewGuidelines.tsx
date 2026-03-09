/**
 * TECH / NEW MODEL - 모델 리뷰지침 관리 페이지
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Plus, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useFileUpload } from '@/hooks/useFileUpload';
import { useShallow } from 'zustand/react/shallow';
import { useTechModelStore } from '@/stores/techModelStore';
import { useAuthStore } from '@/stores/authStore';
import {
  GuidelineFilterCard,
  GuidelineCard,
  GuidelineFormDialog,
  GuidelineDeleteDialog,
  PhotoPreviewDialog,
} from '@/components/tech';
import type {
  MaterialPoint,
  ProcessPoint,
  StandardInfo,
  ReferencePhoto,
  TechReviewGuideline,
} from '@/types/techModel';

export default function TechReviewGuidelines() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const user = useAuthStore((s) => s.user);
  const {
    models,
    guidelines,
    isLoading,
    fetchModels,
    fetchGuidelines,
    createGuideline,
    updateGuideline,
    deleteGuideline,
  } = useTechModelStore(useShallow((state) => ({ models: state.models, guidelines: state.guidelines, isLoading: state.isLoading, fetchModels: state.fetchModels, fetchGuidelines: state.fetchGuidelines, createGuideline: state.createGuideline, updateGuideline: state.updateGuideline, deleteGuideline: state.deleteGuideline })));
  const { uploadMultiple, isUploading } = useFileUpload({
    folder: 'tech-review-photos',
    maxSizeBytes: 10 * 1024 * 1024,
    allowedTypes: ['image/png', 'image/jpeg', 'image/webp'],
  });

  const [modelFilter, setModelFilter] = useState<string>(searchParams.get('modelId') || 'all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [previewPhoto, setPreviewPhoto] = useState<string | null>(null);

  // Form state
  const [formModelId, setFormModelId] = useState('');
  const [formMaterialPoint, setFormMaterialPoint] = useState<MaterialPoint>('Upper');
  const [formProcessPoint, setFormProcessPoint] = useState<ProcessPoint>('Cutting');
  const [formStandardInfo, setFormStandardInfo] = useState<StandardInfo>('Dimension');
  const [formProcessName, setFormProcessName] = useState('');
  const [formDetails, setFormDetails] = useState('');
  const [formPhotos, setFormPhotos] = useState<ReferencePhoto[]>([]);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);

  // 초기 데이터 로드
  useEffect(() => {
    fetchModels();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (modelFilter && modelFilter !== 'all') {
      fetchGuidelines(modelFilter);
    } else {
      fetchGuidelines();
    }
  }, [modelFilter]); // eslint-disable-line react-hooks/exhaustive-deps

  // URL param에서 modelId 반영
  useEffect(() => {
    const paramModelId = searchParams.get('modelId');
    if (paramModelId) {
      setModelFilter(paramModelId);
    }
  }, [searchParams]);

  const filteredGuidelines = useMemo(() => {
    if (modelFilter === 'all') return guidelines;
    return guidelines.filter((g) => g.modelId === modelFilter);
  }, [guidelines, modelFilter]);

  // 모델 이름 매핑
  const modelNameMap = useMemo(() => {
    const map = new Map<string, string>();
    models.forEach((m) => map.set(m.id, `${m.season} - ${m.modelName}`));
    return map;
  }, [models]);

  const openCreateDialog = () => {
    setEditingId(null);
    setFormModelId(modelFilter !== 'all' ? modelFilter : (models[0]?.id || ''));
    setFormMaterialPoint('Upper');
    setFormProcessPoint('Cutting');
    setFormStandardInfo('Dimension');
    setFormProcessName('');
    setFormDetails('');
    setFormPhotos([]);
    setPendingFiles([]);
    setDialogOpen(true);
  };

  const openEditDialog = (g: TechReviewGuideline) => {
    setEditingId(g.id);
    setFormModelId(g.modelId);
    setFormMaterialPoint(g.materialPoint);
    setFormProcessPoint(g.processPoint);
    setFormStandardInfo(g.standardInfo);
    setFormProcessName(g.processName);
    setFormDetails(g.details);
    setFormPhotos(g.referencePhotos || []);
    setPendingFiles([]);
    setDialogOpen(true);
  };

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      setPendingFiles((prev) => [...prev, ...Array.from(files)]);
    }
    e.target.value = '';
  }, []);

  const removePendingFile = (index: number) => {
    setPendingFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const removeExistingPhoto = (index: number) => {
    setFormPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!formModelId || !formProcessName.trim()) {
      toast({ title: t('common.error'), description: t('tech.guidelines.fillRequired'), variant: 'destructive' });
      return;
    }

    try {
      // 새 파일 업로드
      let newPhotos: ReferencePhoto[] = [];
      if (pendingFiles.length > 0) {
        const uploadResults = await uploadMultiple(pendingFiles);
        newPhotos = uploadResults.map((r) => ({
          url: r.downloadURL,
          storagePath: r.storagePath,
          originalName: r.originalName,
        }));
      }

      const allPhotos = [...formPhotos, ...newPhotos];

      if (editingId) {
        await updateGuideline(editingId, {
          modelId: formModelId,
          materialPoint: formMaterialPoint,
          processPoint: formProcessPoint,
          standardInfo: formStandardInfo,
          processName: formProcessName,
          details: formDetails,
          referencePhotos: allPhotos,
        });
        toast({ title: t('tech.guidelines.updated') });
      } else {
        await createGuideline({
          modelId: formModelId,
          materialPoint: formMaterialPoint,
          processPoint: formProcessPoint,
          standardInfo: formStandardInfo,
          processName: formProcessName,
          details: formDetails,
          referencePhotos: allPhotos,
          createdBy: user?.email || '',
        });
        toast({ title: t('tech.guidelines.created') });
      }
      setDialogOpen(false);
    } catch {
      toast({ title: t('common.error'), description: t('tech.guidelines.saveFailed'), variant: 'destructive' });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteGuideline(id);
      toast({ title: t('tech.guidelines.deleted') });
      setDeleteConfirmId(null);
    } catch {
      toast({ title: t('common.error'), description: t('tech.guidelines.deleteFailed'), variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t('tech.guidelines.title')}</h1>
          <p className="text-muted-foreground">{t('tech.guidelines.description')}</p>
        </div>
        <Button onClick={openCreateDialog} disabled={models.length === 0}>
          <Plus className="h-4 w-4 mr-2" />
          {t('tech.guidelines.addGuideline')}
        </Button>
      </div>

      {/* Filters */}
      <GuidelineFilterCard
        modelFilter={modelFilter}
        onModelFilterChange={setModelFilter}
        models={models}
        filteredCount={filteredGuidelines.length}
      />

      {/* Guidelines List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : filteredGuidelines.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            {t('tech.guidelines.noGuidelines')}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredGuidelines.map((g) => (
            <GuidelineCard
              key={g.id}
              guideline={g}
              modelName={modelNameMap.get(g.modelId) || g.modelId}
              onEdit={openEditDialog}
              onDelete={setDeleteConfirmId}
              onPhotoPreview={setPreviewPhoto}
            />
          ))}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <GuidelineFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        editingId={editingId}
        models={models}
        formModelId={formModelId}
        onFormModelIdChange={setFormModelId}
        formMaterialPoint={formMaterialPoint}
        onFormMaterialPointChange={setFormMaterialPoint}
        formProcessPoint={formProcessPoint}
        onFormProcessPointChange={setFormProcessPoint}
        formStandardInfo={formStandardInfo}
        onFormStandardInfoChange={setFormStandardInfo}
        formProcessName={formProcessName}
        onFormProcessNameChange={setFormProcessName}
        formDetails={formDetails}
        onFormDetailsChange={setFormDetails}
        formPhotos={formPhotos}
        onRemoveExistingPhoto={removeExistingPhoto}
        pendingFiles={pendingFiles}
        onRemovePendingFile={removePendingFile}
        onFileSelect={handleFileSelect}
        onSubmit={handleSubmit}
        isLoading={isLoading}
        isUploading={isUploading}
      />

      {/* Delete Confirmation */}
      <GuidelineDeleteDialog
        deleteConfirmId={deleteConfirmId}
        onClose={() => setDeleteConfirmId(null)}
        onConfirm={handleDelete}
        isLoading={isLoading}
      />

      {/* Photo Preview */}
      <PhotoPreviewDialog
        previewPhoto={previewPhoto}
        onClose={() => setPreviewPhoto(null)}
      />
    </div>
  );
}
