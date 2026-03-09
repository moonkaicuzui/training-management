import { useState, useEffect, useMemo, type ReactNode } from 'react';
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
import { Loader2, AlertTriangle } from 'lucide-react';
import type { TrainingProgram } from '@/types';

export interface RecommendedProgramInfo {
  program_code: string;
  program_name: string;
  match_reason: string;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** All available training programs */
  programs: TrainingProgram[];
  /** Recommended programs for the current recommendation */
  recommendedPrograms: RecommendedProgramInfo[];
  /** Whether this recommendation has a linked employee */
  hasLinkedEmployee: boolean;
  /** Default program code to select when dialog opens */
  defaultProgramCode?: string;
  /** Dialog title */
  title: string;
  /** Dialog description */
  description: string;
  /** Content to render in the info section (employee details, etc.) */
  infoContent: ReactNode;
  /** Warning when no linked employee */
  noLinkedWarning: string;
  /** Additional content below program selector (e.g. year-month) */
  extraContent?: ReactNode;
  /** Callback when confirm is clicked */
  onConfirm: (programCode: string) => void;
  /** Whether enrollment is in progress */
  isLoading: boolean;
  /** i18n namespace prefix for shared labels */
  i18nPrefix?: string;
}

export function EnrollmentDialog({
  open,
  onOpenChange,
  programs,
  recommendedPrograms,
  hasLinkedEmployee,
  defaultProgramCode,
  title,
  description,
  infoContent,
  noLinkedWarning,
  extraContent,
  onConfirm,
  isLoading,
  i18nPrefix = 'recommendation',
}: Props) {
  const { t } = useTranslation();
  const [selectedProgram, setSelectedProgram] = useState<string>('');

  // Reset selection when dialog opens
  useEffect(() => {
    if (open) {
      setSelectedProgram(defaultProgramCode ?? '');
    }
  }, [open, defaultProgramCode]);

  // Separate recommended vs other active programs
  const otherPrograms = useMemo(() => {
    const codes = new Set(recommendedPrograms.map((p) => p.program_code));
    return programs.filter((p) => !codes.has(p.program_code) && p.is_active);
  }, [recommendedPrograms, programs]);

  const handleConfirm = () => {
    if (selectedProgram) {
      onConfirm(selectedProgram);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Info Content (domain-specific) */}
          {infoContent}

          {/* Linked Employee Warning */}
          {!hasLinkedEmployee && (
            <div className="flex items-center gap-2 text-sm text-destructive rounded-lg border border-destructive/30 p-3">
              <AlertTriangle className="h-4 w-4" />
              {noLinkedWarning}
            </div>
          )}

          {/* Program Selector */}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              {t(`${i18nPrefix}.enrollDialog.selectProgram`, 'Select Program')}
            </label>
            <Select
              value={selectedProgram}
              onValueChange={setSelectedProgram}
              disabled={!hasLinkedEmployee}
            >
              <SelectTrigger className="w-full">
                <SelectValue
                  placeholder={t(
                    `${i18nPrefix}.enrollDialog.programPlaceholder`,
                    'Select a training program...'
                  )}
                />
              </SelectTrigger>
              <SelectContent>
                {/* Recommended Programs */}
                {recommendedPrograms.length > 0 && (
                  <SelectGroup>
                    <SelectLabel>
                      {t(
                        `${i18nPrefix}.enrollDialog.recommendedPrograms`,
                        'Recommended Programs'
                      )}
                    </SelectLabel>
                    {recommendedPrograms.map((rp) => (
                      <SelectItem key={rp.program_code} value={rp.program_code}>
                        {rp.program_name} ({rp.match_reason})
                      </SelectItem>
                    ))}
                  </SelectGroup>
                )}

                {/* All Other Active Programs */}
                {otherPrograms.length > 0 && (
                  <SelectGroup>
                    <SelectLabel>
                      {t(
                        `${i18nPrefix}.enrollDialog.allPrograms`,
                        'All Active Programs'
                      )}
                    </SelectLabel>
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

          {/* Extra Content (e.g. year-month display) */}
          {extraContent}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            {t('common.cancel', 'Cancel')}
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!selectedProgram || !hasLinkedEmployee || isLoading}
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {t(`${i18nPrefix}.enrollDialog.confirm`, 'Confirm Enrollment')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
