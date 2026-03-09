import {
  db,
  doc,
  collection,
  query,
  where,
  getDocs,
  serverTimestamp,
  writeBatch,
  limit,
} from '@/services/firebase';
import type { InspectionStrikeInfo } from '@/types/inspection';
import { logger } from '@/utils/logger';
import {
  ENROLLMENTS_COLLECTION,
  TRAINING_RESULTS_COLLECTION,
} from './constants';

export const getConsecutiveFailures = async (
  employeeId: string
): Promise<InspectionStrikeInfo> => {
  const q = query(
    collection(db, TRAINING_RESULTS_COLLECTION),
    where('employee_id', '==', employeeId),
    where('program_code', '==', 'INS-001'),
    limit(50)
  );
  const snapshot = await getDocs(q);

  const results = snapshot.docs
    .map((d) => {
      const data = d.data();
      return {
        result_id: (data.result_id as string) || d.id,
        training_date: data.training_date as string,
        match_rate: (data.score as number) || 0,
        result: (data.result as 'PASS' | 'FAIL') || 'FAIL',
      };
    })
    .sort((a, b) => b.training_date.localeCompare(a.training_date));

  let consecutiveFailures = 0;
  for (const r of results) {
    if (r.result === 'FAIL') {
      consecutiveFailures++;
    } else {
      break;
    }
  }

  return {
    employee_id: employeeId,
    consecutive_failures: consecutiveFailures,
    last_attempts: results.slice(0, 5),
    requires_reassignment: consecutiveFailures >= 3,
  };
};

export const handleThreeStrikeOut = async (
  employeeId: string,
  employeeName: string,
  _resultId: string,
  enrollmentId?: string
): Promise<void> => {
  try {
    const batch = writeBatch(db);

    const notificationId = `NOTIF-REASSIGN-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const notifRef = doc(db, 'notifications', notificationId);
    batch.set(notifRef, {
      notification_id: notificationId,
      type: 'REASSIGNMENT_REQUIRED',
      priority: 'URGENT',
      title: `3진 아웃: ${employeeName} (${employeeId})`,
      message: `직원 ${employeeName} (${employeeId})이(가) 검사 교육(INS-001) 3회 연속 불합격으로 재배치가 필요합니다.`,
      recipient_type: 'ALL',
      related_entity: {
        type: 'EMPLOYEE',
        id: employeeId,
      },
      is_read: false,
      created_at: serverTimestamp(),
    });

    if (enrollmentId) {
      const enrollmentRef = doc(db, ENROLLMENTS_COLLECTION, enrollmentId);
      batch.update(enrollmentRef, {
        status: 'REASSIGNMENT_REQUIRED',
      });
    } else {
      const enrollQuery = query(
        collection(db, ENROLLMENTS_COLLECTION),
        where('employee_id', '==', employeeId),
        where('program_code', '==', 'INS-001'),
        limit(50)
      );
      const enrollSnapshot = await getDocs(enrollQuery);

      for (const d of enrollSnapshot.docs) {
        const data = d.data();
        if (data.status === 'COMPLETED' || data.status === 'PENDING' || data.status === 'SCHEDULED') {
          batch.update(d.ref, {
            status: 'REASSIGNMENT_REQUIRED',
          });
          break;
        }
      }
    }

    await batch.commit();

    logger.info(`[inspectionService] Three-strike out handled for employee ${employeeId}`);
  } catch (error) {
    logger.error('[inspectionService] handleThreeStrikeOut failed:', error);
  }
};
