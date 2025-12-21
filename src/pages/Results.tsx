import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Search, Save, Pencil, History } from 'lucide-react';
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useTrainingStore } from '@/stores/trainingStore';
import { useUIStore } from '@/stores/uiStore';
import { PageLoading } from '@/components/common/LoadingSpinner';
import { format } from 'date-fns';
import type { ResultInput } from '@/types';

interface ResultEntry {
  employee_id: string;
  employee_name: string;
  score: number | null;
  result: 'PASS' | 'FAIL' | 'ABSENT';
  remarks: string;
}

export default function Results() {
  const { t } = useTranslation();
  const { sessions, programs, employees, results, loading, fetchSessions, fetchPrograms, fetchEmployees, fetchResults, recordResults, updateResult } = useTrainingStore();
  const { addToast } = useUIStore();

  const [selectedSession, setSelectedSession] = useState<string>('');
  const [resultEntries, setResultEntries] = useState<ResultEntry[]>([]);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingResult, setEditingResult] = useState<{
    result_id: string;
    score: number | null;
    result: 'PASS' | 'FAIL' | 'ABSENT';
    remarks: string;
    editReason: string;
  } | null>(null);

  // For viewing recent results
  const [searchQuery, setSearchQuery] = useState('');
  const [resultFilter, setResultFilter] = useState<string>('all');

  useEffect(() => {
    fetchSessions({ status: 'PLANNED' });
    fetchPrograms({});
    fetchEmployees({});
    fetchResults({});
  }, []);

  // Get session info
  const session = sessions.find(s => s.session_id === selectedSession);
  const program = session ? programs.find(p => p.program_code === session.program_code) : null;

  // Initialize result entries when session is selected
  useEffect(() => {
    if (session && session.attendees.length > 0) {
      const entries = session.attendees.map(empId => {
        const emp = employees.find(e => e.employee_id === empId);
        return {
          employee_id: empId,
          employee_name: emp?.employee_name || empId,
          score: null,
          result: 'PASS' as const,
          remarks: '',
        };
      });
      setResultEntries(entries);
    } else {
      setResultEntries([]);
    }
  }, [selectedSession, session, employees]);

  // Filter recent results
  const filteredResults = results.filter(r => {
    const matchesSearch = searchQuery === '' ||
      r.employee_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.program_code.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesResult = resultFilter === 'all' || r.result === resultFilter;
    return matchesSearch && matchesResult;
  });

  const handleScoreChange = (index: number, score: string) => {
    const newEntries = [...resultEntries];
    const numScore = score === '' ? null : parseInt(score);
    newEntries[index].score = numScore;

    // Auto-set result based on passing score
    if (program && numScore !== null) {
      newEntries[index].result = numScore >= program.passing_score ? 'PASS' : 'FAIL';
    }

    setResultEntries(newEntries);
  };

  const handleResultChange = (index: number, result: 'PASS' | 'FAIL' | 'ABSENT') => {
    const newEntries = [...resultEntries];
    newEntries[index].result = result;
    setResultEntries(newEntries);
  };

  const handleRemarksChange = (index: number, remarks: string) => {
    const newEntries = [...resultEntries];
    newEntries[index].remarks = remarks;
    setResultEntries(newEntries);
  };

  const handleSaveResults = async () => {
    if (!session || !program) return;

    const resultsToSave: ResultInput[] = resultEntries.map(entry => ({
      session_id: session.session_id,
      employee_id: entry.employee_id,
      program_code: session.program_code,
      training_date: session.session_date,
      score: entry.score,
      result: entry.result,
      evaluated_by: 'admin',
      remarks: entry.remarks,
    }));

    try {
      await recordResults(resultsToSave);
      addToast({
        type: 'success',
        title: t('messages.saveSuccess'),
        description: `${resultsToSave.length}건의 결과가 저장되었습니다`,
      });
      setSelectedSession('');
      setResultEntries([]);
    } catch (error) {
      addToast({
        type: 'error',
        title: t('messages.saveError'),
      });
    }
  };

  const handleEditResult = (result: typeof results[0]) => {
    setEditingResult({
      result_id: result.result_id,
      score: result.score,
      result: result.result,
      remarks: result.remarks || '',
      editReason: '',
    });
    setEditDialogOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!editingResult || !editingResult.editReason) {
      addToast({
        type: 'error',
        title: t('messages.editReasonRequired'),
      });
      return;
    }

    try {
      await updateResult(editingResult.result_id, {
        score: editingResult.score,
        result: editingResult.result,
        remarks: editingResult.remarks,
      }, editingResult.editReason);

      addToast({
        type: 'success',
        title: t('messages.saveSuccess'),
      });
      setEditDialogOpen(false);
      setEditingResult(null);
      fetchResults({});
    } catch (error) {
      addToast({
        type: 'error',
        title: t('messages.saveError'),
      });
    }
  };

  // Calculate grade based on score and program thresholds
  const getGrade = (score: number | null, prog: typeof program) => {
    if (!score || !prog) return null;
    if (score >= prog.grade_aa) return 'AA';
    if (score >= prog.grade_a) return 'A';
    if (score >= prog.grade_b) return 'B';
    return 'C';
  };

  if (loading.sessions || loading.programs || loading.employees) {
    return <PageLoading />;
  }

  const plannedSessions = sessions.filter(s => s.status === 'PLANNED' && s.attendees.length > 0);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t('nav.results')}</h1>
          <p className="text-muted-foreground">
            교육 결과를 입력하고 관리하세요. 결과는 삭제할 수 없습니다.
          </p>
        </div>
      </div>

      {/* Session Selection */}
      <Card>
        <CardHeader>
          <CardTitle>결과 입력</CardTitle>
          <CardDescription>
            교육 세션을 선택하고 참석자들의 결과를 입력하세요
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex gap-4">
              <div className="flex-1">
                <Label>교육 세션 선택</Label>
                <Select value={selectedSession} onValueChange={setSelectedSession}>
                  <SelectTrigger>
                    <SelectValue placeholder="세션을 선택하세요" />
                  </SelectTrigger>
                  <SelectContent>
                    {plannedSessions.length === 0 ? (
                      <SelectItem value="none" disabled>
                        결과 입력 가능한 세션이 없습니다
                      </SelectItem>
                    ) : (
                      plannedSessions.map((s) => (
                        <SelectItem key={s.session_id} value={s.session_id}>
                          {format(new Date(s.session_date), 'yyyy-MM-dd')} | {s.program_code} | {s.attendees.length}명
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {session && program && (
              <div className="p-4 bg-muted rounded-lg">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">프로그램</p>
                    <p className="font-medium">{program.program_name}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">날짜</p>
                    <p className="font-medium">{format(new Date(session.session_date), 'yyyy-MM-dd')}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">합격 점수</p>
                    <p className="font-medium">{program.passing_score}점 이상</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">참석자</p>
                    <p className="font-medium">{session.attendees.length}명</p>
                  </div>
                </div>
              </div>
            )}

            {resultEntries.length > 0 && (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[120px]">사번</TableHead>
                      <TableHead>이름</TableHead>
                      <TableHead className="w-[100px] text-center">점수</TableHead>
                      <TableHead className="w-[100px] text-center">등급</TableHead>
                      <TableHead className="w-[150px] text-center">결과</TableHead>
                      <TableHead>비고</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {resultEntries.map((entry, index) => {
                      const grade = getGrade(entry.score, program);
                      return (
                        <TableRow key={entry.employee_id}>
                          <TableCell className="font-mono">{entry.employee_id}</TableCell>
                          <TableCell className="font-medium">{entry.employee_name}</TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              min="0"
                              max="100"
                              value={entry.score ?? ''}
                              onChange={(e) => handleScoreChange(index, e.target.value)}
                              className="w-20 text-center"
                              placeholder="점수"
                            />
                          </TableCell>
                          <TableCell className="text-center">
                            {grade && (
                              <Badge
                                variant={
                                  grade === 'AA'
                                    ? 'gradeAA'
                                    : grade === 'A'
                                    ? 'gradeA'
                                    : grade === 'B'
                                    ? 'gradeB'
                                    : 'gradeC'
                                }
                              >
                                {grade}
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <Select
                              value={entry.result}
                              onValueChange={(value) => handleResultChange(index, value as any)}
                            >
                              <SelectTrigger className="w-[120px]">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="PASS">{t('training.pass')}</SelectItem>
                                <SelectItem value="FAIL">{t('training.fail')}</SelectItem>
                                <SelectItem value="ABSENT">{t('training.absent')}</SelectItem>
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell>
                            <Input
                              value={entry.remarks}
                              onChange={(e) => handleRemarksChange(index, e.target.value)}
                              placeholder="비고"
                            />
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>

                <div className="flex justify-end">
                  <Button onClick={handleSaveResults}>
                    <Save className="h-4 w-4 mr-2" />
                    결과 저장
                  </Button>
                </div>
              </>
            )}

            {selectedSession && resultEntries.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                이 세션에 등록된 참석자가 없습니다
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Recent Results */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <CardTitle>최근 결과</CardTitle>
              <CardDescription>
                입력된 교육 결과 목록 (수정 가능, 삭제 불가)
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="검색..."
                  className="pl-8 w-[200px]"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Select value={resultFilter} onValueChange={setResultFilter}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('common.all')}</SelectItem>
                  <SelectItem value="PASS">{t('training.pass')}</SelectItem>
                  <SelectItem value="FAIL">{t('training.fail')}</SelectItem>
                  <SelectItem value="ABSENT">{t('training.absent')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading.results ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">{t('common.loading')}</p>
            </div>
          ) : filteredResults.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {t('common.noData')}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('training.date')}</TableHead>
                  <TableHead>사번</TableHead>
                  <TableHead>프로그램</TableHead>
                  <TableHead className="text-center">{t('training.score')}</TableHead>
                  <TableHead className="text-center">{t('training.grade')}</TableHead>
                  <TableHead className="text-center">{t('training.result')}</TableHead>
                  <TableHead>{t('training.trainer')}</TableHead>
                  <TableHead className="w-[80px]">{t('common.actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredResults.slice(0, 20).map((result) => (
                  <TableRow key={result.result_id}>
                    <TableCell>
                      {format(new Date(result.training_date), 'yyyy-MM-dd')}
                    </TableCell>
                    <TableCell className="font-mono">{result.employee_id}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{result.program_code}</Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      {result.score !== null ? `${result.score}점` : '-'}
                    </TableCell>
                    <TableCell className="text-center">
                      {result.grade && (
                        <Badge
                          variant={
                            result.grade === 'AA'
                              ? 'gradeAA'
                              : result.grade === 'A'
                              ? 'gradeA'
                              : result.grade === 'B'
                              ? 'gradeB'
                              : 'gradeC'
                          }
                        >
                          {result.grade}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge
                        variant={
                          result.result === 'PASS'
                            ? 'success'
                            : result.result === 'FAIL'
                            ? 'destructive'
                            : 'secondary'
                        }
                      >
                        {result.result === 'PASS'
                          ? t('training.pass')
                          : result.result === 'FAIL'
                          ? t('training.fail')
                          : t('training.absent')}
                      </Badge>
                    </TableCell>
                    <TableCell>{result.evaluated_by}</TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEditResult(result)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Edit Result Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>결과 수정</DialogTitle>
            <DialogDescription>
              수정 사유를 반드시 입력해야 합니다. 수정 이력은 기록됩니다.
            </DialogDescription>
          </DialogHeader>
          {editingResult && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>점수</Label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={editingResult.score ?? ''}
                    onChange={(e) =>
                      setEditingResult({
                        ...editingResult,
                        score: e.target.value === '' ? null : parseInt(e.target.value),
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>결과</Label>
                  <Select
                    value={editingResult.result}
                    onValueChange={(value) =>
                      setEditingResult({
                        ...editingResult,
                        result: value as any,
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PASS">{t('training.pass')}</SelectItem>
                      <SelectItem value="FAIL">{t('training.fail')}</SelectItem>
                      <SelectItem value="ABSENT">{t('training.absent')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>비고</Label>
                <Input
                  value={editingResult.remarks}
                  onChange={(e) =>
                    setEditingResult({
                      ...editingResult,
                      remarks: e.target.value,
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label className="text-destructive">수정 사유 *</Label>
                <Textarea
                  value={editingResult.editReason}
                  onChange={(e) =>
                    setEditingResult({
                      ...editingResult,
                      editReason: e.target.value,
                    })
                  }
                  placeholder="수정 사유를 입력하세요 (필수)"
                  className="min-h-[80px]"
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button onClick={handleSaveEdit}>
              <History className="h-4 w-4 mr-2" />
              수정 저장
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
