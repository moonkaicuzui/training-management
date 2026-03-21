import type { TrainingEffectiveness } from '@/types/trainerDirective';

export default function EffectivenessCard({
  effectiveness,
}: {
  effectiveness: TrainingEffectiveness;
}) {
  return (
    <div className="bg-white border rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-semibold text-gray-700">
          {effectiveness.year_month}
        </h4>
        <span className="text-xs text-gray-400">
          {effectiveness.generated_at
            ? new Date(effectiveness.generated_at).toLocaleDateString()
            : ''}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="text-center">
          <p className="text-2xl font-bold text-blue-600">
            {effectiveness.total_trained_employees}
          </p>
          <p className="text-xs text-gray-500 mt-1">Trained</p>
        </div>
        <div className="text-center">
          <p
            className={`text-2xl font-bold ${
              effectiveness.average_improvement_rate > 0
                ? 'text-green-600'
                : 'text-gray-600'
            }`}
          >
            {effectiveness.average_improvement_rate > 0 ? '+' : ''}
            {effectiveness.average_improvement_rate}%
          </p>
          <p className="text-xs text-gray-500 mt-1">Avg Improvement</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-emerald-600">
            {effectiveness.total_trained_employees > 0
              ? Math.round(
                  (effectiveness.improved_count /
                    effectiveness.total_trained_employees) *
                    100
                )
              : 0}
            %
          </p>
          <p className="text-xs text-gray-500 mt-1">Success Rate</p>
        </div>
      </div>

      {effectiveness.employee_metrics.length > 0 && (
        <div className="mt-3 pt-3 border-t">
          <p className="text-xs text-gray-500 mb-2">Top Improvers</p>
          {effectiveness.employee_metrics
            .filter((m) => m.improvement_rate > 0)
            .sort((a, b) => b.improvement_rate - a.improvement_rate)
            .slice(0, 3)
            .map((m) => (
              <div
                key={m.employee_id}
                className="flex items-center justify-between text-xs py-1"
              >
                <span className="text-gray-700">{m.employee_name}</span>
                <span className="text-green-600 font-medium">
                  {m.pre_training_rate}% &rarr; {m.post_training_rate}% (
                  {m.improvement_rate > 0 ? '+' : ''}
                  {m.improvement_rate}%)
                </span>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}
