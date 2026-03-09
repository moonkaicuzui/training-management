/**
 * Certificate Firebase Service
 *
 * Firestore CRUD operations for the 'certificates' and 'certificate_templates' collections.
 * Data integrity rule: NO DELETE for certificates - only revoke.
 */

import {
  db,
  doc,
  collection,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  getDocs,
  serverTimestamp,
  writeBatch,
  limit,
  Timestamp,
} from '@/services/firebase';
import { logger } from '@/utils/logger';

// ============================================================
// Collection Names (snake_case per project convention)
// ============================================================

const CERTIFICATES_COLLECTION = 'certificates';
const TEMPLATES_COLLECTION = 'certificate_templates';

// ============================================================
// Types
// ============================================================

export interface Certificate {
  certificate_id: string;
  certificate_number: string;
  employee_id: string;
  employee_name: string;
  department: string;
  position: string;
  program_code: string;
  program_name: string;
  training_date: string;
  score: number | null;
  grade: string | null;
  issue_date: string;
  issued_by: string;
  template_id?: string;
  status: 'ISSUED' | 'REVOKED';
  revoked_at?: string;
  revoked_by?: string;
  revoke_reason?: string;
  created_at: string;
}

export interface CertificateTemplate {
  template_id: string;
  name: string;
  description: string;
  border_style: 'double' | 'solid' | 'ornate';
  border_color: string;
  logo_text: string;
  org_name: string;
  title_text: string;
  is_default: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CertificateFilters {
  employee_id?: string;
  program_code?: string;
  status?: 'ISSUED' | 'REVOKED';
  start_date?: string;
  end_date?: string;
}

// ============================================================
// Helper Functions
// ============================================================

const convertTimestampToString = (
  timestamp: Timestamp | string | null | undefined
): string => {
  if (timestamp === null || timestamp === undefined) return '';
  if (timestamp instanceof Timestamp) {
    return timestamp.toDate().toISOString();
  }
  return timestamp;
};

const docToCertificate = (
  docId: string,
  data: Record<string, unknown>
): Certificate => {
  return {
    certificate_id: (data.certificate_id as string) || docId,
    certificate_number: (data.certificate_number as string) || '',
    employee_id: (data.employee_id as string) || '',
    employee_name: (data.employee_name as string) || '',
    department: (data.department as string) || '',
    position: (data.position as string) || '',
    program_code: (data.program_code as string) || '',
    program_name: (data.program_name as string) || '',
    training_date: (data.training_date as string) || '',
    score: (data.score as number | null) ?? null,
    grade: (data.grade as string | null) ?? null,
    issue_date: (data.issue_date as string) || '',
    issued_by: (data.issued_by as string) || '',
    template_id: data.template_id as string | undefined,
    status: (data.status as Certificate['status']) || 'ISSUED',
    revoked_at: data.revoked_at as string | undefined,
    revoked_by: data.revoked_by as string | undefined,
    revoke_reason: data.revoke_reason as string | undefined,
    created_at: convertTimestampToString(
      data.created_at as Timestamp | string | null | undefined
    ),
  };
};

const docToTemplate = (
  docId: string,
  data: Record<string, unknown>
): CertificateTemplate => {
  return {
    template_id: (data.template_id as string) || docId,
    name: (data.name as string) || '',
    description: (data.description as string) || '',
    border_style: (data.border_style as CertificateTemplate['border_style']) || 'double',
    border_color: (data.border_color as string) || '#1E40AF',
    logo_text: (data.logo_text as string) || 'Q-TRAIN',
    org_name: (data.org_name as string) || '',
    title_text: (data.title_text as string) || '',
    is_default: (data.is_default as boolean) || false,
    is_active: data.is_active !== false,
    created_at: convertTimestampToString(
      data.created_at as Timestamp | string | null | undefined
    ),
    updated_at: convertTimestampToString(
      data.updated_at as Timestamp | string | null | undefined
    ),
  };
};

// ============================================================
// Certificate CRUD
// ============================================================

/**
 * Get certificates with optional filters
 */
export const getCertificates = async (
  filters?: CertificateFilters
): Promise<Certificate[]> => {
  try {
    const constraints = [];

    if (filters?.employee_id) {
      constraints.push(where('employee_id', '==', filters.employee_id));
    }
    if (filters?.program_code) {
      constraints.push(where('program_code', '==', filters.program_code));
    }
    if (filters?.status) {
      constraints.push(where('status', '==', filters.status));
    }

    constraints.push(limit(500));

    const q = query(collection(db, CERTIFICATES_COLLECTION), ...constraints);
    const snapshot = await getDocs(q);

    let results = snapshot.docs.map((d) =>
      docToCertificate(d.id, d.data() as Record<string, unknown>)
    );

    // Client-side date filters
    if (filters?.start_date) {
      results = results.filter((r) => r.issue_date >= filters.start_date!);
    }
    if (filters?.end_date) {
      results = results.filter((r) => r.issue_date <= filters.end_date!);
    }

    // Sort by issue_date descending
    results.sort((a, b) => b.issue_date.localeCompare(a.issue_date));

    return results;
  } catch (error) {
    logger.error('[certificateService] getCertificates failed:', error);
    throw error;
  }
};

/**
 * Get a single certificate by ID
 */
export const getCertificate = async (
  id: string
): Promise<Certificate | null> => {
  try {
    const docRef = doc(db, CERTIFICATES_COLLECTION, id);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) return null;
    return docToCertificate(docSnap.id, docSnap.data() as Record<string, unknown>);
  } catch (error) {
    logger.error('[certificateService] getCertificate failed:', error);
    throw error;
  }
};

/**
 * Create a single certificate
 */
export const createCertificate = async (
  data: Omit<Certificate, 'created_at'>
): Promise<Certificate> => {
  try {
    const docRef = doc(db, CERTIFICATES_COLLECTION, data.certificate_id);
    const now = new Date().toISOString();

    const certificateData = {
      ...data,
      created_at: serverTimestamp(),
    };

    await setDoc(docRef, certificateData);
    logger.log('[certificateService] Created certificate:', data.certificate_id);

    return {
      ...data,
      created_at: now,
    };
  } catch (error) {
    logger.error('[certificateService] createCertificate failed:', error);
    throw error;
  }
};

/**
 * Batch create multiple certificates atomically using Firestore writeBatch
 */
export const createCertificatesBatch = async (
  certificates: Omit<Certificate, 'created_at'>[]
): Promise<Certificate[]> => {
  try {
    if (certificates.length === 0) return [];

    // Firestore batches are limited to 500 operations
    const BATCH_SIZE = 450;
    const createdCertificates: Certificate[] = [];
    const now = new Date().toISOString();

    for (let i = 0; i < certificates.length; i += BATCH_SIZE) {
      const chunk = certificates.slice(i, i + BATCH_SIZE);
      const batch = writeBatch(db);

      for (const cert of chunk) {
        const docRef = doc(db, CERTIFICATES_COLLECTION, cert.certificate_id);
        batch.set(docRef, {
          ...cert,
          created_at: serverTimestamp(),
        });
      }

      await batch.commit();
      logger.log(
        `[certificateService] Batch created ${chunk.length} certificates (chunk ${Math.floor(i / BATCH_SIZE) + 1})`
      );

      createdCertificates.push(
        ...chunk.map((cert) => ({
          ...cert,
          created_at: now,
        }))
      );
    }

    return createdCertificates;
  } catch (error) {
    logger.error('[certificateService] createCertificatesBatch failed:', error);
    throw error;
  }
};

/**
 * Revoke a certificate (soft delete - updates status)
 */
export const revokeCertificate = async (
  certificateId: string,
  revokedBy: string,
  reason: string
): Promise<void> => {
  try {
    const docRef = doc(db, CERTIFICATES_COLLECTION, certificateId);
    await updateDoc(docRef, {
      status: 'REVOKED',
      revoked_at: new Date().toISOString(),
      revoked_by: revokedBy,
      revoke_reason: reason,
    });
    logger.log('[certificateService] Revoked certificate:', certificateId);
  } catch (error) {
    logger.error('[certificateService] revokeCertificate failed:', error);
    throw error;
  }
};

// ============================================================
// Certificate Template CRUD
// ============================================================

/**
 * Get all certificate templates
 */
export const getCertificateTemplates = async (
  activeOnly = true
): Promise<CertificateTemplate[]> => {
  try {
    const constraints = [];

    if (activeOnly) {
      constraints.push(where('is_active', '==', true));
    }

    const q = query(collection(db, TEMPLATES_COLLECTION), ...constraints);
    const snapshot = await getDocs(q);

    const templates = snapshot.docs.map((d) =>
      docToTemplate(d.id, d.data() as Record<string, unknown>)
    );

    // Sort: default first, then by name
    templates.sort((a, b) => {
      if (a.is_default && !b.is_default) return -1;
      if (!a.is_default && b.is_default) return 1;
      return a.name.localeCompare(b.name);
    });

    return templates;
  } catch (error) {
    logger.error('[certificateService] getCertificateTemplates failed:', error);
    throw error;
  }
};

/**
 * Get a single template by ID
 */
export const getCertificateTemplate = async (
  id: string
): Promise<CertificateTemplate | null> => {
  try {
    const docRef = doc(db, TEMPLATES_COLLECTION, id);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) return null;
    return docToTemplate(docSnap.id, docSnap.data() as Record<string, unknown>);
  } catch (error) {
    logger.error('[certificateService] getCertificateTemplate failed:', error);
    throw error;
  }
};

/**
 * Create a new certificate template
 */
export const createCertificateTemplate = async (
  data: Omit<CertificateTemplate, 'template_id' | 'created_at' | 'updated_at'>
): Promise<CertificateTemplate> => {
  try {
    const templateId = `TMPL-${Date.now()}`;
    const docRef = doc(db, TEMPLATES_COLLECTION, templateId);
    const now = new Date().toISOString();

    // If this template is set as default, unset any existing default
    if (data.is_default) {
      await unsetDefaultTemplates();
    }

    const templateData = {
      ...data,
      template_id: templateId,
      created_at: serverTimestamp(),
      updated_at: serverTimestamp(),
    };

    await setDoc(docRef, templateData);
    logger.log('[certificateService] Created template:', templateId);

    return {
      ...data,
      template_id: templateId,
      created_at: now,
      updated_at: now,
    };
  } catch (error) {
    logger.error('[certificateService] createCertificateTemplate failed:', error);
    throw error;
  }
};

/**
 * Update an existing certificate template
 */
export const updateCertificateTemplate = async (
  templateId: string,
  updates: Partial<CertificateTemplate>
): Promise<void> => {
  try {
    const docRef = doc(db, TEMPLATES_COLLECTION, templateId);

    // If setting as default, unset others first
    if (updates.is_default) {
      await unsetDefaultTemplates();
    }

    await updateDoc(docRef, {
      ...updates,
      updated_at: serverTimestamp(),
    });
    logger.log('[certificateService] Updated template:', templateId);
  } catch (error) {
    logger.error('[certificateService] updateCertificateTemplate failed:', error);
    throw error;
  }
};

/**
 * Delete a certificate template (admin only, enforced by Firestore rules)
 */
export const deleteCertificateTemplate = async (
  templateId: string
): Promise<void> => {
  try {
    const docRef = doc(db, TEMPLATES_COLLECTION, templateId);
    await deleteDoc(docRef);
    logger.log('[certificateService] Deleted template:', templateId);
  } catch (error) {
    logger.error('[certificateService] deleteCertificateTemplate failed:', error);
    throw error;
  }
};

/**
 * Helper: Unset all default templates before setting a new one
 */
const unsetDefaultTemplates = async (): Promise<void> => {
  const q = query(
    collection(db, TEMPLATES_COLLECTION),
    where('is_default', '==', true)
  );
  const snapshot = await getDocs(q);

  if (snapshot.empty) return;

  const batch = writeBatch(db);
  snapshot.docs.forEach((d) => {
    batch.update(d.ref, { is_default: false, updated_at: serverTimestamp() });
  });
  await batch.commit();
};
