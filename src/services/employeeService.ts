/**
 * Employee Firebase Service
 *
 * Firestore CRUD operations for the 'employees' collection.
 * Data source: HR CSV → Python sync script → Firestore
 */

import {
  db,
  doc,
  collection,
  getDoc,
  setDoc,
  updateDoc,
  query,
  where,
  getDocs,
  orderBy,
  serverTimestamp,
  writeBatch,
  onSnapshot,
  Timestamp,
} from '@/services/firebase';
import type { Employee, EmployeeFilters } from '@/types';

// ============================================================
// Collection Name
// ============================================================

const COLLECTION = 'employees';

// ============================================================
// Helper Functions
// ============================================================

/** Timestamp를 ISO string으로 변환 */
const convertTimestampToString = (
  timestamp: Timestamp | string | undefined
): string => {
  if (!timestamp) return '';
  if (timestamp instanceof Timestamp) {
    return timestamp.toDate().toISOString();
  }
  return timestamp;
};

/** Firestore 문서를 Employee 타입으로 변환 */
const docToEmployee = (docId: string, data: Record<string, unknown>): Employee => {
  return {
    employee_id: (data.employee_id as string) || docId,
    employee_name: (data.employee_name as string) || '',
    department: data.department as Employee['department'],
    position: data.position as Employee['position'],
    building: data.building as Employee['building'],
    line: (data.line as string) || '',
    hire_date: (data.hire_date as string) || '',
    status: (data.status as Employee['status']) || 'ACTIVE',
    updated_at: convertTimestampToString(data.updated_at as Timestamp | string | undefined),
  };
};

// ============================================================
// Read Operations
// ============================================================

/**
 * 직원 목록 조회 (필터 지원)
 * Firestore where() 쿼리로 서버 사이드 필터링,
 * search는 클라이언트 사이드 텍스트 검색
 */
export const getEmployees = async (
  filters?: EmployeeFilters
): Promise<Employee[]> => {
  const constraints = [];

  // Firestore where() conditions
  if (filters?.department) {
    constraints.push(where('department', '==', filters.department));
  }
  if (filters?.position) {
    constraints.push(where('position', '==', filters.position));
  }
  if (filters?.building) {
    constraints.push(where('building', '==', filters.building));
  }
  if (filters?.status) {
    constraints.push(where('status', '==', filters.status));
  }

  constraints.push(orderBy('employee_name', 'asc'));

  const q = query(collection(db, COLLECTION), ...constraints);
  const snapshot = await getDocs(q);

  let results = snapshot.docs.map((d) =>
    docToEmployee(d.id, d.data() as Record<string, unknown>)
  );

  // Client-side filters (not supported by Firestore compound queries)
  if (filters?.line) {
    results = results.filter((e) => e.line === filters.line);
  }
  if (filters?.search) {
    const searchLower = filters.search.toLowerCase();
    results = results.filter(
      (e) =>
        e.employee_id.toLowerCase().includes(searchLower) ||
        e.employee_name.toLowerCase().includes(searchLower)
    );
  }

  return results;
};

/**
 * 단일 직원 조회
 */
export const getEmployee = async (
  id: string
): Promise<Employee | null> => {
  const docRef = doc(db, COLLECTION, id);
  const docSnap = await getDoc(docRef);
  if (!docSnap.exists()) return null;
  return docToEmployee(docSnap.id, docSnap.data() as Record<string, unknown>);
};

// ============================================================
// Write Operations
// ============================================================

/**
 * 직원 생성 (단건)
 * Document ID = employee_id (HR에서 제공)
 */
export const createEmployee = async (
  data: Omit<Employee, 'updated_at'>
): Promise<Employee> => {
  const docRef = doc(db, COLLECTION, data.employee_id);
  const now = serverTimestamp();

  await setDoc(docRef, {
    ...data,
    updated_at: now,
  });

  return {
    ...data,
    updated_at: new Date().toISOString(),
  };
};

/**
 * 직원 수정
 */
export const updateEmployee = async (
  id: string,
  updates: Partial<Employee>
): Promise<void> => {
  const docRef = doc(db, COLLECTION, id);
  await updateDoc(docRef, {
    ...updates,
    updated_at: serverTimestamp(),
  });
};

// ============================================================
// Batch Operations
// ============================================================

/**
 * 직원 일괄 생성/업데이트 (시드 데이터용)
 * Firestore batch는 500건 제한이므로 자동 분할
 */
export const batchUpsertEmployees = async (
  employees: Omit<Employee, 'updated_at'>[]
): Promise<number> => {
  const BATCH_SIZE = 500;
  let totalWritten = 0;

  for (let i = 0; i < employees.length; i += BATCH_SIZE) {
    const chunk = employees.slice(i, i + BATCH_SIZE);
    const batch = writeBatch(db);

    for (const emp of chunk) {
      const docRef = doc(db, COLLECTION, emp.employee_id);
      batch.set(docRef, {
        ...emp,
        updated_at: serverTimestamp(),
      }, { merge: true });
    }

    await batch.commit();
    totalWritten += chunk.length;
  }

  return totalWritten;
};

// ============================================================
// Real-time Subscription
// ============================================================

/**
 * 직원 목록 실시간 구독
 */
export const subscribeToEmployees = (
  callback: (employees: Employee[]) => void
): (() => void) => {
  const q = query(
    collection(db, COLLECTION),
    orderBy('employee_name', 'asc')
  );

  return onSnapshot(q, (snapshot) => {
    const employees = snapshot.docs.map((d) =>
      docToEmployee(d.id, d.data() as Record<string, unknown>)
    );
    callback(employees);
  });
};

/**
 * 직원 교육 이력 조회 (training_results 컬렉션에서)
 * 현재는 results가 별도 컬렉션에 없으므로, mock 데이터 활용
 */
export const getEmployeeHistory = async (
  id: string
): Promise<unknown[]> => {
  // Training results는 아직 Firebase에 마이그레이션되지 않음
  // api.ts의 mock fallback 사용
  void id;
  return [];
};
