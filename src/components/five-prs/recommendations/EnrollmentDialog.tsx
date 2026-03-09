import { useTranslation } from 'react-i18next';
import { User, Link2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { EnrollmentDialog as CommonEnrollmentDialog } from '@/components/common/recommendations';
import type { TrainingRecommendation, RecommendationPriority } from '@/types/recommendation';
import type { TrainingProgram } from '@/types';

interface EnrollmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  recommendation: TrainingRecommendation | null;
  programs: TrainingProgram[];
  yearMonth: string;
  onConfirm: (programCode: string) => void;
  isLoading: boolean;
}

const PRIORITY_VARIANT_MAP: Record<RecommendationPriority, 'destructive' | 'warning' | 'default'> = {
  IMMEDIATE: 'destructive',
  SURGE: 'warning',
  PREVENTIVE: 'default',
};

export function EnrollmentDialog({
  open,
  onOpenChange,
  recommendation,
  programs,
  yearMonth,
  onConfirm,
  isLoading,
}: EnrollmentDialogProps) {
  const { t } = useTranslation();

  if (!recommendation) return null;

  const hasLinkedEmployee = !!recommendation.linkedEmployee;
  const firstRecommended = recommendation.recommendedPrograms[0]?.program_code;

  return (
    <CommonEnrollmentDialog
      open={open}
      onOpenChange={onOpenChange}
      programs={programs}
      recommendedPrograms={recommendation.recommendedPrograms}
      hasLinkedEmployee={hasLinkedEmployee}
      defaultProgramCode={firstRecommended}
      title={t('recommendation.enrollDialog.title')}
      description={t('recommendation.enrollDialog.description')}
      noLinkedWarning={t('recommendation.enrollDialog.noLinkedEmployee')}
      onConfirm={onConfirm}
      isLoading={isLoading}
      i18nPrefix="recommendation"
      infoContent={
        <>
          {/* TQC Info */}
          <div className="rounded-lg border p-4 space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium">
              <User className="h-4 w-4 text-muted-foreground" />
              {t('recommendation.enrollDialog.tqcInfo')}
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-muted-foreground">{t('recommendation.tqcId')}:</span>{' '}
                <span className="font-medium">{recommendation.tqc_id}</span>
              </div>
              <div>
                <span className="text-muted-foreground">{t('recommendation.tqcName')}:</span>{' '}
                <span className="font-medium">{recommendation.tqc_name}</span>
              </div>
              <div>
                <span className="text-muted-foreground">{t('recommendation.rejectRate')}:</span>{' '}
                <span className="font-medium">{recommendation.rejectRate.toFixed(2)}%</span>
              </div>
              <div>
                <span className="text-muted-foreground">{t('recommendation.priority')}:</span>{' '}
                <Badge variant={PRIORITY_VARIANT_MAP[recommendation.priority]}>
                  {t(`recommendation.priorities.${recommendation.priority}`)}
                </Badge>
              </div>
            </div>
            <div className="text-sm">
              <span className="text-muted-foreground">{t('recommendation.priorityScore')}:</span>{' '}
              <span className="font-medium">{recommendation.priorityScore}</span>
            </div>
          </div>

          {/* Linked Employee Info */}
          <div className="rounded-lg border p-4 space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Link2 className="h-4 w-4 text-muted-foreground" />
              {t('recommendation.enrollDialog.employeeInfo')}
            </div>
            {hasLinkedEmployee ? (
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-muted-foreground">{t('recommendation.employeeId')}:</span>{' '}
                  <span className="font-medium">{recommendation.linkedEmployee!.employee_id}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">{t('recommendation.employeeName')}:</span>{' '}
                  <span className="font-medium">{recommendation.linkedEmployee!.employee_name}</span>
                </div>
              </div>
            ) : null}
          </div>
        </>
      }
      extraContent={
        <div className="text-sm text-muted-foreground">
          {t('recommendation.enrollDialog.yearMonth')}: <span className="font-medium">{yearMonth}</span>
        </div>
      }
    />
  );
}
