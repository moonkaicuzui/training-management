import { useEffect, useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useShallow } from 'zustand/react/shallow';
import { useMetalShoeStore } from '../../stores/metalShoeStore';
import { useAuthStore } from '../../stores/authStore';
import { Loader2, AlertTriangle, RefreshCw } from 'lucide-react';
import type { MetalShoeCase, MetalShoeStatus } from '../../types/metalShoe';
import TrackingFilters from '../../components/metal-shoes/TrackingFilters';
import TrackingTable from '../../components/metal-shoes/TrackingTable';
import CaseDetailDialog from '../../components/metal-shoes/CaseDetailDialog';

export default function MetalShoeTracking() {
  const { t } = useTranslation();
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<MetalShoeStatus | ''>('');
  const [supplierFilter, setSupplierFilter] = useState('');
  const [detailCase, setDetailCase] = useState<MetalShoeCase | null>(null);

  const { cases, isLoading, error, fetchCases, fetchSuppliers, suppliers, updateCase, addActionEvidence } = useMetalShoeStore(
    useShallow((state) => ({
      cases: state.cases,
      isLoading: state.isLoading,
      error: state.error,
      fetchCases: state.fetchCases,
      fetchSuppliers: state.fetchSuppliers,
      suppliers: state.suppliers,
      updateCase: state.updateCase,
      addActionEvidence: state.addActionEvidence,
    }))
  );
  const user = useAuthStore((state) => state.user);

  useEffect(() => {
    fetchCases({ year: selectedYear });
    fetchSuppliers();
  }, [selectedYear, fetchCases, fetchSuppliers]);

  const filtered = useMemo(() => {
    return cases.filter((c) => {
      if (statusFilter && c.status !== statusFilter) return false;
      if (supplierFilter && c.supplierId !== supplierFilter) return false;
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        return (
          c.model.toLowerCase().includes(term) ||
          c.factory.toLowerCase().includes(term) ||
          c.supplierName.toLowerCase().includes(term) ||
          c.pgsc.toLowerCase().includes(term) ||
          c.poNumber.toLowerCase().includes(term)
        );
      }
      return true;
    });
  }, [cases, statusFilter, supplierFilter, searchTerm]);

  const handleStatusChange = async (c: MetalShoeCase, newStatus: MetalShoeStatus) => {
    try {
      await updateCase(c.year, c.id, { status: newStatus });
    } catch {
      // error is handled by store
    }
  };

  const uniqueSuppliers = useMemo(() => {
    const ids = new Set(cases.map((c) => c.supplierId));
    return suppliers.filter((s) => ids.has(s.id));
  }, [cases, suppliers]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-xl font-bold text-gray-900 sm:text-2xl">
          {t('metalShoe.tracking.title', 'Case Tracking')}
        </h1>
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
          <button
            onClick={() => fetchCases({ year: selectedYear })}
            disabled={isLoading}
            className="flex items-center gap-1 rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Filters */}
      <TrackingFilters
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        statusFilter={statusFilter}
        onStatusChange={setStatusFilter}
        supplierFilter={supplierFilter}
        onSupplierChange={setSupplierFilter}
        suppliers={uniqueSuppliers}
      />

      {/* Count */}
      <p className="text-xs text-gray-500">
        {t('metalShoe.showingCases', '{{count}} cases', { count: filtered.length })}
      </p>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertTriangle className="h-4 w-4" />
          <span>{error}</span>
        </div>
      )}

      {/* Loading */}
      {isLoading && cases.length === 0 && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        </div>
      )}

      {/* Table */}
      {!isLoading && filtered.length === 0 ? (
        <div className="py-12 text-center text-sm text-gray-500">
          {t('common.noData', 'No data available')}
        </div>
      ) : (
        <TrackingTable cases={filtered} onViewDetail={setDetailCase} />
      )}

      {/* Detail Modal */}
      {detailCase && (
        <CaseDetailDialog
          detailCase={detailCase}
          userEmail={user?.email || ''}
          onClose={() => setDetailCase(null)}
          onStatusChange={handleStatusChange}
          onUpdateCase={updateCase}
          onAddActionEvidence={addActionEvidence}
          onRefresh={(year) => fetchCases({ year })}
        />
      )}
    </div>
  );
}
