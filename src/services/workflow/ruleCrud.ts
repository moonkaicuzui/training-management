import {
  db,
  doc,
  collection,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  query,
  orderBy,
  serverTimestamp,
} from '@/services/firebase';
import { logger } from '@/utils/logger';
import type { WorkflowRule } from './types';
import {
  RULES_COLLECTION,
  docToWorkflowRule,
  generateRuleId,
} from './helpers';

export async function getWorkflowRules(): Promise<WorkflowRule[]> {
  try {
    const q = query(
      collection(db, RULES_COLLECTION),
      orderBy('created_at', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) =>
      docToWorkflowRule(d.id, d.data() as Record<string, unknown>)
    );
  } catch (error) {
    logger.error('[workflowService] getWorkflowRules failed:', error);
    throw error;
  }
}

export async function getWorkflowRule(id: string): Promise<WorkflowRule | null> {
  try {
    const docRef = doc(db, RULES_COLLECTION, id);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) return null;
    return docToWorkflowRule(docSnap.id, docSnap.data() as Record<string, unknown>);
  } catch (error) {
    logger.error(`[workflowService] getWorkflowRule failed for ${id}:`, error);
    throw error;
  }
}

export async function createWorkflowRule(
  rule: Omit<WorkflowRule, 'id' | 'created_at' | 'updated_at'>
): Promise<WorkflowRule> {
  try {
    const id = generateRuleId();
    const now = serverTimestamp();

    const ruleData = {
      name: rule.name,
      description: rule.description,
      event: rule.event,
      conditions: rule.conditions,
      actions: rule.actions,
      enabled: rule.enabled,
      created_at: now,
      updated_at: now,
    };

    const docRef = doc(db, RULES_COLLECTION, id);
    await setDoc(docRef, ruleData);

    logger.log('[workflowService] Created workflow rule:', id, rule.name);

    return {
      ...rule,
      id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  } catch (error) {
    logger.error('[workflowService] createWorkflowRule failed:', error);
    throw error;
  }
}

export async function updateWorkflowRule(
  id: string,
  updates: Partial<Omit<WorkflowRule, 'id' | 'created_at' | 'updated_at'>>
): Promise<void> {
  try {
    const docRef = doc(db, RULES_COLLECTION, id);
    await updateDoc(docRef, {
      ...updates,
      updated_at: serverTimestamp(),
    });
    logger.log('[workflowService] Updated workflow rule:', id);
  } catch (error) {
    logger.error(`[workflowService] updateWorkflowRule failed for ${id}:`, error);
    throw error;
  }
}

export async function deleteWorkflowRule(id: string): Promise<void> {
  try {
    const docRef = doc(db, RULES_COLLECTION, id);
    await deleteDoc(docRef);
    logger.log('[workflowService] Deleted workflow rule:', id);
  } catch (error) {
    logger.error(`[workflowService] deleteWorkflowRule failed for ${id}:`, error);
    throw error;
  }
}
