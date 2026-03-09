import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Search, Loader2 } from 'lucide-react';
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
import type { Employee } from '@/types';
import type { StickerFormDialogProps } from './types';

export function StickerFormDialog({
  open,
  onOpenChange,
  editingSticker,
  form,
  onFormChange,
  employees,
  isSaving,
  onSave,
}: StickerFormDialogProps) {
  const { t } = useTranslation();
  const [employeeSearch, setEmployeeSearch] = useState('');

  const filteredEmployees = employees.filter((e: Employee) => {
    if (!employeeSearch) return true;
    const q = employeeSearch.toLowerCase();
    return (
      e.employee_name.toLowerCase().includes(q) ||
      e.employee_id.toLowerCase().includes(q) ||
      e.department.toLowerCase().includes(q)
    );
  });

  function selectEmployee(emp: Employee) {
    onFormChange((prev) => ({
      ...prev,
      employee_id: emp.employee_id,
      employee_name: emp.employee_name,
      department: emp.department,
      building: emp.building,
      line: emp.line,
    }));
    setEmployeeSearch('');
  }

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) {
      setEmployeeSearch('');
    }
    onOpenChange(nextOpen);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {editingSticker
              ? t('inspectorStickers.dialog.editTitle')
              : t('inspectorStickers.dialog.createTitle')}
          </DialogTitle>
          <DialogDescription>
            {t('inspectorStickers.dialog.description')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>{t('inspectorStickers.columns.stickerId')} *</Label>
            <Input
              value={form.sticker_id}
              onChange={(e) => onFormChange((prev) => ({ ...prev, sticker_id: e.target.value }))}
              placeholder={t('inspectorStickers.dialog.stickerIdPlaceholder')}
            />
          </div>

          <div className="space-y-2">
            <Label>{t('inspectorStickers.dialog.employee')} *</Label>
            {form.employee_id ? (
              <div className="flex items-center gap-2 p-2 border rounded-md bg-muted/50">
                <div className="flex-1">
                  <p className="font-medium">{form.employee_name}</p>
                  <p className="text-sm text-muted-foreground">
                    {form.employee_id} · {form.department} · {form.building}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onFormChange((prev) => ({
                    ...prev,
                    employee_id: '',
                    employee_name: '',
                    department: '',
                    building: '',
                    line: '',
                  }))}
                >
                  {t('common.change')}
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder={t('inspectorStickers.dialog.searchEmployee')}
                    value={employeeSearch}
                    onChange={(e) => setEmployeeSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>
                {employeeSearch && (
                  <div className="max-h-48 overflow-y-auto border rounded-md">
                    {filteredEmployees.slice(0, 20).map((emp: Employee) => (
                      <button
                        key={emp.employee_id}
                        type="button"
                        className="w-full text-left px-3 py-2 hover:bg-muted/50 border-b last:border-b-0 transition-colors"
                        onClick={() => selectEmployee(emp)}
                      >
                        <p className="font-medium text-sm">{emp.employee_name}</p>
                        <p className="text-xs text-muted-foreground">
                          {emp.employee_id} · {emp.department} · {emp.building}
                        </p>
                      </button>
                    ))}
                    {filteredEmployees.length === 0 && (
                      <p className="text-sm text-muted-foreground p-3">
                        {t('inspectorStickers.dialog.noEmployeeFound')}
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label>{t('inspectorStickers.columns.notes')}</Label>
            <Textarea
              value={form.notes}
              onChange={(e) => onFormChange((prev) => ({ ...prev, notes: e.target.value }))}
              placeholder={t('inspectorStickers.dialog.notesPlaceholder')}
              rows={2}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>
            {t('common.cancel')}
          </Button>
          <Button onClick={onSave} disabled={isSaving}>
            {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {editingSticker ? t('common.save') : t('common.create')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
