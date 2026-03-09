import { useTranslation } from 'react-i18next';
import { Card, CardContent } from '@/components/ui/card';

export default function ProgressLegend() {
  const { t } = useTranslation();

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex flex-wrap gap-4 items-center">
          <span className="text-sm font-medium">{t('progress.legend')}:</span>
          <div className="flex items-center gap-1.5">
            <span className="w-6 h-6 rounded flex items-center justify-center bg-status-pass/20 text-status-pass text-sm">✓</span>
            <span className="text-sm">{t('progress.pass')}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-6 h-6 rounded flex items-center justify-center bg-destructive/20 text-destructive text-sm">✗</span>
            <span className="text-sm">{t('progress.fail')}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-6 h-6 rounded flex items-center justify-center bg-status-warning/20 text-status-warning text-sm">⚠</span>
            <span className="text-sm">{t('progress.expiring')}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-6 h-6 rounded flex items-center justify-center bg-status-expired/20 text-status-expired text-sm">⏰</span>
            <span className="text-sm">{t('progress.expired')}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-6 h-6 rounded flex items-center justify-center bg-muted/50 text-muted-foreground text-sm">−</span>
            <span className="text-sm">{t('progress.notTaken')}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
