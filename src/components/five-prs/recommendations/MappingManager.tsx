import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { useRecommendationStore } from '@/stores/recommendationStore';
import type { DefectTrainingMapping } from '@/types/recommendation';

interface MappingFormData {
  defect_type: string;
  program_codes: string[];
  description: string;
  is_active: boolean;
}

const EMPTY_FORM: MappingFormData = {
  defect_type: '',
  program_codes: [],
  description: '',
  is_active: true,
};

export function MappingManager() {
  const { t } = useTranslation();
  const { mappings, programs, createMapping, updateMapping, deleteMapping } =
    useRecommendationStore();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingMapping, setEditingMapping] =
    useState<DefectTrainingMapping | null>(null);
  const [formData, setFormData] = useState<MappingFormData>(EMPTY_FORM);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const openCreateDialog = () => {
    setEditingMapping(null);
    setFormData(EMPTY_FORM);
    setIsDialogOpen(true);
  };

  const openEditDialog = (mapping: DefectTrainingMapping) => {
    setEditingMapping(mapping);
    setFormData({
      defect_type: mapping.defect_type,
      program_codes: [...mapping.program_codes],
      description: mapping.description ?? '',
      is_active: mapping.is_active,
    });
    setIsDialogOpen(true);
  };

  const handleProgramToggle = (code: string, checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      program_codes: checked
        ? [...prev.program_codes, code]
        : prev.program_codes.filter((c) => c !== code),
    }));
  };

  const handleSave = async () => {
    if (!formData.defect_type.trim() || formData.program_codes.length === 0) {
      return;
    }

    if (editingMapping) {
      await updateMapping(editingMapping.mapping_id, {
        defect_type: formData.defect_type,
        program_codes: formData.program_codes,
        description: formData.description || undefined,
        is_active: formData.is_active,
      });
    } else {
      await createMapping({
        defect_type: formData.defect_type,
        program_codes: formData.program_codes,
        description: formData.description || undefined,
        is_active: formData.is_active,
      });
    }

    setIsDialogOpen(false);
    setEditingMapping(null);
    setFormData(EMPTY_FORM);
  };

  const handleDelete = async (mappingId: string) => {
    await deleteMapping(mappingId);
    setDeleteConfirmId(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">
          {t('recommendation.mappingManager')}
        </h3>
        <Button size="sm" onClick={openCreateDialog}>
          <Plus className="mr-1.5 h-4 w-4" />
          {t('recommendation.addMapping')}
        </Button>
      </div>

      <div className="overflow-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('recommendation.defectType')}</TableHead>
              <TableHead>{t('recommendation.programCodes')}</TableHead>
              <TableHead>{t('recommendation.description')}</TableHead>
              <TableHead className="text-center">
                {t('recommendation.isActive')}
              </TableHead>
              <TableHead className="text-right">
                {t('recommendation.actions')}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {mappings.map((mapping) => (
              <TableRow key={mapping.mapping_id}>
                <TableCell className="font-medium">
                  {mapping.defect_type}
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {mapping.program_codes.map((code) => (
                      <Badge key={code} variant="outline">
                        {code}
                      </Badge>
                    ))}
                  </div>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {mapping.description ?? '-'}
                </TableCell>
                <TableCell className="text-center">
                  <Badge
                    variant={mapping.is_active ? 'success' : 'inactive'}
                  >
                    {mapping.is_active
                      ? t('recommendation.active')
                      : t('recommendation.inactive')}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openEditDialog(mapping)}
                      aria-label={t('recommendation.editMapping')}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDeleteConfirmId(mapping.mapping_id)}
                      aria-label={t('recommendation.deleteMapping')}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {mappings.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="text-center text-muted-foreground py-8"
                >
                  {t('recommendation.noMappings')}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Add / Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingMapping
                ? t('recommendation.editMapping')
                : t('recommendation.addMapping')}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="defect-type">
                {t('recommendation.defectType')}
              </Label>
              <Input
                id="defect-type"
                value={formData.defect_type}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    defect_type: e.target.value,
                  }))
                }
                placeholder={t('recommendation.defectTypePlaceholder')}
              />
            </div>

            <div className="space-y-2">
              <Label>{t('recommendation.selectPrograms')}</Label>
              <div className="max-h-48 overflow-auto rounded-md border p-3 space-y-2">
                {programs.map((program) => (
                  <div
                    key={program.program_code}
                    className="flex items-center gap-2"
                  >
                    <Checkbox
                      id={`prog-${program.program_code}`}
                      checked={formData.program_codes.includes(
                        program.program_code
                      )}
                      onCheckedChange={(checked) =>
                        handleProgramToggle(
                          program.program_code,
                          checked === true
                        )
                      }
                    />
                    <Label
                      htmlFor={`prog-${program.program_code}`}
                      className="text-sm font-normal cursor-pointer"
                    >
                      <span className="font-mono mr-1">
                        {program.program_code}
                      </span>
                      {program.program_name}
                    </Label>
                  </div>
                ))}
                {programs.length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    {t('recommendation.noProgramsAvailable')}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="mapping-desc">
                {t('recommendation.description')}
              </Label>
              <Input
                id="mapping-desc"
                value={formData.description}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                placeholder={t('recommendation.descriptionPlaceholder')}
              />
            </div>

            <div className="flex items-center gap-2">
              <Switch
                id="mapping-active"
                checked={formData.is_active}
                onCheckedChange={(checked) =>
                  setFormData((prev) => ({ ...prev, is_active: checked }))
                }
              />
              <Label htmlFor="mapping-active">
                {t('recommendation.isActive')}
              </Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button
              onClick={handleSave}
              disabled={
                !formData.defect_type.trim() ||
                formData.program_codes.length === 0
              }
            >
              {editingMapping ? t('common.save') : t('common.create')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteConfirmId !== null}
        onOpenChange={() => setDeleteConfirmId(null)}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{t('recommendation.confirmDelete')}</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            {t('recommendation.confirmDeleteMessage')}
          </p>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteConfirmId(null)}
            >
              {t('common.cancel')}
            </Button>
            <Button
              variant="destructive"
              onClick={() =>
                deleteConfirmId && handleDelete(deleteConfirmId)
              }
            >
              {t('common.delete')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
