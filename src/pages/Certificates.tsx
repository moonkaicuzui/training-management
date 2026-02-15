import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import DOMPurify from 'dompurify';
import * as api from '@/services/api';
import {
  Award,
  Download,
  Printer,
  Search,
  FileText,
  CheckCircle,
  Calendar,
  User,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

// 로컬 타입 정의
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

interface CertificateData {
  certificateNumber: string;
  employeeId: string;
  employeeName: string;
  department: string;
  position: string;
  programCode: string;
  programName: string;
  trainingDate: string;
  score: number | null;
  grade: string | null;
  issueDate: string;
}

// 이수증 미리보기 컴포넌트
function CertificatePreview({ data, onClose }: { data: CertificateData; onClose: () => void }) {
  const { t } = useTranslation();
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    const content = printRef.current;
    if (!content) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>교육 이수증 - ${data.certificateNumber}</title>
          <style>
            @page { size: A4 landscape; margin: 0; }
            body {
              margin: 0;
              padding: 40px;
              font-family: 'Malgun Gothic', sans-serif;
              background: white;
            }
            .certificate {
              border: 8px double #1E40AF;
              padding: 40px;
              text-align: center;
              min-height: 500px;
              position: relative;
            }
            .logo { font-size: 24px; font-weight: bold; color: #1E40AF; margin-bottom: 10px; }
            .title { font-size: 36px; font-weight: bold; margin: 20px 0; color: #1E3A8A; }
            .subtitle { font-size: 18px; color: #64748B; margin-bottom: 30px; }
            .content { font-size: 16px; line-height: 2; margin: 30px 0; }
            .name { font-size: 28px; font-weight: bold; color: #0F172A; margin: 20px 0; }
            .details { display: flex; justify-content: center; gap: 40px; margin: 30px 0; }
            .detail-item { text-align: center; }
            .detail-label { font-size: 12px; color: #64748B; }
            .detail-value { font-size: 16px; font-weight: bold; }
            .footer { position: absolute; bottom: 40px; left: 0; right: 0; }
            .signature { margin-top: 40px; }
            .cert-number { font-size: 12px; color: #94A3B8; position: absolute; bottom: 20px; right: 40px; }
          </style>
        </head>
        <body>
          ${DOMPurify.sanitize(content.innerHTML)}
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Award className="h-5 w-5" />
            {t('certificates.previewTitle')}
          </DialogTitle>
        </DialogHeader>

        <div className="flex gap-2 mb-4">
          <Button onClick={handlePrint}>
            <Printer className="h-4 w-4 mr-2" />
            {t('certificates.print')}
          </Button>
          <Button variant="outline" onClick={handlePrint}>
            <Download className="h-4 w-4 mr-2" />
            {t('certificates.savePdf')}
          </Button>
        </div>

        <div
          ref={printRef}
          className="border-8 border-double border-primary p-8 bg-white text-center"
          style={{ minHeight: '400px' }}
        >
          <div className="certificate">
            <p className="text-2xl font-bold text-primary mb-2">Q-TRAIN</p>
            <p className="text-sm text-muted-foreground">{t('certificates.certOrgName')}</p>

            <h1 className="text-4xl font-bold my-8 text-primary">{t('certificates.certTitle')}</h1>
            <p className="text-lg text-muted-foreground mb-8">{t('certificates.certSubtitle')}</p>

            <div className="my-8">
              <p className="text-lg mb-4">{t('certificates.certBody')}</p>
              <p className="text-3xl font-bold my-6">{data.employeeName}</p>
              <p className="text-muted-foreground">{data.department} / {data.position}</p>
            </div>

            <div className="flex justify-center gap-12 my-8">
              <div className="text-center">
                <p className="text-sm text-muted-foreground">{t('certificates.certProgram')}</p>
                <p className="text-lg font-bold">{data.programName}</p>
                <Badge variant="outline" className="mt-1">{data.programCode}</Badge>
              </div>
              <div className="text-center">
                <p className="text-sm text-muted-foreground">{t('certificates.certDate')}</p>
                <p className="text-lg font-bold">{data.trainingDate}</p>
              </div>
              {data.score !== null && (
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">{t('certificates.certScore')}</p>
                  <p className="text-lg font-bold">{data.score}{t('certificates.certScoreUnit')}</p>
                  {data.grade && <Badge className="mt-1">{data.grade}</Badge>}
                </div>
              )}
            </div>

            <div className="mt-12 pt-8 border-t">
              <p className="text-lg">{t('certificates.certIssueDate')} {data.issueDate}</p>
              <div className="mt-8">
                <p className="text-sm text-muted-foreground">HWK Vietnam QIP Team</p>
                <p className="mt-2 font-bold">{t('certificates.certManager')}</p>
              </div>
            </div>

            <p className="text-xs text-muted-foreground mt-8">
              {t('certificates.certNumber')} {data.certificateNumber}
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function CertificatesPage() {
  const { t } = useTranslation();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProgram, setSelectedProgram] = useState<string>('all');
  const [selectedCertificate, setSelectedCertificate] = useState<CertificateData | null>(null);
  const [results, setResults] = useState<TrainingResult[]>([]);
  const [programs, setPrograms] = useState<ProgramOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
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
        console.error('Failed to load data:', err);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  // 이수 가능한 결과 목록 (already filtered to PASS only)
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

  // 이수증 번호 카운터
  const certificateCounterRef = useRef(0);

  // 이수증 발급 (이벤트 핸들러에서만 호출)
  const handleIssueCertificate = useCallback((result: TrainingResult) => {
    const year = new Date().getFullYear();
    // 이벤트 핸들러에서만 호출되므로 Math.random 사용 안전
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
      issueDate: format(new Date(), 'yyyy년 MM월 dd일'),
    };
    setSelectedCertificate(certData);
  }, []);

  // 통계
  const stats = useMemo(() => {
    const thisMonth = format(new Date(), 'yyyy-MM');
    return {
      totalEligible: eligibleResults.length,
      totalPrograms: programs.length,
      uniqueEmployees: new Set(eligibleResults.map(r => r.employee_id)).size,
      thisMonthCount: eligibleResults.filter(r => r.training_date.startsWith(thisMonth)).length,
    };
  }, [eligibleResults]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t('certificates.title')}</h1>
          <p className="text-muted-foreground">{t('certificates.description')}</p>
        </div>
      </div>

      {/* 통계 카드 */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.totalEligible}</p>
                <p className="text-xs text-muted-foreground">{t('certificates.issuableCount')}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Award className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.totalPrograms}</p>
                <p className="text-xs text-muted-foreground">{t('certificates.trainingPrograms')}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <User className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.uniqueEmployees}</p>
                <p className="text-xs text-muted-foreground">{t('certificates.completedEmployees')}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Calendar className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.thisMonthCount}</p>
                <p className="text-xs text-muted-foreground">{t('certificates.thisMonthCompleted')}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 필터 */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t('certificates.searchPlaceholder')}
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select value={selectedProgram} onValueChange={setSelectedProgram}>
              <SelectTrigger className="w-full md:w-64">
                <SelectValue placeholder="프로그램 선택" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체 프로그램</SelectItem>
                {programs.map((program) => (
                  <SelectItem key={program.program_code} value={program.program_code}>
                    {program.program_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* 이수 목록 */}
      <Card>
        <CardHeader>
          <CardTitle>이수 완료 목록</CardTitle>
          <CardDescription>
            교육을 이수한 직원의 이수증을 발급할 수 있습니다
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>사번</TableHead>
                <TableHead>이름</TableHead>
                <TableHead>부서</TableHead>
                <TableHead>프로그램</TableHead>
                <TableHead>교육일</TableHead>
                <TableHead>점수</TableHead>
                <TableHead>등급</TableHead>
                <TableHead className="text-right">액션</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {eligibleResults.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    발급 가능한 이수증이 없습니다
                  </TableCell>
                </TableRow>
              ) : (
                eligibleResults.map((result) => (
                  <TableRow key={result.result_id}>
                    <TableCell className="font-mono">{result.employee_id}</TableCell>
                    <TableCell className="font-medium">{result.employee_name}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{result.department}</Badge>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{result.program_name}</p>
                        <p className="text-xs text-muted-foreground">{result.program_code}</p>
                      </div>
                    </TableCell>
                    <TableCell>{result.training_date}</TableCell>
                    <TableCell>{result.score ?? '-'}</TableCell>
                    <TableCell>
                      {result.grade && (
                        <Badge variant={
                          result.grade === 'AA' ? 'default' :
                          result.grade === 'A' ? 'success' :
                          result.grade === 'B' ? 'warning' : 'secondary'
                        }>
                          {result.grade}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        onClick={() => handleIssueCertificate(result)}
                      >
                        <Award className="h-4 w-4 mr-1" />
                        이수증 발급
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* 이수증 미리보기 모달 */}
      {selectedCertificate && (
        <CertificatePreview
          data={selectedCertificate}
          onClose={() => setSelectedCertificate(null)}
        />
      )}
    </div>
  );
}
