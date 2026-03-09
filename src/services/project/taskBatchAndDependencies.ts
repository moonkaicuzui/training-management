import {
  db,
  doc,
  writeBatch,
  serverTimestamp,
} from '@/services/firebase';
import type { Task, TaskStatus } from '@/types/project';
import { COLLECTIONS } from './common';
import { getTask } from './taskCrud';
import { getProject, updateProject } from './projectCrud';
import { logger } from '@/utils/logger';
import i18n from '@/i18n';

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
    logger.error('[taskBatchAndDependencies] batchUpdateTaskStatus failed:', error);
    throw error;
  }
};

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
    logger.error('[taskBatchAndDependencies] batchAddProjectMembers failed:', error);
    throw error;
  }
};

export const validateTaskDependencies = async (
  taskId: string,
  newDependencies: string[]
): Promise<{ valid: boolean; error?: string }> => {
  try {
    const visited = new Set<string>();
    const stack = [...newDependencies];

    while (stack.length > 0) {
      const currentId = stack.pop()!;

      if (currentId === taskId) {
        return { valid: false, error: i18n.t('projects.circularDependencyError') };
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
    logger.error('[taskBatchAndDependencies] validateTaskDependencies failed:', error);
    throw error;
  }
};

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
    logger.error('[taskBatchAndDependencies] getBlockingTasks failed:', error);
    throw error;
  }
};
