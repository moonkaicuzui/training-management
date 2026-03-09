import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { logger } from '@/utils/logger';
import * as api from '@/services/api';
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
import type { TrainerType } from '@/types';
import type { TrainerWithStats } from './types';

interface TrainerFormDialogProps {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  trainer?: TrainerWithStats | null;
}

export default function TrainerFormDialog({
  open,
  onClose,
  onSaved,
  trainer,
}: TrainerFormDialogProps) {
  const { t } = useTranslation();
  const isEdit = !!trainer;
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    trainer_name: trainer?.trainer_name || '',
    trainer_type: trainer?.trainer_type || 'INTERNAL' as TrainerType,
    department: trainer?.department || '',
    company: trainer?.company || '',
    specializations: trainer?.specializations?.join(', ') || '',
    email: trainer?.email || '',
    phone: trainer?.phone || '',
    certifications: trainer?.certifications?.join(', ') || '',
  });

  const handleSubmit = async () => {
    setIsSaving(true);
    try {
      const trainerData = {
        trainer_name: formData.trainer_name,
        trainer_type: formData.trainer_type as TrainerType,
        department: formData.trainer_type === 'INTERNAL' ? formData.department : undefined,
        company: formData.trainer_type === 'EXTERNAL' ? formData.company : undefined,
        specializations: formData.specializations.split(',').map((s: string) => s.trim()).filter(Boolean),
        email: formData.email || undefined,
        phone: formData.phone || undefined,
        certifications: formData.certifications ? formData.certifications.split(',').map((s: string) => s.trim()).filter(Boolean) : undefined,
        status: 'ACTIVE' as const,
      };

      if (isEdit && trainer) {
        await api.updateTrainer(trainer.trainer_id, trainerData);
      } else {
        await api.createTrainer(trainerData);
      }
      onSaved();
      onClose();
    } catch (error) {
      logger.error('Failed to save trainer:', error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? t('trainers.editTrainer') : t('trainers.addTrainer')}</DialogTitle>
          <DialogDescription>
            {isEdit ? t('trainers.editDescription') : t('trainers.addDescription')}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t('trainers.nameRequired')}</Label>
              <Input
                value={formData.trainer_name}
                onChange={(e) => setFormData({ ...formData, trainer_name: e.target.value })}
                placeholder={t('trainers.namePlaceholder')}
              />
            </div>
            <div className="space-y-2">
              <Label>{t('trainers.typeRequired')}</Label>
              <Select
                value={formData.trainer_type}
                onValueChange={(value: TrainerType) => setFormData({ ...formData, trainer_type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="INTERNAL">{t('trainers.internal')}</SelectItem>
                  <SelectItem value="EXTERNAL">{t('trainers.external')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {formData.trainer_type === 'INTERNAL' ? (
            <div className="space-y-2">
              <Label>{t('trainers.department')}</Label>
              <Select
                value={formData.department}
                onValueChange={(value) => setFormData({ ...formData, department: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('trainers.departmentPlaceholder')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="QIP">QIP</SelectItem>
                  <SelectItem value="PRODUCTION">PRODUCTION</SelectItem>
                  <SelectItem value="MTL">MTL</SelectItem>
                  <SelectItem value="OSC">OSC</SelectItem>
                </SelectContent>
              </Select>
            </div>
          ) : (
            <div className="space-y-2">
              <Label>{t('trainers.company')}</Label>
              <Input
                value={formData.company}
                onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                placeholder={t('trainers.companyPlaceholder')}
              />
            </div>
          )}

          <div className="space-y-2">
            <Label>{t('trainers.specialty')}</Label>
            <Textarea
              value={formData.specializations}
              onChange={(e) => setFormData({ ...formData, specializations: e.target.value })}
              placeholder={t('trainers.specialtyPlaceholder')}
              rows={2}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t('trainers.email')}</Label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="email@example.com"
              />
            </div>
            <div className="space-y-2">
              <Label>{t('trainers.phone')}</Label>
              <Input
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="0901234567"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>{t('trainers.certifications')}</Label>
            <Input
              value={formData.certifications}
              onChange={(e) => setFormData({ ...formData, certifications: e.target.value })}
              placeholder={t('trainers.certificationsPlaceholder')}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSaving}>
            {t('common.cancel')}
          </Button>
          <Button onClick={handleSubmit} disabled={isSaving}>
            {isSaving ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
            ) : null}
            {isEdit ? t('common.edit') : t('trainers.register')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
