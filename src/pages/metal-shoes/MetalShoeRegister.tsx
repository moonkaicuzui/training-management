import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useShallow } from 'zustand/react/shallow';
import { useNavigate } from 'react-router-dom';
import { useMetalShoeStore } from '../../stores/metalShoeStore';
import { useAuthStore } from '../../stores/authStore';
import { parseMetalShoeExcel } from '../../utils/metalShoeExcelParser';
import { syncCaseToReturnDashboard } from '../../services/metalShoeSyncService';
import { Loader2, Upload, Plus, AlertTriangle, CheckCircle, FileSpreadsheet, ArrowLeft } from 'lucide-react';
import type { MetalShoeCase, MetalShoeComponent, MetalShoeSide, XraySentStatus, MetalConfirm } from '../../types/metalShoe';

type TabMode = 'manual' | 'import';

interface FormData {
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

const INITIAL_FORM: FormData = {
  detectionDate: new Date().toISOString().split('T')[0],
  factory: '',
  line: '',
  model: '',
  pgsc: '',
  poNumber: '',
  destination: '',
  orderQty: 0,
  size: '',
  supplierId: '',
  supplierName: '',
  component: 'BOTTOM',
  side: 'RIGHT',
  piecesQty: 1,
  cGradePairs: 1,
  xraySentStatus: 'NOT_SENT',
  metalConfirm: 'NOT_YET',
  remark: '',
  isInternalOperation: false,
};

export default function MetalShoeRegister() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [tab, setTab] = useState<TabMode>('manual');
  const [form, setForm] = useState<FormData>(INITIAL_FORM);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Import state
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importPreview, setImportPreview] = useState<{
    cases: Array<Omit<MetalShoeCase, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>>;
    errors: Array<{ row: number; message: string }>;
    unmatchedSuppliers: string[];
  } | null>(null);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ count: number } | null>(null);

  const { createCase, createBulkCases, updateCase, fetchSuppliers, suppliers } = useMetalShoeStore(
    useShallow((state) => ({
      createCase: state.createCase,
      createBulkCases: state.createBulkCases,
      updateCase: state.updateCase,
      fetchSuppliers: state.fetchSuppliers,
      suppliers: state.suppliers,
    }))
  );

  const user = useAuthStore((state) => state.user);

  useEffect(() => {
    fetchSuppliers();
  }, [fetchSuppliers]);

  const handleSupplierChange = (supplierId: string) => {
    const supplier = suppliers.find((s) => s.id === supplierId);
    setForm((prev) => ({
      ...prev,
      supplierId,
      supplierName: supplier?.name || '',
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    setError(null);
    setSuccess(false);
    try {
      const newCase = await createCase(
        { ...form, year: 0, month: 0, week: '', weekNumber: 0, status: 'registered', createdBy: { uid: user.id, email: user.email, displayName: user.name } },
        { uid: user.id, email: user.email, displayName: user.name }
      );
      // Bottom(창) 업체만 Return Dashboard 자동 연동
      const BOTTOM_SUPPLIER_IDS = ['TAESUNG_RG_OUTSOLE', 'TAESUNG_RG_STOCKFIT', 'TAESUNG_CC', 'EZ', 'HVC', 'SOC_TRANG', 'MTL_WH_MIDSOLE', 'MTL_WH_OUTSOLE', 'BOTTOM_B3', 'BOTTOM_B3_STOCKFIT', 'TSRG_OUTSOLE_OUTBOUND', 'TSRG_STOCKFIT_OUTBOUND'];
      if (BOTTOM_SUPPLIER_IDS.includes(form.supplierId)) {
        syncCaseToReturnDashboard(newCase, { uid: user.id, email: user.email, displayName: user.name })
          .then((rdId) => {
            if (rdId) {
              updateCase(newCase.year, newCase.id, { returnDashboardIssueId: rdId });
            }
          })
          .catch(() => { /* 동기화 실패는 무시 */ });
      }
      setSuccess(true);
      setForm(INITIAL_FORM);
      setTimeout(() => setSuccess(false), 5000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create case');
    } finally {
      setSaving(false);
    }
  };

  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportFile(file);
    setImportResult(null);
    try {
      const buffer = await file.arrayBuffer();
      const result = parseMetalShoeExcel(buffer);
      setImportPreview(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to parse Excel');
    }
  }, []);

  const handleImport = async () => {
    if (!importPreview || !user) return;
    setImporting(true);
    setError(null);
    try {
      const count = await createBulkCases(
        importPreview.cases.map((c) => ({ ...c, status: 'registered' as const, createdBy: { uid: user.id, email: user.email, displayName: user.name } })),
        { uid: user.id, email: user.email, displayName: user.name }
      );
      setImportResult({ count });
      setImportPreview(null);
      setImportFile(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Import failed');
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/equipment/metal-shoes')} className="rounded-lg p-2 hover:bg-gray-100">
          <ArrowLeft className="h-5 w-5 text-gray-600" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-gray-900 sm:text-2xl">
            {t('metalShoe.register', 'Register Metal Shoe Case')}
          </h1>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-lg bg-gray-100 p-1">
        <button
          onClick={() => setTab('manual')}
          className={`flex items-center gap-1.5 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
            tab === 'manual' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <Plus className="h-4 w-4" />
          {t('metalShoe.manualEntry', 'Manual Entry')}
        </button>
        <button
          onClick={() => setTab('import')}
          className={`flex items-center gap-1.5 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
            tab === 'import' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <FileSpreadsheet className="h-4 w-4" />
          {t('metalShoe.excelImport', 'Excel Import')}
        </button>
      </div>

      {/* Status Messages */}
      {success && (
        <div className="flex items-center gap-2 rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700">
          <CheckCircle className="h-4 w-4" />
          {t('metalShoe.caseCreated', 'Case registered successfully')}
        </div>
      )}
      {error && (
        <div className="flex items-center gap-2 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          <AlertTriangle className="h-4 w-4" />
          {error}
        </div>
      )}
      {importResult && (
        <div className="flex items-center gap-2 rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700">
          <CheckCircle className="h-4 w-4" />
          {t('metalShoe.importSuccess', '{{count}} cases imported successfully', { count: importResult.count })}
        </div>
      )}

      {/* Manual Entry Tab */}
      {tab === 'manual' && (
        <form onSubmit={handleSubmit} className="rounded-lg border border-gray-200 bg-white p-6">
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
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
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
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
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
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
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
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
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
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
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
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
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
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
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
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
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
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            {/* Supplier */}
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">
                {t('metalShoe.supplier', 'Supplier')} *
              </label>
              <select
                value={form.supplierId}
                onChange={(e) => handleSupplierChange(e.target.value)}
                required
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
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
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
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
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            {/* X-Ray Status */}
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">X-Ray Status</label>
              <select
                value={form.xraySentStatus}
                onChange={(e) => setForm((p) => ({ ...p, xraySentStatus: e.target.value as XraySentStatus }))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
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
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
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
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
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
      )}

      {/* Import Tab */}
      {tab === 'import' && (
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <div className="mb-4">
            <p className="text-sm text-gray-600">
              {t('metalShoe.importDesc', 'Upload the existing Metal Found Shoe Excel file. The system will match supplier names to standard IDs.')}
            </p>
          </div>

          {/* File Upload */}
          <div className="mb-6">
            <label className="flex cursor-pointer flex-col items-center gap-2 rounded-lg border-2 border-dashed border-gray-300 p-8 hover:border-blue-400 hover:bg-blue-50">
              <Upload className="h-8 w-8 text-gray-400" />
              <span className="text-sm font-medium text-gray-600">
                {importFile ? importFile.name : t('metalShoe.dropExcel', 'Click to upload Excel file (.xlsx)')}
              </span>
              <input
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>
          </div>

          {/* Preview */}
          {importPreview && (
            <div className="space-y-4">
              {/* Summary */}
              <div className="flex flex-wrap gap-3">
                <span className="rounded-full bg-blue-100 px-3 py-1 text-sm text-blue-700">
                  {importPreview.cases.length} {t('metalShoe.casesFound', 'cases found')}
                </span>
                {importPreview.errors.length > 0 && (
                  <span className="rounded-full bg-red-100 px-3 py-1 text-sm text-red-700">
                    {importPreview.errors.length} {t('metalShoe.errors', 'errors')}
                  </span>
                )}
                {importPreview.unmatchedSuppliers.length > 0 && (
                  <span className="rounded-full bg-amber-100 px-3 py-1 text-sm text-amber-700">
                    {importPreview.unmatchedSuppliers.length} {t('metalShoe.unmatchedSuppliers', 'unmatched suppliers')}
                  </span>
                )}
              </div>

              {/* Unmatched Suppliers */}
              {importPreview.unmatchedSuppliers.length > 0 && (
                <div className="rounded-lg bg-amber-50 border border-amber-200 p-3">
                  <p className="mb-1 text-xs font-medium text-amber-700">
                    {t('metalShoe.unmatchedWarning', 'These supplier names could not be matched:')}
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {importPreview.unmatchedSuppliers.map((s) => (
                      <span key={s} className="rounded bg-amber-100 px-2 py-0.5 text-xs text-amber-800">{s}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Errors */}
              {importPreview.errors.length > 0 && (
                <div className="max-h-32 overflow-y-auto rounded-lg bg-red-50 border border-red-200 p-3">
                  {importPreview.errors.map((err, i) => (
                    <p key={i} className="text-xs text-red-700">Row {err.row}: {err.message}</p>
                  ))}
                </div>
              )}

              {/* Preview Table */}
              {importPreview.cases.length > 0 && (
                <div className="max-h-64 overflow-auto rounded-lg border border-gray-200">
                  <table className="w-full text-xs">
                    <thead className="sticky top-0 bg-gray-50">
                      <tr>
                        <th className="px-2 py-1.5 text-left font-medium text-gray-500">Date</th>
                        <th className="px-2 py-1.5 text-left font-medium text-gray-500">Factory</th>
                        <th className="px-2 py-1.5 text-left font-medium text-gray-500">Model</th>
                        <th className="px-2 py-1.5 text-left font-medium text-gray-500">Supplier</th>
                        <th className="px-2 py-1.5 text-left font-medium text-gray-500">Component</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {importPreview.cases.slice(0, 20).map((c, i) => (
                        <tr key={i} className="hover:bg-gray-50">
                          <td className="px-2 py-1.5 text-gray-700">{c.detectionDate}</td>
                          <td className="px-2 py-1.5 text-gray-700">{c.factory}</td>
                          <td className="px-2 py-1.5 text-gray-700">{c.model}</td>
                          <td className="px-2 py-1.5">
                            <span className={c.supplierId === 'UNKNOWN' ? 'text-red-600 font-medium' : 'text-gray-700'}>
                              {c.supplierName}
                            </span>
                          </td>
                          <td className="px-2 py-1.5 text-gray-700">{c.component}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {importPreview.cases.length > 20 && (
                    <p className="px-2 py-1 text-center text-xs text-gray-400">
                      ... {t('metalShoe.moreRows', 'and {{count}} more', { count: importPreview.cases.length - 20 })}
                    </p>
                  )}
                </div>
              )}

              {/* Import Button */}
              <div className="flex justify-end">
                <button
                  onClick={handleImport}
                  disabled={importing || importPreview.cases.length === 0}
                  className="flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {importing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                  {t('metalShoe.importCases', 'Import {{count}} Cases', { count: importPreview.cases.length })}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
