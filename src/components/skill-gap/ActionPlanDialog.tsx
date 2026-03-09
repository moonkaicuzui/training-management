import { useTranslation } from 'react-i18next';
import { BookOpen } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { ActionPlanDialogProps } from './types';

export function ActionPlanDialog({
  open,
  onOpenChange,
  selectedGap,
  getRelatedPrograms,
  learningPaths,
}: ActionPlanDialogProps) {
  const { t } = useTranslation();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            {t('skillGap.actionPlan.title', { defaultValue: 'Action Plan' })}
          </DialogTitle>
          <DialogDescription>
            {selectedGap?.competency.name} - {selectedGap?.competency.competency_code}
          </DialogDescription>
        </DialogHeader>
        {selectedGap && (
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-3 gap-3">
              <div className="text-center p-3 bg-muted rounded-lg">
                <div className="text-2xl font-bold text-destructive">{selectedGap.gap_percentage}%</div>
                <div className="text-xs text-muted-foreground">{t('skillGap.actionPlan.gapRate', { defaultValue: 'Gap Rate' })}</div>
              </div>
              <div className="text-center p-3 bg-muted rounded-lg">
                <div className="text-2xl font-bold">{selectedGap.below_target}</div>
                <div className="text-xs text-muted-foreground">{t('skillGap.actionPlan.needTraining', { defaultValue: 'Need Training' })}</div>
              </div>
              <div className="text-center p-3 bg-muted rounded-lg">
                <div className="text-2xl font-bold text-green-600">{selectedGap.at_target}</div>
                <div className="text-xs text-muted-foreground">{t('skillGap.actionPlan.atTarget', { defaultValue: 'At Target' })}</div>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-medium mb-2">
                {t('skillGap.actionPlan.recommendedPrograms', { defaultValue: 'Recommended Training Programs' })}
              </h4>
              {(() => {
                const relatedProgs = getRelatedPrograms(selectedGap.competency.competency_id);
                if (relatedProgs.length === 0) {
                  return (
                    <p className="text-sm text-muted-foreground">
                      {t('skillGap.actionPlan.noPrograms', { defaultValue: 'No matching programs found. Consider creating a training program for this competency.' })}
                    </p>
                  );
                }
                return (
                  <div className="space-y-2">
                    {relatedProgs.map((prog) => (
                      <div
                        key={prog.program_code}
                        className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50"
                      >
                        <div>
                          <div className="text-sm font-medium">{prog.program_name}</div>
                          <div className="text-xs text-muted-foreground">
                            {prog.program_code} · {prog.category}
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            window.open(`/schedule?program=${prog.program_code}`, '_blank');
                          }}
                        >
                          {t('skillGap.actionPlan.createSession', { defaultValue: 'Schedule' })}
                        </Button>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>

            {learningPaths.filter((lp) =>
              lp.required_competencies?.some(
                (rc) => rc.competency_id === selectedGap.competency.competency_id
              )
            ).length > 0 && (
              <div>
                <h4 className="text-sm font-medium mb-2">
                  {t('skillGap.actionPlan.relatedPaths', { defaultValue: 'Related Learning Paths' })}
                </h4>
                <div className="space-y-1">
                  {learningPaths
                    .filter((lp) =>
                      lp.required_competencies?.some(
                        (rc) => rc.competency_id === selectedGap.competency.competency_id
                      )
                    )
                    .map((lp) => (
                      <div key={lp.path_id} className="flex items-center gap-2 text-sm p-2 border rounded">
                        <Badge variant="outline" className="text-[10px]">{lp.type}</Badge>
                        <span>{lp.name}</span>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
