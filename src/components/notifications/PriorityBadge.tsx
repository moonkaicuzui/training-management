import { useTranslation } from 'react-i18next';
import { Badge } from '@/components/ui/badge';
import type { NotificationPriority } from '@/types/notification';

export const PriorityBadge = ({ priority }: { priority: NotificationPriority }) => {
  const { t } = useTranslation();
  const config: Record<NotificationPriority, { label: string; variant: 'default' | 'secondary' | 'warning' | 'destructive' }> = {
    LOW: { label: t('notificationPage.priorityLow'), variant: 'secondary' },
    MEDIUM: { label: t('notificationPage.priorityMedium'), variant: 'default' },
    HIGH: { label: t('notificationPage.priorityHigh'), variant: 'warning' },
    URGENT: { label: t('notificationPage.priorityUrgent'), variant: 'destructive' },
  };
  const { label, variant } = config[priority];
  return <Badge variant={variant}>{label}</Badge>;
};
