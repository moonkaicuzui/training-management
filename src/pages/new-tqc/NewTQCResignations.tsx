import { useEffect, useMemo } from 'react';
import {
  UserMinus,
  Download,
  TrendingDown,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
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
import { Badge } from '@/components/ui/badge';
import { PageLoading } from '@/components/common/LoadingSpinner';
import {
  ResignationPieChart,
  ResignationByTeamChart,
  ResignationByMonthChart,
  ResignationStats,
  ResignationFilters,
} from '@/components/new-tqc';
import {
  useNewTQCResignations,
  useNewTQCResignationAnalysis,
  useNewTQCTeams,
  useNewTQCResignationFilters,
  useNewTQCLoading,
  useNewTQCActions,
} from '@/stores/newTqcStore';
import type { NewTQCResignationFilters as FiltersType, ResignationReason } from '@/types/newTqc';
import { format } from 'date-fns';

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

export default function NewTQCResignations() {
  const resignations = useNewTQCResignations();
  const analysis = useNewTQCResignationAnalysis();
  const teams = useNewTQCTeams();
  const filters = useNewTQCResignationFilters();
  const loading = useNewTQCLoading();
  const {
    fetchResignations,
    fetchResignationAnalysis,
    fetchTeams,
    setResignationFilters,
  } = useNewTQCActions();

  useEffect(() => {
    const fetchData = async () => {
      await Promise.all([
        fetchResignations(filters),
        fetchResignationAnalysis(),
        fetchTeams(),
      ]);
    };
    fetchData();
  }, [filters]);

  // Filter resignations
  const filteredResignations = useMemo(() => {
    return resignations.filter((r) => {
      if (filters.reasonCategory && filters.reasonCategory !== 'all' && r.reason_category !== filters.reasonCategory) return false;
      if (filters.team && filters.team !== 'all' && r.trainee_id !== filters.team) return false; // Would need to join with trainee data
      if (filters.dateFrom && r.resign_date < filters.dateFrom) return false;
      if (filters.dateTo && r.resign_date > filters.dateTo) return false;
      return true;
    });
  }, [resignations, filters]);

  const handleFiltersChange = (newFilters: FiltersType) => {
    setResignationFilters(newFilters);
  };

  const handleClearFilters = () => {
    setResignationFilters({});
  };

  if (loading.analysis && !analysis) {
    return <PageLoading />;
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">퇴사 분석</h1>
          <p className="text-muted-foreground">
            신입 교육생 퇴사 현황 및 원인 분석
          </p>
        </div>
        <Button variant="outline">
          <Download className="h-4 w-4 mr-2" />
          리포트 다운로드
        </Button>
      </div>

      {/* Summary Stats */}
      <ResignationStats analysis={analysis} />

      {/* Charts Row */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <ResignationPieChart analysis={analysis} isLoading={loading.analysis} />
        <ResignationByTeamChart analysis={analysis} isLoading={loading.analysis} />
        <ResignationByMonthChart analysis={analysis} isLoading={loading.analysis} />
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <ResignationFilters
            filters={filters}
            teams={teams}
            onFiltersChange={handleFiltersChange}
            onClear={handleClearFilters}
          />
        </CardContent>
      </Card>

      {/* Resignations Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <UserMinus className="h-5 w-5" />
            퇴사자 목록 ({filteredResignations.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>퇴사일</TableHead>
                <TableHead>교육생 ID</TableHead>
                <TableHead>퇴사 사유</TableHead>
                <TableHead>상세 사유</TableHead>
                <TableHead>교육 기간</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading.resignations ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">
                    <div className="flex items-center justify-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary" />
                      로딩 중...
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredResignations.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    퇴사 기록이 없습니다.
                  </TableCell>
                </TableRow>
              ) : (
                filteredResignations.map((resignation) => (
                  <TableRow key={resignation.resignation_id}>
                    <TableCell>
                      {format(new Date(resignation.resign_date), 'yyyy-MM-dd')}
                    </TableCell>
                    <TableCell className="font-medium">
                      {resignation.trainee_id}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {REASON_LABELS[resignation.reason_category]}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground max-w-[300px] truncate">
                      {resignation.reason_detail || '-'}
                    </TableCell>
                    <TableCell>
                      {resignation.training_duration_days}일
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Insights Card */}
      {analysis && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingDown className="h-5 w-5" />
              분석 인사이트
            </CardTitle>
            <CardDescription>
              퇴사 데이터 기반 개선 포인트
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Top reason insight */}
              {analysis.byReason.length > 0 && (() => {
                const totalResignations = analysis.byReason.reduce((sum, item) => sum + item.count, 0);
                return (
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <h4 className="font-medium mb-2">주요 퇴사 사유</h4>
                    <p className="text-sm text-muted-foreground">
                      가장 많은 퇴사 사유는 <strong>{REASON_LABELS[analysis.byReason[0].reason]}</strong>
                      으로, 전체의 {totalResignations > 0 ? Math.round((analysis.byReason[0].count / totalResignations) * 100) : 0}%를 차지합니다.
                    </p>
                  </div>
                );
              })()}

              {/* Average training duration insight */}
              <div className="p-4 bg-muted/50 rounded-lg">
                <h4 className="font-medium mb-2">평균 교육 기간</h4>
                <p className="text-sm text-muted-foreground">
                  퇴사자들의 평균 교육 기간은 <strong>{analysis.averageTrainingDays}일</strong>입니다.
                  {analysis.averageTrainingDays < 14 && (
                    <span className="text-destructive"> 초기 퇴사율이 높습니다. 입사 초기 적응 프로그램 강화를 권장합니다.</span>
                  )}
                </p>
              </div>

              {/* Team with highest resignation */}
              {analysis.byTeam.length > 0 && (
                <div className="p-4 bg-muted/50 rounded-lg">
                  <h4 className="font-medium mb-2">팀별 퇴사 현황</h4>
                  <p className="text-sm text-muted-foreground">
                    <strong>{analysis.byTeam[0].team}</strong> 팀의 퇴사율이 가장 높습니다 ({analysis.byTeam[0].count}명).
                    해당 팀의 교육 환경 및 업무 강도를 점검해 보시기 바랍니다.
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
