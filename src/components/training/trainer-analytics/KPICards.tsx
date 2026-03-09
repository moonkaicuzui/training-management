import { useTranslation } from 'react-i18next';
import {
  GraduationCap,
  Users,
  TrendingUp,
  BookOpen,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import type { KPIData } from './types';

interface KPICardsProps {
  kpis: KPIData;
}

export default function KPICards({ kpis }: KPICardsProps) {
  const { t } = useTranslation();

  return (
    <div className="grid gap-4 md:grid-cols-4">
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <GraduationCap className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{kpis.totalSessions}</p>
              <p className="text-xs text-muted-foreground">
                {t('trainers.totalSessionsTaught')}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Users className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{kpis.totalTrainees}</p>
              <p className="text-xs text-muted-foreground">
                {t('trainers.totalTraineesTaught')}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <TrendingUp className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{kpis.avgPassRate}%</p>
              <p className="text-xs text-muted-foreground">
                {t('trainers.avgPassRate')}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <BookOpen className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{kpis.uniquePrograms}</p>
              <p className="text-xs text-muted-foreground">
                {t('trainers.programsTaught')}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
