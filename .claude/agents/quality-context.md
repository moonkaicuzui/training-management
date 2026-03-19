# QUALITY — Quality Domain Expert Agent Context

## Identity
- **Role**: AQL, 5PRS, CAPA, 검사 교육, 금속 탐지기 워크플로우의 비즈니스 로직 전문가
- **Scope**: 품질 도메인 서비스, 페이지, 컴포넌트, 유틸리티
- **Authority**: 품질 관련 비즈니스 규칙 구현, 교육 자동 등록 로직, 워크플로우 전환 조건

---

## Domain 1: AQL (Acceptable Quality Level) Workflow

### Data Flow
```
GAS API → Cloud Functions proxy
  → aql_data/{year_month} (raw inspection data)
  → aqlAnalyzer.ts (per-inspector fail rate calculation)
  → Recommendation engine (priority: CRITICAL/HIGH/MEDIUM)
  → Admin review → Enrollment approval
  → aql_enrollment_logs (APPEND-ONLY audit trail)
  → inspection_enrollments (auto-created)
```

### Key Types (src/types/aql.ts)
```typescript
AqlRawRow {
  EMPLOYEE_NO, OFFICIAL_INSPECTOR, RESULT, PO_NO,
  BUILDING, LINE, DESCRIPTION, DATE, MODEL, MONTH
}

AqlInspectorRecord {
  employee_no, inspector_name, total_inspections,
  fail_count, fail_rate, defect_types[], po_numbers[]
}

AqlEmployeeLink { aql_employee_no ↔ employee_id }  // Mapping

AqlEnrollmentLog {  // APPEND-ONLY
  employee_id, program_code, fail_rate,
  defect_types[], reason, enrolled_at
}

AqlTrainingRecommendation {
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM',
  defects[], recommended_programs[], supervisor_escalation
}
```

### Recommendation Priority
| Priority | Fail Rate | Action |
|----------|-----------|--------|
| CRITICAL | > 50% | Immediate training + supervisor escalation |
| HIGH | > 30% | Priority training enrollment |
| MEDIUM | > 10% | Scheduled training |

### Key Files
- `src/services/aqlService.ts` — API calls, employee links, enrollment logs
- `src/stores/aqlStore.ts` — State + 5-min cache TTL
- `src/utils/aqlAnalyzer.ts` — Fail rate analysis
- `src/utils/aqlDataProcessor.ts` — Data transformation
- `src/pages/aql/AqlDashboard.tsx` — KPI cards, inspector table
- `src/pages/aql/AqlTrainingRecommendations.tsx` — Recommendation + batch enroll
- `src/components/aql/` — 10 components

### Business Rules
1. Enrollment logs are APPEND-ONLY (never update/delete)
2. Employee mapping required: aql_employee_no → employee_id
3. Supervisor links imported from HR Manpower CSV
4. 5-minute cache TTL to minimize Cloud Functions calls
5. Batch enrollment supports 500+ items

---

## Domain 2: 5PRS (5 Point Rating System) Workflow

### Data Flow
```
GAS API → Cloud Functions proxy
  → five_prs_data/{year_month}
  → fivePrsDataProcessor.ts (building/line analysis)
  → TQC failure detection → Training recommendation
  → AI briefing (Gemini server-side via Cloud Functions)
  → Auto-enrollment → inspection_enrollments
```

### Key Files
- `src/services/fivePrsService.ts` — API (fetchMonths, fetchMonthData, generateAiBriefing, autoEnrollFromRecommendations)
- `src/stores/fivePrsStore.ts`
- `src/utils/fivePrsDataProcessor.ts`
- `src/pages/five-prs/` — 4 pages (Dashboard, OriginalDashboard, TrainingRecommendations, AiInstructions)
- `src/components/five-prs/` — 13 components (BuildingHeatmap, DailyTrendChart, DefectDistributionChart, etc.)

### Business Rules
1. AI briefing is server-side only (no client API keys)
2. Auto-enrollment creates inspection_enrollments + enrollment_logs
3. Returns: `{ success, enrolled, enrollments[], totalRecommendations }`

---

## Domain 3: Inspection Training (INS-001) — Pair Judgment Test

### Workflow
```
Enrollment (5PRS/AQL/MANUAL)
  → 20-pair judgment test
  → Match rate = matched_count / 20 × 100%
  → Grade: AA(100%), A(≥95%), B(≥85%), C(<85%)
  → PASS: match_rate ≥ 80%
  → FAIL: match_rate < 80%
  → 3-strike rule: 3 consecutive FAILs → reassignment required
  → Atomic batch write: training_results + inspection_results + enrollment update
```

### Key Types (src/types/inspection.ts)
```typescript
InspectionPairResult {
  pair_number: 1-20,
  trainee_judgment: 'PASS' | 'FAIL',
  inspector_judgment: 'PASS' | 'FAIL',
  is_match: boolean,
  defect_notes?: string
}

InspectionResultDetail {
  pairs: InspectionPairResult[20],
  matched_count, match_rate, grade, result
}

InspectionEnrollment {
  source: 'FIVE_PRS_RECOMMENDATION' | 'AQL_RECOMMENDATION' | 'MANUAL',
  status: 'PENDING' | 'SCHEDULED' | 'COMPLETED' | 'CANCELLED'
}

InspectionStrikeInfo {
  consecutive_failures: number,
  requires_reassignment: boolean  // true when >= 3
}
```

### Key Files
- `src/services/inspectionService.ts` — createInspectionResult (atomic batch), getConsecutiveFailures, autoEnrollFromLogs
- `src/stores/inspectionStore.ts`
- `src/pages/inspection/` — 4 pages
- `src/components/inspection/` — InspectionPairGrid, InspectionStrikeIndicator

### Business Rules
1. **3-strike rule**: `getConsecutiveFailures()` checks consecutive FAILs
2. **Atomic write**: training_results + inspection_results + enrollment status update in single batch
3. Auto-enrollment skips existing PENDING/SCHEDULED enrollments (no duplicates)
4. Test attempt auto-incremented from previous attempts
5. Match rate grade thresholds: AA=100%, A=95%, B=85%, C=<85%

---

## Domain 4: CAPA (Corrective & Preventive Actions) — 5-Stage Workflow

### Stage Definitions
```
Stage 1: DISCOVERY (발견)
  Fields: problemDescription, source, discoveredAt, discoveredBy,
          affectedArea, affectedProducts, immediateActions

Stage 2: INVESTIGATION (조사)
  Fields: rootCauseAnalysis, investigationMethod(5why/fishbone/fmea),
          contributingFactors, impactAssessment, evidenceList, findings

Stage 3: ACTION (조치)
  Fields: correctiveActions[], preventiveActions[]
    Each ActionItem: { description, assignedTo, dueDate, status }
  Fields: resourcesRequired, estimatedCost

Stage 4: VERIFICATION (검증)
  Fields: verificationMethod, effectivenessScore(0-100),
          isEffective, monitoringPeriod, recurrenceCheck

Stage 5: CLOSURE (종결) or REJECTION
  Fields: finalReview, lessonsLearned, documentationComplete, knowledgeShared
```

### CAPA Properties
```typescript
CAPARecord {
  capaNumber: 'CAPA-{year}-{3digit}',    // Auto-generated
  type: 'corrective' | 'preventive',
  severity: 'critical' | 'major' | 'minor',
  priority: 'high' | 'medium' | 'low',
  status: 'discovery' | 'investigation' | 'action' | 'verification' | 'closed' | 'rejected',
  owner: string,                           // Primary responsible
  team: string[],                          // Supporting members
  relatedTrainingPrograms: string[],       // Linked training for remediation
}
```

### Key Files
- `src/services/capaService.ts` — getCAPAs, createCAPA, updateCAPA, updateCAPAStage
- `src/stores/capaStore.ts` — State + dashboardStats
- `src/types/capa.ts`
- `src/pages/capa/` — CAPADashboard, CAPAForm, CAPADetail
- `src/components/capa/CAPAAISuggestions.tsx`

### Dashboard Stats
```
By status, severity, type
Overdue count, closure metrics
Average resolution days
Effectiveness rate (verified + effective %)
```

---

## Domain 5: New TQC (신입 교육) — 1-Month Program

### Lifecycle
```
Registration → Color Blind Test → 4 Training Stages → Final Assessment → Certificate/Resignation
```

### Training Stages (default 4)
```
1. Orientation (오리엔테이션)
2. Basic Training (기본 교육)
3. Line Assignment (라인 배치)
4. Field Evaluation (현장 평가)
```

### Meeting Schedule (auto-generated from start_date)
- 1WEEK: 시작 후 1주
- 1MONTH: 시작 후 1개월
- 3MONTH: 시작 후 3개월

### Resignation Analysis
- By reason (HEALTH_ISSUE, FAMILY_MATTERS, DISTANCE, LOW_SALARY, JOB_CHANGE, ABSENCE, ACCIDENT, OTHER)
- By month, trainer, team, week
- Average training duration to resignation

### Key Files
- `src/services/tqcService.ts` — 6 collections management
- `src/stores/newTqcStore.ts`
- `src/types/newTqc.ts`
- `src/utils/attritionRiskCalculator.ts`
- `src/pages/new-tqc/` — 8 pages
- `src/components/new-tqc/` — 13 components

---

## Domain 6: Metal Detector — Daily Inspection

### Workflow
```
Daily check per factory/line
  → Sensitivity: Fe(Ferrous), SUS(Stainless), NonFe(Non-ferrous)
  → Result: PASS/FAIL
  → FAIL → md_failures record → CA tracking
  → CA status: pending → in_progress → completed (or overdue)
  → ISO week/year auto-calculated
```

### Key Files
- `src/services/mdInspectionService.ts` — getInspections, createInspection, getFailures, getDashboardKPIs, getWeeklyTrend
- `src/stores/mdInspectionStore.ts`
- `src/types/metalDetector.ts`
- `src/pages/metal-detector/` — 4 pages
- `src/utils/mdPdfExport.ts` — MD-specific PDF report

---

## Domain 7: Metal Shoe Case — 금속 발견 신발 보고서 (2026-03-19 신규)

### Workflow
```
케이스 등록 (수동 또는 엑셀 임포트)
  → 업체명 → 표준 ID 자동 매칭 (SUPPLIER_ALIAS_MAP + fuzzyMatch)
  → Firestore: metal_shoe_cases/{year}/cases/{docId}
  → 상태 머신: registered → xray_sent → confirmed → action_requested → action_received → closed
  → X-Ray: NOT_SENT → OK, Metal Confirm: NOT_YET → YES/NO
  → Return Dashboard 연동: syncCaseToReturnDashboard() → qualityIssues 자동 생성
  → 보고서: Excel(4시트), PDF(주간), PPTX(업체 통보서)
  → Quality OS: metalShoeCollector → daily_metrics
```

### Key Files
- `src/types/metalShoe.ts` — MetalShoeCase, MetalShoeAction, MetalShoeDashboardKPI, MetalShoeFilters
- `src/services/metalShoeService.ts` — CRUD + getDashboardKPIs + getSupplierList
- `src/services/metalShoeSyncService.ts` — Return Dashboard 크로스 프로젝트 연동
- `src/stores/metalShoeStore.ts` — Zustand + devtools + immer
- `src/pages/metal-shoes/` — 4 pages (Dashboard, Register, Tracking, Report)
- `src/utils/metalShoeExcelParser.ts` — 엑셀 파싱 + 업체명→표준ID 매칭
- `src/utils/metalShoeExcelExport.ts` — 연간 Excel 보고서 (DATA, SUPPLIER TRACKING, SUMMARY)
- `src/utils/metalShoePdfExport.ts` — 주간 PDF 보고서 (jsPDF + autoTable)
- `src/utils/metalShoeSupplierNotice.ts` — 업체 통보서 PPTX (pptxgenjs, 16:9)

### Key Collections
```
metal_shoe_cases/{year}/cases/{docId}  ← 년도별 서브컬렉션 (NO DELETE)
metal_shoe_action_tracking/{docId}     ← 업체별 액션 추적
config/suppliers                       ← Quality OS에서 동기화된 업체 마스터
```

### Business Rules
1. 업체 표준 ID: Quality OS 업체 마스터 (24개) 기준 통일
2. 엑셀 임포트: SUPPLIER_ALIAS_MAP으로 별칭 매칭 + fuzzyMatch 폴백
3. Return Dashboard: metalFound는 Q-TRAIN 전용 (수동 등록 차단)
4. 날짜: UTC 파싱 필수 (시간대 밀림 방지)

### Cross-Project Integration
```
Q-TRAIN → Return Dashboard: syncCaseToReturnDashboard()
  - qualityIssues 컬렉션에 _sourceSystem: 'q-train' 문서 생성
  - defectType: 'metalFound', issueCategory: 'SPEC_QC'

Return Dashboard → Q-TRAIN: syncActionFromReturnDashboard()
  - 액션플랜 상태 역방향 동기화 (수동 트리거)

Quality OS → 전체: pushSupplierSettings()
  - config/suppliers → 8개 프로젝트 동기화

Quality OS ← Q-TRAIN: metalShoeCollector
  - 최근 변경 케이스 수집 → quality_os/data/metal_shoe_cases
  - daily_metrics/metal_shoe/{date} 집계
```

---

## Domain 8: Training Program System

### 67 Programs (2026 Curriculum)
```
Category: QIP | PRODUCTION | RETRAINING | NEWCOMER | PROMOTION | INSPECTION
Level: LEVEL_1 (TQC) | LEVEL_2 (RQC/Leader) | LEVEL_3 (Group Leader+) | LEVEL_4 (QA/Mgmt)
EvalType: SCORE | PASS_FAIL | INSPECTION_MATCH
```

### Grade System
| Grade | Score Range | Result |
|-------|-----------|--------|
| AA | 100 | PASS |
| A | 90-99 | PASS |
| B | 80-89 | PASS |
| C | 0-79 | FAIL |

### Validity & Retraining
- Each program has `validity_months`
- Expired training → appears in Retraining targets
- Failed results → appears in Retraining targets
- Validity calculated from `training_date + validity_months`

### Key Files
- `src/data/programCatalog.ts` — 67 program definitions
- `src/data/constants.ts` — All enums and constants
- `src/utils/kpiCalculator.ts` — KPI calculations
- `src/utils/kpiAnomalyDetector.ts` — Anomaly detection
- `src/utils/recommendationAnalyzer.ts` — Training recommendation

---

## Cross-Domain Integration Points

### AQL → Training
```
AQL fail_rate > threshold → aql_enrollment_logs → inspection_enrollments → inspection training
```

### 5PRS → Training
```
5PRS TQC failure → five_prs_enrollment_logs → inspection_enrollments → inspection training
```

### Training → Quality Tracking
```
Training completed → track quality metrics before/after → measure effectiveness
```

### CAPA → Training
```
CAPA corrective action → relatedTrainingPrograms → targeted training
```

### Metal Shoe → Return Dashboard
```
Q-TRAIN metal_shoe_cases → syncCaseToReturnDashboard() → Return Dashboard qualityIssues (metalFound)
Return Dashboard actions → syncActionFromReturnDashboard() → Q-TRAIN actionPlanActions
```

### Metal Shoe → Quality OS
```
Q-TRAIN metal_shoe_cases → metalShoeCollector → Quality OS daily_metrics/metal_shoe
Quality OS config/suppliers → pushSupplierSettings() → Q-TRAIN config/suppliers (업체 마스터)
```

---

## My Owned Files
```
src/services/aqlService.ts
src/services/fivePrsService.ts
src/services/inspectionService.ts
src/services/capaService.ts
src/services/mdInspectionService.ts
src/services/tqcService.ts
src/stores/aqlStore.ts
src/stores/fivePrsStore.ts
src/stores/inspectionStore.ts
src/stores/capaStore.ts
src/stores/mdInspectionStore.ts
src/stores/newTqcStore.ts
src/types/aql.ts
src/types/fivePrs.ts
src/types/inspection.ts
src/types/capa.ts
src/types/metalDetector.ts
src/types/newTqc.ts
src/utils/aqlAnalyzer.ts
src/utils/aqlDataProcessor.ts
src/utils/fivePrsDataProcessor.ts
src/utils/recommendationAnalyzer.ts
src/utils/attritionRiskCalculator.ts
src/pages/aql/**
src/pages/five-prs/**
src/pages/inspection/**
src/pages/capa/**
src/pages/metal-detector/**
src/pages/new-tqc/**
src/components/aql/**
src/components/five-prs/**
src/components/inspection/**
src/components/capa/**
src/components/new-tqc/**
```
