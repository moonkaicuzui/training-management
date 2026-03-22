/**
 * 금속 발견 신발 수동 입력 폼
 */
import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { Loader2, Plus } from 'lucide-react';
import type { MetalShoeComponent, MetalShoeSide, XraySentStatus, MetalConfirm } from '../../types/metalShoe';

export interface ManualFormData {
  detectionDate: string;
  factory: string;
  line: string;
  model: string;
  pgsc: string;
  poNumber: string;
  destination: string;
  orderQty: number;
  size: string;
  supplierId: string;
  supplierName: string;
  component: MetalShoeComponent;
  side: MetalShoeSide;
  piecesQty: number;
  cGradePairs: number;
  xraySentStatus: XraySentStatus;
  metalConfirm: MetalConfirm;
  remark: string;
  isInternalOperation: boolean;
}

interface ManualEntryFormProps {
  form: ManualFormData;
  setForm: React.Dispatch<React.SetStateAction<ManualFormData>>;
  suppliers: Array<{ id: string; name: string }>;
  saving: boolean;
  onSupplierChange: (supplierId: string) => void;
  onSubmit: (e: React.FormEvent) => void;
}

const ManualEntryForm = memo(function ManualEntryForm({
  form,
  setForm,
  suppliers,
  saving,
  onSupplierChange,
  onSubmit,
}: ManualEntryFormProps) {
  const { t } = useTranslation();
  const inputClass = 'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500';

  return (
    <form onSubmit={onSubmit} className="rounded-lg border border-gray-200 bg-white p-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {/* Detection Date */}
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-600">
            {t('metalShoe.detectionDate', 'Detection Date')} *
          </label>
          <input
            type="date"
            value={form.detectionDate}
            onChange={(e) => setForm((p) => ({ ...p, detectionDate: e.target.value }))}
            required
            className={inputClass}
          />
        </div>

        {/* Factory */}
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-600">
            {t('common.factory', 'Factory')} *
          </label>
          <input
            type="text"
            value={form.factory}
            onChange={(e) => setForm((p) => ({ ...p, factory: e.target.value }))}
            required
            placeholder="RG D"
            className={inputClass}
          />
        </div>

        {/* Line */}
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-600">
            {t('common.line', 'Line')}
          </label>
          <input
            type="text"
            value={form.line}
            onChange={(e) => setForm((p) => ({ ...p, line: e.target.value }))}
            placeholder="10-1"
            className={inputClass}
          />
        </div>

        {/* Model */}
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-600">
            {t('metalShoe.model', 'Model')} *
          </label>
          <input
            type="text"
            value={form.model}
            onChange={(e) => setForm((p) => ({ ...p, model: e.target.value }))}
            required
            placeholder="VS PACE 2.0"
            className={inputClass}
          />
        </div>

        {/* PGSC */}
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-600">PGSC</label>
          <input
            type="text"
            value={form.pgsc}
            onChange={(e) => setForm((p) => ({ ...p, pgsc: e.target.value }))}
            placeholder="AC9-HP6012"
            className={inputClass}
          />
        </div>

        {/* PO Number */}
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-600">PO Number</label>
          <input
            type="text"
            value={form.poNumber}
            onChange={(e) => setForm((p) => ({ ...p, poNumber: e.target.value }))}
            placeholder="902275723"
            className={inputClass}
          />
        </div>

        {/* Destination */}
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-600">
            {t('metalShoe.destination', 'Destination')}
          </label>
          <input
            type="text"
            value={form.destination}
            onChange={(e) => setForm((p) => ({ ...p, destination: e.target.value }))}
            placeholder="United Kingdom"
            className={inputClass}
          />
        </div>

        {/* Order Qty */}
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-600">
            {t('metalShoe.orderQty', 'Order Qty')}
          </label>
          <input
            type="number"
            value={form.orderQty || ''}
            onChange={(e) => setForm((p) => ({ ...p, orderQty: Number(e.target.value) || 0 }))}
            className={inputClass}
          />
        </div>

        {/* Size */}
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-600">
            {t('metalShoe.size', 'Size')}
          </label>
          <input
            type="text"
            value={form.size}
            onChange={(e) => setForm((p) => ({ ...p, size: e.target.value }))}
            placeholder="10"
            className={inputClass}
          />
        </div>

        {/* Supplier */}
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-600">
            {t('metalShoe.supplier', 'Supplier')} *
          </label>
          <select
            value={form.supplierId}
            onChange={(e) => onSupplierChange(e.target.value)}
            required
            className={inputClass}
          >
            <option value="">{t('common.select', 'Select...')}</option>
            {suppliers.map((s) => (
              <option key={s.id} value={s.id}>{s.name} ({s.id})</option>
            ))}
          </select>
        </div>

        {/* Component */}
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-600">
            {t('metalShoe.component', 'Component')} *
          </label>
          <div className="flex gap-2">
            {(['BOTTOM', 'UPPER'] as const).map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setForm((p) => ({ ...p, component: c }))}
                className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  form.component === c
                    ? c === 'BOTTOM' ? 'bg-amber-100 text-amber-700' : 'bg-purple-100 text-purple-700'
                    : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        {/* Side */}
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-600">
            {t('metalShoe.side', 'Side')} *
          </label>
          <div className="flex gap-2">
            {(['RIGHT', 'LEFT'] as const).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setForm((p) => ({ ...p, side: s }))}
                className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  form.side === s ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Pieces Qty */}
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-600">
            {t('metalShoe.piecesQty', 'Pieces Qty')}
          </label>
          <input
            type="number"
            value={form.piecesQty}
            onChange={(e) => setForm((p) => ({ ...p, piecesQty: Number(e.target.value) || 1 }))}
            min={1}
            className={inputClass}
          />
        </div>

        {/* C-Grade Pairs */}
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-600">C-Grade Pairs</label>
          <input
            type="number"
            value={form.cGradePairs}
            onChange={(e) => setForm((p) => ({ ...p, cGradePairs: Number(e.target.value) || 0 }))}
            step="0.5"
            min={0}
            className={inputClass}
          />
        </div>

        {/* X-Ray Status */}
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-600">X-Ray Status</label>
          <select
            value={form.xraySentStatus}
            onChange={(e) => setForm((p) => ({ ...p, xraySentStatus: e.target.value as XraySentStatus }))}
            className={inputClass}
          >
            <option value="NOT_SENT">Not Sent</option>
            <option value="OK">OK (Sent)</option>
            <option value="N/A">N/A</option>
          </select>
        </div>

        {/* Metal Confirm */}
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-600">Metal Confirm</label>
          <select
            value={form.metalConfirm}
            onChange={(e) => setForm((p) => ({ ...p, metalConfirm: e.target.value as MetalConfirm }))}
            className={inputClass}
          >
            <option value="NOT_YET">Not Yet</option>
            <option value="YES">Yes</option>
            <option value="NO">No</option>
          </select>
        </div>

        {/* Remark */}
        <div className="sm:col-span-2 lg:col-span-3">
          <label className="mb-1 block text-xs font-medium text-gray-600">
            {t('common.remark', 'Remark')}
          </label>
          <textarea
            value={form.remark}
            onChange={(e) => setForm((p) => ({ ...p, remark: e.target.value }))}
            rows={2}
            className={inputClass}
          />
        </div>
      </div>

      {/* Submit */}
      <div className="mt-6 flex justify-end">
        <button
          type="submit"
          disabled={saving || !form.detectionDate || !form.factory || !form.model || !form.supplierId}
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
          {t('metalShoe.registerCase', 'Register Case')}
        </button>
      </div>
    </form>
  );
});
export default ManualEntryForm;
