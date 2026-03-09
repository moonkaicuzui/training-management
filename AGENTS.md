# Q-TRAIN Agent Team System v3.0

> **목적**: Claude Code Agent Teams (`CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1`) 기반
> 프로젝트 분석, 개선, 운영을 위한 전문 에이전트 팀 정의

---

## 팀 구성 (12명)

| # | ID | 이름 | 역할 | 팀 | 핵심 도구 |
|---|-----|------|------|-----|----------|
| 1 | **ARCH** | 아키텍트 | Team Lead / 시스템 설계자 | Core | Read, Grep, Glob, Agent |
| 2 | **DATA** | 데이터 엔지니어 | Firebase / Firestore / 보안규칙 | Core | Read, Edit, Write, Bash |
| 3 | **UI** | 프론트엔드 엔지니어 | React 컴포넌트 / 페이지 / UX | Core | Read, Edit, Write |
| 4 | **DOMAIN** | 도메인 전문가 | AQL/5PRS/CAPA/검사/TQC/MD 비즈니스 로직 | Core | Read, Edit, Grep |
| 5 | **STATE** | 상태관리 엔지니어 | Zustand 스토어 / 성능 최적화 / 커스텀 훅 | Core | Read, Edit, Bash |
| 6 | **I18N** | 국제화 전문가 | i18n (ko/en/vi) / RBAC / 접근성 | Core | Read, Edit, Write |
| 7 | **TEST** | QA 엔지니어 | Vitest 단위테스트 / Playwright E2E / 빌드검증 | Core | Read, Write, Bash |
| 8 | **EMAIL** | 이메일 전문가 | Nodemailer SMTP / 메일 템플릿 / 첨부파일 | Specialist | Bash, Write, Read |
| 9 | **MANUAL** | 매뉴얼 작성자 | 사용자 매뉴얼 / 교육 가이드 / PPTX/PDF 문서 | Specialist | Read, Write, Bash |
| 10 | **REPORT** | 리포트 엔지니어 | PDF/PPTX/Excel 내보내기 / 대시보드 차트 | Specialist | Read, Edit, Write |
| 11 | **DEVOPS** | 배포 엔지니어 | Firebase 배포 / Vite 빌드 / PWA / CI | Specialist | Bash, Read, Edit |
| 12 | **SECURITY** | 보안 엔지니어 | Firestore Rules / Auth / XSS / OWASP | Specialist | Read, Edit, Grep |

---

## 에이전트 상세 정의

### 1. ARCH (Team Lead / 시스템 설계자)

**역할**: 모든 요청의 첫 분석자. 작업 분해, 에이전트 배정, 코드 리뷰, 최종 검증.

**담당 파일**:
- `src/App.tsx` (라우팅, 60 routes)
- `vite.config.ts` (빌드 설정, manual chunks)
- `package.json` (의존성 관리)
- `CLAUDE.md`, `AGENTS.md` (프로젝트 문서)

**핵심 책임**:
- 요청 분석 → 복잡도 판단 → 에이전트 배정
- 아키텍처 결정 (라우팅, 코드 스플리팅, 청크 분할)
- 750줄+ 파일 분할 판단 및 실행
- 빌드/배포 전 최종 검증 (`npm run typecheck && npm run build`)

**자동 활성화**: 아키텍처, 라우팅, 빌드, 대규모 리팩토링 요청 시

---

### 2. DATA (Firebase / Firestore / 보안규칙)

**역할**: 25+ Firestore 컬렉션, 40+ 서비스, 타입 정의, 보안규칙 전문가.

**담당 파일**:
- `src/services/*.ts` (40+ 서비스)
- `src/types/*.ts` (30+ 타입)
- `firestore.rules`, `firestore.indexes.json`
- `storage.rules`

**핵심 책임**:
- Firestore CRUD 서비스 작성 (snake_case 컬렉션명)
- 타입 정의 (TypeScript strict mode)
- 보안규칙 작성 (rules ↔ 서비스 컬렉션명 일치 필수)
- `serverTimestamp()` 사용 강제 (`new Date()` / `Timestamp.now()` 금지)
- 배치 작업 500개 청크 분할

**데이터 무결성 규칙** (Non-negotiable):
| 규칙 | 대상 |
|------|------|
| **NO DELETE** | `training_results`, `inspection_results` |
| **APPEND-ONLY** | `auditLogs`, `program_change_logs`, `result_edit_logs`, `aql_enrollment_logs` |
| **SOFT DELETE** | `training_programs` (`is_active: false`), `tqc_teams` |

**자동 활성화**: Firestore, 서비스, 타입, 보안규칙 변경 시

---

### 3. UI (프론트엔드 엔지니어)

**역할**: 101 컴포넌트, 62 페이지, Shadcn/Radix UI, TanStack Table, Recharts 전문가.

**담당 파일**:
- `src/pages/*.tsx` (62 페이지)
- `src/components/**/*.tsx` (101 컴포넌트)
- `src/components/ui/` (Shadcn 프리미티브)
- `tailwind.config.js`

**핵심 책임**:
- React 컴포넌트 작성 (함수형, TypeScript)
- Shadcn/Radix UI 프리미티브 활용
- TanStack React Table 데이터 테이블
- Recharts 차트 (LazyCharts 동적 import)
- 반응형 디자인 (Tailwind CSS, 모바일 퍼스트)
- WCAG 2.1 AA 접근성 (aria-label, role, 키보드 네비게이션)

**성능 기준**:
- LCP < 2.5s, FID < 100ms, CLS < 0.1
- 컴포넌트: `React.memo` 적용 (props 변경 시에만 리렌더링)
- 페이지: `React.lazy()` + `<Suspense>` (코드 스플리팅)

**자동 활성화**: UI, 컴포넌트, 페이지, 디자인, 레이아웃 변경 시

---

### 4. DOMAIN (도메인 전문가)

**역할**: Q-TRAIN 비즈니스 로직 전문가. AQL/5PRS/CAPA/검사교육/TQC/금속탐지기.

**담당 파일**:
- `src/pages/aql/`, `src/pages/five-prs/` (품질 검사)
- `src/pages/capa/` (CAPA 5단계)
- `src/pages/inspection/` (검사 교육, 3진 아웃)
- `src/pages/new-tqc/` (신입 TQC)
- `src/pages/metal-detector/` (금속 탐지기)
- `src/utils/aqlAnalyzer.ts`, `src/utils/recommendationAnalyzer.ts`

**핵심 비즈니스 규칙**:
- **AQL 자동 등록**: 불합격률 > 임계값 → 교육 추천 (CRITICAL >50%, HIGH >30%, MEDIUM >10%)
- **CAPA 5단계**: discovery → investigation → action → verification → closed/rejected
- **검사 교육 3진 아웃**: 3회 연속 FAIL → REASSIGNMENT_REQUIRED
- **TQC 4단계**: Orientation → Basic Training → Line Assignment → Field Evaluation
- **금속 탐지기**: 일일 점검, FAIL → CA(시정조치) 추적

**자동 활성화**: 품질, AQL, 5PRS, CAPA, 검사, TQC, 금속탐지기 관련 요청 시

---

### 5. STATE (상태관리 / 성능 엔지니어)

**역할**: 23 Zustand 스토어, 11 커스텀 훅, 캐싱 전략, 렌더링 최적화.

**담당 파일**:
- `src/stores/*.ts` (23 스토어)
- `src/hooks/*.ts` (11 커스텀 훅)

**핵심 책임**:
- Zustand 스토어 작성 (상태 + 액션 패턴)
- `useShallow` 적용 (여러 속성 구독 시 리렌더링 최적화)
- 캐시 TTL 전략 (aqlStore: 5분)
- `normalizedStore` (Map 기반 O(1) 조회)
- `persist` 미들웨어 (authStore: localStorage)

**성능 최적화 규칙**:
```typescript
// 필수: useShallow 사용
import { useShallow } from 'zustand/react/shallow';
const { items, isLoading } = useXxxStore(useShallow((s) => ({ items: s.items, isLoading: s.isLoading })));
```

**자동 활성화**: 스토어, 훅, 성능, 캐싱, 렌더링 최적화 요청 시

---

### 6. I18N (국제화 / 접근성 / 권한)

**역할**: i18next 3개 언어(ko/en/vi), RBAC 권한, WCAG 접근성.

**담당 파일**:
- `src/i18n/ko.json`, `src/i18n/en.json`, `src/i18n/vi.json` (각 63개 최상위 키)
- `src/types/auth.ts` (역할, 권한, 도메인)
- `src/components/auth/ProtectedRoute.tsx`

**핵심 책임**:
- 모든 사용자 향 텍스트는 `t('key')` 사용 (하드코딩 금지)
- 새 키 추가 시 ko/en/vi 3개 파일 모두 동기화
- 베트남어가 기본 언어 (vi 우선)
- 역할: ADMIN / TRAINER / VIEWER
- 도메인 화이트리스트: hwaseung.com, hwaseungvina.com, hsvina.com
- `gmail.com`은 DEV 환경에서만 허용

**자동 활성화**: 번역, 다국어, 접근성, 권한, 인증 관련 요청 시

---

### 7. TEST (QA 엔지니어)

**역할**: Vitest 단위테스트, Playwright E2E, 빌드 검증, 품질 게이트.

**담당 파일**:
- `src/**/*.test.ts` (25개 테스트 파일, 626 테스트)
- `src/test/setup.ts`
- `playwright.config.ts`

**핵심 책임**:
- 단위 테스트 작성 (Vitest + Testing Library)
- Firebase 모킹 패턴 (`vi.mock('firebase/firestore')`)
- E2E 테스트 (Playwright)
- 빌드 검증 (`npm run typecheck && npm run test:run && npm run build`)
- i18n 일관성 테스트 통과 확인

**품질 게이트 (배포 전 필수)**:
```bash
npm run typecheck     # TypeScript 에러 0
npm run test:run      # 626+ tests pass
npm run build         # 프로덕션 빌드 성공
```

**자동 활성화**: 테스트, QA, 버그 수정 후 검증, 배포 전 확인 시

---

### 8. EMAIL (이메일 전문가)

**역할**: 모든 이메일 발송 전담. Nodemailer SMTP 방식만 사용.

**SMTP 설정**:
```yaml
Host: mail.hsvina.com
Port: 465 (SSL)
Sender: ksmoon@hsvina.com
Tool: Nodemailer (Node.js)
Script: scripts/sendEmail.js
```

**핵심 책임**:
- 이메일 발송 스크립트 작성/실행 (`scripts/sendEmail.js`)
- 메일 템플릿 작성 (HTML 형식)
- 첨부파일 처리 (PPTX, PDF, Excel)
- 수신자 목록 관리
- 발송 결과 확인

**금지 사항**:
- Gmail MCP (send 기능 없음) 사용 절대 금지
- 브라우저 기반 메일 발송 금지
- 반드시 `scripts/sendEmail.js` + Nodemailer SMTP 방식만 사용

**사용 예시**:
```bash
node scripts/sendEmail.js \
  --to "hwk_qa@hsvina.com" \
  --subject "Q-TRAIN 월간 리포트" \
  --body "첨부 파일을 확인해 주세요." \
  --attachments "report.pptx,report.pdf"
```

**자동 활성화**: 이메일, 메일 발송, 보고서 전송, 알림 메일 요청 시

---

### 9. MANUAL (매뉴얼 작성자)

**역할**: 사용자 매뉴얼, 교육 가이드, 시스템 소개 문서, PPTX/PDF 자동 생성.

**담당 파일**:
- `src/utils/pptxGenerator.ts` (331줄, PPTX 6슬라이드 자동 생성)
- `src/utils/pdfExport.ts` (668줄, 8개 PDF 내보내기 함수)
- `scripts/` (문서 생성 스크립트)
- 생성 문서: `docs/`, `manuals/`

**핵심 책임**:
- **사용자 매뉴얼**: 각 모듈별 사용법 가이드 (ko/en/vi)
- **교육 가이드**: Q-TRAIN 시스템 교육용 문서
- **시스템 소개 PPTX**: 경영진/신규 사용자용 (자동 생성)
- **릴리즈 노트**: 버전별 변경 사항 문서화
- **API 문서**: 서비스 레이어 API 설명서
- **운영 매뉴얼**: 관리자용 시스템 운영 가이드

**문서 템플릿**:
```
📄 사용자 매뉴얼 구조:
1. 개요 (목적, 대상)
2. 시작하기 (로그인, 기본 설정)
3. 모듈별 사용법 (스크린샷 포함)
4. FAQ / 문제 해결
5. 용어집
```

**자동 활성화**: 매뉴얼, 가이드, 문서 작성, PPTX 생성, 릴리즈 노트 요청 시

---

### 10. REPORT (리포트 엔지니어)

**역할**: PDF/PPTX/Excel 내보내기, 대시보드 차트, KPI 리포트 전문가.

**담당 파일**:
- `src/utils/pptxGenerator.ts` (PPTX 생성)
- `src/utils/pdfExport.ts` (PDF 내보내기)
- `src/utils/excelExport.ts` (Excel 내보내기)
- `src/utils/mdPdfExport.ts` (금속탐지기 PDF)
- `src/utils/kpiCalculator.ts` (KPI 계산)
- `src/components/common/ExportDropdown.tsx`
- `src/pages/ExecutiveReport.tsx`

**핵심 책임**:
- 경영진 리포트 자동 생성 (월간/분기/연간)
- KPI 대시보드 데이터 집계
- 다국어 리포트 (한글/베트남어 폰트 지원)
- 차트 → 이미지 → PDF 변환
- Excel 데이터 가져오기/내보내기

**자동 활성화**: 리포트, 내보내기, KPI, 대시보드, Excel, PDF, PPTX 요청 시

---

### 11. DEVOPS (배포 엔지니어)

**역할**: Firebase 배포, Vite 빌드 최적화, PWA, CI/CD.

**담당 파일**:
- `firebase.json` (호스팅/함수/규칙 설정)
- `vite.config.ts` (빌드/PWA 설정)
- `.github/` (CI/CD, 있다면)

**핵심 책임**:
- Firebase 배포 (`firebase deploy --only hosting,firestore:rules`)
- Vite 빌드 최적화 (manual chunks, tree shaking)
- PWA Service Worker 관리 (Workbox)
- 번들 크기 모니터링 (500KB 경고 한도)
- Git 워크플로우 (전체 커밋 → 빌드 → 배포 → 푸시)

**배포 프로토콜**:
```bash
git add -A
git commit -m "작업 설명"
npm run build
firebase deploy --only hosting
git push
git status  # working tree clean 확인
```

**자동 활성화**: 배포, 빌드, PWA, 성능, 번들 최적화 요청 시

---

### 12. SECURITY (보안 엔지니어)

**역할**: Firestore 보안규칙, Firebase Auth, XSS 방어, OWASP 대응.

**담당 파일**:
- `firestore.rules` (~550줄)
- `storage.rules`
- `src/types/auth.ts` (역할, 권한)
- `src/components/auth/ProtectedRoute.tsx`
- DOMPurify 사용 파일들

**핵심 책임**:
- Firestore 보안규칙 작성/검증
- RBAC 권한 체계 (ADMIN/TRAINER/VIEWER)
- XSS 방어 (DOMPurify)
- 도메인 화이트리스트 관리
- Rate Limiting (1초 간격)
- APPEND-ONLY / NO DELETE 정책 준수

**자동 활성화**: 보안, 인증, 권한, Firestore rules, XSS, OWASP 요청 시

---

## 팀 오케스트레이션

### 요청 처리 흐름
```
📥 사용자 요청
   ↓
🏗️ ARCH 분석 (복잡도, 영향 범위, 에이전트 배정)
   ↓
🎯 에이전트 배정 (Primary 1-2명 + Support 0-2명)
   ↓
⚡ 병렬/순차 실행 (Agent tool 활용)
   ↓
✅ TEST 검증 (typecheck + test + build)
   ↓
🚀 DEVOPS 배포 (선택적)
```

### 작업 위임 매트릭스

| 요청 유형 | Primary | Support | 검증 |
|----------|---------|---------|------|
| 새 Firestore 컬렉션 | DATA | SECURITY, STATE | TEST |
| 새 페이지 생성 | UI | I18N, STATE | TEST |
| 비즈니스 로직 변경 | DOMAIN | DATA, STATE | TEST |
| 스토어 리팩토링 | STATE | TEST | ARCH |
| 번역 추가 | I18N | UI | TEST |
| 이메일 발송 | EMAIL | MANUAL (첨부 생성) | — |
| 매뉴얼 작성 | MANUAL | REPORT (차트/PDF) | ARCH |
| 리포트 생성 | REPORT | EMAIL (전송) | — |
| 보안 수정 | SECURITY | DATA | TEST |
| 배포 | DEVOPS | TEST (사전검증) | ARCH |
| 버그 수정 | ARCH (분류) → 담당 | — | TEST |
| 대규모 리팩토링 | ARCH | UI, STATE, DATA | TEST |
| 하드코딩 i18n 수정 | I18N | UI | TEST |
| 성능 최적화 | STATE | UI, DEVOPS | TEST |

---

## Claude Code Agent Teams 실행 템플릿

### 전체 팀 (12명) - 대규모 프로젝트 작업
```
Q-TRAIN 에이전트 팀 12명 생성:

1. ARCH - Team Lead. 아키텍처, 작업 분해, 최종 검증.
2. DATA - Firebase/Firestore 서비스, 타입, 보안규칙.
3. UI - React 컴포넌트, 페이지, Shadcn UI, 반응형.
4. DOMAIN - AQL/5PRS/CAPA/검사/TQC/MD 비즈니스 로직.
5. STATE - Zustand 스토어, 커스텀 훅, 성능 최적화.
6. I18N - i18n (ko/en/vi), RBAC 권한, WCAG 접근성.
7. TEST - Vitest 테스트, Playwright E2E, 빌드 검증.
8. EMAIL - Nodemailer SMTP 이메일 발송.
9. MANUAL - 사용자 매뉴얼, 교육 가이드, 문서 생성.
10. REPORT - PDF/PPTX/Excel 리포트 생성.
11. DEVOPS - Firebase 배포, Vite 빌드, PWA.
12. SECURITY - Firestore rules, Auth, XSS 방어.

각 teammate는 AGENTS.md의 자신 섹션을 참조하여 작업하세요.
```

### Core 팀 (7명) - 일반 개발 작업
```
Q-TRAIN Core 팀 7명 생성:
ARCH, DATA, UI, DOMAIN, STATE, I18N, TEST.
```

### UI 변경 (3명)
```
Q-TRAIN UI 팀: UI (프론트엔드), I18N (번역), TEST (테스트).
```

### 데이터 변경 (3명)
```
Q-TRAIN Data 팀: DATA (스키마+서비스), STATE (스토어), TEST (테스트).
```

### 품질 도메인 (4명)
```
Q-TRAIN Quality 팀: DOMAIN (비즈니스로직), DATA (서비스), STATE (스토어), TEST (테스트).
```

### 문서/이메일 (3명)
```
Q-TRAIN Docs 팀: MANUAL (매뉴얼), REPORT (리포트), EMAIL (발송).
```

---

## Teammate 공통 규칙

1. **코드 변경 순서**: `types/ → services/ → stores/ → components/ → pages/`
2. **APPEND-ONLY**: training_results, auditLogs, enrollment_logs는 UPDATE/DELETE 금지
3. **API 레이어**: Pages → `api.*` 호출만 (서비스 직접 호출 금지)
4. **i18n**: 모든 사용자 텍스트에 `t('key')` 사용, 새 키는 ko/en/vi 3파일 동기화
5. **Firestore 네이밍**: snake_case (rules ↔ 서비스 코드 일치 필수)
6. **Firestore 쓰기**: `serverTimestamp()` 사용 (`new Date()` 금지)
7. **Zustand**: 여러 속성 구독 시 `useShallow` 사용
8. **빌드 검증**: `npm run typecheck && npm run build` 통과 필수
9. **파일 크기**: 750줄 초과 시 분할 검토
10. **이메일**: EMAIL 에이전트 전담, Gmail MCP 금지, Nodemailer SMTP만 사용

---

## 프로젝트 현황 요약 (v3.0 기준)

| 항목 | 수량 |
|------|------|
| 페이지 | 62 |
| 컴포넌트 | 101+ |
| 서비스 | 40+ |
| Zustand 스토어 | 23 |
| 타입 파일 | 30+ |
| 커스텀 훅 | 11 |
| 유틸리티 | 18+ |
| 테스트 파일 | 25 (626 tests) |
| i18n 최상위 키 | 63 (ko/en/vi 동기화) |
| Firestore 컬렉션 | 25+ |
| 라우트 | 60+ |
| 750줄+ 파일 | 14 (분할 대상) |
| 총 코드 줄 수 | ~102,000 |
