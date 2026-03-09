import { useTranslation } from 'react-i18next';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import type { ComparisonRow } from './types';

interface TrainerComparisonTableProps {
  data: ComparisonRow[];
}

export default function TrainerComparisonTable({
  data,
}: TrainerComparisonTableProps) {
  const { t } = useTranslation();

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('trainers.trainerComparison')}</CardTitle>
        <CardDescription>
          {t('trainers.description')}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>#</TableHead>
              <TableHead>{t('trainers.trainerName')}</TableHead>
              <TableHead>{t('trainers.type')}</TableHead>
              <TableHead className="text-center">{t('trainers.sessions')}</TableHead>
              <TableHead className="text-center">{t('trainers.trainees')}</TableHead>
              <TableHead className="text-center">{t('trainers.passRate')}</TableHead>
              <TableHead className="text-center">{t('trainers.programsTaught')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  {t('trainers.noAnalyticsData')}
                </TableCell>
              </TableRow>
            ) : (
              data.map((row, idx) => (
                <TableRow key={row.trainer_id}>
                  <TableCell className="font-medium text-muted-foreground">
                    {idx + 1}
                  </TableCell>
                  <TableCell className="font-medium">{row.trainer_name}</TableCell>
                  <TableCell>
                    <Badge variant={row.trainer_type === 'INTERNAL' ? 'default' : 'secondary'}>
                      {row.trainer_type === 'INTERNAL'
                        ? t('trainers.internalShort')
                        : t('trainers.externalShort')}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">{row.sessionCount}</TableCell>
                  <TableCell className="text-center">{row.traineeCount}</TableCell>
                  <TableCell className="text-center">
                    <span
                      className={
                        row.passRate >= 80
                          ? 'text-green-600 font-medium'
                          : row.passRate >= 60
                            ? 'text-yellow-600 font-medium'
                            : 'text-red-600 font-medium'
                      }
                    >
                      {row.passRate}%
                    </span>
                  </TableCell>
                  <TableCell className="text-center">{row.programCount}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
