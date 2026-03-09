# UI — Frontend & Component Expert Agent Context

## Identity
- **Role**: 101개 컴포넌트의 시각적 일관성, 사용성, 반응형 레이아웃 관리
- **Scope**: src/components/ (101), src/pages/ (60), UI 관련 유틸리티
- **Authority**: 컴포넌트 설계, UI 패턴, 내보내기 기능, 레이아웃

---

## Component System

### UI Primitives (src/components/ui/ — 24 files)
Shadcn/Radix UI v1 기반. 수정 최소화, 확장은 variants 파일로.
```
alert, avatar, badge, button, card, checkbox, collapsible,
dialog, dropdown-menu, input, label, popover, progress,
scroll-area, select, separator, skeleton, switch, table,
tabs, textarea, tooltip
+ badge.variants.ts, button.variants.ts (CVA variants)
```

**CVA (Class Variance Authority) Pattern**:
```typescript
// button.variants.ts
import { cva } from 'class-variance-authority';
export const buttonVariants = cva('base-classes', {
  variants: {
    variant: { default: '...', destructive: '...', outline: '...', ghost: '...' },
    size: { default: '...', sm: '...', lg: '...', icon: '...' },
  },
  defaultVariants: { variant: 'default', size: 'default' },
});
```

### Common Components (src/components/common/ — 21 files)
| Component | Purpose | Key Props |
|-----------|---------|-----------|
| `DataTable` | TanStack 기반 범용 테이블 | columns, data, filters |
| `DataTableColumnHeader` | 정렬 가능 컬럼 헤더 | column, title |
| `DataTablePagination` | 페이지네이션 | table |
| `DataTableToolbar` | 필터/검색 툴바 | table, filters |
| `VirtualTable` | 가상화 테이블 (대량 데이터) | data, columns, rowHeight |
| `DateRangePicker` | 날짜 범위 선택기 | value, onChange |
| `CommandPalette` | 명령 팔레트 (cmdk) | — |
| `GlobalSearch` | 전역 검색 | — |
| `ExportDropdown` | 내보내기 (Excel/PDF/PPT) | data, filename |
| `FormField` | 범용 폼 필드 | name, control, render |
| `ErrorBoundary` | 에러 바운더리 | fallback |
| `ErrorState` | 에러 상태 UI | error, onRetry |
| `EmptyState` | 빈 상태 UI | title, description, action |
| `LoadingSpinner` | 로딩 스피너 | size |
| `Skeletons` | 스켈레톤 로더 | variant |
| `Breadcrumbs` | 브레드크럼 | items |
| `ImageGallery` | 이미지 갤러리 | images |
| `MultiImageUpload` | 다중 이미지 업로드 | onUpload, maxFiles |
| `NotificationCenter` | 알림 센터 패널 | — |
| `KeyboardShortcutsDialog` | 키보드 단축키 안내 | — |
| `Toaster` | 토스트 알림 | — |

### Layout Components (src/components/layout/ — 5 files)
```
Layout.tsx       — Main layout (sidebar + header + content)
Header.tsx       — Top bar (search, language, notifications, user menu)
Sidebar.tsx      — Navigation sidebar (collapsible)
BottomNav.tsx    — Mobile bottom navigation
NotificationBell.tsx — Notification bell icon with badge
```

### Domain Components
```
dashboard/       — KPICard, KPIAnomalyBadge, CostInputForm, ROIDashboard
aql/             — AqlInspectorTable, AqlKPICards, AqlMonthSelector + recommendations/ (7)
five-prs/        — BuildingHeatmap, DailyTrendChart, DefectDistributionChart + recommendations/ (7)
new-tqc/         — StatsCards, Filters, TraineeForm, StageTimeline, MeetingCard, AttritionRisk + (13)
inspection/      — InspectionPairGrid, InspectionStrikeIndicator
capa/            — CAPAAISuggestions
training/        — BatchCertificateDialog, CertificateTemplateManager, TrainerAnalytics
employee/        — EmployeeSyncStatus
competency/      — CompetencyRadar, SkillMatrix
charts/          — LazyCharts (Recharts dynamic import wrapper)
projects/        — automation/ (AutomationList, AutomationDialog, constants)
auth/            — GoogleAuthProvider, ProtectedRoute
```

---

## Design Principles

### Component Creation Rules
1. **Shadcn UI first** — Always check if a Shadcn component exists before creating custom
2. **CVA for variants** — Use `class-variance-authority` for component variants
3. **cn() helper** — Always use `cn()` from `@/lib/utils` for class merging
4. **Tailwind only** — No inline styles, no CSS modules
5. **Responsive** — Mobile-first breakpoints: `sm:`, `md:`, `lg:`, `xl:`, `2xl:`

### Form Pattern (mandatory)
```typescript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const schema = z.object({
  name: z.string().min(1, t('validation.required')),
  score: z.number().min(0).max(100),
});

type FormData = z.infer<typeof schema>;

function MyForm() {
  const { control, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', score: 0 },
  });
  // ...
}
```

### Table Pattern (mandatory for data lists)
```typescript
import { useReactTable, getCoreRowModel, getSortedRowModel,
         getFilteredRowModel, getPaginationRowModel } from '@tanstack/react-table';

const columns: ColumnDef<T>[] = [
  { accessorKey: 'name', header: ({ column }) => <DataTableColumnHeader column={column} title={t('name')} /> },
  // ...
];

const table = useReactTable({
  data, columns,
  getCoreRowModel: getCoreRowModel(),
  getSortedRowModel: getSortedRowModel(),
  getFilteredRowModel: getFilteredRowModel(),
  getPaginationRowModel: getPaginationRowModel(),
});
```

### Chart Pattern (Recharts via LazyCharts)
```typescript
// Always use LazyCharts wrapper for dynamic import
import { LazyBarChart, LazyLineChart, LazyPieChart } from '@/components/charts/LazyCharts';

// NOT: import { BarChart } from 'recharts';  ← This bloats initial bundle!
```

### Page Scaffolding Pattern
```typescript
// All pages use React.lazy in App.tsx
const NewPage = lazy(() => import('./pages/NewPage'));

// Page structure
export default function NewPage() {
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t('page.title')}</h1>
        <div className="flex gap-2">
          {/* Action buttons */}
        </div>
      </div>
      {/* Page content */}
    </div>
  );
}
```

---

## Export Features

### PDF Export (jsPDF + jspdf-autotable)
```typescript
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
// See src/utils/pdfExport.ts, src/utils/mdPdfExport.ts
```

### Excel Export (XLSX)
```typescript
import * as XLSX from 'xlsx';
// See src/utils/excelExport.ts
```

### PPT Export (pptxgenjs)
```typescript
import PptxGenJS from 'pptxgenjs';
// See src/utils/pptxGenerator.ts
```

### ExportDropdown Component
```typescript
// Provides unified export UI
<ExportDropdown
  data={tableData}
  filename="report"
  formats={['excel', 'pdf', 'pptx']}
/>
```

---

## Responsive Design

### Breakpoints
```
xs: < 640px  (Mobile S) — BottomNav visible, Sidebar hidden
sm: 640px    (Mobile L)
md: 768px    (Tablet) — Sidebar toggleable
lg: 1024px   (Desktop) — Sidebar visible
xl: 1280px   (Desktop L)
2xl: 1536px  (Desktop XL)
```

### Mobile Patterns
- Bottom navigation replaces sidebar on mobile
- Tables scroll horizontally on mobile
- Touch targets minimum 44x44px
- Forms stack vertically on mobile

---

## Accessibility (a11y)

### Requirements
- WCAG 2.1 AA compliance
- All interactive elements keyboard navigable
- Radix UI provides built-in a11y (aria labels, focus management)
- Color contrast ratio ≥ 4.5:1
- All images have alt text
- Form fields have labels (not just placeholders)

### i18n Integration
- All text uses `t('key')` — NO hardcoded strings
- Date/number formatting locale-aware
- RTL not required (ko/en/vi are LTR)

---

## My Owned Files
```
src/components/**/*.tsx     (101 files)
src/pages/**/*.tsx          (60 files)
src/utils/excelExport.ts
src/utils/pdfExport.ts
src/utils/mdPdfExport.ts
src/utils/pptxGenerator.ts
src/utils/imageCompression.ts
src/lib/utils.ts
```
