/**
 * CAPA Dashboard Page
 *
 * 메인 CAPA 대시보드 - 통계, 목록, 빠른 작업
 */

import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  AlertTriangle,
  Clock,
  FileWarning,
  Plus,
  Search,
  TrendingUp,
  AlertCircle,
  ShieldCheck,
  ShieldAlert,
} from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import { useCAPAStore, selectOverdueCAPAs } from '@/stores/capaStore';
import {
  CAPA_STATUS_LABELS,
  CAPA_SEVERITY_LABELS,
  CAPA_TYPE_LABELS,
  type CAPAStatus,
  type CAPASeverity,
} from '@/types/capa';

// Status badge color mapping
const STATUS_COLORS: Record<CAPAStatus, string> = {
  discovery: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
  investigation: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
  action: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
  verification: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
  closed: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  rejected: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300',
};

const SEVERITY_COLORS: Record<CAPASeverity, string> = {
  critical: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
  major: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
  minor: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
};

export default function CAPADashboard() {
  const { t: _t } = useTranslation();
  const navigate = useNavigate();
  const initializedRef = useRef(false);

  const {
    capas,
    dashboardStats,
    isLoading,
    filters,
    fetchCAPAs,
    fetchDashboardStats,
    setFilters,
  } = useCAPAStore();

  const overdueCAPAs = useCAPAStore(selectOverdueCAPAs);

  // Initial data load
  useEffect(() => {
    if (!initializedRef.current) {
      initializedRef.current = true;
      fetchCAPAs();
      fetchDashboardStats();
    }
  }, [fetchCAPAs, fetchDashboardStats]);

  // Handle search
  const handleSearch = (value: string) => {
    setFilters({ ...filters, search: value });
    fetchCAPAs({ ...filters, search: value });
  };

  // Handle status filter
  const handleStatusFilter = (status: string) => {
    const newFilters = {
      ...filters,
      status: status === 'all' ? undefined : [status as CAPAStatus],
    };
    setFilters(newFilters);
    fetchCAPAs(newFilters);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <ShieldCheck className="h-6 w-6" />
            CAPA 관리
          </h1>
          <p className="text-muted-foreground mt-1">
            시정 및 예방 조치 워크플로우
          </p>
        </div>
        <Button onClick={() => navigate('/capa/new')}>
          <Plus className="h-4 w-4 mr-2" />
          새 CAPA 등록
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">전체 CAPA</CardTitle>
            <FileWarning className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardStats?.total ?? 0}</div>
            <p className="text-xs text-muted-foreground">
              시정: {dashboardStats?.byType.corrective ?? 0} / 예방: {dashboardStats?.byType.preventive ?? 0}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">진행 중</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {dashboardStats
                ? dashboardStats.byStatus.discovery +
                  dashboardStats.byStatus.investigation +
                  dashboardStats.byStatus.action +
                  dashboardStats.byStatus.verification
                : 0}
            </div>
            <p className="text-xs text-muted-foreground">
              조사: {dashboardStats?.byStatus.investigation ?? 0} / 조치: {dashboardStats?.byStatus.action ?? 0}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">기한 초과</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              {dashboardStats?.overdue ?? 0}
            </div>
            <p className="text-xs text-muted-foreground">
              즉시 처리가 필요합니다
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">효과성 비율</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {dashboardStats?.effectivenessRate ?? 0}%
            </div>
            <p className="text-xs text-muted-foreground">
              평균 해결 기간: {dashboardStats?.averageResolutionDays ?? 0}일
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Status Overview */}
      <div className="grid gap-4 md:grid-cols-5">
        {(['discovery', 'investigation', 'action', 'verification', 'closed'] as CAPAStatus[]).map(
          (status) => (
            <Card
              key={status}
              className="cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={() => handleStatusFilter(status)}
            >
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <Badge className={STATUS_COLORS[status]}>
                    {CAPA_STATUS_LABELS[status]}
                  </Badge>
                  <span className="text-2xl font-bold">
                    {dashboardStats?.byStatus[status] ?? 0}
                  </span>
                </div>
              </CardContent>
            </Card>
          )
        )}
      </div>

      {/* Overdue CAPAs Alert */}
      {overdueCAPAs.length > 0 && (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              기한 초과 CAPA ({overdueCAPAs.length}건)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {overdueCAPAs.slice(0, 5).map((capa) => (
                <div
                  key={capa.id}
                  className="flex items-center justify-between p-2 rounded-lg bg-background cursor-pointer hover:bg-muted"
                  onClick={() => navigate(`/capa/${capa.id}`)}
                >
                  <div className="flex items-center gap-3">
                    <Badge className={SEVERITY_COLORS[capa.severity]}>
                      {CAPA_SEVERITY_LABELS[capa.severity]}
                    </Badge>
                    <div>
                      <p className="font-medium">{capa.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {capa.capaNumber}
                      </p>
                    </div>
                  </div>
                  <Badge className={STATUS_COLORS[capa.status]}>
                    {CAPA_STATUS_LABELS[capa.status]}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* CAPA List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>CAPA 목록</CardTitle>
              <CardDescription>
                전체 {capas.length}건
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="검색..."
                  className="pl-8 w-[200px]"
                  value={filters.search || ''}
                  onChange={(e) => handleSearch(e.target.value)}
                />
              </div>
              <Select
                value={filters.status && filters.status.length > 0 ? filters.status[0] : 'all'}
                onValueChange={handleStatusFilter}
              >
                <SelectTrigger className="w-[130px]">
                  <SelectValue placeholder="상태 필터" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">전체</SelectItem>
                  {Object.entries(CAPA_STATUS_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : capas.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <ShieldAlert className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>등록된 CAPA가 없습니다.</p>
              <Button
                variant="link"
                className="mt-2"
                onClick={() => navigate('/capa/new')}
              >
                새 CAPA 등록하기
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {capas.map((capa) => (
                <div
                  key={capa.id}
                  className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 cursor-pointer transition-colors"
                  onClick={() => navigate(`/capa/${capa.id}`)}
                >
                  <div className="flex items-center gap-4">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{capa.capaNumber}</Badge>
                        <Badge className={SEVERITY_COLORS[capa.severity]}>
                          {CAPA_SEVERITY_LABELS[capa.severity]}
                        </Badge>
                        <Badge variant="secondary">
                          {CAPA_TYPE_LABELS[capa.type]}
                        </Badge>
                      </div>
                      <p className="font-medium">{capa.title}</p>
                      <p className="text-sm text-muted-foreground line-clamp-1">
                        {capa.description}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right text-sm">
                      <p className="text-muted-foreground">담당: {capa.owner}</p>
                      {capa.dueDate && (
                        <p className="text-muted-foreground">
                          기한:{' '}
                          {capa.dueDate instanceof Date
                            ? capa.dueDate.toLocaleDateString()
                            : new Date((capa.dueDate as { toDate: () => Date }).toDate()).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                    <Badge className={STATUS_COLORS[capa.status]}>
                      {CAPA_STATUS_LABELS[capa.status]}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
