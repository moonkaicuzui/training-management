import { useTranslation } from 'react-i18next';
import { Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { AttendanceStatus } from '@/types/attendance';

interface AttendanceToolbarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedCount: number;
  bulkStatus: AttendanceStatus;
  onBulkStatusChange: (status: AttendanceStatus) => void;
  onBulkApply: () => void;
}

export function AttendanceToolbar({
  searchQuery,
  onSearchChange,
  selectedCount,
  bulkStatus,
  onBulkStatusChange,
  onBulkApply,
}: AttendanceToolbarProps) {
  const { t } = useTranslation();

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t('attendance.searchPlaceholder')}
              className="pl-8"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
            />
          </div>
          {selectedCount > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                {t('attendance.selectedCount', { count: selectedCount })}
              </span>
              <Select value={bulkStatus} onValueChange={(v) => onBulkStatusChange(v as AttendanceStatus)}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PRESENT">{t('attendance.present')}</SelectItem>
                  <SelectItem value="ABSENT">{t('attendance.absent')}</SelectItem>
                  <SelectItem value="ABSENT_WITH_REASON">{t('attendance.absentWithReason')}</SelectItem>
                  <SelectItem value="LATE">{t('attendance.late')}</SelectItem>
                  <SelectItem value="EXCUSED">{t('attendance.excused')}</SelectItem>
                </SelectContent>
              </Select>
              <Button size="sm" onClick={onBulkApply}>
                {t('attendance.bulkApply')}
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
