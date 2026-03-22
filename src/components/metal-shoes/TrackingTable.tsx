import { Eye } from 'lucide-react';
import type { MetalShoeCase, MetalShoeStatus } from '../../types/metalShoe';

const STATUS_COLORS: Record<MetalShoeStatus, string> = {
  registered: 'bg-gray-100 text-gray-700',
  xray_sent: 'bg-blue-100 text-blue-700',
  confirmed: 'bg-indigo-100 text-indigo-700',
  action_requested: 'bg-orange-100 text-orange-700',
  action_received: 'bg-cyan-100 text-cyan-700',
  closed: 'bg-green-100 text-green-700',
};

const STATUS_LABELS: Record<MetalShoeStatus, string> = {
  registered: 'Registered',
  xray_sent: 'X-Ray Sent',
  confirmed: 'Confirmed',
  action_requested: 'Action Requested',
  action_received: 'Action Received',
  closed: 'Closed',
};

interface TrackingTableProps {
  cases: MetalShoeCase[];
  onViewDetail: (c: MetalShoeCase) => void;
}

export default function TrackingTable({ cases, onViewDetail }: TrackingTableProps) {
  return (
    <>
      {/* Mobile Cards */}
      <div className="space-y-2 sm:hidden">
        {cases.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => onViewDetail(c)}
            className="w-full rounded-lg border border-gray-200 bg-white p-3 text-left hover:bg-gray-50"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-900">{c.model}</span>
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${STATUS_COLORS[c.status]}`}>
                {STATUS_LABELS[c.status]}
              </span>
            </div>
            <div className="mt-1 flex items-center gap-2 text-xs text-gray-500">
              <span>{c.detectionDate}</span>
              <span>•</span>
              <span>{c.factory}</span>
              <span>•</span>
              <span>{c.supplierName}</span>
            </div>
          </button>
        ))}
      </div>

      {/* Desktop Table */}
      <div className="hidden max-h-[600px] overflow-auto rounded-lg border border-gray-200 sm:block">
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-gray-50">
            <tr>
              <th className="px-3 py-2 text-left text-xs font-medium uppercase text-gray-500">Date</th>
              <th className="px-3 py-2 text-left text-xs font-medium uppercase text-gray-500">Week</th>
              <th className="px-3 py-2 text-left text-xs font-medium uppercase text-gray-500">Factory</th>
              <th className="px-3 py-2 text-left text-xs font-medium uppercase text-gray-500">Model</th>
              <th className="px-3 py-2 text-left text-xs font-medium uppercase text-gray-500">Supplier</th>
              <th className="px-3 py-2 text-left text-xs font-medium uppercase text-gray-500">Component</th>
              <th className="px-3 py-2 text-left text-xs font-medium uppercase text-gray-500">X-Ray</th>
              <th className="px-3 py-2 text-left text-xs font-medium uppercase text-gray-500">Status</th>
              <th className="px-3 py-2 w-10" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {cases.map((c) => (
              <tr key={c.id} className="hover:bg-gray-50">
                <td className="px-3 py-2 text-gray-700">{c.detectionDate}</td>
                <td className="px-3 py-2 text-gray-500">{c.week}</td>
                <td className="px-3 py-2 text-gray-700">{c.factory}</td>
                <td className="px-3 py-2 font-medium text-gray-900">{c.model}</td>
                <td className="px-3 py-2 text-gray-700">{c.supplierName}</td>
                <td className="px-3 py-2">
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                    c.component === 'BOTTOM' ? 'bg-amber-100 text-amber-700' : 'bg-purple-100 text-purple-700'
                  }`}>
                    {c.component}
                  </span>
                </td>
                <td className="px-3 py-2">
                  <span className={`text-xs ${
                    c.xraySentStatus === 'OK' ? 'text-green-600' :
                    c.xraySentStatus === 'N/A' ? 'text-gray-400' : 'text-orange-600'
                  }`}>
                    {c.xraySentStatus}
                  </span>
                </td>
                <td className="px-3 py-2">
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${STATUS_COLORS[c.status]}`}>
                    {STATUS_LABELS[c.status]}
                  </span>
                </td>
                <td className="px-3 py-2">
                  <button
                    onClick={() => onViewDetail(c)}
                    className="text-gray-400 hover:text-blue-600"
                  >
                    <Eye className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
