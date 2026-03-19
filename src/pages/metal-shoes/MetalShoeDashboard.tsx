import { useEffect, useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useShallow } from 'zustand/react/shallow';
import { useNavigate } from 'react-router-dom';
import { useMetalShoeStore } from '../../stores/metalShoeStore';
import { Loader2, AlertTriangle, Package, Shield, Send, CheckCircle, TrendingUp, Factory } from 'lucide-react';

// Dynamic chart imports — set to null if unavailable
let LazyBarChart: React.ComponentType<any> | null = null;
let LazyLineChart: React.ComponentType<any> | null = null;
try {
  const mod = await import('../../components/charts/LazyCharts');
  LazyBarChart = mod.LazyBarChart;
  LazyLineChart = mod.LazyLineChart;
} catch { /* charts unavailable */ }

export default function MetalShoeDashboard() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [selectedWeek, setSelectedWeek] = useState<number | undefined>(undefined);

  const { dashboardKPIs, isLoading, error, fetchDashboardKPIs, fetchSuppliers, suppliers } = useMetalShoeStore(
    useShallow((state) => ({
      dashboardKPIs: state.dashboardKPIs,
      isLoading: state.isLoading,
      error: state.error,
      fetchDashboardKPIs: state.fetchDashboardKPIs,
      fetchSuppliers: state.fetchSuppliers,
      suppliers: state.suppliers,
    }))
  );

  useEffect(() => {
    fetchDashboardKPIs(selectedYear, selectedWeek);
    fetchSuppliers();
  }, [selectedYear, selectedWeek, fetchDashboardKPIs, fetchSuppliers]);

  const kpi = dashboardKPIs;

  const supplierChartData = useMemo(() => {
    if (!kpi) return [];
    return Object.entries(kpi.bySupplier)
      .sort(([, a], [, b]) => b.total - a.total)
      .slice(0, 10)
      .map(([id, data]) => {
        const supplier = suppliers.find((s) => s.id === id);
        return { name: supplier?.shortName || id, ...data };
      });
  }, [kpi, suppliers]);

  const weeklyChartData = useMemo(() => {
    if (!kpi) return [];
    return kpi.weeklyTrend.map((w) => ({ name: w.week, ...w }));
  }, [kpi]);

  const factoryData = useMemo(() => {
    if (!kpi) return [];
    return Object.entries(kpi.byFactory)
      .sort(([, a], [, b]) => b.total - a.total)
      .map(([factory, data]) => ({ factory, ...data }));
  }, [kpi]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900 sm:text-2xl">
            {t('metalShoe.dashboard.title', 'Metal Found in Shoes')}
          </h1>
          <p className="text-sm text-gray-500">
            {t('metalShoe.dashboard.subtitle', 'Metal detection case tracking and analysis')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
          >
            {[currentYear, currentYear - 1, currentYear - 2].map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
          <select
            value={selectedWeek ?? ''}
            onChange={(e) => setSelectedWeek(e.target.value ? Number(e.target.value) : undefined)}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
          >
            <option value="">{t('metalShoe.allWeeks', 'All Weeks')}</option>
            {Array.from({ length: 52 }, (_, i) => i + 1).map((w) => (
              <option key={w} value={w}>W{String(w).padStart(2, '0')}</option>
            ))}
          </select>
          <button
            onClick={() => navigate('/equipment/metal-shoes/register')}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            {t('metalShoe.register', 'Register Case')}
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertTriangle className="h-4 w-4" />
          <span>{error}</span>
        </div>
      )}

      {/* Loading */}
      {isLoading && !kpi && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        </div>
      )}

      {kpi && (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            <KPICard icon={Package} label={t('metalShoe.kpi.totalCases', 'Total Cases')} value={kpi.totalCases} color="blue" />
            <KPICard icon={Shield} label={t('metalShoe.kpi.bottomCases', 'Bottom')} value={kpi.bottomCases} color="amber" />
            <KPICard icon={TrendingUp} label={t('metalShoe.kpi.upperCases', 'Upper')} value={kpi.upperCases} color="purple" />
            <KPICard icon={Send} label={t('metalShoe.kpi.xrayPending', 'X-Ray Pending')} value={kpi.xrayPending} color="orange" />
            <KPICard icon={AlertTriangle} label={t('metalShoe.kpi.actionPending', 'Action Pending')} value={kpi.actionPending} color="red" />
            <KPICard icon={CheckCircle} label={t('metalShoe.kpi.closed', 'Closed')} value={kpi.closedCases} color="green" />
          </div>

          {/* Factory Table */}
          {factoryData.length > 0 && (
            <div className="rounded-lg border border-gray-200 bg-white p-4">
              <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-900">
                <Factory className="h-4 w-4" />
                {t('metalShoe.byFactory', 'By Factory')}
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="px-3 py-2 text-left text-xs font-medium uppercase text-gray-500">{t('common.factory', 'Factory')}</th>
                      <th className="px-3 py-2 text-right text-xs font-medium uppercase text-gray-500">{t('common.total', 'Total')}</th>
                      <th className="px-3 py-2 text-right text-xs font-medium uppercase text-gray-500">Bottom</th>
                      <th className="px-3 py-2 text-right text-xs font-medium uppercase text-gray-500">Upper</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {factoryData.map((f) => (
                      <tr key={f.factory} className="hover:bg-gray-50">
                        <td className="px-3 py-2 font-medium text-gray-900">{f.factory}</td>
                        <td className="px-3 py-2 text-right font-semibold text-gray-900">{f.total}</td>
                        <td className="px-3 py-2 text-right text-amber-600">{f.bottom}</td>
                        <td className="px-3 py-2 text-right text-purple-600">{f.upper}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Charts Row */}
          <div className="grid gap-4 lg:grid-cols-2">
            {/* Supplier Bar Chart */}
            {supplierChartData.length > 0 && (
              <div className="rounded-lg border border-gray-200 bg-white p-4">
                <h3 className="mb-3 text-sm font-semibold text-gray-900">
                  {t('metalShoe.topSuppliers', 'Top Suppliers')}
                </h3>
                <div className="h-64">
                  {LazyBarChart ? (
                    <LazyBarChart
                      data={supplierChartData}
                      xAxisKey="name"
                      bars={[
                        { dataKey: 'bottom', fill: '#f59e0b', name: 'Bottom' },
                        { dataKey: 'upper', fill: '#8b5cf6', name: 'Upper' },
                      ]}
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-sm text-gray-400">
                      {t('common.chartUnavailable', 'Chart unavailable')}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Weekly Trend */}
            {weeklyChartData.length > 0 && (
              <div className="rounded-lg border border-gray-200 bg-white p-4">
                <h3 className="mb-3 text-sm font-semibold text-gray-900">
                  {t('metalShoe.weeklyTrend', 'Weekly Trend')}
                </h3>
                <div className="h-64">
                  {LazyLineChart ? (
                    <LazyLineChart
                      data={weeklyChartData}
                      xAxisKey="name"
                      lines={[
                        { dataKey: 'total', stroke: '#3b82f6', name: 'Total' },
                        { dataKey: 'bottom', stroke: '#f59e0b', name: 'Bottom' },
                        { dataKey: 'upper', stroke: '#8b5cf6', name: 'Upper' },
                      ]}
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-sm text-gray-400">
                      {t('common.chartUnavailable', 'Chart unavailable')}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

// ─── KPI Card Component ──────────────────────────────────────
function KPICard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: React.ElementType;
  label: string;
  value: number;
  color: string;
}) {
  const colorMap: Record<string, string> = {
    blue: 'bg-blue-50 text-blue-600',
    amber: 'bg-amber-50 text-amber-600',
    purple: 'bg-purple-50 text-purple-600',
    orange: 'bg-orange-50 text-orange-600',
    red: 'bg-red-50 text-red-600',
    green: 'bg-green-50 text-green-600',
  };

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-3">
      <div className="flex items-center gap-2">
        <div className={`rounded-lg p-1.5 ${colorMap[color] || colorMap.blue}`}>
          <Icon className="h-4 w-4" />
        </div>
        <span className="text-xs text-gray-500">{label}</span>
      </div>
      <p className="mt-2 text-2xl font-bold text-gray-900">{value}</p>
    </div>
  );
}
