/**
 * Metal Detector Report
 * Week selector + preview + PDF generation
 */

import { useEffect, useState, useMemo } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useTranslation } from 'react-i18next';
import { logger } from '@/utils/logger';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Loader2, FileDown, CalendarDays } from 'lucide-react';
import { useMDInspectionStore } from '@/stores/mdInspectionStore';
import { generateMDWeeklyReport } from '@/utils/mdPdfExport';
function getISOWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

export default function MDReport() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const {
    inspections,
    dashboardKPIs,
    isLoading,
    fetchInspections,
    fetchDashboardKPIs,
    fetchFailures,
    failures,
  } = useMDInspectionStore(useShallow((s) => ({
    inspections: s.inspections,
    dashboardKPIs: s.dashboardKPIs,
    isLoading: s.isLoading,
    fetchInspections: s.fetchInspections,
    fetchDashboardKPIs: s.fetchDashboardKPIs,
    fetchFailures: s.fetchFailures,
    failures: s.failures,
  })));

  const currentYear = new Date().getFullYear();
  const currentWeek = getISOWeekNumber(new Date());

  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [selectedWeek, setSelectedWeek] = useState(currentWeek);
  const [generating, setGenerating] = useState(false);

  const weekOptions = useMemo(() => {
    const weeks = [];
    for (let w = 1; w <= 52; w++) {
      weeks.push(w);
    }
    return weeks;
  }, []);

  useEffect(() => {
    fetchInspections({
      year: selectedYear,
      weekNumber: selectedWeek,
    });
    fetchDashboardKPIs(selectedYear, selectedWeek);
    fetchFailures();
  }, [selectedYear, selectedWeek, fetchInspections, fetchDashboardKPIs, fetchFailures]);

  // Filter inspections for selected week
  const weekInspections = inspections.filter(
    (i) => i.year === selectedYear && i.weekNumber === selectedWeek
  );

  const handleGeneratePDF = async () => {
    setGenerating(true);
    try {
      await generateMDWeeklyReport(selectedYear, selectedWeek, {
        inspections: weekInspections,
        kpis: dashboardKPIs,
        failures: failures.filter((f) =>
          weekInspections.some((i) => i.id === f.inspectionId)
        ),
      });
    } catch (error) {
      logger.error('PDF generation failed:', error);
      toast({
        title: t('metalDetector.report.pdfFailed', 'PDF generation failed'),
        variant: 'destructive',
      });
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t('metalDetector.report.title')}</h1>
        <p className="text-muted-foreground">{t('metalDetector.report.description')}</p>
      </div>

      {/* Week Selector */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <CalendarDays className="h-4 w-4" />
            {t('metalDetector.report.selectWeek')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-4">
            <div className="space-y-1">
              <Label className="text-xs">{t('metalDetector.report.year')}</Label>
              <Select
                value={String(selectedYear)}
                onValueChange={(v) => setSelectedYear(Number(v))}
              >
                <SelectTrigger className="w-[120px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[currentYear, currentYear - 1, currentYear - 2].map((y) => (
                    <SelectItem key={y} value={String(y)}>
                      {y}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label className="text-xs">{t('metalDetector.report.week')}</Label>
              <Select
                value={String(selectedWeek)}
                onValueChange={(v) => setSelectedWeek(Number(v))}
              >
                <SelectTrigger className="w-[120px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {weekOptions.map((w) => (
                    <SelectItem key={w} value={String(w)}>
                      W{w}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button
              onClick={handleGeneratePDF}
              disabled={generating || weekInspections.length === 0}
            >
              {generating ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <FileDown className="h-4 w-4 mr-2" />
              )}
              {t('metalDetector.report.generatePDF')}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Preview */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardContent className="pt-6 text-center">
                <p className="text-sm text-muted-foreground">
                  {t('metalDetector.dashboard.totalInspections')}
                </p>
                <p className="text-3xl font-bold mt-1">{weekInspections.length}</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6 text-center">
                <p className="text-sm text-muted-foreground">
                  {t('metalDetector.dashboard.passRate')}
                </p>
                <p className="text-3xl font-bold mt-1 text-green-600">
                  {weekInspections.length > 0
                    ? `${(
                        (weekInspections.filter((i) => i.result === 'PASS').length /
                          weekInspections.length) *
                        100
                      ).toFixed(1)}%`
                    : '0%'}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6 text-center">
                <p className="text-sm text-muted-foreground">
                  {t('metalDetector.result.pass')}
                </p>
                <p className="text-3xl font-bold mt-1">
                  {weekInspections.filter((i) => i.result === 'PASS').length}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6 text-center">
                <p className="text-sm text-muted-foreground">
                  {t('metalDetector.result.fail')}
                </p>
                <p className="text-3xl font-bold mt-1 text-red-600">
                  {weekInspections.filter((i) => i.result === 'FAIL').length}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Factory Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                {t('metalDetector.report.factoryBreakdown')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-4">
                {[...new Set(weekInspections.map(i => i.factory))].sort().map((factory) => {
                  const factoryItems = weekInspections.filter(
                    (i) => i.factory === factory
                  );
                  const passCount = factoryItems.filter(
                    (i) => i.result === 'PASS'
                  ).length;
                  const rate =
                    factoryItems.length > 0
                      ? ((passCount / factoryItems.length) * 100).toFixed(1)
                      : '0.0';

                  return (
                    <div
                      key={factory}
                      className="p-4 border rounded-lg text-center space-y-1"
                    >
                      <h4 className="font-medium">Factory {factory}</h4>
                      <p className="text-2xl font-bold">{rate}%</p>
                      <p className="text-xs text-muted-foreground">
                        {passCount}/{factoryItems.length}{' '}
                        {t('metalDetector.result.pass')}
                      </p>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* No data message */}
          {weekInspections.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <CalendarDays className="h-12 w-12 mx-auto mb-4 opacity-30" />
              <p>{t('metalDetector.report.noDataForWeek')}</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
