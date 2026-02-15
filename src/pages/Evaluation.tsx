import { useState, useEffect, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import type { TrainingEvaluation } from '@/services/evaluationService';
import * as api from '@/services/api';
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

// UI-only types
interface EvaluationCriteria {
  id: string;
  name: string;
  weight: number;
  description: string;
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

const evaluationCriteria: EvaluationCriteria[] = [
  { id: 'c1', name: '교육 내용 적합성', weight: 20, description: '업무와의 관련성 및 실용성' },
  { id: 'c2', name: '강사 전문성', weight: 20, description: '강사의 지식과 전달력' },
  { id: 'c3', name: '교육 자료 품질', weight: 15, description: '교재 및 자료의 품질' },
  { id: 'c4', name: '교육 환경', weight: 10, description: '시설 및 장비 상태' },
  { id: 'c5', name: '학습 목표 달성', weight: 20, description: '교육 목표 달성 정도' },
  { id: 'c6', name: '업무 적용 가능성', weight: 15, description: '실제 업무 적용 가능성' },
];

export default function Evaluation() {
  const { t } = useTranslation();
  const [evaluations, setEvaluations] = useState<TrainingEvaluation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedEvaluation, setSelectedEvaluation] = useState<TrainingEvaluation | null>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [showNewEvaluationDialog, setShowNewEvaluationDialog] = useState(false);
  const [expandedProgram, setExpandedProgram] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await api.getEvaluations();
      setEvaluations(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load evaluations');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const programStats = useMemo((): ProgramStats[] => {
    const statsMap = new Map<string, {
      programId: string;
      programName: string;
      scores: number[];
      types: Record<string, number[]>;
    }>();

    evaluations.forEach((e) => {
      if (!statsMap.has(e.programId)) {
        statsMap.set(e.programId, {
          programId: e.programId,
          programName: e.programName,
          scores: [],
          types: { reaction: [], learning: [], behavior: [], results: [] },
        });
      }
      const stat = statsMap.get(e.programId)!;
      stat.scores.push(e.overallScore);
      if (stat.types[e.evaluationType]) {
        stat.types[e.evaluationType].push(e.overallScore);
      }
    });

    return Array.from(statsMap.values()).map((s) => {
      const avg = (arr: number[]) => arr.length > 0 ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
      return {
        programId: s.programId,
        programName: s.programName,
        totalEvaluations: s.scores.length,
        averageScore: Math.round(avg(s.scores) * 10) / 10,
        completionRate: Math.round((s.scores.filter(sc => sc >= 60).length / Math.max(s.scores.length, 1)) * 100),
        reactionScore: Math.round(avg(s.types.reaction) * 10) / 10,
        learningScore: Math.round(avg(s.types.learning) * 10) / 10,
        behaviorScore: Math.round(avg(s.types.behavior) * 10) / 10,
        resultsScore: Math.round(avg(s.types.results) * 10) / 10,
      };
    });
  }, [evaluations]);

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
  const averageScore = totalEvaluations > 0 ? evaluations.reduce((sum, e) => sum + e.overallScore, 0) / totalEvaluations : 0;
  const pendingCount = evaluations.filter(e => e.status === 'pending').length;

  const getTypeLabel = (type: TrainingEvaluation['evaluationType']) => {
    const labels: Record<string, string> = {
      reaction: t('evaluation.typeReaction'),
      learning: t('evaluation.typeLearning'),
      behavior: t('evaluation.typeBehavior'),
      results: t('evaluation.typeResults'),
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
    const labels: Record<string, string> = {
      pending: t('evaluation.statusPending'),
      submitted: t('evaluation.statusSubmitted'),
      reviewed: t('evaluation.statusReviewed'),
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
      [t('evaluation.exportId')]: e.id,
      [t('evaluation.programCol')]: e.programName,
      [t('evaluation.exportTrainingDate')]: e.sessionDate,
      [t('evaluation.participantCol')]: e.employeeName,
      [t('evaluation.departmentCol')]: e.department,
      [t('evaluation.exportType')]: getTypeLabel(e.evaluationType),
      [t('evaluation.exportAvgScore')]: e.overallScore,
      [t('evaluation.statusCol')]: getStatusLabel(e.status),
      [t('evaluation.submittedDate')]: e.submittedAt.split('T')[0],
      [t('evaluation.exportFeedback')]: e.feedback,
    }));

    // 동적 import로 xlsx 라이브러리 로드 (초기 번들 크기 감소)
    const XLSX = await import('xlsx');

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, t('evaluation.sheetName'));
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
          <h1 className="text-3xl font-bold tracking-tight">{t('evaluation.title')}</h1>
          <p className="text-muted-foreground">
            {t('evaluation.description')}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExportExcel}>
            <Download className="mr-2 h-4 w-4" />
            {t('evaluation.exportExcel')}
          </Button>
          <Button onClick={() => setShowNewEvaluationDialog(true)}>
            <Plus className="mr-2 h-4 w-4" />
            {t('evaluation.newEvaluation')}
          </Button>
        </div>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        </div>
      )}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
          <p className="text-red-800">{error}</p>
          <Button variant="outline" size="sm" className="mt-2" onClick={loadData}>재시도</Button>
        </div>
      )}

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('evaluation.totalEvaluations')}</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalEvaluations}</div>
            <p className="text-xs text-muted-foreground">
              {t('evaluation.submittedCount', { count: submittedCount })}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('evaluation.avgScore')}</CardTitle>
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
            <CardTitle className="text-sm font-medium">{t('evaluation.responseRate')}</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totalEvaluations > 0 ? Math.round((submittedCount / totalEvaluations) * 100) : 0}%
            </div>
            <Progress
              value={totalEvaluations > 0 ? (submittedCount / totalEvaluations) * 100 : 0}
              className="mt-2"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('evaluation.pending')}</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{pendingCount}</div>
            <p className="text-xs text-muted-foreground">
              {t('evaluation.pendingCount')}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">{t('evaluation.overviewTab')}</TabsTrigger>
          <TabsTrigger value="evaluations">{t('evaluation.evaluationsTab')}</TabsTrigger>
          <TabsTrigger value="programs">{t('evaluation.programsTab')}</TabsTrigger>
          <TabsTrigger value="criteria">{t('evaluation.criteriaTab')}</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Kirkpatrick Model */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  {t('evaluation.kirkpatrickTitle')}
                </CardTitle>
                <CardDescription>
                  {t('evaluation.kirkpatrickDesc')}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  {([
                    { type: 'reaction', icon: <ThumbsUp className="h-4 w-4 text-blue-500" />, label: t('evaluation.level1') },
                    { type: 'learning', icon: <BarChart3 className="h-4 w-4 text-green-500" />, label: t('evaluation.level2') },
                    { type: 'behavior', icon: <TrendingUp className="h-4 w-4 text-yellow-500" />, label: t('evaluation.level3') },
                    { type: 'results', icon: <Award className="h-4 w-4 text-purple-500" />, label: t('evaluation.level4') },
                  ] as const).map(level => {
                    const levelEvals = evaluations.filter(e => e.evaluationType === level.type);
                    const levelAvg = levelEvals.length > 0
                      ? levelEvals.reduce((sum, e) => sum + e.overallScore, 0) / levelEvals.length
                      : 0;
                    return (
                      <div key={level.type} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {level.icon}
                          <span>{level.label}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{levelAvg > 0 ? levelAvg.toFixed(1) : '-'}</span>
                          <Progress value={levelAvg > 0 ? (levelAvg / 5) * 100 : 0} className="w-20" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Recent Evaluations */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  {t('evaluation.recentEvaluations')}
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
                  {t('evaluation.topPrograms')}
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
                  {t('evaluation.needsImprovement')}
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
                      placeholder={t('evaluation.searchPlaceholder')}
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-8"
                    />
                  </div>
                </div>
                <Select value={selectedType} onValueChange={setSelectedType}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder={t('evaluation.typeFilter')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('evaluation.allTypes')}</SelectItem>
                    <SelectItem value="reaction">{t('evaluation.typeReaction')}</SelectItem>
                    <SelectItem value="learning">{t('evaluation.typeLearning')}</SelectItem>
                    <SelectItem value="behavior">{t('evaluation.typeBehavior')}</SelectItem>
                    <SelectItem value="results">{t('evaluation.typeResults')}</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder={t('evaluation.statusFilter')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('evaluation.allStatuses')}</SelectItem>
                    <SelectItem value="pending">{t('evaluation.statusPending')}</SelectItem>
                    <SelectItem value="submitted">{t('evaluation.statusSubmitted')}</SelectItem>
                    <SelectItem value="reviewed">{t('evaluation.statusReviewed')}</SelectItem>
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
                    <TableHead>{t('evaluation.programCol')}</TableHead>
                    <TableHead>{t('evaluation.participantCol')}</TableHead>
                    <TableHead>{t('evaluation.departmentCol')}</TableHead>
                    <TableHead>{t('evaluation.typeCol')}</TableHead>
                    <TableHead>{t('evaluation.scoreCol')}</TableHead>
                    <TableHead>{t('evaluation.statusCol')}</TableHead>
                    <TableHead>{t('evaluation.submittedDate')}</TableHead>
                    <TableHead className="text-right">{t('evaluation.actionsCol')}</TableHead>
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
              <CardTitle>{t('evaluation.programAnalysis')}</CardTitle>
              <CardDescription>
                {t('evaluation.programAnalysisDesc')}
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
                            {t('evaluation.evaluationCount', { count: program.totalEvaluations, rate: program.completionRate })}
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
                            <p className="text-sm text-muted-foreground">{t('evaluation.reaction')}</p>
                            <p className={`text-xl font-bold ${getScoreColor(program.reactionScore)}`}>
                              {program.reactionScore || '-'}
                            </p>
                          </div>
                          <div className="text-center p-4 bg-background rounded-lg">
                            <BarChart3 className="h-6 w-6 mx-auto text-green-500 mb-2" />
                            <p className="text-sm text-muted-foreground">{t('evaluation.learning')}</p>
                            <p className={`text-xl font-bold ${getScoreColor(program.learningScore)}`}>
                              {program.learningScore || '-'}
                            </p>
                          </div>
                          <div className="text-center p-4 bg-background rounded-lg">
                            <TrendingUp className="h-6 w-6 mx-auto text-yellow-500 mb-2" />
                            <p className="text-sm text-muted-foreground">{t('evaluation.behavior')}</p>
                            <p className={`text-xl font-bold ${getScoreColor(program.behaviorScore)}`}>
                              {program.behaviorScore || '-'}
                            </p>
                          </div>
                          <div className="text-center p-4 bg-background rounded-lg">
                            <Award className="h-6 w-6 mx-auto text-purple-500 mb-2" />
                            <p className="text-sm text-muted-foreground">{t('evaluation.results')}</p>
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
              <CardTitle>{t('evaluation.criteriaManagement')}</CardTitle>
              <CardDescription>
                {t('evaluation.criteriaManagementDesc')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('evaluation.criteriaItem')}</TableHead>
                    <TableHead>{t('evaluation.criteriaDescription')}</TableHead>
                    <TableHead>{t('evaluation.criteriaWeight')}</TableHead>
                    <TableHead>{t('evaluation.criteriaAvgScore')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {evaluationCriteria.map((criteria) => {
                    // Compute average score from actual evaluations for this criteria
                    const criteriaScores = evaluations
                      .flatMap(e => e.responses || [])
                      .filter(r => r.criteriaId === criteria.id)
                      .map(r => r.score);
                    const avgScore = criteriaScores.length > 0
                      ? criteriaScores.reduce((a, b) => a + b, 0) / criteriaScores.length
                      : 0;
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
                        <TableCell>{avgScore > 0 ? renderStars(avgScore) : <span className="text-muted-foreground">-</span>}</TableCell>
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
            <DialogTitle>{t('evaluation.detailTitle')}</DialogTitle>
            <DialogDescription>
              {selectedEvaluation?.programName} - {selectedEvaluation?.employeeName}
            </DialogDescription>
          </DialogHeader>
          {selectedEvaluation && (
            <div className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label className="text-muted-foreground">{t('evaluation.programLabel')}</Label>
                  <p className="font-medium">{selectedEvaluation.programName}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">{t('evaluation.trainingDateLabel')}</Label>
                  <p className="font-medium">{selectedEvaluation.sessionDate}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">{t('evaluation.participantLabel')}</Label>
                  <p className="font-medium">{selectedEvaluation.employeeName}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">{t('evaluation.departmentLabel')}</Label>
                  <p className="font-medium">{selectedEvaluation.department}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">{t('evaluation.typeLabel')}</Label>
                  <Badge variant={getTypeBadgeVariant(selectedEvaluation.evaluationType)}>
                    {getTypeLabel(selectedEvaluation.evaluationType)}
                  </Badge>
                </div>
                <div>
                  <Label className="text-muted-foreground">{t('evaluation.statusLabel')}</Label>
                  <Badge variant={getStatusBadgeVariant(selectedEvaluation.status)}>
                    {getStatusLabel(selectedEvaluation.status)}
                  </Badge>
                </div>
              </div>

              <div>
                <Label className="text-muted-foreground mb-2 block">{t('evaluation.responsesLabel')}</Label>
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
                <Label className="text-muted-foreground">{t('evaluation.overallScore')}</Label>
                <div className="mt-2">
                  {renderStars(selectedEvaluation.overallScore)}
                </div>
              </div>

              <div>
                <Label className="text-muted-foreground">{t('evaluation.feedbackLabel')}</Label>
                <p className="mt-1 p-3 bg-muted rounded-lg">
                  {selectedEvaluation.feedback}
                </p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDetailDialog(false)}>
              {t('common.close')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* New Evaluation Dialog */}
      <Dialog open={showNewEvaluationDialog} onOpenChange={setShowNewEvaluationDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t('evaluation.createTitle')}</DialogTitle>
            <DialogDescription>
              {t('evaluation.createDesc')}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>{t('evaluation.selectProgram')}</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder={t('evaluation.selectProgram')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="prg1">품질관리 기초</SelectItem>
                    <SelectItem value="prg2">안전교육 정기</SelectItem>
                    <SelectItem value="prg3">리더십 향상</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{t('evaluation.typeLabel')}</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder={t('evaluation.selectType')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="reaction">{t('evaluation.typeReaction')}</SelectItem>
                    <SelectItem value="learning">{t('evaluation.typeLearning')}</SelectItem>
                    <SelectItem value="behavior">{t('evaluation.typeBehavior')}</SelectItem>
                    <SelectItem value="results">{t('evaluation.typeResults')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>{t('evaluation.targetSession')}</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder={t('evaluation.selectSession')} />
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
                {t('evaluation.deadline')}
              </Label>
              <Input type="date" />
            </div>
            <div className="space-y-2">
              <Label>{t('evaluation.message')}</Label>
              <Textarea
                placeholder={t('evaluation.messagePlaceholder')}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewEvaluationDialog(false)}>
              {t('common.cancel')}
            </Button>
            <Button onClick={() => setShowNewEvaluationDialog(false)}>
              {t('evaluation.create')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
