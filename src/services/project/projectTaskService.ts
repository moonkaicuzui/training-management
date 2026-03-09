/**
 * 프로젝트 과제(Task) 관리 서비스
 *
 * 과제 CRUD, 상태 자동 업데이트, 실시간 구독, 배치 작업, 의존성 검증
 */

import {
  db,
  doc,
  collection,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  deleteField,
  query,
  where,
  getDocs,
  orderBy,
  limit,
  serverTimestamp,
  writeBatch,
  onSnapshot,
  Timestamp,
} from '@/services/firebase';
import type {
  Project,
  Task,
  CreateTaskInput,
  UpdateTaskInput,
  TaskStatus,
  Category,
  CalendarEvent,
  ProjectSettings,
  DefaultViewType,
  NotificationPreferences,
} from '@/types/project';
import { COLLECTIONS, generateId, convertTimestamp, convertDocumentDates } from './common';
import { logger } from '@/utils/logger';

// ============================================================
// Project Service
// ============================================================

/** 모든 프로젝트 조회 */
export const getProjects = async (): Promise<Project[]> => {
  try {
    const q = query(
      collection(db, COLLECTIONS.PROJECTS),
      where('status', '!=', 'archived'),
      orderBy('status'),
      orderBy('updatedAt', 'desc'),
      limit(50)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) =>
      convertDocumentDates({ id: doc.id, ...doc.data() }) as Project
    );
  } catch (error) {
    logger.error('[projectTaskService] getProjects failed:', error);
    throw error;
  }
};

/** 단일 프로젝트 조회 */
export const getProject = async (projectId: string): Promise<Project | null> => {
  try {
    const docRef = doc(db, COLLECTIONS.PROJECTS, projectId);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) return null;
    return convertDocumentDates({ id: docSnap.id, ...docSnap.data() }) as Project;
  } catch (error) {
    logger.error('[projectTaskService] getProject failed:', error);
    throw error;
  }
};

/** 프로젝트 생성 */
export const createProject = async (
  name: string,
  description: string,
  ownerId: string,
  members: string[] = []
): Promise<Project> => {
  try {
    const projectId = generateId('project');
    const now = serverTimestamp();

    const projectData = {
      name,
      description,
      ownerId,
      members: [...new Set([ownerId, ...members])], // 소유자 포함
      status: 'active' as const,
      createdAt: now,
      updatedAt: now,
    };

    await setDoc(doc(db, COLLECTIONS.PROJECTS, projectId), projectData);

    return {
      id: projectId,
      ...projectData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    } as Project;
  } catch (error) {
    logger.error('[projectTaskService] createProject failed:', error);
    throw error;
  }
};

/** 프로젝트 수정 */
export const updateProject = async (
  projectId: string,
  data: Partial<Pick<Project, 'name' | 'description' | 'members' | 'status' | 'color' | 'icon'>>
): Promise<void> => {
  try {
    const docRef = doc(db, COLLECTIONS.PROJECTS, projectId);
    await updateDoc(docRef, {
      ...data,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    logger.error('[projectTaskService] updateProject failed:', error);
    throw error;
  }
};

/** 프로젝트 실시간 구독 */
export const subscribeProjectsRealtime = (
  callback: (projects: Project[]) => void
): (() => void) => {
  const q = query(
    collection(db, COLLECTIONS.PROJECTS),
    orderBy('updatedAt', 'desc'),
    limit(50)
  );

  return onSnapshot(q, (snapshot) => {
    const projects = snapshot.docs.map((doc) =>
      convertDocumentDates({ id: doc.id, ...doc.data() }) as Project
    );
    callback(projects);
  });
};

// ============================================================
// Task (과제) Service
// ============================================================

/** 프로젝트의 과제 조회 */
export const getTasksByProject = async (projectId: string): Promise<Task[]> => {
  try {
    const q = query(
      collection(db, COLLECTIONS.TASKS),
      where('projectId', '==', projectId),
      orderBy('createdAt', 'desc'),
      limit(200)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) =>
      convertDocumentDates({ id: doc.id, ...doc.data() }) as Task
    );
  } catch (error) {
    logger.error('[projectTaskService] getTasksByProject failed:', error);
    throw error;
  }
};

/** 전체 과제 조회 (프로젝트 필터 없음) */
export const getAllTasks = async (): Promise<Task[]> => {
  try {
    const q = query(
      collection(db, COLLECTIONS.TASKS),
      orderBy('createdAt', 'desc'),
      limit(200)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) =>
      convertDocumentDates({ id: doc.id, ...doc.data() }) as Task
    );
  } catch (error) {
    logger.error('[projectTaskService] getAllTasks failed:', error);
    throw error;
  }
};

/** 단일 과제 조회 */
export const getTask = async (taskId: string): Promise<Task | null> => {
  try {
    const docRef = doc(db, COLLECTIONS.TASKS, taskId);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) return null;
    return convertDocumentDates({ id: docSnap.id, ...docSnap.data() }) as Task;
  } catch (error) {
    logger.error('[projectTaskService] getTask failed:', error);
    throw error;
  }
};

/** 과제 생성 */
export const createTask = async (
  input: CreateTaskInput,
  createdBy: string
): Promise<Task> => {
  try {
    const taskId = generateId('task');
    const now = serverTimestamp();

    const taskData = {
      ...input,
      createdBy,
      status: 'todo' as TaskStatus,
      priority: input.priority || 'medium',
      progress: 0,
      assignees: input.assignees || [],
      dependencies: input.dependencies || [],
      createdAt: now,
      updatedAt: now,
    };

    await setDoc(doc(db, COLLECTIONS.TASKS, taskId), taskData);

    return {
      id: taskId,
      ...taskData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    } as Task;
  } catch (error) {
    logger.error('[projectTaskService] createTask failed:', error);
    throw error;
  }
};

/** 과제 수정 */
export const updateTask = async (
  taskId: string,
  input: UpdateTaskInput
): Promise<void> => {
  try {
    const docRef = doc(db, COLLECTIONS.TASKS, taskId);
    await updateDoc(docRef, {
      ...input,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    logger.error('[projectTaskService] updateTask failed:', error);
    throw error;
  }
};

/** 과제 삭제 */
export const deleteTask = async (taskId: string): Promise<void> => {
  try {
    const docRef = doc(db, COLLECTIONS.TASKS, taskId);
    await deleteDoc(docRef);
  } catch (error) {
    logger.error('[projectTaskService] deleteTask failed:', error);
    throw error;
  }
};

/** 과제 상태 자동 업데이트 */
export const updateTaskStatusAuto = async (taskId: string): Promise<void> => {
  try {
    const task = await getTask(taskId);
    if (!task) return;

    const now = new Date();
    const startDate = convertTimestamp(task.startDate as Timestamp);
    const dueDate = convertTimestamp(task.dueDate as Timestamp);

    let newStatus: TaskStatus = task.status;

    // 진행률 100%면 완료
    if (task.progress >= 100) {
      newStatus = 'done';
    }
    // 시작일이 지났는데 아직 예정 상태면 시작지연
    else if (startDate && now > startDate && task.status === 'todo') {
      newStatus = 'delayed_start';
    }
    // 마감일이 지났는데 완료가 아니면 완료지연
    else if (dueDate && now > dueDate && task.status !== 'done') {
      newStatus = 'delayed_complete';
    }
    // 시작일이 되었고 예정 상태면 진행중으로 변경
    else if (startDate && now >= startDate && task.status === 'todo') {
      newStatus = 'in_progress';
    }

    if (newStatus !== task.status) {
      await updateTask(taskId, { status: newStatus });
    }
  } catch (error) {
    logger.error('[projectTaskService] updateTaskStatusAuto failed:', error);
    throw error;
  }
};

/** 과제 실시간 구독 */
export const subscribeTasksRealtime = (
  projectId: string,
  callback: (tasks: Task[]) => void
): (() => void) => {
  const q = query(
    collection(db, COLLECTIONS.TASKS),
    where('projectId', '==', projectId),
    orderBy('createdAt', 'desc'),
    limit(200)
  );

  return onSnapshot(q, (snapshot) => {
    const tasks = snapshot.docs.map((doc) =>
      convertDocumentDates({ id: doc.id, ...doc.data() }) as Task
    );
    callback(tasks);
  });
};

// ============================================================
// Batch Operations
// ============================================================

/** 여러 과제 상태 일괄 업데이트 */
export const batchUpdateTaskStatus = async (
  taskIds: string[],
  status: TaskStatus
): Promise<void> => {
  try {
    const batch = writeBatch(db);

    taskIds.forEach((taskId) => {
      const docRef = doc(db, COLLECTIONS.TASKS, taskId);
      batch.update(docRef, {
        status,
        updatedAt: serverTimestamp(),
      });
    });

    await batch.commit();
  } catch (error) {
    logger.error('[projectTaskService] batchUpdateTaskStatus failed:', error);
    throw error;
  }
};

/** 프로젝트 멤버 일괄 추가 */
export const batchAddProjectMembers = async (
  projectId: string,
  memberIds: string[]
): Promise<void> => {
  try {
    const projectDoc = await getProject(projectId);
    if (!projectDoc) return;

    const newMembers = [...new Set([...projectDoc.members, ...memberIds])];
    await updateProject(projectId, { members: newMembers });
  } catch (error) {
    logger.error('[projectTaskService] batchAddProjectMembers failed:', error);
    throw error;
  }
};

// ============================================================
// Utility Functions
// ============================================================

/** 과제 의존성 검증 */
export const validateTaskDependencies = async (
  taskId: string,
  newDependencies: string[]
): Promise<{ valid: boolean; error?: string }> => {
  try {
    // 순환 의존성 검사
    const visited = new Set<string>();
    const stack = [...newDependencies];

    while (stack.length > 0) {
      const currentId = stack.pop()!;

      if (currentId === taskId) {
        return { valid: false, error: '순환 의존성이 감지되었습니다.' };
      }

      if (!visited.has(currentId)) {
        visited.add(currentId);
        const task = await getTask(currentId);
        if (task?.dependencies) {
          stack.push(...task.dependencies);
        }
      }
    }

    return { valid: true };
  } catch (error) {
    logger.error('[projectTaskService] validateTaskDependencies failed:', error);
    throw error;
  }
};

/** 미완료 선행 과제 조회 */
export const getBlockingTasks = async (taskId: string): Promise<Task[]> => {
  try {
    const task = await getTask(taskId);
    if (!task || !task.dependencies.length) return [];

    const blockingTasks: Task[] = [];

    for (const depId of task.dependencies) {
      const depTask = await getTask(depId);
      if (depTask && depTask.status !== 'done') {
        blockingTasks.push(depTask);
      }
    }

    return blockingTasks;
  } catch (error) {
    logger.error('[projectTaskService] getBlockingTasks failed:', error);
    throw error;
  }
};

// ============================================================
// Convenience Subscription Aliases
// ============================================================

/**
 * 특정 프로젝트의 과제 실시간 구독
 * subscribeTasksRealtime의 alias로, 일관된 네이밍 제공
 */
export const subscribeToTasks = (
  projectId: string,
  callback: (tasks: Task[]) => void
): (() => void) => {
  const q = query(
    collection(db, COLLECTIONS.TASKS),
    where('projectId', '==', projectId),
    orderBy('createdAt', 'desc'),
    limit(200)
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const tasks = snapshot.docs.map((d) =>
        convertDocumentDates({ id: d.id, ...d.data() }) as Task
      );
      callback(tasks);
    },
    (error) => {
      logger.error(`[projectTaskService] subscribeToTasks failed for project ${projectId}:`, error);
    }
  );
};

// ============================================================
// Category Service
// ============================================================

/** 모든 카테고리 조회 */
export const getCategories = async (): Promise<Category[]> => {
  try {
    const q = query(
      collection(db, COLLECTIONS.CATEGORIES),
      where('isActive', '==', true),
      orderBy('order', 'asc'),
      limit(50)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) =>
      convertDocumentDates({ id: doc.id, ...doc.data() }) as Category
    );
  } catch (error) {
    logger.error('[projectTaskService] getCategories failed:', error);
    throw error;
  }
};

/** 카테고리 생성 */
export const createCategory = async (
  name: string,
  color: string,
  type: 'event' | 'task',
  icon?: string
): Promise<Category> => {
  try {
    const categoryId = generateId('cat');
    const now = serverTimestamp();

    // 현재 최대 order 값 조회
    const q = query(
      collection(db, COLLECTIONS.CATEGORIES),
      orderBy('order', 'desc'),
      limit(1)
    );
    const snapshot = await getDocs(q);
    const maxOrder = snapshot.docs.length > 0 ? snapshot.docs[0].data().order : 0;

    const categoryData = {
      name,
      color,
      type,
      icon,
      order: maxOrder + 1,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    };

    await setDoc(doc(db, COLLECTIONS.CATEGORIES, categoryId), categoryData);

    return {
      id: categoryId,
      ...categoryData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    } as Category;
  } catch (error) {
    logger.error('[projectTaskService] createCategory failed:', error);
    throw error;
  }
};

/** 카테고리 수정 */
export const updateCategory = async (
  categoryId: string,
  data: Partial<Pick<Category, 'name' | 'color' | 'icon' | 'order' | 'isActive'>>
): Promise<void> => {
  try {
    const docRef = doc(db, COLLECTIONS.CATEGORIES, categoryId);
    await updateDoc(docRef, {
      ...data,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    logger.error('[projectTaskService] updateCategory failed:', error);
    throw error;
  }
};

/** 카테고리 삭제 (비활성화) */
export const deleteCategory = async (categoryId: string): Promise<void> => {
  try {
    const docRef = doc(db, COLLECTIONS.CATEGORIES, categoryId);
    await updateDoc(docRef, {
      isActive: false,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    logger.error('[projectTaskService] deleteCategory failed:', error);
    throw error;
  }
};

// ============================================================
// Calendar Event Service
// ============================================================

/** 기간 내 이벤트 조회 */
export const getEventsByDateRange = async (
  startDate: Date,
  endDate: Date
): Promise<CalendarEvent[]> => {
  try {
    const q = query(
      collection(db, COLLECTIONS.EVENTS),
      where('startDate', '>=', Timestamp.fromDate(startDate)),
      where('startDate', '<=', Timestamp.fromDate(endDate)),
      orderBy('startDate', 'asc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) =>
      convertDocumentDates({ id: doc.id, ...doc.data() }) as CalendarEvent
    );
  } catch (error) {
    logger.error('[projectTaskService] getEventsByDateRange failed:', error);
    throw error;
  }
};

/** 이벤트 생성 */
export const createEvent = async (
  data: Omit<CalendarEvent, 'id' | 'createdAt' | 'updatedAt'>
): Promise<CalendarEvent> => {
  try {
    const eventId = generateId('event');
    const now = serverTimestamp();

    const eventData: Record<string, unknown> = {
      ...data,
      startDate: data.startDate instanceof Date ? Timestamp.fromDate(data.startDate) : data.startDate,
      endDate: data.endDate instanceof Date ? Timestamp.fromDate(data.endDate) : data.endDate,
      createdAt: now,
      updatedAt: now,
    };

    // recurrence 내부의 endDate도 Timestamp로 변환
    if (data.recurrence?.endDate instanceof Date) {
      eventData.recurrence = {
        ...data.recurrence,
        endDate: Timestamp.fromDate(data.recurrence.endDate),
      };
    }

    await setDoc(doc(db, COLLECTIONS.EVENTS, eventId), eventData);

    return {
      id: eventId,
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    } as CalendarEvent;
  } catch (error) {
    logger.error('[projectTaskService] createEvent failed:', error);
    throw error;
  }
};

/** 이벤트 수정 */
export const updateEvent = async (
  eventId: string,
  data: Partial<CalendarEvent>
): Promise<void> => {
  try {
    const docRef = doc(db, COLLECTIONS.EVENTS, eventId);
    const updateData: Record<string, unknown> = {
      ...data,
      updatedAt: serverTimestamp(),
    };

    // Date를 Timestamp로 변환
    if (data.startDate instanceof Date) {
      updateData.startDate = Timestamp.fromDate(data.startDate);
    }
    if (data.endDate instanceof Date) {
      updateData.endDate = Timestamp.fromDate(data.endDate);
    }

    // recurrence 내부의 endDate도 Timestamp로 변환
    if (data.recurrence?.endDate instanceof Date) {
      updateData.recurrence = {
        ...data.recurrence,
        endDate: Timestamp.fromDate(data.recurrence.endDate),
      };
    }

    // recurrence가 명시적으로 undefined면 Firestore에서 필드 삭제 (반복 해제)
    if (data.recurrence === undefined && 'recurrence' in data) {
      updateData.recurrence = deleteField();
    }

    await updateDoc(docRef, updateData);
  } catch (error) {
    logger.error('[projectTaskService] updateEvent failed:', error);
    throw error;
  }
};

/** 이벤트 삭제 */
export const deleteEvent = async (eventId: string): Promise<void> => {
  try {
    const docRef = doc(db, COLLECTIONS.EVENTS, eventId);
    await deleteDoc(docRef);
  } catch (error) {
    logger.error('[projectTaskService] deleteEvent failed:', error);
    throw error;
  }
};

// ============================================================
// Project Settings Service
// ============================================================

/** 기본 설정 값 */
const DEFAULT_SETTINGS: Omit<ProjectSettings, 'projectId' | 'updatedAt'> = {
  projectName: '',
  projectDescription: '',
  defaultView: 'list' as DefaultViewType,
  notifications: {
    taskAssigned: true,
    taskDue: true,
    taskOverdue: true,
    comments: true,
  } as NotificationPreferences,
};

/** 프로젝트 설정 조회 */
export const getProjectSettings = async (projectId: string): Promise<ProjectSettings> => {
  try {
    const docRef = doc(db, COLLECTIONS.SETTINGS, projectId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      // 기본값 반환
      return {
        ...DEFAULT_SETTINGS,
        projectId,
        updatedAt: new Date(),
      } as ProjectSettings;
    }

    return convertDocumentDates({ projectId, ...docSnap.data() }) as ProjectSettings;
  } catch (error) {
    logger.error('[projectTaskService] getProjectSettings failed:', error);
    throw error;
  }
};

/** 프로젝트 설정 업데이트 */
export const updateProjectSettings = async (
  projectId: string,
  data: Partial<Pick<ProjectSettings, 'projectName' | 'projectDescription' | 'defaultView' | 'notifications'>>
): Promise<void> => {
  try {
    const docRef = doc(db, COLLECTIONS.SETTINGS, projectId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      await updateDoc(docRef, {
        ...data,
        updatedAt: serverTimestamp(),
      });
    } else {
      // 문서가 없으면 기본값과 함께 생성
      await setDoc(docRef, {
        ...DEFAULT_SETTINGS,
        ...data,
        projectId,
        updatedAt: serverTimestamp(),
      });
    }
  } catch (error) {
    logger.error('[projectTaskService] updateProjectSettings failed:', error);
    throw error;
  }
};
