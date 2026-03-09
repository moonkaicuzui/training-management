/**
 * Inspector Stickers Settings Page
 *
 * 제품 검사원 정품 인증 스티커 마스터 데이터 관리.
 * 스티커 ID ↔ 검사원 매핑 등록/수정/삭제.
 */

import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Plus,
  Pencil,
  Trash2,
  Search,
  Sticker,
  Loader2,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import * as api from '@/services/api';
import type {
  InspectorSticker,
  InspectorStickerInput,
  StickerStatus,
} from '@/types/inspectorSticker';
import type { Employee } from '@/types';

// ─── Form State ─────────────────────────────────────────

interface FormState {
  sticker_id: string;
  employee_id: string;
  employee_name: string;
  department: string;
  building: string;
  line: string;
  notes: string;
}

const EMPTY_FORM: FormState = {
  sticker_id: '',
  employee_id: '',
  employee_name: '',
  department: '',
  building: '',
  line: '',
  notes: '',
};

// ─── Component ──────────────────────────────────────────

export default function InspectorStickers() {
  const { t } = useTranslation();
  const { toast } = useToast();

  // Data
  const [stickers, setStickers] = useState<InspectorSticker[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filter
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Dialog
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingSticker, setEditingSticker] = useState<InspectorSticker | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<InspectorSticker | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [isSaving, setIsSaving] = useState(false);

  // Employee search
  const [employeeSearch, setEmployeeSearch] = useState('');

  // ─── Data Loading ──────────────────────────────────

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

  // ─── Filtered Data ─────────────────────────────────

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

  const filteredEmployees = employees.filter((e) => {
    if (!employeeSearch) return true;
    const q = employeeSearch.toLowerCase();
    return (
      e.employee_name.toLowerCase().includes(q) ||
      e.employee_id.toLowerCase().includes(q) ||
      e.department.toLowerCase().includes(q)
    );
  });

  // ─── Dialog Handlers ──────────────────────────────

  function openCreateDialog() {
    setEditingSticker(null);
    setForm(EMPTY_FORM);
    setEmployeeSearch('');
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
    setEmployeeSearch('');
    setDialogOpen(true);
  }

  function openDeleteDialog(sticker: InspectorSticker) {
    setDeleteTarget(sticker);
    setDeleteDialogOpen(true);
  }

  function selectEmployee(emp: Employee) {
    setForm((prev) => ({
      ...prev,
      employee_id: emp.employee_id,
      employee_name: emp.employee_name,
      department: emp.department,
      building: emp.building,
      line: emp.line,
    }));
    setEmployeeSearch('');
  }

  // ─── CRUD Handlers ────────────────────────────────

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

  // ─── Render ────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Header */}
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

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t('inspectorStickers.searchPlaceholder')}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('common.all')}</SelectItem>
                <SelectItem value="ACTIVE">{t('common.active')}</SelectItem>
                <SelectItem value="INACTIVE">{t('common.inactive')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>{t('inspectorStickers.listTitle')}</CardTitle>
          <CardDescription>
            {t('inspectorStickers.totalCount', { count: filteredStickers.length })}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredStickers.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              {search
                ? t('inspectorStickers.noSearchResults')
                : t('inspectorStickers.noData')}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('inspectorStickers.columns.stickerId')}</TableHead>
                  <TableHead>{t('inspectorStickers.columns.employeeId')}</TableHead>
                  <TableHead>{t('inspectorStickers.columns.employeeName')}</TableHead>
                  <TableHead>{t('inspectorStickers.columns.department')}</TableHead>
                  <TableHead>{t('inspectorStickers.columns.building')}</TableHead>
                  <TableHead>{t('inspectorStickers.columns.line')}</TableHead>
                  <TableHead>{t('inspectorStickers.columns.status')}</TableHead>
                  <TableHead>{t('inspectorStickers.columns.notes')}</TableHead>
                  <TableHead className="text-right">{t('common.actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStickers.map((sticker) => (
                  <TableRow key={sticker.id}>
                    <TableCell className="font-mono font-semibold">
                      {sticker.sticker_id}
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {sticker.employee_id}
                    </TableCell>
                    <TableCell>{sticker.employee_name}</TableCell>
                    <TableCell>{sticker.department || '-'}</TableCell>
                    <TableCell>{sticker.building || '-'}</TableCell>
                    <TableCell>{sticker.line || '-'}</TableCell>
                    <TableCell>
                      <Badge
                        variant={sticker.status === 'ACTIVE' ? 'default' : 'secondary'}
                        className="cursor-pointer"
                        onClick={() => handleToggleStatus(sticker)}
                      >
                        {sticker.status === 'ACTIVE'
                          ? t('common.active')
                          : t('common.inactive')}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate text-sm text-muted-foreground">
                      {sticker.notes || '-'}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditDialog(sticker)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openDeleteDialog(sticker)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
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
            {/* Sticker ID */}
            <div className="space-y-2">
              <Label>{t('inspectorStickers.columns.stickerId')} *</Label>
              <Input
                value={form.sticker_id}
                onChange={(e) => setForm((prev) => ({ ...prev, sticker_id: e.target.value }))}
                placeholder={t('inspectorStickers.dialog.stickerIdPlaceholder')}
              />
            </div>

            {/* Employee Selection */}
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
                    onClick={() => setForm((prev) => ({
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
                      {filteredEmployees.slice(0, 20).map((emp) => (
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

            {/* Notes */}
            <div className="space-y-2">
              <Label>{t('inspectorStickers.columns.notes')}</Label>
              <Textarea
                value={form.notes}
                onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))}
                placeholder={t('inspectorStickers.dialog.notesPlaceholder')}
                rows={2}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={isSaving}>
              {t('common.cancel')}
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {editingSticker ? t('common.save') : t('common.create')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('inspectorStickers.dialog.deleteTitle')}</DialogTitle>
            <DialogDescription>
              {t('inspectorStickers.dialog.deleteDescription', {
                stickerId: deleteTarget?.sticker_id,
                employeeName: deleteTarget?.employee_name,
              })}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={isSaving}
            >
              {t('common.cancel')}
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isSaving}>
              {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {t('common.delete')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
