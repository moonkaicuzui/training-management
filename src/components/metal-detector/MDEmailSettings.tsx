/**
 * MDEmailSettings
 * 금속탐지기 이메일 수신자 설정 Dialog 컴포넌트
 */

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Mail, Plus, Trash2, Settings } from 'lucide-react';
import { useShallow } from 'zustand/react/shallow';
import { useMDInspectionStore } from '@/stores/mdInspectionStore';
import type { MDEmailRecipient, FactoryCode } from '@/types/metalDetector';

const ROLE_OPTIONS: MDEmailRecipient['role'][] = ['manager', 'maintenance', 'auditor'];
const FACTORY_OPTIONS: FactoryCode[] = ['A', 'B', 'C', 'D'];

interface NewRecipientForm {
  name: string;
  email: string;
  role: MDEmailRecipient['role'];
  factory: string; // '' = all factories
  weeklyReport: boolean;
  failAlert: boolean;
  caOverdue: boolean;
}

const INITIAL_FORM: NewRecipientForm = {
  name: '',
  email: '',
  role: 'manager',
  factory: '',
  weeklyReport: true,
  failAlert: true,
  caOverdue: true,
};

export default function MDEmailSettings() {
  const { t } = useTranslation();
  const {
    emailRecipients,
    fetchEmailRecipients,
    addEmailRecipient,
    updateEmailRecipient,
    removeEmailRecipient,
  } = useMDInspectionStore(
    useShallow((s) => ({
      emailRecipients: s.emailRecipients,
      fetchEmailRecipients: s.fetchEmailRecipients,
      addEmailRecipient: s.addEmailRecipient,
      updateEmailRecipient: s.updateEmailRecipient,
      removeEmailRecipient: s.removeEmailRecipient,
    }))
  );

  const [open, setOpen] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [form, setForm] = useState<NewRecipientForm>(INITIAL_FORM);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      fetchEmailRecipients();
    }
  }, [open, fetchEmailRecipients]);

  const handleAdd = async () => {
    if (!form.name.trim() || !form.email.trim()) return;
    setIsSubmitting(true);
    try {
      await addEmailRecipient({
        name: form.name.trim(),
        email: form.email.trim(),
        role: form.role,
        factory: form.factory ? (form.factory as FactoryCode) : undefined,
        notifications: {
          weeklyReport: form.weeklyReport,
          failAlert: form.failAlert,
          caOverdue: form.caOverdue,
        },
        isActive: true,
      });
      setForm(INITIAL_FORM);
      setShowAddForm(false);
    } catch {
      // error handled by store
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleNotification = async (
    recipient: MDEmailRecipient,
    key: 'weeklyReport' | 'failAlert' | 'caOverdue'
  ) => {
    await updateEmailRecipient(recipient.id, {
      notifications: {
        ...recipient.notifications,
        [key]: !recipient.notifications[key],
      },
    });
  };

  const handleToggleActive = async (recipient: MDEmailRecipient) => {
    await updateEmailRecipient(recipient.id, {
      isActive: !recipient.isActive,
    });
  };

  const handleDelete = (id: string) => {
    setDeleteTargetId(id);
  };

  const handleConfirmDelete = async () => {
    if (deleteTargetId) {
      await removeEmailRecipient(deleteTargetId);
      setDeleteTargetId(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Settings className="h-4 w-4 mr-1" />
          {t('metalDetector.email.settings')}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            {t('metalDetector.email.settings')}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Add Recipient Button */}
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-medium">{t('metalDetector.email.recipients')}</h3>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowAddForm(!showAddForm)}
            >
              <Plus className="h-4 w-4 mr-1" />
              {t('metalDetector.email.addRecipient')}
            </Button>
          </div>

          {/* Inline Add Form */}
          {showAddForm && (
            <div className="border rounded-lg p-4 space-y-3 bg-muted/30">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="recipient-name">{t('metalDetector.email.name')}</Label>
                  <Input
                    id="recipient-name"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder={t('metalDetector.email.name')}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="recipient-email">{t('metalDetector.email.email')}</Label>
                  <Input
                    id="recipient-email"
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="email@example.com"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>{t('metalDetector.email.role')}</Label>
                  <Select
                    value={form.role}
                    onValueChange={(v) =>
                      setForm({ ...form, role: v as MDEmailRecipient['role'] })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ROLE_OPTIONS.map((role) => (
                        <SelectItem key={role} value={role}>
                          {t(`metalDetector.email.roles.${role}`)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label>{t('metalDetector.email.factory')}</Label>
                  <Select
                    value={form.factory || '_all'}
                    onValueChange={(v) =>
                      setForm({ ...form, factory: v === '_all' ? '' : v })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="_all">
                        {t('metalDetector.email.allFactories')}
                      </SelectItem>
                      {FACTORY_OPTIONS.map((f) => (
                        <SelectItem key={f} value={f}>
                          Factory {f}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <Switch
                    id="new-weekly"
                    checked={form.weeklyReport}
                    onCheckedChange={(v) => setForm({ ...form, weeklyReport: v })}
                  />
                  <Label htmlFor="new-weekly" className="text-xs">
                    {t('metalDetector.email.weeklyReport')}
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    id="new-fail"
                    checked={form.failAlert}
                    onCheckedChange={(v) => setForm({ ...form, failAlert: v })}
                  />
                  <Label htmlFor="new-fail" className="text-xs">
                    {t('metalDetector.email.failAlert')}
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    id="new-ca"
                    checked={form.caOverdue}
                    onCheckedChange={(v) => setForm({ ...form, caOverdue: v })}
                  />
                  <Label htmlFor="new-ca" className="text-xs">
                    {t('metalDetector.email.caOverdue')}
                  </Label>
                </div>
              </div>
              <div className="flex gap-2 justify-end">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowAddForm(false);
                    setForm(INITIAL_FORM);
                  }}
                >
                  {t('common.cancel')}
                </Button>
                <Button
                  size="sm"
                  onClick={handleAdd}
                  disabled={!form.name.trim() || !form.email.trim() || isSubmitting}
                >
                  {t('common.save')}
                </Button>
              </div>
            </div>
          )}

          {/* Recipients Table */}
          {emailRecipients.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
              {t('metalDetector.email.noRecipients')}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('metalDetector.email.name')}</TableHead>
                  <TableHead>{t('metalDetector.email.email')}</TableHead>
                  <TableHead>{t('metalDetector.email.role')}</TableHead>
                  <TableHead>{t('metalDetector.email.factory')}</TableHead>
                  <TableHead className="text-center">
                    {t('metalDetector.email.weeklyReport')}
                  </TableHead>
                  <TableHead className="text-center">
                    {t('metalDetector.email.failAlert')}
                  </TableHead>
                  <TableHead className="text-center">
                    {t('metalDetector.email.caOverdue')}
                  </TableHead>
                  <TableHead className="text-center">
                    {t('metalDetector.email.active')}
                  </TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {emailRecipients.map((r) => (
                  <TableRow key={r.id} className={!r.isActive ? 'opacity-50' : ''}>
                    <TableCell className="font-medium">{r.name}</TableCell>
                    <TableCell className="text-sm">{r.email}</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {t(`metalDetector.email.roles.${r.role}`)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {r.factory
                        ? `Factory ${r.factory}`
                        : t('metalDetector.email.allFactories')}
                    </TableCell>
                    <TableCell className="text-center">
                      <Switch
                        checked={r.notifications.weeklyReport}
                        onCheckedChange={() =>
                          handleToggleNotification(r, 'weeklyReport')
                        }
                        aria-label={t('metalDetector.email.weeklyReport')}
                      />
                    </TableCell>
                    <TableCell className="text-center">
                      <Switch
                        checked={r.notifications.failAlert}
                        onCheckedChange={() =>
                          handleToggleNotification(r, 'failAlert')
                        }
                        aria-label={t('metalDetector.email.failAlert')}
                      />
                    </TableCell>
                    <TableCell className="text-center">
                      <Switch
                        checked={r.notifications.caOverdue}
                        onCheckedChange={() =>
                          handleToggleNotification(r, 'caOverdue')
                        }
                        aria-label={t('metalDetector.email.caOverdue')}
                      />
                    </TableCell>
                    <TableCell className="text-center">
                      <Switch
                        checked={r.isActive}
                        onCheckedChange={() => handleToggleActive(r)}
                        aria-label={t('metalDetector.email.active')}
                      />
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(r.id)}
                        aria-label={t('metalDetector.email.delete')}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </DialogContent>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteTargetId} onOpenChange={(open) => !open && setDeleteTargetId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('common.confirmDeleteTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('metalDetector.email.deleteConfirm')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t('common.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  );
}
