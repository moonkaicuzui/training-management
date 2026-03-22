/**
 * Inspection & Failure CRUD operations
 */

import { db, doc, collection, getDoc, addDoc, updateDoc, deleteDoc, query, where, orderBy, getDocs, serverTimestamp } from '@/services/firebase';
import { logger } from '@/utils/logger';
import type { MDInspection, MDFailure, MDFilters, MDEmailRecipient } from '@/types/metalDetector';
import { INSPECTIONS_COLLECTION, FAILURES_COLLECTION, EMAIL_RECIPIENTS_COLLECTION, getISOWeekNumber, docToInspection, docToFailure, docToEmailRecipient } from './helpers';

// ============== Inspection CRUD ==============

export async function getInspections(filters?: MDFilters): Promise<MDInspection[]> {
  try {
    const constraints: Parameters<typeof query>[1][] = [];
    if (filters?.factory) constraints.push(where('factory', '==', filters.factory));
    if (filters?.result) constraints.push(where('result', '==', filters.result));
    if (filters?.year) constraints.push(where('year', '==', filters.year));
    if (filters?.weekNumber) constraints.push(where('weekNumber', '==', filters.weekNumber));
    if (filters?.dateFrom) constraints.push(where('inspectionDate', '>=', filters.dateFrom));
    if (filters?.dateTo) constraints.push(where('inspectionDate', '<=', filters.dateTo));
    constraints.push(orderBy('inspectionDate', 'desc'));
    const q = query(collection(db, INSPECTIONS_COLLECTION), ...constraints);
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => docToInspection(d.id, d.data() as Record<string, unknown>));
  } catch (error) {
    logger.error('[MDInspectionService] getInspections failed', error);
    throw error;
  }
}

export async function getInspectionById(id: string): Promise<MDInspection | null> {
  try {
    const docRef = doc(db, INSPECTIONS_COLLECTION, id);
    const snapshot = await getDoc(docRef);
    if (!snapshot.exists()) return null;
    return docToInspection(snapshot.id, snapshot.data() as Record<string, unknown>);
  } catch (error) {
    logger.error('[MDInspectionService] getInspectionById failed', error);
    throw error;
  }
}

export async function createInspection(data: Omit<MDInspection, 'id' | 'weekNumber' | 'year' | 'createdAt' | 'updatedAt'>): Promise<MDInspection> {
  try {
    const date = new Date(data.inspectionDate);
    const weekNumber = getISOWeekNumber(date);
    const year = date.getFullYear();
    const docData = { ...data, weekNumber, year, createdAt: serverTimestamp(), updatedAt: serverTimestamp() };
    const docRef = await addDoc(collection(db, INSPECTIONS_COLLECTION), docData);
    logger.info('[MDInspectionService] Created inspection', { id: docRef.id });
    return { ...data, id: docRef.id, weekNumber, year, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
  } catch (error) {
    logger.error('[MDInspectionService] createInspection failed', error);
    throw error;
  }
}

export async function updateInspection(id: string, data: Partial<Omit<MDInspection, 'id' | 'createdAt'>>): Promise<void> {
  try {
    const docRef = doc(db, INSPECTIONS_COLLECTION, id);
    await updateDoc(docRef, { ...data, updatedAt: serverTimestamp() });
    logger.info('[MDInspectionService] Updated inspection', { id });
  } catch (error) {
    logger.error('[MDInspectionService] updateInspection failed', error);
    throw error;
  }
}

// ============== Failure CRUD ==============

export async function getFailures(inspectionId?: string): Promise<MDFailure[]> {
  try {
    const constraints: Parameters<typeof query>[1][] = [];
    if (inspectionId) constraints.push(where('inspectionId', '==', inspectionId));
    constraints.push(orderBy('failureDate', 'desc'));
    const q = query(collection(db, FAILURES_COLLECTION), ...constraints);
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => docToFailure(d.id, d.data() as Record<string, unknown>));
  } catch (error) {
    logger.error('[MDInspectionService] getFailures failed', error);
    throw error;
  }
}

export async function createFailure(data: Omit<MDFailure, 'id' | 'createdAt' | 'updatedAt'>): Promise<MDFailure> {
  try {
    const docData = { ...data, createdAt: serverTimestamp(), updatedAt: serverTimestamp() };
    const docRef = await addDoc(collection(db, FAILURES_COLLECTION), docData);
    logger.info('[MDInspectionService] Created failure', { id: docRef.id });
    return { ...data, id: docRef.id, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
  } catch (error) {
    logger.error('[MDInspectionService] createFailure failed', error);
    throw error;
  }
}

export async function updateFailure(id: string, data: Partial<Omit<MDFailure, 'id' | 'createdAt'>>): Promise<void> {
  try {
    const docRef = doc(db, FAILURES_COLLECTION, id);
    await updateDoc(docRef, { ...data, updatedAt: serverTimestamp() });
    logger.info('[MDInspectionService] Updated failure', { id });
  } catch (error) {
    logger.error('[MDInspectionService] updateFailure failed', error);
    throw error;
  }
}

// ============== Email Recipients CRUD ==============

export async function getEmailRecipients(): Promise<MDEmailRecipient[]> {
  try {
    const q = query(collection(db, EMAIL_RECIPIENTS_COLLECTION), orderBy('name', 'asc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => docToEmailRecipient(d.id, d.data() as Record<string, unknown>));
  } catch (error) {
    logger.error('[MDInspectionService] getEmailRecipients failed', error);
    throw error;
  }
}

export async function addEmailRecipient(data: Omit<MDEmailRecipient, 'id' | 'createdAt' | 'updatedAt'>): Promise<MDEmailRecipient> {
  try {
    const docData = { ...data, createdAt: serverTimestamp(), updatedAt: serverTimestamp() };
    const docRef = await addDoc(collection(db, EMAIL_RECIPIENTS_COLLECTION), docData);
    logger.info('[MDInspectionService] Added email recipient', { id: docRef.id });
    return { ...data, id: docRef.id, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
  } catch (error) {
    logger.error('[MDInspectionService] addEmailRecipient failed', error);
    throw error;
  }
}

export async function updateEmailRecipient(id: string, data: Partial<Omit<MDEmailRecipient, 'id' | 'createdAt'>>): Promise<void> {
  try {
    const docRef = doc(db, EMAIL_RECIPIENTS_COLLECTION, id);
    await updateDoc(docRef, { ...data, updatedAt: serverTimestamp() });
    logger.info('[MDInspectionService] Updated email recipient', { id });
  } catch (error) {
    logger.error('[MDInspectionService] updateEmailRecipient failed', error);
    throw error;
  }
}

export async function removeEmailRecipient(id: string): Promise<void> {
  try {
    const docRef = doc(db, EMAIL_RECIPIENTS_COLLECTION, id);
    await deleteDoc(docRef);
    logger.info('[MDInspectionService] Removed email recipient', { id });
  } catch (error) {
    logger.error('[MDInspectionService] removeEmailRecipient failed', error);
    throw error;
  }
}

export async function getRecipientsForNotification(type: 'weeklyReport' | 'failAlert' | 'caOverdue'): Promise<MDEmailRecipient[]> {
  try {
    const q = query(collection(db, EMAIL_RECIPIENTS_COLLECTION), where('isActive', '==', true), where(`notifications.${type}`, '==', true));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => docToEmailRecipient(d.id, d.data() as Record<string, unknown>));
  } catch (error) {
    logger.error('[MDInspectionService] getRecipientsForNotification failed', error);
    throw error;
  }
}
