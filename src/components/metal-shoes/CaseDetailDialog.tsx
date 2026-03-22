import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Loader2, ExternalLink, Download, Camera } from 'lucide-react';
import { syncActionFromReturnDashboard } from '../../services/metalShoeSyncService';
import type { MetalShoeCase, MetalShoeStatus } from '../../types/metalShoe';
import { logger } from '@/utils/logger';

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

function DetailField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="text-[10px] font-medium uppercase text-gray-400">{label}</span>
      <p className="text-sm text-gray-900">{value}</p>
    </div>
  );
}

/** Bottom 업체 판별 */
function isBottomSupplier(supplierId: string): boolean {
  const bottomIds = [
    'TAESUNG_RG_OUTSOLE', 'TAESUNG_RG_STOCKFIT', 'TAESUNG_CC',
    'EZ', 'HVC', 'SOC_TRANG',
    'MTL_WH_MIDSOLE', 'MTL_WH_OUTSOLE',
    'BOTTOM_B3', 'BOTTOM_B3_STOCKFIT',
    'TSRG_OUTSOLE_OUTBOUND', 'TSRG_STOCKFIT_OUTBOUND',
  ];
  return bottomIds.includes(supplierId);
}

interface CaseDetailDialogProps {
  detailCase: MetalShoeCase;
  userEmail: string;
  onClose: () => void;
  onStatusChange: (c: MetalShoeCase, newStatus: MetalShoeStatus) => Promise<void>;
  onUpdateCase: (year: number, id: string, data: Partial<MetalShoeCase>) => Promise<void>;
  onAddActionEvidence: (year: number, id: string, data: { actionContent: string; evidencePhotos: string[]; submittedBy: string }) => Promise<void>;
  onRefresh: (year: number) => Promise<void>;
}

export default function CaseDetailDialog({
  detailCase: initialCase,
  userEmail,
  onClose,
  onStatusChange,
  onUpdateCase,
  onAddActionEvidence,
  onRefresh,
}: CaseDetailDialogProps) {
  const { t } = useTranslation();
  const [detailCase, setDetailCase] = useState(initialCase);
  const [showActionForm, setShowActionForm] = useState(false);
  const [actionContent, setActionContent] = useState('');
  const [actionPhotos, setActionPhotos] = useState<File[]>([]);
  const [submittingAction, setSubmittingAction] = useState(false);

  async function handleDownloadNotice() {
    const { generateSupplierNotice } = await import('../../utils/metalShoeSupplierNotice');
    await generateSupplierNotice(
      [detailCase],
      detailCase.supplierName,
      detailCase.year,
      detailCase.weekNumber
    );
  }

  async function handleSubmitAction() {
    if (!actionContent.trim()) return;
    setSubmittingAction(true);
    try {
      const photoUrls: string[] = [];
      if (actionPhotos.length > 0) {
        const { ref, uploadBytes, getDownloadURL } = await import('firebase/storage');
        const { storage } = await import('../../services/firebase');
        for (const photo of actionPhotos) {
          const storageRef = ref(storage, `metal-shoe-actions/${detailCase.id}/${Date.now()}_${photo.name}`);
          const snap = await uploadBytes(storageRef, photo);
          const url = await getDownloadURL(snap.ref);
          photoUrls.push(url);
        }
      }

      await onAddActionEvidence(detailCase.year, detailCase.id, {
        actionContent,
        evidencePhotos: photoUrls,
        submittedBy: userEmail,
      });

      setShowActionForm(false);
      setActionContent('');
      setActionPhotos([]);
      await onRefresh(detailCase.year);
    } catch (err) {
      logger.error('Action submit failed:', err);
    } finally {
      setSubmittingAction(false);
    }
  }

  function renderActionList() {
    if (!detailCase?.actionPlanActions || detailCase.actionPlanActions.length === 0) {
      return <p className="text-xs text-gray-400">{t('metalShoe.noActionPlan', 'No action plan yet')}</p>;
    }
    return (
      <div className="space-y-1.5">
        {detailCase.actionPlanActions.map((action, idx) => (
          <div key={idx} className="rounded-lg bg-gray-50 px-3 py-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-medium text-gray-700">{action.supplierName}</span>
              <span className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${
                action.actionStatus === 'DONE' ? 'bg-green-100 text-green-700' :
                action.actionStatus === 'OVERDUE' ? 'bg-red-100 text-red-700' :
                'bg-yellow-100 text-yellow-700'
              }`}>
                {action.actionStatus}
              </span>
            </div>
            {action.remark && <p className="mt-1 text-gray-500">{action.remark}</p>}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-2xl rounded-xl bg-white p-6 shadow-2xl max-h-[80vh] overflow-y-auto">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-900">
            {t('metalShoe.caseDetail', 'Case Detail')}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">&times;</button>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <DetailField label="Detection Date" value={detailCase.detectionDate} />
          <DetailField label="Week" value={detailCase.week} />
          <DetailField label="Factory" value={detailCase.factory} />
          <DetailField label="Line" value={detailCase.line || '-'} />
          <DetailField label="Model" value={detailCase.model} />
          <DetailField label="PGSC" value={detailCase.pgsc || '-'} />
          <DetailField label="PO Number" value={detailCase.poNumber || '-'} />
          <DetailField label="Destination" value={detailCase.destination || '-'} />
          <DetailField label="Order Qty" value={String(detailCase.orderQty)} />
          <DetailField label="Size" value={detailCase.size || '-'} />
          <DetailField label="Supplier" value={`${detailCase.supplierName} (${detailCase.supplierId})`} />
          <DetailField label="Component" value={detailCase.component} />
          <DetailField label="Side" value={detailCase.side} />
          <DetailField label="Pieces" value={String(detailCase.piecesQty)} />
          <DetailField label="C-Grade Pairs" value={String(detailCase.cGradePairs)} />
          <DetailField label="X-Ray" value={detailCase.xraySentStatus} />
          <DetailField label="Metal Confirm" value={detailCase.metalConfirm} />
          <DetailField label="Remark" value={detailCase.remark || '-'} />
        </div>

        {/* Status Change */}
        <div className="mt-4 border-t border-gray-100 pt-4">
          <label className="mb-2 block text-xs font-medium text-gray-600">
            {t('metalShoe.changeStatus', 'Change Status')}
          </label>
          <div className="flex flex-wrap gap-1">
            {(Object.keys(STATUS_LABELS) as MetalShoeStatus[]).map((status) => (
              <button
                key={status}
                onClick={() => {
                  onStatusChange(detailCase, status);
                  setDetailCase({ ...detailCase, status });
                }}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                  detailCase.status === status
                    ? STATUS_COLORS[status] + ' ring-1 ring-offset-1'
                    : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
                }`}
              >
                {STATUS_LABELS[status]}
              </button>
            ))}
          </div>
        </div>

        {/* Action Plan Section */}
        <div className="mt-4 border-t border-gray-100 pt-4">
          <div className="mb-2 flex items-center justify-between">
            <label className="text-xs font-medium text-gray-600">
              {t('metalShoe.actionPlan', 'Action Plan')}
            </label>
            {detailCase.actionPlanStatus && (
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                detailCase.actionPlanStatus === 'submitted' ? 'bg-green-100 text-green-700' :
                detailCase.actionPlanStatus === 'overdue' ? 'bg-red-100 text-red-700' :
                'bg-yellow-100 text-yellow-700'
              }`}>
                {detailCase.actionPlanStatus}
              </span>
            )}
          </div>

          {detailCase.actionPlanDeadline && (
            <p className="mb-2 text-[10px] text-gray-400">
              Deadline: {detailCase.actionPlanDeadline}
              {new Date(detailCase.actionPlanDeadline) < new Date() && (
                <span className="ml-1 text-red-500 font-medium">OVERDUE</span>
              )}
            </p>
          )}

          {isBottomSupplier(detailCase.supplierId) ? (
            /* Bottom 업체: Return Dashboard 연동 */
            <div className="space-y-2">
              {detailCase.returnDashboardIssueId ? (
                <>
                  <div className="flex items-center justify-between rounded-lg bg-blue-50 px-3 py-2">
                    <div className="flex items-center gap-1.5 text-xs text-blue-700">
                      <ExternalLink className="h-3 w-3" />
                      <span>Return Dashboard: <span className="font-mono">{detailCase.returnDashboardIssueId.slice(0, 12)}...</span></span>
                    </div>
                    <button
                      onClick={async () => {
                        try {
                          const result = await syncActionFromReturnDashboard(detailCase.returnDashboardIssueId!);
                          if (result) {
                            await onUpdateCase(detailCase.year, detailCase.id, {
                              actionPlanActions: result.actions as MetalShoeCase['actionPlanActions'],
                              actionPlanStatus: result.status === 'resolved' ? 'submitted' : 'pending',
                              actionPlanLastSyncedAt: new Date().toISOString(),
                            });
                            setDetailCase({
                              ...detailCase,
                              actionPlanActions: result.actions as MetalShoeCase['actionPlanActions'],
                              actionPlanStatus: result.status === 'resolved' ? 'submitted' : 'pending',
                              actionPlanLastSyncedAt: new Date().toISOString(),
                            });
                          }
                        } catch { /* ignore sync errors */ }
                      }}
                      className="rounded bg-blue-100 px-2 py-1 text-[10px] font-medium text-blue-700 hover:bg-blue-200"
                    >
                      {t('metalShoe.syncAction', 'Sync Actions')}
                    </button>
                  </div>
                  {renderActionList()}
                </>
              ) : (
                <div className="rounded-lg bg-yellow-50 px-3 py-2 text-xs text-yellow-700">
                  Return Dashboard 연동 대기중...
                </div>
              )}

              {detailCase.actionPlanLastSyncedAt && (
                <p className="text-[10px] text-gray-400">
                  Last synced: {new Date(detailCase.actionPlanLastSyncedAt).toLocaleString()}
                </p>
              )}
            </div>
          ) : (
            /* Upper/Internal: 수동 액션플랜 */
            <div className="space-y-2">
              <button
                onClick={handleDownloadNotice}
                className="flex w-full items-center justify-center gap-2 rounded-lg border border-orange-200 bg-orange-50 px-3 py-2 text-xs font-medium text-orange-700 hover:bg-orange-100"
              >
                <Download className="h-3.5 w-3.5" />
                {t('metalShoe.downloadActionRequest', 'Download Action Request (PPTX)')}
              </button>

              {!showActionForm ? (
                <button
                  onClick={() => setShowActionForm(true)}
                  className="flex w-full items-center justify-center gap-2 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-xs font-medium text-green-700 hover:bg-green-100"
                >
                  <Camera className="h-3.5 w-3.5" />
                  {t('metalShoe.registerAction', 'Register Action Plan')}
                </button>
              ) : (
                <div className="space-y-2 rounded-lg border border-green-200 bg-green-50 p-3">
                  <textarea
                    value={actionContent}
                    onChange={(e) => setActionContent(e.target.value)}
                    placeholder={t('metalShoe.actionContentPlaceholder', 'Describe the action taken (root cause, corrective action, preventive action)...')}
                    rows={3}
                    className="w-full rounded border border-green-300 px-2 py-1.5 text-xs focus:border-green-500 focus:outline-none"
                  />
                  <div>
                    <label className="mb-1 block text-[10px] font-medium text-green-700">
                      {t('metalShoe.evidencePhotos', 'Evidence Photos')}
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={(e) => setActionPhotos(Array.from(e.target.files || []))}
                      className="w-full text-xs"
                    />
                    {actionPhotos.length > 0 && (
                      <p className="mt-0.5 text-[10px] text-green-600">{actionPhotos.length} file(s) selected</p>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={handleSubmitAction}
                      disabled={submittingAction || !actionContent.trim()}
                      className="flex-1 rounded bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700 disabled:opacity-50"
                    >
                      {submittingAction ? <Loader2 className="inline h-3 w-3 animate-spin" /> : t('metalShoe.submitAction', 'Submit')}
                    </button>
                    <button
                      onClick={() => { setShowActionForm(false); setActionContent(''); setActionPhotos([]); }}
                      className="rounded px-3 py-1.5 text-xs text-gray-500 hover:bg-gray-100"
                    >
                      {t('common.cancel', 'Cancel')}
                    </button>
                  </div>
                </div>
              )}

              {renderActionList()}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
