/**
 * 온도-습도 모니터링 — 구역 마스터 관리
 * 초기 시드 등록, 편집, 삭제
 */

import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Pencil, Trash2, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { HMDevice } from '@/types/humidityMonitor';

interface HMDeviceSettingsProps {
  devices: HMDevice[];
  onSeed: () => void;
  onUpdate: (id: string, data: Partial<HMDevice>) => void;
  onDelete: (id: string) => void;
  isSeedDisabled: boolean;
}

interface EditingRow {
  id: string;
  area: string;
  targetQuantity: number;
}

export default function HMDeviceSettings({
  devices,
  onSeed,
  onUpdate,
  onDelete,
  isSeedDisabled,
}: HMDeviceSettingsProps) {
  const { t } = useTranslation();
  const [editing, setEditing] = useState<EditingRow | null>(null);

  const handleEdit = useCallback((device: HMDevice) => {
    setEditing({
      id: device.id,
      area: device.area,
      targetQuantity: device.targetQuantity,
    });
  }, []);

  const handleSave = useCallback(() => {
    if (!editing) return;
    onUpdate(editing.id, {
      area: editing.area,
      targetQuantity: editing.targetQuantity,
    });
    setEditing(null);
  }, [editing, onUpdate]);

  const handleCancel = useCallback(() => {
    setEditing(null);
  }, []);

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="text-sm font-medium sm:text-base">
            {t('humidityMonitor.settings.title')}
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={onSeed}
            disabled={isSeedDisabled}
            className="gap-1.5"
          >
            <Upload className="h-4 w-4" />
            {t('humidityMonitor.settings.seedButton')}
          </Button>
        </div>
        {isSeedDisabled && (
          <p className="text-xs text-muted-foreground mt-1">
            {t('humidityMonitor.settings.seedDisabledHint')}
          </p>
        )}
      </CardHeader>
      <CardContent>
        {devices.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            {t('humidityMonitor.settings.empty')}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10 text-center">#</TableHead>
                  <TableHead>{t('humidityMonitor.settings.area')}</TableHead>
                  <TableHead className="w-20 text-center">
                    {t('humidityMonitor.settings.building')}
                  </TableHead>
                  <TableHead className="w-16 text-center">T.O</TableHead>
                  <TableHead className="w-24 text-center">
                    {t('humidityMonitor.settings.actions')}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {devices.map((device) => {
                  const isEditing = editing?.id === device.id;

                  return (
                    <TableRow key={device.id}>
                      <TableCell className="text-center text-sm text-muted-foreground">
                        {device.number}
                      </TableCell>
                      <TableCell>
                        {isEditing ? (
                          <Input
                            value={editing.area}
                            onChange={(e) =>
                              setEditing((prev) =>
                                prev ? { ...prev, area: e.target.value } : null,
                              )
                            }
                            className="h-8 text-sm"
                            aria-label={t('humidityMonitor.settings.area')}
                          />
                        ) : (
                          <span className="text-sm font-medium">{device.area}</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center text-sm">{device.building}</TableCell>
                      <TableCell className="text-center">
                        {isEditing ? (
                          <Input
                            type="number"
                            min={1}
                            value={editing.targetQuantity}
                            onChange={(e) =>
                              setEditing((prev) =>
                                prev
                                  ? {
                                      ...prev,
                                      targetQuantity: Math.max(1, parseInt(e.target.value) || 1),
                                    }
                                  : null,
                              )
                            }
                            className="h-8 w-16 text-center mx-auto"
                            aria-label="T.O"
                          />
                        ) : (
                          <span className="text-sm">{device.targetQuantity}</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        {isEditing ? (
                          <div className="flex gap-1 justify-center">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={handleSave}
                              className="h-7 px-2 text-xs"
                            >
                              {t('common.save')}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={handleCancel}
                              className="h-7 px-2 text-xs"
                            >
                              {t('common.cancel')}
                            </Button>
                          </div>
                        ) : (
                          <div className="flex gap-1 justify-center">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => handleEdit(device)}
                              aria-label={t('common.edit')}
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-destructive hover:text-destructive"
                              onClick={() => onDelete(device.id)}
                              aria-label={t('common.delete')}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
