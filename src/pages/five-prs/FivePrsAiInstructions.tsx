import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useShallow } from 'zustand/react/shallow';
import { Loader2, AlertCircle, BrainCircuit, Clipboard, Printer, Users, Package, UserPlus } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useFivePrsStore } from '@/stores/fivePrsStore';
import { MonthSelector } from '@/components/five-prs/MonthSelector';
import { InspectionKPICards } from '@/components/five-prs/InspectionKPICards';
import { autoEnrollFromRecommendations } from '@/services/api';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';

export default function FivePrsAiInstructions() {
  const { t, i18n } = useTranslation();
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const copiedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isAutoEnrolling, setIsAutoEnrolling] = useState(false);
  const [enrollResult, setEnrollResult] = useState<{
    enrolled: number;
    enrollments: Array<{ employee: string; program: string; priority: string }>;
    totalRecommendations: number;
  } | null>(null);
  const [enrollDialogOpen, setEnrollDialogOpen] = useState(false);
  const {
    processedData,
    aiBriefing,
    isLoadingMonths,
    isLoadingData,
    isLoadingBriefing,
    error,
    selectedMonth,
  } = useFivePrsStore(useShallow((state) => ({
    processedData: state.processedData,
    aiBriefing: state.aiBriefing,
    isLoadingMonths: state.isLoadingMonths,
    isLoadingData: state.isLoadingData,
    isLoadingBriefing: state.isLoadingBriefing,
    error: state.error,
    selectedMonth: state.selectedMonth,
  })));
  const fetchMonths = useFivePrsStore((s) => s.fetchMonths);
  const fetchData = useFivePrsStore((s) => s.fetchData);
  const generateBriefing = useFivePrsStore((s) => s.generateBriefing);
  const clearError = useFivePrsStore((s) => s.clearError);

  useEffect(() => {
    return () => {
      if (copiedTimerRef.current) clearTimeout(copiedTimerRef.current);
    };
  }, []);

  useEffect(() => {
    fetchMonths();
  }, [fetchMonths]);

  useEffect(() => {
    if (selectedMonth) {
      fetchData();
    }
  }, [selectedMonth, fetchData]);

  const handleGenerate = () => {
    generateBriefing(i18n.language);
  };

  const handleCopy = async () => {
    if (!aiBriefing) return;
    await navigator.clipboard.writeText(aiBriefing);
    setCopied(true);
    if (copiedTimerRef.current) clearTimeout(copiedTimerRef.current);
    copiedTimerRef.current = setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleAutoEnroll = async () => {
    if (!selectedMonth) return;
    setIsAutoEnrolling(true);
    try {
      const result = await autoEnrollFromRecommendations(selectedMonth);
      setEnrollResult({
        enrolled: result.enrolled,
        enrollments: result.enrollments,
        totalRecommendations: result.totalRecommendations,
      });
      setEnrollDialogOpen(true);
    } catch (err) {
      toast({
        title: t('common.error'),
        description: err instanceof Error ? err.message : 'Auto-enrollment failed',
        variant: 'destructive',
      });
    } finally {
      setIsAutoEnrolling(false);
    }
  };

  const isLoading = isLoadingMonths || isLoadingData;

  // Filter high-risk TQC (reject rate > 5%, min 100 validations)
  const highRiskTqc = processedData?.tqcRecords.filter(
    (t) => t.rejectRate > 5 && t.totalValidation >= 100
  ) || [];

  // Filter high-defect models (reject rate > 3%, min 50 validations)
  const highDefectModels = processedData?.modelRecords.filter(
    (m) => m.rejectRate > 3 && m.totalValidation >= 50
  ) || [];

  const getRateColor = (rate: number) => {
    if (rate > 5) return 'text-red-600 font-bold';
    if (rate > 3) return 'text-orange-500 font-semibold';
    return 'text-yellow-600';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t('fivePrs.aiTitle')}</h1>
          <p className="text-muted-foreground">{t('fivePrs.aiDescription')}</p>
        </div>
        <MonthSelector />
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            {error}
            <button onClick={clearError} className="text-sm underline ml-2">
              {t('common.close')}
            </button>
          </AlertDescription>
        </Alert>
      )}

      {isLoading && (
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}

      {!isLoading && processedData && (
        <>
          <InspectionKPICards stats={processedData.stats} />

          <Tabs defaultValue="briefing" className="space-y-4">
            <TabsList>
              <TabsTrigger value="briefing" className="gap-1.5">
                <BrainCircuit className="h-4 w-4" />
                {t('fivePrs.aiBriefing')}
              </TabsTrigger>
              <TabsTrigger value="risk-tqc" className="gap-1.5">
                <Users className="h-4 w-4" />
                {t('fivePrs.riskTqc')}
              </TabsTrigger>
              <TabsTrigger value="risk-models" className="gap-1.5">
                <Package className="h-4 w-4" />
                {t('fivePrs.riskModels')}
              </TabsTrigger>
            </TabsList>

            {/* AI Briefing Tab */}
            <TabsContent value="briefing">
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2">
                      <BrainCircuit className="h-5 w-5" />
                      {t('fivePrs.aiBriefing')}
                    </CardTitle>
                    <div className="flex gap-2">
                      {!aiBriefing && (
                        <Button onClick={handleGenerate} disabled={isLoadingBriefing}>
                          {isLoadingBriefing && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                          {t('fivePrs.generate')}
                        </Button>
                      )}
                      {aiBriefing && (
                        <>
                          <Button variant="outline" size="sm" onClick={handleCopy}>
                            <Clipboard className="h-4 w-4 mr-1" />
                            {copied ? t('fivePrs.copied') : t('fivePrs.copy')}
                          </Button>
                          <Button variant="outline" size="sm" onClick={handlePrint}>
                            <Printer className="h-4 w-4 mr-1" />
                            {t('fivePrs.print')}
                          </Button>
                          <Button
                            size="sm"
                            onClick={handleAutoEnroll}
                            disabled={isAutoEnrolling}
                          >
                            {isAutoEnrolling ? (
                              <Loader2 className="h-4 w-4 animate-spin mr-1" />
                            ) : (
                              <UserPlus className="h-4 w-4 mr-1" />
                            )}
                            {t('fivePrs.autoEnroll') || 'Auto Enroll'}
                          </Button>
                          <Button variant="ghost" size="sm" onClick={handleGenerate} disabled={isLoadingBriefing}>
                            {t('fivePrs.regenerate')}
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {isLoadingBriefing && (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="h-8 w-8 animate-spin text-primary mr-3" />
                      <span className="text-muted-foreground">{t('fivePrs.analyzing')}</span>
                    </div>
                  )}
                  {!isLoadingBriefing && aiBriefing && (
                    <div className="prose prose-sm max-w-none dark:prose-invert whitespace-pre-wrap">
                      {aiBriefing.split('\n').map((line, i) => {
                        // Bold markers
                        const parts = line.split(/\*\*(.+?)\*\*/g);
                        return (
                          <p key={i} className="my-1">
                            {parts.map((part, j) =>
                              j % 2 === 1 ? <strong key={j}>{part}</strong> : part
                            )}
                          </p>
                        );
                      })}
                    </div>
                  )}
                  {!isLoadingBriefing && !aiBriefing && (
                    <div className="text-center py-12 text-muted-foreground">
                      {t('fivePrs.clickGenerate')}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Risk TQC Tab */}
            <TabsContent value="risk-tqc">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">{t('fivePrs.riskTqcTitle')}</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t('fivePrs.tqcName')}</TableHead>
                        <TableHead className="text-right">{t('fivePrs.validation')}</TableHead>
                        <TableHead className="text-right">{t('fivePrs.reject')}</TableHead>
                        <TableHead className="text-right">{t('fivePrs.rejectRate')}</TableHead>
                        <TableHead>{t('fivePrs.mainDefect')}</TableHead>
                        <TableHead>{t('fivePrs.building')}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {highRiskTqc.map((tqc) => (
                        <TableRow key={`${tqc.id}-${tqc.name}`}>
                          <TableCell className="font-medium">
                            <span className="text-xs text-muted-foreground mr-1">{tqc.id}</span>
                            {tqc.name}
                          </TableCell>
                          <TableCell className="text-right">{tqc.totalValidation.toLocaleString()}</TableCell>
                          <TableCell className="text-right">{tqc.totalReject.toLocaleString()}</TableCell>
                          <TableCell className={`text-right ${getRateColor(tqc.rejectRate)}`}>
                            {tqc.rejectRate}%
                          </TableCell>
                          <TableCell>{tqc.mainDefect}</TableCell>
                          <TableCell className="text-muted-foreground">{tqc.buildings.join(', ')}</TableCell>
                        </TableRow>
                      ))}
                      {highRiskTqc.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                            {t('fivePrs.noHighRisk')}
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Risk Models Tab */}
            <TabsContent value="risk-models">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">{t('fivePrs.riskModelsTitle')}</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t('fivePrs.model')}</TableHead>
                        <TableHead className="text-right">{t('fivePrs.validation')}</TableHead>
                        <TableHead className="text-right">{t('fivePrs.reject')}</TableHead>
                        <TableHead className="text-right">{t('fivePrs.rejectRate')}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {highDefectModels.map((m) => (
                        <TableRow key={m.model}>
                          <TableCell className="font-medium">{m.model}</TableCell>
                          <TableCell className="text-right">{m.totalValidation.toLocaleString()}</TableCell>
                          <TableCell className="text-right">{m.totalReject.toLocaleString()}</TableCell>
                          <TableCell className={`text-right ${getRateColor(m.rejectRate)}`}>
                            {m.rejectRate}%
                          </TableCell>
                        </TableRow>
                      ))}
                      {highDefectModels.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                            {t('fivePrs.noHighRisk')}
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Action Bar */}
          <div className="flex justify-end gap-2 print:hidden">
            <Button variant="outline" onClick={handlePrint}>
              <Printer className="h-4 w-4 mr-2" />
              {t('fivePrs.print')}
            </Button>
            <Button variant="outline" onClick={handleCopy} disabled={!aiBriefing}>
              <Clipboard className="h-4 w-4 mr-2" />
              {t('fivePrs.share')}
            </Button>
          </div>
        </>
      )}

      {!isLoading && !processedData && !error && (
        <div className="flex items-center justify-center min-h-[300px] text-muted-foreground">
          {t('fivePrs.selectMonthPrompt')}
        </div>
      )}

      {/* Auto-Enrollment Result Dialog */}
      <Dialog open={enrollDialogOpen} onOpenChange={setEnrollDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              {t('fivePrs.autoEnrollResult') || 'Auto-Enrollment Result'}
            </DialogTitle>
            <DialogDescription>
              {enrollResult
                ? `${enrollResult.enrolled} / ${enrollResult.totalRecommendations} ${t('fivePrs.recommendationsEnrolled') || 'recommendations auto-enrolled'}`
                : ''}
            </DialogDescription>
          </DialogHeader>
          {enrollResult && enrollResult.enrollments.length > 0 && (
            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {enrollResult.enrollments.map((e, i) => (
                <div key={i} className="flex items-center justify-between p-2 rounded border text-sm">
                  <div>
                    <span className="font-medium">{e.employee}</span>
                    <span className="text-muted-foreground mx-2">&rarr;</span>
                    <span>{e.program}</span>
                  </div>
                  <Badge variant="destructive">{e.priority}</Badge>
                </div>
              ))}
            </div>
          )}
          {enrollResult && enrollResult.enrollments.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">
              {t('fivePrs.noEnrollments') || 'No IMMEDIATE priority items with linked employees found.'}
            </p>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
