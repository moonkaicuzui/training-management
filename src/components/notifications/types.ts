import type { Notification } from '@/types/notification';

export interface NotificationStats {
  total: number;
  unread: number;
  urgent: number;
  today: number;
}

export interface NotificationSettings {
  emailNotifications: boolean;
  inAppNotifications: boolean;
  trainingReminder: boolean;
  expiryWarning: boolean;
  retrainingRequired: boolean;
  reminderDays: number[];
}

export interface NotificationFiltersState {
  searchQuery: string;
  selectedType: string;
  selectedPriority: string;
  showUnreadOnly: boolean;
}

export interface NotificationTableProps {
  notifications: Notification[];
  selectedNotifications: Set<string>;
  onSelectAll: (checked: boolean) => void;
  onSelectOne: (id: string, checked: boolean) => void;
  onMarkAsRead: (id: string) => void;
  onDelete: (id: string) => void;
}

export interface NotificationBulkActionsProps {
  selectedCount: number;
  onMarkSelectedAsRead: () => void;
  onDeleteSelected: () => void;
}

export interface NotificationSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  settings: NotificationSettings;
  onSettingsChange: (updater: (prev: NotificationSettings) => NotificationSettings) => void;
  onSave: () => void;
}

export interface NotificationFiltersProps {
  searchQuery: string;
  selectedType: string;
  selectedPriority: string;
  showUnreadOnly: boolean;
  onSearchChange: (value: string) => void;
  onTypeChange: (value: string) => void;
  onPriorityChange: (value: string) => void;
  onUnreadOnlyChange: (value: boolean) => void;
}

export interface NotificationStatsCardsProps {
  stats: NotificationStats;
}
