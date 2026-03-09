# ARCH — Architecture Orchestrator Agent Context

## Identity
- **Role**: Team Lead & Architecture Orchestrator
- **Scope**: Q-TRAIN 전체 시스템 (60 pages, 101 components, 40+ services, 23 stores)
- **Authority**: 태스크 분해, 에이전트 위임, 코드 품질 게이트키핑, 최종 빌드 검증

---

## Project Architecture Overview

### Tech Stack
```
React 19.2.0 + TypeScript 5.9.3 + Vite 7.2.4
Tailwind CSS 3.4.19 + Radix UI v1 (shadcn/ui)
React Router DOM 7.11.0
Zustand 5.0.9 (23 stores)
Firebase 12.7.0 (Firestore + Auth + Storage)
```

### Data Flow Architecture
```
Pages (React.lazy + Suspense)
  ↓ calls
api.ts (Single entry point — 모든 서비스 래핑)
  ↓ delegates
*Service.ts (Domain-specific Firestore CRUD)
  ↓ reads/writes
Firestore (25+ collections, snake_case naming)
  ↕ realtime subscriptions
Zustand Stores (cache + UI state)
  ↓ provides
Pages (re-render)
```

**Critical Rule**: Pages → `api.*` only. Never import services directly in pages.

### Directory Structure
```
src/
├── pages/           # 60 route pages (all React.lazy)
├── components/      # 101 components (ui/, common/, layout/, domain/)
├── services/        # 40+ Firestore service modules
├── stores/          # 23 Zustand stores
├── types/           # 30+ TypeScript type definitions
├── hooks/           # 11 custom hooks
├── utils/           # 18+ utility modules
├── data/            # constants.ts, programCatalog.ts (67 programs)
├── i18n/            # ko.json, en.json, vi.json
└── lib/             # utils.ts (cn helper)
```

### Route Groups (60 routes)
```
/dashboard                     Main dashboard
/programs, /progress, /schedule, /results   Training core
/employees, /employees/:id     Employee management
/retraining                    Retraining targets
/new-tqc/*                     New TQC module (8 routes)
/aql/*                         AQL quality (2 routes)
/five-prs/*                    5PRS inspection (4 routes)
/inspection/*                  Inspection training (4 routes)
/capa/*                        CAPA workflow (3 routes)
/equipment/metal-detector/*    Metal detector (4 routes)
/projects/*                    Project management (5 routes)
/tech/*                        Tech models (2 routes, admin only)
+ 15 additional routes (reports, certificates, etc.)
```

### Build Configuration
```typescript
// vite.config.ts key settings
base: '/'  // Firebase Hosting
manualChunks: {
  'vendor-react': ['react', 'react-dom', 'react-router-dom'],
  'vendor-ui': [radix packages],
  'vendor-firebase': ['firebase/app', 'firebase/auth', 'firebase/firestore'],
  'vendor-i18n': ['i18next', 'react-i18next'],
  'vendor-utils': ['date-fns', 'clsx', 'tailwind-merge', 'class-variance-authority'],
  'vendor-icons': ['lucide-react'],
  'vendor-state': ['zustand', 'immer'],
}
// Recharts: dynamic import via LazyCharts.tsx (excluded from initial bundle)
// Path alias: @ → ./src
```

---

## Task Decomposition Rules

### Delegation Matrix
| Request Type | Primary Agent | Support Agents |
|-------------|---------------|----------------|
| New Firestore collection | DATA | ARCH, STATE |
| New page creation | UI | ARCH, I18N |
| Business logic change | QUALITY | DATA, STATE |
| Store refactoring | STATE | ARCH, TEST |
| Translation addition | I18N | UI |
| Bug fix | ARCH (triage → delegate) | — |
| Performance optimization | STATE | ARCH, UI |
| Deployment | ARCH | TEST |
| New component | UI | I18N, STATE |
| Security/auth change | DATA | ARCH, I18N |
| Test writing | TEST | (domain agent) |
| AQL/5PRS/CAPA logic | QUALITY | DATA |
| Export feature (PDF/Excel) | UI | DATA |

### Triage Decision Tree
```
1. Does it touch Firestore collections or types/?
   → DATA (primary), + STATE if store changes needed

2. Does it involve AQL/5PRS/CAPA/Inspection/MD business rules?
   → QUALITY (primary), + DATA if schema changes

3. Does it involve UI components or pages/?
   → UI (primary), + I18N for translations

4. Does it involve store design or performance?
   → STATE (primary)

5. Does it need test coverage?
   → TEST (can run in parallel with implementation)

6. Cross-cutting concern?
   → ARCH handles coordination
```

### Parallel Execution Guidelines
```bash
# Independent tasks → run in parallel
claude --agent ui "Create CompetencyMatrix component" &
claude --agent i18n "Add competency translation keys" &
claude --agent data "Create competency_assessments collection schema" &
wait

# Dependent tasks → sequential
claude --agent data "Design new collection schema"
# Wait for types to be ready
claude --agent state "Create Zustand store for new collection"
# Wait for store
claude --agent ui "Create page using new store"
```

---

## Code Review Checklist

### TypeScript Safety
- [ ] No `any` types (use `unknown` + type guards)
- [ ] All function parameters typed
- [ ] Return types explicit for public APIs
- [ ] Enums from `src/types/index.ts` used consistently
- [ ] Zod schemas match TypeScript interfaces

### Component Design
- [ ] Uses Shadcn/Radix UI primitives (not custom)
- [ ] Forms use React Hook Form + Zod
- [ ] Tables use TanStack React Table
- [ ] All text uses `t('key')` (no hardcoded strings)
- [ ] Responsive breakpoints considered (xs → 2xl)

### Data Layer
- [ ] Pages call `api.*` (not services directly)
- [ ] APPEND-ONLY collections never updated/deleted
- [ ] Audit log entries created for data mutations
- [ ] Batch operations use 500-item chunking
- [ ] Server timestamps used (not client Date)

### Performance
- [ ] New pages use React.lazy + Suspense
- [ ] Heavy components have appropriate memoization
- [ ] No unnecessary re-renders in store subscriptions
- [ ] Images compressed before upload

### Build Verification
```bash
npm run typecheck  # tsc --noEmit (zero errors)
npm run lint       # ESLint (zero warnings for new code)
npm run build      # Vite build (success, no chunk warnings >500KB)
npm run test:run   # All tests pass
```

---

## Authentication & Authorization Reference

### Roles
| Role | canView | canEditPrograms | canEditResults | canEditEmployees | canManageUsers |
|------|:---:|:---:|:---:|:---:|:---:|
| ADMIN | O | O | O | O | O |
| TRAINER | O | X | O | X | X |
| VIEWER | O | X | X | X | X |

### Domain Whitelist
`hwaseung.com`, `hwaseungvina.com`, `hsvina.com` (+ `gmail.com` dev)

### Auto-ADMIN Emails
`ksmoon@hsvina.com`, `admin@hwaseung.com`, `qip.admin@hwaseungvina.com`

---

## Deployment Protocol
```bash
# Standard deployment workflow
npm run build                          # tsc -b && vite build
firebase deploy --only hosting         # Deploy to q-train-web
git add -A && git commit -m "message"  # Full commit (no selective)
git push
git status                             # Verify clean working tree
```

**Critical**: Always `git add -A` (no selective commits). User preference.

---

## Breaking Change Prevention

### High-Risk Changes
1. `src/types/index.ts` enum changes → affects entire app
2. `src/services/api.ts` function signatures → affects all pages
3. `firestore.rules` → can lock out all users
4. `src/stores/authStore.ts` → can break authentication
5. `vite.config.ts` chunk configuration → can break deployment

### Migration Pattern
```
1. Add new (don't modify existing)
2. Update consumers to use new
3. Deprecate old (keep working)
4. Remove old (after verification)
```

---

## Emergency Procedures

### Build Failure
```bash
npm run typecheck  # Identify TS errors first
npm run lint       # Then lint errors
npm run build      # Try build again
```

### Firestore Permission Denied
1. Check `firestore.rules` collection names match service code (snake_case!)
2. Verify user role synced to `users/{uid}` document
3. Check rate limiting (1 second between updates)

### Auth Failure
1. Verify email domain in whitelist
2. Check `authStore.ts` login validation
3. Confirm Firebase Auth console user exists
