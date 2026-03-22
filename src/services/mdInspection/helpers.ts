import { Timestamp } from '@/services/firebase';
import type { MDInspection, MDFailure, FactoryCode, CAStatus, MDEmailRecipient } from '@/types/metalDetector';

export const INSPECTIONS_COLLECTION = 'md_inspections';
export const FAILURES_COLLECTION = 'md_failures';
export const EMAIL_RECIPIENTS_COLLECTION = 'md_email_recipients';

export const convertTimestamp = (ts: Timestamp | string | null | undefined): string => {
  if (!ts) return '';
  if (ts instanceof Timestamp) return ts.toDate().toISOString();
  return ts;
};

export function getISOWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

export function docToInspection(docId: string, data: Record<string, unknown>): MDInspection {
  const sensitivity = data.sensitivity as Record<string, number> | undefined;
  return {
    id: docId,
    factory: (data.factory as FactoryCode) || 'A',
    line: (data.line as string) || '',
    machineId: (data.machineId as string) || undefined,
    inspectionDate: (data.inspectionDate as string) || '',
    weekNumber: (data.weekNumber as number) || 0,
    year: (data.year as number) || 0,
    result: (data.result as MDInspection['result']) || 'PASS',
    inspectorName: (data.inspectorName as string) || '',
    inspectorId: (data.inspectorId as string) || undefined,
    sensitivity: sensitivity ? { fe: sensitivity.fe ?? 0, sus: sensitivity.sus ?? 0, nonFe: sensitivity.nonFe ?? 0 } : undefined,
    checklist: (data.checklist as MDInspection['checklist']) || undefined,
    hasPhoto: (data.hasPhoto as boolean) || undefined,
    productName: (data.productName as string) || undefined,
    remarks: (data.remarks as string) || undefined,
    createdAt: convertTimestamp(data.createdAt as Timestamp | string),
    updatedAt: convertTimestamp(data.updatedAt as Timestamp | string),
  };
}

export function docToFailure(docId: string, data: Record<string, unknown>): MDFailure {
  return {
    id: docId,
    inspectionId: (data.inspectionId as string) || '',
    factory: (data.factory as FactoryCode) || 'A',
    line: (data.line as string) || '',
    failureDate: (data.failureDate as string) || '',
    failureType: (data.failureType as string) || '',
    description: (data.description as string) || '',
    caStatus: (data.caStatus as CAStatus) || 'pending',
    caDescription: (data.caDescription as string) || undefined,
    caCompletedAt: convertTimestamp(data.caCompletedAt as Timestamp | string) || undefined,
    caVerifiedBy: (data.caVerifiedBy as string) || undefined,
    createdAt: convertTimestamp(data.createdAt as Timestamp | string),
    updatedAt: convertTimestamp(data.updatedAt as Timestamp | string),
  };
}

export function docToEmailRecipient(docId: string, data: Record<string, unknown>): MDEmailRecipient {
  const notifications = (data.notifications as Record<string, boolean>) || {};
  return {
    id: docId,
    email: (data.email as string) || '',
    name: (data.name as string) || '',
    role: (data.role as MDEmailRecipient['role']) || 'manager',
    factory: (data.factory as FactoryCode) || undefined,
    notifications: { weeklyReport: notifications.weeklyReport ?? true, failAlert: notifications.failAlert ?? true, caOverdue: notifications.caOverdue ?? true },
    isActive: (data.isActive as boolean) ?? true,
    createdAt: convertTimestamp(data.createdAt as Timestamp | string),
    updatedAt: convertTimestamp(data.updatedAt as Timestamp | string),
  };
}
