import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { logger } from '@/utils/logger';
import { format } from 'date-fns';
import * as api from '@/services/api';
import { useAuthStore } from '@/stores/authStore';
import type { Certificate } from '@/services/certificateService';
import { Award, FileText, History, Loader2 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import BatchCertificateDialog from '@/components/training/BatchCertificateDialog';
import CertificateTemplateManager from '@/components/training/CertificateTemplateManager';
import {
  CertificatePreview,
  CertificateStatsCards,
  CertificateIssuanceTab,
  CertificateHistoryTab,
  RevokeDialog,
} from '@/components/certificates';
import type {
  TrainingResult,
  ProgramOption,
  CertificateData,
} from '@/components/certificates';

export default function CertificatesPage() {
  const { t } = useTranslation();
  const user = useAuthStore((state) => state.user);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProgram, setSelectedProgram] = useState<string>('all');
  const [selectedCertificate, setSelectedCertificate] = useState<CertificateData | null>(null);
  const [results, setResults] = useState<TrainingResult[]>([]);
  const [programs, setPrograms] = useState<ProgramOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showBatchDialog, setShowBatchDialog] = useState(false);

  // Issued certificates state
  const [issuedCertificates, setIssuedCertificates] = useState<Certificate[]>([]);
  const [isLoadingIssued, setIsLoadingIssued] = useState(false);
  const [issuedSearchQuery, setIssuedSearchQuery] = useState('');
  const [showRevokeDialog, setShowRevokeDialog] = useState<string | null>(null);
  const [revokeReason, setRevokeReason] = useState('');

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [resultsData, programsData, employeesData] = await Promise.all([
        api.getResults(),
        api.getPrograms(),
        api.getEmployees(),
      ]);
      // Build lookup maps
      const empMap = new Map(employeesData.map(e => [e.employee_id, e]));
      const progMap = new Map(programsData.map(p => [p.program_code, p]));
      // Map to local types - only PASS results
      setResults(resultsData.filter(r => r.result === 'PASS').map(r => {
        const emp = empMap.get(r.employee_id);
        const prog = progMap.get(r.program_code);
        return {
          result_id: r.result_id,
          employee_id: r.employee_id,
          employee_name: emp?.employee_name ?? r.employee_id,
          department: emp?.department ?? '',
          position: emp?.position ?? '',
          program_code: r.program_code,
          program_name: prog?.program_name ?? r.program_code,
          training_date: r.training_date ?? '',
          score: r.score ?? null,
          grade: r.grade ?? null,
          result: r.result as 'PASS' | 'FAIL',
        };
      }));
      setPrograms(programsData.map(p => ({
        program_code: p.program_code,
        program_name: p.program_name ?? p.program_code,
      })));
    } catch (err) {
      logger.error('Failed to load data:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadIssuedCertificates = useCallback(async () => {
    try {
      setIsLoadingIssued(true);
      const data = await api.getCertificates();
      setIssuedCertificates(data);
    } catch (err) {
      logger.error('Failed to load issued certificates:', err);
    } finally {
      setIsLoadingIssued(false);
    }
  }, []);

  useEffect(() => {
    Promise.all([loadData(), loadIssuedCertificates()]).catch(() => {});
  }, [loadData, loadIssuedCertificates]);

  // Eligible results (already filtered to PASS only)
  const eligibleResults = useMemo(() => {
    return results
      .filter(result => {
        const matchesSearch =
          result.employee_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          result.employee_id.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesProgram =
          selectedProgram === 'all' || result.program_code === selectedProgram;

        return matchesSearch && matchesProgram;
      })
      .sort((a, b) => b.training_date.localeCompare(a.training_date));
  }, [results, searchQuery, selectedProgram]);

  // Filtered issued certificates
  const filteredIssuedCertificates = useMemo(() => {
    if (!issuedSearchQuery) return issuedCertificates;
    const q = issuedSearchQuery.toLowerCase();
    return issuedCertificates.filter(
      (c) =>
        c.employee_name.toLowerCase().includes(q) ||
        c.employee_id.toLowerCase().includes(q) ||
        c.certificate_number.toLowerCase().includes(q) ||
        c.program_name.toLowerCase().includes(q)
    );
  }, [issuedCertificates, issuedSearchQuery]);

  // Certificate counter
  const certificateCounterRef = useRef(0);

  // Issue certificate handler (event handler only)
  const handleIssueCertificate = useCallback((result: TrainingResult) => {
    const year = new Date().getFullYear();
    certificateCounterRef.current += 1;
    const sequence = Date.now() % 100000 + certificateCounterRef.current;

    const certData: CertificateData = {
      certificateNumber: `CERT-${year}-${String(sequence).padStart(6, '0')}`,
      employeeId: result.employee_id,
      employeeName: result.employee_name,
      department: result.department,
      position: result.position,
      programCode: result.program_code,
      programName: result.program_name,
      trainingDate: result.training_date,
      score: result.score,
      grade: result.grade,
      issueDate: format(new Date(), 'yyyy-MM-dd'),
    };
    setSelectedCertificate(certData);
  }, []);

  // Revoke certificate handler
  const handleRevoke = async () => {
    if (!showRevokeDialog || !revokeReason.trim()) return;
    try {
      await api.revokeCertificate(showRevokeDialog, user?.email || 'unknown', revokeReason);
      setShowRevokeDialog(null);
      setRevokeReason('');
      await loadIssuedCertificates();
    } catch (err) {
      logger.error('Failed to revoke certificate:', err);
    }
  };

  // Statistics
  const stats = useMemo(() => {
    const thisMonth = format(new Date(), 'yyyy-MM');
    return {
      totalEligible: eligibleResults.length,
      totalPrograms: programs.length,
      uniqueEmployees: new Set(eligibleResults.map(r => r.employee_id)).size,
      thisMonthCount: eligibleResults.filter(r => r.training_date.startsWith(thisMonth)).length,
      totalIssued: issuedCertificates.filter((c) => c.status === 'ISSUED').length,
    };
  }, [eligibleResults, programs, issuedCertificates]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <main className="space-y-6" aria-label={t('certificates.title')}>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t('certificates.title')}</h1>
          <p className="text-muted-foreground">{t('certificates.description')}</p>
        </div>
      </div>

      {/* Stats Cards */}
      <CertificateStatsCards stats={stats} />

      {/* Tabbed Content */}
      <Tabs defaultValue="certificates">
        <TabsList>
          <TabsTrigger value="certificates" className="gap-2">
            <Award className="h-4 w-4" />
            {t('certificates.tabCertificates')}
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-2">
            <History className="h-4 w-4" />
            {t('certificates.certificateHistory')}
          </TabsTrigger>
          <TabsTrigger value="templates" className="gap-2">
            <FileText className="h-4 w-4" />
            {t('certificates.templates')}
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Issuance */}
        <TabsContent value="certificates">
          <CertificateIssuanceTab
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            selectedProgram={selectedProgram}
            onProgramChange={setSelectedProgram}
            programs={programs}
            eligibleResults={eligibleResults}
            onIssueCertificate={handleIssueCertificate}
            onBatchIssue={() => setShowBatchDialog(true)}
          />
        </TabsContent>

        {/* Tab 2: Certificate History */}
        <TabsContent value="history">
          <CertificateHistoryTab
            searchQuery={issuedSearchQuery}
            onSearchChange={setIssuedSearchQuery}
            certificates={filteredIssuedCertificates}
            isLoading={isLoadingIssued}
            onRevoke={(id: string) => setShowRevokeDialog(id)}
          />
        </TabsContent>

        {/* Tab 3: Templates */}
        <TabsContent value="templates">
          <CertificateTemplateManager />
        </TabsContent>
      </Tabs>

      {/* Certificate Preview Modal */}
      {selectedCertificate && (
        <CertificatePreview
          data={selectedCertificate}
          onClose={() => setSelectedCertificate(null)}
        />
      )}

      {/* Batch Issue Dialog */}
      <BatchCertificateDialog
        open={showBatchDialog}
        onClose={() => setShowBatchDialog(false)}
        onSuccess={() => {
          setShowBatchDialog(false);
          loadIssuedCertificates();
        }}
        programs={programs}
        results={results}
      />

      {/* Revoke Confirmation Dialog */}
      <RevokeDialog
        open={!!showRevokeDialog}
        onClose={() => setShowRevokeDialog(null)}
        revokeReason={revokeReason}
        onReasonChange={setRevokeReason}
        onConfirm={handleRevoke}
      />
    </main>
  );
}
