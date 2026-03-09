/**
 * CompetencyFormDialog - Add/Edit competency dialog
 */

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
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
import { useToast } from '@/hooks/use-toast';
import * as api from '@/services/api';
import type { Competency, CompetencyCategory } from '@/types/curriculum';

const CATEGORIES: CompetencyCategory[] = [
  'TECHNICAL',
  'QUALITY',
  'SAFETY',
  'LEADERSHIP',
  'COMMUNICATION',
  'PROCESS',
];

interface CompFormState {
  competency_code: string;
  name: string;
  name_vn: string;
  name_kr: string;
  description: string;
  category: CompetencyCategory;
  is_core: boolean;
}

const INITIAL_FORM: CompFormState = {
  competency_code: '',
  name: '',
  name_vn: '',
  name_kr: '',
  description: '',
  category: 'TECHNICAL',
  is_core: false,
};

interface CompetencyFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingCompetency: Competency | null;
  onDataChanged: () => void;
}

export function CompetencyFormDialog({
  open,
  onOpenChange,
  editingCompetency,
  onDataChanged,
}: CompetencyFormDialogProps) {
  const { t } = useTranslation();
  const { toast } = useToast();

  const [compForm, setCompForm] = useState<CompFormState>(INITIAL_FORM);

  useEffect(() => {
    if (open) {
      if (editingCompetency) {
        setCompForm({
          competency_code: editingCompetency.competency_code,
          name: editingCompetency.name,
          name_vn: editingCompetency.name_vn,
          name_kr: editingCompetency.name_kr,
          description: editingCompetency.description,
          category: editingCompetency.category,
          is_core: editingCompetency.is_core,
        });
      } else {
        setCompForm(INITIAL_FORM);
      }
    }
  }, [open, editingCompetency]);

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
      onOpenChange(false);
      onDataChanged();
    } catch {
      toast({ title: t('messages.saveError'), variant: 'destructive' });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
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
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t('common.cancel')}
          </Button>
          <Button onClick={saveCompetency}>{t('common.save')}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
