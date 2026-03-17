/**
 * Metal Detector History
 * Filterable table with detail modal and CA tracking
 */

import { useEffect, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Loader2, X, ClipboardList } from 'lucide-react';
import { EmptyState } from '@/components/common/EmptyState';
import { useMDInspectionStore } from '@/stores/mdInspectionStore';
import type { FactoryCode, InspectionResult, MDInspection, MDFailure, CAStatus } from '@/types/metalDetector';

const FACTORIES: FactoryCode[] = ['A', 'B', 'C', 'D'];
const CA_STATUS_COLORS: Record<CAStatus, string> = {
  pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  in_progress: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  completed: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  overdue: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
};

export default function MDHistory() {
  const { t } = useTranslation();
  const {
    inspections,
    failures,
    isLoading,
    filters,
    setFilters,
    fetchInspections,
    fetchFailures,
    updateFailureCA,
  } = useMDInspectionStore();

  const [selectedInspection, setSelectedInspection] = useState<MDInspection | null>(null);
  const [relatedFailures, setRelatedFailures] = useState<MDFailure[]>([]);
  const [caUpdate, setCAUpdate] = useState({ status: '' as CAStatus | '', description: '' });

  useEffect(() => {
    fetchInspections(filters);
  }, [filters, fetchInspections]);

  const handleRowClick = useCallback(
    async (inspection: MDInspection) => {
      setSelectedInspection(inspection);
      await fetchFailures(inspection.id);
      const related = failures.filter((f) => f.inspectionId === inspection.id);
      setRelatedFailures(related);
    },
    [fetchFailures, failures]
  );

  // Re-sync related failures when store updates
  useEffect(() => {
    if (selectedInspection) {
      setRelatedFailures(failures.filter((f) => f.inspectionId === selectedInspection.id));
    }
  }, [failures, selectedInspection]);

  const handleCAUpdate = async (failureId: string) => {
    if (!caUpdate.status) return;
    await updateFailureCA(failureId, {
      caStatus: caUpdate.status as CAStatus,
      caDescription: caUpdate.description || undefined,
      caCompletedAt: caUpdate.status === 'completed' ? new Date().toISOString() : undefined,
    });
    setCAUpdate({ status: '', description: '' });
    // Re-fetch failures for updated data
    if (selectedInspection) {
      await fetchFailures(selectedInspection.id);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t('metalDetector.history.title')}</h1>
        <p className="text-muted-foreground">{t('metalDetector.history.description')}</p>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="space-y-1">
              <Label className="text-xs">{t('metalDetector.factory.label')}</Label>
              <Select
                value={filters.factory || 'all'}
                onValueChange={(v) =>
                  setFilters({ ...filters, factory: v === 'all' ? undefined : (v as FactoryCode) })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('common.all')}</SelectItem>
                  {FACTORIES.map((f) => (
                    <SelectItem key={f} value={f}>
                      Factory {f}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label className="text-xs">{t('metalDetector.input.resultLabel')}</Label>
              <Select
                value={filters.result || 'all'}
                onValueChange={(v) =>
                  setFilters({ ...filters, result: v === 'all' ? undefined : (v as InspectionResult) })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('common.all')}</SelectItem>
                  <SelectItem value="PASS">{t('metalDetector.result.pass')}</SelectItem>
                  <SelectItem value="FAIL">{t('metalDetector.result.fail')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label className="text-xs">{t('metalDetector.history.dateFrom')}</Label>
              <Input
                type="date"
                value={filters.dateFrom || ''}
                onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value || undefined })}
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs">{t('metalDetector.history.dateTo')}</Label>
              <Input
                type="date"
                value={filters.dateTo || ''}
                onChange={(e) => setFilters({ ...filters, dateTo: e.target.value || undefined })}
              />
            </div>

            <div className="flex items-end">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setFilters({})}
                className="text-xs"
              >
                <X className="h-3 w-3 mr-1" />
                {t('metalDetector.history.clearFilters')}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="pt-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : inspections.length === 0 ? (
            <EmptyState
              icon={ClipboardList}
              title={t('metalDetector.history.emptyTitle')}
              description={t('metalDetector.history.emptyDescription')}
            />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('metalDetector.input.date')}</TableHead>
                    <TableHead>{t('metalDetector.factory.label')}</TableHead>
                    <TableHead>{t('metalDetector.line')}</TableHead>
                    <TableHead>{t('metalDetector.machineId')}</TableHead>
                    <TableHead>{t('metalDetector.input.resultLabel')}</TableHead>
                    <TableHead>{t('metalDetector.input.inspectorId')}</TableHead>
                    <TableHead>{t('metalDetector.input.inspector')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {inspections.map((inspection) => (
                    <TableRow
                      key={inspection.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => handleRowClick(inspection)}
                    >
                      <TableCell className="font-mono text-sm">
                        {inspection.inspectionDate}
                      </TableCell>
                      <TableCell>Factory {inspection.factory}</TableCell>
                      <TableCell>{inspection.line}</TableCell>
                      <TableCell className="font-mono text-xs">{inspection.machineId || '-'}</TableCell>
                      <TableCell>
                        <Badge
                          variant={inspection.result === 'PASS' ? 'default' : 'destructive'}
                          className={
                            inspection.result === 'PASS'
                              ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                              : ''
                          }
                        >
                          {t(`metalDetector.result.${inspection.result.toLowerCase()}`)}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono text-xs">{inspection.inspectorId || '-'}</TableCell>
                      <TableCell>{inspection.inspectorName}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detail Modal */}
      <Dialog
        open={!!selectedInspection}
        onOpenChange={(open) => !open && setSelectedInspection(null)}
      >
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t('metalDetector.history.detail')}</DialogTitle>
          </DialogHeader>

          {selectedInspection && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <span className="text-muted-foreground">{t('metalDetector.input.date')}:</span>
                <span>{selectedInspection.inspectionDate}</span>
                <span className="text-muted-foreground">{t('metalDetector.factory.label')}:</span>
                <span>Factory {selectedInspection.factory}</span>
                <span className="text-muted-foreground">{t('metalDetector.line')}:</span>
                <span>{selectedInspection.line}</span>
                <span className="text-muted-foreground">{t('metalDetector.input.resultLabel')}:</span>
                <span>
                  <Badge variant={selectedInspection.result === 'PASS' ? 'default' : 'destructive'}>
                    {t(`metalDetector.result.${selectedInspection.result.toLowerCase()}`)}
                  </Badge>
                </span>
                <span className="text-muted-foreground">{t('metalDetector.input.inspectorId')}:</span>
                <span className="font-mono">{selectedInspection.inspectorId || '-'}</span>
                <span className="text-muted-foreground">{t('metalDetector.input.inspector')}:</span>
                <span>{selectedInspection.inspectorName}</span>
                {selectedInspection.productName && (
                  <>
                    <span className="text-muted-foreground">{t('metalDetector.input.productName')}:</span>
                    <span>{selectedInspection.productName}</span>
                  </>
                )}
                {selectedInspection.remarks && (
                  <>
                    <span className="text-muted-foreground">{t('metalDetector.input.remarks')}:</span>
                    <span>{selectedInspection.remarks}</span>
                  </>
                )}
              </div>

              {/* Checklist (모바일 입력 데이터) */}
              {selectedInspection.checklist && (
                <div className="pt-3 border-t">
                  <h4 className="font-medium text-sm mb-2">{t('metalDetector.checklist.title')}</h4>
                  <div className="grid grid-cols-2 gap-1 text-sm">
                    {Object.entries(selectedInspection.checklist).map(([key, val]) => (
                      <div key={key} className="flex justify-between px-2 py-1 rounded bg-muted/30">
                        <span className="text-muted-foreground">{key}</span>
                        <span className={val === 'PASS' || val === 'ON' || val === 'OK' ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>{val}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* CA Tracking */}
              {relatedFailures.length > 0 && (
                <div className="space-y-3 pt-4 border-t">
                  <h4 className="font-medium text-sm">
                    {t('metalDetector.ca.title')} ({relatedFailures.length})
                  </h4>
                  {relatedFailures.map((failure) => (
                    <div
                      key={failure.id}
                      className="p-3 border rounded-lg space-y-2 text-sm"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{failure.failureType}</span>
                        <Badge className={CA_STATUS_COLORS[failure.caStatus]}>
                          {t(`metalDetector.ca.status.${failure.caStatus}`)}
                        </Badge>
                      </div>
                      <p className="text-muted-foreground">{failure.description}</p>
                      {failure.caDescription && (
                        <p className="text-xs">
                          <span className="font-medium">{t('metalDetector.ca.description')}:</span>{' '}
                          {failure.caDescription}
                        </p>
                      )}

                      {/* CA Update Form */}
                      {failure.caStatus !== 'completed' && (
                        <div className="pt-2 border-t space-y-2">
                          <div className="flex gap-2">
                            <Select
                              value={caUpdate.status}
                              onValueChange={(v) =>
                                setCAUpdate((prev) => ({ ...prev, status: v as CAStatus }))
                              }
                            >
                              <SelectTrigger className="flex-1">
                                <SelectValue placeholder={t('metalDetector.ca.updateStatus')} />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="in_progress">
                                  {t('metalDetector.ca.status.in_progress')}
                                </SelectItem>
                                <SelectItem value="completed">
                                  {t('metalDetector.ca.status.completed')}
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <Textarea
                            placeholder={t('metalDetector.ca.description')}
                            value={caUpdate.description}
                            onChange={(e) =>
                              setCAUpdate((prev) => ({ ...prev, description: e.target.value }))
                            }
                            rows={2}
                          />
                          <Button
                            size="sm"
                            disabled={!caUpdate.status}
                            onClick={() => handleCAUpdate(failure.id)}
                          >
                            {t('metalDetector.ca.update')}
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
