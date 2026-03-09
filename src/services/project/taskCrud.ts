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
  orderBy,
  limit,
  serverTimestamp,
  onSnapshot,
  Timestamp,
} from '@/services/firebase';
import type {
  Task,
  CreateTaskInput,
  UpdateTaskInput,
  TaskStatus,
} from '@/types/project';
import { COLLECTIONS, generateId, convertDocumentDates, convertTimestamp } from './common';
import { logger } from '@/utils/logger';

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
    logger.error('[taskCrud] getTasksByProject failed:', error);
    throw error;
  }
};

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
    logger.error('[taskCrud] getAllTasks failed:', error);
    throw error;
  }
};

export const getTask = async (taskId: string): Promise<Task | null> => {
  try {
    const docRef = doc(db, COLLECTIONS.TASKS, taskId);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) return null;
    return convertDocumentDates({ id: docSnap.id, ...docSnap.data() }) as Task;
  } catch (error) {
    logger.error('[taskCrud] getTask failed:', error);
    throw error;
  }
};

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
    logger.error('[taskCrud] createTask failed:', error);
    throw error;
  }
};

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
    logger.error('[taskCrud] updateTask failed:', error);
    throw error;
  }
};

export const deleteTask = async (taskId: string): Promise<void> => {
  try {
    const docRef = doc(db, COLLECTIONS.TASKS, taskId);
    await deleteDoc(docRef);
  } catch (error) {
    logger.error('[taskCrud] deleteTask failed:', error);
    throw error;
  }
};

export const updateTaskStatusAuto = async (taskId: string): Promise<void> => {
  try {
    const task = await getTask(taskId);
    if (!task) return;

    const now = new Date();
    const startDate = convertTimestamp(task.startDate as Timestamp);
    const dueDate = convertTimestamp(task.dueDate as Timestamp);

    let newStatus: TaskStatus = task.status;

    if (task.progress >= 100) {
      newStatus = 'done';
    }
    else if (startDate && now > startDate && task.status === 'todo') {
      newStatus = 'delayed_start';
    }
    else if (dueDate && now > dueDate && task.status !== 'done') {
      newStatus = 'delayed_complete';
    }
    else if (startDate && now >= startDate && task.status === 'todo') {
      newStatus = 'in_progress';
    }

    if (newStatus !== task.status) {
      await updateTask(taskId, { status: newStatus });
    }
  } catch (error) {
    logger.error('[taskCrud] updateTaskStatusAuto failed:', error);
    throw error;
  }
};

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
      logger.error(`[taskCrud] subscribeToTasks failed for project ${projectId}:`, error);
    }
  );
};
