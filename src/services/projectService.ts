/**
 * 프로젝트 관리 시스템 Firebase 서비스
 *
 * Firestore CRUD 작업 및 실시간 구독 기능 제공
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
import type { DocumentData } from 'firebase/firestore';
import type {
  ProjectMember,
  CreateMemberInput,
  UpdateMemberInput,
  Project,
  Task,
  CreateTaskInput,
  UpdateTaskInput,
  Message,
  CreateMessageInput,
  Category,
  CalendarEvent,
  Automation,
  TaskStatus,
  MemberStats,
  ProjectSettings,
  DefaultViewType,
  NotificationPreferences,
  ProjectNotification,
} from '@/types/project';

// ============================================================
// Collection Names
// ============================================================

const COLLECTIONS = {
  MEMBERS: 'project_members',
  PROJECTS: 'projects',
  TASKS: 'project_tasks',
  MESSAGES: 'project_messages',
  CATEGORIES: 'project_categories',
  EVENTS: 'project_events',
  AUTOMATIONS: 'project_automations',
  NOTIFICATIONS: 'project_notifications',
  SETTINGS: 'project_settings',
} as const;

// ============================================================
// Helper Functions
// ============================================================

/** 고유 ID 생성 */
const generateId = (prefix: string): string => {
  const timestamp = Date.now().toString(36);
  const randomStr = Math.random().toString(36).substring(2, 9);
  return `${prefix}_${timestamp}_${randomStr}`;
};

/** Timestamp를 Date로 변환 */
const convertTimestamp = (timestamp: Timestamp | Date | undefined): Date | undefined => {
  if (!timestamp) return undefined;
  if (timestamp instanceof Timestamp) {
    return timestamp.toDate();
  }
  return timestamp;
};

/** 문서 데이터에서 타입스탬프 변환 */
const convertDocumentDates = <T extends DocumentData>(data: T): T => {
  const converted = { ...data } as Record<string, unknown>;
  const dateFields = ['createdAt', 'updatedAt', 'lastActive', 'startDate', 'dueDate', 'completedAt', 'lastRunAt', 'readAt', 'resolvedAt'];

  dateFields.forEach((field) => {
    if (converted[field] instanceof Timestamp) {
      converted[field] = (converted[field] as Timestamp).toDate();
    }
  });

  // readBy 객체 내부의 Timestamp 변환
  if (converted.readBy && typeof converted.readBy === 'object') {
    const convertedReadBy: Record<string, Date | null> = {};
    Object.entries(converted.readBy as Record<string, unknown>).forEach(([key, value]) => {
      if (value instanceof Timestamp) {
        convertedReadBy[key] = value.toDate();
      } else {
        convertedReadBy[key] = value as Date | null;
      }
    });
    converted.readBy = convertedReadBy;
  }

  return converted as T;
};

// ============================================================
// Member (팀원) Service
// ============================================================

/** 모든 팀원 조회 */
export const getMembers = async (): Promise<ProjectMember[]> => {
  const q = query(
    collection(db, COLLECTIONS.MEMBERS),
    orderBy('name', 'asc'),
    limit(100)
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) =>
    convertDocumentDates({ id: doc.id, ...doc.data() }) as ProjectMember
  );
};

/** 활성 팀원만 조회 */
export const getActiveMembers = async (): Promise<ProjectMember[]> => {
  const q = query(
    collection(db, COLLECTIONS.MEMBERS),
    where('status', '==', 'active'),
    orderBy('name', 'asc'),
    limit(100)
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) =>
    convertDocumentDates({ id: doc.id, ...doc.data() }) as ProjectMember
  );
};

/** 단일 팀원 조회 */
export const getMember = async (memberId: string): Promise<ProjectMember | null> => {
  const docRef = doc(db, COLLECTIONS.MEMBERS, memberId);
  const docSnap = await getDoc(docRef);
  if (!docSnap.exists()) return null;
  return convertDocumentDates({ id: docSnap.id, ...docSnap.data() }) as ProjectMember;
};

/** 팀원 생성 */
export const createMember = async (input: CreateMemberInput): Promise<ProjectMember> => {
  const memberId = generateId('member');
  const now = serverTimestamp();

  const memberData: Omit<ProjectMember, 'id' | 'stats'> = {
    ...input,
    status: 'active',
    createdAt: now as unknown as Timestamp,
    updatedAt: now as unknown as Timestamp,
  };

  await setDoc(doc(db, COLLECTIONS.MEMBERS, memberId), memberData);

  return {
    id: memberId,
    ...memberData,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  } as ProjectMember;
};

/** 팀원 수정 */
export const updateMember = async (
  memberId: string,
  input: UpdateMemberInput
): Promise<void> => {
  const docRef = doc(db, COLLECTIONS.MEMBERS, memberId);
  await updateDoc(docRef, {
    ...input,
    updatedAt: serverTimestamp(),
  });
};

/** 팀원 삭제 (비활성화) */
export const deactivateMember = async (memberId: string): Promise<void> => {
  const docRef = doc(db, COLLECTIONS.MEMBERS, memberId);
  await updateDoc(docRef, {
    status: 'inactive',
    updatedAt: serverTimestamp(),
  });
};

/** 팀원 완전 삭제 */
export const deleteMember = async (memberId: string): Promise<void> => {
  const docRef = doc(db, COLLECTIONS.MEMBERS, memberId);
  await deleteDoc(docRef);
};

/** 팀원 실시간 구독 */
export const subscribeMembersRealtime = (
  callback: (members: ProjectMember[]) => void
): (() => void) => {
  const q = query(
    collection(db, COLLECTIONS.MEMBERS),
    orderBy('name', 'asc'),
    limit(100)
  );

  return onSnapshot(q, (snapshot) => {
    const members = snapshot.docs.map((doc) =>
      convertDocumentDates({ id: doc.id, ...doc.data() }) as ProjectMember
    );
    callback(members);
  });
};

/** 팀원 통계 계산 */
export const calculateMemberStats = async (memberId: string): Promise<MemberStats> => {
  // 할당된 과제 조회
  const assignedQuery = query(
    collection(db, COLLECTIONS.TASKS),
    where('assignees', 'array-contains', memberId)
  );
  const assignedSnapshot = await getDocs(assignedQuery);

  const tasks = assignedSnapshot.docs.map((doc) => doc.data() as Task);
  const completedTasks = tasks.filter((t) => t.status === 'done').length;
  const totalTasks = tasks.length;

  // 메시지 응답 시간 계산 (간략화)
  // 실제로는 더 복잡한 로직이 필요
  const averageResponseTime = 2.5; // 기본값 2.5시간

  // 소통 점수 계산 (간략화)
  const communicationScore = Math.min(100, totalTasks * 5 + completedTasks * 10);

  return {
    assignedTasks: totalTasks,
    completedTasks,
    completionRate: totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0,
    averageResponseTime,
    communicationScore,
  };
};

// ============================================================
// Project Service
// ============================================================

/** 모든 프로젝트 조회 */
export const getProjects = async (): Promise<Project[]> => {
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
};

/** 단일 프로젝트 조회 */
export const getProject = async (projectId: string): Promise<Project | null> => {
  const docRef = doc(db, COLLECTIONS.PROJECTS, projectId);
  const docSnap = await getDoc(docRef);
  if (!docSnap.exists()) return null;
  return convertDocumentDates({ id: docSnap.id, ...docSnap.data() }) as Project;
};

/** 프로젝트 생성 */
export const createProject = async (
  name: string,
  description: string,
  ownerId: string,
  members: string[] = []
): Promise<Project> => {
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
};

/** 프로젝트 수정 */
export const updateProject = async (
  projectId: string,
  data: Partial<Pick<Project, 'name' | 'description' | 'members' | 'status' | 'color' | 'icon'>>
): Promise<void> => {
  const docRef = doc(db, COLLECTIONS.PROJECTS, projectId);
  await updateDoc(docRef, {
    ...data,
    updatedAt: serverTimestamp(),
  });
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
};

/** 전체 과제 조회 (프로젝트 필터 없음) */
export const getAllTasks = async (): Promise<Task[]> => {
  const q = query(
    collection(db, COLLECTIONS.TASKS),
    orderBy('createdAt', 'desc'),
    limit(200)
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) =>
    convertDocumentDates({ id: doc.id, ...doc.data() }) as Task
  );
};

/** 단일 과제 조회 */
export const getTask = async (taskId: string): Promise<Task | null> => {
  const docRef = doc(db, COLLECTIONS.TASKS, taskId);
  const docSnap = await getDoc(docRef);
  if (!docSnap.exists()) return null;
  return convertDocumentDates({ id: docSnap.id, ...docSnap.data() }) as Task;
};

/** 과제 생성 */
export const createTask = async (
  input: CreateTaskInput,
  createdBy: string
): Promise<Task> => {
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
};

/** 과제 수정 */
export const updateTask = async (
  taskId: string,
  input: UpdateTaskInput
): Promise<void> => {
  const docRef = doc(db, COLLECTIONS.TASKS, taskId);
  await updateDoc(docRef, {
    ...input,
    updatedAt: serverTimestamp(),
  });
};

/** 과제 삭제 */
export const deleteTask = async (taskId: string): Promise<void> => {
  const docRef = doc(db, COLLECTIONS.TASKS, taskId);
  await deleteDoc(docRef);
};

/** 과제 상태 자동 업데이트 */
export const updateTaskStatusAuto = async (taskId: string): Promise<void> => {
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
// Message (댓글) Service
// ============================================================

/** 과제의 메시지 조회 */
export const getMessagesByTask = async (taskId: string): Promise<Message[]> => {
  const q = query(
    collection(db, COLLECTIONS.MESSAGES),
    where('taskId', '==', taskId),
    orderBy('createdAt', 'asc'),
    limit(100)
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) =>
    convertDocumentDates({ id: doc.id, ...doc.data() }) as Message
  );
};

/** 메시지 생성 */
export const createMessage = async (
  input: CreateMessageInput,
  senderId: string
): Promise<Message> => {
  const messageId = generateId('msg');
  const now = serverTimestamp();

  const messageData = {
    ...input,
    senderId,
    type: input.type || 'comment',
    readBy: {}, // 빈 객체로 시작
    createdAt: now,
    updatedAt: now,
  };

  await setDoc(doc(db, COLLECTIONS.MESSAGES, messageId), messageData);

  return {
    id: messageId,
    ...messageData,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  } as Message;
};

/** 메시지 읽음 표시 */
export const markMessageAsRead = async (
  messageId: string,
  userId: string
): Promise<void> => {
  const docRef = doc(db, COLLECTIONS.MESSAGES, messageId);
  await updateDoc(docRef, {
    [`readBy.${userId}`]: serverTimestamp(),
  });
};

/** 메시지 해결 표시 */
export const resolveMessage = async (
  messageId: string,
  resolvedBy: string
): Promise<void> => {
  const docRef = doc(db, COLLECTIONS.MESSAGES, messageId);
  await updateDoc(docRef, {
    isResolved: true,
    resolvedAt: serverTimestamp(),
    resolvedBy,
    updatedAt: serverTimestamp(),
  });
};

/** 메시지 실시간 구독 */
export const subscribeMessagesRealtime = (
  taskId: string,
  callback: (messages: Message[]) => void
): (() => void) => {
  const q = query(
    collection(db, COLLECTIONS.MESSAGES),
    where('taskId', '==', taskId),
    orderBy('createdAt', 'asc'),
    limit(100)
  );

  return onSnapshot(q, (snapshot) => {
    const messages = snapshot.docs.map((doc) =>
      convertDocumentDates({ id: doc.id, ...doc.data() }) as Message
    );
    callback(messages);
  });
};

// ============================================================
// Category Service
// ============================================================

/** 모든 카테고리 조회 */
export const getCategories = async (): Promise<Category[]> => {
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
};

/** 카테고리 생성 */
export const createCategory = async (
  name: string,
  color: string,
  type: 'event' | 'task',
  icon?: string
): Promise<Category> => {
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
};

/** 카테고리 수정 */
export const updateCategory = async (
  categoryId: string,
  data: Partial<Pick<Category, 'name' | 'color' | 'icon' | 'order' | 'isActive'>>
): Promise<void> => {
  const docRef = doc(db, COLLECTIONS.CATEGORIES, categoryId);
  await updateDoc(docRef, {
    ...data,
    updatedAt: serverTimestamp(),
  });
};

/** 카테고리 삭제 (비활성화) */
export const deleteCategory = async (categoryId: string): Promise<void> => {
  const docRef = doc(db, COLLECTIONS.CATEGORIES, categoryId);
  await updateDoc(docRef, {
    isActive: false,
    updatedAt: serverTimestamp(),
  });
};

// ============================================================
// Calendar Event Service
// ============================================================

/** 기간 내 이벤트 조회 */
export const getEventsByDateRange = async (
  startDate: Date,
  endDate: Date
): Promise<CalendarEvent[]> => {
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
};

/** 이벤트 생성 */
export const createEvent = async (
  data: Omit<CalendarEvent, 'id' | 'createdAt' | 'updatedAt'>
): Promise<CalendarEvent> => {
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
};

/** 이벤트 수정 */
export const updateEvent = async (
  eventId: string,
  data: Partial<CalendarEvent>
): Promise<void> => {
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
};

/** 이벤트 삭제 */
export const deleteEvent = async (eventId: string): Promise<void> => {
  const docRef = doc(db, COLLECTIONS.EVENTS, eventId);
  await deleteDoc(docRef);
};

// ============================================================
// Automation Service
// ============================================================

/** 프로젝트의 자동화 규칙 조회 */
export const getAutomationsByProject = async (projectId: string): Promise<Automation[]> => {
  const q = query(
    collection(db, COLLECTIONS.AUTOMATIONS),
    where('projectId', '==', projectId),
    orderBy('createdAt', 'desc'),
    limit(50)
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) =>
    convertDocumentDates({ id: doc.id, ...doc.data() }) as Automation
  );
};

/** 자동화 규칙 생성 */
export const createAutomation = async (
  data: Omit<Automation, 'id' | 'createdAt' | 'updatedAt' | 'lastRunAt' | 'runCount'>
): Promise<Automation> => {
  const automationId = generateId('auto');
  const now = serverTimestamp();

  const automationData = {
    ...data,
    runCount: 0,
    createdAt: now,
    updatedAt: now,
  };

  await setDoc(doc(db, COLLECTIONS.AUTOMATIONS, automationId), automationData);

  return {
    id: automationId,
    ...data,
    runCount: 0,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  } as Automation;
};

/** 자동화 규칙 수정 */
export const updateAutomation = async (
  automationId: string,
  data: Partial<Automation>
): Promise<void> => {
  const docRef = doc(db, COLLECTIONS.AUTOMATIONS, automationId);
  await updateDoc(docRef, {
    ...data,
    updatedAt: serverTimestamp(),
  });
};

/** 자동화 규칙 삭제 */
export const deleteAutomation = async (automationId: string): Promise<void> => {
  const docRef = doc(db, COLLECTIONS.AUTOMATIONS, automationId);
  await deleteDoc(docRef);
};

// ============================================================
// Batch Operations
// ============================================================

/** 여러 과제 상태 일괄 업데이트 */
export const batchUpdateTaskStatus = async (
  taskIds: string[],
  status: TaskStatus
): Promise<void> => {
  const batch = writeBatch(db);

  taskIds.forEach((taskId) => {
    const docRef = doc(db, COLLECTIONS.TASKS, taskId);
    batch.update(docRef, {
      status,
      updatedAt: serverTimestamp(),
    });
  });

  await batch.commit();
};

/** 프로젝트 멤버 일괄 추가 */
export const batchAddProjectMembers = async (
  projectId: string,
  memberIds: string[]
): Promise<void> => {
  const projectDoc = await getProject(projectId);
  if (!projectDoc) return;

  const newMembers = [...new Set([...projectDoc.members, ...memberIds])];
  await updateProject(projectId, { members: newMembers });
};

// ============================================================
// Utility Functions
// ============================================================

/** 과제 의존성 검증 */
export const validateTaskDependencies = async (
  taskId: string,
  newDependencies: string[]
): Promise<{ valid: boolean; error?: string }> => {
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
};

/** 미완료 선행 과제 조회 */
export const getBlockingTasks = async (taskId: string): Promise<Task[]> => {
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
};

/** 읽지 않은 메시지 수 조회 */
export const getUnreadMessageCount = async (
  userId: string,
  taskId?: string
): Promise<number> => {
  let q = query(collection(db, COLLECTIONS.MESSAGES));

  if (taskId) {
    q = query(q, where('taskId', '==', taskId), limit(100));
  } else {
    q = query(q, limit(500));
  }

  const snapshot = await getDocs(q);
  let unreadCount = 0;

  snapshot.docs.forEach((doc) => {
    const data = doc.data();
    // 본인이 보낸 메시지가 아니고, readBy에 userId가 없으면 미읽음
    if (data.senderId !== userId && !data.readBy?.[userId]) {
      unreadCount++;
    }
  });

  return unreadCount;
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
};

/** 프로젝트 설정 업데이트 */
export const updateProjectSettings = async (
  projectId: string,
  data: Partial<Pick<ProjectSettings, 'projectName' | 'projectDescription' | 'defaultView' | 'notifications'>>
): Promise<void> => {
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
      console.error(`[projectService] subscribeToTasks failed for project ${projectId}:`, error);
    }
  );
};

// ============================================================
// Notification Service
// ============================================================

/** 알림 생성 */
export const createNotification = async (
  data: Omit<ProjectNotification, 'id' | 'createdAt'>
): Promise<ProjectNotification> => {
  const notificationId = generateId('notif');
  const now = serverTimestamp();

  const notifData = {
    ...data,
    createdAt: now,
  };

  await setDoc(doc(db, COLLECTIONS.NOTIFICATIONS, notificationId), notifData);

  return {
    id: notificationId,
    ...data,
    createdAt: new Date(),
  } as ProjectNotification;
};

/** 사용자별 알림 조회 */
export const getNotificationsByUser = async (
  userId: string,
  maxCount: number = 50
): Promise<ProjectNotification[]> => {
  const q = query(
    collection(db, COLLECTIONS.NOTIFICATIONS),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc'),
    limit(maxCount)
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) =>
    convertDocumentDates({ id: doc.id, ...doc.data() }) as ProjectNotification
  );
};

/** 알림 읽음 처리 */
export const markNotificationAsRead = async (notificationId: string): Promise<void> => {
  const docRef = doc(db, COLLECTIONS.NOTIFICATIONS, notificationId);
  await updateDoc(docRef, {
    isRead: true,
    readAt: serverTimestamp(),
  });
};

/** 전체 알림 읽음 처리 */
export const markAllNotificationsAsRead = async (userId: string): Promise<void> => {
  const q = query(
    collection(db, COLLECTIONS.NOTIFICATIONS),
    where('userId', '==', userId),
    where('isRead', '==', false),
    limit(100)
  );
  const snapshot = await getDocs(q);

  if (snapshot.empty) return;

  const batch = writeBatch(db);
  snapshot.docs.forEach((d) => {
    batch.update(d.ref, {
      isRead: true,
      readAt: serverTimestamp(),
    });
  });
  await batch.commit();
};

/** 알림 실시간 구독 */
export const subscribeNotificationsRealtime = (
  userId: string,
  callback: (notifications: ProjectNotification[]) => void
): (() => void) => {
  const q = query(
    collection(db, COLLECTIONS.NOTIFICATIONS),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc'),
    limit(50)
  );

  return onSnapshot(q, (snapshot) => {
    const notifications = snapshot.docs.map((doc) =>
      convertDocumentDates({ id: doc.id, ...doc.data() }) as ProjectNotification
    );
    callback(notifications);
  });
};

// ============================================================
// Member-Auth Linking Service
// ============================================================

/** 이메일로 팀원 조회 */
export const getMemberByEmail = async (email: string): Promise<ProjectMember | null> => {
  const q = query(
    collection(db, COLLECTIONS.MEMBERS),
    where('email', '==', email),
    limit(1)
  );
  const snapshot = await getDocs(q);
  if (snapshot.empty) return null;
  return convertDocumentDates({ id: snapshot.docs[0].id, ...snapshot.docs[0].data() }) as ProjectMember;
};

/** uid로 팀원 조회 */
export const getMemberByUid = async (uid: string): Promise<ProjectMember | null> => {
  const q = query(
    collection(db, COLLECTIONS.MEMBERS),
    where('uid', '==', uid),
    limit(1)
  );
  const snapshot = await getDocs(q);
  if (snapshot.empty) return null;
  return convertDocumentDates({ id: snapshot.docs[0].id, ...snapshot.docs[0].data() }) as ProjectMember;
};

/** 팀원에 Firebase Auth uid 연결 */
export const linkMemberToAuth = async (memberId: string, uid: string): Promise<void> => {
  const docRef = doc(db, COLLECTIONS.MEMBERS, memberId);
  await updateDoc(docRef, {
    uid,
    updatedAt: serverTimestamp(),
  });
};

/** uid로 배정된 과제 조회 (uid → memberId → 과제) */
export const getTasksByAssigneeUid = async (uid: string): Promise<Task[]> => {
  const member = await getMemberByUid(uid);
  if (!member) return [];

  const q = query(
    collection(db, COLLECTIONS.TASKS),
    where('assignees', 'array-contains', member.id),
    orderBy('createdAt', 'desc'),
    limit(100)
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) =>
    convertDocumentDates({ id: doc.id, ...doc.data() }) as Task
  );
};

// Export collections for direct access if needed
export { COLLECTIONS };
