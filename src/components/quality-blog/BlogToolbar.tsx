/**
 * BlogToolbar — 카테고리 탭 + 검색 + 정렬
 */

import { useTranslation } from 'react-i18next';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, ArrowUpDown } from 'lucide-react';
import type { BlogCategory } from '@/types/qualityBlog';
import type { QualityBlogPost } from '@/types/qualityBlog';

// 카테고리 탭 값 (라벨은 i18n에서)
export const CATEGORY_TAB_VALUES: (BlogCategory | 'all')[] = [
  'all', 'qa_activity', 'benchmarking', 'sop', 'quality', 'safety', 'improvement', 'report', 'general',
];

// 정렬 옵션
export type SortOption = 'newest' | 'oldest' | 'mostViewed' | 'mostImages';

interface BlogToolbarProps {
  activeTab: BlogCategory | 'all';
  onTabChange: (tab: BlogCategory | 'all') => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  sortBy: SortOption;
  onSortChange: (sort: SortOption) => void;
  posts: QualityBlogPost[];
}

export function BlogToolbar({
  activeTab,
  onTabChange,
  searchQuery,
  onSearchChange,
  sortBy,
  onSortChange,
  posts,
}: BlogToolbarProps) {
  const { t } = useTranslation();

  return (
    <div className="space-y-3">
      {/* 카테고리 탭 - 가로 스크롤 */}
      <div className="overflow-x-auto scrollbar-hide">
        <div className="flex gap-1 bg-muted rounded-lg p-0.5 w-max min-w-full">
          {CATEGORY_TAB_VALUES.map((tab) => {
            const count = tab === 'all'
              ? posts.length
              : posts.filter((p) => p.category === tab).length;
            return (
              <button
                key={tab}
                onClick={() => onTabChange(tab)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all whitespace-nowrap shrink-0 ${
                  activeTab === tab
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {t(`blog.categories.${tab}`)}
                {tab !== 'all' && count > 0 && (
                  <span className="text-[10px] ml-0.5 opacity-60">
                    ({count})
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 검색 + 정렬 */}
      <div className="flex gap-2 items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t('blog.search')}
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9 h-9"
          />
        </div>
        <Select value={sortBy} onValueChange={(v) => onSortChange(v as SortOption)}>
          <SelectTrigger className="w-[140px] h-9">
            <ArrowUpDown className="h-3.5 w-3.5 mr-1 shrink-0" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">{t('blog.sort.newest')}</SelectItem>
            <SelectItem value="oldest">{t('blog.sort.oldest')}</SelectItem>
            <SelectItem value="mostViewed">{t('blog.sort.mostViewed')}</SelectItem>
            <SelectItem value="mostImages">{t('blog.sort.mostImages')}</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
