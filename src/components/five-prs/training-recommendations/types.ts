import type { RecommendationThreshold } from '@/types/recommendation';

export interface ThresholdConfigDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  thresholds: RecommendationThreshold | null;
  onSave: (updates: Partial<RecommendationThreshold>) => Promise<void>;
}

export interface MonthOption {
  year_month: string;
  label: string;
}

export interface PageHeaderProps {
  selectedMonth: string;
  months: MonthOption[];
  isLoadingMonths: boolean;
  isLoading: boolean;
  isProcessing: boolean;
  isAnalyzing: boolean;
  onMonthChange: (value: string) => void;
  onRunAnalysis: () => void;
  onOpenSettings: () => void;
}

export interface EnrollmentLogsTableProps {
  isLoadingLogs: boolean;
  enrollmentLogs: Array<{
    log_id: string;
    enrolled_at: string;
    tqc_id: string;
    tqc_name: string;
    employee_id: string;
    employee_name: string;
    program_code: string;
    program_name: string;
    priority: string;
    priority_score: number;
    reject_rate: number;
  }>;
}
