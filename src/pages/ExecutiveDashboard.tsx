/**
 * Executive Dashboard Page
 * 경영진 대시보드 - 핵심 KPI 및 본사 보고용 리포트
 */

import { useState, useMemo, useCallback, memo } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Target,
  DollarSign,
  Users,
  Award,
  AlertTriangle,
  Calendar,
  Download,
  FileText,
  Building2,
  GraduationCap,
  UserMinus,
  CheckCircle2,
  BarChart3,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import {
  LazyBarChart,
  LazyLineChart,
  Bar,
  Line,
} from '@/components/charts/LazyCharts';
import type { ExecutiveKPI, BenchmarkMetric } from '@/types/executive';

// 샘플 KPI 데이터 (실제로는 API에서 가져옴)
const executiveKPIs: ExecutiveKPI[] = [
  {
    id: 'completion-rate',
    title: '교육 이수율',
    value: 92.5,
    target: 95,
    unit: '%',
    trend: 2.3,
    status: 'on-track',
  },
  {
    id: 'qualification-rate',
    title: '인력 적격률',
    value: 88.2,
    target: 90,
    unit: '%',
    trend: 1.5,
    status: 'on-track',
  },
  {
    id: 'turnover-rate',
    title: '교육 후 이직률',
    value: 4.2,
    target: 5,
    unit: '%',
    trend: -0.8,
    status: 'achieved',
    inverseTrend: true,
  },
  {
    id: 'roi',
    title: '교육 투자 ROI',
    value: 245,
    target: 200,
    unit: '%',
    trend: 15,
    status: 'achieved',
  },
];

// 샘플 ROI 데이터
const roiTrendData = [
  { period: '7월', cost: 15000, benefit: 35000, roi: 133 },
  { period: '8월', cost: 18000, benefit: 42000, roi: 133 },
  { period: '9월', cost: 16000, benefit: 45000, roi: 181 },
  { period: '10월', cost: 20000, benefit: 52000, roi: 160 },
  { period: '11월', cost: 17000, benefit: 55000, roi: 224 },
  { period: '12월', cost: 19000, benefit: 65000, roi: 242 },
];

// 샘플 벤치마크 데이터
const benchmarkData: BenchmarkMetric[] = [
  {
    metric: 'training-completion',
    metricKr: '교육 이수율',
    current: 92.5,
    target: 95,
    industryAvg: 85,
    hwkGroupAvg: 90,
    unit: '%',
  },
  {
    metric: 'first-pass-rate',
    metricKr: '첫 시도 합격률',
    current: 78,
    target: 80,
    industryAvg: 70,
    hwkGroupAvg: 75,
    unit: '%',
  },
  {
    metric: 'turnover-rate',
    metricKr: '교육 후 이직률',
    current: 4.2,
    target: 5,
    industryAvg: 8,
    hwkGroupAvg: 6,
    unit: '%',
    lowerIsBetter: true,
  },
  {
    metric: 'training-roi',
    metricKr: '교육 ROI',
    current: 245,
    target: 200,
    industryAvg: 150,
    hwkGroupAvg: 180,
    unit: '%',
  },
];

// KPI 카드 컴포넌트
const KPICard = memo(function KPICard({ kpi }: { kpi: ExecutiveKPI }) {
  const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
    'completion-rate': Award,
    'qualification-rate': Users,
    'turnover-rate': UserMinus,
    'roi': DollarSign,
  };
  const Icon = iconMap[kpi.id] || Target;

  const colorMap: Record<string, string> = {
    'completion-rate': 'text-green-600',
    'qualification-rate': 'text-blue-600',
    'turnover-rate': 'text-orange-600',
    'roi': 'text-purple-600',
  };
  const color = colorMap[kpi.id] || 'text-primary';

  const achievementRate = Math.min(100, (kpi.value / kpi.target) * 100);

  const getTrendBadge = () => {
    const isPositive = kpi.inverseTrend ? kpi.trend < 0 : kpi.trend > 0;
    return (
      <Badge variant={isPositive ? 'default' : 'destructive'} className="text-xs">
        {kpi.trend > 0 ? '↑' : '↓'} {Math.abs(kpi.trend)}%
      </Badge>
    );
  };

  return (
    <Card className="relative overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{kpi.title}</CardTitle>
        <Icon className={`h-4 w-4 ${color}`} />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">
          {kpi.value}
          {kpi.unit}
        </div>
        <div className="flex items-center justify-between mt-2">
          <span className="text-xs text-muted-foreground">
            목표: {kpi.target}
            {kpi.unit}
          </span>
          {getTrendBadge()}
        </div>
        <Progress value={achievementRate} className="mt-2 h-2" />
      </CardContent>
    </Card>
  );
});

// 벤치마크 비교 항목 컴포넌트
const BenchmarkItem = memo(function BenchmarkItem({
  metric,
}: {
  metric: BenchmarkMetric;
}) {
  const achievementRate = Math.min(100, (metric.current / metric.target) * 100);
  const vsIndustry = metric.lowerIsBetter
    ? metric.industryAvg - metric.current
    : metric.current - metric.industryAvg;
  const vsGroup = metric.lowerIsBetter
    ? metric.hwkGroupAvg - metric.current
    : metric.current - metric.hwkGroupAvg;

  const status =
    achievementRate >= 100 ? 'achieved' : achievementRate >= 80 ? 'on-track' : 'below';

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="font-medium">{metric.metricKr}</span>
          <Badge
            variant={
              status === 'achieved'
                ? 'default'
                : status === 'on-track'
                  ? 'secondary'
                  : 'destructive'
            }
          >
            {status === 'achieved' ? '달성' : status === 'on-track' ? '진행중' : '미달'}
          </Badge>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <span className="text-muted-foreground">
            목표: {metric.target}
            {metric.unit}
          </span>
          <span className="font-bold text-lg">
            {metric.current}
            {metric.unit}
          </span>
        </div>
      </div>

      <Progress value={achievementRate} className="h-3" />

      <div className="flex gap-4 text-xs">
        <div className="flex items-center gap-1">
          {vsIndustry >= 0 ? (
            <TrendingUp className="h-3 w-3 text-green-500" />
          ) : (
            <TrendingDown className="h-3 w-3 text-red-500" />
          )}
          <span className="text-muted-foreground">업계평균 대비:</span>
          <span className={vsIndustry >= 0 ? 'text-green-600' : 'text-red-600'}>
            {vsIndustry >= 0 ? '+' : ''}
            {vsIndustry.toFixed(1)}
            {metric.unit}
          </span>
        </div>
        <div className="flex items-center gap-1">
          {vsGroup >= 0 ? (
            <TrendingUp className="h-3 w-3 text-green-500" />
          ) : (
            <TrendingDown className="h-3 w-3 text-red-500" />
          )}
          <span className="text-muted-foreground">HWK그룹 대비:</span>
          <span className={vsGroup >= 0 ? 'text-green-600' : 'text-red-600'}>
            {vsGroup >= 0 ? '+' : ''}
            {vsGroup.toFixed(1)}
            {metric.unit}
          </span>
        </div>
      </div>
    </div>
  );
});

// 본사 리포트 미리보기 컴포넌트
const HQReportPreview = memo(function HQReportPreview() {
  const reportData = {
    period: '2024년 12월',
    totalEmployees: 1250,
    trainingCompletionRate: 92.5,
    vsLastPeriod: 2.3,
    roi: 245,
    kpis: executiveKPIs.map((kpi) => ({
      name: kpi.title,
      value: kpi.value,
      target: kpi.target,
      status: kpi.status,
      trend: kpi.trend,
    })),
    achievements: [
      '교육 ROI 목표 초과 달성 (245% vs 목표 200%)',
      '신입 조기 이직률 목표 달성 (4.2% vs 목표 5%)',
      'QIP 프로그램 합격률 95% 달성',
    ],
    riskItems: [
      {
        severity: 'MEDIUM' as 'HIGH' | 'MEDIUM' | 'LOW',
        description: 'B동 2라인 교육 이수율 80% 미달',
        action: '담당자 지정 및 집중 교육 계획 수립',
      },
    ],
    nextPeriodPlans: [
      'B동 2라인 집중 교육 (1월 15일~20일)',
      '신규 프로그램 도입: 안전관리 심화',
    ],
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'achieved':
        return <Badge className="bg-green-500">달성</Badge>;
      case 'on-track':
        return <Badge className="bg-blue-500">진행중</Badge>;
      case 'at-risk':
        return <Badge className="bg-yellow-500">주의</Badge>;
      default:
        return <Badge className="bg-red-500">미달</Badge>;
    }
  };

  return (
    <Card className="border-2">
      <CardHeader className="bg-muted/50">
        <div className="text-center">
          <h2 className="text-xl font-bold">HWK Vietnam</h2>
          <h3 className="text-lg font-semibold text-muted-foreground">
            교육 현황 보고서
          </h3>
          <p className="text-sm text-muted-foreground mt-2">
            보고 기간: {reportData.period}
          </p>
        </div>
      </CardHeader>
      <CardContent className="pt-6 space-y-6">
        {/* Executive Summary */}
        <div>
          <h4 className="font-semibold mb-3 flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Executive Summary
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-2xl font-bold">{reportData.totalEmployees}</p>
              <p className="text-xs text-muted-foreground">총 직원</p>
            </div>
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-2xl font-bold">{reportData.trainingCompletionRate}%</p>
              <p className="text-xs text-muted-foreground">교육 이수율</p>
            </div>
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-2xl font-bold flex items-center justify-center gap-1">
                {reportData.vsLastPeriod > 0 ? (
                  <TrendingUp className="h-4 w-4 text-green-500" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-red-500" />
                )}
                {Math.abs(reportData.vsLastPeriod)}%
              </p>
              <p className="text-xs text-muted-foreground">전월 대비</p>
            </div>
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-2xl font-bold">{reportData.roi}%</p>
              <p className="text-xs text-muted-foreground">교육 ROI</p>
            </div>
          </div>
        </div>

        <Separator />

        {/* KPI 현황 */}
        <div>
          <h4 className="font-semibold mb-3">핵심 성과 지표 (KPI)</h4>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2">지표명</th>
                <th className="text-right py-2">실적</th>
                <th className="text-right py-2">목표</th>
                <th className="text-right py-2">전월대비</th>
                <th className="text-center py-2">상태</th>
              </tr>
            </thead>
            <tbody>
              {reportData.kpis.map((kpi) => (
                <tr key={kpi.name} className="border-b">
                  <td className="py-2">{kpi.name}</td>
                  <td className="text-right py-2 font-medium">{kpi.value}%</td>
                  <td className="text-right py-2 text-muted-foreground">{kpi.target}%</td>
                  <td className="text-right py-2">
                    <span className={kpi.trend > 0 ? 'text-green-600' : 'text-red-600'}>
                      {kpi.trend > 0 ? '+' : ''}
                      {kpi.trend}%
                    </span>
                  </td>
                  <td className="text-center py-2">{getStatusBadge(kpi.status)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <Separator />

        {/* 주요 성과 & 리스크 */}
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-semibold mb-3 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              주요 성과
            </h4>
            <ul className="space-y-2">
              {reportData.achievements.map((item) => (
                <li key={item} className="flex items-start gap-2 text-sm">
                  <span className="text-green-500">•</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-3 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-orange-500" />
              리스크 항목
            </h4>
            <ul className="space-y-2">
              {reportData.riskItems.map((item) => (
                <li key={item.description} className="text-sm p-2 bg-muted rounded">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge
                      variant={item.severity === 'HIGH' ? 'destructive' : 'secondary'}
                      className="text-xs"
                    >
                      {item.severity}
                    </Badge>
                    {item.description}
                  </div>
                  <p className="text-xs text-muted-foreground">조치: {item.action}</p>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <Separator />

        {/* 차기 계획 */}
        <div>
          <h4 className="font-semibold mb-3">차기 계획</h4>
          <ul className="space-y-2">
            {reportData.nextPeriodPlans.map((item) => (
              <li key={item} className="flex items-start gap-2 text-sm">
                <Calendar className="h-4 w-4 mt-0.5 text-blue-500" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
});

export default function ExecutiveDashboard() {
  const [activeTab, setActiveTab] = useState('overview');

  // Excel 다운로드 핸들러
  const handleExportExcel = useCallback(async () => {
    const XLSX = await import('xlsx');

    // 워크북 생성
    const wb = XLSX.utils.book_new();

    // 요약 시트
    const summaryData = [
      ['HWK Vietnam 교육 현황 보고서'],
      [''],
      ['보고 기간', '2024년 12월'],
      ['총 직원 수', 1250],
      ['교육 이수율', '92.5%'],
      ['전월 대비', '+2.3%'],
      ['교육 ROI', '245%'],
    ];
    const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, wsSummary, '요약');

    // KPI 시트
    const kpiHeader = ['KPI명', '실적', '목표', '달성률', '상태'];
    const kpiRows = executiveKPIs.map((kpi) => [
      kpi.title,
      `${kpi.value}${kpi.unit}`,
      `${kpi.target}${kpi.unit}`,
      `${((kpi.value / kpi.target) * 100).toFixed(1)}%`,
      kpi.status === 'achieved'
        ? '달성'
        : kpi.status === 'on-track'
          ? '진행중'
          : '미달',
    ]);
    const wsKPI = XLSX.utils.aoa_to_sheet([kpiHeader, ...kpiRows]);
    XLSX.utils.book_append_sheet(wb, wsKPI, 'KPI현황');

    // 파일 저장
    const filename = `HWK_경영진보고서_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, filename);
  }, []);

  // ROI 차트 데이터 메모이제이션
  const roiChartData = useMemo(() => roiTrendData, []);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Building2 className="h-6 w-6" />
            경영진 대시보드
          </h1>
          <p className="text-muted-foreground">
            HWK Vietnam 교육 현황 Executive Summary
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Calendar className="h-4 w-4 mr-2" />
            기간 설정
          </Button>
          <Button onClick={handleExportExcel}>
            <Download className="h-4 w-4 mr-2" />
            본사 리포트
          </Button>
        </div>
      </div>

      {/* 핵심 KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {executiveKPIs.map((kpi) => (
          <KPICard key={kpi.id} kpi={kpi} />
        ))}
      </div>

      {/* Tab Navigation */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">총괄 현황</TabsTrigger>
          <TabsTrigger value="roi">ROI 분석</TabsTrigger>
          <TabsTrigger value="benchmark">벤치마킹</TabsTrigger>
          <TabsTrigger value="report">본사 리포트</TabsTrigger>
        </TabsList>

        {/* 총괄 현황 */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* 월별 교육 현황 차트 */}
            <Card>
              <CardHeader>
                <CardTitle>월별 교육 현황</CardTitle>
                <CardDescription>교육 비용 vs 효과 추이</CardDescription>
              </CardHeader>
              <CardContent>
                <LazyBarChart
                  data={roiChartData}
                  height={300}
                  xAxisKey="period"
                  xAxisFormatter={(v) => v}
                >
                  <Bar
                    dataKey="cost"
                    name="교육 비용 ($)"
                    fill="#EF4444"
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar
                    dataKey="benefit"
                    name="효과 ($)"
                    fill="#10B981"
                    radius={[4, 4, 0, 0]}
                  />
                </LazyBarChart>
              </CardContent>
            </Card>

            {/* 신입 교육 현황 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <GraduationCap className="h-5 w-5" />
                  신입 교육 현황 (New TQC)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-primary/10 rounded-lg text-center">
                      <p className="text-2xl font-bold text-primary">45</p>
                      <p className="text-xs text-muted-foreground">현재 교육중</p>
                    </div>
                    <div className="p-4 bg-green-500/10 rounded-lg text-center">
                      <p className="text-2xl font-bold text-green-600">128</p>
                      <p className="text-xs text-muted-foreground">교육 완료</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">평균 교육 기간</span>
                      <span className="font-medium">28일</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">30일 내 이직률</span>
                      <span className="font-medium text-green-600">4.2%</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">교육 완료율</span>
                      <span className="font-medium">92%</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ROI 분석 */}
        <TabsContent value="roi" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-red-100 rounded-lg">
                    <DollarSign className="h-5 w-5 text-red-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">$105,000</p>
                    <p className="text-xs text-muted-foreground">총 교육 투자</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <TrendingUp className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">$294,000</p>
                    <p className="text-xs text-muted-foreground">총 효과 (환산)</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <BarChart3 className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">$189,000</p>
                    <p className="text-xs text-muted-foreground">순 효과</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Target className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">245%</p>
                    <p className="text-xs text-muted-foreground">평균 ROI</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>월별 ROI 추이</CardTitle>
              <CardDescription>교육 투자 대비 효과</CardDescription>
            </CardHeader>
            <CardContent>
              <LazyLineChart data={roiChartData} height={350} xAxisKey="period">
                <Line
                  type="monotone"
                  dataKey="roi"
                  name="ROI (%)"
                  stroke="#8B5CF6"
                  strokeWidth={3}
                />
              </LazyLineChart>
            </CardContent>
          </Card>

          {/* ROI 구성 요소 */}
          <Card>
            <CardHeader>
              <CardTitle>ROI 효과 구성</CardTitle>
              <CardDescription>교육 효과의 구성 요소별 분석</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  {
                    label: '생산성 향상',
                    value: 45,
                    description: '교육 이수자의 작업 속도 및 정확도 향상',
                    color: 'bg-green-500',
                  },
                  {
                    label: '품질 개선',
                    value: 30,
                    description: '불량률 감소 및 재작업 비용 절감',
                    color: 'bg-blue-500',
                  },
                  {
                    label: '이직률 감소',
                    value: 25,
                    description: '교육 이수자 이직률 감소로 인한 채용/교육 비용 절감',
                    color: 'bg-purple-500',
                  },
                ].map((item) => (
                  <div key={item.label} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <div>
                        <span className="font-medium">{item.label}</span>
                        <p className="text-xs text-muted-foreground">{item.description}</p>
                      </div>
                      <Badge variant="outline">{item.value}%</Badge>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${item.color}`}
                        style={{ width: `${item.value}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 벤치마킹 */}
        <TabsContent value="benchmark" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-full">
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">
                      {benchmarkData.filter((m) => (m.current / m.target) >= 1).length}/
                      {benchmarkData.length}
                    </p>
                    <p className="text-xs text-muted-foreground">목표 달성</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-full">
                    <TrendingUp className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">4/4</p>
                    <p className="text-xs text-muted-foreground">업계 평균 상회</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 rounded-full">
                    <Building2 className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">3/4</p>
                    <p className="text-xs text-muted-foreground">그룹 평균 상회</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-orange-100 rounded-full">
                    <AlertTriangle className="h-5 w-5 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">1</p>
                    <p className="text-xs text-muted-foreground">개선 필요</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>지표별 상세 현황</CardTitle>
              <CardDescription>
                각 지표별 목표 대비 달성률 및 벤치마크 비교
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {benchmarkData.map((metric) => (
                <BenchmarkItem key={metric.metric} metric={metric} />
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* 본사 리포트 */}
        <TabsContent value="report" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="h-5 w-5" />
                    본사 보고용 리포트
                  </CardTitle>
                  <CardDescription>
                    HWK 그룹 본사 보고 형식에 맞춘 교육 현황 리포트
                  </CardDescription>
                </div>
                <Button onClick={handleExportExcel}>
                  <Download className="h-4 w-4 mr-2" />
                  Excel 다운로드
                </Button>
              </div>
            </CardHeader>
          </Card>

          <HQReportPreview />
        </TabsContent>
      </Tabs>
    </div>
  );
}
