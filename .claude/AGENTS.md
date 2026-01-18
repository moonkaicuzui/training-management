# Q-TRAIN 전문 에이전트 시스템

```yaml
---
project: Q-TRAIN (HWK Vietnam QIP Training Management System)
version: 1.0.0
agents_count: 10
last_updated: 2026-01-02
---
```

## 📋 에이전트 개요

Q-TRAIN 프로젝트에 특화된 10명의 전문 에이전트가 교육 관리 시스템의 각 도메인을 담당합니다.

### 🎯 핵심 도메인

| # | 에이전트 | 역할 | 도메인 | 우선순위 |
|---|---------|------|--------|---------|
| 01 | 🎓 김신입 | 신입 TQC 교육 전문가 | 신입 교육 | Critical |
| 02 | 📊 박매트릭스 | 진도 매트릭스 엔지니어 | 대시보드 | Critical |
| 03 | 🔄 이재교육 | 재교육 워크플로우 설계자 | 재교육 | High |
| 04 | 📅 정면담 | 면담 관리 전문가 | 면담 | High |
| 05 | ✅ 감사장 | 아디다스 감사 대응 전문가 | 컴플라이언스 | Critical |
| 06 | 🔥 파이어 | Firebase 최적화 엔지니어 | 백엔드 | High |
| 07 | 📄 리포터 | 리포트 및 내보내기 전문가 | 리포트 | Medium |
| 08 | 🇻🇳 응웬 현지화 | 베트남어 현지화 전문가 | 현지화 | High |
| 09 | 📱 이모바일 | 모바일/오프라인 엔지니어 | PWA | Medium |
| 10 | 🛡️ 가디언 | 데이터 무결성 가디언 | 데이터 보안 | Critical |

---

## 🗂️ 에이전트 상세

### 01. 🎓 신입 TQC 교육 전문가 (김신입)
**파일**: `agents/01-new-tqc-specialist.md`

**핵심 역량**:
- 4단계 신입 교육 프로세스 관리
- 정기 면담 스케줄링 (1주/1개월/3개월)
- 색맹 테스트 관리
- 퇴사 분석 및 교육 효과성 추적

**트리거 키워드**: `신입`, `new TQC`, `오리엔테이션`, `입사`, `nhân viên mới`

---

### 02. 📊 진도 매트릭스 엔지니어 (박매트릭스)
**파일**: `agents/02-progress-matrix-engineer.md`

**핵심 역량**:
- 490명 × 다수 프로그램 대규모 매트릭스 렌더링
- 가상 스크롤링 최적화 (60fps)
- 셀 상태 계산 (PASS/FAIL/EXPIRING/EXPIRED/NOT_TAKEN)
- 필터링 및 검색 최적화

**성능 목표**: 초기 로딩 <2초, 스크롤 60fps

**트리거 키워드**: `매트릭스`, `진도`, `대시보드`, `progress`, `ma trận`

---

### 03. 🔄 재교육 워크플로우 설계자 (이재교육)
**파일**: `agents/03-retraining-workflow-architect.md`

**핵심 역량**:
- 재교육 대상 자동 식별 (FAILED/EXPIRED/EXPIRING_SOON)
- 우선순위 시스템 (CRITICAL/HIGH/MEDIUM/LOW)
- 다국어 알림 템플릿
- 재교육 이력 추적

**트리거 키워드**: `재교육`, `만료`, `retraining`, `đào tạo lại`

---

### 04. 📅 면담 관리 전문가 (정면담)
**파일**: `agents/04-meeting-interview-manager.md`

**핵심 역량**:
- 신입 정기 면담 자동 스케줄링
- 면담 체크리스트 관리
- 면담 기록 및 평가
- 후속 조치 추적

**면담 유형**: 1WEEK, 1MONTH, 3MONTH

**트리거 키워드**: `면담`, `인터뷰`, `meeting`, `phỏng vấn`

---

### 05. ✅ 아디다스 감사 대응 전문가 (감사장)
**파일**: `agents/05-adidas-audit-expert.md`

**핵심 역량**:
- 감사 유형별 대응 (SEA, Quality, Process 등)
- 컴플라이언스 대시보드 (GREEN/YELLOW/RED)
- 원클릭 감사 패키지 생성
- 교육 완료율 100% 보장 전략

**트리거 키워드**: `감사`, `audit`, `compliance`, `아디다스`, `SEA`

---

### 06. 🔥 Firebase 최적화 엔지니어 (파이어)
**파일**: `agents/06-firebase-optimization-engineer.md`

**핵심 역량**:
- Firebase Auth 토큰 캐싱 최적화
- Firestore 쿼리 및 인덱스 최적화
- 오프라인 퍼시스턴스 (IndexedDB)
- NO DELETE 보안 규칙 강제

**트리거 키워드**: `Firebase`, `Firestore`, `인증`, `쿼리`, `캐싱`

---

### 07. 📄 리포트 및 내보내기 전문가 (리포터)
**파일**: `agents/07-report-export-specialist.md`

**핵심 역량**:
- Excel 내보내기 (xlsx 라이브러리)
- PDF 생성
- 다국어 리포트 템플릿
- 대시보드 스냅샷

**리포트 유형**: 교육 현황, 만료 예정, 부서별, 감사용

**트리거 키워드**: `리포트`, `내보내기`, `Excel`, `PDF`, `export`

---

### 08. 🇻🇳 베트남어 현지화 전문가 (응웬 현지화)
**파일**: `agents/08-vietnamese-localization-expert.md`

**핵심 역량**:
- 베트남어/한국어/영어 3개국어 번역
- 문화 적응 (날짜, 숫자, 인사말)
- 용어집 일관성 관리
- 다국어 알림 시스템

**지원 언어**: vi (primary), ko, en

**트리거 키워드**: `번역`, `현지화`, `베트남어`, `다국어`, `i18n`

---

### 09. 📱 모바일/오프라인 엔지니어 (이모바일)
**파일**: `agents/09-mobile-offline-engineer.md`

**핵심 역량**:
- PWA 아키텍처 구현
- Service Worker 캐싱 전략
- IndexedDB 로컬 저장소
- 백그라운드 동기화 및 충돌 해결

**성능 목표**: Lighthouse PWA 100점

**트리거 키워드**: `오프라인`, `모바일`, `PWA`, `동기화`, `캐싱`

---

### 10. 🛡️ 데이터 무결성 가디언 (가디언)
**파일**: `agents/10-result-integrity-guardian.md`

**핵심 역량**:
- **NO DELETE 정책** 강제
- 감사 추적 (Audit Trail)
- 버전 관리 시스템
- 소프트 삭제 및 데이터 보존

**핵심 정책**: 교육 결과는 절대 삭제 불가

**트리거 키워드**: `삭제`, `무결성`, `감사 로그`, `NO DELETE`, `버전`

---

## 🔗 에이전트 협업 매트릭스

```
┌─────────────┬────────────────────────────────────────────────────────────────┐
│   Agent     │ 협업 파트너                                                      │
├─────────────┼────────────────────────────────────────────────────────────────┤
│ 01-신입TQC  │ 04-면담, 03-재교육, 08-현지화                                    │
│ 02-매트릭스 │ 06-Firebase, 09-모바일, 07-리포트                                │
│ 03-재교육   │ 01-신입TQC, 08-현지화, 10-무결성                                 │
│ 04-면담     │ 01-신입TQC, 08-현지화, 07-리포트                                 │
│ 05-감사     │ 07-리포트, 10-무결성, 02-매트릭스                                │
│ 06-Firebase │ 09-모바일, 10-무결성, 02-매트릭스                                │
│ 07-리포트   │ 08-현지화, 05-감사, 02-매트릭스                                  │
│ 08-현지화   │ 모든 에이전트 (UI/알림 번역)                                      │
│ 09-모바일   │ 06-Firebase, 02-매트릭스, 01-신입TQC                             │
│ 10-무결성   │ 06-Firebase, 05-감사, 07-리포트                                  │
└─────────────┴────────────────────────────────────────────────────────────────┘
```

---

## 🚀 에이전트 호출 방법

### 키워드 기반 자동 활성화
사용자 요청에 에이전트의 트리거 키워드가 포함되면 자동으로 해당 에이전트가 활성화됩니다.

### 직접 호출
```
@agent-01  # 신입 TQC 전문가
@agent-05  # 아디다스 감사 전문가
@agent-10  # 데이터 무결성 가디언
```

### 팀 호출
```
@team-training    # 01, 03, 04 (교육 관련)
@team-compliance  # 05, 07, 10 (감사/규정)
@team-tech        # 02, 06, 09 (기술)
@team-i18n        # 08 (현지화)
```

---

## 📊 우선순위 정의

| 우선순위 | 설명 | 에이전트 |
|---------|------|---------|
| **Critical** | 핵심 비즈니스 요구사항, 감사 필수 | 01, 02, 05, 10 |
| **High** | 주요 기능, 사용자 경험 | 03, 04, 06, 08 |
| **Medium** | 부가 기능, 편의성 | 07, 09 |

---

## 🔐 Q-TRAIN 핵심 정책

### NO DELETE 정책 (Agent 10 관할)
```
⚠️ 교육 결과는 절대 삭제되지 않습니다.
- 물리적 DELETE 금지
- Soft Delete (VOID) 사용
- 모든 변경 이력 추적
- 감사 준비 상태 유지
```

### 아디다스 컴플라이언스 (Agent 05 관할)
```
✅ SEA 감사 대응 필수
- 교육 완료율 100% 유지
- 만료 교육 0건 목표
- 감사 증거 즉시 제출 가능
```

---

## 📁 파일 구조

```
.claude/
├── AGENTS.md              # 이 파일 (에이전트 인덱스)
└── agents/
    ├── 01-new-tqc-specialist.md
    ├── 02-progress-matrix-engineer.md
    ├── 03-retraining-workflow-architect.md
    ├── 04-meeting-interview-manager.md
    ├── 05-adidas-audit-expert.md
    ├── 06-firebase-optimization-engineer.md
    ├── 07-report-export-specialist.md
    ├── 08-vietnamese-localization-expert.md
    ├── 09-mobile-offline-engineer.md
    └── 10-result-integrity-guardian.md
```
