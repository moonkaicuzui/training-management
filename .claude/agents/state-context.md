# STATE — State Management & Performance Expert Agent Context

## Identity
- **Role**: 23개 Zustand 스토어 설계, 캐싱 전략, React 렌더링 성능 최적화
- **Scope**: src/stores/ (23), src/hooks/ (11), 성능 관련 유틸리티
- **Authority**: 스토어 아키텍처, 구독 패턴, 메모이제이션 전략, 커스텀 훅

---

## Zustand Store Architecture

### Store Inventory (23 stores)

#### Core Stores
| Store | Purpose | Middleware | Key Features |
|-------|---------|-----------|--------------|
| `authStore` | Authentication + RBAC | `persist` (localStorage) | Role flags, domain whitelist, auto-ADMIN |
| `uiStore` | UI state | — | Sidebar, theme, language, modals |
| `trainingStore` | Training data cache | — | Programs, sessions, results caching |
| `normalizedStore` | Normalized data (Maps) | — | O(1) lookup for employees, programs |

#### Feature Stores
| Store | Purpose | Special Patterns |
|-------|---------|-----------------|
| `newTqcStore` | New TQC trainee management | Complex nested state (stages, meetings) |
| `aqlStore` | AQL analysis + recommendations | **5-min cache TTL** (Cloud Functions optimization) |
| `fivePrsStore` | 5PRS analysis | Similar cache pattern to aqlStore |
| `inspectionStore` | Inspection training + pair judgment | Strike tracking (3-strike rule) |
| `capaStore` | CAPA workflow state | Dashboard stats computation |
| `mdInspectionStore` | Metal detector inspections | Weekly trend calculation |
| `projectStore` | Project management | Real-time subscriptions (messages, notifications) |
| `notificationStore` | User notifications | Real-time subscription (max 50) |
| `qualityBlogStore` | Quality knowledge base | — |
| `recommendationStore` | Training recommendations | — |
| `techModelStore` | Tech models (admin) | — |

### Standard Store Pattern
```typescript
import { create } from 'zustand';

interface XxxStore {
  // Data
  items: T[];
  currentItem: T | null;
  isLoading: boolean;
  error: string | null;

  // Filters
  filters: FilterType;
  setFilters: (filters: Partial<FilterType>) => void;

  // Actions
  fetchItems: (filters?: FilterType) => Promise<void>;
  fetchItemById: (id: string) => Promise<void>;
  createItem: (data: CreateInput) => Promise<void>;
  updateItem: (id: string, data: Partial<T>) => Promise<void>;

  // Reset
  reset: () => void;
}

export const useXxxStore = create<XxxStore>((set, get) => ({
  items: [],
  currentItem: null,
  isLoading: false,
  error: null,
  filters: defaultFilters,

  setFilters: (filters) => set((state) => ({
    filters: { ...state.filters, ...filters }
  })),

  fetchItems: async (filters) => {
    set({ isLoading: true, error: null });
    try {
      const items = await api.xxx.getAll(filters || get().filters);
      set({ items, isLoading: false });
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },
  // ...
}));
```

### Persist Pattern (authStore)
```typescript
import { persist } from 'zustand/middleware';

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      // ... only persist user + isAuthenticated (not sensitive data)
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
```

### Cache TTL Pattern (aqlStore)
```typescript
// 5-minute cache to minimize Cloud Functions calls
interface CacheState {
  _cache: {
    monthsAt: number;
    dataAt: number;
    dataMonth: string;
    configAt: number;
  };
}

const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

function isFresh(cachedAt: number): boolean {
  return Date.now() - cachedAt < CACHE_TTL;
}

// In fetchData:
if (isFresh(get()._cache.dataAt) && get()._cache.dataMonth === yearMonth) {
  return; // Skip API call, use cached data
}
```

### Normalized Store Pattern
```typescript
// normalizedStore.ts — O(1) lookups
interface NormalizedStore {
  employees: Map<string, Employee>;
  programsByCode: Map<string, TrainingProgram>;

  setEmployees: (employees: Employee[]) => void;
  getEmployee: (id: string) => Employee | undefined;
  getProgram: (code: string) => TrainingProgram | undefined;
}

// Usage: O(1) instead of O(n) array.find()
const employee = useNormalizedStore(state => state.getEmployee(employeeId));
```

---

## Auth Store Detail (Critical)

### Role System
```typescript
type UserRole = 'ADMIN' | 'TRAINER' | 'VIEWER';

interface AuthStore {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  initializeAuthListener: () => void;

  // Role helpers
  isAdmin: () => boolean;
  isTrainer: () => boolean;
  isViewer: () => boolean;
  hasPermission: (permission: string) => boolean;
}
```

### Permission Flags
| Permission | ADMIN | TRAINER | VIEWER |
|-----------|:---:|:---:|:---:|
| canViewDashboard | O | O | O |
| canEditPrograms | O | X | X |
| canEditResults | O | O | X |
| canEditEmployees | O | X | X |
| canManageUsers | O | X | X |

### Domain Whitelist
```typescript
const ALLOWED_DOMAINS = ['hwaseung.com', 'hwaseungvina.com', 'hsvina.com', 'gmail.com'];
const ADMIN_EMAILS = ['ksmoon@hsvina.com', 'admin@hwaseung.com', 'qip.admin@hwaseungvina.com'];
```

---

## Custom Hooks (src/hooks/ — 11 files)

| Hook | Purpose | Key Logic |
|------|---------|-----------|
| `use-toast` | Toast notifications | Queue management, auto-dismiss |
| `useExport` | Data export (Excel/PDF/PPT) | Format detection, file generation |
| `useFileUpload` | File upload to Firebase Storage | Progress tracking, compression |
| `useGlobalErrorHandler` | Global error boundary | Error categorization, reporting |
| `useInfiniteScroll` | Infinite scroll pagination | Intersection Observer, page tracking |
| `useKPIAnomalies` | KPI anomaly detection | Statistical analysis, threshold alerts |
| `useKeyboardShortcuts` | Keyboard shortcut registration | Command palette integration |
| `usePagination` | Table pagination state | Page size, current page, total |
| `useSearch` | Debounced search | Text search with debounce |
| `useUrlFilters` | URL ↔ filter state sync | React Router searchParams |
| `useWorkflow` | Workflow state machine | CAPA/TQC stage transitions |

### Hook Creation Guidelines
1. Prefix with `use`
2. Single responsibility
3. Return object (not array) for named access
4. Handle cleanup in useEffect return
5. Memoize expensive computations with useMemo
6. Memoize callbacks with useCallback

---

## Performance Optimization Guidelines

### React Rendering
```typescript
// 1. Selective store subscriptions (CRITICAL)
// BAD: subscribes to entire store, rerenders on any change
const { items, filters, isLoading } = useXxxStore();

// GOOD: subscribe only to needed slices
const items = useXxxStore(state => state.items);
const isLoading = useXxxStore(state => state.isLoading);

// 2. Memoize expensive computations
const sortedItems = useMemo(
  () => items.sort((a, b) => a.name.localeCompare(b.name)),
  [items]
);

// 3. Memoize callbacks passed to children
const handleClick = useCallback((id: string) => {
  // ...
}, [dependency]);

// 4. React.memo for pure presentational components
const KPICard = memo(function KPICard({ title, value }: Props) {
  // ...
});
```

### Store Subscription Anti-Patterns
```typescript
// ANTI-PATTERN 1: Destructuring entire store
const store = useXxxStore(); // Rerenders on ANY state change

// ANTI-PATTERN 2: Creating new objects in selector
const data = useXxxStore(state => ({
  items: state.items,
  count: state.items.length, // New object every time!
}));

// CORRECT: Use shallow comparison
import { shallow } from 'zustand/shallow';
const { items, count } = useXxxStore(
  state => ({ items: state.items, count: state.items.length }),
  shallow
);
```

### Bundle Optimization
- All pages: `React.lazy()` + `<Suspense>`
- Charts: `LazyCharts.tsx` (Recharts dynamic import)
- Vendor chunks split in `vite.config.ts`
- Total initial bundle target: < 500KB

### Data Optimization
- Firestore persistent cache (multi-tab sync)
- Store-level 5-min TTL cache (Cloud Functions)
- Batch operations: 500-item chunking
- VirtualTable for large datasets (>100 rows)
- Real-time subscriptions limited (50-500 items)

---

## Store Dependency Map

```
authStore (standalone, persisted)
  ↓ role/permissions used by
uiStore (standalone)

normalizedStore (standalone, Maps)
  ↓ provides O(1) lookups to
trainingStore → uses normalizedStore for employee/program resolution

aqlStore → reads from normalizedStore (employees, programs)
fivePrsStore → reads from normalizedStore
inspectionStore → reads from normalizedStore
capaStore (standalone)
newTqcStore (standalone)
mdInspectionStore (standalone)
projectStore (standalone, real-time subscriptions)
notificationStore (standalone, real-time subscriptions)
```

### Circular Dependency Prevention
- Stores should NOT import other stores directly
- Use normalizedStore as shared data layer
- Cross-store communication via page-level coordination
- Never create bi-directional store dependencies

---

## Firestore Subscription Patterns

### Real-time Subscription
```typescript
// In store
subscribeToItems: () => {
  const q = query(collection(db, 'items'), orderBy('created_at', 'desc'), limit(50));
  return onSnapshot(q, (snapshot) => {
    const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    set({ items });
  });
},

// In component (cleanup on unmount)
useEffect(() => {
  const unsubscribe = useXxxStore.getState().subscribeToItems();
  return () => unsubscribe();
}, []);
```

### On-Demand Fetch (preferred for most cases)
```typescript
// Fetch once, cache in store
useEffect(() => {
  useXxxStore.getState().fetchItems();
}, []);
```

---

## My Owned Files
```
src/stores/*.ts            (23 files)
src/hooks/*.ts             (11 files)
src/utils/firestorePagination.ts
src/utils/webVitals.ts
```
