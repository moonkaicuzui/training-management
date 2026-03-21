import { useTranslation } from 'react-i18next';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

// ─── Constants ─────────────────────────────────────────
export const MONTH_OPTIONS = [
  'january', 'february', 'march', 'april', 'may', 'june',
  'july', 'august', 'september', 'october', 'november', 'december',
];

const currentDate = new Date();
export const DEFAULT_MONTH = MONTH_OPTIONS[currentDate.getMonth()];
export const DEFAULT_YEAR = currentDate.getFullYear();

// ─── MonthYearSelector ──────────────────────────────────
export function MonthYearSelector({
  month, year, onMonthChange, onYearChange,
}: {
  month: string; year: number;
  onMonthChange: (m: string) => void;
  onYearChange: (y: number) => void;
}) {
  const { t } = useTranslation();
  return (
    <div className="flex items-center gap-2">
      <Select value={month} onValueChange={onMonthChange}>
        <SelectTrigger className="w-[140px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {MONTH_OPTIONS.map((m) => (
            <SelectItem key={m} value={m}>
              {t(`hrAnalytics.months.${m}`)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select value={String(year)} onValueChange={(v) => onYearChange(Number(v))}>
        <SelectTrigger className="w-[100px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {[2024, 2025, 2026, 2027].map((y) => (
            <SelectItem key={y} value={String(y)}>{y}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

// ─── KPICard ────────────────────────────────────────────
export function KPICard({ title, value, subtitle, icon: Icon, trend }: {
  title: string; value: string | number; subtitle?: string;
  icon: React.ComponentType<{ className?: string }>;
  trend?: 'up' | 'down' | 'neutral';
}) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold mt-1">{value}</p>
            {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
          </div>
          <div className="flex flex-col items-center gap-1">
            <Icon className="h-5 w-5 text-muted-foreground" />
            {trend === 'up' && <TrendingUp className="h-4 w-4 text-green-600" />}
            {trend === 'down' && <TrendingDown className="h-4 w-4 text-red-600" />}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── RiskBadge ──────────────────────────────────────────
export function RiskBadge({ level }: { level: string }) {
  const { t } = useTranslation();
  const variant = level === 'high' ? 'destructive' : level === 'medium' ? 'default' : 'secondary';
  return <Badge variant={variant}>{t(`hrAnalytics.riskLevel.${level}`)}</Badge>;
}

// ─── TqcStatusBadge ─────────────────────────────────────
export function TqcStatusBadge({ status }: { status: string }) {
  const { t } = useTranslation();
  const variant =
    status === 'completed' ? 'default'
      : status === 'in_training' ? 'secondary'
        : status === 'failed' ? 'destructive'
          : 'outline';
  return <Badge variant={variant}>{t(`hrAnalytics.tqcStatus.${status}`)}</Badge>;
}

// ─── EmptyMessage ───────────────────────────────────────
export function EmptyMessage({ message }: { message: string }) {
  return (
    <div className="flex items-center justify-center py-12 text-muted-foreground">
      <p>{message}</p>
    </div>
  );
}
