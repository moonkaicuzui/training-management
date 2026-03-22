/**
 * Metal Detector Seed Data Page (DEV 전용)
 * 이메일 리포트 W10/W11 데이터를 기반으로 테스트 데이터 생성
 */

import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Loader2, CheckCircle2, AlertCircle, Database, ArrowRight, Factory, AlertTriangle } from 'lucide-react';
import { mdInspection } from '@/services/api';
import {
  W10_CONFIG, W11_CONFIG, W10_START, W10_END, W11_START, W11_END,
  generateWeekRecords,
} from '@/components/metal-detector/MDSeedDataConfig';

export default function MDSeedData() {
  const navigate = useNavigate();
  const [status, setStatus] = useState<'idle' | 'checking' | 'seeding' | 'done' | 'error'>('idle');
  const [progress, setProgress] = useState(0);
  const [totalRecords, setTotalRecords] = useState(0);
  const [createdCount, setCreatedCount] = useState(0);
  const [failureCount, setFailureCount] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');
  const [existingCount, setExistingCount] = useState<number | null>(null);

  if (!import.meta.env.DEV) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>This page is only available in development mode.</AlertDescription>
        </Alert>
      </div>
    );
  }

  const checkExisting = useCallback(async () => {
    setStatus('checking');
    try {
      const existing = await mdInspection.getInspections({ year: 2026 });
      const w10w11 = existing.filter((i) => i.weekNumber === 10 || i.weekNumber === 11);
      setExistingCount(w10w11.length);
      setStatus('idle');
      return w10w11.length;
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to check existing data');
      setStatus('error');
      return -1;
    }
  }, []);

  const handleSeed = useCallback(async () => {
    const existing = await checkExisting();
    if (existing > 0) {
      const confirmed = window.confirm(`W10/W11에 이미 ${existing}건의 데이터가 있습니다.\n추가로 시드 데이터를 생성하시겠습니까?`);
      if (!confirmed) return;
    }
    if (existing === -1) return;

    setStatus('seeding');
    setProgress(0);
    setCreatedCount(0);
    setFailureCount(0);

    try {
      const w10Records = generateWeekRecords(W10_CONFIG, W10_START, W10_END, 'W10');
      const w11Records = generateWeekRecords(W11_CONFIG, W11_START, W11_END, 'W11');
      const allRecords = [...w10Records, ...w11Records];
      setTotalRecords(allRecords.length);

      let created = 0;
      let failures = 0;

      for (const record of allRecords) {
        const inspection = await mdInspection.createInspection(record.inspection);
        if (record.failure) {
          await mdInspection.createFailure({ inspectionId: inspection.id, ...record.failure });
          failures++;
        }
        created++;
        setCreatedCount(created);
        setFailureCount(failures);
        setProgress(Math.round((created / allRecords.length) * 100));
      }

      setStatus('done');
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Seed data creation failed');
      setStatus('error');
    }
  }, [checkExisting]);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Database className="h-6 w-6" />MD Test Data Seed
        </h1>
        <p className="text-muted-foreground mt-1">이메일 리포트 기반 W10/W11 테스트 데이터 생성 (DEV 전용)</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">W10 (3/2~3/8)</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-1">
              <div className="flex items-center gap-2"><Factory className="h-4 w-4 text-blue-500" /><span className="text-sm">78건 (70P / 8F)</span></div>
              <div className="text-xs text-muted-foreground space-y-0.5">
                <div>A: 21건 (3F) = 86% | B: 12건 (1F) = 92%</div>
                <div>C: 20건 (1F) = 95% | D: 25건 (3F) = 88%</div>
              </div>
              <Badge variant="outline" className="text-xs mt-1">Pass Rate: ~90%</Badge>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">W11 (3/9~3/15)</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-1">
              <div className="flex items-center gap-2"><Factory className="h-4 w-4 text-orange-500" /><span className="text-sm">78건 (68P / 10F)</span></div>
              <div className="text-xs text-muted-foreground space-y-0.5">
                <div>A: 21건 (3F) = 86% | B: 12건 (1F) = 92%</div>
                <div>C: 20건 (0F) = 100% | D: 25건 (6F) = 76%</div>
              </div>
              <Badge variant="outline" className="text-xs mt-1">Pass Rate: ~89%</Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Repeated Issues */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-yellow-500" />반복 이슈 장비 (W10 + W11 연속 FAIL)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm space-y-1">
            <div><code className="bg-muted px-1 rounded">D4101</code> — Factory D, Line 4-1 (sensitivity_drift)</div>
            <div><code className="bg-muted px-1 rounded">D5201</code> — Factory D, Line 5-2 (equipment_malfunction)</div>
          </div>
          <p className="text-xs text-muted-foreground mt-2">W10 CA 상태: D4101, D5201은 미완료 (pending), 나머지 6건은 완료 (75% fix rate)</p>
        </CardContent>
      </Card>

      {existingCount !== null && existingCount > 0 && (
        <Alert><AlertTriangle className="h-4 w-4" /><AlertDescription>W10/W11에 이미 {existingCount}건의 데이터가 존재합니다.</AlertDescription></Alert>
      )}

      {status === 'seeding' && (
        <Card>
          <CardContent className="pt-6 space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" />데이터 생성 중...</span>
              <span className="text-muted-foreground">{createdCount} / {totalRecords} ({failureCount} failures)</span>
            </div>
            <Progress value={progress} className="h-2" />
          </CardContent>
        </Card>
      )}

      {status === 'done' && (
        <Alert className="border-green-200 bg-green-50 dark:bg-green-950/20">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-700 dark:text-green-400">시드 데이터 생성 완료! {createdCount}건 검사 + {failureCount}건 실패 기록</AlertDescription>
        </Alert>
      )}

      {status === 'error' && (
        <Alert variant="destructive"><AlertCircle className="h-4 w-4" /><AlertDescription>{errorMessage}</AlertDescription></Alert>
      )}

      <div className="flex gap-3">
        {status !== 'done' ? (
          <>
            <Button onClick={handleSeed} disabled={status === 'seeding' || status === 'checking'} className="flex-1" size="lg">
              {status === 'seeding' ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />생성 중...</> :
               status === 'checking' ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />확인 중...</> :
               <><Database className="h-4 w-4 mr-2" />W10 + W11 시드 데이터 생성 (156건)</>}
            </Button>
            <Button variant="outline" onClick={() => checkExisting()} disabled={status !== 'idle'}>기존 데이터 확인</Button>
          </>
        ) : (
          <>
            <Button onClick={() => navigate('/equipment/metal-detector')} className="flex-1" size="lg">대시보드로 이동 <ArrowRight className="h-4 w-4 ml-2" /></Button>
            <Button variant="outline" onClick={() => navigate('/equipment/metal-detector/report')}>리포트 확인</Button>
          </>
        )}
      </div>
    </div>
  );
}
