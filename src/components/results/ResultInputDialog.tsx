import { useTranslation } from 'react-i18next';
import { Save, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { TrainingResult } from '@/types';

export interface ResultEntry {
  employee_id: string;
  employee_name: string;
  score: number | null;
  result: TrainingResult;
  remarks: string;
  isDuplicate?: boolean;
}

interface ResultInputFormProps {
  entries: ResultEntry[];
  program: { passing_score: number; grade_aa: number; grade_a: number; grade_b: number } | null;
  isSubmitting: boolean;
  onScoreChange: (index: number, score: string) => void;
  onResultChange: (index: number, result: 'PASS' | 'FAIL' | 'ABSENT') => void;
  onRemarksChange: (index: number, remarks: string) => void;
  onSave: () => void;
  getGrade: (score: number | null) => string | null;
}

export function ResultInputForm({
  entries,
  isSubmitting,
  onScoreChange,
  onResultChange,
  onRemarksChange,
  onSave,
  getGrade,
}: ResultInputFormProps) {
  const { t } = useTranslation();

  if (entries.length === 0) return null;

  return (
    <>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[120px]">{t('results.employeeId')}</TableHead>
              <TableHead>{t('results.name')}</TableHead>
              <TableHead className="w-[100px] text-center">{t('training.score')}</TableHead>
              <TableHead className="w-[100px] text-center">{t('training.grade')}</TableHead>
              <TableHead className="w-[150px] text-center">{t('training.result')}</TableHead>
              <TableHead>{t('training.notes')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {entries.map((entry, index) => {
              const grade = getGrade(entry.score);
              return (
                <TableRow key={entry.employee_id}>
                  <TableCell className="font-mono">{entry.employee_id}</TableCell>
                  <TableCell className="font-medium">{entry.employee_name}</TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      value={entry.score ?? ''}
                      onChange={(e) => onScoreChange(index, e.target.value)}
                      className="w-20 text-center"
                      placeholder={t('results.scorePlaceholder')}
                    />
                  </TableCell>
                  <TableCell className="text-center">
                    {grade && (
                      <Badge
                        variant={
                          grade === 'AA'
                            ? 'gradeAA'
                            : grade === 'A'
                            ? 'gradeA'
                            : grade === 'B'
                            ? 'gradeB'
                            : 'gradeC'
                        }
                      >
                        {grade}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <Select
                      value={entry.result}
                      onValueChange={(value) => onResultChange(index, value as TrainingResult)}
                    >
                      <SelectTrigger className="w-[120px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="PASS">{t('training.pass')}</SelectItem>
                        <SelectItem value="FAIL">{t('training.fail')}</SelectItem>
                        <SelectItem value="ABSENT">{t('training.absent')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Input
                      value={entry.remarks}
                      onChange={(e) => onRemarksChange(index, e.target.value)}
                      placeholder={t('results.remarksPlaceholder')}
                    />
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <div className="flex justify-end">
        <Button onClick={onSave} disabled={isSubmitting}>
          {isSubmitting ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          {isSubmitting ? t('common.saving') : t('results.saveResults')}
        </Button>
      </div>
    </>
  );
}
