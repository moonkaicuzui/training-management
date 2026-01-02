import { useState, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import {
  Download,
  Users,
  Building2,
  GraduationCap,
  TrendingUp,
  BarChart3,
  Calendar,
  Filter,
  FileSpreadsheet,
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

// 샘플 부서 목록
const departments = [
  { value: 'QIP', label: 'QIP' },
  { value: 'Production', label: 'Production' },
  { value: 'Quality', label: 'Quality' },
];

// 샘플 부서별 리포트 데이터
const sampleDepartmentReports: DepartmentReport[] = [
  {
    department: 'QIP',
    totalEmployees: 25,
    completedTrainings: 120,
    pendingTrainings: 15,
    completionRate: 89,
    averageScore: 87,
    passRate: 92,
  },
  {
    department: 'Production',
    totalEmployees: 150,
    completedTrainings: 580,
    pendingTrainings: 45,
    completionRate: 93,
    averageScore: 82,
    passRate: 88,
  },
  {
    department: 'Quality',
    totalEmployees: 35,
    completedTrainings: 175,
    pendingTrainings: 10,
    completionRate: 95,
    averageScore: 90,
    passRate: 95,
  },
];

// 샘플 프로그램별 리포트 데이터
const sampleProgramReports: ProgramReport[] = [
  {
    program_code: 'QIP-001',
    program_name: 'QIP 기초 교육',
    totalSessions: 12,
    totalTrainees: 156,
    passCount: 142,
    failCount: 14,
    passRate: 91,
    averageScore: 85,
    retrainingCount: 14,
  },
  {
    program_code: 'QIP-002',
    program_name: 'QIP 심화 교육',
    totalSessions: 8,
    totalTrainees: 98,
    passCount: 88,
    failCount: 10,
    passRate: 90,
    averageScore: 83,
    retrainingCount: 10,
  },
  {
    program_code: 'PRO-001',
    program_name: '생산 품질 관리',
    totalSessions: 20,
    totalTrainees: 320,
    passCount: 285,
    failCount: 35,
    passRate: 89,
    averageScore: 81,
    retrainingCount: 35,
  },
  {
    program_code: 'PRO-002',
    program_name: '안전 교육',
    totalSessions: 15,
    totalTrainees: 245,
    passCount: 230,
    failCount: 15,
    passRate: 94,
    averageScore: 88,
    retrainingCount: 15,
  },
];

// 샘플 직원 데이터
const sampleEmployees = [
  { employee_id: 'EMP-001', employee_name: '홍길동', department: 'QIP', position: 'TQC', building: 'A', line: 'L1', hire_date: '2022-03-15', status: 'ACTIVE', passCount: 8, totalCount: 8 },
  { employee_id: 'EMP-002', employee_name: '김철수', department: 'QIP', position: 'RQC', building: 'A', line: 'L2', hire_date: '2021-06-20', status: 'ACTIVE', passCount: 12, totalCount: 13 },
  { employee_id: 'EMP-003', employee_name: '이영희', department: 'Production', position: 'Line Leader', building: 'B', line: 'L1', hire_date: '2020-01-10', status: 'ACTIVE', passCount: 15, totalCount: 15 },
  { employee_id: 'EMP-004', employee_name: '박지성', department: 'Production', position: 'Operator', building: 'B', line: 'L2', hire_date: '2023-02-01', status: 'ACTIVE', passCount: 5, totalCount: 6 },
  { employee_id: 'EMP-005', employee_name: '손흥민', department: 'Quality', position: 'Inspector', building: 'C', line: 'L1', hire_date: '2019-11-15', status: 'ACTIVE', passCount: 20, totalCount: 20 },
];

export default function ReportsPage() {
  useTranslation();

  const [selectedDepartment, setSelectedDepartment] = useState<string>('all');
  const [selectedPeriod, setSelectedPeriod] = useState<string>('6months');
  const [activeTab, setActiveTab] = useState<ReportType>('department');

  // 부서별 리포트 필터링
  const departmentReports = useMemo(() => {
    return sampleDepartmentReports.filter(r =>
      selectedDepartment === 'all' || r.department === selectedDepartment
    );
  }, [selectedDepartment]);

  // Excel 내보내기 (동적 import로 번들 최적화)
  const handleExportToExcel = useCallback(async (reportType: ReportType) => {
    let data: Record<string, unknown>[] = [];
    let filename = '';

    switch (reportType) {
      case 'department':
        data = departmentReports.map((r) => ({
          '부서': r.department,
          '직원 수': r.totalEmployees,
          '완료 교육': r.completedTrainings,
          '미완료': r.pendingTrainings,
          '이수율(%)': r.completionRate,
          '평균 점수': r.averageScore,
          '합격률(%)': r.passRate,
        }));
        filename = `부서별_교육현황_${format(new Date(), 'yyyyMMdd')}.xlsx`;
        break;

      case 'program':
        data = sampleProgramReports.map((r) => ({
          '프로그램 코드': r.program_code,
          '프로그램명': r.program_name,
          '총 세션': r.totalSessions,
          '교육 인원': r.totalTrainees,
          '합격': r.passCount,
          '불합격': r.failCount,
          '합격률(%)': r.passRate,
          '평균 점수': r.averageScore,
          '재교육 필요': r.retrainingCount,
        }));
        filename = `프로그램별_현황_${format(new Date(), 'yyyyMMdd')}.xlsx`;
        break;

      case 'employee':
        data = sampleEmployees.map((emp) => ({
          '사번': emp.employee_id,
          '이름': emp.employee_name,
          '부서': emp.department,
          '직책': emp.position,
          '건물': emp.building,
          '라인': emp.line,
          '입사일': emp.hire_date,
          '상태': emp.status,
          '교육 이수 건수': emp.passCount,
          '총 교육 건수': emp.totalCount,
        }));
        filename = `직원별_교육현황_${format(new Date(), 'yyyyMMdd')}.xlsx`;
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
  }, [departmentReports]);

  // 전체 통계
  const totalStats = useMemo(() => {
    const totalEmployees = sampleEmployees.length;
    const totalTrainings = sampleEmployees.reduce((sum, e) => sum + e.totalCount, 0);
    const passCount = sampleEmployees.reduce((sum, e) => sum + e.passCount, 0);
    const passRate = totalTrainings > 0 ? Math.round((passCount / totalTrainings) * 100) : 0;
    const activePrograms = sampleProgramReports.length;

    return { totalEmployees, totalTrainings, passRate, activePrograms };
  }, []);

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">리포트</h1>
          <p className="text-muted-foreground">교육 현황 분석 및 데이터 내보내기</p>
        </div>
        <div className="flex gap-2">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-32">
              <Calendar className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1month">1개월</SelectItem>
              <SelectItem value="3months">3개월</SelectItem>
              <SelectItem value="6months">6개월</SelectItem>
              <SelectItem value="1year">1년</SelectItem>
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
                <p className="text-xs text-muted-foreground">전체 직원</p>
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
                <p className="text-xs text-muted-foreground">총 교육 건수</p>
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
                <p className="text-xs text-muted-foreground">평균 합격률</p>
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
                <p className="text-xs text-muted-foreground">활성 프로그램</p>
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
              부서별
            </TabsTrigger>
            <TabsTrigger value="program" className="gap-2">
              <GraduationCap className="h-4 w-4" />
              프로그램별
            </TabsTrigger>
            <TabsTrigger value="employee" className="gap-2">
              <Users className="h-4 w-4" />
              직원별
            </TabsTrigger>
          </TabsList>
          <Button onClick={() => handleExportToExcel(activeTab)}>
            <Download className="h-4 w-4 mr-2" />
            Excel 다운로드
          </Button>
        </div>

        {/* 부서별 리포트 */}
        <TabsContent value="department">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>부서별 교육 현황</CardTitle>
                <CardDescription>부서별 교육 이수율 및 성과 분석</CardDescription>
              </div>
              <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                <SelectTrigger className="w-40">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="부서 선택" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">전체 부서</SelectItem>
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
                    <TableHead>부서</TableHead>
                    <TableHead className="text-right">직원 수</TableHead>
                    <TableHead className="text-right">완료 교육</TableHead>
                    <TableHead className="text-right">미완료</TableHead>
                    <TableHead className="text-right">이수율</TableHead>
                    <TableHead className="text-right">평균 점수</TableHead>
                    <TableHead className="text-right">합격률</TableHead>
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
              <CardTitle>프로그램별 교육 현황</CardTitle>
              <CardDescription>교육 프로그램별 참여율 및 합격률 분석</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>프로그램 코드</TableHead>
                    <TableHead>프로그램명</TableHead>
                    <TableHead className="text-right">세션 수</TableHead>
                    <TableHead className="text-right">교육 인원</TableHead>
                    <TableHead className="text-right">합격</TableHead>
                    <TableHead className="text-right">불합격</TableHead>
                    <TableHead className="text-right">합격률</TableHead>
                    <TableHead className="text-right">평균 점수</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sampleProgramReports.map((report) => (
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
            <CardHeader>
              <CardTitle>직원별 교육 현황</CardTitle>
              <CardDescription>개인별 교육 이수 현황 (Excel 다운로드로 전체 데이터 확인)</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <FileSpreadsheet className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-4">
                  직원별 상세 교육 현황은 Excel 파일로 다운로드하여 확인하세요.
                </p>
                <Button onClick={() => handleExportToExcel('employee')}>
                  <Download className="h-4 w-4 mr-2" />
                  직원별 현황 Excel 다운로드
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
