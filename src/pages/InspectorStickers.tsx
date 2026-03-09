import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Sticker } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import * as api from '@/services/api';
import type {
  InspectorSticker,
  InspectorStickerInput,
  StickerStatus,
} from '@/types/inspectorSticker';
import type { Employee } from '@/types';
import {
  StickerFilters,
  StickerTable,
  StickerFormDialog,
  DeleteConfirmDialog,
  EMPTY_FORM,
} from '@/components/inspector-stickers';
import type { FormState } from '@/components/inspector-stickers';

export default function InspectorStickers() {
  const { t } = useTranslation();
  const { toast } = useToast();

  const [stickers, setStickers] = useState<InspectorSticker[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingSticker, setEditingSticker] = useState<InspectorSticker | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<InspectorSticker | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [isSaving, setIsSaving] = useState(false);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [stickerData, employeeData] = await Promise.all([
        api.inspectorSticker.getStickers(statusFilter !== 'all' ? statusFilter : undefined),
        api.getEmployees(),
      ]);
      setStickers(stickerData);
      setEmployees(employeeData);
    } catch (error) {
      toast({
        title: t('common.error'),
        description: String(error),
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter, toast, t]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filteredStickers = stickers.filter((s) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      s.sticker_id.toLowerCase().includes(q) ||
      s.employee_name.toLowerCase().includes(q) ||
      s.employee_id.toLowerCase().includes(q) ||
      (s.department || '').toLowerCase().includes(q) ||
      (s.building || '').toLowerCase().includes(q)
    );
  });

  function openCreateDialog() {
    setEditingSticker(null);
    setForm(EMPTY_FORM);
    setDialogOpen(true);
  }

  function openEditDialog(sticker: InspectorSticker) {
    setEditingSticker(sticker);
    setForm({
      sticker_id: sticker.sticker_id,
      employee_id: sticker.employee_id,
      employee_name: sticker.employee_name,
      department: sticker.department || '',
      building: sticker.building || '',
      line: sticker.line || '',
      notes: sticker.notes || '',
    });
    setDialogOpen(true);
  }

  function openDeleteDialog(sticker: InspectorSticker) {
    setDeleteTarget(sticker);
    setDeleteDialogOpen(true);
  }

  async function handleSave() {
    if (!form.sticker_id.trim()) {
      toast({
        title: t('common.error'),
        description: t('inspectorStickers.validation.stickerIdRequired'),
        variant: 'destructive',
      });
      return;
    }
    if (!form.employee_id.trim()) {
      toast({
        title: t('common.error'),
        description: t('inspectorStickers.validation.employeeRequired'),
        variant: 'destructive',
      });
      return;
    }

    setIsSaving(true);
    try {
      const input: InspectorStickerInput = {
        sticker_id: form.sticker_id.trim(),
        employee_id: form.employee_id.trim(),
        employee_name: form.employee_name.trim(),
        department: form.department || undefined,
        building: form.building || undefined,
        line: form.line || undefined,
        notes: form.notes || undefined,
      };

      if (editingSticker) {
        await api.inspectorSticker.updateSticker(editingSticker.id, input);
        toast({ title: t('inspectorStickers.toast.updated') });
      } else {
        await api.inspectorSticker.createSticker(input);
        toast({ title: t('inspectorStickers.toast.created') });
      }

      setDialogOpen(false);
      loadData();
    } catch (error) {
      toast({
        title: t('common.error'),
        description: String(error instanceof Error ? error.message : error),
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setIsSaving(true);
    try {
      await api.inspectorSticker.deleteSticker(deleteTarget.id);
      toast({ title: t('inspectorStickers.toast.deleted') });
      setDeleteDialogOpen(false);
      setDeleteTarget(null);
      loadData();
    } catch (error) {
      toast({
        title: t('common.error'),
        description: String(error),
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  }

  async function handleToggleStatus(sticker: InspectorSticker) {
    const newStatus: StickerStatus = sticker.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    try {
      await api.inspectorSticker.updateSticker(sticker.id, { status: newStatus });
      toast({
        title: newStatus === 'ACTIVE'
          ? t('inspectorStickers.toast.activated')
          : t('inspectorStickers.toast.deactivated'),
      });
      loadData();
    } catch (error) {
      toast({
        title: t('common.error'),
        description: String(error),
        variant: 'destructive',
      });
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Sticker className="h-6 w-6" />
            {t('inspectorStickers.title')}
          </h1>
          <p className="text-muted-foreground mt-1">
            {t('inspectorStickers.description')}
          </p>
        </div>
        <Button onClick={openCreateDialog}>
          <Plus className="h-4 w-4 mr-2" />
          {t('inspectorStickers.addSticker')}
        </Button>
      </div>

      <StickerFilters
        search={search}
        onSearchChange={setSearch}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
      />

      <StickerTable
        stickers={filteredStickers}
        isLoading={isLoading}
        search={search}
        onEdit={openEditDialog}
        onDelete={openDeleteDialog}
        onToggleStatus={handleToggleStatus}
      />

      <StickerFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        editingSticker={editingSticker}
        form={form}
        onFormChange={setForm}
        employees={employees}
        isSaving={isSaving}
        onSave={handleSave}
      />

      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        deleteTarget={deleteTarget}
        isSaving={isSaving}
        onDelete={handleDelete}
      />
    </div>
  );
}
