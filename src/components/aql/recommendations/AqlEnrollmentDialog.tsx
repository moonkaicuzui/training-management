import { useTranslation } from 'react-i18next';
import { User } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { EnrollmentDialog } from '@/components/common/recommendations';
import type { AqlTrainingRecommendation, AqlPriority } from '@/types/aql';
import type { TrainingProgram } from '@/types';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  recommendation: AqlTrainingRecommendation | null;
  programs: TrainingProgram[];
  onConfirm: (programCode: string) => void;
  isEnrolling: boolean;
}

const PRIORITY_VARIANT_MAP: Record<AqlPriority, 'destructive' | 'warning' | 'default'> = {
  CRITICAL: 'destructive',
  HIGH: 'warning',
  MEDIUM: 'default',
};

export function AqlEnrollmentDialog({
  open,
  onOpenChange,
  recommendation,
  programs,
  onConfirm,
  isEnrolling,
}: Props) {
  const { t } = useTranslation();

  if (!recommendation) return null;

  return (
    <EnrollmentDialog
      open={open}
      onOpenChange={onOpenChange}
      programs={programs}
      recommendedPrograms={recommendation.recommended_programs}
      hasLinkedEmployee={!!recommendation.linked_employee}
      defaultProgramCode="INS-001"
      title={t('aql.recommendations.enrollDialog.title', 'Enroll in Training')}
      description={t(
        'aql.recommendations.enrollDialog.description',
        'Select a training program to enroll this employee.'
      )}
      noLinkedWarning={t(
        'aql.recommendations.enrollDialog.noLinkedEmployee',
        'No linked Q-TRAIN employee. Please link first.'
      )}
      onConfirm={onConfirm}
      isLoading={isEnrolling}
      i18nPrefix="aql.recommendations"
      infoContent={
        <div className="rounded-lg border p-4 space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium">
            <User className="h-4 w-4 text-muted-foreground" />
            {t('aql.recommendations.enrollDialog.employeeInfo', 'Employee Info')}
          </div>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <span className="text-muted-foreground">
                {t('aql.recommendations.employeeNo', 'Employee No')}:
              </span>{' '}
              <span className="font-medium">{recommendation.aql_employee_no}</span>
            </div>
            <div>
              <span className="text-muted-foreground">
                {t('aql.recommendations.name', 'Name')}:
              </span>{' '}
              <span className="font-medium">
                {recommendation.linked_employee?.employee_name || recommendation.aql_employee_name}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">
                {t('aql.recommendations.failRate', 'Fail Rate')}:
              </span>{' '}
              <span className="font-medium">{recommendation.fail_rate.toFixed(2)}%</span>
            </div>
            <div>
              <span className="text-muted-foreground">
                {t('aql.recommendations.priority', 'Priority')}:
              </span>{' '}
              <Badge variant={PRIORITY_VARIANT_MAP[recommendation.priority]}>
                {t(
                  `aql.recommendations.${recommendation.priority.toLowerCase()}`,
                  recommendation.priority
                )}
              </Badge>
            </div>
          </div>

          {/* Top Defects */}
          {recommendation.top_defects.length > 0 && (
            <div className="text-sm">
              <span className="text-muted-foreground">
                {t('aql.recommendations.topDefects', 'Top Defects')}:
              </span>{' '}
              <div className="flex flex-wrap gap-1 mt-1">
                {recommendation.top_defects.map((defect) => (
                  <Badge key={defect.type} variant="outline">
                    {defect.type} ({defect.count})
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      }
    />
  );
}
