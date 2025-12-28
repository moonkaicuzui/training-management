import { useMemo } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { LazyPieChart, LazyBarChart, Bar } from '@/components/charts/LazyCharts';
import type { NewTQCResignationAnalysis, ResignationReason } from '@/types/newTqc';

const REASON_LABELS: Record<ResignationReason, string> = {
  HEALTH_ISSUE: '건강 문제',
  FAMILY_MATTERS: '가정 사정',
  DISTANCE: '출퇴근 거리',
  LOW_SALARY: '급여 불만',
  JOB_CHANGE: '이직',
  ABSENCE: '무단 결근',
  ACCIDENT: '사고',
  OTHER: '기타',
};

const REASON_COLORS: Record<ResignationReason, string> = {
  HEALTH_ISSUE: '#EF4444',
  FAMILY_MATTERS: '#F97316',
  DISTANCE: '#EAB308',
  LOW_SALARY: '#22C55E',
  JOB_CHANGE: '#14B8A6',
  ABSENCE: '#3B82F6',
  ACCIDENT: '#8B5CF6',
  OTHER: '#6B7280',
};

interface ResignationChartProps {
  analysis: NewTQCResignationAnalysis | null;
  isLoading?: boolean;
}

export function ResignationPieChart({ analysis, isLoading }: ResignationChartProps) {
  // Calculate total resignations from byReason array
  const totalResignations = useMemo(() => {
    if (!analysis) return 0;
    return analysis.byReason.reduce((sum, item) => sum + item.count, 0);
  }, [analysis]);

  // Transform data to match LazyPieChart expected format: { grade: string; count: number }[]
  const chartData = useMemo(() => {
    if (!analysis) return [];

    return analysis.byReason.map((item) => ({
      grade: REASON_LABELS[item.reason],
      count: item.count,
    }));
  }, [analysis]);

  // Create colors map for pie chart
  const colors = useMemo(() => {
    const colorMap: Record<string, string> = {};
    Object.entries(REASON_LABELS).forEach(([key, label]) => {
      colorMap[label] = REASON_COLORS[key as ResignationReason];
    });
    return colorMap;
  }, []);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">퇴사 사유 분석</CardTitle>
        </CardHeader>
        <CardContent className="h-[300px] flex items-center justify-center">
          <div className="animate-pulse bg-muted rounded-full w-48 h-48" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">퇴사 사유 분석</CardTitle>
        <CardDescription>
          총 {totalResignations}명 퇴사
        </CardDescription>
      </CardHeader>
      <CardContent>
        {chartData.length > 0 ? (
          <LazyPieChart
            data={chartData}
            height={300}
            colors={colors}
          />
        ) : (
          <div className="h-[300px] flex items-center justify-center text-muted-foreground">
            퇴사 데이터가 없습니다.
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface ResignationByTeamChartProps {
  analysis: NewTQCResignationAnalysis | null;
  isLoading?: boolean;
}

export function ResignationByTeamChart({ analysis, isLoading }: ResignationByTeamChartProps) {
  const chartData = useMemo(() => {
    if (!analysis) return [];

    return analysis.byTeam.map((item) => ({
      name: item.team,
      count: item.count,
    }));
  }, [analysis]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">팀별 퇴사 현황</CardTitle>
        </CardHeader>
        <CardContent className="h-[300px] flex items-center justify-center">
          <div className="animate-pulse bg-muted rounded w-full h-48" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">팀별 퇴사 현황</CardTitle>
        <CardDescription>배치예정팀별 퇴사 인원</CardDescription>
      </CardHeader>
      <CardContent>
        {chartData.length > 0 ? (
          <LazyBarChart
            data={chartData}
            height={300}
          >
            <Bar dataKey="count" fill="#3B82F6" radius={[4, 4, 0, 0]} />
          </LazyBarChart>
        ) : (
          <div className="h-[300px] flex items-center justify-center text-muted-foreground">
            퇴사 데이터가 없습니다.
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface ResignationByMonthChartProps {
  analysis: NewTQCResignationAnalysis | null;
  isLoading?: boolean;
}

export function ResignationByMonthChart({ analysis, isLoading }: ResignationByMonthChartProps) {
  const chartData = useMemo(() => {
    if (!analysis) return [];

    return analysis.byMonth.map((item) => ({
      name: item.month,
      count: item.count,
    }));
  }, [analysis]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">월별 퇴사 추이</CardTitle>
        </CardHeader>
        <CardContent className="h-[300px] flex items-center justify-center">
          <div className="animate-pulse bg-muted rounded w-full h-48" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">월별 퇴사 추이</CardTitle>
        <CardDescription>최근 6개월 퇴사 현황</CardDescription>
      </CardHeader>
      <CardContent>
        {chartData.length > 0 ? (
          <LazyBarChart
            data={chartData}
            height={300}
          >
            <Bar dataKey="count" fill="#EF4444" radius={[4, 4, 0, 0]} />
          </LazyBarChart>
        ) : (
          <div className="h-[300px] flex items-center justify-center text-muted-foreground">
            퇴사 데이터가 없습니다.
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Summary Stats Card
interface ResignationStatsProps {
  analysis: NewTQCResignationAnalysis | null;
}

export function ResignationStats({ analysis }: ResignationStatsProps) {
  // Calculate total resignations from byReason array
  const totalResignations = useMemo(() => {
    if (!analysis) return 0;
    return analysis.byReason.reduce((sum, item) => sum + item.count, 0);
  }, [analysis]);

  if (!analysis) return null;

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            총 퇴사자 수
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalResignations}명</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            평균 교육 기간
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{analysis.averageTrainingDays}일</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            주요 퇴사 사유
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {analysis.byReason.length > 0
              ? REASON_LABELS[analysis.byReason[0].reason]
              : '-'}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
