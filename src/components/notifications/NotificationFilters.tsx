import { useTranslation } from 'react-i18next';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { NotificationFiltersProps } from './types';

export const NotificationFilters = ({
  searchQuery,
  selectedType,
  selectedPriority,
  showUnreadOnly,
  onSearchChange,
  onTypeChange,
  onPriorityChange,
  onUnreadOnlyChange,
}: NotificationFiltersProps) => {
  const { t } = useTranslation();

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t('notificationPage.searchPlaceholder')}
              className="pl-8"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
            />
          </div>
          <Select value={selectedType} onValueChange={onTypeChange}>
            <SelectTrigger className="w-full md:w-40">
              <SelectValue placeholder={t('notificationPage.colType')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('notificationPage.allTypes')}</SelectItem>
              <SelectItem value="TRAINING_REMINDER">{t('notificationPage.typeSchedule')}</SelectItem>
              <SelectItem value="EXPIRY_WARNING">{t('notificationPage.typeExpiring')}</SelectItem>
              <SelectItem value="RETRAINING_REQUIRED">{t('notificationPage.typeRetraining')}</SelectItem>
              <SelectItem value="RESULT_AVAILABLE">{t('notificationPage.typeResult')}</SelectItem>
              <SelectItem value="CERTIFICATE_READY">{t('notificationPage.typeCertificate')}</SelectItem>
              <SelectItem value="SYSTEM">{t('notificationPage.typeSystem')}</SelectItem>
            </SelectContent>
          </Select>
          <Select value={selectedPriority} onValueChange={onPriorityChange}>
            <SelectTrigger className="w-full md:w-32">
              <SelectValue placeholder={t('notificationPage.colPriority')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('notificationPage.priorityAll')}</SelectItem>
              <SelectItem value="URGENT">{t('notificationPage.priorityUrgent')}</SelectItem>
              <SelectItem value="HIGH">{t('notificationPage.priorityHigh')}</SelectItem>
              <SelectItem value="MEDIUM">{t('notificationPage.priorityMedium')}</SelectItem>
              <SelectItem value="LOW">{t('notificationPage.priorityLow')}</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex items-center gap-2">
            <Switch
              checked={showUnreadOnly}
              onCheckedChange={onUnreadOnlyChange}
            />
            <Label>{t('notificationPage.unreadOnly')}</Label>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
