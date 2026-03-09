/**
 * Authentication Types
 * Google OAuth 인증 관련 타입 정의
 */

// 사용자 역할
export type UserRole = 'ADMIN' | 'TRAINER' | 'VIEWER';

// 사용자 정보
export interface User {
  id: string;
  email: string;
  name: string;
  picture?: string;
  role: UserRole;
  department?: string;
}

// JWT 토큰 페이로드 (Google OAuth)
export interface GoogleCredentialPayload {
  iss: string;
  azp: string;
  aud: string;
  sub: string;
  email: string;
  email_verified: boolean;
  name: string;
  picture: string;
  given_name: string;
  family_name: string;
  iat: number;
  exp: number;
  jti: string;
}

// 인증 상태
export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

// 역할별 권한
export interface RolePermissions {
  canViewDashboard: boolean;
  canViewProgress: boolean;
  canViewPrograms: boolean;
  canEditPrograms: boolean;
  canViewResults: boolean;
  canEditResults: boolean;
  canViewEmployees: boolean;
  canEditEmployees: boolean;
  canViewSchedule: boolean;
  canEditSchedule: boolean;
  canViewRetraining: boolean;
  canManageUsers: boolean;
}

// 역할별 권한 매핑
export const ROLE_PERMISSIONS: Record<UserRole, RolePermissions> = {
  ADMIN: {
    canViewDashboard: true,
    canViewProgress: true,
    canViewPrograms: true,
    canEditPrograms: true,
    canViewResults: true,
    canEditResults: true,
    canViewEmployees: true,
    canEditEmployees: true,
    canViewSchedule: true,
    canEditSchedule: true,
    canViewRetraining: true,
    canManageUsers: true,
  },
  TRAINER: {
    canViewDashboard: true,
    canViewProgress: true,
    canViewPrograms: true,
    canEditPrograms: false,
    canViewResults: true,
    canEditResults: true,
    canViewEmployees: true,
    canEditEmployees: false,
    canViewSchedule: true,
    canEditSchedule: true,
    canViewRetraining: true,
    canManageUsers: false,
  },
  VIEWER: {
    canViewDashboard: true,
    canViewProgress: true,
    canViewPrograms: true,
    canEditPrograms: false,
    canViewResults: true,
    canEditResults: false,
    canViewEmployees: true,
    canEditEmployees: false,
    canViewSchedule: true,
    canEditSchedule: false,
    canViewRetraining: true,
    canManageUsers: false,
  },
};

// 허용된 이메일 도메인 (화승 도메인)
const DEV_DOMAINS: string[] = import.meta.env.DEV ? ['gmail.com'] : [];
export const ALLOWED_EMAIL_DOMAINS = [
  'hwaseung.com',
  'hwaseungvina.com',
  'hsvina.com',
  ...DEV_DOMAINS,
];

// 관리자 이메일 목록 (ADMIN 역할 자동 부여)
const DEV_ADMIN_EMAILS: string[] = import.meta.env.DEV ? ['ksmoon@gmail.com'] : [];
export const ADMIN_EMAILS = [
  'admin@hwaseung.com',
  'qip.admin@hwaseungvina.com',
  'ksmoon@hsvina.com',
  ...DEV_ADMIN_EMAILS,
];
