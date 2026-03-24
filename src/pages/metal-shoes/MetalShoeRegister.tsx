import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useShallow } from 'zustand/react/shallow';
import { useNavigate } from 'react-router-dom';
import { useMetalShoeStore } from '../../stores/metalShoeStore';
import { useAuthStore } from '../../stores/authStore';
import { syncCaseToReturnDashboard } from '../../services/metalShoeSyncService';
import { AlertTriangle, CheckCircle, Plus, FileSpreadsheet, ArrowLeft, Info } from 'lucide-react';

import ManualEntryForm from '../../components/metal-shoes/ManualEntryForm';
import ExcelImportPanel from '../../components/metal-shoes/ExcelImportPanel';
import type { ManualFormData } from '../../components/metal-shoes/ManualEntryForm';

type TabMode = 'manual' | 'import';

const INITIAL_FORM: ManualFormData = {
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

// Bottom(창) 업체만 Return Dashboard 자동 연동
const BOTTOM_SUPPLIER_IDS = [
  'TAESUNG_RG_OUTSOLE', 'TAESUNG_RG_STOCKFIT', 'TAESUNG_CC', 'EZ', 'HVC',
  'SOC_TRANG', 'MTL_WH_MIDSOLE', 'MTL_WH_OUTSOLE', 'BOTTOM_B3', 'BOTTOM_B3_STOCKFIT',
  'TSRG_OUTSOLE_OUTBOUND', 'TSRG_STOCKFIT_OUTBOUND',
];

export default function MetalShoeRegister() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [tab, setTab] = useState<TabMode>('manual');
  const [form, setForm] = useState<ManualFormData>(INITIAL_FORM);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [importResult, setImportResult] = useState<{ count: number } | null>(null);
  const [syncWarning, setSyncWarning] = useState<string | null>(null);

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
      const userInfo = { uid: user.id, email: user.email, displayName: user.name };
      const newCase = await createCase(
        { ...form, year: 0, month: 0, week: '', weekNumber: 0, status: 'registered', createdBy: userInfo },
        userInfo
      );
      if (BOTTOM_SUPPLIER_IDS.includes(form.supplierId)) {
        try {
          const rdId = await syncCaseToReturnDashboard(newCase, userInfo);
          if (rdId) {
            updateCase(newCase.year, newCase.id, { returnDashboardIssueId: rdId });
          }
        } catch {
          setSyncWarning('Return Dashboard 동기화 실패 — QOS 자동 수집으로 15분 내 반영됩니다.');
          setTimeout(() => setSyncWarning(null), 8000);
        }
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
      {syncWarning && (
        <div className="flex items-center gap-2 rounded-lg bg-yellow-50 border border-yellow-200 px-4 py-3 text-sm text-yellow-700">
          <Info className="h-4 w-4" />
          {syncWarning}
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
        <ManualEntryForm
          form={form}
          setForm={setForm}
          suppliers={suppliers}
          saving={saving}
          onSupplierChange={handleSupplierChange}
          onSubmit={handleSubmit}
        />
      )}

      {/* Import Tab */}
      {tab === 'import' && user && (
        <ExcelImportPanel
          userId={user.id}
          userEmail={user.email}
          userName={user.name}
          createBulkCases={createBulkCases}
          onError={(msg) => setError(msg)}
          onImportSuccess={(count, failed) => {
            setImportResult({ count });
            if (failed && failed.length > 0) {
              setError(`${failed.length}건 실패: ${failed.join(', ')}`);
            } else {
              setError(null);
            }
          }}
        />
      )}
    </div>
  );
}
