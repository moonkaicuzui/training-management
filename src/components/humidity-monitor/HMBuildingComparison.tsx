/**
 * 온도-습도 모니터링 — 빌딩별 비교 테이블
 * 정상률 < 80% 빨간색 하이라이트
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
import type { HMBuildingStats } from '@/types/humidityMonitor';

interface HMBuildingComparisonProps {
  data: HMBuildingStats[];
}

export default function HMBuildingComparison({ data }: HMBuildingComparisonProps) {
  const { t } = useTranslation();

  if (data.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium sm:text-base">
          {t('humidityMonitor.building.title')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('humidityMonitor.building.building')}</TableHead>
                <TableHead className="text-center">T.O</TableHead>
                <TableHead className="text-center">OK</TableHead>
                <TableHead className="text-center">NO OK</TableHead>
                <TableHead className="text-center">
                  {t('humidityMonitor.building.missing')}
                </TableHead>
                <TableHead className="text-center">
                  {t('humidityMonitor.building.okRate')}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((row) => {
                const isLow = row.okRate < 80;
                return (
                  <TableRow
                    key={row.building}
                    className={isLow ? 'bg-red-50' : ''}
                  >
                    <TableCell className="font-medium">
                      {t(`humidityMonitor.building.label.${row.building}`, row.building)}
                    </TableCell>
                    <TableCell className="text-center">{row.totalTarget}</TableCell>
                    <TableCell className="text-center text-green-600">
                      {row.totalOk}
                    </TableCell>
                    <TableCell className="text-center text-red-600">
                      {row.totalNoOk}
                    </TableCell>
                    <TableCell
                      className={`text-center ${
                        row.totalMissing < 0 ? 'text-red-600 font-medium' : ''
                      }`}
                    >
                      {row.totalMissing}
                    </TableCell>
                    <TableCell
                      className={`text-center font-medium ${
                        isLow ? 'text-red-600' : 'text-green-600'
                      }`}
                    >
                      {row.okRate.toFixed(1)}%
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
