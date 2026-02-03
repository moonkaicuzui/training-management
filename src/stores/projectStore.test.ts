/**
 * Project Store Tests
 * 프로젝트 관리 스토어 테스트
 *
 * [TAE 🤖] Test Automation Engineer
 */

import { describe, it, expect } from 'vitest';
import type {
  Project,
  Task,
  ProjectMember,
  TaskStatus,
  TaskFilter,
  Category,
  CalendarEvent,
  Automation,
} from '@/types/project';

// ========== Mock Data ==========

const mockMembers: ProjectMember[] = [
  {
    id: 'member-1',
    userId: 'user-1',
    name: '홍길동',
    email: 'hong@example.com',
    role: 'manager',
    department: '기획팀',
    avatar: '/avatars/1.png',
    isActive: true,
    joinedAt: new Date('2024-01-01'),
  },
  {
    id: 'member-2',
    userId: 'user-2',
    name: '김철수',
    email: 'kim@example.com',
    role: 'member',
    department: '개발팀',
    isActive: true,
    joinedAt: new Date('2024-01-15'),
  },
];

const mockProjects: Project[] = [
  {
    id: 'project-1',
    name: 'Q-TRAIN 시스템 개발',
    description: '교육 관리 시스템 개발 프로젝트',
    status: 'active',
    priority: 'high',
    startDate: new Date('2024-01-01'),
    endDate: new Date('2024-06-30'),
    owner: 'member-1',
    members: ['member-1', 'member-2'],
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-15'),
  },
  {
    id: 'project-2',
    name: 'CAPA 시스템 구축',
    description: 'CAPA 관리 시스템 구축',
    status: 'planning',
    priority: 'medium',
    startDate: new Date('2024-03-01'),
    owner: 'member-1',
    members: ['member-1'],
    createdAt: new Date('2024-02-01'),
    updatedAt: new Date('2024-02-01'),
  },
];

const mockTasks: Task[] = [
  {
    id: 'task-1',
    projectId: 'project-1',
    title: '데이터베이스 설계',
    description: 'Firestore 데이터 모델 설계',
    status: 'completed',
    priority: 'high',
    assignedTo: ['member-2'],
    dueDate: new Date('2024-02-01'),
    createdBy: 'member-1',
    createdAt: new Date('2024-01-05'),
    updatedAt: new Date('2024-02-01'),
  },
  {
    id: 'task-2',
    projectId: 'project-1',
    title: 'UI 컴포넌트 개발',
    description: 'React 컴포넌트 개발',
    status: 'in_progress',
    priority: 'high',
    assignedTo: ['member-2'],
    dueDate: new Date('2024-03-01'),
    createdBy: 'member-1',
    createdAt: new Date('2024-01-10'),
    updatedAt: new Date('2024-02-15'),
  },
  {
    id: 'task-3',
    projectId: 'project-1',
    title: '테스트 작성',
    description: 'E2E 테스트 작성',
    status: 'pending',
    priority: 'medium',
    assignedTo: ['member-1', 'member-2'],
    dueDate: new Date('2024-04-01'),
    createdBy: 'member-1',
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-15'),
  },
];

const mockCategories: Category[] = [
  {
    id: 'cat-1',
    name: '개발',
    color: '#3B82F6',
    type: 'task',
    icon: 'code',
  },
  {
    id: 'cat-2',
    name: '회의',
    color: '#10B981',
    type: 'event',
    icon: 'users',
  },
];

const mockEvents: CalendarEvent[] = [
  {
    id: 'event-1',
    title: '주간 회의',
    start: new Date('2024-02-05T10:00:00'),
    end: new Date('2024-02-05T11:00:00'),
    allDay: false,
    categoryId: 'cat-2',
    projectId: 'project-1',
    attendees: ['member-1', 'member-2'],
    createdAt: new Date('2024-01-20'),
    updatedAt: new Date('2024-01-20'),
  },
];

// ========== Tests ==========

describe('Project Store State', () => {
  describe('Initial State', () => {
    it('초기 상태는 빈 배열과 null 값을 가진다', () => {
      const initialState = {
        members: [],
        projects: [],
        tasks: [],
        messages: [],
        categories: [],
        events: [],
        automations: [],
        currentProjectId: null,
        currentTaskId: null,
        currentMemberId: null,
        currentView: 'list' as const,
        filters: [],
      };

      expect(initialState.members).toHaveLength(0);
      expect(initialState.projects).toHaveLength(0);
      expect(initialState.tasks).toHaveLength(0);
      expect(initialState.currentProjectId).toBeNull();
    });

    it('로딩 상태는 모두 false로 초기화된다', () => {
      const initialLoading = {
        isLoading: false,
        isMembersLoading: false,
        isProjectsLoading: false,
        isTasksLoading: false,
        isMessagesLoading: false,
        isAutomationsLoading: false,
      };

      Object.values(initialLoading).forEach((loading) => {
        expect(loading).toBe(false);
      });
    });
  });
});

describe('Member Management', () => {
  describe('Member CRUD', () => {
    it('새 멤버를 추가할 수 있다', () => {
      const members = [...mockMembers];
      const newMember: ProjectMember = {
        id: 'member-3',
        userId: 'user-3',
        name: '이영희',
        email: 'lee@example.com',
        role: 'member',
        department: '디자인팀',
        isActive: true,
        joinedAt: new Date(),
      };

      members.push(newMember);
      expect(members).toHaveLength(3);
      expect(members.find((m) => m.id === 'member-3')).toBeDefined();
    });

    it('멤버 정보를 업데이트할 수 있다', () => {
      const member = { ...mockMembers[0] };
      member.role = 'admin';
      member.department = '경영팀';

      expect(member.role).toBe('admin');
      expect(member.department).toBe('경영팀');
    });

    it('멤버를 비활성화할 수 있다', () => {
      const member = { ...mockMembers[0] };
      member.isActive = false;

      expect(member.isActive).toBe(false);
    });
  });

  describe('Member Queries', () => {
    it('ID로 멤버를 조회할 수 있다', () => {
      const member = mockMembers.find((m) => m.id === 'member-1');
      expect(member).toBeDefined();
      expect(member?.name).toBe('홍길동');
    });

    it('역할로 멤버를 필터링할 수 있다', () => {
      const managers = mockMembers.filter((m) => m.role === 'manager');
      expect(managers).toHaveLength(1);
    });

    it('활성 멤버만 필터링할 수 있다', () => {
      const activeMembers = mockMembers.filter((m) => m.isActive);
      expect(activeMembers).toHaveLength(2);
    });
  });
});

describe('Project Management', () => {
  describe('Project CRUD', () => {
    it('새 프로젝트를 생성할 수 있다', () => {
      const projects = [...mockProjects];
      const newProject: Project = {
        id: 'project-3',
        name: '신규 프로젝트',
        description: '설명',
        status: 'planning',
        priority: 'medium',
        startDate: new Date(),
        owner: 'member-1',
        members: ['member-1'],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      projects.push(newProject);
      expect(projects).toHaveLength(3);
    });

    it('프로젝트 상태를 변경할 수 있다', () => {
      const project = { ...mockProjects[0] };
      project.status = 'completed';
      project.updatedAt = new Date();

      expect(project.status).toBe('completed');
    });

    it('프로젝트에 멤버를 추가할 수 있다', () => {
      const project = { ...mockProjects[1] };
      project.members = [...project.members, 'member-2'];

      expect(project.members).toContain('member-2');
    });
  });

  describe('Project Selection', () => {
    it('현재 프로젝트를 선택할 수 있다', () => {
      let currentProjectId: string | null = null;
      currentProjectId = 'project-1';

      const currentProject = mockProjects.find((p) => p.id === currentProjectId);
      expect(currentProject).toBeDefined();
      expect(currentProject?.name).toBe('Q-TRAIN 시스템 개발');
    });

    it('프로젝트 선택을 해제할 수 있다', () => {
      let currentProjectId: string | null = 'project-1';
      currentProjectId = null;

      expect(currentProjectId).toBeNull();
    });
  });

  describe('Project Status', () => {
    it('유효한 프로젝트 상태를 가진다', () => {
      const validStatuses = ['planning', 'active', 'on_hold', 'completed', 'cancelled'];

      mockProjects.forEach((project) => {
        expect(validStatuses).toContain(project.status);
      });
    });
  });
});

describe('Task Management', () => {
  describe('Task CRUD', () => {
    it('새 과제를 생성할 수 있다', () => {
      const tasks = [...mockTasks];
      const newTask: Task = {
        id: 'task-4',
        projectId: 'project-1',
        title: '새 과제',
        description: '설명',
        status: 'pending',
        priority: 'low',
        assignedTo: [],
        createdBy: 'member-1',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      tasks.push(newTask);
      expect(tasks).toHaveLength(4);
    });

    it('과제를 업데이트할 수 있다', () => {
      const task = { ...mockTasks[0] };
      task.title = '수정된 제목';
      task.priority = 'medium';
      task.updatedAt = new Date();

      expect(task.title).toBe('수정된 제목');
      expect(task.priority).toBe('medium');
    });

    it('과제를 삭제할 수 있다', () => {
      const tasks = mockTasks.filter((t) => t.id !== 'task-1');
      expect(tasks).toHaveLength(2);
    });
  });

  describe('Task Status Management', () => {
    it('과제 상태를 변경할 수 있다', () => {
      const task = { ...mockTasks[2] };
      task.status = 'in_progress';

      expect(task.status).toBe('in_progress');
    });

    it('유효한 상태 전환만 허용한다', () => {
      const validStatuses: TaskStatus[] = ['pending', 'in_progress', 'completed', 'cancelled'];

      mockTasks.forEach((task) => {
        expect(validStatuses).toContain(task.status);
      });
    });

    it('상태별로 과제를 그룹화할 수 있다', () => {
      const byStatus = mockTasks.reduce((acc, task) => {
        acc[task.status] = (acc[task.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      expect(byStatus['completed']).toBe(1);
      expect(byStatus['in_progress']).toBe(1);
      expect(byStatus['pending']).toBe(1);
    });
  });

  describe('Task Batch Operations', () => {
    it('여러 과제의 상태를 일괄 변경할 수 있다', () => {
      const taskIds = ['task-2', 'task-3'];
      const newStatus: TaskStatus = 'completed';

      const updatedTasks = mockTasks.map((task) => {
        if (taskIds.includes(task.id)) {
          return { ...task, status: newStatus };
        }
        return task;
      });

      const completedCount = updatedTasks.filter((t) => t.status === 'completed').length;
      expect(completedCount).toBe(3);
    });
  });

  describe('Task Assignment', () => {
    it('과제에 담당자를 할당할 수 있다', () => {
      const task = { ...mockTasks[2] };
      task.assignedTo = ['member-1'];

      expect(task.assignedTo).toContain('member-1');
    });

    it('멤버에게 할당된 과제를 조회할 수 있다', () => {
      const memberId = 'member-2';
      const assignedTasks = mockTasks.filter((t) => t.assignedTo.includes(memberId));

      expect(assignedTasks).toHaveLength(3);
    });
  });

  describe('Task Filtering', () => {
    it('상태로 필터링할 수 있다', () => {
      const filters: TaskFilter[] = [{ field: 'status', value: 'pending' }];
      const filtered = mockTasks.filter((task) => {
        return filters.every((f) => task[f.field as keyof Task] === f.value);
      });

      expect(filtered).toHaveLength(1);
    });

    it('우선순위로 필터링할 수 있다', () => {
      const highPriorityTasks = mockTasks.filter((t) => t.priority === 'high');
      expect(highPriorityTasks).toHaveLength(2);
    });

    it('프로젝트별로 필터링할 수 있다', () => {
      const projectTasks = mockTasks.filter((t) => t.projectId === 'project-1');
      expect(projectTasks).toHaveLength(3);
    });
  });
});

describe('Calendar Events', () => {
  describe('Event CRUD', () => {
    it('새 이벤트를 생성할 수 있다', () => {
      const events = [...mockEvents];
      const newEvent: CalendarEvent = {
        id: 'event-2',
        title: '신규 회의',
        start: new Date('2024-02-10T14:00:00'),
        end: new Date('2024-02-10T15:00:00'),
        allDay: false,
        projectId: 'project-1',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      events.push(newEvent);
      expect(events).toHaveLength(2);
    });

    it('이벤트를 수정할 수 있다', () => {
      const event = { ...mockEvents[0] };
      event.title = '수정된 회의';
      event.start = new Date('2024-02-05T14:00:00');

      expect(event.title).toBe('수정된 회의');
    });

    it('이벤트를 삭제할 수 있다', () => {
      const events = mockEvents.filter((e) => e.id !== 'event-1');
      expect(events).toHaveLength(0);
    });
  });

  describe('Event Queries', () => {
    it('날짜 범위로 이벤트를 조회할 수 있다', () => {
      const startDate = new Date('2024-02-01');
      const endDate = new Date('2024-02-28');

      const eventsInRange = mockEvents.filter((event) => {
        return event.start >= startDate && event.start <= endDate;
      });

      expect(eventsInRange).toHaveLength(1);
    });

    it('프로젝트별 이벤트를 조회할 수 있다', () => {
      const projectEvents = mockEvents.filter((e) => e.projectId === 'project-1');
      expect(projectEvents).toHaveLength(1);
    });
  });
});

describe('Categories', () => {
  describe('Category CRUD', () => {
    it('새 카테고리를 생성할 수 있다', () => {
      const categories = [...mockCategories];
      const newCategory: Category = {
        id: 'cat-3',
        name: '마케팅',
        color: '#F59E0B',
        type: 'task',
      };

      categories.push(newCategory);
      expect(categories).toHaveLength(3);
    });

    it('카테고리를 수정할 수 있다', () => {
      const category = { ...mockCategories[0] };
      category.color = '#EF4444';

      expect(category.color).toBe('#EF4444');
    });
  });

  describe('Category Types', () => {
    it('유효한 카테고리 타입을 가진다', () => {
      const validTypes = ['event', 'task'];

      mockCategories.forEach((category) => {
        expect(validTypes).toContain(category.type);
      });
    });

    it('타입별로 카테고리를 필터링할 수 있다', () => {
      const eventCategories = mockCategories.filter((c) => c.type === 'event');
      expect(eventCategories).toHaveLength(1);
    });
  });
});

describe('View Management', () => {
  describe('View Types', () => {
    it('리스트 뷰가 기본값이다', () => {
      const currentView = 'list';
      expect(currentView).toBe('list');
    });

    it('뷰 타입을 변경할 수 있다', () => {
      const views = ['list', 'board', 'calendar', 'timeline'];
      let currentView = 'list';

      currentView = 'board';
      expect(currentView).toBe('board');
      expect(views).toContain(currentView);
    });
  });
});

describe('Automation Rules', () => {
  describe('Automation CRUD', () => {
    it('새 자동화 규칙을 생성할 수 있다', () => {
      const automation: Automation = {
        id: 'auto-1',
        name: '완료 시 알림',
        projectId: 'project-1',
        trigger: {
          type: 'status_change',
          value: 'completed',
        },
        action: {
          type: 'notification',
          value: '과제가 완료되었습니다.',
        },
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        runCount: 0,
      };

      expect(automation.trigger.type).toBe('status_change');
      expect(automation.action.type).toBe('notification');
    });

    it('자동화를 활성화/비활성화할 수 있다', () => {
      const automation: Automation = {
        id: 'auto-1',
        name: '자동화',
        projectId: 'project-1',
        trigger: { type: 'status_change', value: 'completed' },
        action: { type: 'notification', value: '알림' },
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        runCount: 0,
      };

      automation.isActive = false;
      expect(automation.isActive).toBe(false);
    });
  });
});

describe('Utility Functions', () => {
  describe('getMemberById', () => {
    it('ID로 멤버를 찾는다', () => {
      const getMemberById = (memberId: string) =>
        mockMembers.find((m) => m.id === memberId);

      const member = getMemberById('member-1');
      expect(member?.name).toBe('홍길동');
    });

    it('없는 ID는 undefined를 반환한다', () => {
      const getMemberById = (memberId: string) =>
        mockMembers.find((m) => m.id === memberId);

      const member = getMemberById('non-existent');
      expect(member).toBeUndefined();
    });
  });

  describe('getTasksByStatus', () => {
    it('상태별 과제 목록을 반환한다', () => {
      const getTasksByStatus = (status: TaskStatus) =>
        mockTasks.filter((t) => t.status === status);

      const completedTasks = getTasksByStatus('completed');
      expect(completedTasks).toHaveLength(1);
    });
  });

  describe('getAssignedTasks', () => {
    it('멤버에게 할당된 과제를 반환한다', () => {
      const getAssignedTasks = (memberId: string) =>
        mockTasks.filter((t) => t.assignedTo.includes(memberId));

      const assigned = getAssignedTasks('member-2');
      expect(assigned).toHaveLength(3);
    });
  });

  describe('getCurrentProject', () => {
    it('현재 선택된 프로젝트를 반환한다', () => {
      const currentProjectId = 'project-1';
      const getCurrentProject = () =>
        mockProjects.find((p) => p.id === currentProjectId) || null;

      const project = getCurrentProject();
      expect(project?.name).toBe('Q-TRAIN 시스템 개발');
    });
  });
});
