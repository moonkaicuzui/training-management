/**
 * @fileoverview Centralized Email Settings Page - Q-TRAIN
 * OSC-style collapsible email type cards covering all 11 Q-TRAIN email types.
 * ON/OFF toggle, recipients (To/CC), subject template, schedule management.
 *
 * Reads from Firestore: config/emailSettings
 */

import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { doc, setDoc, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { db } from '@/services/firebase';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '@/components/ui/collapsible';
import {
  Mail, ChevronDown, Plus, Trash2, Loader2, Users, Clock, Settings,
} from 'lucide-react';

// ─── Email Type Definitions ─────────────────────────────

interface EmailRecipients {
  to: string[];
  cc: string[];
}

interface EmailTypeConfig {
  id: string;
  name: string;
  nameEn: string;
  category: string;
  description: string;
  enabled: boolean;
  schedule: string;
  timezone: string;
  subjectTemplate: string;
  recipients: EmailRecipients;
}

interface EmailSettings {
  emailTypes: Record<string, EmailTypeConfig>;
  updatedAt?: unknown;
}

const DEFAULT_EMAIL_TYPES: Record<string, EmailTypeConfig> = {
  // Training Operations
  training_schedule_reminder: {
    id: 'training_schedule_reminder',
    name: '교육 일정 알림',
    nameEn: 'Training Schedule Reminder',
    category: 'training',
    description: '예정된 교육 일정 사전 알림 발송',
    enabled: false,
    schedule: '1 day before training',
    timezone: 'Asia/Ho_Chi_Minh',
    subjectTemplate: '[Q-TRAIN] Training Reminder: {{programName}} - {{date}}',
    recipients: { to: [], cc: [] },
  },
  training_result_notification: {
    id: 'training_result_notification',
    name: '교육 결과 통보',
    nameEn: 'Training Result Notification',
    category: 'training',
    description: '교육 완료 후 결과(합격/불합격) 통보',
    enabled: false,
    schedule: 'on completion',
    timezone: 'Asia/Ho_Chi_Minh',
    subjectTemplate: '[Q-TRAIN] Training Result: {{employeeName}} - {{programName}}',
    recipients: { to: [], cc: [] },
  },
  retraining_alert: {
    id: 'retraining_alert',
    name: '재교육 대상 알림',
    nameEn: 'Retraining Alert',
    category: 'training',
    description: '재교육 대상자 발생 시 관리자 알림',
    enabled: false,
    schedule: 'realtime',
    timezone: 'Asia/Ho_Chi_Minh',
    subjectTemplate: '[Q-TRAIN] Retraining Required: {{employeeName}}',
    recipients: { to: [], cc: [] },
  },
  certificate_expiry_warning: {
    id: 'certificate_expiry_warning',
    name: '자격증 만료 경고',
    nameEn: 'Certificate Expiry Warning',
    category: 'training',
    description: '자격증 만료 30일/7일 전 사전 경고',
    enabled: false,
    schedule: 'daily check 08:00',
    timezone: 'Asia/Ho_Chi_Minh',
    subjectTemplate: '[Q-TRAIN] Certificate Expiry Warning: {{employeeName}} - {{certificateName}}',
    recipients: { to: [], cc: [] },
  },

  // New TQC
  new_tqc_weekly_report: {
    id: 'new_tqc_weekly_report',
    name: '신입 TQC 주간 리포트',
    nameEn: 'New TQC Weekly Report',
    category: 'new-tqc',
    description: '신입 TQC 교육 진행 현황 주간 요약',
    enabled: false,
    schedule: 'every friday 17:00',
    timezone: 'Asia/Ho_Chi_Minh',
    subjectTemplate: '[Q-TRAIN] New TQC Weekly Report - {{weekRange}}',
    recipients: { to: [], cc: [] },
  },
  new_tqc_resignation_alert: {
    id: 'new_tqc_resignation_alert',
    name: '신입 TQC 퇴사 알림',
    nameEn: 'New TQC Resignation Alert',
    category: 'new-tqc',
    description: '신입 TQC 교육 중 퇴사자 발생 시 알림',
    enabled: false,
    schedule: 'realtime',
    timezone: 'Asia/Ho_Chi_Minh',
    subjectTemplate: '[Q-TRAIN] TQC Trainee Resignation: {{traineeName}}',
    recipients: { to: [], cc: [] },
  },

  // Equipment Compliance
  metal_detector_weekly_report: {
    id: 'metal_detector_weekly_report',
    name: '금속탐지기 주간 리포트',
    nameEn: 'Metal Detector Weekly Report',
    category: 'equipment',
    description: '금속탐지기 점검 현황 주간 요약',
    enabled: false,
    schedule: 'every monday 08:00',
    timezone: 'Asia/Ho_Chi_Minh',
    subjectTemplate: '[Q-TRAIN] Metal Detector Weekly Report - {{weekRange}}',
    recipients: { to: [], cc: [] },
  },
  metal_detector_fail_alert: {
    id: 'metal_detector_fail_alert',
    name: '금속탐지기 실패 알림',
    nameEn: 'Metal Detector Fail Alert',
    category: 'equipment',
    description: '금속탐지기 점검 실패 시 즉시 알림',
    enabled: false,
    schedule: 'realtime',
    timezone: 'Asia/Ho_Chi_Minh',
    subjectTemplate: '[Q-TRAIN] Metal Detector FAIL: Factory {{factory}} - {{date}}',
    recipients: { to: [], cc: [] },
  },

  // Inspection & Quality
  inspection_result_summary: {
    id: 'inspection_result_summary',
    name: '검사 결과 요약',
    nameEn: 'Inspection Result Summary',
    category: 'inspection',
    description: '검사 교육 결과 일별 요약 발송',
    enabled: false,
    schedule: 'every day 18:00',
    timezone: 'Asia/Ho_Chi_Minh',
    subjectTemplate: '[Q-TRAIN] Inspection Result Summary - {{date}}',
    recipients: { to: [], cc: [] },
  },

  // CAPA
  capa_overdue_alert: {
    id: 'capa_overdue_alert',
    name: 'CAPA 기한 초과 알림',
    nameEn: 'CAPA Overdue Alert',
    category: 'capa',
    description: 'CAPA 조치 기한 초과 시 알림',
    enabled: false,
    schedule: 'daily check 09:00',
    timezone: 'Asia/Ho_Chi_Minh',
    subjectTemplate: '[Q-TRAIN] CAPA Overdue: {{capaTitle}} - Due {{dueDate}}',
    recipients: { to: [], cc: [] },
  },

  // Executive
  executive_monthly_report: {
    id: 'executive_monthly_report',
    name: '월간 경영진 보고서',
    nameEn: 'Executive Monthly Report',
    category: 'executive',
    description: '월간 교육 현황 경영진 보고서 자동 발송',
    enabled: false,
    schedule: 'first monday of month 09:00',
    timezone: 'Asia/Ho_Chi_Minh',
    subjectTemplate: '[Q-TRAIN] Monthly Executive Report - {{month}} {{year}}',
    recipients: { to: [], cc: [] },
  },
};

const CATEGORY_LABELS: Record<string, { name: string; nameEn: string }> = {
  training: { name: '교육 운영', nameEn: 'Training Operations' },
  'new-tqc': { name: '신입 TQC', nameEn: 'New TQC' },
  equipment: { name: '설비 점검', nameEn: 'Equipment Compliance' },
  inspection: { name: '검사 교육', nameEn: 'Inspection Training' },
  capa: { name: 'CAPA', nameEn: 'CAPA' },
  executive: { name: '경영진', nameEn: 'Executive' },
};

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// ─── EmailTypeCard ──────────────────────────────────────

function EmailTypeCard({
  emailType,
  onUpdate,
}: {
  emailType: EmailTypeConfig;
  onUpdate: (id: string, updates: Partial<EmailTypeConfig>) => Promise<void>;
}) {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [newTo, setNewTo] = useState('');
  const [newCc, setNewCc] = useState('');
  const [toError, setToError] = useState('');
  const [ccError, setCcError] = useState('');
  const [editingSubject, setEditingSubject] = useState(false);
  const [subjectDraft, setSubjectDraft] = useState('');

  const recipients = emailType.recipients || { to: [], cc: [] };
  const toList = recipients.to || [];
  const ccList = recipients.cc || [];

  const addRecipient = async (type: 'to' | 'cc') => {
    const value = type === 'to' ? newTo.trim().toLowerCase() : newCc.trim().toLowerCase();
    const setError = type === 'to' ? setToError : setCcError;
    const setNew = type === 'to' ? setNewTo : setNewCc;
    const list = type === 'to' ? toList : ccList;

    if (!value) return;
    if (!EMAIL_REGEX.test(value)) { setError(t('emailSettings.invalidEmail', 'Invalid email format')); return; }
    if (list.includes(value)) { setError(t('emailSettings.duplicateEmail', 'Email already added')); return; }

    setError('');
    await onUpdate(emailType.id, {
      recipients: { ...recipients, [type]: [...list, value] },
    });
    setNew('');
  };

  const removeRecipient = async (type: 'to' | 'cc', idx: number) => {
    const list = type === 'to' ? [...toList] : [...ccList];
    list.splice(idx, 1);
    await onUpdate(emailType.id, {
      recipients: { ...recipients, [type]: list },
    });
  };

  const saveSubject = async () => {
    await onUpdate(emailType.id, { subjectTemplate: subjectDraft });
    setEditingSubject(false);
  };

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card className="overflow-hidden">
        <CollapsibleTrigger className="w-full">
          <div className="flex items-center justify-between px-4 py-3 hover:bg-muted/50 transition-colors cursor-pointer">
            <div className="flex items-center gap-3 flex-1 min-w-0 text-left">
              <Mail className={`h-4 w-4 shrink-0 ${emailType.enabled ? 'text-primary' : 'text-muted-foreground'}`} />
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{emailType.name}</p>
                <p className="text-xs text-muted-foreground truncate">{emailType.nameEn}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <div
                onClick={(e) => e.stopPropagation()}
                className="flex items-center gap-2"
              >
                <Switch
                  checked={emailType.enabled}
                  onCheckedChange={(checked) => onUpdate(emailType.id, { enabled: checked })}
                  aria-label={`Toggle ${emailType.name}`}
                />
                <span className={`text-xs font-medium w-7 ${emailType.enabled ? 'text-primary' : 'text-muted-foreground'}`}>
                  {emailType.enabled ? 'ON' : 'OFF'}
                </span>
              </div>
              <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
            </div>
          </div>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent className="border-t pt-4 space-y-4">
            {/* Description */}
            <p className="text-sm text-muted-foreground">{emailType.description}</p>

            {/* Schedule */}
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4 shrink-0" />
              <span>{t('emailSettings.schedule', 'Schedule')}: {emailType.schedule} ({emailType.timezone})</span>
            </div>

            {/* Subject Template */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                {t('emailSettings.subjectTemplate', 'Subject Template')}
              </label>
              {editingSubject ? (
                <div className="flex gap-2">
                  <Input
                    value={subjectDraft}
                    onChange={(e) => setSubjectDraft(e.target.value)}
                    className="flex-1 h-9 text-sm"
                  />
                  <Button size="sm" onClick={saveSubject}>
                    {t('common.save', 'Save')}
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setEditingSubject(false)}>
                    {t('common.cancel', 'Cancel')}
                  </Button>
                </div>
              ) : (
                <div
                  className="px-3 py-2 rounded-md border bg-muted/30 text-sm cursor-pointer hover:border-primary/50 transition-colors"
                  onClick={() => { setSubjectDraft(emailType.subjectTemplate || ''); setEditingSubject(true); }}
                >
                  {emailType.subjectTemplate || '(Not set)'}
                </div>
              )}
            </div>

            {/* To Recipients */}
            <RecipientSection
              label="To"
              list={toList}
              newValue={newTo}
              error={toError}
              onNewChange={(v) => { setNewTo(v); setToError(''); }}
              onAdd={() => addRecipient('to')}
              onRemove={(idx) => removeRecipient('to', idx)}
            />

            {/* CC Recipients */}
            <RecipientSection
              label="CC"
              list={ccList}
              newValue={newCc}
              error={ccError}
              onNewChange={(v) => { setNewCc(v); setCcError(''); }}
              onAdd={() => addRecipient('cc')}
              onRemove={(idx) => removeRecipient('cc', idx)}
              variant="secondary"
            />
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}

// ─── RecipientSection ───────────────────────────────────

function RecipientSection({
  label,
  list,
  newValue,
  error,
  onNewChange,
  onAdd,
  onRemove,
  variant = 'primary',
}: {
  label: string;
  list: string[];
  newValue: string;
  error: string;
  onNewChange: (v: string) => void;
  onAdd: () => void;
  onRemove: (idx: number) => void;
  variant?: 'primary' | 'secondary';
}) {
  const { t } = useTranslation();

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Users className="h-4 w-4 text-muted-foreground" />
        <span className="text-xs font-medium">{label} ({list.length})</span>
      </div>

      {list.length > 0 && (
        <div className="space-y-1">
          {list.map((email, idx) => (
            <div key={email} className="flex items-center justify-between px-3 py-1.5 rounded-md border bg-muted/20 text-sm">
              <div className="flex items-center gap-2">
                <span className={`h-6 w-6 rounded-full flex items-center justify-center text-xs font-medium ${
                  variant === 'primary'
                    ? 'bg-primary/10 text-primary'
                    : 'bg-muted text-muted-foreground'
                }`}>
                  {email.charAt(0).toUpperCase()}
                </span>
                <span className={variant === 'secondary' ? 'text-muted-foreground' : ''}>{email}</span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => onRemove(idx)}
              >
                <Trash2 className="h-3.5 w-3.5 text-destructive" />
              </Button>
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-2">
        <div className="flex-1 relative">
          <Input
            type="email"
            value={newValue}
            onChange={(e) => onNewChange(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && onAdd()}
            placeholder={t('emailSettings.emailPlaceholder', 'Enter email address')}
            className={`h-9 text-sm ${error ? 'border-destructive' : ''}`}
          />
          {error && <p className="absolute -bottom-4 left-0 text-[10px] text-destructive">{error}</p>}
        </div>
        <Button size="sm" variant={variant === 'primary' ? 'default' : 'secondary'} onClick={onAdd}>
          <Plus className="h-3.5 w-3.5 mr-1" />
          {t('common.add', 'Add')}
        </Button>
      </div>
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────

export default function EmailSettingsPage() {
  const { t } = useTranslation();
  const [emailTypes, setEmailTypes] = useState<Record<string, EmailTypeConfig> | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!db) return;
    const configRef = doc(db, 'config', 'emailSettings');
    const unsubscribe = onSnapshot(
      configRef,
      async (snap) => {
        if (snap.exists()) {
          const data = snap.data() as EmailSettings;
          setEmailTypes(data.emailTypes || DEFAULT_EMAIL_TYPES);
        } else {
          try {
            await setDoc(configRef, {
              emailTypes: DEFAULT_EMAIL_TYPES,
              updatedAt: serverTimestamp(),
            });
          } catch (err) {
            console.warn('[EmailSettings] Could not create default config:', err);
            setEmailTypes(DEFAULT_EMAIL_TYPES);
          }
        }
        setLoading(false);
      },
      (error) => {
        console.error('[EmailSettings] Snapshot error:', error);
        setEmailTypes(DEFAULT_EMAIL_TYPES);
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, []);

  const updateEmailType = useCallback(
    async (typeId: string, updates: Partial<EmailTypeConfig>) => {
      if (!db || !emailTypes) return;
      setSaving(true);
      try {
        const configRef = doc(db, 'config', 'emailSettings');
        const updatedTypes = {
          ...emailTypes,
          [typeId]: { ...emailTypes[typeId], ...updates },
        };
        await setDoc(
          configRef,
          { emailTypes: updatedTypes, updatedAt: serverTimestamp() },
          { merge: true }
        );
      } catch (error) {
        console.error('[EmailSettings] Update error:', error);
      } finally {
        setSaving(false);
      }
    },
    [emailTypes]
  );

  const typeList = emailTypes ? Object.values(emailTypes) : [];
  const enabledCount = typeList.filter((et) => et.enabled).length;

  // Group by category
  const grouped = typeList.reduce<Record<string, EmailTypeConfig[]>>((acc, et) => {
    const cat = et.category || 'other';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(et);
    return acc;
  }, {});

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Mail className="h-6 w-6 text-primary" />
            {t('emailSettings.title', 'Email Settings')}
          </h1>
          <p className="text-muted-foreground mt-1">
            {t('emailSettings.description', 'Manage automated email notifications across all modules')}
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground shrink-0">
          <Settings className="h-4 w-4" />
          <Badge variant="outline">
            {enabledCount}/{typeList.length} Active
          </Badge>
          {saving && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
        </div>
      </div>

      {/* Grouped Email Type Cards */}
      {Object.entries(grouped).map(([category, types]) => {
        const catLabel = CATEGORY_LABELS[category];
        return (
          <div key={category} className="space-y-3">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                {catLabel?.name || category}
              </h2>
              <span className="text-xs text-muted-foreground">({catLabel?.nameEn})</span>
            </div>
            {types.map((emailType) => (
              <EmailTypeCard
                key={emailType.id}
                emailType={emailType}
                onUpdate={updateEmailType}
              />
            ))}
          </div>
        );
      })}
    </div>
  );
}
