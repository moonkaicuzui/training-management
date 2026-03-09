# I18N — Internationalization, Accessibility & Authorization Expert Agent Context

## Identity
- **Role**: 3개 언어 번역 일관성, RBAC 접근 제어, UI 접근성 유지
- **Scope**: src/i18n/, 인증/권한 관련 컴포넌트, 접근성 패턴
- **Authority**: 번역 키 관리, 역할 기반 라우트 보호, WCAG 준수

---

## i18n System (i18next v25)

### Configuration (src/i18n/index.ts)
```typescript
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

i18n.use(initReactI18next).init({
  resources: {
    ko: { translation: koTranslation },
    en: { translation: enTranslation },
    vi: { translation: viTranslation },
  },
  lng: 'vi',           // Default: Vietnamese
  fallbackLng: 'en',   // Fallback: English
  interpolation: { escapeValue: false },
});
```

### Language Files
```
src/i18n/ko.json    — Korean (한국어)
src/i18n/en.json    — English
src/i18n/vi.json    — Vietnamese (Tiếng Việt) — PRIMARY
```

### Translation Key Conventions
```json
{
  "common": {
    "save": "Save",
    "cancel": "Cancel",
    "delete": "Delete",
    "edit": "Edit",
    "search": "Search",
    "filter": "Filter",
    "export": "Export",
    "loading": "Loading...",
    "noData": "No data available"
  },
  "dashboard": {
    "title": "Dashboard",
    "totalEmployees": "Total Employees",
    "trainingCompletion": "Training Completion Rate"
  },
  "programs": {
    "title": "Training Programs",
    "category": {
      "QIP": "QIP",
      "PRODUCTION": "Production",
      "RETRAINING": "Retraining"
    }
  },
  "validation": {
    "required": "This field is required",
    "invalidEmail": "Invalid email format",
    "minLength": "Minimum {{min}} characters"
  }
}
```

### Key Naming Rules
1. **Hierarchical**: `module.section.key` (e.g., `aql.dashboard.failRate`)
2. **Consistent**: Same structure across all 3 language files
3. **No hardcoded strings**: All user-facing text must use `t('key')`
4. **Domain terms preserved**: AQL, CAPA, TQC, 5PRS are language-independent
5. **Interpolation**: Use `{{variable}}` for dynamic values

### Usage in Components
```typescript
import { useTranslation } from 'react-i18next';

function MyComponent() {
  const { t } = useTranslation();

  return (
    <div>
      <h1>{t('programs.title')}</h1>
      <p>{t('common.noData')}</p>
      <span>{t('dashboard.totalEmployees')}: {count}</span>
      <p>{t('validation.minLength', { min: 3 })}</p>
    </div>
  );
}
```

### Missing Key Detection
```typescript
// i18next will log missing keys in development
// Fallback chain: vi → en → key itself
// Monitor console for: "i18next::translator: missingKey"
```

---

## Translation Domain Glossary

### Manufacturing Terms (Language-Independent)
These terms are the SAME in all languages:
```
AQL (Acceptable Quality Level)
5PRS (5 Point Rating System)
CAPA (Corrective And Preventive Actions)
TQC (Total Quality Control)
QIP (Quality Improvement Program)
KPI (Key Performance Indicator)
```

### Grade/Result Terms
| Term | Korean | English | Vietnamese |
|------|--------|---------|------------|
| Pass | 합격 | Pass | Đạt |
| Fail | 불합격 | Fail | Không đạt |
| Grade AA | AA등급 | Grade AA | Hạng AA |
| Retraining | 재교육 | Retraining | Đào tạo lại |

### Department Terms
| Korean | English | Vietnamese |
|--------|---------|------------|
| 품질관리 | Quality Management | Quản lý chất lượng |
| 생산 | Production | Sản xuất |
| 인사 | Human Resources | Nhân sự |
| 관리 | Administration | Quản trị |

### Position Terms
| Korean | English | Vietnamese |
|--------|---------|------------|
| 작업자 | Worker | Công nhân |
| 라인리더 | Line Leader | Trưởng chuyền |
| 그룹리더 | Group Leader | Trưởng nhóm |
| 감독자 | Supervisor | Giám sát |

---

## Date & Number Formatting

### Date Formats by Locale
```typescript
import { format } from 'date-fns';
import { ko, enUS, vi } from 'date-fns/locale';

// Korean: 2024년 3월 15일
format(date, 'yyyy년 M월 d일', { locale: ko });

// English: March 15, 2024
format(date, 'MMMM d, yyyy', { locale: enUS });

// Vietnamese: 15 tháng 3, 2024
format(date, 'd MMMM, yyyy', { locale: vi });
```

### Number Formats
```typescript
// Korean: 1,234.56
new Intl.NumberFormat('ko-KR').format(1234.56);

// Vietnamese: 1.234,56
new Intl.NumberFormat('vi-VN').format(1234.56);

// Percentage
new Intl.NumberFormat(locale, { style: 'percent', maximumFractionDigits: 1 }).format(0.856);
```

---

## Authorization (RBAC)

### Role Hierarchy
```
ADMIN
  ├── All permissions
  ├── User management
  ├── Program CRUD
  └── Employee CRUD
TRAINER
  ├── View dashboard
  ├── Edit results (canEditResults)
  └── Manage training sessions
VIEWER
  └── Read-only access
```

### Permission Flags
```typescript
interface Permissions {
  canViewDashboard: boolean;   // ADMIN, TRAINER, VIEWER
  canEditPrograms: boolean;    // ADMIN only
  canEditResults: boolean;     // ADMIN, TRAINER
  canEditEmployees: boolean;   // ADMIN only
  canManageUsers: boolean;     // ADMIN only
}
```

### Route Protection (src/components/auth/ProtectedRoute.tsx)
```typescript
// Permission-based protection
<ProtectedRoute requiredPermission="canEditResults">
  <Results />
</ProtectedRoute>

// Email-based restriction (admin pages)
<ProtectedRoute requiredEmail="ksmoon@hsvina.com">
  <TechModelList />
</ProtectedRoute>

// Role-based
<ProtectedRoute requiredRole="ADMIN">
  <AdminPanel />
</ProtectedRoute>
```

### Domain Whitelist
```typescript
const ALLOWED_DOMAINS = [
  'hwaseung.com',        // Korea HQ
  'hwaseungvina.com',    // Vietnam subsidiary
  'hsvina.com',          // Vietnam operations
  'gmail.com',           // Development/testing only
];
```

### Auto-ADMIN Emails
```typescript
const ADMIN_EMAILS = [
  'ksmoon@hsvina.com',
  'admin@hwaseung.com',
  'qip.admin@hwaseungvina.com',
];
```

---

## Accessibility (a11y)

### WCAG 2.1 AA Requirements

#### Perceivable
- [ ] Color contrast ratio ≥ 4.5:1 (text), ≥ 3:1 (large text)
- [ ] All images have meaningful `alt` text
- [ ] Video/audio has captions/transcripts (if any)
- [ ] Content readable without CSS

#### Operable
- [ ] All interactive elements keyboard accessible
- [ ] Focus order logical (tab sequence)
- [ ] Focus visible (outline/ring)
- [ ] No keyboard traps
- [ ] Touch targets ≥ 44x44px

#### Understandable
- [ ] Language attribute set (`lang="vi"`)
- [ ] Error messages clear and actionable
- [ ] Form labels associated with inputs
- [ ] Consistent navigation

#### Robust
- [ ] Valid HTML semantics
- [ ] ARIA roles used correctly
- [ ] Compatible with assistive technologies

### Radix UI Accessibility (Built-in)
Radix UI components provide:
- Keyboard navigation
- Focus management
- ARIA attributes
- Screen reader support

**DO NOT override** Radix's built-in a11y behavior.

### Custom Accessibility Patterns
```typescript
// Form field with label
<Label htmlFor="name">{t('form.name')}</Label>
<Input id="name" aria-describedby="name-error" />
{errors.name && <p id="name-error" role="alert">{errors.name.message}</p>}

// Icon button with accessible name
<Button variant="ghost" size="icon" aria-label={t('common.delete')}>
  <Trash2 className="h-4 w-4" />
</Button>

// Status badges with text (not color alone)
<Badge variant={result === 'PASS' ? 'success' : 'destructive'}>
  {t(`result.${result}`)}
</Badge>

// Data table with caption
<table aria-label={t('table.trainingResults')}>
  <caption className="sr-only">{t('table.trainingResultsCaption')}</caption>
  ...
</table>
```

---

## Constants Localization (src/data/constants.ts)

### Localized Constants Pattern
```typescript
// Department display names
const DEPARTMENT_LABELS: Record<Department, Record<string, string>> = {
  QIP: { ko: '품질개선', en: 'Quality Improvement', vi: 'Cải tiến chất lượng' },
  PRODUCTION: { ko: '생산', en: 'Production', vi: 'Sản xuất' },
  // ...
};

// Position display names
const POSITION_LABELS: Record<Position, Record<string, string>> = {
  WORKER: { ko: '작업자', en: 'Worker', vi: 'Công nhân' },
  LINE_LEADER: { ko: '라인리더', en: 'Line Leader', vi: 'Trưởng chuyền' },
  // ...
};
```

---

## Checklist for New Features

### Translation Checklist
- [ ] All user-facing text uses `t('key')`
- [ ] Keys added to ALL 3 language files (ko, en, vi)
- [ ] No hardcoded strings in JSX
- [ ] Domain terms (AQL, CAPA, etc.) not translated
- [ ] Date/number formatting uses locale-aware functions
- [ ] Error messages are translatable
- [ ] Placeholder text is translatable
- [ ] Tooltip text is translatable

### Authorization Checklist
- [ ] New route has appropriate protection (ProtectedRoute)
- [ ] Permission check in component if needed
- [ ] Role-based UI elements hidden/shown correctly
- [ ] Admin-only features properly gated

### Accessibility Checklist
- [ ] All inputs have associated labels
- [ ] All images have alt text
- [ ] Interactive elements keyboard accessible
- [ ] Focus order is logical
- [ ] Color not used as sole indicator
- [ ] Touch targets ≥ 44x44px

---

## My Owned Files
```
src/i18n/index.ts
src/i18n/ko.json
src/i18n/en.json
src/i18n/vi.json
src/components/auth/ProtectedRoute.tsx
src/components/auth/GoogleAuthProvider.tsx
src/data/constants.ts (localized labels)
```
