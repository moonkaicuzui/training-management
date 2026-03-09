import { useTranslation } from 'react-i18next';
import { X, Loader2, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
import type {
  MaterialPoint,
  ProcessPoint,
  StandardInfo,
  ReferencePhoto,
  TechModel,
} from '@/types/techModel';

const MATERIAL_POINTS: MaterialPoint[] = ['Upper', 'Outsole', 'Midsole', 'Adhesive', 'Accessories'];
const PROCESS_POINTS: ProcessPoint[] = ['Cutting', 'Stitching', 'Lasting', 'Assembling', 'Finishing'];
const STANDARD_INFOS: StandardInfo[] = ['Dimension', 'Weight', 'Color', 'Strength', 'Appearance'];

interface GuidelineFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingId: string | null;
  models: TechModel[];
  formModelId: string;
  onFormModelIdChange: (value: string) => void;
  formMaterialPoint: MaterialPoint;
  onFormMaterialPointChange: (value: MaterialPoint) => void;
  formProcessPoint: ProcessPoint;
  onFormProcessPointChange: (value: ProcessPoint) => void;
  formStandardInfo: StandardInfo;
  onFormStandardInfoChange: (value: StandardInfo) => void;
  formProcessName: string;
  onFormProcessNameChange: (value: string) => void;
  formDetails: string;
  onFormDetailsChange: (value: string) => void;
  formPhotos: ReferencePhoto[];
  onRemoveExistingPhoto: (index: number) => void;
  pendingFiles: File[];
  onRemovePendingFile: (index: number) => void;
  onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSubmit: () => void;
  isLoading: boolean;
  isUploading: boolean;
}

export function GuidelineFormDialog({
  open,
  onOpenChange,
  editingId,
  models,
  formModelId,
  onFormModelIdChange,
  formMaterialPoint,
  onFormMaterialPointChange,
  formProcessPoint,
  onFormProcessPointChange,
  formStandardInfo,
  onFormStandardInfoChange,
  formProcessName,
  onFormProcessNameChange,
  formDetails,
  onFormDetailsChange,
  formPhotos,
  onRemoveExistingPhoto,
  pendingFiles,
  onRemovePendingFile,
  onFileSelect,
  onSubmit,
  isLoading,
  isUploading,
}: GuidelineFormDialogProps) {
  const { t } = useTranslation();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
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
          <div className="space-y-2">
            <Label>{t('tech.guidelines.selectModel')} *</Label>
            <Select value={formModelId} onValueChange={onFormModelIdChange}>
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

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-2">
              <Label>{t('tech.guidelines.materialPoint')} *</Label>
              <Select value={formMaterialPoint} onValueChange={(v) => onFormMaterialPointChange(v as MaterialPoint)}>
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
              <Select value={formProcessPoint} onValueChange={(v) => onFormProcessPointChange(v as ProcessPoint)}>
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
              <Select value={formStandardInfo} onValueChange={(v) => onFormStandardInfoChange(v as StandardInfo)}>
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

          <div className="space-y-2">
            <Label>{t('tech.guidelines.processName')} *</Label>
            <Input
              value={formProcessName}
              onChange={(e) => onFormProcessNameChange(e.target.value)}
              placeholder={t('tech.guidelines.processNamePlaceholder')}
            />
          </div>

          <div className="space-y-2">
            <Label>{t('tech.guidelines.details')}</Label>
            <Textarea
              value={formDetails}
              onChange={(e) => onFormDetailsChange(e.target.value)}
              placeholder={t('tech.guidelines.detailsPlaceholder')}
              rows={4}
            />
          </div>

          <div className="space-y-2">
            <Label>{t('tech.guidelines.referencePhotos')}</Label>

            {formPhotos.length > 0 && (
              <div className="flex gap-2 flex-wrap">
                {formPhotos.map((photo, idx) => (
                  <div key={idx} className="relative w-20 h-20 rounded border overflow-hidden group">
                    <img src={photo.url} alt={photo.originalName} className="w-full h-full object-cover" />
                    <button
                      onClick={() => onRemoveExistingPhoto(idx)}
                      className="absolute top-0.5 right-0.5 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

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
                      onClick={() => onRemovePendingFile(idx)}
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
                onChange={onFileSelect}
                className="hidden"
              />
            </label>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t('common.cancel')}
          </Button>
          <Button onClick={onSubmit} disabled={isLoading || isUploading}>
            {(isLoading || isUploading) && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {isUploading ? t('tech.guidelines.uploading') : t('common.save')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
