/**
 * TECH / NEW MODEL - 모델 리뷰지침 관리 페이지
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Plus, Pencil, Trash2, X, Loader2, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useFileUpload } from '@/hooks/useFileUpload';
import { useShallow } from 'zustand/react/shallow';
import { useTechModelStore } from '@/stores/techModelStore';
import { useAuthStore } from '@/stores/authStore';
import type {
  MaterialPoint,
  ProcessPoint,
  StandardInfo,
  ReferencePhoto,
  TechReviewGuideline,
} from '@/types/techModel';

const MATERIAL_POINTS: MaterialPoint[] = ['Upper', 'Outsole', 'Midsole', 'Adhesive', 'Accessories'];
const PROCESS_POINTS: ProcessPoint[] = ['Cutting', 'Stitching', 'Lasting', 'Assembling', 'Finishing'];
const STANDARD_INFOS: StandardInfo[] = ['Dimension', 'Weight', 'Color', 'Strength', 'Appearance'];

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
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="w-64">
              <Label>{t('tech.guidelines.filterByModel')}</Label>
              <Select value={modelFilter} onValueChange={setModelFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('common.all')}</SelectItem>
                  {models.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.season} - {m.modelName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="text-sm text-muted-foreground mt-5">
              {t('common.count')}: {filteredGuidelines.length}
            </div>
          </div>
        </CardContent>
      </Card>

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
            <Card key={g.id} className="overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-base">
                    {modelNameMap.get(g.modelId) || g.modelId}
                  </CardTitle>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="sm" onClick={() => openEditDialog(g)}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDeleteConfirmId(g.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  <Badge variant="outline" className="text-xs">{t(`tech.materialPoints.${g.materialPoint}`)}</Badge>
                  <Badge variant="secondary" className="text-xs">{t(`tech.processPoints.${g.processPoint}`)}</Badge>
                  <Badge className="text-xs">{t(`tech.standardInfos.${g.standardInfo}`)}</Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-0 space-y-2">
                <div>
                  <span className="text-xs text-muted-foreground">{t('tech.guidelines.processName')}:</span>
                  <p className="text-sm font-medium">{g.processName}</p>
                </div>
                {g.details && (
                  <div>
                    <span className="text-xs text-muted-foreground">{t('tech.guidelines.details')}:</span>
                    <p className="text-sm line-clamp-3">{g.details}</p>
                  </div>
                )}
                {g.referencePhotos && g.referencePhotos.length > 0 && (
                  <div>
                    <span className="text-xs text-muted-foreground">{t('tech.guidelines.referencePhotos')}:</span>
                    <div className="flex gap-2 mt-1 flex-wrap">
                      {g.referencePhotos.map((photo, idx) => (
                        <button
                          key={idx}
                          onClick={() => setPreviewPhoto(photo.url)}
                          className="w-16 h-16 rounded border overflow-hidden hover:ring-2 ring-primary transition-all"
                        >
                          <img
                            src={photo.url}
                            alt={photo.originalName}
                            className="w-full h-full object-cover"
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingId ? t('tech.guidelines.editGuideline') : t('tech.guidelines.addGuideline')}
            </DialogTitle>
            <DialogDescription>
              {t('tech.guidelines.dialogDescription')}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* Model Select */}
            <div className="space-y-2">
              <Label>{t('tech.guidelines.selectModel')} *</Label>
              <Select value={formModelId} onValueChange={setFormModelId}>
                <SelectTrigger>
                  <SelectValue placeholder={t('tech.guidelines.selectModelPlaceholder')} />
                </SelectTrigger>
                <SelectContent>
                  {models.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.season} - {m.modelName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 3 Point Selectors */}
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-2">
                <Label>{t('tech.guidelines.materialPoint')} *</Label>
                <Select value={formMaterialPoint} onValueChange={(v) => setFormMaterialPoint(v as MaterialPoint)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MATERIAL_POINTS.map((p) => (
                      <SelectItem key={p} value={p}>{t(`tech.materialPoints.${p}`)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{t('tech.guidelines.processPoint')} *</Label>
                <Select value={formProcessPoint} onValueChange={(v) => setFormProcessPoint(v as ProcessPoint)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PROCESS_POINTS.map((p) => (
                      <SelectItem key={p} value={p}>{t(`tech.processPoints.${p}`)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{t('tech.guidelines.standardInfo')} *</Label>
                <Select value={formStandardInfo} onValueChange={(v) => setFormStandardInfo(v as StandardInfo)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STANDARD_INFOS.map((s) => (
                      <SelectItem key={s} value={s}>{t(`tech.standardInfos.${s}`)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Process Name */}
            <div className="space-y-2">
              <Label>{t('tech.guidelines.processName')} *</Label>
              <Input
                value={formProcessName}
                onChange={(e) => setFormProcessName(e.target.value)}
                placeholder={t('tech.guidelines.processNamePlaceholder')}
              />
            </div>

            {/* Details */}
            <div className="space-y-2">
              <Label>{t('tech.guidelines.details')}</Label>
              <Textarea
                value={formDetails}
                onChange={(e) => setFormDetails(e.target.value)}
                placeholder={t('tech.guidelines.detailsPlaceholder')}
                rows={4}
              />
            </div>

            {/* Reference Photos */}
            <div className="space-y-2">
              <Label>{t('tech.guidelines.referencePhotos')}</Label>

              {/* Existing photos */}
              {formPhotos.length > 0 && (
                <div className="flex gap-2 flex-wrap">
                  {formPhotos.map((photo, idx) => (
                    <div key={idx} className="relative w-20 h-20 rounded border overflow-hidden group">
                      <img src={photo.url} alt={photo.originalName} className="w-full h-full object-cover" />
                      <button
                        onClick={() => removeExistingPhoto(idx)}
                        className="absolute top-0.5 right-0.5 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Pending files */}
              {pendingFiles.length > 0 && (
                <div className="flex gap-2 flex-wrap">
                  {pendingFiles.map((file, idx) => (
                    <div key={idx} className="relative w-20 h-20 rounded border overflow-hidden group bg-muted">
                      <img
                        src={URL.createObjectURL(file)}
                        alt={file.name}
                        className="w-full h-full object-cover"
                      />
                      <button
                        onClick={() => removePendingFile(idx)}
                        className="absolute top-0.5 right-0.5 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <label className="flex items-center gap-2 cursor-pointer border rounded-lg p-3 hover:bg-muted transition-colors">
                <Upload className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">{t('tech.guidelines.uploadPhoto')}</span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button onClick={handleSubmit} disabled={isLoading || isUploading}>
              {(isLoading || isUploading) && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {isUploading ? t('tech.guidelines.uploading') : t('common.save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={!!deleteConfirmId} onOpenChange={() => setDeleteConfirmId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('tech.guidelines.deleteConfirm')}</DialogTitle>
            <DialogDescription>
              {t('tech.guidelines.deleteWarning')}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirmId(null)}>
              {t('common.cancel')}
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteConfirmId && handleDelete(deleteConfirmId)}
              disabled={isLoading}
            >
              {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {t('common.delete')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Photo Preview Dialog */}
      <Dialog open={!!previewPhoto} onOpenChange={() => setPreviewPhoto(null)}>
        <DialogContent className="max-w-4xl p-2">
          <DialogHeader className="sr-only">
            <DialogTitle>{t('tech.guidelines.photoPreview')}</DialogTitle>
          </DialogHeader>
          {previewPhoto && (
            <div className="flex items-center justify-center">
              <img
                src={previewPhoto}
                alt="Preview"
                className="max-w-full max-h-[80vh] object-contain rounded"
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
