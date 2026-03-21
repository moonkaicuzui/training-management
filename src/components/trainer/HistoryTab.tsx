import { useTranslation } from 'react-i18next';
import {
  AlertTriangle,
  Shield,
  Activity,
  Calendar,
  Sparkles,
} from 'lucide-react';
import StatusBadge from './StatusBadge';
import ActionCard from './ActionCard';
import type { TrainerDirective } from '@/types/trainerDirective';

interface HistoryTabProps {
  recentDirectives: TrainerDirective[];
  selectedDate: string | null;
  selectedDirective: TrainerDirective | null;
  onHistoryClick: (directive: TrainerDirective) => void;
}

export default function HistoryTab({
  recentDirectives,
  selectedDate,
  selectedDirective,
  onHistoryClick,
}: HistoryTabProps) {
  const { t } = useTranslation();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Directive List */}
      <div className="lg:col-span-1 bg-white border rounded-lg overflow-hidden">
        <div className="px-4 py-3 border-b bg-gray-50">
          <h3 className="text-sm font-semibold text-gray-700">
            {t('trainerDirectives.recentDirectives', 'Recent Directives')}
          </h3>
        </div>
        <div className="divide-y max-h-[600px] overflow-y-auto">
          {recentDirectives.length === 0 ? (
            <div className="p-6 text-center text-gray-400 text-sm">
              {t('common.noData', 'No data')}
            </div>
          ) : (
            recentDirectives.map((d) => (
              <button
                key={d.directive_id}
                onClick={() => onHistoryClick(d)}
                className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors ${
                  selectedDate === d.date ? 'bg-blue-50 border-l-2 border-l-blue-500' : ''
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-900">
                    {d.date}
                  </span>
                  <StatusBadge status={d.status} />
                </div>
                <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-500">
                  {d.immediate_actions.length > 0 && (
                    <span className="flex items-center gap-1 text-red-600">
                      <AlertTriangle className="h-3 w-3" />
                      {d.immediate_actions.length}
                    </span>
                  )}
                  {d.preventive_actions.length > 0 && (
                    <span className="flex items-center gap-1 text-amber-600">
                      <Shield className="h-3 w-3" />
                      {d.preventive_actions.length}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <Activity className="h-3 w-3" />
                    {d.ongoing_sessions.planned} planned
                  </span>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Selected Directive Detail */}
      <div className="lg:col-span-2">
        {selectedDirective ? (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <Calendar className="h-5 w-5 text-gray-400" />
                {selectedDirective.date}
              </h2>
              <StatusBadge status={selectedDirective.status} />
            </div>

            {/* Summary */}
            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-center">
                <p className="text-2xl font-bold text-red-600">
                  {selectedDirective.immediate_actions.length}
                </p>
                <p className="text-xs text-red-500 mt-1">Immediate</p>
              </div>
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-center">
                <p className="text-2xl font-bold text-amber-600">
                  {selectedDirective.preventive_actions.length}
                </p>
                <p className="text-xs text-amber-500 mt-1">Preventive</p>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-center">
                <p className="text-2xl font-bold text-blue-600">
                  {selectedDirective.ongoing_sessions.planned}
                </p>
                <p className="text-xs text-blue-500 mt-1">Sessions</p>
              </div>
            </div>

            {/* Actions */}
            {selectedDirective.immediate_actions.map((action, i) => (
              <ActionCard
                key={`imm-${action.employee_id}-${i}`}
                action={action}
                index={i}
                priority="immediate"
              />
            ))}
            {selectedDirective.preventive_actions.map((action, i) => (
              <ActionCard
                key={`prev-${action.employee_id}-${i}`}
                action={action}
                index={i}
                priority="preventive"
              />
            ))}

            {/* AI Recommendations */}
            {selectedDirective.ai_recommendations.length > 0 && (
              <div className="mt-4 bg-purple-50 border border-purple-200 rounded-lg p-4">
                <h4 className="text-xs font-semibold text-purple-700 uppercase mb-2 flex items-center gap-1">
                  <Sparkles className="h-3 w-3" />
                  AI Recommendations
                </h4>
                <ul className="space-y-1">
                  {selectedDirective.ai_recommendations.map((rec, i) => (
                    <li
                      key={i}
                      className="text-xs text-purple-800 flex items-start gap-1"
                    >
                      <span className="text-purple-400">&#x2022;</span>
                      {rec}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-12 bg-white border rounded-lg">
            <Calendar className="h-10 w-10 text-gray-300 mx-auto mb-2" />
            <p className="text-gray-400 text-sm">
              {t(
                'trainerDirectives.selectDirective',
                'Select a directive from the list to view details'
              )}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
