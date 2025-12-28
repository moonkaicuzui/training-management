# Q-TRAIN Project Instructions

## Project Overview
**Q-TRAIN**: HWK Vietnam (화승비나) QIP 교육 관리 시스템

### Tech Stack
- **Frontend**: React 18 + TypeScript + Vite
- **UI**: Tailwind CSS + shadcn/ui + Recharts
- **State**: Zustand
- **i18n**: i18next (vi/ko/en)
- **Backend**: Google Apps Script + Google Sheets
- **Hosting**: GitHub Pages

### Key URLs
- **GitHub Pages**: https://moonkaicuzui.github.io/training-management/
- **GAS API**: `https://script.google.com/macros/s/AKfycbxS2020t2o--mUb-o-ag-OJM5WUGsjZEsQq6YcALTyTxJOsM9Diuqpk-sDswAuuWrf_/exec`
- **Spreadsheet ID**: `1Rv0v_xxe86Hr0ptFphnZKyZZ_7CwmXOkuerd4o7BqOg`

---

## Agent System

@AGENTS.md

### Agent Activation Protocol
모든 작업 요청은 다음 프로토콜을 따릅니다:

```
1. [SYS] System Architect가 요청 분석
2. [SYS] 관련 에이전트 식별 및 활성화
3. [AGENTS] 병렬 분석 수행
4. [AGENTS] 협업하여 솔루션 도출
5. [QAE/CRV] 품질 검증
6. [DOC] 문서화 (필요시)
```

### Agent Response Format
```markdown
[SYS 분석]
─────────────────────────────────────────
작업: {작업 설명}
담당 에이전트: [{에이전트 ID 목록}]
협업 필요: [{추가 에이전트}]
우선순위: {HIGH/MEDIUM/LOW}
─────────────────────────────────────────

[{AGENT_ID} 분석]
- 현재 상태: ...
- 문제점: ...
- 개선안: ...
- 예상 효과: ...

[{AGENT_ID} 구현]
// 코드 또는 설정

[QAE 검증]
- 테스트 결과: PASS/FAIL
- 검증 항목: ...
```

---

## Core Principles (Non-negotiable)

### Data Integrity
1. **Training Results**: NO DELETE - only create/update with edit logs
2. **Programs**: Soft delete (is_active = false)
3. **Change Logs**: All program/result changes logged

### Quality Standards
- TypeScript strict mode
- ESLint + Prettier compliance
- 80%+ test coverage target
- WCAG 2.1 AA accessibility

### Performance Targets
- LCP < 2.5s
- FID < 100ms
- CLS < 0.1
- Initial bundle < 500KB

---

## Project Structure

```
src/
├── components/
│   ├── ui/          # shadcn components
│   ├── layout/      # Header, Sidebar, Layout
│   ├── dashboard/   # Dashboard components
│   ├── training/    # Program, Session, Result
│   ├── employee/    # Employee components
│   └── common/      # Shared components
├── pages/           # 6 main pages
├── services/        # API layer
├── stores/          # Zustand stores
├── types/           # TypeScript types
├── utils/           # Helpers
├── i18n/            # Translations (ko, en, vi)
└── hooks/           # Custom hooks
```

---

## Google Sheets Structure

### Sheets (6)
1. **Employees** - employee_id (PK), name, department, position, building, line, hire_date, status
2. **Training_Programs** - program_code (PK), names, category, target_positions, passing_score, validity
3. **Training_Sessions** - session_id (PK), program_code, date, trainer, location, status
4. **Training_Results** - result_id (PK), session_id, employee_id, score, grade, result
5. **Program_Change_Log** - change tracking for programs
6. **Result_Edit_Log** - edit tracking for results (NO DELETE)

---

## Common Tasks

### Adding a new feature
```
[SYS] → [CPA] 컴포넌트 설계 → [UIX] UI 디자인 → [API] API 설계
     → [TAE] 테스트 작성 → [DOC] 문서화 → [QAE] 최종 검증
```

### Bug fixing
```
[SYS] → [QAE] 버그 재현 → [CRV] 원인 분석 → [적절한 팀] 수정
     → [TAE] 회귀 테스트 → [QAE] 검증
```

### Performance optimization
```
[SYS] → [PRF] 성능 분석 → [CPA] 컴포넌트 최적화 → [RDS] 반응형 최적화
     → [DVO] 빌드 최적화 → [MON] 모니터링 설정
```

### i18n updates
```
[SYS] → [I18N] 번역 확인 → [A11Y] 접근성 검토 → [DOC] 문서 업데이트
```

---

## Development Commands

```bash
# Development
npm run dev

# Build
npm run build

# Deploy to GitHub Pages
npm run deploy

# Type check
npm run typecheck

# Lint
npm run lint
```

---

## Agent Collaboration Examples

### Example 1: "대시보드 차트 개선"
```
[SYS] 담당: DAN, UIX, CPA, PRF
[DAN] 데이터 시각화 분석
[UIX] 차트 UI/UX 개선안
[CPA] Recharts 컴포넌트 최적화
[PRF] 렌더링 성능 검증
```

### Example 2: "새 교육 프로그램 등록 기능"
```
[SYS] 담당: TDE, API, DBE, UIX, CPA
[TDE] 도메인 요구사항 분석
[API] API 엔드포인트 설계
[DBE] 스키마 업데이트
[UIX] 폼 UI 설계
[CPA] 폼 컴포넌트 구현
```

### Example 3: "보안 감사"
```
[SYS] 담당: SEC, CMP, CRV, QAE
[SEC] 취약점 스캔
[CMP] 규정 준수 확인
[CRV] 코드 보안 리뷰
[QAE] 보안 테스트
```

---

## Important Notes

1. **Always use Agent System**: 모든 개발 작업은 에이전트 협업 프로토콜을 따름
2. **Vietnamese First**: 기본 언어는 베트남어 (vi)
3. **No Data Loss**: 교육 결과는 절대 삭제 불가
4. **Accessibility**: WCAG 2.1 AA 준수 필수
5. **Performance**: Core Web Vitals 기준 충족 필수
