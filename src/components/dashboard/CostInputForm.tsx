/**
 * Cost Input Form Component
 * 교육 비용 입력 다이얼로그
 */

import { useState, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import * as api from '@/services/api';

interface CostInputFormProps {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}

export default function CostInputForm({ open, onClose, onSaved }: CostInputFormProps) {
  const { t } = useTranslation();
  const now = new Date();

  const [year, setYear] = useState(String(now.getFullYear()));
  const [month, setMonth] = useState(String(now.getMonth() + 1).padStart(2, '0'));
  const [instructorFee, setInstructorFee] = useState('');
  const [materialCost, setMaterialCost] = useState('');
  const [facilityCost, setFacilityCost] = useState('');
  const [otherCost, setOtherCost] = useState('');
  const [saving, setSaving] = useState(false);

  const total = useMemo(() => {
    return (
      (parseFloat(instructorFee) || 0) +
      (parseFloat(materialCost) || 0) +
      (parseFloat(facilityCost) || 0) +
      (parseFloat(otherCost) || 0)
    );
  }, [instructorFee, materialCost, facilityCost, otherCost]);

  const formatCurrency = useCallback((value: number) => {
    return new Intl.NumberFormat('vi-VN').format(value);
  }, []);

  const years = useMemo(() => {
    const currentYear = now.getFullYear();
    return Array.from({ length: 5 }, (_, i) => String(currentYear - i));
  }, []);

  const months = useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0'));
  }, []);

  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      const period = `${year}-${month}`;
      await api.saveTrainingCost({
        period,
        instructor_fee: parseFloat(instructorFee) || 0,
        material_cost: parseFloat(materialCost) || 0,
        facility_cost: parseFloat(facilityCost) || 0,
        other_cost: parseFloat(otherCost) || 0,
      });
      // Reset form
      setInstructorFee('');
      setMaterialCost('');
      setFacilityCost('');
      setOtherCost('');
      onSaved();
      onClose();
    } catch {
      // Error is logged in the service layer
    } finally {
      setSaving(false);
    }
  }, [year, month, instructorFee, materialCost, facilityCost, otherCost, onSaved, onClose]);

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>{t('executive.addCost')}</DialogTitle>
          <DialogDescription>{t('executive.roiDescription')}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {/* Period Selector */}
          <div className="space-y-2">
            <Label>{t('executive.period')}</Label>
            <div className="flex gap-2">
              <Select value={year} onValueChange={setYear}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {years.map((y) => (
                    <SelectItem key={y} value={y}>
                      {y}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={month} onValueChange={setMonth}>
                <SelectTrigger className="w-[100px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {months.map((m) => (
                    <SelectItem key={m} value={m}>
                      {m}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Cost Inputs */}
          <div className="space-y-3">
            <div className="space-y-1">
              <Label htmlFor="instructor-fee">{t('executive.instructorFee')}</Label>
              <Input
                id="instructor-fee"
                type="number"
                min="0"
                placeholder="0"
                value={instructorFee}
                onChange={(e) => setInstructorFee(e.target.value)}
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="material-cost">{t('executive.materialCost')}</Label>
              <Input
                id="material-cost"
                type="number"
                min="0"
                placeholder="0"
                value={materialCost}
                onChange={(e) => setMaterialCost(e.target.value)}
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="facility-cost">{t('executive.facilityCost')}</Label>
              <Input
                id="facility-cost"
                type="number"
                min="0"
                placeholder="0"
                value={facilityCost}
                onChange={(e) => setFacilityCost(e.target.value)}
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="other-cost">{t('executive.otherCost')}</Label>
              <Input
                id="other-cost"
                type="number"
                min="0"
                placeholder="0"
                value={otherCost}
                onChange={(e) => setOtherCost(e.target.value)}
              />
            </div>
          </div>

          {/* Total */}
          <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
            <span className="font-medium">{t('executive.totalAmount')}</span>
            <span className="text-lg font-bold">{formatCurrency(total)} VND</span>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={onClose} disabled={saving}>
              {t('common.cancel')}
            </Button>
            <Button onClick={handleSave} disabled={saving || total === 0}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {t('common.save')}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
