import type {
  NormalizedProgressCell,
  NormalizedEmployee,
  NormalizedTrainingProgram,
  TrainingStatus,
} from '@/types/normalized';

export type CellDisplayStatus = 'pass' | 'fail' | 'expiring' | 'expired' | 'not_taken';

export interface SelectedCellData {
  employee: NormalizedEmployee;
  program: NormalizedTrainingProgram;
  cell: NormalizedProgressCell | undefined;
}

export interface ProgressStats {
  totalCells: number;
  passCount: number;
  failCount: number;
  expiringCount: number;
  expiredCount: number;
  notTakenCount: number;
}

export function getDisplayStatus(status: TrainingStatus): CellDisplayStatus {
  switch (status) {
    case 'PASS': return 'pass';
    case 'FAIL': return 'fail';
    case 'EXPIRING': return 'expiring';
    case 'EXPIRED': return 'expired';
    case 'NOT_TAKEN':
    default: return 'not_taken';
  }
}

export function getCellDisplay(status: CellDisplayStatus): { symbol: string; className: string } {
  switch (status) {
    case 'pass':
      return { symbol: '✓', className: 'bg-status-pass/20 text-status-pass hover:bg-status-pass/30' };
    case 'fail':
      return { symbol: '✗', className: 'bg-destructive/20 text-destructive hover:bg-destructive/30' };
    case 'expiring':
      return { symbol: '⚠', className: 'bg-status-warning/20 text-status-warning hover:bg-status-warning/30' };
    case 'expired':
      return { symbol: '⏰', className: 'bg-status-expired/20 text-status-expired hover:bg-status-expired/30' };
    case 'not_taken':
    default:
      return { symbol: '−', className: 'bg-muted/50 text-muted-foreground hover:bg-muted' };
  }
}
