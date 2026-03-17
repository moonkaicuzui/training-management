/**
 * Metal Detector Seed Data Page (DEV 전용)
 *
 * 이메일 리포트 W10/W11 데이터를 기반으로
 * md_inspections + md_failures 테스트 데이터 생성
 */

import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Loader2,
  CheckCircle2,
  AlertCircle,
  Database,
  ArrowRight,
  Factory,
  AlertTriangle,
} from 'lucide-react';
import { mdInspection } from '@/services/api';
import type { FactoryCode, MDInspection } from '@/types/metalDetector';

// ============================================================
// 시드 데이터 정의 (이메일 리포트 W10/W11 기반)
// ============================================================

/**
 * 공장별 라인 구성
 * Factory A: Line 1~7 (총 21~22건)
 * Factory B: Line 1~4 (총 12~13건)
 * Factory C: Line 1~5 (총 18~20건)
 * Factory D: Line 1~7 (총 24~25건)
 */
const FACTORY_LINES: Partial<Record<FactoryCode, string[]>> = {
  A: ['1', '2', '3', '4', '5', '6', '7'],
  B: ['1', '2', '3', '4'],
  C: ['1', '2', '3', '4', '5'],
  D: ['1', '2', '3', '4-1', '4-2', '5-1', '5-2'],
};

/** 검사자 이름 목록 */
const INSPECTORS = [
  'Nguyen Van A', 'Tran Thi B', 'Le Van C', 'Pham Thi D',
  'Hoang Van E', 'Vo Thi F', 'Dang Van G', 'Bui Thi H',
];

/** 감도 기본값 범위 (장비별 약간의 변이) */
function randomSensitivity() {
  return {
    fe: parseFloat((1.2 + Math.random() * 0.6).toFixed(1)),  // 1.2~1.8
    sus: parseFloat((1.8 + Math.random() * 0.6).toFixed(1)),  // 1.8~2.4
    nonFe: parseFloat((2.2 + Math.random() * 0.8).toFixed(1)), // 2.2~3.0
  };
}

/** 장비 ID 생성 (공장코드 + 라인번호 + 장비번호) */
function machineId(factory: FactoryCode, line: string, seq: number): string {
  const lineNum = line.replace('-', '');
  return `${factory}${lineNum}0${String(seq).padStart(2, '0')}`;
}

/** 랜덤 날짜 생성 (주차 내) */
function randomDate(weekStart: Date, weekEnd: Date): string {
  const start = weekStart.getTime();
  const end = weekEnd.getTime();
  const d = new Date(start + Math.random() * (end - start));
  return d.toISOString().split('T')[0];
}

// W10: 2026-03-02 (월) ~ 2026-03-08 (일)
const W10_START = new Date('2026-03-02');
const W10_END = new Date('2026-03-08');

// W11: 2026-03-09 (월) ~ 2026-03-15 (일)
const W11_START = new Date('2026-03-09');
const W11_END = new Date('2026-03-15');

/**
 * 반복 이슈 장비 (W10, W11 모두 FAIL)
 */
const REPEATED_ISSUE_MACHINES = ['D4101', 'D5201'];

/**
 * 공장별 검사 데이터 생성
 *
 * W10 (지난주):
 *   A: 21건 (18P, 3F) → 85.7% ≈ 86%
 *   B: 12건 (11P, 1F) → 91.7% ≈ 92%
 *   C: 20건 (19P, 1F) → 95%
 *   D: 25건 (22P, 3F) → 88% ≈ 88%
 *   Total: 78건, 70P/8F → 89.7% ≈ 90%
 *
 * W11 (이번주):
 *   A: 21건 (18P, 3F) → 85.7% ≈ 86%
 *   B: 12건 (11P, 1F) → 91.7% ≈ 92%
 *   C: 20건 (20P, 0F) → 100%
 *   D: 25건 (19P, 6F) → 76%
 *   Total: 78건, 68P/10F → 87.2% ≈ 89%
 */
interface FactoryWeekConfig {
  factory: FactoryCode;
  total: number;
  failCount: number;
  /** FAIL이 될 장비 라인-시퀀스 (고정, 나머지는 랜덤) */
  failMachines?: { line: string; seq: number }[];
}

const W10_CONFIG: FactoryWeekConfig[] = [
  {
    factory: 'A', total: 21, failCount: 3,
    failMachines: [
      { line: '2', seq: 1 }, { line: '4', seq: 2 }, { line: '6', seq: 1 },
    ],
  },
  {
    factory: 'B', total: 12, failCount: 1,
    failMachines: [{ line: '3', seq: 1 }],
  },
  {
    factory: 'C', total: 20, failCount: 1,
    failMachines: [{ line: '4', seq: 2 }],
  },
  {
    factory: 'D', total: 25, failCount: 3,
    failMachines: [
      { line: '4-1', seq: 1 },  // D4101 (반복 이슈)
      { line: '5-2', seq: 1 },  // D5201 (반복 이슈)
      { line: '3', seq: 2 },
    ],
  },
];

const W11_CONFIG: FactoryWeekConfig[] = [
  {
    factory: 'A', total: 21, failCount: 3,
    failMachines: [
      { line: '1', seq: 3 }, { line: '5', seq: 1 }, { line: '7', seq: 2 },
    ],
  },
  {
    factory: 'B', total: 12, failCount: 1,
    failMachines: [{ line: '2', seq: 2 }],
  },
  {
    factory: 'C', total: 20, failCount: 0,
  },
  {
    factory: 'D', total: 25, failCount: 6,
    failMachines: [
      { line: '4-1', seq: 1 },  // D4101 (반복 이슈!)
      { line: '5-2', seq: 1 },  // D5201 (반복 이슈!)
      { line: '1', seq: 3 },
      { line: '2', seq: 2 },
      { line: '3', seq: 1 },
      { line: '5-1', seq: 2 },
    ],
  },
];

const FAILURE_TYPES = [
  'sensitivity_drift',
  'equipment_malfunction',
  'calibration_error',
];

const FAILURE_DESCRIPTIONS: Record<string, string> = {
  sensitivity_drift: 'Metal detection sensitivity outside acceptable range during verification test',
  equipment_malfunction: 'Equipment malfunction detected during routine inspection',
  calibration_error: 'Calibration deviation found, recalibration required',
};

interface SeedRecord {
  inspection: Omit<MDInspection, 'id' | 'weekNumber' | 'year' | 'createdAt' | 'updatedAt'>;
  failure?: {
    factory: FactoryCode;
    line: string;
    failureDate: string;
    failureType: string;
    description: string;
    caStatus: 'pending' | 'completed';
    caDescription?: string;
  };
}

/**
 * 주차별 시드 데이터 생성
 */
function generateWeekRecords(
  configs: FactoryWeekConfig[],
  weekStart: Date,
  weekEnd: Date,
  weekLabel: string,
): SeedRecord[] {
  const records: SeedRecord[] = [];

  for (const cfg of configs) {
    const lines = FACTORY_LINES[cfg.factory] || [];
    const failSet = new Set<string>();
    const failMachineMap = new Map<string, { line: string; seq: number }>();

    // FAIL 장비 등록
    if (cfg.failMachines) {
      for (const fm of cfg.failMachines) {
        const mId = machineId(cfg.factory, fm.line, fm.seq);
        failSet.add(mId);
        failMachineMap.set(mId, fm);
      }
    }

    // 전체 검사 레코드 생성
    let created = 0;
    let failCreated = 0;
    let lineIdx = 0;
    let seqInLine = 1;

    while (created < cfg.total) {
      const currentLine = lines[lineIdx % lines.length];
      const mId = machineId(cfg.factory, currentLine, seqInLine);
      const isFail = failSet.has(mId);

      // FAIL이 아직 다 안 만들어졌고, 이 장비가 FAIL 대상이 아니면 PASS
      // FAIL 대상이면 FAIL
      const result = isFail ? 'FAIL' : 'PASS';

      if (isFail) failCreated++;

      const inspDate = randomDate(weekStart, weekEnd);
      const inspector = INSPECTORS[created % INSPECTORS.length];
      const isRepeated = REPEATED_ISSUE_MACHINES.includes(mId);

      const record: SeedRecord = {
        inspection: {
          factory: cfg.factory,
          line: `${cfg.factory}-${currentLine}`,
          machineId: mId,
          inspectionDate: inspDate,
          result,
          inspectorName: inspector,
          sensitivity: randomSensitivity(),
        },
      };

      // FAIL인 경우 failure 데이터 추가
      if (result === 'FAIL') {
        const fType = FAILURE_TYPES[failCreated % FAILURE_TYPES.length];

        // W10 FAIL의 CA 상태: 반복 이슈 장비 = pending, 나머지 = completed (75% fix rate)
        let caStatus: 'pending' | 'completed' = 'completed';
        let caDescription: string | undefined = 'Corrective action completed. Recalibrated and verified.';

        if (weekLabel === 'W10') {
          if (isRepeated) {
            // 반복 이슈 장비: CA 미완료
            caStatus = 'pending';
            caDescription = undefined;
          }
          // 나머지 W10 FAIL: CA completed (6/8 = 75%)
        } else {
          // W11: 모든 FAIL은 아직 pending
          caStatus = 'pending';
          caDescription = undefined;
        }

        record.failure = {
          factory: cfg.factory,
          line: `${cfg.factory}-${currentLine}`,
          failureDate: inspDate,
          failureType: fType,
          description: FAILURE_DESCRIPTIONS[fType] || 'Inspection failure detected',
          caStatus,
          caDescription,
        };
      }

      records.push(record);
      created++;

      // 다음 장비
      seqInLine++;
      if (seqInLine > Math.ceil(cfg.total / lines.length) + 1) {
        seqInLine = 1;
        lineIdx++;
      }
    }

    // failCount에 아직 도달 못했으면 나머지 PASS 레코드 중 일부를 FAIL로 변환
    if (failCreated < cfg.failCount) {
      const passRecords = records.filter(
        (r) => r.inspection.factory === cfg.factory && r.inspection.result === 'PASS'
      );
      for (let i = 0; i < cfg.failCount - failCreated && i < passRecords.length; i++) {
        passRecords[i].inspection.result = 'FAIL';
        const fType = FAILURE_TYPES[(failCreated + i) % FAILURE_TYPES.length];
        passRecords[i].failure = {
          factory: cfg.factory,
          line: passRecords[i].inspection.line,
          failureDate: passRecords[i].inspection.inspectionDate,
          failureType: fType,
          description: FAILURE_DESCRIPTIONS[fType] || 'Inspection failure detected',
          caStatus: weekLabel === 'W10' ? 'completed' : 'pending',
          caDescription: weekLabel === 'W10'
            ? 'Corrective action completed. Recalibrated and verified.'
            : undefined,
        };
      }
    }
  }

  return records;
}

// ============================================================
// MDSeedData 컴포넌트
// ============================================================

export default function MDSeedData() {
  const navigate = useNavigate();
  const [status, setStatus] = useState<'idle' | 'checking' | 'seeding' | 'done' | 'error'>('idle');
  const [progress, setProgress] = useState(0);
  const [totalRecords, setTotalRecords] = useState(0);
  const [createdCount, setCreatedCount] = useState(0);
  const [failureCount, setFailureCount] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');
  const [existingCount, setExistingCount] = useState<number | null>(null);

  // DEV 전용 가드
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

  /** 기존 데이터 확인 */
  const checkExisting = useCallback(async () => {
    setStatus('checking');
    try {
      const existing = await mdInspection.getInspections({
        year: 2026,
      });
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

  /** 시드 데이터 생성 실행 */
  const handleSeed = useCallback(async () => {
    // 기존 데이터 확인
    const existing = await checkExisting();
    if (existing > 0) {
      const confirmed = window.confirm(
        `W10/W11에 이미 ${existing}건의 데이터가 있습니다.\n추가로 시드 데이터를 생성하시겠습니까?`
      );
      if (!confirmed) return;
    }
    if (existing === -1) return; // 에러

    setStatus('seeding');
    setProgress(0);
    setCreatedCount(0);
    setFailureCount(0);

    try {
      // W10 + W11 데이터 생성
      const w10Records = generateWeekRecords(W10_CONFIG, W10_START, W10_END, 'W10');
      const w11Records = generateWeekRecords(W11_CONFIG, W11_START, W11_END, 'W11');
      const allRecords = [...w10Records, ...w11Records];
      setTotalRecords(allRecords.length);

      let created = 0;
      let failures = 0;

      for (const record of allRecords) {
        // API 레이어를 통해 inspection 생성
        const inspection = await mdInspection.createInspection(record.inspection);

        // FAIL인 경우 failure 레코드도 생성
        if (record.failure) {
          await mdInspection.createFailure({
            inspectionId: inspection.id,
            ...record.failure,
          });
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

  // ============ 렌더링 ============

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Database className="h-6 w-6" />
          MD Test Data Seed
        </h1>
        <p className="text-muted-foreground mt-1">
          이메일 리포트 기반 W10/W11 테스트 데이터 생성 (DEV 전용)
        </p>
      </div>

      {/* 데이터 요약 카드 */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">W10 (3/2~3/8)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Factory className="h-4 w-4 text-blue-500" />
                <span className="text-sm">78건 (70P / 8F)</span>
              </div>
              <div className="text-xs text-muted-foreground space-y-0.5">
                <div>A: 21건 (3F) = 86% | B: 12건 (1F) = 92%</div>
                <div>C: 20건 (1F) = 95% | D: 25건 (3F) = 88%</div>
              </div>
              <Badge variant="outline" className="text-xs mt-1">Pass Rate: ~90%</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">W11 (3/9~3/15)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Factory className="h-4 w-4 text-orange-500" />
                <span className="text-sm">78건 (68P / 10F)</span>
              </div>
              <div className="text-xs text-muted-foreground space-y-0.5">
                <div>A: 21건 (3F) = 86% | B: 12건 (1F) = 92%</div>
                <div>C: 20건 (0F) = 100% | D: 25건 (6F) = 76%</div>
              </div>
              <Badge variant="outline" className="text-xs mt-1">Pass Rate: ~89%</Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 반복 이슈 장비 */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
            반복 이슈 장비 (W10 + W11 연속 FAIL)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm space-y-1">
            <div><code className="bg-muted px-1 rounded">D4101</code> — Factory D, Line 4-1 (sensitivity_drift)</div>
            <div><code className="bg-muted px-1 rounded">D5201</code> — Factory D, Line 5-2 (equipment_malfunction)</div>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            W10 CA 상태: D4101, D5201은 미완료 (pending), 나머지 6건은 완료 (75% fix rate)
          </p>
        </CardContent>
      </Card>

      {/* 기존 데이터 경고 */}
      {existingCount !== null && existingCount > 0 && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            W10/W11에 이미 {existingCount}건의 데이터가 존재합니다.
          </AlertDescription>
        </Alert>
      )}

      {/* 진행 상태 */}
      {status === 'seeding' && (
        <Card>
          <CardContent className="pt-6 space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                데이터 생성 중...
              </span>
              <span className="text-muted-foreground">
                {createdCount} / {totalRecords} ({failureCount} failures)
              </span>
            </div>
            <Progress value={progress} className="h-2" />
          </CardContent>
        </Card>
      )}

      {/* 완료 상태 */}
      {status === 'done' && (
        <Alert className="border-green-200 bg-green-50 dark:bg-green-950/20">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-700 dark:text-green-400">
            시드 데이터 생성 완료! {createdCount}건 검사 + {failureCount}건 실패 기록
          </AlertDescription>
        </Alert>
      )}

      {/* 에러 상태 */}
      {status === 'error' && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      )}

      {/* 액션 버튼 */}
      <div className="flex gap-3">
        {status !== 'done' ? (
          <>
            <Button
              onClick={handleSeed}
              disabled={status === 'seeding' || status === 'checking'}
              className="flex-1"
              size="lg"
            >
              {status === 'seeding' ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" />생성 중...</>
              ) : status === 'checking' ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" />확인 중...</>
              ) : (
                <><Database className="h-4 w-4 mr-2" />W10 + W11 시드 데이터 생성 (156건)</>
              )}
            </Button>
            <Button
              variant="outline"
              onClick={() => checkExisting()}
              disabled={status !== 'idle'}
            >
              기존 데이터 확인
            </Button>
          </>
        ) : (
          <>
            <Button
              onClick={() => navigate('/equipment/metal-detector')}
              className="flex-1"
              size="lg"
            >
              대시보드로 이동 <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate('/equipment/metal-detector/report')}
            >
              리포트 확인
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
