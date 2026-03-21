import { useTranslation } from 'react-i18next';
import { TrendingUp, TrendingDown } from 'lucide-react';
import EffectivenessCard from './EffectivenessCard';
import type { TrainingEffectiveness } from '@/types/trainerDirective';

interface EffectivenessTabProps {
  effectiveness: TrainingEffectiveness[];
}

export default function EffectivenessTab({ effectiveness }: EffectivenessTabProps) {
  const { t } = useTranslation();

  return (
    <div>
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-green-500" />
          {t(
            'trainerDirectives.effectivenessTitle',
            'Training Effectiveness Tracking'
          )}
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          {t(
            'trainerDirectives.effectivenessDesc',
            'Pre/post training reject rate comparison showing training impact.'
          )}
        </p>
      </div>

      {effectiveness.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {effectiveness.map((e) => (
            <EffectivenessCard key={e.effectiveness_id} effectiveness={e} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-white border rounded-lg">
          <TrendingDown className="h-10 w-10 text-gray-300 mx-auto mb-2" />
          <p className="text-gray-500 font-medium">
            {t(
              'trainerDirectives.noEffectivenessData',
              'No effectiveness data available yet.'
            )}
          </p>
          <p className="text-gray-400 text-sm mt-1">
            {t(
              'trainerDirectives.effectivenessHint',
              'Effectiveness is tracked weekly every Friday.'
            )}
          </p>
        </div>
      )}
    </div>
  );
}
