# Q-TRAIN Training Management System — Complete Project Reference

> **목적**: 이 문서는 Claude Opus 4.6 에이전트 팀 구성을 위한 프로젝트 완전 분석서입니다.
> 프로젝트의 모든 모듈, 아키텍처, 비즈니스 로직, 데이터 흐름, 기술 스택을 상세히 기술합니다.

---

## 1. 프로젝트 개요

| 항목 | 값 |
|------|-----|
| **프로젝트명** | Q-TRAIN (Quality Training Management) |
| **조직** | HWK Vietnam (화승비나) QIP 부서 |
| **목적** | 제조 현장 직원 교육, 자격 인증, 품질 검사 통합 관리 |
| **Firebase Hosting** | https://q-train-web.web.app/ |
| **Firebase Project ID** | `q-train-web` |
| **Firebase Console** | https://console.firebase.google.com/project/q-train-web/ |
| **Working Directory** | `/Users/ksmoon/Coding/training managment system/q-train` |
| **규모** | 60 pages, 101 components, 40+ services, 23 stores, 30+ types, 11 hooks |

### 핵심 비즈니스 도메인
1. **교육 프로그램 관리**: 67개 교육 프로그램 (6개 카테고리), 직원별 이수 추적
2. **품질 검사 연동**: AQL/5PRS 검사 데이터 → 교육 자동 등록
3. **신입 TQC 교육**: 1개월 과정, 색맹 검사, 단계별 추적, 퇴사율 분석
4. **CAPA 워크플로우**: 5단계 시정/예방조치 (발견→조사→조치→검증→종결)
5. **검사 교육**: 쌍 판정 매칭 (20쌍), 3진 아웃 규칙
6. **금속 탐지기 검사**: 일일 점검, ISO 주차 추적, 실패 시정조치
7. **프로젝트 관리**: 과제 추적, 실시간 메시지, 자동화 규칙

---

## 2. 기술 스택 (정확한 버전)

| 항목 | 기술 | 버전 | 용도 |
|------|------|------|------|
| Framework | React | 19.2.0 | UI 렌더링 |
| Language | TypeScript | ~5.9.3 | 타입 안전성 |
| Build | Vite | 7.2.4 | 번들링 + HMR |
| Styling | Tailwind CSS | 3.4.19 | 유틸리티 CSS |
| UI Components | Radix UI v1 + shadcn/ui | — | 프리미티브 컴포넌트 |
| Icons | Lucide React | 0.562.0 | 아이콘 시스템 |
| Routing | React Router DOM | 7.11.0 | SPA 라우팅 |
| State | Zustand | 5.0.9 | 전역 상태 관리 |
| Tables | TanStack React Table | 8.21.3 | 데이터 테이블 |
| Virtualization | TanStack React Virtual | 3.13.13 | 가상 스크롤 |
| Forms | React Hook Form | 7.71.1 | 폼 관리 |
| Validation | Zod | 4.3.6 | 스키마 검증 |
| Charts | Recharts | 3.6.0 | 데이터 시각화 |
| Calendar | React Big Calendar | 1.19.4 | 교육 일정 캘린더 |
| Date Picker | React Day Picker | 9.13.0 | 날짜 선택 |
| i18n | i18next + react-i18next | 25.7.3 / 16.5.0 | 다국어 (ko/en/vi) |
| Database | Firebase Firestore | 12.7.0 | NoSQL 데이터베이스 |
| Auth | Firebase Auth | 12.7.0 | Google OAuth + Email |
| Storage | Firebase Storage | 12.7.0 | 파일 업로드 |
| Date Utils | date-fns | 4.1.0 | 날짜 처리 |
| PDF | jsPDF + jspdf-autotable | 4.1.0 / 5.0.2 | PDF 생성 |
| PPT | pptxgenjs | 4.0.1 | PPT 생성 |
| Excel | XLSX (SheetJS) | 0.18.5 | Excel 가져오기/내보내기 |
| Image | browser-image-compression | 2.0.2 | 이미지 압축 |
| Sanitize | DOMPurify | 3.3.1 | XSS 방어 |
| Command | cmdk | 1.1.1 | 명령 팔레트 |
| PWA | vite-plugin-pwa | 1.2.0 | 오프라인 지원 |
| Unit Test | Vitest | 4.0.16 | 단위 테스트 |
| Component Test | Testing Library (React) | 16.3.1 | 컴포넌트 테스트 |
| E2E Test | Playwright | 1.57.0 | E2E 테스트 |
| Lint | ESLint | 9.39.1 | 코드 품질 |
| Deploy | Firebase Hosting | — | 호스팅 |

### 빌드 설정 핵심
```
- Path alias: @ → ./src
- Base URL: / (Firebase Hosting)
- Manual chunks: vendor-react, vendor-ui, vendor-firebase, vendor-i18n, vendor-utils, vendor-icons, vendor-state
- Recharts: LazyCharts 동적 import (초기 번들 제외)
- PWA: Service Worker with Workbox (NetworkFirst for API, CacheFirst for static)
- Firestore: Persistent local cache (multi-tab sync)
```

---

## 3. 디렉토리 구조 (완전판)

```
q-train/
├── CLAUDE.md                      # 이 파일
├── AGENTS.md                      # 에이전트 팀 정의 (25명)
├── INIT.md                        # 프로젝트 초기화 가이드
├── package.json                   # 의존성 및 스크립트
├── vite.config.ts                 # Vite + PWA + Vitest 설정
├── tsconfig.json / .app.json / .node.json
├── tailwind.config.js             # Tailwind 설정
├── firebase.json                  # Firebase 프로젝트 설정
├── firestore.rules                # Firestore 보안 규칙
├── firestore.indexes.json         # Firestore 복합 인덱스
├── storage.rules                  # Storage 보안 규칙
├── cors.json                      # CORS 설정
│
├── public/                        # 정적 자산
│   ├── logo.svg, favicon.ico
│   ├── pwa-*.png, apple-touch-icon.png
│   └── 5prs-original/            # 원본 5PRS 대시보드
│
└── src/
    ├── main.tsx                   # 앱 진입점
    ├── App.tsx                    # 라우터 + 레이아웃 + 인증 가드
    │
    ├── pages/ (60 페이지)
    │   ├── Login.tsx              # 로그인 (Email + Google OAuth)
    │   ├── Dashboard.tsx          # 메인 대시보드 (KPI 카드, 차트)
    │   ├── Programs.tsx           # 교육 프로그램 CRUD (6개 카테고리)
    │   ├── Progress.tsx           # 직원×프로그램 진행 매트릭스
    │   ├── Schedule.tsx           # 교육 일정 캘린더 (React Big Calendar)
    │   ├── Results.tsx            # 교육 결과 입력 (권한: canEditResults)
    │   ├── Employees.tsx          # 직원 목록 + CSV 임포트
    │   ├── EmployeeDetail.tsx     # 직원 상세 프로필 + 교육 이력
    │   ├── Retraining.tsx         # 재교육 대상자 (만료/불합격)
    │   ├── Attendance.tsx         # 출석 관리
    │   ├── Reports.tsx            # 리포트 빌더
    │   ├── Certificates.tsx       # 자격증 발급
    │   ├── Trainers.tsx           # 강사 관리 + 분석
    │   ├── TrainingPlan.tsx       # 교육 계획
    │   ├── AuditLog.tsx           # 감사 추적 (APPEND-ONLY)
    │   ├── Notifications.tsx      # 알림 센터
    │   ├── Evaluation.tsx         # 교육 효과 평가
    │   ├── Materials.tsx          # 교육 자료 관리 (Storage)
    │   ├── ExecutiveDashboard.tsx  # 경영진 대시보드
    │   ├── AuditCompliance.tsx    # 감사 준수 현황
    │   ├── DataSync.tsx           # 데이터 동기화 관리
    │   ├── DepartmentDashboard.tsx # 부서별 대시보드
    │   ├── Competency.tsx         # 역량 매트릭스
    │   ├── SkillGap.tsx           # 스킬 갭 분석
    │   ├── QualityBlog.tsx        # 품질 지식 베이스
    │   ├── ExecutiveReport.tsx    # 경영 리포트 (PDF/PPT 생성)
    │   ├── ProgramIntro.tsx       # 프로그램 소개 페이지
    │   │
    │   ├── new-tqc/ (8 페이지)    # 신입 TQC 교육 모듈
    │   │   ├── NewTQCDashboard.tsx     # TQC 대시보드 (통계 카드, 차트)
    │   │   ├── NewTQCTrainees.tsx      # 교육생 목록 + 필터
    │   │   ├── NewTQCTraineeDetail.tsx # 교육생 상세 (단계별 타임라인)
    │   │   ├── NewTQCMeetings.tsx      # 미팅 추적 (1주/1개월/3개월)
    │   │   ├── NewTQCResignations.tsx  # 퇴사 기록 + 분석 차트
    │   │   ├── NewTQCFinalResult.tsx   # 최종 평가 결과
    │   │   ├── NewTQCCertificates.tsx  # 수료증 발급
    │   │   └── NewTQCSettings.tsx      # TQC 팀/설정 관리
    │   │
    │   ├── aql/ (2 페이지)        # AQL 품질 분석 모듈
    │   │   ├── AqlDashboard.tsx        # AQL 검사 대시보드 (KPI, 검사관 테이블)
    │   │   └── AqlTrainingRecommendations.tsx  # 교육 추천 + 자동 등록
    │   │
    │   ├── five-prs/ (4 페이지)   # 5PRS 검사 분석 모듈
    │   │   ├── FivePrsDashboard.tsx         # 5PRS 대시보드 (히트맵, 트렌드)
    │   │   ├── FivePrsOriginalDashboard.tsx # 원본 대시보드
    │   │   ├── TrainingRecommendations.tsx  # 교육 추천 + 자동 등록
    │   │   └── FivePrsAiInstructions.tsx    # AI 브리핑 페이지
    │   │
    │   ├── inspection/ (4 페이지) # 검사 교육 모듈
    │   │   ├── InspectionDashboard.tsx     # 검사 교육 대시보드
    │   │   ├── InspectionResultForm.tsx    # 20쌍 판정 입력 폼
    │   │   ├── InspectionEnrollments.tsx   # 교육 등록 관리
    │   │   └── InspectionHistory.tsx       # 검사 결과 이력
    │   │
    │   ├── capa/ (3 페이지)       # CAPA 시정조치 모듈
    │   │   ├── CAPADashboard.tsx    # CAPA 대시보드 (상태별 통계)
    │   │   ├── CAPAForm.tsx         # CAPA 생성/편집 (5단계 폼)
    │   │   └── CAPADetail.tsx       # CAPA 상세 뷰
    │   │
    │   ├── metal-detector/ (4 페이지) # 금속 탐지기 검사 모듈
    │   │   ├── MDDashboard.tsx      # MD 대시보드 (공장별 KPI)
    │   │   ├── MDInputForm.tsx      # 일일 검사 입력
    │   │   ├── MDHistory.tsx        # 검사 이력
    │   │   └── MDReport.tsx         # MD 리포트 (PDF 내보내기)
    │   │
    │   ├── projects/ (5 페이지)   # 프로젝트 관리 모듈
    │   │   ├── ProjectsDashboard.tsx  # 프로젝트 대시보드
    │   │   ├── ProjectsMembers.tsx    # 멤버 관리
    │   │   ├── ProjectsTasks.tsx      # 과제 관리 (의존성, 상태)
    │   │   ├── ProjectsCalendar.tsx   # 프로젝트 캘린더
    │   │   └── ProjectsSettings.tsx   # 프로젝트 설정
    │   │
    │   └── tech/ (2 페이지)       # 기술 모델 (관리자 전용)
    │       ├── TechModelList.tsx     # 기술 모델 목록
    │       └── TechReviewGuidelines.tsx # 리뷰 가이드라인
    │
    ├── components/ (101 컴포넌트)
    │   ├── ui/ (24)               # Shadcn/Radix UI 프리미티브
    │   │   ├── alert, avatar, badge, button, card, checkbox
    │   │   ├── collapsible, dialog, dropdown-menu, input, label
    │   │   ├── popover, progress, scroll-area, select, separator
    │   │   ├── skeleton, switch, table, tabs, textarea, tooltip
    │   │   └── badge.variants.ts, button.variants.ts  # CVA 변형
    │   │
    │   ├── common/ (21)           # 공유 컴포넌트
    │   │   ├── DataTable.tsx          # TanStack 기반 범용 테이블
    │   │   ├── DataTableColumnHeader.tsx  # 정렬 가능 컬럼 헤더
    │   │   ├── DataTablePagination.tsx    # 페이지네이션
    │   │   ├── DataTableToolbar.tsx       # 필터/검색 툴바
    │   │   ├── VirtualTable.tsx        # 가상화 테이블 (대량 데이터)
    │   │   ├── DateRangePicker.tsx     # 날짜 범위 선택기
    │   │   ├── CommandPalette.tsx      # 명령 팔레트 (cmdk)
    │   │   ├── GlobalSearch.tsx        # 전역 검색
    │   │   ├── ExportDropdown.tsx      # 내보내기 (Excel/PDF/PPT)
    │   │   ├── FormField.tsx           # 범용 폼 필드
    │   │   ├── ErrorBoundary.tsx       # 에러 바운더리
    │   │   ├── ErrorState.tsx          # 에러 상태 UI
    │   │   ├── EmptyState.tsx          # 빈 상태 UI
    │   │   ├── LoadingSpinner.tsx      # 로딩 스피너
    │   │   ├── Skeletons.tsx           # 스켈레톤 로더
    │   │   ├── Breadcrumbs.tsx         # 브레드크럼
    │   │   ├── ImageGallery.tsx        # 이미지 갤러리
    │   │   ├── MultiImageUpload.tsx    # 다중 이미지 업로드
    │   │   ├── NotificationCenter.tsx  # 알림 센터 패널
    │   │   ├── KeyboardShortcutsDialog.tsx  # 키보드 단축키 안내
    │   │   └── Toaster.tsx            # 토스트 알림
    │   │
    │   ├── layout/ (5)            # 레이아웃 컴포넌트
    │   │   ├── Layout.tsx          # 메인 레이아웃 (사이드바 + 헤더)
    │   │   ├── Header.tsx          # 상단 헤더 (검색, 언어, 알림)
    │   │   ├── Sidebar.tsx         # 사이드바 네비게이션
    │   │   ├── BottomNav.tsx       # 모바일 하단 네비게이션
    │   │   └── NotificationBell.tsx # 알림 벨 아이콘
    │   │
    │   ├── auth/ (3)              # 인증 컴포넌트
    │   │   ├── GoogleAuthProvider.tsx  # Google OAuth 래퍼
    │   │   └── ProtectedRoute.tsx     # 라우트 보호 (역할/권한)
    │   │
    │   ├── dashboard/ (4)         # 대시보드 컴포넌트
    │   │   ├── KPICard.tsx         # KPI 카드 (변화율, 아이콘)
    │   │   ├── KPIAnomalyBadge.tsx # KPI 이상치 감지 배지
    │   │   ├── CostInputForm.tsx   # 비용 입력 폼
    │   │   └── ROIDashboard.tsx    # 교육 ROI 대시보드
    │   │
    │   ├── aql/ (10)              # AQL 컴포넌트
    │   │   ├── AqlInspectorTable.tsx   # 검사관 성적 테이블
    │   │   ├── AqlKPICards.tsx         # AQL KPI 카드
    │   │   ├── AqlMonthSelector.tsx    # 월 선택기
    │   │   └── recommendations/ (7)   # AQL 교육 추천
    │   │       ├── AqlRecommendationTable.tsx     # 추천 목록 테이블
    │   │       ├── AqlRecommendationFilters.tsx   # 필터 UI
    │   │       ├── AqlRecommendationSummaryCards.tsx  # 요약 카드
    │   │       ├── AqlEnrollmentDialog.tsx        # 등록 다이얼로그
    │   │       ├── AqlBatchActionBar.tsx           # 일괄 작업 바
    │   │       ├── AqlEmployeeLinker.tsx           # 직원 매핑
    │   │       └── SupervisorImporter.tsx          # 감독자 가져오기
    │   │
    │   ├── five-prs/ (13)         # 5PRS 컴포넌트
    │   │   ├── BuildingHeatmap.tsx     # 건물별 히트맵
    │   │   ├── DailyTrendChart.tsx     # 일별 추세 차트
    │   │   ├── DefectDistributionChart.tsx  # 불량 분포 차트
    │   │   ├── InspectionKPICards.tsx  # 검사 KPI 카드
    │   │   ├── MonthSelector.tsx       # 월 선택기
    │   │   ├── TqcAnalysisTable.tsx    # TQC 분석 테이블
    │   │   └── recommendations/ (7)   # 5PRS 교육 추천
    │   │       ├── RecommendationTable.tsx
    │   │       ├── RecommendationFilters.tsx
    │   │       ├── RecommendationSummaryCards.tsx
    │   │       ├── EnrollmentDialog.tsx
    │   │       ├── BatchActionBar.tsx
    │   │       ├── MappingManager.tsx
    │   │       └── TqcEmployeeLinker.tsx
    │   │
    │   ├── new-tqc/ (13)          # 신입 TQC 컴포넌트
    │   │   ├── NewTQCStatsCards.tsx       # 통계 카드
    │   │   ├── NewTQCFilters.tsx          # 필터 UI
    │   │   ├── TraineeFormDialog.tsx      # 교육생 등록 폼
    │   │   ├── TraineeStatusBadge.tsx     # 상태 배지
    │   │   ├── TrainingStageTimeline.tsx  # 교육 단계 타임라인
    │   │   ├── MeetingScheduleCard.tsx    # 미팅 일정 카드
    │   │   ├── ColorBlindTestSection.tsx  # 색맹 검사 섹션
    │   │   ├── AttritionRiskBadge.tsx     # 이탈 위험 배지
    │   │   ├── AttritionRiskPopover.tsx   # 이탈 위험 상세
    │   │   ├── ResignationFormDialog.tsx  # 퇴사 등록 폼
    │   │   ├── ResignationChart.tsx       # 퇴사 분석 차트
    │   │   └── TeamSettingsDialog.tsx     # 팀 설정 다이얼로그
    │   │
    │   ├── inspection/ (2)        # 검사 교육 컴포넌트
    │   │   ├── InspectionPairGrid.tsx     # 20쌍 판정 그리드
    │   │   └── InspectionStrikeIndicator.tsx  # 3진 아웃 표시기
    │   │
    │   ├── capa/ (1)              # CAPA 컴포넌트
    │   │   └── CAPAAISuggestions.tsx  # AI 기반 제안
    │   │
    │   ├── training/ (3)          # 교육 컴포넌트
    │   │   ├── BatchCertificateDialog.tsx      # 일괄 수료증 발급
    │   │   ├── CertificateTemplateManager.tsx  # 수료증 템플릿 관리
    │   │   └── TrainerAnalytics.tsx            # 강사 분석 대시보드
    │   │
    │   ├── employee/ (1)          # 직원 컴포넌트
    │   │   └── EmployeeSyncStatus.tsx  # HR 동기화 상태
    │   │
    │   ├── competency/ (2)        # 역량 컴포넌트
    │   │   ├── CompetencyRadar.tsx  # 역량 레이더 차트
    │   │   └── SkillMatrix.tsx     # 스킬 매트릭스
    │   │
    │   ├── charts/ (1)            # 차트 공통
    │   │   └── LazyCharts.tsx     # Recharts 동적 import 래퍼
    │   │
    │   └── projects/ (3)          # 프로젝트 컴포넌트
    │       └── automation/
    │           ├── AutomationList.tsx    # 자동화 규칙 목록
    │           ├── AutomationDialog.tsx  # 자동화 설정 다이얼로그
    │           └── constants.ts         # 자동화 상수
    │
    ├── services/ (40+ 서비스)
    │   ├── firebase.ts            # Firebase 초기화 + 인증 + 트랜잭션
    │   ├── api.ts                 # 메인 API 오케스트레이션 (모든 서비스 래핑)
    │   ├── employeeService.ts     # 직원 CRUD + HR CSV 동기화
    │   ├── programService.ts      # 교육 프로그램 CRUD (소프트 삭제)
    │   ├── resultService.ts       # 교육 결과 (APPEND-ONLY, NO DELETE)
    │   ├── sessionService.ts      # 교육 세션 관리
    │   ├── logService.ts          # 변경/편집 로그
    │   ├── tqcService.ts          # 신입 TQC (6개 컬렉션)
    │   ├── aqlService.ts          # AQL 검사 + 교육 자동 등록
    │   ├── fivePrsService.ts      # 5PRS 검사 + AI 브리핑
    │   ├── inspectionService.ts   # 검사 교육 + 쌍 판정 + 3진 아웃
    │   ├── capaService.ts         # CAPA 5단계 워크플로우
    │   ├── mdInspectionService.ts # 금속 탐지기 일일 검사
    │   ├── projectService.ts      # 프로젝트 관리 (9개 컬렉션)
    │   ├── attendanceService.ts   # 출석 관리
    │   ├── trainerService.ts      # 강사 관리
    │   ├── trainingPlanService.ts # 교육 계획
    │   ├── materialService.ts     # 교육 자료 (Storage)
    │   ├── evaluationService.ts   # 교육 평가
    │   ├── certificateService.ts  # 수료증 발급
    │   ├── competencyService.ts   # 역량 관리
    │   ├── notificationService.ts # 알림 시스템
    │   ├── auditLogService.ts     # 감사 로그 (APPEND-ONLY)
    │   ├── auditComplianceService.ts  # 감사 준수
    │   ├── analyticsService.ts    # 분석 서비스
    │   ├── reportBuilderService.ts # 리포트 빌더
    │   ├── roiService.ts          # ROI 계산
    │   ├── executiveReportService.ts # 경영 리포트
    │   ├── kpiSnapshotService.ts  # KPI 스냅샷
    │   ├── syncService.ts         # 데이터 동기화
    │   ├── integrationService.ts  # 외부 연동
    │   ├── batchService.ts        # 배치 작업
    │   ├── storageService.ts      # Firebase Storage
    │   ├── searchService.ts       # 검색 서비스
    │   ├── recommendationService.ts # 추천 서비스
    │   ├── qualityBlogService.ts  # 품질 블로그
    │   ├── capaKbService.ts       # CAPA 지식 베이스
    │   ├── techModelService.ts    # 기술 모델
    │   ├── webhookService.ts      # 웹훅
    │   └── workflowService.ts     # 워크플로우
    │
    ├── stores/ (23 Zustand 스토어)
    │   ├── authStore.ts           # 인증 + 역할 + 권한
    │   ├── uiStore.ts             # UI 상태 (사이드바, 테마, 언어)
    │   ├── trainingStore.ts       # 교육 데이터 캐시
    │   ├── normalizedStore.ts     # 정규화 데이터 (Maps)
    │   ├── newTqcStore.ts         # 신입 TQC 상태
    │   ├── aqlStore.ts            # AQL 상태 + 5분 캐시 TTL
    │   ├── fivePrsStore.ts        # 5PRS 상태
    │   ├── inspectionStore.ts     # 검사 교육 상태
    │   ├── capaStore.ts           # CAPA 상태
    │   ├── mdInspectionStore.ts   # 금속 탐지기 상태
    │   ├── projectStore.ts        # 프로젝트 상태
    │   ├── notificationStore.ts   # 알림 상태
    │   ├── qualityBlogStore.ts    # 품질 블로그 상태
    │   ├── recommendationStore.ts # 추천 상태
    │   └── techModelStore.ts      # 기술 모델 상태
    │
    ├── types/ (30+ 타입 파일)
    │   ├── index.ts               # 핵심 타입: Employee, TrainingProgram, TrainingResult, etc.
    │   ├── schemas.ts             # Zod 스키마
    │   ├── auth.ts                # 역할(ADMIN/TRAINER/VIEWER), 권한, 도메인 화이트리스트
    │   ├── aql.ts                 # AQL 검사 + 교육 추천 타입
    │   ├── newTqc.ts              # 신입 TQC 5개 엔티티 타입
    │   ├── capa.ts                # CAPA 5단계 워크플로우 타입
    │   ├── inspection.ts          # 검사 교육 + 쌍 판정 타입
    │   ├── fivePrs.ts             # 5PRS 검사 타입
    │   ├── metalDetector.ts       # 금속 탐지기 타입
    │   ├── project.ts             # 프로젝트 관리 타입
    │   ├── attendance.ts          # 출석 타입
    │   ├── auditLog.ts            # 감사 로그 타입
    │   ├── certificate.ts         # 수료증 타입
    │   ├── curriculum.ts          # 커리큘럼 타입
    │   ├── evaluation.ts          # 평가 타입
    │   ├── executive.ts           # 경영 리포트 타입
    │   ├── material.ts            # 교육 자료 타입
    │   ├── notification.ts        # 알림 타입
    │   ├── qualityBlog.ts         # 품질 블로그 타입
    │   ├── recommendation.ts      # 추천 타입
    │   ├── techModel.ts           # 기술 모델 타입
    │   ├── trainer.ts             # 강사 타입
    │   ├── trainingPlan.ts        # 교육 계획 타입
    │   ├── branded.ts             # Branded 타입 (타입 안전 ID)
    │   ├── datetime.ts            # 날짜/시간 유틸 타입
    │   └── normalized.ts          # 정규화 데이터 타입
    │
    ├── hooks/ (11 커스텀 훅)
    │   ├── use-toast.ts           # 토스트 알림
    │   ├── useExport.ts           # 데이터 내보내기
    │   ├── useFileUpload.ts       # 파일 업로드
    │   ├── useGlobalErrorHandler.ts  # 전역 에러 처리
    │   ├── useInfiniteScroll.ts   # 무한 스크롤
    │   ├── useKPIAnomalies.ts     # KPI 이상치 감지
    │   ├── useKeyboardShortcuts.ts # 키보드 단축키
    │   ├── usePagination.ts       # 페이지네이션
    │   ├── useSearch.ts           # 검색
    │   ├── useUrlFilters.ts       # URL 필터 동기화
    │   └── useWorkflow.ts         # 워크플로우 상태
    │
    ├── utils/ (18+ 유틸)
    │   ├── aqlAnalyzer.ts         # AQL 데이터 분석
    │   ├── aqlDataProcessor.ts    # AQL 데이터 가공
    │   ├── fivePrsDataProcessor.ts # 5PRS 데이터 가공
    │   ├── recommendationAnalyzer.ts  # 교육 추천 분석
    │   ├── attritionRiskCalculator.ts # 이탈 위험 계산
    │   ├── kpiCalculator.ts       # KPI 계산기
    │   ├── kpiAnomalyDetector.ts  # KPI 이상치 탐지
    │   ├── excelExport.ts         # Excel 내보내기
    │   ├── pdfExport.ts           # PDF 내보내기
    │   ├── mdPdfExport.ts         # 금속 탐지기 PDF
    │   ├── pptxGenerator.ts       # PPT 생성
    │   ├── hrCsvParser.ts         # HR CSV 파싱
    │   ├── manpowerCsvParser.ts   # Manpower CSV 파싱
    │   ├── imageCompression.ts    # 이미지 압축
    │   ├── firestorePagination.ts # Firestore 페이지네이션
    │   ├── routeLabels.ts         # 라우트 레이블
    │   ├── logger.ts              # 로거
    │   ├── sentry.ts              # Sentry 에러 추적
    │   └── webVitals.ts           # Web Vitals 측정
    │
    ├── data/ (상수 + 카탈로그)
    │   ├── constants.ts           # 부서, 직급, 건물, 등급, 작업 영역 열거값
    │   ├── programCatalog.ts      # 67개 교육 프로그램 정의 (2026 커리큘럼)
    │   └── hrPositionMapping.ts   # HR 직급 매핑
    │
    ├── i18n/
    │   ├── index.ts               # i18next 초기화
    │   ├── ko.json                # 한국어 번역
    │   ├── en.json                # 영어 번역
    │   └── vi.json                # 베트남어 번역
    │
    └── lib/
        └── utils.ts               # cn() (clsx + tailwind-merge)
```

---

## 4. 아키텍처 패턴

### 4.1 데이터 흐름
```
Pages (UI)
  ↓ calls
api.ts (Orchestration Layer - 모든 서비스의 단일 진입점)
  ↓ delegates to
*Service.ts (각 도메인별 Firestore CRUD)
  ↓ reads/writes
Firebase Firestore (20+ Collections)
  ↕ 실시간 구독
Zustand Stores (23개 스토어 - 캐시 + UI 상태)
  ↓ provides
Pages (UI 렌더링)
```

**핵심 규칙**: Pages → `api.*` 함수 호출 (서비스 직접 호출 금지)

### 4.2 인증 & 권한 시스템
```
Firebase Auth (Email/Password + Google OAuth)
  ↓
authStore.ts (Zustand persist → localStorage)
  ↓
ProtectedRoute.tsx (라우트 가드)
  ↓
Firestore Rules (서버 측 보안)
```

**역할 체계**:
| 역할 | canViewDashboard | canEditPrograms | canEditResults | canEditEmployees | canManageUsers |
|------|:---:|:---:|:---:|:---:|:---:|
| ADMIN | O | O | O | O | O |
| TRAINER | O | X | O | X | X |
| VIEWER | O | X | X | X | X |

**도메인 화이트리스트**: `hwaseung.com`, `hwaseungvina.com`, `hsvina.com` (+ `gmail.com` for dev)

**자동 ADMIN 이메일**: `ksmoon@hsvina.com`, `admin@hwaseung.com`, `qip.admin@hwaseungvina.com`

### 4.3 서비스 레이어 패턴
```typescript
// 서비스 패턴 (각 서비스 공통)
export const xxxService = {
  getAll(filters?): Promise<T[]>     // 서버 필터 + 클라이언트 필터
  getById(id): Promise<T>            // 단건 조회
  create(data): Promise<string>      // 생성 + serverTimestamp
  update(id, data): Promise<void>    // 수정 + serverTimestamp
  delete?(id): Promise<void>         // 일부만 (소프트 삭제 또는 금지)
  subscribe?(callback): Unsubscribe  // 실시간 구독
  batchXxx?(items): Promise<void>    // 배치 작업 (500개 청크)
}
```

### 4.4 상태 관리 패턴 (Zustand)
```typescript
// 공통 스토어 패턴
interface XxxStore {
  // Data
  items: T[]
  currentItem: T | null
  isLoading: boolean
  error: string | null

  // Filters
  filters: FilterType

  // Actions
  fetchItems(filters?): Promise<void>
  createItem(data): Promise<void>
  updateItem(id, data): Promise<void>

  // Cache (일부 스토어)
  _cache: { fetchedAt: number, ttl: number }
}
```

**특수 패턴**:
- `authStore`: `persist` 미들웨어 (localStorage)
- `aqlStore`: 5분 캐시 TTL (Cloud Functions 호출 최소화)
- `normalizedStore`: Map 기반 정규화 (O(1) 조회)

---

## 5. Firestore 컬렉션 상세 (25+ 컬렉션)

### 5.1 핵심 교육 데이터

| 컬렉션 | Doc ID | 주요 필드 | 규칙 |
|--------|--------|----------|------|
| `employees` | employee_id (HR 제공) | name, department, position, building, line, hire_date, status, _sync_source | CRUD, Admin만 삭제 |
| `training_programs` | program_code (QIP-001) | names(en/vn/kr), category, evaluation_type, passing_score, grade_thresholds, validity_months, is_active | 소프트 삭제만 |
| `training_sessions` | auto-ID | session_id, program_code, trainer_name, date, attendees[], status | CRUD |
| `training_results` | auto-ID | result_id(RES-ts-rand), employee_id, program_code, score, grade, result, test_attempt | **NO DELETE** |
| `program_change_logs` | auto-ID | 프로그램 변경 이력 | **APPEND-ONLY** |
| `result_edit_logs` | auto-ID | 결과 수정 이력 | **APPEND-ONLY** |

### 5.2 신입 TQC (6 컬렉션)

| 컬렉션 | 주요 필드 | 규칙 |
|--------|----------|------|
| `tqc_teams` | team_name, factory, line, is_active | 소프트 삭제 |
| `tqc_trainees` | trainee_id, team_id, status(IN_TRAINING/PASSED/FAILED/RESIGNED), color_blind_status, progress | CRUD |
| `tqc_training_stages` | trainee_id, stage_order, status(PENDING/IN_PROGRESS/COMPLETED) | CRUD |
| `tqc_color_blind_tests` | trainee_id, result(PASS/FAIL/PENDING) | CRUD |
| `tqc_meetings` | type(1WEEK/1MONTH/3MONTH), status(SCHEDULED/COMPLETED/MISSED), attendees[] | CRUD |
| `tqc_resignations` | resign_date, reason, training_duration_days | **APPEND-ONLY** |

### 5.3 품질 검사 연동

| 컬렉션 | 주요 필드 | 규칙 |
|--------|----------|------|
| `aql_data/{year_month}` | 월별 AQL 검사 원시 데이터 (GAS API) | READ-ONLY |
| `aql_employee_links` | aql_employee_no ↔ employee_id 매핑 | CRUD |
| `aql_supervisor_links` | 감독자 조직 구조 | CRUD |
| `aql_enrollment_logs` | employee_id, program_code, fail_rate, defect_types[], reason | **APPEND-ONLY** |
| `five_prs_data/{year_month}` | 월별 5PRS 검사 데이터 (GAS API) | READ-ONLY |
| `five_prs_enrollment_logs` | 5PRS 교육 추천 기록 | **APPEND-ONLY** |

### 5.4 검사 교육

| 컬렉션 | 주요 필드 | 규칙 |
|--------|----------|------|
| `inspection_enrollments` | source(5PRS/AQL/MANUAL), status(PENDING/SCHEDULED/COMPLETED) | **NO DELETE** |
| `inspection_results` | pairs[20개], matched_count, match_rate, grade, result | **NO DELETE** |
| `defect_training_mappings` | 불량 유형 → 교육 프로그램 매핑 | CRUD |

### 5.5 CAPA & 기타

| 컬렉션 | 주요 필드 | 규칙 |
|--------|----------|------|
| `capas` | capa_number(CAPA-YYYY-NNN), type, severity, priority, status(5단계), stages{} | CRUD, Admin 삭제 |
| `capa_root_cause_kb` | CAPA 근본원인 지식 베이스 | CRUD |
| `md_inspections` | factory, line, result(PASS/FAIL), sensitivity(Fe/SUS/NonFe), iso_week | CRUD |
| `md_failures` | caStatus(pending/in_progress/completed), caDescription | CRUD |
| `projects` | members[], tasks[] | CRUD |
| `project_tasks` | status, dependencies[], auto-status | CRUD |
| `project_messages` | read_by{} (userId→timestamp) | CRUD |
| `auditLogs` | action, entity_type, changes{before, after} | **APPEND-ONLY** |
| `notifications` | type, priority, read status | CRUD |
| `quality_blog_posts` | category, translations{} | CRUD |

### 5.6 컬렉션 네이밍 규칙
- **서비스에서 snake_case 사용**: `training_programs`, `training_results`, `tqc_teams`, etc.
- **Firestore Rules는 반드시 서비스의 컬렉션 이름과 일치해야 함**
- **주의**: `auditLogs`는 camelCase (예외, 수정 필요할 수 있음)

---

## 6. 비즈니스 로직 상세

### 6.1 교육 프로그램 체계 (67개 프로그램, 2026 커리큘럼)

**6개 카테고리**:
- `QIP`: 품질 개선 프로그램 (QIP-001 ~ QIP-033)
- `PRODUCTION`: 생산 교육
- `RETRAINING`: 재교육 (불합격/만료)
- `NEWCOMER`: 신입 교육
- `PROMOTION`: 승진 교육
- `INSPECTION`: 검사 교육 (INS-001)

**4개 교육 레벨**:
```
LEVEL_1: TQC / New TQC (품질 검사 기초)
LEVEL_2: RQC / Line Leader (24개 과정)
LEVEL_3: Group Leader+ (13개 과정)
LEVEL_4: QA & Management (관리직)
```

**평가 유형**:
- `SCORE`: 점수 기반 (AA: 100, A: 90-99, B: 80-89, C: 0-79=FAIL)
- `PASS_FAIL`: 합격/불합격
- `INSPECTION_MATCH`: 쌍 판정 매칭률 기반

**프로그램 구조**:
```typescript
{
  program_code: 'QIP-001',
  program_name: string,          // 영어명
  program_name_vn: string,       // 베트남어명
  program_name_kr: string,       // 한국어명
  category: ProgramCategory,
  tags: string[],
  target_positions: Position[],
  evaluation_type: EvaluationType,
  passing_score: number,
  grade_aa: number, grade_a: number, grade_b: number,
  duration_hours: number,
  validity_months: number,       // 자격 유효 기간 (개월)
  training_level: TrainingLevel,
  training_type: 'REGULAR' | 'SPECIAL',
  is_active: boolean             // 소프트 삭제용
}
```

### 6.2 AQL → 교육 자동 등록 워크플로우
```
1. GAS API → aql_data/{year_month} (월별 원시 데이터)
2. aqlAnalyzer.ts: 검사관별 불합격률 계산
3. 불합격률 > 임계값 → 교육 추천 생성
4. 추천 우선순위: CRITICAL (>50%), HIGH (>30%), MEDIUM (>10%)
5. 관리자 검토 → 교육 등록 승인
6. aql_enrollment_logs (APPEND-ONLY 감사 추적)
7. inspection_enrollments 자동 생성
8. 교육 완료 후 품질 추적 (교육 전후 비교)
```

**AQL-직원 매핑**: `aql_employee_links` (AQL EMPLOYEE NO ↔ Q-TRAIN employee_id)
**감독자 매핑**: `aql_supervisor_links` (HR Manpower CSV에서 가져오기)

### 6.3 5PRS → 교육 추천 워크플로우
```
1. GAS API → five_prs_data/{year_month}
2. fivePrsDataProcessor.ts: 건물/라인별 분석
3. TQC 불합격 → 검사 교육 추천
4. AI 브리핑: Cloud Functions → Gemini API (서버 사이드)
5. 자동 등록: inspection_enrollments 생성
```

### 6.4 검사 교육 (INS-001) - 쌍 판정 테스트
```
1. 등록: 5PRS/AQL 추천 또는 수동 등록
2. 테스트: 20쌍 판정 (교육생 vs 검사관 판정 비교)
3. 매칭률 = matched_count / 20 × 100%
4. 등급: AA(100%), A(≥95%), B(≥85%), C(<85%)
5. 합격: match_rate ≥ 80%
6. 3진 아웃: 3회 연속 FAIL → 재배치 필요
7. 결과: training_results + inspection_results (atomic batch write)
```

### 6.5 CAPA 5단계 워크플로우
```
Stage 1: Discovery (발견)
  → 문제 설명, 출처, 영향 범위, 즉각 조치

Stage 2: Investigation (조사)
  → 근본 원인 분석 (5Why/Fishbone/FMEA)
  → 기여 요인, 영향 평가, 증거 목록

Stage 3: Action (조치)
  → 시정 조치 계획, 예방 조치 계획
  → 각 조치: 담당자, 기한, 상태 추적

Stage 4: Verification (검증)
  → 검증 방법, 효과성 점수 (0-100)
  → 모니터링 기간, 재발 확인

Stage 5: Closure (종결) 또는 Rejection
  → 최종 리뷰, 교훈 공유, 문서화 완료
```

**CAPA 속성**: type(corrective/preventive), severity(critical/major/minor), priority(high/medium/low)
**CAPA 번호**: 자동 생성 `CAPA-{year}-{3자리 난수}`

### 6.6 신입 TQC 교육 (1개월 과정)
```
1. 교육생 등록 (팀 배정, 시작일)
2. 색맹 검사 (Munsell Color Vision Test)
3. 4개 교육 단계:
   - Orientation (오리엔테이션)
   - Basic Training (기본 교육)
   - Line Assignment (라인 배치)
   - Field Evaluation (현장 평가)
4. 미팅 추적: 1주 / 1개월 / 3개월 (자동 일정 생성)
5. 최종 평가: 점수, 등급, 합격/불합격
6. 수료증 발급 또는 퇴사 기록
```

**이탈 위험 분석**: `attritionRiskCalculator.ts`
**퇴사 분석**: 사유별, 월별, 강사별, 팀별, 주별 분석

### 6.7 금속 탐지기 일일 검사
```
1. 공장/라인별 일일 점검
2. 감도 기록: Fe(철), SUS(스테인리스), NonFe(비철)
3. 결과: PASS/FAIL
4. FAIL → 실패 기록 생성 → CA(시정조치) 추적
5. CA 상태: pending → in_progress → completed (또는 overdue)
6. ISO 주차/연도 자동 계산
7. 대시보드: 공장별 KPI, 12주 트렌드, Open CA 수
```

---

## 7. 외부 연동

| 시스템 | 방식 | 엔드포인트 | 용도 |
|--------|------|----------|------|
| Google Apps Script | Cloud Functions 프록시 | `/api/aql/*`, `/api/five-prs/*` | AQL/5PRS 데이터 ETL |
| Gemini AI | Cloud Functions (서버 사이드) | `/api/five-prs/ai-briefing` | 5PRS AI 분석 브리핑 |
| Firebase Auth | Google OAuth + Email | — | 사용자 인증 |
| Firebase Storage | 직접 연동 | — | 파일 업로드 (이미지, 문서) |
| HR CSV | 파일 업로드 | — | 직원 데이터 동기화 |
| Manpower CSV | 파일 업로드 | — | 감독자 조직 구조 가져오기 |

---

## 8. 데이터 무결성 규칙 (Non-negotiable)

| 규칙 | 대상 컬렉션 | 설명 |
|------|-----------|------|
| **NO DELETE** | training_results, inspection_results | 교육 결과 삭제 절대 금지 |
| **APPEND-ONLY** | auditLogs, program_change_logs, result_edit_logs, aql_enrollment_logs, five_prs_enrollment_logs, tqc_resignations | 수정/삭제 금지, 추가만 가능 |
| **SOFT DELETE** | training_programs, tqc_teams | `is_active = false`로 비활성화 |
| **REVOKE ONLY** | certificates | 삭제 금지, 철회만 가능 |
| **NO DELETE on enrollments** | inspection_enrollments | 삭제 금지 |
| **RATE LIMIT** | employees, tqc_trainees, tqc_meetings | 1초 간격 제한 |
| **DOMAIN RESTRICT** | Auth | hwaseung.com, hwaseungvina.com, hsvina.com만 허용 |

---

## 9. 열거값 (Enums) 상세

### Department (11)
```
QIP, QA, PRODUCTION, HR, ADMIN, ENGINEERING, LOGISTICS,
PURCHASING, IT, MANAGEMENT, OTHER
```

### Position (13)
```
WORKER, LINE_LEADER, GROUP_LEADER, SUPERVISOR, MANAGER,
SENIOR_MANAGER, DIRECTOR, VP, CEO, INSPECTOR, QC, ENGINEER, OTHER
```

### Building (19)
```
A, A1, A2, B, B1, B2, B3, C, D, E1, E2, EZ_HAPPO, FG_WH,
INHOUSE_EZ, INHOUSE_PRINTING, MTL_WH, OSC_A, QA_OFFICE, QIP_OFFICE
```

### WorkingArea (16)
```
ASSEMBLY, STITCHING, CUTTING, BOTTOM, STOCKFIT, OSC,
MTL_A, MTL_B, MTL_C, MTL_GENERAL, QA, OFFICE,
REPACKING, AQL, OCPT, OTHER
```

### TrainingLevel (4)
```
LEVEL_1: TQC/New TQC (기초)
LEVEL_2: RQC/Line Leader (24과정)
LEVEL_3: Group Leader+ (13과정)
LEVEL_4: QA & Management
```

### Grade Thresholds
```
AA: 100점 (PASS)
A:  90-99점 (PASS)
B:  80-89점 (PASS)
C:  0-79점 (FAIL)
```

### CAPA Status Flow
```
discovery → investigation → action → verification → closed | rejected
```

### Trainee Status
```
IN_TRAINING → PASSED | FAILED | RESIGNED
```

### Meeting Types
```
1WEEK, 1MONTH, 3MONTH
```

### Resignation Reasons
```
HEALTH_ISSUE, FAMILY_MATTERS, DISTANCE, LOW_SALARY,
JOB_CHANGE, ABSENCE, ACCIDENT, OTHER
```

---

## 10. 라우팅 (60 routes)

### 보호 수준
- **Public**: `/login` (미인증 접근)
- **Authenticated**: 대부분의 라우트 (로그인 필요)
- **Permission**: `/results` (canEditResults 권한)
- **Email Restricted**: `/tech/*` (ksmoon@hsvina.com만)

### 코드 스플리팅
- 모든 페이지: `React.lazy()` + `<Suspense>`
- 차트: `LazyCharts.tsx` (Recharts 동적 import)

### 주요 라우트 그룹
```
/dashboard                    메인 대시보드
/programs                     교육 프로그램 관리
/progress                     직원×프로그램 매트릭스
/schedule                     교육 일정 캘린더
/results                      교육 결과 입력
/employees, /employees/:id    직원 관리
/retraining                   재교육 대상자
/attendance                   출석 관리
/reports                      리포트 빌더
/certificates                 수료증 발급
/trainers                     강사 관리
/training-plan                교육 계획
/audit-log                    감사 추적
/notifications                알림 센터
/evaluation                   교육 평가
/materials                    교육 자료
/executive-dashboard          경영진 대시보드
/audit-compliance             감사 준수
/data-sync                    데이터 동기화
/department-dashboard         부서별 대시보드
/competency                   역량 매트릭스
/skill-gap                    스킬 갭 분석
/quality-blog                 품질 지식 베이스
/executive-report             경영 리포트
/program-intro                프로그램 소개
/new-tqc/*                    신입 TQC (8 routes)
/aql/*                        AQL (2 routes)
/five-prs/*                   5PRS (4 routes)
/inspection/*                 검사 교육 (4 routes)
/capa/*                       CAPA (3 routes)
/equipment/metal-detector/*   금속 탐지기 (4 routes)
/projects/*                   프로젝트 (5 routes)
/tech/*                       기술 모델 (2 routes, 관리자)
```

---

## 11. ID 생성 규칙

| 엔티티 | ID 패턴 | 예시 |
|--------|---------|------|
| Employee | HR 제공 employee_id | `EMP-12345` |
| Program | program_code | `QIP-001`, `INS-001` |
| Result | `RES-{timestamp}-{rand5}` | `RES-1704067200000-ab3k2` |
| Enrollment | `ENR-{timestamp}-{rand5}` | `ENR-1704067200000-cd4m8` |
| AQL Log | `AQL-ENROLL-{timestamp}-{rand4}` | `AQL-ENROLL-1704067200000-ef5n` |
| CAPA | `CAPA-{year}-{rand3}` | `CAPA-2024-847` |
| TQC Team | name.toUpperCase().replace(/\s+/g, '_') | `TEAM_ALPHA` |
| Session | `SES-{timestamp}-{rand5}` | `SES-1704067200000-gh6p9` |

---

## 12. 개발 워크플로우

### 명령어
```bash
npm run dev                    # Vite 개발 서버
npm run build                  # tsc -b && vite build
npm run lint                   # ESLint
npm run typecheck              # tsc --noEmit
npm run test                   # Vitest (watch)
npm run test:run               # Vitest (single run)
npm run test:coverage          # 커버리지 리포트
npm run test:e2e               # Playwright E2E
npm run test:e2e:ui            # Playwright UI 모드
```

### 배포 (Firebase Hosting)
```bash
npm run build && firebase deploy --only hosting
```

### 전체 저장 + 배포 (사용자 선호 워크플로우)
```bash
git add -A
git commit -m "작업 설명"
npm run build
firebase deploy --only hosting
git push
git status  # working tree clean 확인
```

**중요**: 선별 커밋 금지. 모든 변경사항을 한번에 커밋하고 배포.

---

## 13. 테스트 현황

### 테스트 파일 (24개)
```
src/i18n/i18n.test.ts
src/policies/noDelete.test.ts
src/services/auditLogService.test.ts
src/services/capaService.test.ts              # Phase 5 추가
src/services/evaluationService.test.ts
src/services/inspectionService.test.ts         # Phase 5 추가
src/services/materialService.test.ts
src/services/notificationService.test.ts
src/services/resultService.test.ts             # Phase 5 추가
src/stores/authStore.test.ts
src/stores/capaStore.test.ts
src/stores/inspectionStore.test.ts             # Phase 7 추가
src/stores/projectStore.test.ts
src/stores/trainingStore.test.ts
src/stores/uiStore.test.ts
src/types/branded.test.ts
src/types/capa.test.ts
src/types/datetime.test.ts
src/types/normalized.test.ts
src/utils/aqlAnalyzer.test.ts                  # Phase 5 추가
src/utils/certificationUtils.test.ts           # Phase 7 추가
src/utils/kpiCalculator.test.ts
src/utils/logger.test.ts
src/utils/trainingEffectiveness.test.ts        # Phase 7 추가
```

### 테스트 설정
- Framework: Vitest + jsdom
- Component: @testing-library/react + @testing-library/user-event
- E2E: Playwright
- Setup: `src/test/setup.ts`

---

## 14. 성능 최적화 현황

### 번들 최적화
- Manual chunks: vendor-react, vendor-ui, vendor-firebase, vendor-i18n, vendor-utils, vendor-icons, vendor-state
- Recharts: LazyCharts 동적 import (초기 번들 제외)
- 모든 페이지: React.lazy() + Suspense

### 데이터 최적화
- Firestore 영구 캐시 (멀티탭 동기화)
- 스토어 레벨 5분 TTL 캐시
- 배치 작업 500개 청크 분할
- VirtualTable 가상 스크롤 (대량 데이터)
- 실시간 구독 50-500개 제한

### PWA 최적화
- Service Worker (Workbox)
- NetworkFirst: Firestore API, Cloud Functions
- CacheFirst: 폰트, 이미지
- 오프라인 폴백: index.html

### 성능 목표
```
LCP: < 2.5s
FID: < 100ms
CLS: < 0.1
Initial Bundle: < 500KB
```

---

## 15. 보안 현황

### 인증
- Firebase Auth (Email/Password + Google OAuth)
- 도메인 화이트리스트 (3개 회사 도메인)
- 역할 기반 접근 제어 (RBAC)

### Firestore Rules
- 인증 필수 (모든 컬렉션)
- 역할별 쓰기 권한 (Admin vs Trainer)
- 1초 속도 제한 (업데이트)
- APPEND-ONLY 정책 (감사 로그, 결과)

### 클라이언트 보안
- DOMPurify: XSS 방어
- Firebase App Check: reCAPTCHA Enterprise
- CSP 헤더 설정
- 민감 데이터 localStorage 미저장 (인증 상태만)

---

## 16. 에이전트 시스템 참조

**현재 AGENTS.md에 25명의 에이전트가 정의되어 있습니다.**

### 팀 구성
| 팀 | 에이전트 | 역할 |
|----|---------|------|
| Frontend (6) | UIX, A11Y, RDS, AID, CPA, SMA | UI/UX, 접근성, 반응형, 애니메이션, 컴포넌트, 상태관리 |
| Backend (5) | API, DBE, SEC, PRF, RTE | API, DB, 보안, 성능, 실시간 |
| Quality (5) | QAE, CRV, DOC, TAE, VQA | QA, 코드리뷰, 문서, 테스트자동화, 시각QA |
| Domain (3) | TDE, CMP, DAN | 교육전문가, 규정준수, 데이터분석 |
| DevOps (3) | DVO, MON, IFA | 배포, 모니터링, 인프라 |
| Specialized (4) | I18N, SYS, AIS, EMAIL | 국제화, 시스템설계, AI통합, 메일발송 |

### 오케스트레이션
```
SYS (System Architect) → 요청 분석 → 에이전트 배정 → 병렬/순차 실행 → Quality Gates → 결과 전달
```

---

## 17. 알려진 이슈 & 주의사항

1. **컬렉션 네이밍 불일치**: `auditLogs`는 camelCase (나머지는 snake_case)
2. **3진 아웃 하드코딩**: `inspectionService.ts`에서 3회 고정 (파라미터화 필요 가능)
3. **Cloud Functions 의존**: AQL/5PRS 데이터는 외부 GAS API + Cloud Functions 프록시 필요
4. **감독자 링크**: Google Drive CSV 가져오기 (단일 장애 지점)
5. **Firestore 복합 인덱스**: `firestore.indexes.json`과 실제 쿼리 동기화 필요

---

## 18. 개발 원칙 (요약)

1. **TypeScript 엄격 모드**: 타입 안전성 최우선
2. **APPEND-ONLY 결과**: 교육 결과는 절대 삭제 불가
3. **API 레이어 사용**: 페이지 → api.ts → service (직접 서비스 호출 금지)
4. **다국어 지원**: 모든 사용자 향 텍스트는 i18n 키 사용 (ko/en/vi)
5. **베트남어 우선**: 기본 언어는 베트남어 (vi)
6. **전체 커밋**: 작업 완료 시 `git add -A` → 전체 커밋 (선별 금지)
7. **소프트 삭제**: 프로그램/팀은 `is_active: false`
8. **감사 추적**: 모든 변경은 로그 기록
9. **WCAG 2.1 AA**: 접근성 준수 필수
10. **Core Web Vitals**: LCP < 2.5s, FID < 100ms, CLS < 0.1
11. **Zustand useShallow**: 스토어에서 여러 속성 구독 시 `useShallow` 사용 (리렌더링 최적화)
12. **serverTimestamp()**: Firestore 쓰기에 `serverTimestamp()` 사용 (`new Date()` / `Timestamp.now()` 금지)
13. **라우트 권한 보호**: 관리자 전용 페이지는 `DevProtectedRoute` + `requiredPermission` 적용
14. **DEV 전용 도메인**: `gmail.com`은 `import.meta.env.DEV`에서만 허용
15. **메일 발송 전담 에이전트 (EMAIL)**: 이 프로젝트의 모든 이메일 발송 업무는 반드시 EMAIL 에이전트가 전담 처리. Gmail MCP(send 기능 없음) 사용 금지. `scripts/sendEmail.js` + Nodemailer SMTP(`mail.hsvina.com:465`) 방식만 사용. 발신자: `ksmoon@hsvina.com`. 상세: `.claude/agents/email-agent.md` 참조.

---

## 19. 개선 이력 (Improvement History)

### Phase 1: 긴급 보안/로직/품질 수정 (2026-03-09, commit `0d4a6ba`)
| # | 카테고리 | 파일 | 변경 내용 |
|---|----------|------|----------|
| 1 | 로직 | `utils/aqlAnalyzer.ts` | AQL 우선순위 임계값: CRITICAL(>50%), HIGH(>30%), MEDIUM(>10%), null(≤10%) |
| 2 | 보안 | `types/auth.ts` | gmail.com → DEV 환경 전용 (`ALLOWED_EMAIL_DOMAINS`, `ADMIN_EMAILS`) |
| 3 | 로직 | `services/capaService.ts` | CAPA 단계 전환 `VALID_TRANSITIONS` 검증 추가, 무효 전환 차단 |
| 4 | 보안 | `App.tsx` | PptxTestPage를 `import.meta.env.DEV` 게이팅 |
| 5 | 품질 | `utils/excelExport.ts`, `utils/pdfExport.ts` | 7개 export 함수에 try/catch 에러 핸들링 |
| 6 | 테스트 | `services/notificationService.test.ts` | Firebase 모킹에 `limit: vi.fn()` 누락 수정 |

### Phase 2: 성능 최적화 + 권한 강화 (2026-03-09, commit `5e16b95`)
| # | 카테고리 | 영향 범위 | 변경 내용 |
|---|----------|----------|----------|
| 1 | 성능 | 35 페이지/컴포넌트 | `useShallow` 적용 (Zustand 구독 최적화) |
| 2 | 보안 | 7 라우트 | `DevProtectedRoute` 권한 보호 적용 |
| 3 | 데이터 | `projectService.ts`, `capaService.ts` | `serverTimestamp()` 전환 (클라이언트 시간 제거) |

**useShallow 적용 파일 (35개)**:
- Pages: EmployeeDetail, Employees, Programs, Results, Retraining, Schedule, TrainingPlan, AqlDashboard, AqlTrainingRecommendations, FivePrsDashboard, TrainingRecommendations (5PRS), CAPADashboard, CAPAForm, CAPADetail, InspectionDashboard, InspectionResultForm, InspectionEnrollments, InspectionHistory, ProjectsDashboard, ProjectsMembers, ProjectsTasks, ProjectsCalendar, ProjectsSettings, MDDashboard, MDInputForm, MDHistory, MDReport, QualityBlog, Login, TechModelList, TechReviewGuidelines
- Components: Header, Sidebar, NotificationBell, ProtectedRoute, NotificationCenter, MonthSelector, MappingManager, TqcEmployeeLinker

**라우트 권한 보호 (7개)**:
- `/trainers` → `canManageUsers`
- `/executive-report` → `canManageUsers`
- `/new-tqc/settings` → `canManageUsers`
- `/projects/settings` → `canManageUsers`
- `/aql/training-recommendations` → `canEditResults`
- `/five-prs/training-recommendations` → `canEditResults`
- `/inspection/result` → `canEditResults`

### Phase 3: i18n 하드코딩 한국어 → i18n 키 변환 (2026-03-09, commit `1982828`)
| # | 파일 | 변환 키 수 | 내용 |
|---|------|-----------|------|
| 1 | `pages/TrainingPlan.tsx` | ~65키 | 헤더, 레이블, 우선순위, 평가, 추천사항 |
| 2 | `components/projects/automation/constants.ts` | ~83키 | 트리거, 액션, 상태 라벨 |
| 3 | `components/projects/automation/AutomationDialog.tsx` | ~30키 | 다이얼로그 UI 텍스트 |
| 4 | `components/projects/automation/AutomationList.tsx` | ~25키 | 리스트 UI 텍스트 |
| 5 | `pages/Notifications.tsx` | 5키 | 알림 페이지 텍스트 |
| 6 | `i18n/locales/ko.json` | 179키 추가 | 한국어 번역 키 |
| 7 | `i18n/locales/en.json` | 179키 동기화 | 영어 (한국어 fallback) |
| 8 | `i18n/locales/vi.json` | 179키 동기화 | 베트남어 (한국어 fallback) |

### Phase 4: CRITICAL/P0 긴급 개선 (2026-03-09, commit `8e28d17`)
| # | 카테고리 | 변경 내용 |
|---|----------|----------|
| 1 | 로직 | 중복 교육 등록 방지 (inspectionService + aqlStore + recommendationStore) |
| 2 | 로직 | 3진 아웃 후속조치 (REASSIGNMENT_REQUIRED 상태 + 자동 알림) |
| 3 | i18n | 179키 영어/베트남어 번역 완료 |
| 4 | 안정성 | ErrorBoundary 글로벌 적용 (8개 모듈 + 모든 독립 페이지) |
| 5 | 성능 | 번들 청크 최적화 (vendor-pdf/excel/pptx/calendar/forms/table 분리) |

### Phase 5: P1 안정성/보안/테스트 강화 (2026-03-09, commit `3f47c97`)
| # | 카테고리 | 변경 내용 |
|---|----------|----------|
| 1 | 로직 | CAPA 필수필드 검증 (생성 + 단계 전환) |
| 2 | 안정성 | 에러 핸들링 전역 강화 (trainingStore 16개, mdInspectionStore 5개, capaStore 1개) |
| 3 | 테스트 | 핵심 서비스 테스트 104개 (inspection, capa, result, aqlAnalyzer) |
| 4 | 로직 | 자격 만료 제한 로직 (certificationUtils.ts + Retraining 페이지) |
| 5 | 보안 | Firestore 데이터 검증 규칙 (5개 컬렉션) |
| 6 | 접근성 | aria 강화 (14개 파일, 28개 키) |

### Phase 6: P2 코드품질/비즈니스/성능 (2026-03-09, commit `5cbf7a7`)
| # | 카테고리 | 변경 내용 |
|---|----------|----------|
| 1 | 리팩터링 | AQL/5PRS 중복 컴포넌트 통합 (5개 공통 + 8개 wrapper) |
| 2 | 리팩터링 | 1000줄+ 파일 분할 (api.ts→7파일, ProjectsTasks→5파일) |
| 3 | 비즈니스 | 교육 효과 측정 로직 (trainingEffectiveness.ts + Evaluation 탭) |
| 4 | 비즈니스 | 자격 만료 자동 알림 (Dashboard 하루 1회 체크) |
| 5 | 성능 | React.memo 최적화 (13개 컴포넌트) |
| 6 | 성능 | analyticsService 쿼리 최적화 (날짜 필터 + 5분 캐시) |

### Phase 7: 추가 개선 (2026-03-09, commit `7ece6fc`)
| # | 카테고리 | 변경 내용 |
|---|----------|----------|
| 1 | UI | 반응형 레이아웃 (6개 페이지) |
| 2 | 리팩터링 | Grade 계산 통합 (gradeCalculator.ts) |
| 3 | 보안 | Rate Limiting 강화 (3단계 + useDebounce + 폼 중복 방지) |
| 4 | 배포 | Firestore rules 프로덕션 배포 |
| 5 | 테스트 | 추가 테스트 71개 (certificationUtils, trainingEffectiveness, inspectionStore) |

### Phase 8: CAPADetail 분할 + projectService 분할 + SystemFeedback 페이지 (2026-03-09, commit `8feb183`)
| # | 카테고리 | 변경 내용 |
|---|----------|----------|
| 1 | 리팩터링 | CAPADetail.tsx (1347→231줄) → CAPAStageDialogs + CAPAStatusTimeline + CAPAInfoCards |
| 2 | 리팩터링 | projectService.ts (1147→8줄) → 5개 하위 서비스 (member, task, message, automation, common) |
| 3 | 기능 | SystemFeedback 페이지 (시스템 이슈 등록/피드백 페이지) + systemFeedbackService |
| 4 | 안정성 | serverTimestamp() 일관성 적용 (capaService, syncService) |
| 5 | 안정성 | 에러 핸들링 강화 (11개 서비스, projectStore console.error→logger.error) |

### Phase 9: 에이전트 팀 확장 + 크로스 프로젝트 (2026-03-09, commit `f714a1b`)
| # | 카테고리 | 변경 내용 |
|---|----------|----------|
| 1 | 에이전트 | FEEDBACK, MIGRATE, REPORT 에이전트 추가 (25→29명) |
| 2 | 크로스 | Return Dashboard: EMAIL 에이전트 추가 |
| 3 | 크로스 | Incentive v10: 이메일 스크립트 + 피드백 페이지 추가 |
| 4 | 리포트 | PPTX 시스템 소개 생성 (17슬라이드, ko/en/vi 3개 파일) |
| 5 | 이메일 | hwk_qa@hsvina.com으로 시스템 소개 이메일 발송 (3개 PPTX 첨부) |

### Phase 10: 대규모 파일 분할 (2026-03-09, commit `66688c7`)
| # | 카테고리 | 변경 내용 |
|---|----------|----------|
| 1 | 리팩터링 | Evaluation.tsx (1282→511줄) → 4 컴포넌트 (Filters, Table, DetailDialog, Charts) |
| 2 | 리팩터링 | TrainingPlan.tsx (1234→323줄) → 3 컴포넌트 (Calendar, Table, Dialogs) |
| 3 | 리팩터링 | Competency.tsx (1083→164줄, 24→8 useState) → 6 컴포넌트 |
| 4 | 리팩터링 | ExecutiveDashboard.tsx (1101→427줄) → 3 컴포넌트 (KPICards, Charts, Details) |
| 5 | 리팩터링 | ProjectsCalendar.tsx (1126→321줄) → 4 컴포넌트 (CalendarView, TaskDialog, EventDetails) |
| 6 | 리팩터링 | normalizedStore.ts (1243→20줄) → 4 엔티티 슬라이스 (employee, program, session, result) |
| 7 | 리팩터링 | programCatalog.ts (1461→35줄) → 2 데이터 파일 (qip, other) |
| 8 | 리팩터링 | analyticsService.ts (945→26줄) → 4 모듈 (dashboard, quality, training, shared) |

### 미완료 개선 항목 (향후 로드맵)
- [x] ~~핵심 서비스 테스트 (resultService, inspectionService, capaService, aqlService)~~ → Phase 5
- [x] ~~WCAG 접근성 수정~~ → Phase 5 (aria 강화)
- [x] ~~Grade 계산 통합~~ → Phase 7
- [x] ~~1000+ 라인 페이지 분할 (6 페이지)~~ → Phase 6, 8, 10
- [ ] DataTable 마이그레이션 (29 페이지)
- [ ] React Hook Form + Zod 마이그레이션 (17 폼)
- [ ] trainingStore → normalizedStore 전환
- [x] ~~AQL/5PRS 중복 컴포넌트 추출~~ → Phase 6
- [ ] E2E 테스트 (핵심 워크플로우)
- [x] ~~en.json/vi.json 179키 적절한 번역~~ → Phase 4
- [ ] 750-1000줄 파일 추가 분할 (14개 파일: Schedule, Materials, Results 등)

---

## 20. Agent Team System (Claude Code Agent Teams)

> **활성화**: `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1` (글로벌 + 프로젝트 설정 완료)
> 모든 teammate는 이 CLAUDE.md를 자동으로 읽습니다.

### 7-Agent Team Spawn Template

복잡한 작업 시 아래 프롬프트를 사용하여 전체 팀을 소환합니다:

```
Q-TRAIN 프로젝트 에이전트 팀을 생성해줘. 7명의 전문 teammate:

1. ARCH (Team Lead) - 아키텍처 오케스트레이터.
   전체 시스템 구조 이해, 태스크 분해/위임, 코드 리뷰, 빌드 검증.
   담당: App.tsx 라우팅, vite.config.ts, 전체 아키텍처 결정.
   컨텍스트: .claude/agents/arch-context.md 참조.

2. DATA - Firebase & 데이터 전문가.
   Firestore 25+ 컬렉션 스키마, 40+ 서비스 CRUD, 타입 정의, 보안 규칙.
   담당: src/services/*, src/types/*, firestore.rules.
   컨텍스트: .claude/agents/data-context.md 참조.

3. UI - 프론트엔드 & 컴포넌트 전문가.
   101개 컴포넌트, Shadcn/Radix UI, TanStack Table, Recharts, 내보내기.
   담당: src/components/*, src/pages/*, 내보내기 유틸.
   컨텍스트: .claude/agents/ui-context.md 참조.

4. QUALITY - 품질 도메인 전문가.
   AQL/5PRS 자동 등록, CAPA 5단계, 검사 교육 3진 아웃, 금속 탐지기, TQC.
   담당: 품질 관련 서비스/페이지/컴포넌트 전체.
   컨텍스트: .claude/agents/quality-context.md 참조.

5. STATE - 상태관리 & 성능 전문가.
   23개 Zustand 스토어, 11개 커스텀 훅, 캐싱 전략, 렌더링 최적화.
   담당: src/stores/*, src/hooks/*.
   컨텍스트: .claude/agents/state-context.md 참조.

6. I18N - 다국어 & 접근성 & 권한 전문가.
   i18next 3개 언어(ko/en/vi), RBAC, WCAG 2.1 AA.
   담당: src/i18n/*, 인증 컴포넌트, 접근성.
   컨텍스트: .claude/agents/i18n-context.md 참조.

7. TEST - 테스트 & QA 전문가.
   Vitest 단위테스트, Playwright E2E, 품질 게이트.
   담당: **/*.test.ts, src/test/, 배포 전 검증.
   컨텍스트: .claude/agents/test-context.md 참조.

각 teammate는 자신의 컨텍스트 파일(.claude/agents/*-context.md)을 먼저 읽은 후 작업을 시작하세요.
코드 변경 시 plan 모드로 승인을 받은 후 구현하세요.
```

### Teammate Context Files
각 에이전트의 전문 컨텍스트가 `.claude/agents/` 디렉토리에 저장되어 있습니다:

| File | Agent | 내용 |
|------|-------|------|
| `.claude/agents/arch-context.md` | ARCH | 전체 아키텍처, 위임 규칙, 코드 리뷰 체크리스트, 배포 프로토콜 |
| `.claude/agents/data-context.md` | DATA | Firestore 컬렉션 스키마, 서비스 패턴, 타입 정의, 데이터 무결성 규칙 |
| `.claude/agents/ui-context.md` | UI | 컴포넌트 시스템, 디자인 원칙, 폼/테이블/차트 패턴, 내보내기 |
| `.claude/agents/quality-context.md` | QUALITY | AQL/5PRS/CAPA/검사/TQC/MD 비즈니스 로직 상세 |
| `.claude/agents/state-context.md` | STATE | Zustand 스토어 패턴, 캐시 전략, 성능 최적화, 훅 |
| `.claude/agents/i18n-context.md` | I18N | 번역 키 규칙, RBAC 권한, WCAG 접근성, 용어집 |
| `.claude/agents/test-context.md` | TEST | 테스트 패턴, 필수 시나리오, 품질 게이트 체크리스트 |

### Task Delegation Matrix (Teammate 간 작업 분배)
| Request Type | Primary | Support |
|-------------|---------|---------|
| New Firestore collection | DATA | ARCH, STATE |
| New page creation | UI | I18N |
| Business logic (AQL/5PRS/CAPA) | QUALITY | DATA, STATE |
| Store refactoring | STATE | TEST |
| Translation addition | I18N | UI |
| Bug fix | ARCH (분류 후 위임) | — |
| Performance optimization | STATE | UI |
| Deployment verification | ARCH | TEST |
| New component | UI | I18N, STATE |
| Security/auth change | DATA | I18N |
| Test writing | TEST | (도메인 담당) |
| **Email sending (모든 메일)** | **EMAIL** | — |

### 소규모 작업용 부분 팀 템플릿

**UI 변경만 필요할 때** (3명):
```
Teammate 3명 생성: UI(프론트엔드), I18N(번역), TEST(테스트).
각자 .claude/agents/ 컨텍스트 파일 참조.
```

**데이터 스키마 변경** (3명):
```
Teammate 3명 생성: DATA(스키마+서비스), STATE(스토어), TEST(테스트).
각자 .claude/agents/ 컨텍스트 파일 참조.
```

**품질 도메인 변경** (4명):
```
Teammate 4명 생성: QUALITY(비즈니스로직), DATA(서비스), STATE(스토어), TEST(테스트).
각자 .claude/agents/ 컨텍스트 파일 참조.
```

### Teammate 공통 규칙 (모든 teammate가 준수)

1. **Code Change Sequence**: `types/ → services/ → stores/ → components/ → pages/`
2. **APPEND-ONLY 컬렉션**: training_results, auditLogs, enrollment_logs는 절대 UPDATE/DELETE 금지
3. **API 레이어**: Pages → `api.*` 호출만 (서비스 직접 호출 금지)
4. **i18n**: 모든 사용자 텍스트에 `t('key')` 사용 (하드코딩 금지), 새 키 추가 시 ko/en/vi 3개 파일 모두 동기화
5. **Firestore 네이밍**: snake_case (firestore.rules와 서비스 코드 일치 필수)
6. **Firestore 쓰기**: `serverTimestamp()` 사용 (`new Date()` / `Timestamp.now()` → Firestore 쓰기 금지)
7. **Zustand 구독**: 여러 속성 구독 시 `import { useShallow } from 'zustand/react/shallow'` 사용
8. **빌드 검증**: 작업 완료 전 `npm run typecheck && npm run build` 확인
9. **파일 충돌 최소화**: 각 teammate는 자신의 담당 파일 범위 내에서만 수정
10. **메일 발송 전담**: 모든 이메일 발송은 EMAIL 에이전트가 전담. Gmail MCP 사용 금지. `scripts/sendEmail.js` (Nodemailer SMTP) 방식만 사용

### 실전 병렬 에이전트 실행 패턴

Phase 2-3 개선 작업에서 검증된 병렬 실행 전략:

#### 대규모 일괄 수정 (35+ 파일)
```
전략: 파일을 3-4개 배치로 분할 → 각 배치를 백그라운드 에이전트에 위임 → 결과 통합

실행 예시 (Phase 2 useShallow 적용):
  Agent 1: 핵심 페이지 8개 (EmployeeDetail, Employees, Programs, Results, ...)
  Agent 2: AQL/5PRS/CAPA/Inspection 페이지 12개
  Agent 3: Projects/MD/기타 페이지 + 공통 컴포넌트 18개

  → 3개 에이전트 동시 실행 → 전체 완료 후 검증
```

#### i18n 키 일괄 변환 (179키)
```
전략: 하드코딩 한국어가 많은 파일 식별 → 에이전트에 변환 위임 → ko/en/vi 동기화

주의사항:
  - ko.json에 키 추가 후 반드시 en.json, vi.json에도 동일 키 추가
  - i18n 일관성 테스트 통과 확인 (i18n.test.ts)
  - 번역 미완료 시 한국어 값을 fallback으로 사용 가능
```

#### 검증 프로토콜
```
각 Phase 완료 후:
  1. npm run typecheck     # TypeScript 타입 검사
  2. npm run test:run      # 전체 테스트 (400+ tests)
  3. npm run build         # 프로덕션 빌드
  4. git add -A && git commit
  5. firebase deploy --only hosting
  6. git push
  7. git status            # working tree clean 확인
```

#### Pre-commit Hook 주의사항
```
scripts/register-qa-members.js에 API 키가 포함되어 있어 pre-commit hook에서 차단됨.
해결: git reset HEAD scripts/register-qa-members.js → 해당 파일 제외 후 커밋
```

### 26명 에이전트 전체 목록 (AGENTS.md 참조)

| ID | 이름 | 역할 | Avatar | 팀 | 핵심 스킬 |
|----|------|------|--------|-----|----------|
| UIX | 김디자인 | UI/UX Designer | 👨‍🎨 | Frontend | 인터페이스, UX, 비주얼, Figma |
| A11Y | 박접근 | Accessibility Expert | ♿ | Frontend | WCAG 2.1, 스크린리더, 색상 대비 |
| RDS | 이반응 | Responsive Specialist | 📱 | Frontend | 반응형, 모바일퍼스트, 크로스디바이스 |
| AID | 최동작 | Animation Designer | ✨ | Frontend | 마이크로인터랙션, 트랜지션, 60fps |
| CPA | 정컴포 | Component Architect | 🧩 | Frontend | React 패턴, Compound Components, Zustand |
| SMA | 신스테이트 | State Management | 🔄 | Frontend | Zustand, 비동기상태, Immer, persist |
| API | 송에이피 | API Architect | 🔌 | Backend | REST, GAS, 에러핸들링, 서킷브레이커 |
| DBE | 한데이터 | Database Engineer | 🗄️ | Backend | Firestore 스키마, 인덱스, 트랜잭션 |
| SEC | 강보안 | Security Engineer | 🛡️ | Backend | OWASP, RBAC, XSS/CSRF, DOMPurify |
| PRF | 오성능 | Performance Engineer | ⚡ | Backend | Core Web Vitals, 번들최적화, Virtual Scroll |
| RTE | 류실시간 | Real-time Engineer | 📡 | Backend | WebSocket, Push, 낙관적업데이트, 오프라인 |
| QAE | 윤품질 | QA Engineer | 🔍 | Quality | 테스트전략, 리스크기반, 버그관리 |
| CRV | 임리뷰 | Code Reviewer | 👀 | Quality | SOLID, DRY, 복잡도분석, 리팩토링 |
| DOC | 서문서 | Documentation Writer | 📝 | Quality | 기술문서, API문서, JSDoc, 3개국어 |
| TAE | 배테스트 | Test Automation | 🤖 | Quality | Vitest, RTL, Playwright, CI/CD |
| VQA | 비주얼큐에이 | Visual QA | 🎯 | Quality | 시각회귀, 픽셀비교, UI일관성 |
| TDE | 교육전문 | Training Expert | 🎓 | Domain | QIP, 역량프레임워크, Kirkpatrick, 커리큘럼 |
| CMP | 규정준수 | Compliance Specialist | 📋 | Domain | ISO, 감사추적, 데이터보존, APPEND-ONLY |
| DAN | 분석가 | Data Analyst | 📈 | Domain | Recharts, KPI, 이상치탐지, 통계 |
| DVO | 데브옵스 | DevOps Engineer | 🚀 | DevOps | Vite빌드, Firebase배포, GitHub Actions |
| MON | 모니터링 | Monitoring Specialist | 📊 | DevOps | 에러추적, 성능메트릭, 세션리플레이 |
| IFA | 인프라 | Infrastructure Architect | 🏗️ | DevOps | 서버리스, CDN, macOS앱, 재해복구 |
| I18N | 국제화 | i18n Specialist | 🌏 | Specialized | i18next, ko/en/vi, 지역화, 번역품질 |
| SYS | 시스템설계 | System Architect (Orchestrator) | 🧠 | Specialized | 아키텍처, 에이전트오케스트레이션, ADR |
| AIS | AI통합 | AI Integration | 🤖 | Specialized | Claude API, 프롬프트엔지니어링, 추천시스템 |
| EMAIL | 메일전문가 | Email Specialist | 📧 | Specialized | Nodemailer, SMTP(mail.hsvina.com), 메일 템플릿, 한비로 그룹웨어 |

### 팀 간 협업 매트릭스
```
                              ┌─────────────┐
                              │    SYS 🧠   │
                              │   총괄 조율  │
                              └──────┬──────┘
                                     │
         ┌───────────────────────────┼───────────────────────────┐
         │                           │                           │
         ▼                           ▼                           ▼
┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│  FRONTEND (6)   │       │  BACKEND (5)    │       │  QUALITY (5)    │
│ UIX A11Y RDS    │       │ API  DBE  SEC   │       │ QAE  CRV  DOC  │
│ AID CPA  SMA    │◄─────►│ PRF  RTE        │◄─────►│ TAE  VQA       │
└────────┬────────┘       └────────┬────────┘       └────────┬────────┘
         │                         │                         │
         └─────────────────────────┼─────────────────────────┘
                                   │
         ┌─────────────────────────┼─────────────────────────┐
         ▼                         ▼                         ▼
┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│  DOMAIN (3)     │       │  DEVOPS (3)     │       │ SPECIALIZED (3) │
│ TDE  CMP  DAN   │       │ DVO  MON  IFA   │       │ I18N  SYS  AIS  │
└─────────────────┘       └─────────────────┘       └─────────────────┘
```
