import { Search } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { MetalShoeStatus } from '../../types/metalShoe';

const STATUS_LABELS: Record<MetalShoeStatus, string> = {
  registered: 'Registered',
  xray_sent: 'X-Ray Sent',
  confirmed: 'Confirmed',
  action_requested: 'Action Requested',
  action_received: 'Action Received',
  closed: 'Closed',
};

interface Supplier {
  id: string;
  name: string;
}

interface TrackingFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  statusFilter: MetalShoeStatus | '';
  onStatusChange: (value: MetalShoeStatus | '') => void;
  supplierFilter: string;
  onSupplierChange: (value: string) => void;
  suppliers: Supplier[];
}

export default function TrackingFilters({
  searchTerm,
  onSearchChange,
  statusFilter,
  onStatusChange,
  supplierFilter,
  onSupplierChange,
  suppliers,
}: TrackingFiltersProps) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-wrap gap-2">
      <div className="relative flex-1 min-w-[200px]">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={t('common.search')}
          className="w-full rounded-lg border border-gray-300 pl-9 pr-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>
      <select
        value={statusFilter}
        onChange={(e) => onStatusChange(e.target.value as MetalShoeStatus | '')}
        className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
      >
        <option value="">{t('metalShoe.allStatuses', 'All Statuses')}</option>
        {Object.entries(STATUS_LABELS).map(([key, label]) => (
          <option key={key} value={key}>{label}</option>
        ))}
      </select>
      <select
        value={supplierFilter}
        onChange={(e) => onSupplierChange(e.target.value)}
        className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
      >
        <option value="">{t('metalShoe.allSuppliers', 'All Suppliers')}</option>
        {suppliers.map((s) => (
          <option key={s.id} value={s.id}>{s.name}</option>
        ))}
      </select>
    </div>
  );
}
