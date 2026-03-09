import { useTranslation } from 'react-i18next';
import { AlertTriangle, CheckCircle2, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader } from '@/components/ui/card';
import type { SkillGapStatsCardsProps } from './types';

export function SkillGapStatsCards({ stats }: SkillGapStatsCardsProps) {
  const { t } = useTranslation();

  return (
    <div className="grid gap-4 md:grid-cols-4">
      <Card>
        <CardHeader className="pb-2">
          <CardDescription>{t('skillGap.avgGap')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.avgGap}%</div>
        </CardContent>
      </Card>
      <Card className="border-destructive/50">
        <CardHeader className="pb-2">
          <CardDescription className="flex items-center gap-1">
            <AlertTriangle className="h-3.5 w-3.5 text-destructive" />
            {t('skillGap.highPriority')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-destructive">{stats.high}</div>
        </CardContent>
      </Card>
      <Card className="border-yellow-500/50">
        <CardHeader className="pb-2">
          <CardDescription className="flex items-center gap-1">
            <AlertCircle className="h-3.5 w-3.5 text-yellow-600" />
            {t('skillGap.mediumPriority')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-yellow-600">{stats.medium}</div>
        </CardContent>
      </Card>
      <Card className="border-green-500/50">
        <CardHeader className="pb-2">
          <CardDescription className="flex items-center gap-1">
            <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
            {t('skillGap.lowPriority')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">{stats.low}</div>
        </CardContent>
      </Card>
    </div>
  );
}
