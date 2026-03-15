import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Save, AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';
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
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useNewTQCStore } from '@/stores/newTqcStore';
import { calculateGrade } from '@/data/constants';

export default function NewTQCFinalResult() {
  const { t } = useTranslation();
  const { trainees, updateTrainee } = useNewTQCStore();
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [editingScores, setEditingScores] = useState<Record<string, number | ''>>({});

  const activeTrainees = useMemo(() => {
    return trainees.filter(tr => {
      if (filterStatus === 'all') return true;
      if (filterStatus === 'IN_TRAINING') return tr.status === 'IN_TRAINING';
      if (filterStatus === 'COMPLETED') return tr.status === 'COMPLETED';
      if (filterStatus === 'FAILED') return tr.final_result === 'FAIL';
      return true;
    });
  }, [trainees, filterStatus]);

  const failedTrainees = useMemo(() => {
    return trainees.filter(tr => tr.final_result === 'FAIL');
  }, [trainees]);

  const criticalFailTrainees = useMemo(() => {
    // Trainees with 3+ failures would need test_attempt tracking
    return failedTrainees;
  }, [failedTrainees]);

  const handleScoreChange = (traineeId: string, value: string) => {
    const numValue = value === '' ? '' : Number(value);
    if (numValue !== '' && (numValue < 0 || numValue > 100)) return;
    setEditingScores(prev => ({ ...prev, [traineeId]: numValue }));
  };

  const handleSaveResult = async (traineeId: string) => {
    const score = editingScores[traineeId];
    if (score === '' || score === undefined) return;

    const { grade, result } = calculateGrade(score);

    try {
      await updateTrainee({
        trainee_id: traineeId,
        final_test_score: score,
        final_grade: grade,
        final_result: result,
        status: result === 'PASS' ? 'COMPLETED' : undefined,
      });
      // updateTrainee가 스토어를 자동 갱신하므로 직접 변경 불필요
      setEditingScores(prev => {
        const newState = { ...prev };
        delete newState[traineeId];
        return newState;
      });
    } catch {
      // Error handled by store
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          {t('newTQCModule.finalResult.title')}
        </h1>
        <p className="text-muted-foreground">
          {t('newTQCModule.finalResult.description')}
        </p>
      </div>

      {/* Warning Banner for 3+ failures */}
      {criticalFailTrainees.length > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>{t('newTQCModule.finalResult.maxFailWarning')}</AlertTitle>
          <AlertDescription>
            {criticalFailTrainees.map(tr => tr.name).join(', ')}
          </AlertDescription>
        </Alert>
      )}

      {/* Filter */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('common.all')}</SelectItem>
                <SelectItem value="IN_TRAINING">{t('common.active')}</SelectItem>
                <SelectItem value="COMPLETED">{t('newTQCModule.finalResult.certified')}</SelectItem>
                <SelectItem value="FAILED">{t('newTQCModule.finalResult.retraining')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Results Table */}
      <Card>
        <CardHeader>
          <CardTitle>{t('newTQCModule.finalResult.title')}</CardTitle>
          <CardDescription>
            {activeTrainees.length} {t('nav.newTQC.trainees')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('common.name')}</TableHead>
                <TableHead>{t('newTQCModule.building')}</TableHead>
                <TableHead>{t('newTQCModule.workingArea')}</TableHead>
                <TableHead className="text-center">{t('newTQCModule.finalResult.testScore')}</TableHead>
                <TableHead className="text-center">{t('newTQCModule.finalResult.grade')}</TableHead>
                <TableHead className="text-center">{t('newTQCModule.finalResult.result')}</TableHead>
                <TableHead className="text-center">{t('newTQCModule.finalResult.action')}</TableHead>
                <TableHead className="w-[100px]">{t('common.actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {activeTrainees.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    {t('common.noData')}
                  </TableCell>
                </TableRow>
              ) : (
                activeTrainees.map((trainee) => {
                  const currentScore = editingScores[trainee.trainee_id];
                  const displayScore = currentScore !== undefined ? currentScore : trainee.final_test_score;
                  const gradeInfo = displayScore !== undefined && displayScore !== ''
                    ? calculateGrade(Number(displayScore))
                    : null;

                  return (
                    <TableRow key={trainee.trainee_id}>
                      <TableCell className="font-medium">{trainee.name}</TableCell>
                      <TableCell>{trainee.building || '-'}</TableCell>
                      <TableCell>{trainee.working_area || '-'}</TableCell>
                      <TableCell className="text-center">
                        {trainee.final_result ? (
                          <span className="font-mono font-medium">{trainee.final_test_score}</span>
                        ) : (
                          <Input
                            type="number"
                            min={0}
                            max={100}
                            className="w-20 mx-auto text-center"
                            placeholder="0-100"
                            value={currentScore ?? ''}
                            onChange={(e) => handleScoreChange(trainee.trainee_id, e.target.value)}
                          />
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        {gradeInfo ? (
                          <Badge variant={
                            gradeInfo.grade === 'AA' ? 'default' :
                            gradeInfo.grade === 'A' ? 'default' :
                            gradeInfo.grade === 'B' ? 'secondary' :
                            'destructive'
                          }>
                            {gradeInfo.grade}
                          </Badge>
                        ) : trainee.final_grade ? (
                          <Badge variant={
                            trainee.final_grade === 'C' ? 'destructive' : 'default'
                          }>
                            {trainee.final_grade}
                          </Badge>
                        ) : '-'}
                      </TableCell>
                      <TableCell className="text-center">
                        {(gradeInfo?.result || trainee.final_result) ? (
                          <Badge variant={
                            (gradeInfo?.result || trainee.final_result) === 'PASS'
                              ? 'success'
                              : 'destructive'
                          }>
                            {(gradeInfo?.result || trainee.final_result) === 'PASS' ? (
                              <><CheckCircle2 className="h-3 w-3 mr-1" />PASS</>
                            ) : (
                              <><XCircle className="h-3 w-3 mr-1" />FAIL</>
                            )}
                          </Badge>
                        ) : '-'}
                      </TableCell>
                      <TableCell className="text-center">
                        {trainee.final_result === 'PASS' && (
                          <Badge variant="success">
                            {t('newTQCModule.finalResult.certified')}
                          </Badge>
                        )}
                        {trainee.final_result === 'FAIL' && (
                          <Badge variant="warning">
                            {t('newTQCModule.finalResult.retraining')}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {!trainee.final_result && currentScore !== undefined && currentScore !== '' && (
                          <Button
                            size="sm"
                            onClick={() => handleSaveResult(trainee.trainee_id)}
                          >
                            <Save className="h-3 w-3 mr-1" />
                            {t('newTQCModule.finalResult.saveResult')}
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
