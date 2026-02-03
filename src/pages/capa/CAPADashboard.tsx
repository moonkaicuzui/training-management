/**
 * CAPA Dashboard Page
 *
 * 메인 CAPA 대시보드 - 통계, 목록, 빠른 작업
 */

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  ShieldCheck,
  Plus,
  Search,
  AlertTriangle,
  CheckCircle2,
  Clock,
  FileSearch,
  Wrench,
  ClipboardCheck,
  XCircle,
  ChevronRight,
} from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

import { useCAPAStore } from '@/stores/capaStore';
import {
  CAPA_STATUS_LABELS,
  CAPA_TYPE_LABELS,
  CAPA_SEVERITY_LABELS,
  type CAPAStatus,
} from '@/types/capa';

// Status colors for badges
const STATUS_COLORS: Record<CAPAStatus, string> = {
  discovery: 'bg-blue-100 text-blue-800',
  investigation: 'bg-yellow-100 text-yellow-800',
  action: 'bg-orange-100 text-orange-800',
  verification: 'bg-purple-100 text-purple-800',
  closed: 'bg-green-100 text-green-800',
  rejected: 'bg-gray-100 text-gray-800',
};

// Status icons
const STATUS_ICONS: Record<CAPAStatus, typeof Clock> = {
  discovery: AlertTriangle,
  investigation: FileSearch,
  action: Wrench,
  verification: ClipboardCheck,
  closed: CheckCircle2,
  rejected: XCircle,
};

export default function CAPADashboard() {
  useTranslation();
  const navigate = useNavigate();

  const {
    capas,
    dashboardStats,
    isLoading,
    fetchCAPAs,
    fetchDashboardStats,
  } = useCAPAStore();

  // Local state for filters - always initialized with default values
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Fetch data on mount
  useEffect(() => {
    fetchCAPAs();
    fetchDashboardStats();
  }, [fetchCAPAs, fetchDashboardStats]);

  // Filter CAPAs based on local state
  const filteredCAPAs = capas.filter((capa) => {
    // Status filter
    if (statusFilter !== 'all' && capa.status !== statusFilter) {
      return false;
    }

    // Search filter
    if (searchText) {
      const search = searchText.toLowerCase();
      return (
        capa.title.toLowerCase().includes(search) ||
        capa.description.toLowerCase().includes(search) ||
        capa.capaNumber.toLowerCase().includes(search)
      );
    }

    return true;
  });

  // Handle status filter change
  const handleStatusFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setStatusFilter(e.target.value);
  };

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchText(e.target.value);
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

      {/* Statistics Cards */}
      {dashboardStats && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">전체 CAPA</CardTitle>
              <ShieldCheck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dashboardStats.total}</div>
              <p className="text-xs text-muted-foreground">
                이번 달 종료: {dashboardStats.closedThisMonth}건
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
                {(dashboardStats.byStatus.discovery || 0) +
                  (dashboardStats.byStatus.investigation || 0) +
                  (dashboardStats.byStatus.action || 0) +
                  (dashboardStats.byStatus.verification || 0)}
              </div>
              <p className="text-xs text-muted-foreground">
                기한 초과: {dashboardStats.overdue}건
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">평균 해결 시간</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {dashboardStats.averageResolutionDays}일
              </div>
              <p className="text-xs text-muted-foreground">
                효과성: {dashboardStats.effectivenessRate}%
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">심각도별</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Badge variant="destructive">
                  Critical: {dashboardStats.bySeverity.critical || 0}
                </Badge>
                <Badge variant="secondary">
                  Major: {dashboardStats.bySeverity.major || 0}
                </Badge>
                <Badge variant="outline">
                  Minor: {dashboardStats.bySeverity.minor || 0}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>CAPA 목록</CardTitle>
          <CardDescription>등록된 시정/예방 조치 목록</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="CAPA 검색..."
                className="pl-8"
                value={searchText}
                onChange={handleSearchChange}
              />
            </div>
            {/* Using native select to avoid controlled/uncontrolled issues */}
            <select
              className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              value={statusFilter}
              onChange={handleStatusFilterChange}
            >
              <option value="all">모든 상태</option>
              {Object.entries(CAPA_STATUS_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          {/* CAPA List */}
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : filteredCAPAs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {capas.length === 0 ? (
                <>
                  <ShieldCheck className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>등록된 CAPA가 없습니다.</p>
                  <Button
                    variant="link"
                    onClick={() => navigate('/capa/new')}
                    className="mt-2"
                  >
                    새 CAPA 등록하기
                  </Button>
                </>
              ) : (
                <p>검색 결과가 없습니다.</p>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              {filteredCAPAs.map((capa) => {
                const StatusIcon = STATUS_ICONS[capa.status];
                return (
                  <div
                    key={capa.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent cursor-pointer transition-colors"
                    onClick={() => navigate(`/capa/${capa.id}`)}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`p-2 rounded-full ${STATUS_COLORS[capa.status]}`}>
                        <StatusIcon className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{capa.capaNumber}</span>
                          <Badge variant="outline" className="text-xs">
                            {CAPA_TYPE_LABELS[capa.type]}
                          </Badge>
                          <Badge
                            variant={
                              capa.severity === 'critical'
                                ? 'destructive'
                                : capa.severity === 'major'
                                ? 'secondary'
                                : 'outline'
                            }
                            className="text-xs"
                          >
                            {CAPA_SEVERITY_LABELS[capa.severity]}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {capa.title}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <Badge className={STATUS_COLORS[capa.status]}>
                        {CAPA_STATUS_LABELS[capa.status]}
                      </Badge>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Workflow Status Overview */}
      <Card>
        <CardHeader>
          <CardTitle>워크플로우 현황</CardTitle>
          <CardDescription>단계별 CAPA 진행 현황</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {(Object.keys(CAPA_STATUS_LABELS) as CAPAStatus[]).map((status) => {
              const StatusIcon = STATUS_ICONS[status];
              const count = dashboardStats?.byStatus[status] || 0;
              return (
                <div
                  key={status}
                  className={`p-4 rounded-lg text-center ${STATUS_COLORS[status]} cursor-pointer hover:opacity-80 transition-opacity`}
                  onClick={() => setStatusFilter(status)}
                >
                  <StatusIcon className="h-6 w-6 mx-auto mb-2" />
                  <div className="text-2xl font-bold">{count}</div>
                  <div className="text-xs">{CAPA_STATUS_LABELS[status]}</div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
