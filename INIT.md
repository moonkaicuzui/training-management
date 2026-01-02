# Q-TRAIN Project Initialization Guide

## Project Overview

| 항목 | 내용 |
|------|------|
| **프로젝트명** | Q-TRAIN (화승비나 QIP 교육 관리 시스템) |
| **목적** | HWK Vietnam 직원 교육 관리 및 QIP 운영 |
| **버전** | 0.0.0 (개발 중) |
| **호스팅** | Firebase Hosting |
| **URL** | https://q-train-web.web.app/ |

---

## Tech Stack

### Frontend
| 기술 | 버전 | 용도 |
|------|------|------|
| React | 19.2.0 | UI 프레임워크 |
| TypeScript | 5.9.3 | 타입 안전성 |
| Vite | 7.2.4 | 빌드 도구 |
| Tailwind CSS | 3.4.19 | 스타일링 |
| shadcn/ui | - | UI 컴포넌트 |

### State Management
| 기술 | 버전 | 용도 |
|------|------|------|
| Zustand | 5.0.9 | 전역 상태 관리 |

### Backend & Auth
| 기술 | 버전 | 용도 |
|------|------|------|
| Firebase | 12.7.0 | 인증, DB, 호스팅 |
| Firestore | - | 데이터베이스 |

### Internationalization
| 기술 | 버전 | 언어 |
|------|------|------|
| i18next | 25.7.3 | vi, ko, en |

### Testing
| 기술 | 버전 | 용도 |
|------|------|------|
| Vitest | 4.0.16 | 단위 테스트 |
| Playwright | 1.57.0 | E2E 테스트 |

---

## Quick Start

```bash
# 1. 의존성 설치
npm install

# 2. 환경 변수 설정
cp .env.example .env
# .env 파일에 Firebase 설정 입력

# 3. 개발 서버 시작
npm run dev

# 4. 브라우저에서 열기
open http://localhost:5173
```

---

## Project Structure

```
q-train/
├── src/
│   ├── pages/              # 18개 페이지
│   │   ├── Login.tsx       # 로그인 (Firebase Email Auth)
│   │   ├── Dashboard.tsx   # 대시보드
│   │   ├── Programs.tsx    # 교육 프로그램
│   │   ├── Progress.tsx    # 진행 현황
│   │   ├── Schedule.tsx    # 교육 일정
│   │   ├── Results.tsx     # 결과 입력
│   │   ├── Employees.tsx   # 직원 관리
│   │   ├── Retraining.tsx  # 재교육 대상
│   │   └── new-tqc/        # 신입 TQC 교육 (6개)
│   │
│   ├── components/         # 38개 컴포넌트
│   │   ├── ui/             # shadcn/ui (22개)
│   │   ├── layout/         # Header, Sidebar, Layout
│   │   ├── auth/           # ProtectedRoute
│   │   ├── charts/         # LazyCharts (Recharts)
│   │   └── new-tqc/        # TQC 특화 컴포넌트 (9개)
│   │
│   ├── stores/             # Zustand 스토어
│   │   ├── authStore.ts    # 인증 상태
│   │   ├── uiStore.ts      # UI 상태 (언어, 사이드바)
│   │   ├── normalizedStore.ts  # 정규화된 데이터
│   │   ├── newTqcStore.ts  # 신입 TQC 데이터
│   │   └── trainingStore.ts    # 레거시 (마이그레이션 중)
│   │
│   ├── services/
│   │   ├── api.ts          # API 서비스 (Mock/GAS)
│   │   └── firebase.ts     # Firebase 초기화 & 인증
│   │
│   ├── types/              # TypeScript 타입
│   │   ├── index.ts        # 핵심 엔티티 타입
│   │   ├── auth.ts         # 인증 & 권한 타입
│   │   ├── branded.ts      # 브랜드 타입 (ID 안전성)
│   │   └── normalized.ts   # 정규화 타입
│   │
│   ├── hooks/              # 커스텀 훅
│   ├── i18n/               # 다국어 (vi, ko, en)
│   ├── lib/                # 유틸리티
│   └── data/               # Mock 데이터
│
├── e2e/                    # Playwright E2E 테스트
├── public/                 # 정적 자산
├── dist/                   # 빌드 결과물
└── 설정 파일들
```

---

## Environment Variables

```bash
# .env 파일 필수 설정

# Firebase Configuration
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=q-train-web.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=q-train-web
VITE_FIREBASE_STORAGE_BUCKET=q-train-web.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id
VITE_FIREBASE_MEASUREMENT_ID=your-measurement-id

# Development (Optional)
VITE_DEV_AUTH_BYPASS=false
```

---

## NPM Scripts

| 명령어 | 설명 |
|--------|------|
| `npm run dev` | 개발 서버 시작 (HMR) |
| `npm run build` | 프로덕션 빌드 |
| `npm run preview` | 빌드 결과 미리보기 |
| `npm run lint` | ESLint 검사 |
| `npm run test` | Vitest 실행 (watch) |
| `npm run test:run` | 테스트 1회 실행 |
| `npm run test:coverage` | 커버리지 리포트 |
| `npm run test:e2e` | Playwright E2E 테스트 |
| `npm run deploy` | Firebase 배포 |

---

## Authentication

### 인증 방식
- **Firebase Email/Password Authentication**
- 등록된 계정으로만 로그인 가능

### 허용 도메인
```typescript
ALLOWED_EMAIL_DOMAINS = [
  'hwaseung.com',
  'hwaseungvina.com',
  'hsvina.com',
  'gmail.com'  // 개발용
]
```

### 관리자 계정
```typescript
ADMIN_EMAILS = [
  'admin@hwaseung.com',
  'qip.admin@hwaseungvina.com',
  'ksmoon@hsvina.com'
]
```

### 역할 (RBAC)
| 역할 | 권한 |
|------|------|
| ADMIN | 모든 기능 + 사용자 관리 |
| TRAINER | 결과 입력, 세션 관리 |
| VIEWER | 읽기 전용 |

---

## Core Features

### 1. 교육 관리
- 교육 프로그램 CRUD
- 세션 일정 관리
- 결과 입력 및 추적

### 2. 직원 관리
- 직원 정보 조회
- 교육 이력 추적
- 재교육 대상자 관리

### 3. 신입 TQC 교육
- 신입 교육생 등록
- 훈련 단계 추적
- 정기 면담 기록 (1주, 1개월, 3개월)
- 퇴사자 분석

### 4. 분석 & 리포트
- 대시보드 통계
- 월별 교육 현황
- 성적 분포 차트
- 진행률 매트릭스

---

## Data Integrity Rules

```
[CRITICAL] 교육 결과 삭제 금지 - NO DELETE Policy
```

1. **Training Results**: 절대 삭제 불가, 수정만 가능
2. **Edit Log**: 모든 수정사항 기록 필수
3. **Program Changes**: 변경 이력 자동 추적
4. **Soft Delete**: 프로그램은 is_active=false로 비활성화

---

## Key Entities

### Employee (직원)
```typescript
{
  employee_id: string       // PK
  employee_name: string
  department: Department    // QIP, PRODUCTION, MTL...
  position: Position        // TQC, RQC, QIP_LINE_LEADER...
  building: Building        // A동 1층, A동 2층, C동
  line: string
  hire_date: string
  status: 'active' | 'inactive'
}
```

### TrainingProgram (교육 프로그램)
```typescript
{
  program_code: string      // PK (예: "1.1", "2.1")
  program_name_vi: string
  program_name_ko: string
  program_name_en: string
  category: ProgramCategory
  passing_score: number     // 기본 80
  validity_months: number   // 유효기간
  is_active: boolean
}
```

### TrainingResult (교육 결과)
```typescript
{
  result_id: string         // PK
  session_id: string
  employee_id: string
  program_code: string
  score: number
  grade: Grade              // AA, A, B, C
  result: TrainingResult    // PASS, FAIL, ABSENT
  needs_retraining: boolean
  edit_log: EditLogEntry[]  // 수정 이력
}
```

---

## Performance Targets

| 지표 | 목표 |
|------|------|
| LCP | < 2.5s |
| FID | < 100ms |
| CLS | < 0.1 |
| Initial Bundle | < 200KB (gzipped) |
| Total Bundle | < 1MB (gzipped) |

---

## Bundle Optimization

Vite 청크 분할 설정:
```typescript
manualChunks: {
  'vendor-react': ['react', 'react-dom', 'react-router-dom']
  'vendor-ui': ['@radix-ui/*']
  'vendor-charts': ['recharts']
  'vendor-i18n': ['i18next', 'react-i18next']
  'vendor-utils': ['date-fns', 'clsx', 'xlsx']
  'vendor-icons': ['lucide-react']
}
```

---

## Deployment

### Firebase Hosting

```bash
# 빌드 & 배포
npm run build && firebase deploy --only hosting

# 또는
npm run deploy
```

### Firebase Console
- URL: https://console.firebase.google.com/project/q-train-web/
- Hosting: https://q-train-web.web.app/

---

## Development Guidelines

### Code Standards
- TypeScript strict mode 필수
- ESLint + Prettier 준수
- 테스트 커버리지 80%+ 목표
- WCAG 2.1 AA 접근성 준수

### Store Usage
- **새 컴포넌트**: `normalizedStore` 사용
- **기존 컴포넌트**: `trainingStore` (마이그레이션 중)

### i18n
- 기본 언어: 베트남어 (vi)
- 모든 UI 텍스트는 번역 키 사용
- 번역 파일: `src/i18n/{vi,ko,en}.json`

---

## Troubleshooting

### 로그인 안됨
1. Firebase Console에서 Email/Password 인증 활성화 확인
2. 사용자가 Firebase Authentication에 등록되어 있는지 확인
3. 이메일 도메인이 허용 목록에 있는지 확인

### 빌드 에러
```bash
# 타입 체크
npm run typecheck

# 린트 확인
npm run lint
```

### 환경 변수 문제
- `.env` 파일이 존재하는지 확인
- 모든 `VITE_FIREBASE_*` 변수가 설정되어 있는지 확인

---

## Contact

- **Firebase Project**: q-train-web
- **Repository**: training-management-system
- **Admin**: ksmoon@hsvina.com
