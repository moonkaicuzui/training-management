import { useState, useMemo, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { logger } from '@/utils/logger';
import { format } from 'date-fns';
import * as api from '@/services/api';
import type { Employee, TrainingProgram, TrainingResultRecord } from '@/types';
import {
  Building2,
  GraduationCap,
  Users,
  Calendar,
  FileSpreadsheet,
  FileText,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ReportSummaryCards,
  DepartmentReportTable,
  ProgramReportTable,
  EmployeeReportTable,
} from '@/components/reports';
import type {
  ReportType,
  DepartmentReport,
  ProgramReport,
  EmployeeExportItem,
} from '@/components/reports';

export default function ReportsPage() {
  const { t } = useTranslation();

  const [selectedDepartment, setSelectedDepartment] = useState<string>('all');
  const [selectedPeriod, setSelectedPeriod] = useState<string>('6months');
  const [activeTab, setActiveTab] = useState<ReportType>('department');
  const [selectedEmployeeDepartment, setSelectedEmployeeDepartment] = useState<string>('all');
  const [selectedEmployeePosition, setSelectedEmployeePosition] = useState<string>('all');

  // Firebase data state
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [programs, setPrograms] = useState<TrainingProgram[]>([]);
  const [results, setResults] = useState<TrainingResultRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load data from Firebase
  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const [employeesData, programsData, resultsData] = await Promise.all([
        api.getEmployees(),
        api.getPrograms(),
        api.getResults(),
      ]);
      setEmployees(employeesData);
      setPrograms(programsData);
      setResults(resultsData);
    } catch (err) {
      logger.error('Failed to load report data:', err);
      setError(err instanceof Error ? err.message : t('common.errors.loadFailed'));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // selectedPeriod에 따라 results 필터링
  const filteredByPeriod = useMemo(() => {
    if (selectedPeriod === 'all') return results;
    const monthsMatch = selectedPeriod.match(/^(\d+)/);
    if (!monthsMatch) return results;
    const months = parseInt(monthsMatch[1], 10);
    const cutoff = new Date();
    cutoff.setMonth(cutoff.getMonth() - months);
    return results.filter(r => new Date(r.training_date) >= cutoff);
  }, [results, selectedPeriod]);

  // Compute departments from actual employee data
  const departments = useMemo(() => {
    const deptSet = new Set(employees.filter(e => e.status === 'ACTIVE').map(e => e.department));
    return Array.from(deptSet).sort().map(d => ({ value: d, label: d }));
  }, [employees]);

  const departmentReports = useMemo((): DepartmentReport[] => {
    const deptMap = new Map<string, { employees: number; completed: number; pending: number; scores: number[]; passCount: number; totalCount: number }>();

    employees.filter(e => e.status === 'ACTIVE').forEach(emp => {
      const dept = emp.department || 'UNKNOWN';
      if (!deptMap.has(dept)) {
        deptMap.set(dept, { employees: 0, completed: 0, pending: 0, scores: [], passCount: 0, totalCount: 0 });
      }
      deptMap.get(dept)!.employees++;
    });

    filteredByPeriod.forEach(r => {
      const emp = employees.find(e => e.employee_id === r.employee_id);
      const dept = emp?.department || 'UNKNOWN';
      if (!deptMap.has(dept)) return;
      const d = deptMap.get(dept)!;
      d.totalCount++;
      if (r.result === 'PASS') { d.completed++; d.passCount++; }
      else { d.pending++; }
      if (r.score != null) d.scores.push(r.score);
    });

    const allReports = Array.from(deptMap.entries())
      .filter(([, d]) => d.employees > 0)
      .map(([dept, d]) => ({
        department: dept,
        totalEmployees: d.employees,
        completedTrainings: d.completed,
        pendingTrainings: d.pending,
        completionRate: d.totalCount > 0 ? Math.round((d.completed / d.totalCount) * 100) : 0,
        averageScore: d.scores.length > 0 ? Math.round(d.scores.reduce((a, b) => a + b, 0) / d.scores.length) : 0,
        passRate: d.totalCount > 0 ? Math.round((d.passCount / d.totalCount) * 100) : 0,
      }));

    return allReports.filter(r =>
      selectedDepartment === 'all' || r.department === selectedDepartment
    );
  }, [employees, filteredByPeriod, selectedDepartment]);

  const programReports = useMemo((): ProgramReport[] => {
    return programs.filter(p => p.is_active).map(p => {
      const programResults = filteredByPeriod.filter(r => r.program_code === p.program_code);
      const passCount = programResults.filter(r => r.result === 'PASS').length;
      const failCount = programResults.filter(r => r.result === 'FAIL').length;
      const scores = programResults.filter(r => r.score != null).map(r => r.score!);
      const retrainingCount = programResults.filter(r => r.needs_retraining).length;
      return {
        program_code: p.program_code,
        program_name: p.program_name,
        totalSessions: 0,
        totalTrainees: programResults.length,
        passCount,
        failCount,
        passRate: programResults.length > 0 ? Math.round((passCount / programResults.length) * 100) : 0,
        averageScore: scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0,
        retrainingCount,
      };
    });
  }, [programs, filteredByPeriod]);

  const employeeExportData = useMemo((): EmployeeExportItem[] => {
    return employees.filter(e => e.status === 'ACTIVE').map(emp => {
      const empResults = filteredByPeriod.filter(r => r.employee_id === emp.employee_id);
      const passCount = empResults.filter(r => r.result === 'PASS').length;
      return {
        employee_id: emp.employee_id,
        employee_name: emp.employee_name,
        department: emp.department,
        position: emp.position,
        building: emp.building,
        line: emp.line,
        hire_date: emp.hire_date,
        status: emp.status,
        passCount,
        totalCount: empResults.length,
      };
    });
  }, [employees, filteredByPeriod]);

  // Compute unique positions from employee data
  const positions = useMemo(() => {
    const posSet = new Set(employees.filter(e => e.status === 'ACTIVE').map(e => e.position).filter(Boolean));
    return Array.from(posSet).sort().map(p => ({ value: p, label: p }));
  }, [employees]);

  // Filtered employee data based on selected filters
  const filteredEmployeeData = useMemo(() => {
    return employeeExportData.filter(emp => {
      const deptMatch = selectedEmployeeDepartment === 'all' || emp.department === selectedEmployeeDepartment;
      const posMatch = selectedEmployeePosition === 'all' || emp.position === selectedEmployeePosition;
      return deptMatch && posMatch;
    });
  }, [employeeExportData, selectedEmployeeDepartment, selectedEmployeePosition]);

  const handleExportToExcel = useCallback(async (reportType: ReportType) => {
    let data: Record<string, unknown>[] = [];
    let filename = '';

    switch (reportType) {
      case 'department':
        data = departmentReports.map((r) => ({
          [t('reports.exportDepartment')]: r.department,
          [t('reports.exportEmployeeCount')]: r.totalEmployees,
          [t('reports.exportCompleted')]: r.completedTrainings,
          [t('reports.exportIncomplete')]: r.pendingTrainings,
          [t('reports.exportCompletionRate')]: r.completionRate,
          [t('reports.exportAvgScore')]: r.averageScore,
          [t('reports.exportPassRate')]: r.passRate,
        }));
        filename = `${t('reports.deptTitle')}_${format(new Date(), 'yyyyMMdd')}.xlsx`;
        break;

      case 'program':
        data = programReports.map((r) => ({
          [t('reports.exportProgramCode')]: r.program_code,
          [t('reports.exportProgramName')]: r.program_name,
          [t('reports.exportSessionCount')]: r.totalSessions,
          [t('reports.exportTraineeCount')]: r.totalTrainees,
          [t('reports.exportPass')]: r.passCount,
          [t('reports.exportFail')]: r.failCount,
          [t('reports.exportPassRate')]: r.passRate,
          [t('reports.exportAvgScore')]: r.averageScore,
          [t('reports.exportRetraining')]: r.retrainingCount,
        }));
        filename = `${t('reports.progTitle')}_${format(new Date(), 'yyyyMMdd')}.xlsx`;
        break;

      case 'employee':
        data = employeeExportData.map((emp) => ({
          [t('reports.exportEmployeeId')]: emp.employee_id,
          [t('reports.exportName')]: emp.employee_name,
          [t('reports.exportDepartment')]: emp.department,
          [t('reports.exportPosition')]: emp.position,
          [t('reports.exportBuilding')]: emp.building,
          [t('reports.exportLine')]: emp.line,
          [t('reports.exportHireDate')]: emp.hire_date,
          [t('reports.exportStatus')]: emp.status,
          [t('reports.exportTrainingCompleted')]: emp.passCount,
          [t('reports.exportTotalTrainings')]: emp.totalCount,
        }));
        filename = `${t('reports.empTitle')}_${format(new Date(), 'yyyyMMdd')}.xlsx`;
        break;
    }

    const XLSX = await import('xlsx');

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Report');

    const colWidths = Object.keys(data[0] || {}).map((key) => ({
      wch: Math.max(key.length, 15),
    }));
    ws['!cols'] = colWidths;

    XLSX.writeFile(wb, filename);
  }, [departmentReports, programReports, employeeExportData, t]);

  const handleExportToPDF = useCallback(async (reportType: ReportType) => {
    const { exportTableToPDFWithUnicode } = await import('@/utils/pdfExport');

    let title = '';
    let filename = '';
    let columns: Array<{ header: string; dataKey: string }> = [];
    let data: Record<string, unknown>[] = [];

    switch (reportType) {
      case 'department':
        title = t('reports.pdfDeptReport');
        filename = `${t('reports.deptTitle')}_${format(new Date(), 'yyyyMMdd')}.pdf`;
        columns = [
          { header: t('reports.colDepartment'), dataKey: 'department' },
          { header: t('reports.colEmployeeCount'), dataKey: 'totalEmployees' },
          { header: t('reports.colCompleted'), dataKey: 'completedTrainings' },
          { header: t('reports.colIncomplete'), dataKey: 'pendingTrainings' },
          { header: t('reports.colCompletionRate'), dataKey: 'completionRate' },
          { header: t('reports.colAvgScore'), dataKey: 'averageScore' },
          { header: t('reports.colPassRate'), dataKey: 'passRate' },
        ];
        data = departmentReports as unknown as Record<string, unknown>[];
        break;

      case 'program':
        title = t('reports.pdfProgReport');
        filename = `${t('reports.progTitle')}_${format(new Date(), 'yyyyMMdd')}.pdf`;
        columns = [
          { header: t('reports.colProgramCode'), dataKey: 'program_code' },
          { header: t('reports.colProgramName'), dataKey: 'program_name' },
          { header: t('reports.colSessionCount'), dataKey: 'totalSessions' },
          { header: t('reports.colTraineeCount'), dataKey: 'totalTrainees' },
          { header: t('reports.colPass'), dataKey: 'passCount' },
          { header: t('reports.colFail'), dataKey: 'failCount' },
          { header: t('reports.colPassRate'), dataKey: 'passRate' },
          { header: t('reports.colAvgScore'), dataKey: 'averageScore' },
        ];
        data = programReports as unknown as Record<string, unknown>[];
        break;

      case 'employee':
        title = t('reports.pdfEmpReport');
        filename = `${t('reports.empTitle')}_${format(new Date(), 'yyyyMMdd')}.pdf`;
        columns = [
          { header: t('reports.exportEmployeeId'), dataKey: 'employee_id' },
          { header: t('reports.exportName'), dataKey: 'employee_name' },
          { header: t('reports.exportDepartment'), dataKey: 'department' },
          { header: t('reports.exportPosition'), dataKey: 'position' },
          { header: t('reports.exportBuilding'), dataKey: 'building' },
          { header: t('reports.exportLine'), dataKey: 'line' },
          { header: t('reports.exportTrainingCompleted'), dataKey: 'passCount' },
          { header: t('reports.exportTotalTrainings'), dataKey: 'totalCount' },
        ];
        data = employeeExportData as unknown as Record<string, unknown>[];
        break;
    }

    await exportTableToPDFWithUnicode(data, columns, { title, filename, orientation: 'landscape' });
  }, [departmentReports, programReports, employeeExportData, t]);

  const totalStats = useMemo(() => {
    const totalEmployees = employees.filter(e => e.status === 'ACTIVE').length;
    const totalTrainings = filteredByPeriod.length;
    const passCount = filteredByPeriod.filter(r => r.result === 'PASS').length;
    const passRate = totalTrainings > 0 ? Math.round((passCount / totalTrainings) * 100) : 0;
    const activePrograms = programs.filter(p => p.is_active).length;

    return { totalEmployees, totalTrainings, passRate, activePrograms };
  }, [employees, programs, filteredByPeriod]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
          <p className="text-muted-foreground">{t('common.loading', 'Loading...')}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center space-y-4">
            <p className="text-destructive font-medium">{error}</p>
            <Button onClick={loadData} variant="outline">
              {t('common.retry', 'Retry')}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t('reports.title')}</h1>
          <p className="text-muted-foreground">{t('reports.description')}</p>
        </div>
        <div className="flex gap-2">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-32">
              <Calendar className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1month">{t('reports.period1Month')}</SelectItem>
              <SelectItem value="3months">{t('reports.period3Months')}</SelectItem>
              <SelectItem value="6months">{t('reports.period6Months')}</SelectItem>
              <SelectItem value="1year">{t('reports.period1Year')}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <ReportSummaryCards totalStats={totalStats} />

      {/* 리포트 탭 */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as ReportType)}>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
          <TabsList>
            <TabsTrigger value="department" className="gap-2">
              <Building2 className="h-4 w-4" />
              {t('reports.byDepartment')}
            </TabsTrigger>
            <TabsTrigger value="program" className="gap-2">
              <GraduationCap className="h-4 w-4" />
              {t('reports.byProgram')}
            </TabsTrigger>
            <TabsTrigger value="employee" className="gap-2">
              <Users className="h-4 w-4" />
              {t('reports.byEmployee')}
            </TabsTrigger>
          </TabsList>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => handleExportToPDF(activeTab)}>
              <FileText className="h-4 w-4 mr-2" />
              PDF
            </Button>
            <Button onClick={() => handleExportToExcel(activeTab)}>
              <FileSpreadsheet className="h-4 w-4 mr-2" />
              Excel
            </Button>
          </div>
        </div>

        <TabsContent value="department">
          <DepartmentReportTable
            reports={departmentReports}
            departments={departments}
            selectedDepartment={selectedDepartment}
            onDepartmentChange={setSelectedDepartment}
          />
        </TabsContent>

        <TabsContent value="program">
          <ProgramReportTable reports={programReports} />
        </TabsContent>

        <TabsContent value="employee">
          <EmployeeReportTable
            data={filteredEmployeeData}
            departments={departments}
            positions={positions}
            selectedDepartment={selectedEmployeeDepartment}
            onDepartmentChange={setSelectedEmployeeDepartment}
            selectedPosition={selectedEmployeePosition}
            onPositionChange={setSelectedEmployeePosition}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
