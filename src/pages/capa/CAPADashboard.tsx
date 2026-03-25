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
import { useShallow } from 'zustand/react/shallow';

import { logger } from '@/utils/logger';
import { useCAPAStore } from '@/stores/capaStore';
import type { CAPAStatus } from '@/types/capa';

const CAPA_STATUSES: CAPAStatus[] = ['discovery', 'investigation', 'action', 'verification', 'closed', 'rejected'];

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
  const { t } = useTranslation();
  const navigate = useNavigate();

  const {
    capas,
    dashboardStats,
    isLoading,
    error,
    fetchCAPAs,
    fetchDashboardStats,
  } = useCAPAStore(useShallow((state) => ({
    capas: state.capas,
    dashboardStats: state.dashboardStats,
    isLoading: state.isLoading,
    error: state.error,
    fetchCAPAs: state.fetchCAPAs,
    fetchDashboardStats: state.fetchDashboardStats,
  })));

  // Local state for filters - always initialized with default values
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Fetch data on mount
  useEffect(() => {
    Promise.all([fetchCAPAs(), fetchDashboardStats()]).catch((err) => { logger.error('CAPADashboard 초기 데이터 로드 실패:', err); });
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
            {t('capa.dashboardPage.title')}
          </h1>
          <p className="text-muted-foreground mt-1">
            {t('capa.dashboardPage.subtitle')}
          </p>
        </div>
        <Button onClick={() => navigate('/capa/new')}>
          <Plus className="h-4 w-4 mr-2" />
          {t('capa.dashboardPage.newCapa')}
        </Button>
      </div>

      {/* 에러 배너 */}
      {error && (
        <Card className="border-destructive bg-destructive/10">
          <CardContent className="flex items-center gap-2 py-3">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            <p className="text-destructive">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Statistics Cards */}
      {dashboardStats && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('capa.dashboardPage.totalCapa')}</CardTitle>
              <ShieldCheck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dashboardStats.total}</div>
              <p className="text-xs text-muted-foreground">
                {t('capa.dashboardPage.closedThisMonth', { count: dashboardStats.closedThisMonth })}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('capa.dashboardPage.inProgress')}</CardTitle>
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
                {t('capa.dashboardPage.overdue', { count: dashboardStats.overdue })}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('capa.dashboardPage.avgResolutionTime')}</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {t('capa.dashboardPage.days', { count: dashboardStats.averageResolutionDays })}
              </div>
              <p className="text-xs text-muted-foreground">
                {t('capa.dashboardPage.effectivenessRate', { rate: dashboardStats.effectivenessRate })}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('capa.dashboardPage.bySeverity')}</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Badge variant="destructive">
                  {t('capa.severityLabels.critical')}: {dashboardStats.bySeverity.critical || 0}
                </Badge>
                <Badge variant="secondary">
                  {t('capa.severityLabels.major')}: {dashboardStats.bySeverity.major || 0}
                </Badge>
                <Badge variant="outline">
                  {t('capa.severityLabels.minor')}: {dashboardStats.bySeverity.minor || 0}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>{t('capa.dashboardPage.capaList')}</CardTitle>
          <CardDescription>{t('capa.dashboardPage.capaListDesc')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder={t('capa.dashboardPage.searchPlaceholder')}
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
              <option value="all">{t('capa.dashboardPage.allStatus')}</option>
              {CAPA_STATUSES.map((value) => (
                <option key={value} value={value}>
                  {t(`capa.statusLabels.${value}`)}
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
                  <p>{t('capa.dashboardPage.noCapa')}</p>
                  <Button
                    variant="link"
                    onClick={() => navigate('/capa/new')}
                    className="mt-2"
                  >
                    {t('capa.dashboardPage.createFirst')}
                  </Button>
                </>
              ) : (
                <p>{t('capa.dashboardPage.noResults')}</p>
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
                            {t(`capa.typeLabels.${capa.type}`)}
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
                            {t(`capa.severityLabels.${capa.severity}`)}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {capa.title}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <Badge className={STATUS_COLORS[capa.status]}>
                        {t(`capa.statusLabels.${capa.status}`)}
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
          <CardTitle>{t('capa.dashboardPage.workflowStatus')}</CardTitle>
          <CardDescription>{t('capa.dashboardPage.workflowStatusDesc')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {CAPA_STATUSES.map((status) => {
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
                  <div className="text-xs">{t(`capa.statusLabels.${status}`)}</div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
