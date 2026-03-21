import { useTranslation } from 'react-i18next';
import {
  AlertTriangle,
  Shield,
  CheckCircle2,
  Activity,
  Calendar,
  BarChart3,
  Loader2,
  Sparkles,
  ClipboardCheck,
} from 'lucide-react';
import StatusBadge from './StatusBadge';
import ActionCard from './ActionCard';
import type { TrainerDirective } from '@/types/trainerDirective';

interface TodayTabProps {
  displayDirective: TrainerDirective | null;
  acknowledging: boolean;
  onAcknowledge: () => void;
  isToday: boolean;
}

export default function TodayTab({
  displayDirective,
  acknowledging,
  onAcknowledge,
  isToday,
}: TodayTabProps) {
  const { t } = useTranslation();

  if (!displayDirective) {
    return (
      <div className="text-center py-12 bg-white border rounded-lg">
        <ClipboardCheck className="h-12 w-12 text-gray-300 mx-auto mb-3" />
        <p className="text-gray-500 text-lg font-medium">
          {t(
            'trainerDirectives.noDirectiveToday',
            "No directive generated for today yet."
          )}
        </p>
        <p className="text-gray-400 text-sm mt-1">
          {t(
            'trainerDirectives.noDirectiveHint',
            'Directives are generated daily at 07:30 (Vietnam time).'
          )}
        </p>
      </div>
    );
  }

  return (
    <>
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white border rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            <h3 className="text-sm font-medium text-gray-500">
              {t('trainerDirectives.immediate', 'Immediate')}
            </h3>
          </div>
          <p className="text-3xl font-bold text-red-600">
            {displayDirective.immediate_actions.length}
          </p>
        </div>

        <div className="bg-white border rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Shield className="h-5 w-5 text-amber-500" />
            <h3 className="text-sm font-medium text-gray-500">
              {t('trainerDirectives.preventive', 'Preventive')}
            </h3>
          </div>
          <p className="text-3xl font-bold text-amber-600">
            {displayDirective.preventive_actions.length}
          </p>
        </div>

        <div className="bg-white border rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Activity className="h-5 w-5 text-blue-500" />
            <h3 className="text-sm font-medium text-gray-500">
              {t('trainerDirectives.sessions', 'Sessions')}
            </h3>
          </div>
          <p className="text-3xl font-bold text-blue-600">
            {displayDirective.ongoing_sessions.planned}
            {displayDirective.ongoing_sessions.overdue > 0 && (
              <span className="text-sm text-red-500 ml-1">
                ({displayDirective.ongoing_sessions.overdue} overdue)
              </span>
            )}
          </p>
        </div>

        <div className="bg-white border rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 className="h-5 w-5 text-green-500" />
            <h3 className="text-sm font-medium text-gray-500">
              {t('trainerDirectives.status', 'Status')}
            </h3>
          </div>
          <StatusBadge status={displayDirective.status} />
        </div>
      </div>

      {/* Date header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
          <Calendar className="h-5 w-5 text-gray-400" />
          {displayDirective.date}
        </h2>
        {displayDirective.status !== 'acknowledged' && isToday && (
          <button
            onClick={onAcknowledge}
            disabled={acknowledging}
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {acknowledging ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <CheckCircle2 className="h-4 w-4" />
            )}
            {t('trainerDirectives.acknowledge', 'Acknowledge')}
          </button>
        )}
      </div>

      {/* Immediate Actions */}
      {displayDirective.immediate_actions.length > 0 && (
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-red-600 uppercase tracking-wider mb-3 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            {t(
              'trainerDirectives.immediateActions',
              'Immediate Actions (URGENT)'
            )}
          </h3>
          {displayDirective.immediate_actions.map((action, i) => (
            <ActionCard
              key={`${action.employee_id}-${i}`}
              action={action}
              index={i}
              priority="immediate"
            />
          ))}
        </div>
      )}

      {/* Preventive Actions */}
      {displayDirective.preventive_actions.length > 0 && (
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-amber-600 uppercase tracking-wider mb-3 flex items-center gap-2">
            <Shield className="h-4 w-4" />
            {t(
              'trainerDirectives.preventiveActions',
              'Preventive Actions'
            )}
          </h3>
          {displayDirective.preventive_actions.map((action, i) => (
            <ActionCard
              key={`${action.employee_id}-${i}`}
              action={action}
              index={i}
              priority="preventive"
            />
          ))}
        </div>
      )}

      {/* No Actions */}
      {displayDirective.immediate_actions.length === 0 &&
        displayDirective.preventive_actions.length === 0 && (
          <div className="mb-6 p-6 bg-green-50 border border-green-200 rounded-lg text-center">
            <CheckCircle2 className="h-8 w-8 text-green-500 mx-auto mb-2" />
            <p className="text-green-700 font-medium">
              {t(
                'trainerDirectives.noActions',
                'No urgent actions required today.'
              )}
            </p>
          </div>
        )}

      {/* Ongoing Sessions */}
      <div className="mb-6 bg-white border rounded-lg p-5">
        <h3 className="text-sm font-semibold text-blue-600 uppercase tracking-wider mb-4 flex items-center gap-2">
          <BarChart3 className="h-4 w-4" />
          {t(
            'trainerDirectives.ongoingSessions',
            'Ongoing Training Status'
          )}
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-xs text-gray-500">
              {t('trainerDirectives.planned', 'Planned')}
            </p>
            <p className="text-xl font-bold text-gray-900">
              {displayDirective.ongoing_sessions.planned}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500">
              {t('trainerDirectives.overdue', 'Overdue')}
            </p>
            <p
              className={`text-xl font-bold ${
                displayDirective.ongoing_sessions.overdue > 0
                  ? 'text-red-600'
                  : 'text-gray-900'
              }`}
            >
              {displayDirective.ongoing_sessions.overdue}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500">
              {t('trainerDirectives.completedWeek', 'Completed (Week)')}
            </p>
            <p className="text-xl font-bold text-gray-900">
              {displayDirective.ongoing_sessions.completed_this_week}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500">
              {t('trainerDirectives.avgScore', 'Avg Score')}
            </p>
            <p className="text-xl font-bold text-gray-900">
              {displayDirective.ongoing_sessions.avg_score > 0
                ? `${displayDirective.ongoing_sessions.avg_score}/100`
                : '-'}
            </p>
          </div>
        </div>
      </div>

      {/* AI Recommendations */}
      {displayDirective.ai_recommendations.length > 0 && (
        <div className="mb-6 bg-purple-50 border border-purple-200 rounded-lg p-5">
          <h3 className="text-sm font-semibold text-purple-700 uppercase tracking-wider mb-3 flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            {t(
              'trainerDirectives.aiRecommendations',
              'AI Recommendations'
            )}
          </h3>
          <ul className="space-y-2">
            {displayDirective.ai_recommendations.map((rec, i) => (
              <li
                key={i}
                className="flex items-start gap-2 text-sm text-purple-800"
              >
                <span className="text-purple-400 mt-0.5">&#x2022;</span>
                {rec}
              </li>
            ))}
          </ul>
        </div>
      )}
    </>
  );
}
