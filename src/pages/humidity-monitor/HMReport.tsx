/**
 * HMReport — 온도-습도 모니터링 장치 리포트 페이지
 */

import { useEffect, useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useShallow } from 'zustand/react/shallow';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Loader2, FileDown, FileSpreadsheet, CalendarDays, Thermometer } from 'lucide-react';
import { useHMMonitorStore } from '@/stores/hmMonitorStore';
import { exportToExcel } from '@/utils/excelExport';
import { logger } from '@/utils/logger';

export default function HMReport() {
  const { t } = useTranslation();
  const { inspections, isLoading, fetchInspections } =
    useHMMonitorStore(useShallow((s) => ({
      inspections: s.inspections, isLoading: s.isLoading, fetchInspections: s.fetchInspections,
    })));

  const [startDate, setStartDate] = useState(() => {
    const d = new Date(); d.setMonth(d.getMonth() - 1); return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [exporting, setExporting] = useState(false);
  const [generatingPdf, setGeneratingPdf] = useState(false);

  useEffect(() => { fetchInspections(); }, [fetchInspections]);

  const filteredInspections = useMemo(() =>
    inspections.filter((i) => i.inspectionDate >= startDate && i.inspectionDate <= endDate)
      .sort((a, b) => b.inspectionDate.localeCompare(a.inspectionDate)),
    [inspections, startDate, endDate],
  );

  const handleExportExcel = async () => {
    setExporting(true);
    try {
      const rows: Record<string, unknown>[] = [];
      for (const insp of filteredInspections) {
        for (const r of insp.results) {
          rows.push({
            Date: insp.inspectionDate, Inspector: insp.inspector, Area: r.area,
            'T.O': r.targetQuantity, OK: r.okCount, 'NO OK': r.noOkCount,
            Have: r.totalHave, Missing: r.missing, Status: r.status, Remark: r.remark || '',
          });
        }
      }
      await exportToExcel(rows, {
        filename: `humidity_monitor_${startDate}_${endDate}.xlsx`,
        sheetName: 'HM Inspections',
      });
    } catch (err) { logger.error('[HMReport] Excel export failed:', err); }
    finally { setExporting(false); }
  };

  const handleExportPdf = async () => {
    setGeneratingPdf(true);
    try {
      const { default: jsPDF } = await import('jspdf');
      const { default: autoTable } = await import('jspdf-autotable');
      const doc = new jsPDF({ orientation: 'landscape' });
      doc.setFontSize(16);
      doc.text(t('humidityMonitor.report.title'), 14, 20);
      doc.setFontSize(10);
      doc.text(`${startDate} ~ ${endDate}`, 14, 28);

      const tableRows: string[][] = [];
      for (const insp of filteredInspections) {
        for (const r of insp.results) {
          tableRows.push([
            insp.inspectionDate, insp.inspector, r.area,
            String(r.targetQuantity), String(r.okCount), String(r.noOkCount),
            String(r.totalHave), String(r.missing), r.status, r.remark || '',
          ]);
        }
      }
      autoTable(doc, {
        startY: 34,
        head: [['Date', 'Inspector', 'Area', 'T.O', 'OK', 'NOOK', 'Have', 'Missing', 'Status', 'Remark']],
        body: tableRows, styles: { fontSize: 7 }, headStyles: { fillColor: [59, 130, 246] },
      });
      doc.save(`humidity_monitor_${startDate}_${endDate}.pdf`);
    } catch (err) { logger.error('[HMReport] PDF export failed:', err); }
    finally { setGeneratingPdf(false); }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Thermometer className="h-6 w-6" />{t('humidityMonitor.report.title')}
        </h1>
        <p className="text-muted-foreground">{t('humidityMonitor.report.description')}</p>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><CalendarDays className="h-4 w-4" />{t('humidityMonitor.report.dateRange')}</CardTitle></CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-end gap-4">
            <div className="space-y-1">
              <Label className="text-xs">From</Label>
              <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-[160px]" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">To</Label>
              <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-[160px]" />
            </div>
            <Button variant="outline" onClick={handleExportExcel} disabled={exporting || filteredInspections.length === 0}>
              {exporting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <FileSpreadsheet className="h-4 w-4 mr-2" />}Excel
            </Button>
            <Button variant="outline" onClick={handleExportPdf} disabled={generatingPdf || filteredInspections.length === 0}>
              {generatingPdf ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <FileDown className="h-4 w-4 mr-2" />}PDF
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        <Card><CardContent className="pt-6 text-center">
          <p className="text-sm text-muted-foreground">{t('humidityMonitor.dashboard.inspectionCount')}</p>
          <p className="text-3xl font-bold mt-1">{filteredInspections.length}</p>
        </CardContent></Card>
        <Card><CardContent className="pt-6 text-center">
          <p className="text-sm text-muted-foreground">{t('humidityMonitor.dashboard.okRate')}</p>
          <p className="text-3xl font-bold mt-1 text-green-600">{filteredInspections.length > 0 ? filteredInspections[0].summary.okRate : 0}%</p>
        </CardContent></Card>
        <Card><CardContent className="pt-6 text-center">
          <p className="text-sm text-muted-foreground">{t('humidityMonitor.dashboard.lastInspection')}</p>
          <p className="text-xl font-bold mt-1">{filteredInspections.length > 0 ? filteredInspections[0].inspectionDate : '-'}</p>
        </CardContent></Card>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      ) : filteredInspections.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <CalendarDays className="h-12 w-12 mx-auto mb-4 opacity-30" /><p>{t('humidityMonitor.report.noData')}</p>
        </div>
      ) : (
        <Card>
          <CardHeader><CardTitle className="text-base">{t('humidityMonitor.dashboard.historyTitle')}</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('humidityMonitor.table.date')}</TableHead>
                  <TableHead>{t('humidityMonitor.table.inspector')}</TableHead>
                  <TableHead className="text-right">OK</TableHead>
                  <TableHead className="text-right">NO OK</TableHead>
                  <TableHead className="text-right">{t('humidityMonitor.table.missing')}</TableHead>
                  <TableHead className="text-right">{t('humidityMonitor.dashboard.okRate')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInspections.map((insp) => (
                  <TableRow key={insp.id}>
                    <TableCell className="font-mono">{insp.inspectionDate}</TableCell>
                    <TableCell>{insp.inspector}</TableCell>
                    <TableCell className="text-right">{insp.summary.totalOk}</TableCell>
                    <TableCell className="text-right text-red-600">{insp.summary.totalNoOk}</TableCell>
                    <TableCell className="text-right">{insp.summary.totalMissing}</TableCell>
                    <TableCell className="text-right">
                      <Badge variant={insp.summary.okRate >= 95 ? 'default' : 'destructive'}>{insp.summary.okRate}%</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
