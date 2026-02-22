import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectGroup,
  SelectLabel,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, User, AlertTriangle } from 'lucide-react';
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
  const [selectedProgram, setSelectedProgram] = useState<string>('');

  // Reset selection when dialog opens with new recommendation
  useEffect(() => {
    if (open && recommendation) {
      setSelectedProgram('INS-001');
    }
  }, [open, recommendation]);

  // Separate recommended vs other active programs
  const otherPrograms = useMemo(() => {
    if (!recommendation) return programs;

    const codes = new Set(
      recommendation.recommended_programs.map((p) => p.program_code)
    );
    return programs.filter((p) => !codes.has(p.program_code) && p.is_active);
  }, [recommendation, programs]);

  const handleConfirm = () => {
    if (selectedProgram) {
      onConfirm(selectedProgram);
    }
  };

  if (!recommendation) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {t('aql.recommendations.enrollDialog.title', 'Enroll in Training')}
          </DialogTitle>
          <DialogDescription>
            {t(
              'aql.recommendations.enrollDialog.description',
              'Select a training program to enroll this employee.'
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Recommendation Info */}
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

          {/* Linked Employee Warning */}
          {!recommendation.linked_employee && (
            <div className="flex items-center gap-2 text-sm text-destructive rounded-lg border border-destructive/30 p-3">
              <AlertTriangle className="h-4 w-4" />
              {t(
                'aql.recommendations.enrollDialog.noLinkedEmployee',
                'No linked Q-TRAIN employee. Please link first.'
              )}
            </div>
          )}

          {/* Program Selector */}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              {t('aql.recommendations.enrollDialog.selectProgram', 'Select Program')}
            </label>
            <Select
              value={selectedProgram}
              onValueChange={setSelectedProgram}
              disabled={!recommendation.linked_employee}
            >
              <SelectTrigger className="w-full">
                <SelectValue
                  placeholder={t(
                    'aql.recommendations.enrollDialog.programPlaceholder',
                    'Select a training program...'
                  )}
                />
              </SelectTrigger>
              <SelectContent>
                {/* INS-001 Inspection Training (Primary) */}
                {(() => {
                  const ins001 = programs.find((p) => p.program_code === 'INS-001');
                  return ins001 ? (
                    <SelectGroup>
                      <SelectLabel>
                        {t(
                          'aql.recommendations.enrollDialog.inspectionTraining',
                          'Inspection Training'
                        )}
                      </SelectLabel>
                      <SelectItem value="INS-001">
                        {ins001.program_name} (Default)
                      </SelectItem>
                    </SelectGroup>
                  ) : null;
                })()}

                {/* Recommended Programs (excluding INS-001) */}
                {recommendation.recommended_programs.filter((rp) => rp.program_code !== 'INS-001').length > 0 && (
                  <SelectGroup>
                    <SelectLabel>
                      {t(
                        'aql.recommendations.enrollDialog.recommendedPrograms',
                        'Recommended Programs'
                      )}
                    </SelectLabel>
                    {recommendation.recommended_programs
                      .filter((rp) => rp.program_code !== 'INS-001')
                      .map((rp) => (
                        <SelectItem key={rp.program_code} value={rp.program_code}>
                          {rp.program_name} ({rp.match_reason})
                        </SelectItem>
                      ))}
                  </SelectGroup>
                )}

                {/* All Other Active Programs (excluding INS-001) */}
                {otherPrograms.filter((p) => p.program_code !== 'INS-001').length > 0 && (
                  <SelectGroup>
                    <SelectLabel>
                      {t(
                        'aql.recommendations.enrollDialog.allPrograms',
                        'All Active Programs'
                      )}
                    </SelectLabel>
                    {otherPrograms
                      .filter((p) => p.program_code !== 'INS-001')
                      .map((p) => (
                        <SelectItem key={p.program_code} value={p.program_code}>
                          {p.program_name}
                        </SelectItem>
                      ))}
                  </SelectGroup>
                )}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isEnrolling}
          >
            {t('common.cancel', 'Cancel')}
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!selectedProgram || !recommendation.linked_employee || isEnrolling}
          >
            {isEnrolling && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {t('aql.recommendations.enrollDialog.confirm', 'Confirm Enrollment')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
