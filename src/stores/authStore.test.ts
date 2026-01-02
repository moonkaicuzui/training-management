/**
 * Authentication Store Tests
 * 인증 로직 및 권한 검증 테스트
 */

import { describe, it, expect } from 'vitest';
import { ROLE_PERMISSIONS, ALLOWED_EMAIL_DOMAINS, ADMIN_EMAILS, type UserRole, type RolePermissions } from '@/types/auth';

// Helper functions extracted for testing (simulating the logic from authStore)
function isAllowedEmail(email: string): boolean {
  const domain = email.split('@')[1]?.toLowerCase();
  return ALLOWED_EMAIL_DOMAINS.some((allowed) => domain === allowed.toLowerCase());
}

function determineRole(email: string): UserRole {
  if (ADMIN_EMAILS.some((admin) => admin.toLowerCase() === email.toLowerCase())) {
    return 'ADMIN';
  }
  return 'TRAINER';
}

describe('Authentication Logic', () => {
  describe('isAllowedEmail', () => {
    it('화승 도메인 이메일을 허용한다', () => {
      expect(isAllowedEmail('user@hwaseung.com')).toBe(true);
      expect(isAllowedEmail('user@hwaseungvina.com')).toBe(true);
      expect(isAllowedEmail('user@hsvina.com')).toBe(true);
    });

    it('개발용 gmail 도메인을 허용한다', () => {
      expect(isAllowedEmail('dev@gmail.com')).toBe(true);
    });

    it('허용되지 않은 도메인은 거부한다', () => {
      expect(isAllowedEmail('user@yahoo.com')).toBe(false);
      expect(isAllowedEmail('user@naver.com')).toBe(false);
      expect(isAllowedEmail('user@hotmail.com')).toBe(false);
      expect(isAllowedEmail('user@company.co.kr')).toBe(false);
    });

    it('대소문자를 구분하지 않는다', () => {
      expect(isAllowedEmail('user@HWASEUNG.COM')).toBe(true);
      expect(isAllowedEmail('user@HsViNa.CoM')).toBe(true);
    });

    it('이메일 형식이 잘못된 경우 거부한다', () => {
      expect(isAllowedEmail('invalid-email')).toBe(false);
      expect(isAllowedEmail('no-at-sign')).toBe(false);
      expect(isAllowedEmail('')).toBe(false);
    });
  });

  describe('determineRole', () => {
    it('관리자 이메일은 ADMIN 역할을 부여한다', () => {
      expect(determineRole('admin@hwaseung.com')).toBe('ADMIN');
      expect(determineRole('qip.admin@hwaseungvina.com')).toBe('ADMIN');
      expect(determineRole('ksmoon@hsvina.com')).toBe('ADMIN');
      expect(determineRole('ksmoon@gmail.com')).toBe('ADMIN');
    });

    it('관리자 이메일 검사는 대소문자를 구분하지 않는다', () => {
      expect(determineRole('ADMIN@HWASEUNG.COM')).toBe('ADMIN');
      expect(determineRole('KsMoon@hsvina.com')).toBe('ADMIN');
    });

    it('일반 사용자는 TRAINER 역할을 부여한다', () => {
      expect(determineRole('user@hwaseung.com')).toBe('TRAINER');
      expect(determineRole('trainer@hsvina.com')).toBe('TRAINER');
      expect(determineRole('employee@hwaseungvina.com')).toBe('TRAINER');
    });
  });
});

describe('Role Permissions (RBAC)', () => {
  describe('ADMIN Role', () => {
    const adminPermissions = ROLE_PERMISSIONS['ADMIN'];

    it('모든 보기 권한을 가진다', () => {
      expect(adminPermissions.canViewDashboard).toBe(true);
      expect(adminPermissions.canViewProgress).toBe(true);
      expect(adminPermissions.canViewPrograms).toBe(true);
      expect(adminPermissions.canViewResults).toBe(true);
      expect(adminPermissions.canViewEmployees).toBe(true);
      expect(adminPermissions.canViewSchedule).toBe(true);
      expect(adminPermissions.canViewRetraining).toBe(true);
    });

    it('모든 편집 권한을 가진다', () => {
      expect(adminPermissions.canEditPrograms).toBe(true);
      expect(adminPermissions.canEditResults).toBe(true);
      expect(adminPermissions.canEditEmployees).toBe(true);
      expect(adminPermissions.canEditSchedule).toBe(true);
    });

    it('사용자 관리 권한을 가진다', () => {
      expect(adminPermissions.canManageUsers).toBe(true);
    });
  });

  describe('TRAINER Role', () => {
    const trainerPermissions = ROLE_PERMISSIONS['TRAINER'];

    it('모든 보기 권한을 가진다', () => {
      expect(trainerPermissions.canViewDashboard).toBe(true);
      expect(trainerPermissions.canViewProgress).toBe(true);
      expect(trainerPermissions.canViewPrograms).toBe(true);
      expect(trainerPermissions.canViewResults).toBe(true);
      expect(trainerPermissions.canViewEmployees).toBe(true);
      expect(trainerPermissions.canViewSchedule).toBe(true);
      expect(trainerPermissions.canViewRetraining).toBe(true);
    });

    it('결과와 일정만 편집할 수 있다', () => {
      expect(trainerPermissions.canEditResults).toBe(true);
      expect(trainerPermissions.canEditSchedule).toBe(true);
    });

    it('프로그램과 직원은 편집할 수 없다', () => {
      expect(trainerPermissions.canEditPrograms).toBe(false);
      expect(trainerPermissions.canEditEmployees).toBe(false);
    });

    it('사용자 관리 권한이 없다', () => {
      expect(trainerPermissions.canManageUsers).toBe(false);
    });
  });

  describe('VIEWER Role', () => {
    const viewerPermissions = ROLE_PERMISSIONS['VIEWER'];

    it('모든 보기 권한을 가진다', () => {
      expect(viewerPermissions.canViewDashboard).toBe(true);
      expect(viewerPermissions.canViewProgress).toBe(true);
      expect(viewerPermissions.canViewPrograms).toBe(true);
      expect(viewerPermissions.canViewResults).toBe(true);
      expect(viewerPermissions.canViewEmployees).toBe(true);
      expect(viewerPermissions.canViewSchedule).toBe(true);
      expect(viewerPermissions.canViewRetraining).toBe(true);
    });

    it('편집 권한이 없다', () => {
      expect(viewerPermissions.canEditPrograms).toBe(false);
      expect(viewerPermissions.canEditResults).toBe(false);
      expect(viewerPermissions.canEditEmployees).toBe(false);
      expect(viewerPermissions.canEditSchedule).toBe(false);
    });

    it('사용자 관리 권한이 없다', () => {
      expect(viewerPermissions.canManageUsers).toBe(false);
    });
  });

  describe('Permission Hierarchy', () => {
    it('ADMIN > TRAINER > VIEWER 순서로 권한이 축소된다', () => {
      const admin = ROLE_PERMISSIONS['ADMIN'];
      const trainer = ROLE_PERMISSIONS['TRAINER'];
      const viewer = ROLE_PERMISSIONS['VIEWER'];

      // ADMIN이 가장 많은 권한
      const adminEditCount = countEditPermissions(admin);
      const trainerEditCount = countEditPermissions(trainer);
      const viewerEditCount = countEditPermissions(viewer);

      expect(adminEditCount).toBeGreaterThan(trainerEditCount);
      expect(trainerEditCount).toBeGreaterThan(viewerEditCount);
      expect(viewerEditCount).toBe(0);
    });
  });
});

// Helper function for counting edit permissions
function countEditPermissions(permissions: RolePermissions): number {
  return [
    permissions.canEditPrograms,
    permissions.canEditResults,
    permissions.canEditEmployees,
    permissions.canEditSchedule,
    permissions.canManageUsers,
  ].filter(Boolean).length;
}

describe('Constants Validation', () => {
  describe('ALLOWED_EMAIL_DOMAINS', () => {
    it('화승 도메인이 포함되어 있다', () => {
      expect(ALLOWED_EMAIL_DOMAINS).toContain('hwaseung.com');
      expect(ALLOWED_EMAIL_DOMAINS).toContain('hwaseungvina.com');
      expect(ALLOWED_EMAIL_DOMAINS).toContain('hsvina.com');
    });

    it('개발용 도메인이 포함되어 있다', () => {
      expect(ALLOWED_EMAIL_DOMAINS).toContain('gmail.com');
    });
  });

  describe('ADMIN_EMAILS', () => {
    it('관리자 이메일이 정의되어 있다', () => {
      expect(ADMIN_EMAILS.length).toBeGreaterThan(0);
    });

    it('모든 관리자 이메일은 유효한 형식이다', () => {
      ADMIN_EMAILS.forEach((email) => {
        expect(email).toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
      });
    });

    it('모든 관리자 이메일은 허용된 도메인에 속한다', () => {
      ADMIN_EMAILS.forEach((email) => {
        expect(isAllowedEmail(email)).toBe(true);
      });
    });
  });
});
