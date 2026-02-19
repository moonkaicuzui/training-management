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
import { Loader2, User, Link2, AlertTriangle } from 'lucide-react';
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
  const [selectedProgram, setSelectedProgram] = useState<string>('');

  // Reset selection when dialog opens with new recommendation
  useEffect(() => {
    if (open && recommendation) {
      const firstRecommended = recommendation.recommendedPrograms[0]?.program_code;
      setSelectedProgram(firstRecommended || '');
    }
  }, [open, recommendation]);

  // Separate recommended vs other programs
  const otherPrograms = useMemo(() => {
    if (!recommendation) return programs;

    const codes = new Set(recommendation.recommendedPrograms.map((p) => p.program_code));
    return programs.filter((p) => !codes.has(p.program_code) && p.is_active);
  }, [recommendation, programs]);

  const handleConfirm = () => {
    if (selectedProgram) {
      onConfirm(selectedProgram);
    }
  };

  if (!recommendation) return null;

  const hasLinkedEmployee = !!recommendation.linkedEmployee;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{t('recommendation.enrollDialog.title')}</DialogTitle>
          <DialogDescription>
            {t('recommendation.enrollDialog.description')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
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
            ) : (
              <div className="flex items-center gap-2 text-sm text-destructive">
                <AlertTriangle className="h-4 w-4" />
                {t('recommendation.enrollDialog.noLinkedEmployee')}
              </div>
            )}
          </div>

          {/* Program Selector */}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              {t('recommendation.enrollDialog.selectProgram')}
            </label>
            <Select
              value={selectedProgram}
              onValueChange={setSelectedProgram}
              disabled={!hasLinkedEmployee}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder={t('recommendation.enrollDialog.programPlaceholder')} />
              </SelectTrigger>
              <SelectContent>
                {/* Recommended Programs */}
                {recommendation.recommendedPrograms.length > 0 && (
                  <SelectGroup>
                    <SelectLabel>{t('recommendation.enrollDialog.recommendedPrograms')}</SelectLabel>
                    {recommendation.recommendedPrograms.map((rp) => (
                      <SelectItem key={rp.program_code} value={rp.program_code}>
                        {rp.program_name} ({rp.match_reason})
                      </SelectItem>
                    ))}
                  </SelectGroup>
                )}

                {/* All Other Programs */}
                {otherPrograms.length > 0 && (
                  <SelectGroup>
                    <SelectLabel>{t('recommendation.enrollDialog.allPrograms')}</SelectLabel>
                    {otherPrograms.map((p) => (
                      <SelectItem key={p.program_code} value={p.program_code}>
                        {p.program_name}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Year-Month */}
          <div className="text-sm text-muted-foreground">
            {t('recommendation.enrollDialog.yearMonth')}: <span className="font-medium">{yearMonth}</span>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            {t('common.cancel')}
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!selectedProgram || !hasLinkedEmployee || isLoading}
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {t('recommendation.enrollDialog.confirm')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
