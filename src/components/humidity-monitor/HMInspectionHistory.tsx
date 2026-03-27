/**
 * 온도-습도 모니터링 — 점검 이력 테이블
 * 행 클릭 시 onSelect 콜백
 */

import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { HMInspection } from '@/types/humidityMonitor';

interface HMInspectionHistoryProps {
  inspections: HMInspection[];
  onSelect?: (id: string) => void;
}

export default function HMInspectionHistory({
  inspections,
  onSelect,
}: HMInspectionHistoryProps) {
  const { t } = useTranslation();

  if (inspections.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium sm:text-base">
            {t('humidityMonitor.history.title')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-8">
            {t('humidityMonitor.history.empty')}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium sm:text-base">
          {t('humidityMonitor.history.title')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('humidityMonitor.history.date')}</TableHead>
                <TableHead className="text-center">
                  {t('humidityMonitor.history.okRate')}
                </TableHead>
                <TableHead className="text-center">OK</TableHead>
                <TableHead className="text-center">NO OK</TableHead>
                <TableHead className="text-center">
                  {t('humidityMonitor.history.missing')}
                </TableHead>
                <TableHead>{t('humidityMonitor.history.inspector')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {inspections.map((insp) => (
                <TableRow
                  key={insp.id}
                  className={onSelect ? 'cursor-pointer hover:bg-muted/50' : ''}
                  onClick={() => onSelect?.(insp.id)}
                  role={onSelect ? 'button' : undefined}
                  tabIndex={onSelect ? 0 : undefined}
                  onKeyDown={(e) => {
                    if (onSelect && (e.key === 'Enter' || e.key === ' ')) {
                      e.preventDefault();
                      onSelect(insp.id);
                    }
                  }}
                >
                  <TableCell className="font-medium">{insp.inspectionDate}</TableCell>
                  <TableCell
                    className={`text-center font-medium ${
                      insp.summary.okRate < 80 ? 'text-red-600' : 'text-green-600'
                    }`}
                  >
                    {insp.summary.okRate.toFixed(1)}%
                  </TableCell>
                  <TableCell className="text-center text-green-600">
                    {insp.summary.totalOk}
                  </TableCell>
                  <TableCell className="text-center text-red-600">
                    {insp.summary.totalNoOk}
                  </TableCell>
                  <TableCell
                    className={`text-center ${
                      insp.summary.totalMissing < 0 ? 'text-red-600' : ''
                    }`}
                  >
                    {insp.summary.totalMissing}
                  </TableCell>
                  <TableCell>{insp.inspector}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
