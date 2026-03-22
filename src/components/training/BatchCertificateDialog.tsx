import { useState, useMemo, useCallback, memo } from 'react';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import * as api from '@/services/api';
import type { Certificate, CertificateTemplate } from '@/services/certificateService';
import {
  Award,
  Loader2,
  CheckCircle,
  AlertCircle,
  Users,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';

interface TrainingResult {
  result_id: string;
  employee_id: string;
  employee_name: string;
  department: string;
  position: string;
  program_code: string;
  program_name: string;
  training_date: string;
  score: number | null;
  grade: string | null;
  result: 'PASS' | 'FAIL';
}

interface ProgramOption {
  program_code: string;
  program_name: string;
}

interface BatchCertificateDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  programs: ProgramOption[];
  results: TrainingResult[];
}

type BatchStatus = 'idle' | 'issuing' | 'success' | 'error';

interface BatchResult {
  total: number;
  success: number;
  failed: number;
  errors: string[];
}

const BatchCertificateDialog = memo(function BatchCertificateDialog({
  open,
  onClose,
  onSuccess,
  programs,
  results,
}: BatchCertificateDialogProps) {
  const { t } = useTranslation();

  const [selectedProgram, setSelectedProgram] = useState<string>('all');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('default');
  const [templates, setTemplates] = useState<CertificateTemplate[]>([]);
  const [templatesLoaded, setTemplatesLoaded] = useState(false);
  const [batchStatus, setBatchStatus] = useState<BatchStatus>('idle');
  const [progress, setProgress] = useState(0);
  const [batchResult, setBatchResult] = useState<BatchResult | null>(null);

  // Load templates when dialog opens
  useState(() => {
    if (open && !templatesLoaded) {
      api.getCertificateTemplates(true).then((data) => {
        setTemplates(data);
        setTemplatesLoaded(true);
        // Auto-select default template
        const defaultTemplate = data.find((t) => t.is_default);
        if (defaultTemplate) {
          setSelectedTemplateId(defaultTemplate.template_id);
        }
      }).catch(() => {
        setTemplatesLoaded(true);
      });
    }
  });

  // Filter results by selected program
  const filteredResults = useMemo(() => {
    if (selectedProgram === 'all') return results;
    return results.filter((r) => r.program_code === selectedProgram);
  }, [results, selectedProgram]);

  // Programs that have results
  const programsWithResults = useMemo(() => {
    const programCodes = new Set(results.map((r) => r.program_code));
    return programs.filter((p) => programCodes.has(p.program_code));
  }, [programs, results]);

  const isAllSelected = filteredResults.length > 0 && selectedIds.size === filteredResults.length;
  const isSomeSelected = selectedIds.size > 0 && selectedIds.size < filteredResults.length;

  const handleSelectAll = useCallback(() => {
    if (isAllSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredResults.map((r) => r.result_id)));
    }
  }, [filteredResults, isAllSelected]);

  const handleToggleSelect = useCallback((resultId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(resultId)) {
        next.delete(resultId);
      } else {
        next.add(resultId);
      }
      return next;
    });
  }, []);

  const handleProgramChange = useCallback((value: string) => {
    setSelectedProgram(value);
    setSelectedIds(new Set());
  }, []);

  const generateCertificateNumber = (index: number): string => {
    const year = new Date().getFullYear();
    const timestamp = Date.now() % 100000;
    const sequence = timestamp + index + 1;
    return `CERT-${year}-${String(sequence).padStart(6, '0')}`;
  };

  const handleBatchIssue = async () => {
    if (selectedIds.size === 0) return;

    setBatchStatus('issuing');
    setProgress(0);
    setBatchResult(null);

    const selectedResults = filteredResults.filter((r) => selectedIds.has(r.result_id));
    const now = format(new Date(), 'yyyy-MM-dd');
    const errors: string[] = [];
    let successCount = 0;

    try {
      const certificatesToCreate: Omit<Certificate, 'created_at'>[] = selectedResults.map(
        (result, index) => ({
          certificate_id: `CERT-${Date.now()}-${index}`,
          certificate_number: generateCertificateNumber(index),
          employee_id: result.employee_id,
          employee_name: result.employee_name,
          department: result.department,
          position: result.position,
          program_code: result.program_code,
          program_name: result.program_name,
          training_date: result.training_date,
          score: result.score,
          grade: result.grade,
          issue_date: now,
          issued_by: 'current_user',
          template_id: selectedTemplateId !== 'default' ? selectedTemplateId : undefined,
          status: 'ISSUED' as const,
        })
      );

      // Simulate progress for UX
      const progressInterval = setInterval(() => {
        setProgress((prev) => Math.min(prev + 10, 90));
      }, 200);

      const created = await api.createCertificatesBatch(certificatesToCreate);
      successCount = created.length;

      clearInterval(progressInterval);
      setProgress(100);

      setBatchResult({
        total: selectedResults.length,
        success: successCount,
        failed: selectedResults.length - successCount,
        errors,
      });
      setBatchStatus('success');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      errors.push(errorMessage);
      setBatchResult({
        total: selectedResults.length,
        success: successCount,
        failed: selectedResults.length - successCount,
        errors,
      });
      setBatchStatus('error');
    }
  };

  const handleClose = () => {
    if (batchStatus === 'success') {
      onSuccess();
    }
    // Reset state
    setSelectedIds(new Set());
    setSelectedProgram('all');
    setBatchStatus('idle');
    setProgress(0);
    setBatchResult(null);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Award className="h-5 w-5" />
            {t('certificates.batchIssueTitle')}
          </DialogTitle>
          <DialogDescription>
            {t('certificates.batchIssueDesc')}
          </DialogDescription>
        </DialogHeader>

        {batchStatus === 'idle' && (
          <>
            {/* Program filter and template selector */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <label className="text-sm font-medium mb-1 block">
                  {t('certificates.selectProgram')}
                </label>
                <Select value={selectedProgram} onValueChange={handleProgramChange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('certificates.allPrograms')}</SelectItem>
                    {programsWithResults.map((p) => (
                      <SelectItem key={p.program_code} value={p.program_code}>
                        {p.program_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex-1">
                <label className="text-sm font-medium mb-1 block">
                  {t('certificates.templateSelect')}
                </label>
                <Select value={selectedTemplateId} onValueChange={setSelectedTemplateId}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="default">{t('certificates.defaultTemplate')}</SelectItem>
                    {templates.map((tmpl) => (
                      <SelectItem key={tmpl.template_id} value={tmpl.template_id}>
                        {tmpl.name} {tmpl.is_default ? `(${t('certificates.isDefault')})` : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Selection summary */}
            <div className="flex items-center justify-between py-2 px-3 bg-muted/50 rounded-md">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">
                  {t('certificates.selectedCount', { count: selectedIds.size, total: filteredResults.length })}
                </span>
              </div>
              <Button
                size="sm"
                onClick={handleBatchIssue}
                disabled={selectedIds.size === 0}
              >
                <Award className="h-4 w-4 mr-1" />
                {t('certificates.issueSelected')} ({selectedIds.size})
              </Button>
            </div>

            {/* Results table */}
            <ScrollArea className="h-[400px] border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10">
                      <Checkbox
                        checked={isAllSelected}
                        ref={(el) => {
                          if (el) {
                            (el as unknown as HTMLInputElement).indeterminate = isSomeSelected;
                          }
                        }}
                        onCheckedChange={handleSelectAll}
                        aria-label={t('certificates.selectAll')}
                      />
                    </TableHead>
                    <TableHead>{t('certificates.colEmployeeId')}</TableHead>
                    <TableHead>{t('certificates.colName')}</TableHead>
                    <TableHead>{t('certificates.colDepartment')}</TableHead>
                    <TableHead>{t('certificates.colProgram')}</TableHead>
                    <TableHead>{t('certificates.colTrainingDate')}</TableHead>
                    <TableHead>{t('certificates.colScore')}</TableHead>
                    <TableHead>{t('certificates.colGrade')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredResults.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                        {t('certificates.emptyState')}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredResults.map((result) => (
                      <TableRow
                        key={result.result_id}
                        className={selectedIds.has(result.result_id) ? 'bg-primary/5' : ''}
                      >
                        <TableCell>
                          <Checkbox
                            checked={selectedIds.has(result.result_id)}
                            onCheckedChange={() => handleToggleSelect(result.result_id)}
                            aria-label={`Select ${result.employee_name}`}
                          />
                        </TableCell>
                        <TableCell className="font-mono text-sm">{result.employee_id}</TableCell>
                        <TableCell className="font-medium">{result.employee_name}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{result.department}</Badge>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm">{result.program_name}</span>
                        </TableCell>
                        <TableCell className="text-sm">{result.training_date}</TableCell>
                        <TableCell className="text-sm">{result.score ?? '-'}</TableCell>
                        <TableCell>
                          {result.grade && (
                            <Badge
                              variant={
                                result.grade === 'AA'
                                  ? 'default'
                                  : result.grade === 'A'
                                    ? 'success'
                                    : result.grade === 'B'
                                      ? 'warning'
                                      : 'secondary'
                              }
                            >
                              {result.grade}
                            </Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </ScrollArea>
          </>
        )}

        {/* Issuing progress */}
        {batchStatus === 'issuing' && (
          <div className="flex flex-col items-center gap-6 py-12">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <div className="w-full max-w-md space-y-2">
              <p className="text-center text-lg font-medium">
                {t('certificates.issuingProgress')}
              </p>
              <Progress value={progress} className="h-3" />
              <p className="text-center text-sm text-muted-foreground">
                {progress}%
              </p>
            </div>
          </div>
        )}

        {/* Success state */}
        {batchStatus === 'success' && batchResult && (
          <div className="flex flex-col items-center gap-6 py-12">
            <CheckCircle className="h-16 w-16 text-green-500" />
            <div className="text-center space-y-2">
              <p className="text-xl font-bold text-green-600">
                {t('certificates.batchSuccess')}
              </p>
              <p className="text-muted-foreground">
                {t('certificates.batchSuccessDetail', {
                  success: batchResult.success,
                  total: batchResult.total,
                })}
              </p>
            </div>
            <Button onClick={handleClose}>
              {t('common.close')}
            </Button>
          </div>
        )}

        {/* Error state */}
        {batchStatus === 'error' && batchResult && (
          <div className="flex flex-col items-center gap-6 py-12">
            <AlertCircle className="h-16 w-16 text-destructive" />
            <div className="text-center space-y-2">
              <p className="text-xl font-bold text-destructive">
                {t('certificates.batchError')}
              </p>
              {batchResult.errors.map((err, i) => (
                <p key={i} className="text-sm text-muted-foreground">
                  {err}
                </p>
              ))}
              {batchResult.success > 0 && (
                <p className="text-sm text-muted-foreground">
                  {t('certificates.batchPartialSuccess', {
                    success: batchResult.success,
                    total: batchResult.total,
                  })}
                </p>
              )}
            </div>
            <Button onClick={handleClose}>
              {t('common.close')}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
});
export default BatchCertificateDialog;
