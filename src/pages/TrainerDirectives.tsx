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
  BarChart3,
  Calendar,
  Loader2,
  ClipboardCheck,
  RefreshCw,
} from 'lucide-react';
import {
  getTodayDirective,
  getRecentDirectives,
  markDirectiveAsRead,
  acknowledgeDirective,
  getEffectivenessReports,
} from '@/services/api';
import { logger } from '@/utils/logger';
import { useToast } from '@/hooks/use-toast';
import type {
  TrainerDirective,
  TrainingEffectiveness,
} from '@/types/trainerDirective';
import TodayTab from '@/components/trainer/TodayTab';
import HistoryTab from '@/components/trainer/HistoryTab';
import EffectivenessTab from '@/components/trainer/EffectivenessTab';

export default function TrainerDirectives() {
  const { t } = useTranslation();
  const { toast } = useToast();

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
      logger.error('Failed to load directives:', error);
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
      logger.error('Failed to acknowledge directive:', error);
      toast({
        title: t('trainerDirectives.acknowledgeFailed', 'Failed to acknowledge directive'),
        variant: 'destructive',
      });
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
        <TodayTab
          displayDirective={displayDirective}
          acknowledging={acknowledging}
          onAcknowledge={handleAcknowledge}
          isToday={activeTab === 'today'}
        />
      )}

      {/* HISTORY TAB */}
      {activeTab === 'history' && (
        <HistoryTab
          recentDirectives={recentDirectives}
          selectedDate={selectedDate}
          selectedDirective={selectedDirective}
          onHistoryClick={handleHistoryClick}
        />
      )}

      {/* EFFECTIVENESS TAB */}
      {activeTab === 'effectiveness' && (
        <EffectivenessTab effectiveness={effectiveness} />
      )}
    </div>
  );
}
