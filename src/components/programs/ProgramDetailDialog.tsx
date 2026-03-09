import { useTranslation } from 'react-i18next';
import { Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { TrainingProgram } from '@/types';

interface ProgramDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  program: TrainingProgram | null;
  language: string;
  onEdit: (program: TrainingProgram) => void;
}

function getProgramName(program: TrainingProgram, language: string): string {
  switch (language) {
    case 'vi':
      return program.program_name_vn || program.program_name;
    case 'ko':
      return program.program_name_kr || program.program_name;
    default:
      return program.program_name;
  }
}

function getCategoryBadgeVariant(category: string): string {
  switch (category) {
    case 'QIP':
      return 'default';
    case 'PRODUCTION':
      return 'secondary';
    case 'RETRAINING':
      return 'warning';
    case 'NEWCOMER':
      return 'success';
    case 'PROMOTION':
      return 'default';
    default:
      return 'outline';
  }
}

export function ProgramDetailDialog({
  open,
  onOpenChange,
  program,
  language,
  onEdit,
}: ProgramDetailDialogProps) {
  const { t } = useTranslation();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{t('program.viewDetail')}</DialogTitle>
          <DialogDescription>{program?.program_code}</DialogDescription>
        </DialogHeader>
        {program && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">{t('program.code')}</p>
                <p className="font-medium font-mono">{program.program_code}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t('program.category')}</p>
                <Badge variant={getCategoryBadgeVariant(program.category) as 'default'}>
                  {t(`category.${program.category}`)}
                </Badge>
              </div>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{t('program.name')}</p>
              <p className="font-medium">{getProgramName(program, language)}</p>
            </div>
            {program.training_level && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">{t('trainingLevel.title')}</p>
                  <p className="font-medium">{t(`trainingLevel.${program.training_level}`)}</p>
                </div>
                {program.training_type && (
                  <div>
                    <p className="text-sm text-muted-foreground">{t('trainingType.title')}</p>
                    <p className="font-medium">{t(`trainingType.${program.training_type}`)}</p>
                  </div>
                )}
              </div>
            )}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">{t('program.passingScore')}</p>
                <p className="font-medium">{program.passing_score}{t('program.scoreUnit')}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t('program.duration')}</p>
                <p className="font-medium">{program.duration_hours}{t('program.hours')}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t('program.validity')}</p>
                <p className="font-medium">
                  {program.validity_months ? `${program.validity_months}${t('program.months')}` : '-'}
                </p>
              </div>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{t('program.targetPositions')}</p>
              <div className="flex flex-wrap gap-1 mt-1">
                {program.target_positions.map((pos) => (
                  <Badge key={pos} variant="outline">{t(`position.${pos}`)}</Badge>
                ))}
              </div>
            </div>
            {program.tags.length > 0 && (
              <div>
                <p className="text-sm text-muted-foreground">{t('program.tags')}</p>
                <div className="flex flex-wrap gap-1 mt-1">
                  {program.tags.map((tag) => (
                    <Badge key={tag} variant="secondary">{tag}</Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t('common.close')}
          </Button>
          {program && (
            <Button onClick={() => {
              onOpenChange(false);
              onEdit(program);
            }}>
              <Pencil className="h-4 w-4 mr-2" />
              {t('common.edit')}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
