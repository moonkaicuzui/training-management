/**
 * TrainerDirectives Page
 *
 * Displays daily work directives for trainers with:
 * - Today's directive (immediate + preventive actions)
 * - Historical directive browser
 * - Acknowledge button with read receipt tracking
 * - Training effectiveness charts
 */

import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  AlertTriangle,
  Shield,
  CheckCircle2,
  Clock,
  BarChart3,
  Calendar,
  ChevronDown,
  ChevronUp,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Loader2,
  Sparkles,
  Eye,
  TrendingUp,
  TrendingDown,
  Activity,
  ClipboardCheck,
  RefreshCw,
} from 'lucide-react';
import {
  getTodayDirective,
  getRecentDirectives,
  markDirectiveAsRead,
  acknowledgeDirective,
  getEffectivenessReports,
} from '@/services/trainerDirectiveService';
import type {
  TrainerDirective,
  DirectiveAction,
  TrainingEffectiveness,
} from '@/types/trainerDirective';

// ─── Status Badge Component ───────────────────────────

function StatusBadge({ status }: { status: TrainerDirective['status'] }) {
  const config = {
    generated: {
      label: 'Generated',
      bg: 'bg-gray-100',
      text: 'text-gray-700',
      icon: Clock,
    },
    sent: {
      label: 'Sent',
      bg: 'bg-blue-100',
      text: 'text-blue-700',
      icon: Eye,
    },
    read: {
      label: 'Read',
      bg: 'bg-yellow-100',
      text: 'text-yellow-700',
      icon: Eye,
    },
    acknowledged: {
      label: 'Acknowledged',
      bg: 'bg-green-100',
      text: 'text-green-700',
      icon: CheckCircle2,
    },
  };

  const c = config[status] || config.generated;
  const Icon = c.icon;

  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${c.bg} ${c.text}`}
    >
      <Icon className="h-3 w-3" />
      {c.label}
    </span>
  );
}

// ─── Trend Indicator Component ────────────────────────

function TrendIndicator({ trend }: { trend: DirectiveAction['trend'] }) {
  const { t } = useTranslation();
  if (trend === 'increasing') {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-red-600">
        <ArrowUpRight className="h-3 w-3" />
        {t('trainerDirectives.trendIncreasing', 'Worsening')}
      </span>
    );
  }
  if (trend === 'decreasing') {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-green-600">
        <ArrowDownRight className="h-3 w-3" />
        {t('trainerDirectives.trendDecreasing', 'Improving')}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-xs font-medium text-gray-500">
      <Minus className="h-3 w-3" />
      {t('trainerDirectives.trendStable', 'Stable')}
    </span>
  );
}

// ─── Action Card Component ────────────────────────────

function ActionCard({
  action,
  index,
  priority,
}: {
  action: DirectiveAction;
  index: number;
  priority: 'immediate' | 'preventive';
}) {
  const [expanded, setExpanded] = useState(false);
  const priorityColor =
    priority === 'immediate'
      ? 'border-l-red-500 bg-red-50/50'
      : 'border-l-amber-500 bg-amber-50/50';

  return (
    <div
      className={`border-l-4 rounded-r-lg p-4 mb-3 cursor-pointer transition-all hover:shadow-sm ${priorityColor}`}
      onClick={() => setExpanded(!expanded)}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-semibold text-gray-900">
              {index + 1}. [{action.employee_name}]
            </span>
            <span className="text-xs text-gray-500">
              {action.building}, {action.line}
            </span>
            <TrendIndicator trend={action.trend} />
          </div>
          <p className="text-sm text-gray-600">{action.issue}</p>
        </div>
        <div className="flex items-center gap-3 ml-4">
          <span
            className={`text-lg font-bold ${
              action.reject_rate >= 5 ? 'text-red-600' : 'text-amber-600'
            }`}
          >
            {action.reject_rate}%
          </span>
          {expanded ? (
            <ChevronUp className="h-4 w-4 text-gray-400" />
          ) : (
            <ChevronDown className="h-4 w-4 text-gray-400" />
          )}
        </div>
      </div>

      {expanded && (
        <div className="mt-3 pt-3 border-t border-gray-200 space-y-2">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Instruction:</span>
              <p className="text-gray-800 font-medium mt-0.5">
                {action.instruction}
              </p>
            </div>
            <div>
              <span className="text-gray-500">Program:</span>
              <p className="text-gray-800 font-medium mt-0.5">
                {action.program_code}
              </p>
            </div>
            <div>
              <span className="text-gray-500">Deadline:</span>
              <p className="text-gray-800 font-medium mt-0.5">
                {action.deadline}
              </p>
            </div>
            <div>
              <span className="text-gray-500">Threshold:</span>
              <p className="text-gray-800 font-medium mt-0.5">
                {action.threshold}%
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Effectiveness Summary Component ──────────────────

function EffectivenessCard({
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
                  {m.pre_training_rate}% → {m.post_training_rate}% (
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

// ─── Main Page Component ──────────────────────────────

export default function TrainerDirectives() {
  const { t } = useTranslation();

  const [todayDirective, setTodayDirective] =
    useState<TrainerDirective | null>(null);
  const [recentDirectives, setRecentDirectives] = useState<
    TrainerDirective[]
  >([]);
  const [effectiveness, setEffectiveness] = useState<
    TrainingEffectiveness[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [acknowledging, setAcknowledging] = useState(false);
  const [activeTab, setActiveTab] = useState<'today' | 'history' | 'effectiveness'>('today');
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedDirective, setSelectedDirective] =
    useState<TrainerDirective | null>(null);

  // Fetch data
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [today, recent, effectivenessData] = await Promise.all([
        getTodayDirective(),
        getRecentDirectives(30),
        getEffectivenessReports(6),
      ]);
      setTodayDirective(today);
      setRecentDirectives(recent);
      setEffectiveness(effectivenessData);

      // Auto-mark as read if viewing today's directive
      if (today && (today.status === 'generated' || today.status === 'sent')) {
        await markDirectiveAsRead(today.directive_id);
        setTodayDirective({ ...today, status: 'read' });
      }
    } catch (error) {
      console.error('Failed to load directives:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handle acknowledge
  const handleAcknowledge = async () => {
    if (!todayDirective || todayDirective.status === 'acknowledged') return;

    setAcknowledging(true);
    try {
      await acknowledgeDirective(todayDirective.directive_id);
      setTodayDirective({
        ...todayDirective,
        status: 'acknowledged',
        acknowledged_at: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Failed to acknowledge directive:', error);
    } finally {
      setAcknowledging(false);
    }
  };

  // Handle history item click
  const handleHistoryClick = (directive: TrainerDirective) => {
    setSelectedDate(directive.date);
    setSelectedDirective(directive);
  };

  // Current directive to display
  const displayDirective =
    activeTab === 'history' && selectedDirective
      ? selectedDirective
      : todayDirective;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Page Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {t('trainerDirectives.title', 'Trainer Directives')}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {t(
              'trainerDirectives.subtitle',
              'Daily work directives based on inspection data and training status'
            )}
          </p>
        </div>
        <button
          onClick={loadData}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <RefreshCw className="h-4 w-4" />
          {t('common.retry', 'Refresh')}
        </button>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-lg w-fit">
        {[
          { key: 'today' as const, label: t('trainerDirectives.tabToday', "Today's Directive"), icon: ClipboardCheck },
          { key: 'history' as const, label: t('trainerDirectives.tabHistory', 'History'), icon: Calendar },
          { key: 'effectiveness' as const, label: t('trainerDirectives.tabEffectiveness', 'Effectiveness'), icon: BarChart3 },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-all ${
              activeTab === tab.key
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* TODAY TAB */}
      {activeTab === 'today' && (
        <div>
          {displayDirective ? (
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
                {displayDirective.status !== 'acknowledged' &&
                  activeTab === 'today' && (
                    <button
                      onClick={handleAcknowledge}
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
          ) : (
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
          )}
        </div>
      )}

      {/* HISTORY TAB */}
      {activeTab === 'history' && (
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
                    onClick={() => handleHistoryClick(d)}
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
      )}

      {/* EFFECTIVENESS TAB */}
      {activeTab === 'effectiveness' && (
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
      )}
    </div>
  );
}
