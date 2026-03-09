# TEST — Testing & QA Expert Agent Context

## Identity
- **Role**: 테스트 커버리지 유지, 감사 로그 검증, 배포 전 품질 게이트
- **Scope**: 모든 테스트 파일, 테스트 설정, CI/CD 품질 게이트
- **Authority**: 테스트 전략, 테스트 작성, 품질 검증

---

## Test Stack

| Tool | Version | Purpose |
|------|---------|---------|
| Vitest | 4.0.16 | Unit & component tests |
| @testing-library/react | 16.3.1 | Component testing |
| @testing-library/user-event | 14.6.1 | User interaction simulation |
| @testing-library/jest-dom | 6.9.1 | DOM matchers |
| jsdom | 27.3.0 | Browser environment |
| Playwright | 1.57.0 | E2E testing |

### Configuration
```typescript
// vite.config.ts (Vitest configuration)
test: {
  globals: true,
  environment: 'jsdom',
  setupFiles: ['./src/test/setup.ts'],
  include: ['src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
  coverage: {
    reporter: ['text', 'json', 'html'],
    exclude: ['node_modules/', 'src/test/'],
  },
}
```

### Commands
```bash
npm run test           # Vitest watch mode
npm run test:run       # Single run (CI)
npm run test:coverage  # Coverage report
npm run test:e2e       # Playwright E2E
npm run test:e2e:ui    # Playwright UI mode
npm run test:e2e:report # Show Playwright report
npm run typecheck      # tsc --noEmit
npm run lint           # ESLint
```

---

## Existing Test Files

### Service Tests
```
src/services/auditLogService.test.ts     — Audit log APPEND-ONLY enforcement
src/services/evaluationService.test.ts   — Evaluation CRUD
src/services/materialService.test.ts     — Material management
src/services/notificationService.test.ts — Notification service
```

### Store Tests
```
src/stores/authStore.test.ts      — Auth + RBAC + domain whitelist
src/stores/capaStore.test.ts      — CAPA workflow state
src/stores/projectStore.test.ts   — Project management state
src/stores/trainingStore.test.ts  — Training data cache
src/stores/uiStore.test.ts        — UI state management
```

### Type Tests
```
src/types/branded.test.ts     — Branded type safety
src/types/capa.test.ts        — CAPA type validation
src/types/datetime.test.ts    — Date/time utility types
src/types/normalized.test.ts  — Normalized data types
```

### Utility Tests
```
src/utils/kpiCalculator.test.ts  — KPI calculation accuracy
src/utils/logger.test.ts         — Logger functionality
```

### Other Tests
```
src/i18n/i18n.test.ts           — i18n configuration
src/policies/noDelete.test.ts   — No-delete policy enforcement
```

---

## Test Writing Patterns

### Unit Test (Service)
```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock Firebase
vi.mock('../firebase', () => ({
  db: {},
}));

vi.mock('firebase/firestore', () => ({
  collection: vi.fn(),
  doc: vi.fn(),
  getDocs: vi.fn(),
  addDoc: vi.fn(),
  updateDoc: vi.fn(),
  deleteDoc: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  orderBy: vi.fn(),
  serverTimestamp: vi.fn(() => 'SERVER_TIMESTAMP'),
  writeBatch: vi.fn(() => ({
    set: vi.fn(),
    update: vi.fn(),
    commit: vi.fn(),
  })),
}));

describe('xxxService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getAll', () => {
    it('should fetch items with filters', async () => {
      // Arrange
      const mockDocs = [{ id: '1', data: () => ({ name: 'test' }) }];
      vi.mocked(getDocs).mockResolvedValue({ docs: mockDocs } as any);

      // Act
      const result = await xxxService.getAll({ status: 'active' });

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('test');
    });
  });

  describe('create', () => {
    it('should create with server timestamp', async () => {
      // ...
    });
  });
});
```

### Unit Test (Store)
```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { useXxxStore } from '../xxxStore';

describe('xxxStore', () => {
  beforeEach(() => {
    // Reset store to initial state
    useXxxStore.setState({
      items: [],
      isLoading: false,
      error: null,
    });
  });

  it('should set filters', () => {
    useXxxStore.getState().setFilters({ status: 'active' });
    expect(useXxxStore.getState().filters.status).toBe('active');
  });

  it('should handle fetch error', async () => {
    vi.spyOn(api.xxx, 'getAll').mockRejectedValue(new Error('Network error'));
    await useXxxStore.getState().fetchItems();
    expect(useXxxStore.getState().error).toBe('Network error');
    expect(useXxxStore.getState().isLoading).toBe(false);
  });
});
```

### Component Test
```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MyComponent } from '../MyComponent';

// Mock i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'en' },
  }),
}));

describe('MyComponent', () => {
  it('should render title', () => {
    render(<MyComponent />);
    expect(screen.getByText('page.title')).toBeInTheDocument();
  });

  it('should handle button click', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<MyComponent onSubmit={onSubmit} />);

    await user.click(screen.getByRole('button', { name: /submit/i }));
    expect(onSubmit).toHaveBeenCalledOnce();
  });
});
```

---

## Critical Test Scenarios

### 1. Data Integrity Tests (NON-NEGOTIABLE)

#### Training Results — NO DELETE
```typescript
describe('Training Results - No Delete Policy', () => {
  it('should NOT expose delete function', () => {
    expect(resultService.delete).toBeUndefined();
  });

  it('should create result with auto-generated ID', async () => {
    const result = await resultService.create(mockResult);
    expect(result).toMatch(/^RES-\d+-[a-z0-9]+$/);
  });

  it('should track edit history on update', async () => {
    await resultService.update(id, { score: 95 });
    // Verify result_edit_logs entry created
  });
});
```

#### APPEND-ONLY Collections
```typescript
describe('Audit Logs - Append Only', () => {
  it('should NOT expose update function', () => {
    expect(auditLogService.update).toBeUndefined();
  });

  it('should NOT expose delete function', () => {
    expect(auditLogService.delete).toBeUndefined();
  });

  it('should create log with before/after data', async () => {
    await auditLogService.createAuditLog({
      action: 'UPDATE',
      entity_type: 'PROGRAM',
      changes: { before: { name: 'old' }, after: { name: 'new' } },
    });
    // Verify log created
  });
});
```

### 2. AQL Workflow Tests
```typescript
describe('AQL Recommendation Engine', () => {
  it('should flag CRITICAL when fail_rate > 50%', () => {
    const rec = analyzeRecommendation({ fail_rate: 0.55 });
    expect(rec.priority).toBe('CRITICAL');
  });

  it('should flag HIGH when fail_rate > 30%', () => {
    const rec = analyzeRecommendation({ fail_rate: 0.35 });
    expect(rec.priority).toBe('HIGH');
  });

  it('should flag MEDIUM when fail_rate > 10%', () => {
    const rec = analyzeRecommendation({ fail_rate: 0.15 });
    expect(rec.priority).toBe('MEDIUM');
  });

  it('should skip enrollment for existing PENDING enrollment', async () => {
    // Test duplicate prevention
  });
});
```

### 3. Inspection 3-Strike Tests
```typescript
describe('Inspection 3-Strike Rule', () => {
  it('should NOT require reassignment with 2 consecutive failures', () => {
    const strike = checkStrikes(2);
    expect(strike.requires_reassignment).toBe(false);
  });

  it('should require reassignment with 3 consecutive failures', () => {
    const strike = checkStrikes(3);
    expect(strike.requires_reassignment).toBe(true);
  });

  it('should reset strike count after PASS', () => {
    // FAIL, FAIL, PASS, FAIL → consecutive = 1 (not 3)
  });
});
```

### 4. CAPA Workflow Tests
```typescript
describe('CAPA Stage Transitions', () => {
  it('should allow discovery → investigation', () => {
    expect(canTransition('discovery', 'investigation')).toBe(true);
  });

  it('should NOT allow discovery → verification (skip stages)', () => {
    expect(canTransition('discovery', 'verification')).toBe(false);
  });

  it('should allow verification → closed', () => {
    expect(canTransition('verification', 'closed')).toBe(true);
  });

  it('should allow any stage → rejected', () => {
    expect(canTransition('investigation', 'rejected')).toBe(true);
  });
});
```

### 5. Grade Calculation Tests
```typescript
describe('Grade Calculation', () => {
  it('should assign AA for score 100', () => {
    expect(calculateGrade(100)).toBe('AA');
  });

  it('should assign A for score 90-99', () => {
    expect(calculateGrade(95)).toBe('A');
    expect(calculateGrade(90)).toBe('A');
  });

  it('should assign B for score 80-89', () => {
    expect(calculateGrade(85)).toBe('B');
  });

  it('should assign C (FAIL) for score < 80', () => {
    expect(calculateGrade(79)).toBe('C');
    expect(calculateGrade(0)).toBe('C');
  });
});
```

### 6. Auth Tests
```typescript
describe('Auth Store', () => {
  it('should reject non-whitelisted domains', async () => {
    await expect(login('user@evil.com', 'pass')).rejects.toThrow();
  });

  it('should auto-assign ADMIN role for admin emails', () => {
    const role = determineRole('ksmoon@hsvina.com');
    expect(role).toBe('ADMIN');
  });

  it('should assign TRAINER role for company emails', () => {
    const role = determineRole('user@hwaseungvina.com');
    expect(role).toBe('TRAINER');
  });
});
```

### 7. Inspection Match Rate Tests
```typescript
describe('Inspection Match Rate', () => {
  it('should calculate 100% for all matching pairs', () => {
    const pairs = Array(20).fill({ is_match: true });
    expect(calculateMatchRate(pairs)).toBe(100);
  });

  it('should calculate correct percentage for partial matches', () => {
    const pairs = [...Array(16).fill({ is_match: true }), ...Array(4).fill({ is_match: false })];
    expect(calculateMatchRate(pairs)).toBe(80);
  });

  it('should assign PASS for match_rate >= 80', () => {
    expect(determineResult(80)).toBe('PASS');
  });

  it('should assign FAIL for match_rate < 80', () => {
    expect(determineResult(79)).toBe('FAIL');
  });
});
```

---

## E2E Test Scenarios (Playwright)

### Critical User Journeys
```typescript
// 1. Login flow
test('should login with valid company email', async ({ page }) => {
  await page.goto('/login');
  await page.fill('[name="email"]', 'ksmoon@hsvina.com');
  await page.fill('[name="password"]', 'password');
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL('/dashboard');
});

// 2. Training result entry
test('should create training result', async ({ page }) => {
  // Navigate to results page
  // Select employee, program
  // Enter score
  // Submit
  // Verify result appears in list
});

// 3. AQL → Training enrollment
test('should auto-enroll from AQL recommendation', async ({ page }) => {
  // Navigate to AQL recommendations
  // Select inspector with high fail rate
  // Click enroll
  // Verify enrollment log created
  // Verify inspection enrollment created
});

// 4. CAPA workflow
test('should progress through CAPA stages', async ({ page }) => {
  // Create new CAPA
  // Fill discovery stage
  // Progress to investigation
  // Add root cause
  // Progress to action
  // Add corrective actions
  // Progress to verification
  // Confirm effectiveness
  // Close CAPA
});
```

---

## Quality Gate Checklist (Pre-Deployment)

```bash
# 1. Type safety
npm run typecheck       # Zero TS errors

# 2. Lint
npm run lint            # Zero ESLint errors

# 3. Unit tests
npm run test:run        # All tests pass

# 4. Build
npm run build           # Build succeeds, no chunk warnings >500KB

# 5. E2E (optional, for major changes)
npm run test:e2e        # Critical paths pass
```

---

## Test Coverage Targets
```
Unit tests:        ≥ 80%
Integration tests: ≥ 70%
E2E (critical):    100% coverage of critical paths
```

### Critical Paths (must have E2E coverage)
1. Login/logout flow
2. Training result creation (NO DELETE verification)
3. AQL recommendation → enrollment
4. CAPA 5-stage workflow
5. Inspection pair judgment submission
6. Employee CSV import
7. Report export (PDF/Excel)

---

## My Owned Files
```
src/**/*.test.ts         (all test files)
src/**/*.test.tsx        (all test files)
src/**/*.spec.ts         (all spec files)
src/test/setup.ts        (test setup)
src/policies/noDelete.test.ts
playwright.config.ts     (if exists)
e2e/**                   (E2E test files)
```
