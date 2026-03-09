# DATA — Data & Firebase Expert Agent Context

## Identity
- **Role**: Firestore 스키마, 서비스 레이어, TypeScript 타입 정의의 단일 진실 소스
- **Scope**: 25+ Firestore 컬렉션, 40+ 서비스, 30+ 타입 정의 파일
- **Authority**: 데이터 모델 설계, 서비스 CRUD, Firebase 보안 규칙

---

## Firestore Collections (25+ collections, snake_case naming)

### Core Training Data
| Collection | Doc ID | Key Fields | Rules |
|-----------|--------|------------|-------|
| `employees` | employee_id (HR) | name, department, position, building, line, hire_date, status, _sync_source | CRUD, Admin-only delete |
| `training_programs` | program_code (QIP-001) | names(en/vn/kr), category, evaluation_type, passing_score, grade_thresholds, validity_months, is_active | **Soft delete only** |
| `training_sessions` | auto-ID | session_id, program_code, trainer_name, date, attendees[], status | CRUD |
| `training_results` | auto-ID | result_id(RES-ts-rand), employee_id, program_code, score, grade, result, test_attempt | **NO DELETE EVER** |
| `program_change_logs` | auto-ID | Program change history | **APPEND-ONLY** |
| `result_edit_logs` | auto-ID | Result edit history | **APPEND-ONLY** |

### New TQC (6 collections)
| Collection | Key Fields | Rules |
|-----------|------------|-------|
| `tqc_teams` | team_name, factory, line, is_active | Soft delete |
| `tqc_trainees` | trainee_id, team_id, status, color_blind_status, progress | CRUD |
| `tqc_training_stages` | trainee_id, stage_order, status | CRUD |
| `tqc_color_blind_tests` | trainee_id, result | CRUD |
| `tqc_meetings` | type(1WEEK/1MONTH/3MONTH), status, attendees[] | CRUD |
| `tqc_resignations` | resign_date, reason, training_duration_days | **APPEND-ONLY** |

### Quality Integration
| Collection | Key Fields | Rules |
|-----------|------------|-------|
| `aql_data/{year_month}` | Monthly AQL raw data (from GAS API) | READ-ONLY |
| `aql_employee_links` | aql_employee_no ↔ employee_id mapping | CRUD |
| `aql_supervisor_links` | Supervisor org structure | CRUD |
| `aql_enrollment_logs` | employee_id, program_code, fail_rate, defect_types[], reason | **APPEND-ONLY** |
| `five_prs_data/{year_month}` | Monthly 5PRS data (from GAS API) | READ-ONLY |
| `five_prs_enrollment_logs` | 5PRS training recommendation records | **APPEND-ONLY** |
| `inspection_enrollments` | source, status | **NO DELETE** |
| `inspection_results` | pairs[20], matched_count, match_rate, grade | **NO DELETE** |
| `defect_training_mappings` | Defect type → training program mapping | CRUD |

### CAPA & Equipment
| Collection | Key Fields | Rules |
|-----------|------------|-------|
| `capas` | capa_number, type, severity, priority, status(5-stage), stages{} | CRUD, Admin delete |
| `capa_root_cause_kb` | Root cause knowledge base | CRUD |
| `md_inspections` | factory, line, result, sensitivity(Fe/SUS/NonFe), iso_week | CRUD |
| `md_failures` | caStatus, caDescription | CRUD |

### Project Management (9 collections)
`projects`, `project_members`, `project_tasks`, `project_messages`, `project_categories`, `project_events`, `project_automations`, `project_notifications`, `project_settings`

### System
| Collection | Key Fields | Rules |
|-----------|------------|-------|
| `auditLogs` | action, entity_type, changes{before, after} | **APPEND-ONLY** |
| `notifications` | type, priority, read status | CRUD |
| `quality_blog_posts` | category, translations{} | CRUD |

**CRITICAL**: Collection names in `firestore.rules` MUST match service code exactly (snake_case).

---

## Service Layer Pattern

### Architecture
```
Pages → api.ts → *Service.ts → Firestore
```

### Standard Service Template
```typescript
// src/services/xxxService.ts
import { collection, doc, getDocs, addDoc, updateDoc, deleteDoc,
         query, where, orderBy, serverTimestamp, writeBatch } from 'firebase/firestore';
import { db } from './firebase';

const COLLECTION = 'collection_name';  // snake_case!

export const xxxService = {
  async getAll(filters?: Filters): Promise<T[]> {
    // Server-side: where() clauses
    // Client-side: date range, text search (avoid compound queries)
    const q = query(collection(db, COLLECTION), ...constraints);
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as T));
  },

  async getById(id: string): Promise<T> {
    const docRef = doc(db, COLLECTION, id);
    const snapshot = await getDoc(docRef);
    return { id: snapshot.id, ...snapshot.data() } as T;
  },

  async create(data: Omit<T, 'id'>): Promise<string> {
    const docRef = await addDoc(collection(db, COLLECTION), {
      ...data,
      created_at: serverTimestamp(),
      updated_at: serverTimestamp(),
    });
    return docRef.id;
  },

  async update(id: string, updates: Partial<T>): Promise<void> {
    await updateDoc(doc(db, COLLECTION, id), {
      ...updates,
      updated_at: serverTimestamp(),
    });
  },

  // For batch operations (Firestore limit: 500 per batch)
  async batchCreate(items: T[]): Promise<void> {
    const chunks = chunkArray(items, 500);
    for (const chunk of chunks) {
      const batch = writeBatch(db);
      chunk.forEach(item => {
        const ref = doc(collection(db, COLLECTION));
        batch.set(ref, { ...item, created_at: serverTimestamp() });
      });
      await batch.commit();
    }
  },
};
```

### API Orchestration Layer (src/services/api.ts)
```typescript
// Thin wrapper that re-exports service functions
import { employeeService } from './employeeService';
import { programService } from './programService';
// ... 40+ service imports

export const api = {
  employees: employeeService,
  programs: programService,
  results: resultService,
  // ...
};
```

---

## Type Definitions

### Core Types (src/types/index.ts)
```typescript
// Key Enums
enum Department { QIP, QA, PRODUCTION, HR, ADMIN, ... }  // 11
enum Position { WORKER, LINE_LEADER, GROUP_LEADER, ... }  // 13
enum Building { A, A1, A2, B, B1, ... }                   // 19
enum WorkingArea { ASSEMBLY, STITCHING, CUTTING, ... }     // 16
enum TrainingLevel { LEVEL_1, LEVEL_2, LEVEL_3, LEVEL_4 }

// Key Interfaces
interface Employee { employee_id, name, department, position, building, line, hire_date, status }
interface TrainingProgram { program_code, names(en/vn/kr), category, evaluation_type, passing_score, grade_thresholds, validity_months, is_active }
interface TrainingResultRecord { result_id, employee_id, program_code, score, grade(AA/A/B/C), result(PASS/FAIL), test_attempt }
interface TrainingSession { session_id, program_code, trainer_name, date, attendees[], status }

// Grade System
AA: 100 (PASS), A: 90-99 (PASS), B: 80-89 (PASS), C: 0-79 (FAIL)
```

### Domain-Specific Types
- `src/types/aql.ts` — AqlRawRow, AqlInspectorRecord, AqlEmployeeLink, AqlEnrollmentLog, AqlTrainingRecommendation
- `src/types/newTqc.ts` — NewTQCTrainee, NewTQCTeam, NewTQCTrainingStage, NewTQCMeeting, NewTQCResignation
- `src/types/capa.ts` — CAPARecord (5-stage), ActionItem, CAPAStage
- `src/types/inspection.ts` — InspectionResultDetail, InspectionPairResult, InspectionEnrollment, InspectionStrikeInfo
- `src/types/metalDetector.ts` — MDInspection, MDFailure
- `src/types/project.ts` — Project, ProjectTask, ProjectMessage

---

## ID Generation Patterns
| Entity | Pattern | Example |
|--------|---------|---------|
| Employee | HR-provided | EMP-12345 |
| Program | program_code | QIP-001, INS-001 |
| Result | `RES-{timestamp}-{rand5}` | RES-1704067200000-ab3k2 |
| Enrollment | `ENR-{timestamp}-{rand5}` | ENR-1704067200000-cd4m8 |
| AQL Log | `AQL-ENROLL-{timestamp}-{rand4}` | AQL-ENROLL-1704067200000-ef5n |
| CAPA | `CAPA-{year}-{rand3}` | CAPA-2024-847 |
| TQC Team | name.toUpperCase().replace(/\s+/g, '_') | TEAM_ALPHA |

---

## Firebase Configuration

### firebase.ts Key Exports
- `db` — Firestore instance (persistent cache, multi-tab)
- `auth` — Firebase Auth
- `storage` — Firebase Storage
- `signInWithEmail()`, `signOut()`, `syncUserRole()`
- `executeTransaction()` — Atomic operations
- `batchCreate()`, `batchUpdate()` — 500-item chunking
- `createTraineeWithRelations()` — Atomic trainee + stages + meetings
- `updateResultWithLog()` — Atomic result update + audit log

### Firestore Rules Pattern
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    function isAuthenticated() { return request.auth != null; }
    function isAdmin() { return get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'ADMIN'; }
    function isTrainer() { return get(...).data.role == 'TRAINER' || isAdmin(); }
    function hasAllowedDomain() { /* hwaseung.com, hwaseungvina.com, hsvina.com */ }
    function isNotTooFrequent() { /* 1 second rate limit */ }
  }
}
```

---

## Data Integrity Rules (NON-NEGOTIABLE)

| Rule | Collections | Description |
|------|------------|-------------|
| **NO DELETE** | training_results, inspection_results | Never delete training results |
| **APPEND-ONLY** | auditLogs, program_change_logs, result_edit_logs, aql_enrollment_logs, five_prs_enrollment_logs, tqc_resignations | No update/delete, create only |
| **SOFT DELETE** | training_programs, tqc_teams | Set `is_active = false` |
| **REVOKE ONLY** | certificates | No delete, revoke only |
| **RATE LIMIT** | employees, tqc_trainees, tqc_meetings | 1-second cooldown |
| **DOMAIN RESTRICT** | Auth | 3 company domains only |

---

## External Integrations

### Google Apps Script (Cloud Functions Proxy)
```
AQL: /api/aql/months, /api/aql/data/{yearMonth}
5PRS: /api/five-prs/months, /api/five-prs/data/{yearMonth}
5PRS AI: /api/five-prs/ai-briefing (Gemini server-side)
```

### HR CSV Import
- `src/utils/hrCsvParser.ts` — Employee data sync
- `src/utils/manpowerCsvParser.ts` — Supervisor org structure

---

## My Owned Files
```
src/services/*.ts        (40+ files)
src/types/*.ts           (30+ files)
firestore.rules
firestore.indexes.json
src/services/firebase.ts
src/services/api.ts
src/data/constants.ts
src/data/programCatalog.ts
```
