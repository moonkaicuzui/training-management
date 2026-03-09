import { useTranslation } from 'react-i18next';
import { Card, CardContent } from '@/components/ui/card';
import type { ProgressStats } from './types';

interface ProgressStatsCardsProps {
  stats: ProgressStats;
}

export default function ProgressStatsCards({ stats }: ProgressStatsCardsProps) {
  const { t } = useTranslation();
  const { passCount, failCount, expiringCount, expiredCount, notTakenCount } = stats;

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-5">
      <Card>
        <CardContent className="pt-4">
          <div className="text-2xl font-bold text-status-pass">{passCount}</div>
          <p className="text-xs text-muted-foreground">{t('progress.pass')}</p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-4">
          <div className="text-2xl font-bold text-destructive">{failCount}</div>
          <p className="text-xs text-muted-foreground">{t('progress.fail')}</p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-4">
          <div className="text-2xl font-bold text-status-warning">{expiringCount}</div>
          <p className="text-xs text-muted-foreground">{t('progress.expiring')}</p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-4">
          <div className="text-2xl font-bold text-status-expired">{expiredCount}</div>
          <p className="text-xs text-muted-foreground">{t('progress.expired')}</p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-4">
          <div className="text-2xl font-bold text-muted-foreground">{notTakenCount}</div>
          <p className="text-xs text-muted-foreground">{t('progress.notTaken')}</p>
        </CardContent>
      </Card>
    </div>
  );
}
