import { db } from '@/services/firebase';
import { logger } from '@/utils/logger';
import type { NotificationType } from '@/types/notification';
import type { WorkflowActionType } from './types';
import { interpolateTemplate } from './helpers';

export const actionHandlers: Record<
  WorkflowActionType,
  (params: Record<string, unknown>, triggerData: Record<string, unknown>) => Promise<void>
> = {
  async create_notification(params, triggerData) {
    const { createNotification } = await import('@/services/notificationService');

    const notificationId = `wf_notif_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`;

    await createNotification({
      notification_id: notificationId,
      type: (params.notification_type as NotificationType) || 'SYSTEM',
      priority: (params.priority as 'HIGH' | 'MEDIUM' | 'LOW') || 'MEDIUM',
      title: (params.title as string) || 'Workflow Notification',
      message: interpolateTemplate((params.message as string) || '', triggerData),
      recipient_id: (params.recipient_id as string) || (triggerData.employee_id as string) || undefined,
      recipient_type: (params.recipient_type as 'EMPLOYEE' | 'DEPARTMENT' | 'ALL') || 'EMPLOYEE',
      is_read: false,
    });
  },

  async create_certificate(params, triggerData) {
    logger.log('[workflowService] create_certificate action triggered', {
      params,
      employee_id: triggerData.employee_id,
      program_code: triggerData.program_code,
    });
  },

  async schedule_retraining(params, triggerData) {
    logger.log('[workflowService] schedule_retraining action triggered', {
      params,
      employee_id: triggerData.employee_id,
      program_code: triggerData.program_code,
    });
  },

  async send_email(params, triggerData) {
    logger.log('[workflowService] send_email action triggered', {
      to: params.to || triggerData.email,
      subject: params.subject,
      template: params.template,
    });
  },

  async update_status(params, triggerData) {
    const collectionName = params.collection as string;
    const documentId = (params.document_id as string) || (triggerData.id as string);
    const statusField = (params.status_field as string) || 'status';
    const statusValue = params.status_value;

    if (!collectionName || !documentId || statusValue === undefined) {
      throw new Error('update_status requires collection, document_id, and status_value params');
    }

    const { doc: getDocRef, updateDoc: updateDocument, serverTimestamp: getTimestamp } =
      await import('@/services/firebase');

    const docRef = getDocRef(db, collectionName, documentId);
    await updateDocument(docRef, {
      [statusField]: statusValue,
      updated_at: getTimestamp(),
    });
  },

  async create_audit_log(params, triggerData) {
    const { doc: getDocRef, setDoc: setDocument, serverTimestamp: getTimestamp } =
      await import('@/services/firebase');

    const logId = `wf_audit_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`;
    const logRef = getDocRef(db, 'auditLogs', logId);

    await setDocument(logRef, {
      log_id: logId,
      entity_type: (params.entity_type as string) || 'WORKFLOW',
      entity_id: (params.entity_id as string) || (triggerData.id as string) || '',
      action: (params.action as string) || 'WORKFLOW_TRIGGER',
      changed_by: (params.changed_by as string) || (triggerData.executed_by as string) || 'system',
      changed_at: getTimestamp(),
      before_data: (params.before_data as Record<string, unknown>) || null,
      after_data: (params.after_data as Record<string, unknown>) || triggerData,
      reason: (params.reason as string) || 'Triggered by workflow automation',
    });
  },
};
