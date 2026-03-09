import {
  db,
  doc,
  collection,
  getDoc,
  setDoc,
  deleteDoc,
  query,
  where,
  getDocs,
  orderBy,
  serverTimestamp,
  limit,
  Timestamp,
} from '@/services/firebase';
import { logger } from '@/utils/logger';
import type { ReportConfig, ReportFilter } from './types';

const REPORT_TEMPLATES_COLLECTION = 'report_templates';

export const saveReportTemplate = async (
  config: ReportConfig
): Promise<string> => {
  try {
    const templateId = config.id || `RPT-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const docRef = doc(db, REPORT_TEMPLATES_COLLECTION, templateId);

    await setDoc(docRef, {
      ...config,
      id: templateId,
      created_at: config.created_at || serverTimestamp(),
      updated_at: serverTimestamp(),
    });

    logger.info(`[reportBuilderService] Report template saved: ${templateId}`);
    return templateId;
  } catch (error) {
    logger.error('[reportBuilderService] saveReportTemplate failed:', error);
    throw error;
  }
};

export const getReportTemplates = async (
  userId?: string
): Promise<ReportConfig[]> => {
  try {
    const constraints = [];

    if (userId) {
      constraints.push(where('created_by', '==', userId));
    }

    constraints.push(orderBy('updated_at', 'desc'));
    constraints.push(limit(100));

    const q = query(
      collection(db, REPORT_TEMPLATES_COLLECTION),
      ...constraints
    );
    const snapshot = await getDocs(q);

    return snapshot.docs.map((d) => {
      const data = d.data() as Record<string, unknown>;
      return {
        id: d.id,
        name: (data.name as string) || '',
        description: data.description as string | undefined,
        source: data.source as ReportConfig['source'],
        fields: (data.fields as string[]) || [],
        filters: (data.filters as ReportFilter[]) || [],
        groupBy: data.groupBy as string | undefined,
        sortBy: data.sortBy as ReportConfig['sortBy'],
        aggregations: data.aggregations as ReportConfig['aggregations'],
        chartType: data.chartType as ReportConfig['chartType'],
        created_by: data.created_by as string | undefined,
        created_at: data.created_at instanceof Timestamp
          ? data.created_at.toDate().toISOString()
          : (data.created_at as string | undefined),
        updated_at: data.updated_at instanceof Timestamp
          ? data.updated_at.toDate().toISOString()
          : (data.updated_at as string | undefined),
      };
    });
  } catch (error) {
    logger.error('[reportBuilderService] getReportTemplates failed:', error);
    throw error;
  }
};

export const deleteReportTemplate = async (id: string): Promise<void> => {
  try {
    const docRef = doc(db, REPORT_TEMPLATES_COLLECTION, id);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      throw new Error(`Report template not found: ${id}`);
    }

    await deleteDoc(docRef);
    logger.info(`[reportBuilderService] Report template deleted: ${id}`);
  } catch (error) {
    logger.error(`[reportBuilderService] deleteReportTemplate failed for ${id}:`, error);
    throw error;
  }
};
