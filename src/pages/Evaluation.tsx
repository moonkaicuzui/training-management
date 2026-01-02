import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import {
  BarChart3,
  Search,
  Star,
  TrendingUp,
  Users,
  FileText,
  Download,
  Eye,
  Plus,
  ThumbsUp,
  ThumbsDown,
  MessageSquare,
  Calendar,
  Target,
  Award,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

// Types
interface EvaluationCriteria {
  id: string;
  name: string;
  weight: number;
  description: string;
}

interface EvaluationResponse {
  criteriaId: string;
  score: number;
  comment?: string;
}

interface TrainingEvaluation {
  id: string;
  programId: string;
  programName: string;
  sessionId: string;
  sessionDate: string;
  employeeId: string;
  employeeName: string;
  department: string;
  evaluationType: 'reaction' | 'learning' | 'behavior' | 'results';
  responses: EvaluationResponse[];
  overallScore: number;
  feedback: string;
  submittedAt: string;
  status: 'pending' | 'submitted' | 'reviewed';
}

interface ProgramStats {
  programId: string;
  programName: string;
  totalEvaluations: number;
  averageScore: number;
  completionRate: number;
  reactionScore: number;
  learningScore: number;
  behaviorScore: number;
  resultsScore: number;
}

// Sample Data
const evaluationCriteria: EvaluationCriteria[] = [
  { id: 'c1', name: '교육 내용 적합성', weight: 20, description: '업무와의 관련성 및 실용성' },
  { id: 'c2', name: '강사 전문성', weight: 20, description: '강사의 지식과 전달력' },
  { id: 'c3', name: '교육 자료 품질', weight: 15, description: '교재 및 자료의 품질' },
  { id: 'c4', name: '교육 환경', weight: 10, description: '시설 및 장비 상태' },
  { id: 'c5', name: '학습 목표 달성', weight: 20, description: '교육 목표 달성 정도' },
  { id: 'c6', name: '업무 적용 가능성', weight: 15, description: '실제 업무 적용 가능성' },
];

const generateSampleEvaluations = (): TrainingEvaluation[] => {
  const programs = [
    { id: 'PRG001', name: '품질관리 기초' },
    { id: 'PRG002', name: '안전교육 정기' },
    { id: 'PRG003', name: '리더십 향상' },
    { id: 'PRG004', name: '프로세스 개선' },
    { id: 'PRG005', name: '고객서비스 교육' },
  ];

  const employees = [
    { id: 'EMP001', name: '김철수', dept: '품질관리부' },
    { id: 'EMP002', name: '이영희', dept: '생산부' },
    { id: 'EMP003', name: '박민수', dept: '영업부' },
    { id: 'EMP004', name: '정수진', dept: 'R&D' },
    { id: 'EMP005', name: '최동훈', dept: '인사부' },
  ];

  const types: TrainingEvaluation['evaluationType'][] = ['reaction', 'learning', 'behavior', 'results'];
  const statuses: TrainingEvaluation['status'][] = ['pending', 'submitted', 'reviewed'];
  const evaluations: TrainingEvaluation[] = [];

  for (let i = 0; i < 50; i++) {
    const program = programs[i % programs.length];
    const employee = employees[i % employees.length];
    const responses = evaluationCriteria.map(c => ({
      criteriaId: c.id,
      score: Math.floor(Math.random() * 3) + 3, // 3-5 score
      comment: Math.random() > 0.7 ? '좋은 교육이었습니다.' : undefined,
    }));
    const overallScore = responses.reduce((sum, r) => sum + r.score, 0) / responses.length;

    evaluations.push({
      id: `EVAL${String(i + 1).padStart(4, '0')}`,
      programId: program.id,
      programName: program.name,
      sessionId: `SES${String(Math.floor(i / 5) + 1).padStart(4, '0')}`,
      sessionDate: new Date(2024, Math.floor(i / 10), (i % 28) + 1).toISOString().split('T')[0],
      employeeId: employee.id,
      employeeName: employee.name,
      department: employee.dept,
      evaluationType: types[i % types.length],
      responses,
      overallScore: Math.round(overallScore * 10) / 10,
      feedback: '전반적으로 유익한 교육이었습니다.',
      submittedAt: new Date(2024, Math.floor(i / 10), (i % 28) + 2).toISOString(),
      status: statuses[Math.floor(Math.random() * statuses.length)],
    });
  }

  return evaluations;
};

const generateProgramStats = (evaluations: TrainingEvaluation[]): ProgramStats[] => {
  const programMap = new Map<string, TrainingEvaluation[]>();

  evaluations.forEach(e => {
    const existing = programMap.get(e.programId) || [];
    existing.push(e);
    programMap.set(e.programId, existing);
  });

  return Array.from(programMap.entries()).map(([programId, evals]) => {
    const programName = evals[0].programName;
    const totalEvaluations = evals.length;
    const averageScore = evals.reduce((sum, e) => sum + e.overallScore, 0) / totalEvaluations;
    const submitted = evals.filter(e => e.status !== 'pending').length;

    const byType = (type: TrainingEvaluation['evaluationType']) => {
      const typeEvals = evals.filter(e => e.evaluationType === type);
      return typeEvals.length > 0
        ? typeEvals.reduce((sum, e) => sum + e.overallScore, 0) / typeEvals.length
        : 0;
    };

    return {
      programId,
      programName,
      totalEvaluations,
      averageScore: Math.round(averageScore * 10) / 10,
      completionRate: Math.round((submitted / totalEvaluations) * 100),
      reactionScore: Math.round(byType('reaction') * 10) / 10,
      learningScore: Math.round(byType('learning') * 10) / 10,
      behaviorScore: Math.round(byType('behavior') * 10) / 10,
      resultsScore: Math.round(byType('results') * 10) / 10,
    };
  });
};

export default function Evaluation() {
  useTranslation();
  const [evaluations] = useState<TrainingEvaluation[]>(generateSampleEvaluations);
  const [programStats] = useState<ProgramStats[]>(() => generateProgramStats(evaluations));
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedEvaluation, setSelectedEvaluation] = useState<TrainingEvaluation | null>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [showNewEvaluationDialog, setShowNewEvaluationDialog] = useState(false);
  const [expandedProgram, setExpandedProgram] = useState<string | null>(null);

  // Filter evaluations
  const filteredEvaluations = evaluations.filter(e => {
    const matchesSearch =
      e.programName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.department.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = selectedType === 'all' || e.evaluationType === selectedType;
    const matchesStatus = selectedStatus === 'all' || e.status === selectedStatus;
    return matchesSearch && matchesType && matchesStatus;
  });

  // Calculate statistics
  const totalEvaluations = evaluations.length;
  const submittedCount = evaluations.filter(e => e.status !== 'pending').length;
  const averageScore = evaluations.reduce((sum, e) => sum + e.overallScore, 0) / totalEvaluations;
  const pendingCount = evaluations.filter(e => e.status === 'pending').length;

  const getTypeLabel = (type: TrainingEvaluation['evaluationType']) => {
    const labels = {
      reaction: '반응 평가',
      learning: '학습 평가',
      behavior: '행동 평가',
      results: '결과 평가',
    };
    return labels[type];
  };

  const getTypeBadgeVariant = (type: TrainingEvaluation['evaluationType']) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      reaction: 'default',
      learning: 'secondary',
      behavior: 'outline',
      results: 'destructive',
    };
    return variants[type] || 'default';
  };

  const getStatusLabel = (status: TrainingEvaluation['status']) => {
    const labels = {
      pending: '대기',
      submitted: '제출완료',
      reviewed: '검토완료',
    };
    return labels[status];
  };

  const getStatusBadgeVariant = (status: TrainingEvaluation['status']) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      pending: 'outline',
      submitted: 'secondary',
      reviewed: 'default',
    };
    return variants[status] || 'default';
  };

  const getScoreColor = (score: number) => {
    if (score >= 4.5) return 'text-green-600';
    if (score >= 3.5) return 'text-blue-600';
    if (score >= 2.5) return 'text-yellow-600';
    return 'text-red-600';
  };

  const handleViewDetails = (evaluation: TrainingEvaluation) => {
    setSelectedEvaluation(evaluation);
    setShowDetailDialog(true);
  };

  const handleExportExcel = async () => {
    const exportData = filteredEvaluations.map(e => ({
      '평가 ID': e.id,
      '프로그램': e.programName,
      '교육일': e.sessionDate,
      '참가자': e.employeeName,
      '부서': e.department,
      '평가 유형': getTypeLabel(e.evaluationType),
      '평균 점수': e.overallScore,
      '상태': getStatusLabel(e.status),
      '제출일': e.submittedAt.split('T')[0],
      '피드백': e.feedback,
    }));

    // 동적 import로 xlsx 라이브러리 로드 (초기 번들 크기 감소)
    const XLSX = await import('xlsx');

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, '교육 평가');
    XLSX.writeFile(wb, `training_evaluations_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const renderStars = (score: number) => {
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map(star => (
          <Star
            key={star}
            className={`h-4 w-4 ${
              star <= score ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
            }`}
          />
        ))}
        <span className={`ml-2 font-medium ${getScoreColor(score)}`}>{score.toFixed(1)}</span>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">교육 효과성 평가</h1>
          <p className="text-muted-foreground">
            Kirkpatrick 4단계 모델 기반 교육 효과 측정
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExportExcel}>
            <Download className="mr-2 h-4 w-4" />
            엑셀 다운로드
          </Button>
          <Button onClick={() => setShowNewEvaluationDialog(true)}>
            <Plus className="mr-2 h-4 w-4" />
            새 평가
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">전체 평가</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalEvaluations}</div>
            <p className="text-xs text-muted-foreground">
              {submittedCount}건 제출 완료
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">평균 점수</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getScoreColor(averageScore)}`}>
              {averageScore.toFixed(1)} / 5.0
            </div>
            <Progress value={(averageScore / 5) * 100} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">응답률</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round((submittedCount / totalEvaluations) * 100)}%
            </div>
            <Progress
              value={(submittedCount / totalEvaluations) * 100}
              className="mt-2"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">대기 중</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{pendingCount}</div>
            <p className="text-xs text-muted-foreground">
              평가 대기 건수
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">개요</TabsTrigger>
          <TabsTrigger value="evaluations">평가 목록</TabsTrigger>
          <TabsTrigger value="programs">프로그램별 분석</TabsTrigger>
          <TabsTrigger value="criteria">평가 기준</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Kirkpatrick Model */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Kirkpatrick 4단계 평가
                </CardTitle>
                <CardDescription>
                  교육 효과성 측정을 위한 4단계 모델
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ThumbsUp className="h-4 w-4 text-blue-500" />
                      <span>Level 1: 반응 (Reaction)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">4.2</span>
                      <Progress value={84} className="w-20" />
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <BarChart3 className="h-4 w-4 text-green-500" />
                      <span>Level 2: 학습 (Learning)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">3.9</span>
                      <Progress value={78} className="w-20" />
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-yellow-500" />
                      <span>Level 3: 행동 (Behavior)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">3.5</span>
                      <Progress value={70} className="w-20" />
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Award className="h-4 w-4 text-purple-500" />
                      <span>Level 4: 결과 (Results)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">3.8</span>
                      <Progress value={76} className="w-20" />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Recent Evaluations */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  최근 평가
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {evaluations.slice(0, 5).map(e => (
                    <div key={e.id} className="flex items-center justify-between border-b pb-2 last:border-0">
                      <div>
                        <p className="font-medium">{e.programName}</p>
                        <p className="text-sm text-muted-foreground">
                          {e.employeeName} · {e.department}
                        </p>
                      </div>
                      <div className="text-right">
                        {renderStars(e.overallScore)}
                        <p className="text-xs text-muted-foreground">
                          {e.submittedAt.split('T')[0]}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Top/Bottom Programs */}
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ThumbsUp className="h-5 w-5 text-green-500" />
                  최고 평가 프로그램
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {programStats
                    .sort((a, b) => b.averageScore - a.averageScore)
                    .slice(0, 3)
                    .map((p, idx) => (
                      <div key={p.programId} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-lg">{idx + 1}</span>
                          <span>{p.programName}</span>
                        </div>
                        {renderStars(p.averageScore)}
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ThumbsDown className="h-5 w-5 text-red-500" />
                  개선 필요 프로그램
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {programStats
                    .sort((a, b) => a.averageScore - b.averageScore)
                    .slice(0, 3)
                    .map((p, idx) => (
                      <div key={p.programId} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-lg">{idx + 1}</span>
                          <span>{p.programName}</span>
                        </div>
                        {renderStars(p.averageScore)}
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Evaluations List Tab */}
        <TabsContent value="evaluations" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-wrap gap-4">
                <div className="flex-1 min-w-[200px]">
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="프로그램, 참가자, 부서 검색..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-8"
                    />
                  </div>
                </div>
                <Select value={selectedType} onValueChange={setSelectedType}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="평가 유형" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">전체 유형</SelectItem>
                    <SelectItem value="reaction">반응 평가</SelectItem>
                    <SelectItem value="learning">학습 평가</SelectItem>
                    <SelectItem value="behavior">행동 평가</SelectItem>
                    <SelectItem value="results">결과 평가</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="상태" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">전체 상태</SelectItem>
                    <SelectItem value="pending">대기</SelectItem>
                    <SelectItem value="submitted">제출완료</SelectItem>
                    <SelectItem value="reviewed">검토완료</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Evaluations Table */}
          <Card>
            <CardContent className="pt-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>프로그램</TableHead>
                    <TableHead>참가자</TableHead>
                    <TableHead>부서</TableHead>
                    <TableHead>평가 유형</TableHead>
                    <TableHead>점수</TableHead>
                    <TableHead>상태</TableHead>
                    <TableHead>제출일</TableHead>
                    <TableHead className="text-right">작업</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredEvaluations.slice(0, 20).map((evaluation) => (
                    <TableRow key={evaluation.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{evaluation.programName}</p>
                          <p className="text-sm text-muted-foreground">
                            {evaluation.sessionDate}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>{evaluation.employeeName}</TableCell>
                      <TableCell>{evaluation.department}</TableCell>
                      <TableCell>
                        <Badge variant={getTypeBadgeVariant(evaluation.evaluationType)}>
                          {getTypeLabel(evaluation.evaluationType)}
                        </Badge>
                      </TableCell>
                      <TableCell>{renderStars(evaluation.overallScore)}</TableCell>
                      <TableCell>
                        <Badge variant={getStatusBadgeVariant(evaluation.status)}>
                          {getStatusLabel(evaluation.status)}
                        </Badge>
                      </TableCell>
                      <TableCell>{evaluation.submittedAt.split('T')[0]}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewDetails(evaluation)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Program Analysis Tab */}
        <TabsContent value="programs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>프로그램별 평가 분석</CardTitle>
              <CardDescription>
                각 교육 프로그램의 효과성을 Kirkpatrick 모델 기준으로 분석합니다
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {programStats.map((program) => (
                  <div key={program.programId} className="border rounded-lg">
                    <div
                      className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/50"
                      onClick={() => setExpandedProgram(
                        expandedProgram === program.programId ? null : program.programId
                      )}
                    >
                      <div className="flex items-center gap-4">
                        <div>
                          <p className="font-medium">{program.programName}</p>
                          <p className="text-sm text-muted-foreground">
                            {program.totalEvaluations}건 평가 · 응답률 {program.completionRate}%
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        {renderStars(program.averageScore)}
                        {expandedProgram === program.programId ? (
                          <ChevronUp className="h-5 w-5" />
                        ) : (
                          <ChevronDown className="h-5 w-5" />
                        )}
                      </div>
                    </div>
                    {expandedProgram === program.programId && (
                      <div className="border-t p-4 bg-muted/20">
                        <div className="grid gap-4 md:grid-cols-4">
                          <div className="text-center p-4 bg-background rounded-lg">
                            <ThumbsUp className="h-6 w-6 mx-auto text-blue-500 mb-2" />
                            <p className="text-sm text-muted-foreground">반응</p>
                            <p className={`text-xl font-bold ${getScoreColor(program.reactionScore)}`}>
                              {program.reactionScore || '-'}
                            </p>
                          </div>
                          <div className="text-center p-4 bg-background rounded-lg">
                            <BarChart3 className="h-6 w-6 mx-auto text-green-500 mb-2" />
                            <p className="text-sm text-muted-foreground">학습</p>
                            <p className={`text-xl font-bold ${getScoreColor(program.learningScore)}`}>
                              {program.learningScore || '-'}
                            </p>
                          </div>
                          <div className="text-center p-4 bg-background rounded-lg">
                            <TrendingUp className="h-6 w-6 mx-auto text-yellow-500 mb-2" />
                            <p className="text-sm text-muted-foreground">행동</p>
                            <p className={`text-xl font-bold ${getScoreColor(program.behaviorScore)}`}>
                              {program.behaviorScore || '-'}
                            </p>
                          </div>
                          <div className="text-center p-4 bg-background rounded-lg">
                            <Award className="h-6 w-6 mx-auto text-purple-500 mb-2" />
                            <p className="text-sm text-muted-foreground">결과</p>
                            <p className={`text-xl font-bold ${getScoreColor(program.resultsScore)}`}>
                              {program.resultsScore || '-'}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Criteria Tab */}
        <TabsContent value="criteria" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>평가 기준 관리</CardTitle>
              <CardDescription>
                교육 평가에 사용되는 평가 기준과 가중치를 관리합니다
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>평가 항목</TableHead>
                    <TableHead>설명</TableHead>
                    <TableHead>가중치</TableHead>
                    <TableHead>평균 점수</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {evaluationCriteria.map((criteria) => {
                    const avgScore = 3.5 + Math.random() * 1.5;
                    return (
                      <TableRow key={criteria.id}>
                        <TableCell className="font-medium">{criteria.name}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {criteria.description}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Progress value={criteria.weight} className="w-20" />
                            <span>{criteria.weight}%</span>
                          </div>
                        </TableCell>
                        <TableCell>{renderStars(avgScore)}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Evaluation Detail Dialog */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>평가 상세</DialogTitle>
            <DialogDescription>
              {selectedEvaluation?.programName} - {selectedEvaluation?.employeeName}
            </DialogDescription>
          </DialogHeader>
          {selectedEvaluation && (
            <div className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label className="text-muted-foreground">프로그램</Label>
                  <p className="font-medium">{selectedEvaluation.programName}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">교육일</Label>
                  <p className="font-medium">{selectedEvaluation.sessionDate}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">참가자</Label>
                  <p className="font-medium">{selectedEvaluation.employeeName}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">부서</Label>
                  <p className="font-medium">{selectedEvaluation.department}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">평가 유형</Label>
                  <Badge variant={getTypeBadgeVariant(selectedEvaluation.evaluationType)}>
                    {getTypeLabel(selectedEvaluation.evaluationType)}
                  </Badge>
                </div>
                <div>
                  <Label className="text-muted-foreground">상태</Label>
                  <Badge variant={getStatusBadgeVariant(selectedEvaluation.status)}>
                    {getStatusLabel(selectedEvaluation.status)}
                  </Badge>
                </div>
              </div>

              <div>
                <Label className="text-muted-foreground mb-2 block">평가 응답</Label>
                <div className="space-y-3">
                  {selectedEvaluation.responses.map((response) => {
                    const criteria = evaluationCriteria.find(c => c.id === response.criteriaId);
                    return (
                      <div key={response.criteriaId} className="flex items-center justify-between border-b pb-2">
                        <span>{criteria?.name}</span>
                        {renderStars(response.score)}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div>
                <Label className="text-muted-foreground">종합 점수</Label>
                <div className="mt-2">
                  {renderStars(selectedEvaluation.overallScore)}
                </div>
              </div>

              <div>
                <Label className="text-muted-foreground">피드백</Label>
                <p className="mt-1 p-3 bg-muted rounded-lg">
                  {selectedEvaluation.feedback}
                </p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDetailDialog(false)}>
              닫기
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* New Evaluation Dialog */}
      <Dialog open={showNewEvaluationDialog} onOpenChange={setShowNewEvaluationDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>새 평가 생성</DialogTitle>
            <DialogDescription>
              교육 프로그램에 대한 새 평가를 생성합니다
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>프로그램 선택</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="프로그램 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="prg1">품질관리 기초</SelectItem>
                    <SelectItem value="prg2">안전교육 정기</SelectItem>
                    <SelectItem value="prg3">리더십 향상</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>평가 유형</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="평가 유형 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="reaction">반응 평가</SelectItem>
                    <SelectItem value="learning">학습 평가</SelectItem>
                    <SelectItem value="behavior">행동 평가</SelectItem>
                    <SelectItem value="results">결과 평가</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>대상 세션</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="세션 선택" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ses1">2024-01-15 오전 세션</SelectItem>
                  <SelectItem value="ses2">2024-01-16 오후 세션</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>
                <Calendar className="inline h-4 w-4 mr-1" />
                마감일
              </Label>
              <Input type="date" />
            </div>
            <div className="space-y-2">
              <Label>안내 메시지</Label>
              <Textarea
                placeholder="평가 참여 안내 메시지를 입력하세요..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewEvaluationDialog(false)}>
              취소
            </Button>
            <Button onClick={() => setShowNewEvaluationDialog(false)}>
              평가 생성
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
