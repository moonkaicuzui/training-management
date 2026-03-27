/**
 * 온도-습도 모니터링 — 일괄 점검 입력 폼
 * 테이블 형태로 구역별 OK/NOOK 수량 입력
 */

import { useState, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter,
} from '@/components/ui/table';
import { calculateCheckResult } from '@/services/hmMonitor/helpers';
import type { HMDevice, HMCheckResult } from '@/types/humidityMonitor';

interface HMBatchEntryFormProps {
  devices: HMDevice[];
  defaultResults?: HMCheckResult[];
  onSubmit: (results: HMCheckResult[]) => void;
  isSubmitting: boolean;
}

interface RowData {
  deviceId: string;
  area: string;
  targetQuantity: number;
  okCount: number;
  noOkCount: number;
  remark: string;
}

export default function HMBatchEntryForm({
  devices,
  defaultResults,
  onSubmit,
  isSubmitting,
}: HMBatchEntryFormProps) {
  const { t } = useTranslation();

  // 초기 행 데이터: defaultResults가 있으면 사용, 없으면 devices 기반 기본값
  const [rows, setRows] = useState<RowData[]>(() =>
    devices.map((device) => {
      const existing = defaultResults?.find((r) => r.deviceId === device.id);
      return {
        deviceId: device.id,
        area: device.area,
        targetQuantity: device.targetQuantity,
        okCount: existing?.okCount ?? device.targetQuantity,
        noOkCount: existing?.noOkCount ?? 0,
        remark: existing?.remark ?? '',
      };
    }),
  );

  const updateRow = useCallback((index: number, field: keyof RowData, value: string | number) => {
    setRows((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  }, []);

  // 계산된 결과
  const computedRows = useMemo(
    () =>
      rows.map((row) => {
        const { totalHave, missing, status } = calculateCheckResult(
          row.okCount,
          row.noOkCount,
          row.targetQuantity,
        );
        return { ...row, totalHave, missing, status };
      }),
    [rows],
  );

  // TOTAL 행
  const totals = useMemo(() => {
    const totalTarget = computedRows.reduce((s, r) => s + r.targetQuantity, 0);
    const totalOk = computedRows.reduce((s, r) => s + r.okCount, 0);
    const totalNoOk = computedRows.reduce((s, r) => s + r.noOkCount, 0);
    const totalHave = totalOk + totalNoOk;
    const totalMissing = totalHave - totalTarget;
    return { totalTarget, totalOk, totalNoOk, totalHave, totalMissing };
  }, [computedRows]);

  // 유효성: NOOK > 0 또는 missing < 0 이면 비고 필수
  const hasValidationErrors = useMemo(
    () =>
      computedRows.some(
        (row) => (row.noOkCount > 0 || row.missing < 0) && !row.remark.trim(),
      ),
    [computedRows],
  );

  const handleSubmit = () => {
    const results: HMCheckResult[] = computedRows.map((row) => ({
      deviceId: row.deviceId,
      area: row.area,
      targetQuantity: row.targetQuantity,
      okCount: row.okCount,
      noOkCount: row.noOkCount,
      totalHave: row.totalHave,
      missing: row.missing,
      status: row.status,
      remark: row.remark.trim() || undefined,
    }));
    onSubmit(results);
  };

  const needsRemark = (row: (typeof computedRows)[0]) =>
    (row.noOkCount > 0 || row.missing < 0) && !row.remark.trim();

  return (
    <div className="space-y-4">
      {/* 모바일에서 가로 스크롤 가능 */}
      <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10 text-center">#</TableHead>
              <TableHead className="min-w-[120px]">
                {t('humidityMonitor.form.area')}
              </TableHead>
              <TableHead className="w-16 text-center">T.O</TableHead>
              <TableHead className="w-20 text-center">
                {t('humidityMonitor.form.okCount')}
              </TableHead>
              <TableHead className="w-20 text-center">
                {t('humidityMonitor.form.noOkCount')}
              </TableHead>
              <TableHead className="w-16 text-center">
                {t('humidityMonitor.form.totalHave')}
              </TableHead>
              <TableHead className="w-16 text-center">
                {t('humidityMonitor.form.missing')}
              </TableHead>
              <TableHead className="min-w-[120px]">
                {t('humidityMonitor.form.remark')}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {computedRows.map((row, idx) => (
              <TableRow
                key={row.deviceId}
                className={row.noOkCount > 0 || row.missing < 0 ? 'bg-red-50/50' : ''}
              >
                <TableCell className="text-center text-sm text-muted-foreground">
                  {idx + 1}
                </TableCell>
                <TableCell className="text-sm font-medium">{row.area}</TableCell>
                <TableCell className="text-center text-sm">{row.targetQuantity}</TableCell>
                <TableCell className="text-center">
                  <Input
                    type="number"
                    min={0}
                    value={row.okCount}
                    onChange={(e) =>
                      updateRow(idx, 'okCount', Math.max(0, parseInt(e.target.value) || 0))
                    }
                    className="h-8 w-16 text-center mx-auto"
                    aria-label={`${row.area} OK`}
                  />
                </TableCell>
                <TableCell className="text-center">
                  <Input
                    type="number"
                    min={0}
                    value={row.noOkCount}
                    onChange={(e) =>
                      updateRow(idx, 'noOkCount', Math.max(0, parseInt(e.target.value) || 0))
                    }
                    className="h-8 w-16 text-center mx-auto"
                    aria-label={`${row.area} NO OK`}
                  />
                </TableCell>
                <TableCell className="text-center text-sm">{row.totalHave}</TableCell>
                <TableCell
                  className={`text-center text-sm font-medium ${
                    row.missing < 0 ? 'text-red-600' : ''
                  }`}
                >
                  {row.missing}
                </TableCell>
                <TableCell>
                  <Input
                    value={row.remark}
                    onChange={(e) => updateRow(idx, 'remark', e.target.value)}
                    placeholder={
                      needsRemark(row)
                        ? t('humidityMonitor.form.remarkRequired')
                        : ''
                    }
                    className={`h-8 text-sm ${
                      needsRemark(row)
                        ? 'border-red-500 focus-visible:ring-red-500'
                        : ''
                    }`}
                    aria-label={`${row.area} ${t('humidityMonitor.form.remark')}`}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
          <TableFooter>
            <TableRow className="font-bold">
              <TableCell colSpan={2} className="text-right">
                TOTAL
              </TableCell>
              <TableCell className="text-center">{totals.totalTarget}</TableCell>
              <TableCell className="text-center">{totals.totalOk}</TableCell>
              <TableCell className="text-center">{totals.totalNoOk}</TableCell>
              <TableCell className="text-center">{totals.totalHave}</TableCell>
              <TableCell
                className={`text-center ${totals.totalMissing < 0 ? 'text-red-600' : ''}`}
              >
                {totals.totalMissing}
              </TableCell>
              <TableCell />
            </TableRow>
          </TableFooter>
        </Table>
      </div>

      <div className="flex justify-end">
        <Button
          onClick={handleSubmit}
          disabled={isSubmitting || hasValidationErrors}
          className="min-w-[120px]"
        >
          {isSubmitting
            ? t('common.saving')
            : t('humidityMonitor.form.save')}
        </Button>
      </div>

      {hasValidationErrors && (
        <p className="text-sm text-red-500 text-right">
          {t('humidityMonitor.form.remarkValidationError')}
        </p>
      )}
    </div>
  );
}
