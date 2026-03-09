import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import type { NotificationSettingsDialogProps } from './types';

export const NotificationSettingsDialog = ({
  open,
  onOpenChange,
  settings,
  onSettingsChange,
  onSave,
}: NotificationSettingsDialogProps) => {
  const { t } = useTranslation();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t('notificationPage.settingsTitle')}</DialogTitle>
          <DialogDescription>
            {t('notificationPage.settingsDesc')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="space-y-4">
            <h4 className="font-medium">{t('notificationPage.receiveMethod')}</h4>
            <div className="flex items-center justify-between">
              <Label htmlFor="email">{t('notificationPage.emailNotification')}</Label>
              <Switch
                id="email"
                checked={settings.emailNotifications}
                onCheckedChange={(checked: boolean) =>
                  onSettingsChange(s => ({ ...s, emailNotifications: checked }))
                }
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="inapp">{t('notificationPage.inAppNotification')}</Label>
              <Switch
                id="inapp"
                checked={settings.inAppNotifications}
                onCheckedChange={(checked: boolean) =>
                  onSettingsChange(s => ({ ...s, inAppNotifications: checked }))
                }
              />
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="font-medium">{t('notificationPage.notificationType')}</h4>
            <div className="flex items-center justify-between">
              <Label htmlFor="training">{t('notificationPage.scheduleNotification')}</Label>
              <Switch
                id="training"
                checked={settings.trainingReminder}
                onCheckedChange={(checked: boolean) =>
                  onSettingsChange(s => ({ ...s, trainingReminder: checked }))
                }
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="expiry">{t('notificationPage.expiringNotification')}</Label>
              <Switch
                id="expiry"
                checked={settings.expiryWarning}
                onCheckedChange={(checked: boolean) =>
                  onSettingsChange(s => ({ ...s, expiryWarning: checked }))
                }
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="retraining">{t('notificationPage.retrainingNotification')}</Label>
              <Switch
                id="retraining"
                checked={settings.retrainingRequired}
                onCheckedChange={(checked: boolean) =>
                  onSettingsChange(s => ({ ...s, retrainingRequired: checked }))
                }
              />
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="font-medium">{t('notificationPage.reminderTiming')}</h4>
            <p className="text-sm text-muted-foreground">
              {t('notificationPage.reminderTimingDesc')}
            </p>
            <div className="flex flex-wrap gap-2">
              {[1, 3, 7, 14, 30].map((days) => (
                <Badge
                  key={days}
                  variant={settings.reminderDays.includes(days) ? 'default' : 'outline'}
                  className="cursor-pointer"
                  onClick={() => {
                    onSettingsChange(s => ({
                      ...s,
                      reminderDays: s.reminderDays.includes(days)
                        ? s.reminderDays.filter(d => d !== days)
                        : [...s.reminderDays, days].sort((a, b) => b - a),
                    }));
                  }}
                >
                  {t('notificationPage.daysBefore', { days })}
                </Badge>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t('common.cancel')}
          </Button>
          <Button onClick={onSave}>
            {t('common.save')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
