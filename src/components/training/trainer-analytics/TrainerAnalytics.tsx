import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { GraduationCap } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import KPICards from './KPICards';
import TrainerSelector from './TrainerSelector';
import MonthlySessionsChart from './MonthlySessionsChart';
import PassRateByProgramChart from './PassRateByProgramChart';
import TrainerComparisonTable from './TrainerComparisonTable';
import {
  useTrainerStatsMap,
  useKPIs,
  useMonthlyChartData,
  useMonthlyBars,
  usePassRateByProgramData,
  useComparisonData,
} from './useTrainerStats';
import type { TrainerAnalyticsProps } from './types';

export default function TrainerAnalytics({
  trainers,
  sessions,
  results,
  isLoading,
}: TrainerAnalyticsProps) {
  const { t } = useTranslation();
  const [selectedTrainerId, setSelectedTrainerId] = useState<string>('all');

  const trainerStatsMap = useTrainerStatsMap(trainers, sessions, results);
  const kpis = useKPIs(trainerStatsMap);
  const monthlyChartData = useMonthlyChartData(selectedTrainerId, trainers, trainerStatsMap);
  const monthlyBars = useMonthlyBars(selectedTrainerId, trainers, trainerStatsMap);
  const passRateByProgramData = usePassRateByProgramData(results, selectedTrainerId, trainers);
  const comparisonData = useComparisonData(trainers, trainerStatsMap);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (trainers.length === 0 || (sessions.length === 0 && results.length === 0)) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground py-8">
            <GraduationCap className="h-10 w-10 mx-auto mb-3 opacity-50" />
            <p>{t('trainers.noAnalyticsData')}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <KPICards kpis={kpis} />

      <TrainerSelector
        trainers={trainers}
        selectedTrainerId={selectedTrainerId}
        onTrainerChange={setSelectedTrainerId}
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <MonthlySessionsChart data={monthlyChartData} bars={monthlyBars} />
        <PassRateByProgramChart data={passRateByProgramData} />
      </div>

      <TrainerComparisonTable data={comparisonData} />
    </div>
  );
}
