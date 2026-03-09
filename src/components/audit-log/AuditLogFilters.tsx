import { useTranslation } from 'react-i18next';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { AuditLogFiltersProps } from './types';

export function AuditLogFilters({
  searchQuery,
  selectedEntityType,
  selectedAction,
  selectedPeriod,
  onSearchChange,
  onEntityTypeChange,
  onActionChange,
  onPeriodChange,
}: AuditLogFiltersProps) {
  const { t } = useTranslation();

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t('auditLog.searchPlaceholder')}
              className="pl-8"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
            />
          </div>
          <Select value={selectedEntityType} onValueChange={onEntityTypeChange}>
            <SelectTrigger className="w-full md:w-40">
              <SelectValue placeholder={t('auditLog.entityType')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('auditLog.allEntityTypes')}</SelectItem>
              <SelectItem value="PROGRAM">{t('auditLog.entityProgram')}</SelectItem>
              <SelectItem value="RESULT">{t('auditLog.entityResult')}</SelectItem>
              <SelectItem value="SESSION">{t('auditLog.entitySession')}</SelectItem>
              <SelectItem value="EMPLOYEE">{t('auditLog.entityEmployee')}</SelectItem>
            </SelectContent>
          </Select>
          <Select value={selectedAction} onValueChange={onActionChange}>
            <SelectTrigger className="w-full md:w-40">
              <SelectValue placeholder={t('auditLog.actionType')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('auditLog.allActions')}</SelectItem>
              <SelectItem value="CREATE">{t('auditLog.actionCreate')}</SelectItem>
              <SelectItem value="UPDATE">{t('auditLog.actionUpdate')}</SelectItem>
              <SelectItem value="DELETE">{t('auditLog.actionDelete')}</SelectItem>
              <SelectItem value="VIEW">{t('auditLog.actionRead')}</SelectItem>
              <SelectItem value="EXPORT">{t('auditLog.actionExport')}</SelectItem>
            </SelectContent>
          </Select>
          <Select value={selectedPeriod} onValueChange={onPeriodChange}>
            <SelectTrigger className="w-full md:w-40">
              <SelectValue placeholder={t('auditLog.dateTime')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">{t('auditLog.last1Day')}</SelectItem>
              <SelectItem value="7">{t('auditLog.last7Days')}</SelectItem>
              <SelectItem value="30">{t('auditLog.last30Days')}</SelectItem>
              <SelectItem value="90">{t('auditLog.last90Days')}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
}
