import { useTranslation } from 'react-i18next';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { format } from 'date-fns';
import type { SelectedCellData } from './types';

interface CellDetailDialogProps {
  selectedCell: SelectedCellData | null;
  onClose: () => void;
  onEmployeeDetail: (employeeId: string) => void;
}

export default function CellDetailDialog({
  selectedCell,
  onClose,
  onEmployeeDetail,
}: CellDetailDialogProps) {
  const { t } = useTranslation();

  return (
    <Dialog open={!!selectedCell} onOpenChange={() => onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('progress.historyDetail')}</DialogTitle>
          <DialogDescription>
            {selectedCell?.employee.employee_name} - {selectedCell?.program.program_name}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">{t('progress.employee')}</p>
              <p className="font-medium">{selectedCell?.employee.employee_name}</p>
              <p className="text-sm text-muted-foreground">
                {selectedCell?.employee.employee_id}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{t('common.program')}</p>
              <p className="font-medium">{selectedCell?.program.program_code}</p>
              <p className="text-sm text-muted-foreground">
                {selectedCell?.program.program_name}
              </p>
            </div>
          </div>

          {selectedCell?.cell ? (
            <div className="space-y-3 pt-4 border-t">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">{t('progress.latestResult')}</span>
                <Badge
                  variant={
                    selectedCell.cell.last_result === 'PASS'
                      ? 'success'
                      : selectedCell.cell.last_result === 'FAIL'
                      ? 'destructive'
                      : 'secondary'
                  }
                >
                  {selectedCell.cell.last_result === 'PASS'
                    ? t('training.pass')
                    : selectedCell.cell.last_result === 'FAIL'
                    ? t('training.fail')
                    : t('training.absent')}
                </Badge>
              </div>
              {selectedCell.cell.last_score !== null && (
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">{t('training.score')}</span>
                  <span className="font-medium">{selectedCell.cell.last_score}{t('program.scoreUnit')}</span>
                </div>
              )}
              {selectedCell.cell.last_grade && (
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">{t('training.grade')}</span>
                  <Badge
                    variant={
                      selectedCell.cell.last_grade === 'AA'
                        ? 'gradeAA'
                        : selectedCell.cell.last_grade === 'A'
                        ? 'gradeA'
                        : selectedCell.cell.last_grade === 'B'
                        ? 'gradeB'
                        : 'gradeC'
                    }
                  >
                    {selectedCell.cell.last_grade}
                  </Badge>
                </div>
              )}
              {selectedCell.cell.last_training_date && (
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">{t('training.date')}</span>
                  <span>
                    {format(new Date(selectedCell.cell.last_training_date), 'yyyy-MM-dd')}
                  </span>
                </div>
              )}
              {selectedCell.cell.expiration_date && (
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">{t('progress.expirationDate')}</span>
                  <span
                    className={
                      selectedCell.cell.status === 'EXPIRED'
                        ? 'text-status-expired'
                        : selectedCell.cell.status === 'EXPIRING'
                        ? 'text-status-warning'
                        : ''
                    }
                  >
                    {format(new Date(selectedCell.cell.expiration_date), 'yyyy-MM-dd')}
                    {selectedCell.cell.status === 'EXPIRED' && ` ${t('progress.statusExpired')}`}
                    {selectedCell.cell.status === 'EXPIRING' && ` ${t('progress.statusExpiring')}`}
                  </span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">{t('progress.totalCompletions')}</span>
                <span>{t('progress.completionCount', { count: selectedCell.cell.completion_count })}</span>
              </div>
            </div>
          ) : (
            <div className="text-center py-4 text-muted-foreground">
              {t('progress.noHistory')}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-4">
            <Button
              variant="outline"
              onClick={() =>
                onEmployeeDetail(selectedCell?.employee.employee_id ?? '')
              }
            >
              {t('progress.employeeDetail')}
            </Button>
            <Button onClick={onClose}>{t('common.close')}</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
