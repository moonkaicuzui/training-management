/**
 * Audit Compliance Page
 * 아디다스 감사 대응 - 교육 규정 준수 현황 및 리포트
 */

import { useState, useMemo, useCallback, memo } from 'react';
import {
  Shield,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  AlertCircle,
  Download,
  FileText,
  Calendar,
  User,
  Clock,
  ChevronDown,
  ChevronRight,
  Search,
  Filter,
  RefreshCw,
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type {
  AuditComplianceMetric,
  AuditCategory,
  AuditCategorySummary,
  AuditFinding,
  CorrectiveAction,
} from '@/types/executive';

// 카테고리 한글명 매핑
const categoryNames: Record<AuditCategory, string> = {
  TRAINING_COVERAGE: '교육 적용 범위',
  CERTIFICATION: '자격 인증',
  DOCUMENTATION: '문서화',
  COMPETENCY: '역량 평가',
  RETRAINING: '재교육',
  RECORDS_RETENTION: '기록 보관',
};

// 샘플 데이터 - 실제로는 API에서 가져옴
const sampleMetrics: AuditComplianceMetric[] = [
  // TRAINING_COVERAGE
  {
    id: 'tc-001',
    category: 'TRAINING_COVERAGE',
    requirement: '모든 생산직 직원 필수 교육 이수',
    description: '생산라인 배치 전 필수 안전/품질 교육 100% 이수',
    currentStatus: 'COMPLIANT',
    currentValue: 98.5,
    targetValue: 95,
    unit: '%',
    evidence: ['교육 이수 현황 리포트', '월별 완료율 추이'],
    lastChecked: '2024-12-28',
  },
  {
    id: 'tc-002',
    category: 'TRAINING_COVERAGE',
    requirement: 'QIP 프로그램 대상자 교육 완료',
    description: 'QIP 담당자 전원 지정 프로그램 이수',
    currentStatus: 'PARTIAL',
    currentValue: 89,
    targetValue: 100,
    unit: '%',
    evidence: ['QIP 교육 현황'],
    lastChecked: '2024-12-28',
    actionRequired: '미이수자 11% 대상 집중 교육 필요',
  },
  // CERTIFICATION
  {
    id: 'cert-001',
    category: 'CERTIFICATION',
    requirement: '교육 이수 증명서 발급',
    description: '모든 필수 교육에 대한 이수 증명서 발급 및 관리',
    currentStatus: 'COMPLIANT',
    evidence: ['이수증 발급 시스템', '전자 서명 시스템'],
    lastChecked: '2024-12-28',
  },
  {
    id: 'cert-002',
    category: 'CERTIFICATION',
    requirement: '자격 유효기간 관리',
    description: '교육 자격의 유효기간 관리 및 갱신 알림',
    currentStatus: 'COMPLIANT',
    currentValue: 100,
    targetValue: 100,
    unit: '%',
    evidence: ['자동 만료 알림 시스템', '갱신 교육 일정'],
    lastChecked: '2024-12-28',
  },
  // DOCUMENTATION
  {
    id: 'doc-001',
    category: 'DOCUMENTATION',
    requirement: '교육 자료 버전 관리',
    description: '모든 교육 자료의 버전 및 개정 이력 관리',
    currentStatus: 'COMPLIANT',
    evidence: ['문서 관리 시스템', '개정 이력 로그'],
    lastChecked: '2024-12-28',
  },
  {
    id: 'doc-002',
    category: 'DOCUMENTATION',
    requirement: '교육 결과 기록 보존',
    description: '최소 5년간 교육 결과 기록 보존',
    currentStatus: 'COMPLIANT',
    evidence: ['데이터베이스 백업', '문서 보관 정책'],
    lastChecked: '2024-12-28',
  },
  // COMPETENCY
  {
    id: 'comp-001',
    category: 'COMPETENCY',
    requirement: '역량 평가 체계 수립',
    description: '직무별 역량 평가 기준 및 프로세스',
    currentStatus: 'PARTIAL',
    evidence: ['역량 평가 매트릭스'],
    lastChecked: '2024-12-28',
    actionRequired: '평가 기준 세분화 필요',
  },
  {
    id: 'comp-002',
    category: 'COMPETENCY',
    requirement: '합격/불합격 기준 명확화',
    description: '모든 교육 프로그램의 합격 기준 문서화',
    currentStatus: 'COMPLIANT',
    evidence: ['프로그램별 합격 기준 문서'],
    lastChecked: '2024-12-28',
  },
  // RETRAINING
  {
    id: 'retr-001',
    category: 'RETRAINING',
    requirement: '불합격자 재교육 프로세스',
    description: '불합격 시 재교육 절차 및 추적',
    currentStatus: 'COMPLIANT',
    currentValue: 100,
    targetValue: 100,
    unit: '%',
    evidence: ['재교육 프로세스 문서', '재교육 현황 리포트'],
    lastChecked: '2024-12-28',
  },
  {
    id: 'retr-002',
    category: 'RETRAINING',
    requirement: '정기 재교육 일정 관리',
    description: '자격 갱신을 위한 정기 재교육 계획',
    currentStatus: 'COMPLIANT',
    evidence: ['연간 교육 계획', '재교육 일정표'],
    lastChecked: '2024-12-28',
  },
  // RECORDS_RETENTION
  {
    id: 'rec-001',
    category: 'RECORDS_RETENTION',
    requirement: '교육 기록 변경 이력 관리',
    description: '모든 교육 결과 수정 시 변경 로그 기록',
    currentStatus: 'COMPLIANT',
    evidence: ['Result_Edit_Log 시트', '변경 사유 필수 입력'],
    lastChecked: '2024-12-28',
  },
  {
    id: 'rec-002',
    category: 'RECORDS_RETENTION',
    requirement: '데이터 삭제 금지 정책',
    description: '교육 결과 데이터 삭제 불가 (소프트 삭제만 허용)',
    currentStatus: 'COMPLIANT',
    evidence: ['NO DELETE 정책 코드', '소프트 삭제 구현'],
    lastChecked: '2024-12-28',
  },
];

const sampleFindings: AuditFinding[] = [
  {
    id: 'find-001',
    severity: 'MAJOR',
    category: 'TRAINING_COVERAGE',
    description: 'QIP 교육 미이수자 11% 존재',
    requirement: 'QIP 담당자 전원 교육 이수',
    evidence: '교육 현황 리포트 2024-12',
    recommendation: '1월 중 미이수자 대상 집중 교육 실시',
  },
  {
    id: 'find-002',
    severity: 'MINOR',
    category: 'COMPETENCY',
    description: '역량 평가 기준 세분화 필요',
    requirement: '직무별 상세 역량 평가 체계',
    evidence: '현재 평가 매트릭스',
    recommendation: '직무별 세부 역량 항목 추가',
  },
];

const sampleCorrectiveActions: CorrectiveAction[] = [
  {
    id: 'ca-001',
    findingId: 'find-001',
    action: 'QIP 미이수자 대상 집중 교육 일정 수립',
    responsiblePerson: '김교육',
    targetDate: '2025-01-15',
    status: 'IN_PROGRESS',
  },
  {
    id: 'ca-002',
    findingId: 'find-001',
    action: '미이수자 개별 연락 및 교육 참여 독려',
    responsiblePerson: '박담당',
    targetDate: '2025-01-05',
    status: 'COMPLETED',
    completedDate: '2025-01-03',
  },
  {
    id: 'ca-003',
    findingId: 'find-002',
    action: '역량 평가 기준 문서 개정',
    responsiblePerson: '이품질',
    targetDate: '2025-02-28',
    status: 'PENDING',
  },
];

// 상태별 배지 컴포넌트
const StatusBadge = memo(function StatusBadge({
  status,
}: {
  status: 'COMPLIANT' | 'NON_COMPLIANT' | 'PARTIAL' | 'NOT_APPLICABLE';
}) {
  switch (status) {
    case 'COMPLIANT':
      return (
        <Badge className="bg-green-500 hover:bg-green-600">
          <CheckCircle2 className="h-3 w-3 mr-1" />
          준수
        </Badge>
      );
    case 'NON_COMPLIANT':
      return (
        <Badge className="bg-red-500 hover:bg-red-600">
          <XCircle className="h-3 w-3 mr-1" />
          미준수
        </Badge>
      );
    case 'PARTIAL':
      return (
        <Badge className="bg-yellow-500 hover:bg-yellow-600">
          <AlertTriangle className="h-3 w-3 mr-1" />
          부분 준수
        </Badge>
      );
    case 'NOT_APPLICABLE':
      return (
        <Badge variant="secondary">
          해당 없음
        </Badge>
      );
  }
});

// 심각도별 배지 컴포넌트
const SeverityBadge = memo(function SeverityBadge({
  severity,
}: {
  severity: 'CRITICAL' | 'MAJOR' | 'MINOR' | 'OBSERVATION';
}) {
  switch (severity) {
    case 'CRITICAL':
      return <Badge className="bg-red-600">심각</Badge>;
    case 'MAJOR':
      return <Badge className="bg-orange-500">주요</Badge>;
    case 'MINOR':
      return <Badge className="bg-yellow-500">경미</Badge>;
    case 'OBSERVATION':
      return <Badge variant="secondary">관찰</Badge>;
  }
});

// 조치 상태별 배지
const ActionStatusBadge = memo(function ActionStatusBadge({
  status,
}: {
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'OVERDUE';
}) {
  switch (status) {
    case 'COMPLETED':
      return <Badge className="bg-green-500">완료</Badge>;
    case 'IN_PROGRESS':
      return <Badge className="bg-blue-500">진행중</Badge>;
    case 'PENDING':
      return <Badge variant="secondary">대기</Badge>;
    case 'OVERDUE':
      return <Badge className="bg-red-500">지연</Badge>;
  }
});

// 카테고리별 요약 계산
function calculateCategorySummaries(
  metrics: AuditComplianceMetric[]
): AuditCategorySummary[] {
  const categories = Object.keys(categoryNames) as AuditCategory[];

  return categories.map((category) => {
    const categoryMetrics = metrics.filter((m) => m.category === category);
    const compliantCount = categoryMetrics.filter(
      (m) => m.currentStatus === 'COMPLIANT'
    ).length;
    const nonCompliantCount = categoryMetrics.filter(
      (m) => m.currentStatus === 'NON_COMPLIANT'
    ).length;
    const partialCount = categoryMetrics.filter(
      (m) => m.currentStatus === 'PARTIAL'
    ).length;
    const totalCount = categoryMetrics.length;

    const score =
      totalCount > 0
        ? Math.round(((compliantCount + partialCount * 0.5) / totalCount) * 100)
        : 100;

    let status: 'PASS' | 'ATTENTION' | 'FAIL';
    if (nonCompliantCount > 0) {
      status = 'FAIL';
    } else if (partialCount > 0) {
      status = 'ATTENTION';
    } else {
      status = 'PASS';
    }

    return {
      category,
      categoryName: categoryNames[category],
      compliantCount,
      nonCompliantCount,
      partialCount,
      totalCount,
      score,
      status,
    };
  });
}

// 카테고리 카드 컴포넌트
const CategoryCard = memo(function CategoryCard({
  summary,
  metrics,
}: {
  summary: AuditCategorySummary;
  metrics: AuditComplianceMetric[];
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card
        className={`border-l-4 ${
          summary.status === 'PASS'
            ? 'border-l-green-500'
            : summary.status === 'ATTENTION'
              ? 'border-l-yellow-500'
              : 'border-l-red-500'
        }`}
      >
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {isOpen ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
                <div>
                  <CardTitle className="text-base">
                    {summary.categoryName}
                  </CardTitle>
                  <CardDescription>
                    {summary.totalCount}개 항목 중 {summary.compliantCount}개 준수
                  </CardDescription>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <span className="text-2xl font-bold">{summary.score}%</span>
                </div>
                <Badge
                  className={
                    summary.status === 'PASS'
                      ? 'bg-green-500'
                      : summary.status === 'ATTENTION'
                        ? 'bg-yellow-500'
                        : 'bg-red-500'
                  }
                >
                  {summary.status === 'PASS'
                    ? '적합'
                    : summary.status === 'ATTENTION'
                      ? '주의'
                      : '부적합'}
                </Badge>
              </div>
            </div>
            <Progress value={summary.score} className="mt-2 h-2" />
          </CardHeader>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent className="pt-0">
            <div className="space-y-3">
              {metrics.map((metric) => (
                <div
                  key={metric.id}
                  className="p-3 bg-muted/50 rounded-lg space-y-2"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="font-medium">{metric.requirement}</div>
                      <div className="text-sm text-muted-foreground">
                        {metric.description}
                      </div>
                    </div>
                    <StatusBadge status={metric.currentStatus} />
                  </div>

                  {metric.currentValue !== undefined && (
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-muted-foreground">현재:</span>
                      <span className="font-medium">
                        {metric.currentValue}
                        {metric.unit}
                      </span>
                      {metric.targetValue !== undefined && (
                        <>
                          <span className="text-muted-foreground">/ 목표:</span>
                          <span>
                            {metric.targetValue}
                            {metric.unit}
                          </span>
                        </>
                      )}
                    </div>
                  )}

                  {metric.actionRequired && (
                    <div className="flex items-start gap-2 text-sm text-orange-600">
                      <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                      <span>{metric.actionRequired}</span>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-1">
                    {metric.evidence.map((e) => (
                      <Badge key={e} variant="outline" className="text-xs">
                        <FileText className="h-3 w-3 mr-1" />
                        {e}
                      </Badge>
                    ))}
                  </div>

                  <div className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    최종 확인: {metric.lastChecked}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
});

export default function AuditCompliance() {
  const [activeTab, setActiveTab] = useState('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // 카테고리별 요약 계산
  const categorySummaries = useMemo(
    () => calculateCategorySummaries(sampleMetrics),
    []
  );

  // 전체 통계 계산
  const overallStats = useMemo(() => {
    const total = sampleMetrics.length;
    const compliant = sampleMetrics.filter(
      (m) => m.currentStatus === 'COMPLIANT'
    ).length;
    const partial = sampleMetrics.filter(
      (m) => m.currentStatus === 'PARTIAL'
    ).length;
    const nonCompliant = sampleMetrics.filter(
      (m) => m.currentStatus === 'NON_COMPLIANT'
    ).length;
    const score = Math.round(((compliant + partial * 0.5) / total) * 100);

    let status: 'PASS' | 'CONDITIONAL_PASS' | 'FAIL';
    if (nonCompliant > 0) {
      status = 'FAIL';
    } else if (partial > 0) {
      status = 'CONDITIONAL_PASS';
    } else {
      status = 'PASS';
    }

    return { total, compliant, partial, nonCompliant, score, status };
  }, []);

  // 필터링된 메트릭
  const filteredMetrics = useMemo(() => {
    return sampleMetrics.filter((m) => {
      const matchesSearch =
        searchQuery === '' ||
        m.requirement.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.description.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus =
        statusFilter === 'all' || m.currentStatus === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [searchQuery, statusFilter]);

  // Excel 내보내기
  const handleExportExcel = useCallback(async () => {
    const XLSX = await import('xlsx');

    const wb = XLSX.utils.book_new();

    // 요약 시트
    const summaryData = [
      ['아디다스 감사 대응 현황 리포트'],
      [''],
      ['생성일', new Date().toISOString().split('T')[0]],
      ['전체 점수', `${overallStats.score}%`],
      [
        '전체 상태',
        overallStats.status === 'PASS'
          ? '적합'
          : overallStats.status === 'CONDITIONAL_PASS'
            ? '조건부 적합'
            : '부적합',
      ],
      [''],
      ['카테고리별 현황'],
      ['카테고리', '준수', '부분준수', '미준수', '점수', '상태'],
      ...categorySummaries.map((s) => [
        s.categoryName,
        s.compliantCount,
        s.partialCount,
        s.nonCompliantCount,
        `${s.score}%`,
        s.status === 'PASS' ? '적합' : s.status === 'ATTENTION' ? '주의' : '부적합',
      ]),
    ];
    const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, wsSummary, '요약');

    // 상세 항목 시트
    const detailHeader = [
      'ID',
      '카테고리',
      '요구사항',
      '설명',
      '상태',
      '현재값',
      '목표값',
      '조치필요',
      '최종확인일',
    ];
    const detailRows = sampleMetrics.map((m) => [
      m.id,
      categoryNames[m.category],
      m.requirement,
      m.description,
      m.currentStatus === 'COMPLIANT'
        ? '준수'
        : m.currentStatus === 'PARTIAL'
          ? '부분준수'
          : m.currentStatus === 'NON_COMPLIANT'
            ? '미준수'
            : '해당없음',
      m.currentValue !== undefined ? `${m.currentValue}${m.unit || ''}` : '-',
      m.targetValue !== undefined ? `${m.targetValue}${m.unit || ''}` : '-',
      m.actionRequired || '-',
      m.lastChecked,
    ]);
    const wsDetail = XLSX.utils.aoa_to_sheet([detailHeader, ...detailRows]);
    XLSX.utils.book_append_sheet(wb, wsDetail, '상세항목');

    // 발견사항 시트
    const findingsHeader = [
      'ID',
      '심각도',
      '카테고리',
      '설명',
      '요구사항',
      '권고사항',
    ];
    const findingsRows = sampleFindings.map((f) => [
      f.id,
      f.severity,
      categoryNames[f.category],
      f.description,
      f.requirement,
      f.recommendation,
    ]);
    const wsFindings = XLSX.utils.aoa_to_sheet([findingsHeader, ...findingsRows]);
    XLSX.utils.book_append_sheet(wb, wsFindings, '발견사항');

    // 시정조치 시트
    const actionsHeader = [
      'ID',
      '관련발견',
      '조치내용',
      '담당자',
      '목표일',
      '상태',
      '완료일',
    ];
    const actionsRows = sampleCorrectiveActions.map((a) => [
      a.id,
      a.findingId,
      a.action,
      a.responsiblePerson,
      a.targetDate,
      a.status === 'COMPLETED'
        ? '완료'
        : a.status === 'IN_PROGRESS'
          ? '진행중'
          : a.status === 'PENDING'
            ? '대기'
            : '지연',
      a.completedDate || '-',
    ]);
    const wsActions = XLSX.utils.aoa_to_sheet([actionsHeader, ...actionsRows]);
    XLSX.utils.book_append_sheet(wb, wsActions, '시정조치');

    const filename = `아디다스_감사대응_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, filename);
  }, [overallStats, categorySummaries]);

  return (
    <div className="space-y-6">
      {/* 페이지 헤더 */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Shield className="h-6 w-6" />
            감사 대응 현황
          </h1>
          <p className="text-muted-foreground">
            아디다스 교육 규정 준수 현황 및 리포트
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            새로고침
          </Button>
          <Button onClick={handleExportExcel}>
            <Download className="h-4 w-4 mr-2" />
            Excel 내보내기
          </Button>
        </div>
      </div>

      {/* 전체 현황 요약 */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card
          className={`col-span-2 ${
            overallStats.status === 'PASS'
              ? 'border-green-500'
              : overallStats.status === 'CONDITIONAL_PASS'
                ? 'border-yellow-500'
                : 'border-red-500'
          } border-2`}
        >
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">전체 준수율</p>
                <p className="text-4xl font-bold">{overallStats.score}%</p>
                <Badge
                  className={`mt-2 ${
                    overallStats.status === 'PASS'
                      ? 'bg-green-500'
                      : overallStats.status === 'CONDITIONAL_PASS'
                        ? 'bg-yellow-500'
                        : 'bg-red-500'
                  }`}
                >
                  {overallStats.status === 'PASS'
                    ? '적합'
                    : overallStats.status === 'CONDITIONAL_PASS'
                      ? '조건부 적합'
                      : '부적합'}
                </Badge>
              </div>
              <div className="text-right space-y-1">
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <span>준수: {overallStats.compliant}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <AlertTriangle className="h-4 w-4 text-yellow-500" />
                  <span>부분: {overallStats.partial}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <XCircle className="h-4 w-4 text-red-500" />
                  <span>미준수: {overallStats.nonCompliant}</span>
                </div>
              </div>
            </div>
            <Progress value={overallStats.score} className="mt-4 h-3" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{sampleFindings.length}</p>
                <p className="text-xs text-muted-foreground">발견 사항</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Clock className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {
                    sampleCorrectiveActions.filter(
                      (a) => a.status === 'IN_PROGRESS'
                    ).length
                  }
                </p>
                <p className="text-xs text-muted-foreground">진행중 조치</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {
                    sampleCorrectiveActions.filter(
                      (a) => a.status === 'COMPLETED'
                    ).length
                  }
                </p>
                <p className="text-xs text-muted-foreground">완료된 조치</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 탭 네비게이션 */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">카테고리별 현황</TabsTrigger>
          <TabsTrigger value="findings">발견 사항</TabsTrigger>
          <TabsTrigger value="actions">시정 조치</TabsTrigger>
        </TabsList>

        {/* 카테고리별 현황 */}
        <TabsContent value="overview" className="space-y-4">
          {/* 검색 및 필터 */}
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="요구사항 검색..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체</SelectItem>
                <SelectItem value="COMPLIANT">준수</SelectItem>
                <SelectItem value="PARTIAL">부분 준수</SelectItem>
                <SelectItem value="NON_COMPLIANT">미준수</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* 카테고리별 카드 */}
          <div className="space-y-4">
            {categorySummaries.map((summary) => {
              const categoryMetrics = filteredMetrics.filter(
                (m) => m.category === summary.category
              );
              if (categoryMetrics.length === 0 && statusFilter !== 'all')
                return null;

              return (
                <CategoryCard
                  key={summary.category}
                  summary={summary}
                  metrics={
                    statusFilter === 'all'
                      ? sampleMetrics.filter(
                          (m) => m.category === summary.category
                        )
                      : categoryMetrics
                  }
                />
              );
            })}
          </div>
        </TabsContent>

        {/* 발견 사항 */}
        <TabsContent value="findings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>감사 발견 사항</CardTitle>
              <CardDescription>
                개선이 필요한 항목 및 권고사항
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {sampleFindings.map((finding) => (
                  <div
                    key={finding.id}
                    className="p-4 border rounded-lg space-y-3"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <SeverityBadge severity={finding.severity} />
                        <Badge variant="outline">
                          {categoryNames[finding.category]}
                        </Badge>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {finding.id}
                      </span>
                    </div>

                    <div>
                      <p className="font-medium">{finding.description}</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        요구사항: {finding.requirement}
                      </p>
                    </div>

                    <div className="flex items-start gap-2 text-sm">
                      <FileText className="h-4 w-4 mt-0.5 text-muted-foreground" />
                      <span className="text-muted-foreground">
                        근거: {finding.evidence}
                      </span>
                    </div>

                    <div className="p-3 bg-blue-50 rounded-lg">
                      <p className="text-sm font-medium text-blue-700">
                        권고사항
                      </p>
                      <p className="text-sm text-blue-600">
                        {finding.recommendation}
                      </p>
                    </div>
                  </div>
                ))}

                {sampleFindings.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <CheckCircle2 className="h-12 w-12 mx-auto mb-4 text-green-500" />
                    <p>발견된 문제가 없습니다.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 시정 조치 */}
        <TabsContent value="actions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>시정 조치 현황</CardTitle>
              <CardDescription>발견 사항에 대한 조치 계획 및 진행 현황</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {sampleCorrectiveActions.map((action) => {
                  const finding = sampleFindings.find(
                    (f) => f.id === action.findingId
                  );

                  return (
                    <div
                      key={action.id}
                      className="p-4 border rounded-lg space-y-3"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <ActionStatusBadge status={action.status} />
                          {finding && (
                            <span className="text-sm text-muted-foreground">
                              관련: {finding.description}
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {action.id}
                        </span>
                      </div>

                      <p className="font-medium">{action.action}</p>

                      <div className="flex flex-wrap gap-4 text-sm">
                        <div className="flex items-center gap-1">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span>담당: {action.responsiblePerson}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span>목표일: {action.targetDate}</span>
                        </div>
                        {action.completedDate && (
                          <div className="flex items-center gap-1 text-green-600">
                            <CheckCircle2 className="h-4 w-4" />
                            <span>완료일: {action.completedDate}</span>
                          </div>
                        )}
                      </div>

                      {action.verificationNotes && (
                        <div className="p-3 bg-green-50 rounded-lg text-sm">
                          <p className="font-medium text-green-700">검증 노트</p>
                          <p className="text-green-600">
                            {action.verificationNotes}
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
