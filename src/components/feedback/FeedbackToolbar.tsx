/**
 * FeedbackToolbar — 상태 필터 탭 + 검색
 */

import { useTranslation } from 'react-i18next';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import type { FeedbackStatus } from '@/types/systemFeedback';
import { FEEDBACK_STATUSES } from '@/types/systemFeedback';

// 상태 필터 탭 (ALL 포함)
export const STATUS_TABS: (FeedbackStatus | 'ALL')[] = ['ALL', ...FEEDBACK_STATUSES];

interface FeedbackToolbarProps {
  statusFilter: FeedbackStatus | 'ALL';
  onStatusFilterChange: (status: FeedbackStatus | 'ALL') => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  statusCounts: Record<string, number>;
}

export function FeedbackToolbar({
  statusFilter,
  onStatusFilterChange,
  searchQuery,
  onSearchChange,
  statusCounts,
}: FeedbackToolbarProps) {
  const { t } = useTranslation();

  return (
    <div className="space-y-3">
      {/* 상태 탭 - 가로 스크롤 */}
      <div className="overflow-x-auto scrollbar-hide">
        <div className="flex gap-1 bg-muted rounded-lg p-0.5 w-max min-w-full" role="tablist" aria-label={t('systemFeedback.statusFilter')}>
          {STATUS_TABS.map((tab) => (
            <button
              key={tab}
              role="tab"
              aria-selected={statusFilter === tab}
              onClick={() => onStatusFilterChange(tab)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all whitespace-nowrap shrink-0 ${
                statusFilter === tab
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {t(`systemFeedback.status.${tab}`)}
              {statusCounts[tab] > 0 && (
                <span className="text-[10px] ml-1 opacity-60">
                  ({statusCounts[tab]})
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* 검색 */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" aria-hidden="true" />
        <Input
          placeholder={t('systemFeedback.searchPlaceholder')}
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9 h-9"
          aria-label={t('systemFeedback.searchPlaceholder')}
        />
      </div>
    </div>
  );
}
