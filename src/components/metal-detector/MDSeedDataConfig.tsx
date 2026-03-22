import type { FactoryCode, MDInspection } from '@/types/metalDetector';

// ============================================================
// 시드 데이터 정의 (이메일 리포트 W10/W11 기반)
// ============================================================

/** Assembly 라인 기반 */
export const FACTORY_LINES: Partial<Record<FactoryCode, string[]>> = {
  A: ['L1-1', 'L1-2', 'L2-1', 'L2-2', 'L3-1', 'L3-2', 'L4-1', 'L4-2', 'L5-1', 'L5-2', 'L6-1', 'L6-2', 'L7-1', 'L7-2', 'L8-1', 'L8-2', 'L9-1', 'L9-2', 'L10-1', 'L10-2', 'L11-1', 'L11-2', 'L12-1', 'L12-2'],
  B: ['L1-1', 'L1-2', 'L2-1', 'L2-2', 'L3-1', 'L3-2', 'L4-1', 'L4-2', 'L5-1', 'L5-2', 'L6-1', 'L6-2'],
  C: ['L1-1', 'L1-2', 'L2-1', 'L2-2', 'L3-1', 'L3-2', 'L4-1', 'L4-2', 'L5-1', 'L5-2', 'L6-1', 'L6-2', 'L7-1', 'L7-2', 'L8-1', 'L8-2', 'L9-1', 'L9-2', 'L10-1', 'L10-2', 'L11-1', 'L11-2', 'L12-1', 'L12-2'],
  D: ['L1-1', 'L1-2', 'L2-1', 'L2-2', 'L3-1', 'L3-2', 'L4-1', 'L4-2', 'L5-1', 'L5-2', 'L6-1', 'L6-2', 'L7-1', 'L7-2', 'L8-1', 'L8-2', 'L9-1', 'L9-2', 'L10-1', 'L10-2', 'L11-1', 'L11-2', 'L12-1', 'L12-2'],
};

export const INSPECTORS = [
  'Nguyen Van A', 'Tran Thi B', 'Le Van C', 'Pham Thi D',
  'Hoang Van E', 'Vo Thi F', 'Dang Van G', 'Bui Thi H',
];

export const REPEATED_ISSUE_MACHINES = ['D4101', 'D5201'];

export const FAILURE_TYPES = ['sensitivity_drift', 'equipment_malfunction', 'calibration_error'];

export const FAILURE_DESCRIPTIONS: Record<string, string> = {
  sensitivity_drift: 'Metal detection sensitivity outside acceptable range during verification test',
  equipment_malfunction: 'Equipment malfunction detected during routine inspection',
  calibration_error: 'Calibration deviation found, recalibration required',
};

// W10: 2026-03-02 ~ 2026-03-08, W11: 2026-03-09 ~ 2026-03-15
export const W10_START = new Date('2026-03-02');
export const W10_END = new Date('2026-03-08');
export const W11_START = new Date('2026-03-09');
export const W11_END = new Date('2026-03-15');

export interface FactoryWeekConfig {
  factory: FactoryCode;
  total: number;
  failCount: number;
  failMachines?: { line: string; seq: number }[];
}

export const W10_CONFIG: FactoryWeekConfig[] = [
  { factory: 'A', total: 21, failCount: 3, failMachines: [{ line: '2', seq: 1 }, { line: '4', seq: 2 }, { line: '6', seq: 1 }] },
  { factory: 'B', total: 12, failCount: 1, failMachines: [{ line: '3', seq: 1 }] },
  { factory: 'C', total: 20, failCount: 1, failMachines: [{ line: '4', seq: 2 }] },
  { factory: 'D', total: 25, failCount: 3, failMachines: [{ line: '4-1', seq: 1 }, { line: '5-2', seq: 1 }, { line: '3', seq: 2 }] },
];

export const W11_CONFIG: FactoryWeekConfig[] = [
  { factory: 'A', total: 21, failCount: 3, failMachines: [{ line: '1', seq: 3 }, { line: '5', seq: 1 }, { line: '7', seq: 2 }] },
  { factory: 'B', total: 12, failCount: 1, failMachines: [{ line: '2', seq: 2 }] },
  { factory: 'C', total: 20, failCount: 0 },
  { factory: 'D', total: 25, failCount: 6, failMachines: [{ line: '4-1', seq: 1 }, { line: '5-2', seq: 1 }, { line: '1', seq: 3 }, { line: '2', seq: 2 }, { line: '3', seq: 1 }, { line: '5-1', seq: 2 }] },
];

export interface SeedRecord {
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

// ============================================================
// Helper functions
// ============================================================

export function randomSensitivity() {
  return {
    fe: parseFloat((1.2 + Math.random() * 0.6).toFixed(1)),
    sus: parseFloat((1.8 + Math.random() * 0.6).toFixed(1)),
    nonFe: parseFloat((2.2 + Math.random() * 0.8).toFixed(1)),
  };
}

export function machineId(factory: FactoryCode, line: string, seq: number): string {
  const lineNum = line.replace('-', '');
  return `${factory}${lineNum}0${String(seq).padStart(2, '0')}`;
}

export function randomDate(weekStart: Date, weekEnd: Date): string {
  const start = weekStart.getTime();
  const end = weekEnd.getTime();
  const d = new Date(start + Math.random() * (end - start));
  return d.toISOString().split('T')[0];
}

/**
 * 주차별 시드 데이터 생성
 */
export function generateWeekRecords(
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

    if (cfg.failMachines) {
      for (const fm of cfg.failMachines) {
        const mId = machineId(cfg.factory, fm.line, fm.seq);
        failSet.add(mId);
        failMachineMap.set(mId, fm);
      }
    }

    let created = 0;
    let failCreated = 0;
    let lineIdx = 0;
    let seqInLine = 1;

    while (created < cfg.total) {
      const currentLine = lines[lineIdx % lines.length];
      const mId = machineId(cfg.factory, currentLine, seqInLine);
      const isFail = failSet.has(mId);
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

      if (result === 'FAIL') {
        const fType = FAILURE_TYPES[failCreated % FAILURE_TYPES.length];
        let caStatus: 'pending' | 'completed' = 'completed';
        let caDescription: string | undefined = 'Corrective action completed. Recalibrated and verified.';

        if (weekLabel === 'W10') {
          if (isRepeated) { caStatus = 'pending'; caDescription = undefined; }
        } else {
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
      seqInLine++;
      if (seqInLine > Math.ceil(cfg.total / lines.length) + 1) {
        seqInLine = 1;
        lineIdx++;
      }
    }

    if (failCreated < cfg.failCount) {
      const passRecords = records.filter((r) => r.inspection.factory === cfg.factory && r.inspection.result === 'PASS');
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
          caDescription: weekLabel === 'W10' ? 'Corrective action completed. Recalibrated and verified.' : undefined,
        };
      }
    }
  }

  return records;
}
