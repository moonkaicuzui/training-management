import { useState, useMemo, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import * as api from '@/services/api';
import type { Employee, TrainingProgram, TrainingResultRecord } from '@/types';
import {
  Users,
  Building2,
  GraduationCap,
  TrendingUp,
  BarChart3,
  Calendar,
  Filter,
  FileSpreadsheet,
  FileText,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// 리포트 유형
type ReportType = 'department' | 'program' | 'employee';

interface DepartmentReport {
  department: string;
  totalEmployees: number;
  completedTrainings: number;
  pendingTrainings: number;
  completionRate: number;
  averageScore: number;
  passRate: number;
}

interface ProgramReport {
  program_code: string;
  program_name: string;
  totalSessions: number;
  totalTrainees: number;
  passCount: number;
  failCount: number;
  passRate: number;
  averageScore: number;
  retrainingCount: number;
}


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
      console.error('Failed to load report data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Compute departments from actual employee data
  const departments = useMemo(() => {
    const deptSet = new Set(employees.filter(e => e.status === 'ACTIVE').map(e => e.department));
    return Array.from(deptSet).sort().map(d => ({ value: d, label: d }));
  }, [employees]);

  // 부서별 리포트 (computed from real data)
  const departmentReports = useMemo((): DepartmentReport[] => {
    const deptMap = new Map<string, { employees: number; completed: number; pending: number; scores: number[]; passCount: number; totalCount: number }>();

    employees.filter(e => e.status === 'ACTIVE').forEach(emp => {
      const dept = emp.department || 'UNKNOWN';
      if (!deptMap.has(dept)) {
        deptMap.set(dept, { employees: 0, completed: 0, pending: 0, scores: [], passCount: 0, totalCount: 0 });
      }
      deptMap.get(dept)!.employees++;
    });

    results.forEach(r => {
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
  }, [employees, results, selectedDepartment]);

  // 프로그램별 리포트 (computed from real data)
  const programReports = useMemo((): ProgramReport[] => {
    return programs.filter(p => p.is_active).map(p => {
      const programResults = results.filter(r => r.program_code === p.program_code);
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
  }, [programs, results]);

  // 직원별 내보내기 데이터 (computed from real data)
  const employeeExportData = useMemo(() => {
    return employees.filter(e => e.status === 'ACTIVE').map(emp => {
      const empResults = results.filter(r => r.employee_id === emp.employee_id);
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
  }, [employees, results]);

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

  // Excel 내보내기 (동적 import로 번들 최적화)
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

    // 동적 import로 xlsx 라이브러리 로드 (초기 번들 크기 감소)
    const XLSX = await import('xlsx');

    // 워크북 생성
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Report');

    // 열 너비 자동 조정
    const colWidths = Object.keys(data[0] || {}).map((key) => ({
      wch: Math.max(key.length, 15),
    }));
    ws['!cols'] = colWidths;

    // 파일 다운로드
    XLSX.writeFile(wb, filename);
  }, [departmentReports, programReports, employeeExportData, t]);

  // PDF 내보내기 (html2canvas 방식으로 한글/베트남어 지원)
  const handleExportToPDF = useCallback(async (reportType: ReportType) => {
    // 동적 import로 한글 지원 PDF 함수 로드
    const { exportTableToPDFWithUnicode } = await import('@/utils/pdfExport');

    let title = '';
    let filename = '';
    let columns: Array<{ header: string; dataKey: string }> = [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let data: any[] = [];

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
        data = departmentReports;
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
        data = programReports;
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
        data = employeeExportData;
        break;
    }

    await exportTableToPDFWithUnicode(data, columns, { title, filename, orientation: 'landscape' });
  }, [departmentReports, programReports, employeeExportData, t]);

  // 전체 통계
  const totalStats = useMemo(() => {
    const totalEmployees = employees.filter(e => e.status === 'ACTIVE').length;
    const totalTrainings = results.length;
    const passCount = results.filter(r => r.result === 'PASS').length;
    const passRate = totalTrainings > 0 ? Math.round((passCount / totalTrainings) * 100) : 0;
    const activePrograms = programs.filter(p => p.is_active).length;

    return { totalEmployees, totalTrainings, passRate, activePrograms };
  }, [employees, programs, results]);

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

      {/* 요약 통계 */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalStats.totalEmployees}</p>
                <p className="text-xs text-muted-foreground">{t('reports.totalEmployees')}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <GraduationCap className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalStats.totalTrainings}</p>
                <p className="text-xs text-muted-foreground">{t('reports.totalTrainings')}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <TrendingUp className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalStats.passRate}%</p>
                <p className="text-xs text-muted-foreground">{t('reports.avgPassRate')}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <BarChart3 className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalStats.activePrograms}</p>
                <p className="text-xs text-muted-foreground">{t('reports.activePrograms')}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

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

        {/* 부서별 리포트 */}
        <TabsContent value="department">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>{t('reports.deptTitle')}</CardTitle>
                <CardDescription>{t('reports.deptDescription')}</CardDescription>
              </div>
              <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                <SelectTrigger className="w-40">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder={t('reports.allDepartments')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('reports.allDepartments')}</SelectItem>
                  {departments.map((dept) => (
                    <SelectItem key={dept.value} value={dept.value}>
                      {dept.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('reports.colDepartment')}</TableHead>
                    <TableHead className="text-right">{t('reports.colEmployeeCount')}</TableHead>
                    <TableHead className="text-right">{t('reports.colCompleted')}</TableHead>
                    <TableHead className="text-right">{t('reports.colIncomplete')}</TableHead>
                    <TableHead className="text-right">{t('reports.colCompletionRate')}</TableHead>
                    <TableHead className="text-right">{t('reports.colAvgScore')}</TableHead>
                    <TableHead className="text-right">{t('reports.colPassRate')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {departmentReports.map((report) => (
                    <TableRow key={report.department}>
                      <TableCell className="font-medium">{report.department}</TableCell>
                      <TableCell className="text-right">{report.totalEmployees}</TableCell>
                      <TableCell className="text-right">{report.completedTrainings}</TableCell>
                      <TableCell className="text-right">{report.pendingTrainings}</TableCell>
                      <TableCell className="text-right">
                        <Badge variant={report.completionRate >= 80 ? 'success' : report.completionRate >= 50 ? 'warning' : 'destructive'}>
                          {report.completionRate}%
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">{report.averageScore}</TableCell>
                      <TableCell className="text-right">
                        <Badge variant={report.passRate >= 80 ? 'success' : report.passRate >= 50 ? 'warning' : 'destructive'}>
                          {report.passRate}%
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 프로그램별 리포트 */}
        <TabsContent value="program">
          <Card>
            <CardHeader>
              <CardTitle>{t('reports.progTitle')}</CardTitle>
              <CardDescription>{t('reports.progDescription')}</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('reports.colProgramCode')}</TableHead>
                    <TableHead>{t('reports.colProgramName')}</TableHead>
                    <TableHead className="text-right">{t('reports.colSessionCount')}</TableHead>
                    <TableHead className="text-right">{t('reports.colTraineeCount')}</TableHead>
                    <TableHead className="text-right">{t('reports.colPass')}</TableHead>
                    <TableHead className="text-right">{t('reports.colFail')}</TableHead>
                    <TableHead className="text-right">{t('reports.colPassRate')}</TableHead>
                    <TableHead className="text-right">{t('reports.colAvgScore')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {programReports.map((report) => (
                    <TableRow key={report.program_code}>
                      <TableCell>
                        <Badge variant="outline">{report.program_code}</Badge>
                      </TableCell>
                      <TableCell className="font-medium">{report.program_name}</TableCell>
                      <TableCell className="text-right">{report.totalSessions}</TableCell>
                      <TableCell className="text-right">{report.totalTrainees}</TableCell>
                      <TableCell className="text-right text-green-600">{report.passCount}</TableCell>
                      <TableCell className="text-right text-red-600">{report.failCount}</TableCell>
                      <TableCell className="text-right">
                        <Badge variant={report.passRate >= 80 ? 'success' : report.passRate >= 50 ? 'warning' : 'destructive'}>
                          {report.passRate}%
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">{report.averageScore}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 직원별 리포트 */}
        <TabsContent value="employee">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-4">
              <div>
                <CardTitle>{t('reports.empTitle')}</CardTitle>
                <CardDescription>{t('reports.empDescription')}</CardDescription>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <Select value={selectedEmployeeDepartment} onValueChange={setSelectedEmployeeDepartment}>
                  <SelectTrigger className="w-40">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder={t('reports.empAllDepartments')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('reports.empAllDepartments')}</SelectItem>
                    {departments.map((dept) => (
                      <SelectItem key={dept.value} value={dept.value}>
                        {dept.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={selectedEmployeePosition} onValueChange={setSelectedEmployeePosition}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder={t('reports.empAllPositions')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('reports.empAllPositions')}</SelectItem>
                    {positions.map((pos) => (
                      <SelectItem key={pos.value} value={pos.value}>
                        {pos.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('reports.colEmployeeId')}</TableHead>
                    <TableHead>{t('reports.colEmployeeName')}</TableHead>
                    <TableHead>{t('reports.colDepartment')}</TableHead>
                    <TableHead>{t('reports.empFilterPosition')}</TableHead>
                    <TableHead>{t('reports.colBuilding')}</TableHead>
                    <TableHead>{t('reports.colLine')}</TableHead>
                    <TableHead className="text-right">{t('reports.colPassCount')}</TableHead>
                    <TableHead className="text-right">{t('reports.colTotalTrainings')}</TableHead>
                    <TableHead className="text-right">{t('reports.colCompletionRateEmp')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredEmployeeData.map((emp) => {
                    const completionRate = emp.totalCount > 0
                      ? Math.round((emp.passCount / emp.totalCount) * 100)
                      : 0;
                    return (
                      <TableRow key={emp.employee_id}>
                        <TableCell>
                          <Badge variant="outline">{emp.employee_id}</Badge>
                        </TableCell>
                        <TableCell className="font-medium">{emp.employee_name}</TableCell>
                        <TableCell>{emp.department}</TableCell>
                        <TableCell>{emp.position}</TableCell>
                        <TableCell>{emp.building}</TableCell>
                        <TableCell>{emp.line}</TableCell>
                        <TableCell className="text-right text-green-600">{emp.passCount}</TableCell>
                        <TableCell className="text-right">{emp.totalCount}</TableCell>
                        <TableCell className="text-right">
                          <Badge variant={completionRate >= 80 ? 'success' : completionRate >= 50 ? 'warning' : 'destructive'}>
                            {completionRate}%
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
