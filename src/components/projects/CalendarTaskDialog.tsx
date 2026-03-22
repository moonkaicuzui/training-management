/**
 * Calendar Event Dialog - Create/Edit event dialog
 * Apple Calendar 스타일 일정 추가/수정 다이얼로그
 */

import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Plus,
  MapPin,
  Repeat,
  Bell,
  Link2,
  FileText,
  Clock,
  Trash2,
} from 'lucide-react';
import { CATEGORY_COLORS } from '@/types/project';
import type { RecurrenceType } from '@/types/project';
import type { EventFormData, CalendarCategory } from './calendarTypes';
import { REMINDER_PRESETS } from './calendarTypes';

interface CalendarTaskDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  formData: EventFormData;
  onFormDataChange: (data: EventFormData) => void;
  selectedEvent: { id: string } | null;
  isLoading: boolean;
  eventCategories: CalendarCategory[];
  selectedCategory: CalendarCategory | undefined;
  onSubmit: () => void;
  onDelete: () => void;
  // Inline category creation
  isCategoryPopoverOpen: boolean;
  onCategoryPopoverChange: (open: boolean) => void;
  isNewCategoryMode: boolean;
  onNewCategoryModeChange: (mode: boolean) => void;
  newCategoryName: string;
  onNewCategoryNameChange: (name: string) => void;
  newCategoryColor: string;
  onNewCategoryColorChange: (color: string) => void;
  onCreateCategory: () => void;
}

export const CalendarTaskDialog = memo(function CalendarTaskDialog({
  isOpen,
  onOpenChange,
  formData,
  onFormDataChange,
  selectedEvent,
  isLoading,
  eventCategories,
  selectedCategory,
  onSubmit,
  onDelete,
  isCategoryPopoverOpen,
  onCategoryPopoverChange,
  isNewCategoryMode,
  onNewCategoryModeChange,
  newCategoryName,
  onNewCategoryNameChange,
  newCategoryColor,
  onNewCategoryColorChange,
  onCreateCategory,
}: CalendarTaskDialogProps) {
  const { t } = useTranslation();

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl p-0 gap-0 overflow-hidden">
        {/* Color Strip — 선택된 카테고리 색상 */}
        <div
          className="h-2 w-full transition-colors duration-200"
          style={{
            backgroundColor: selectedCategory?.color || '#3B82F6',
          }}
        />

        <DialogHeader className="px-6 pt-5 pb-0">
          <DialogTitle className="text-xl">
            {selectedEvent ? t('projects.calendar.editEvent') : t('projects.calendar.newEvent')}
          </DialogTitle>
          <DialogDescription className="sr-only">
            {selectedEvent ? t('projects.calendar.editEventDesc') : t('projects.calendar.newEventDesc')}
          </DialogDescription>
        </DialogHeader>

        <div className="px-6 py-4 space-y-4 max-h-[70vh] overflow-y-auto">
          {/* 일정명 */}
          <Input
            value={formData.title}
            onChange={(e) => onFormDataChange({ ...formData, title: e.target.value })}
            placeholder={t('projects.calendar.eventTitle')}
            className="text-lg font-medium border-0 border-b rounded-none px-0 focus-visible:ring-0 focus-visible:border-primary h-12"
          />

          {/* 카테고리 선택 (Popover 기반 — 인라인 생성 지원) */}
          <div className="flex items-center gap-3">
            <div
              className="w-4 h-4 rounded-full shrink-0"
              style={{
                backgroundColor: selectedCategory?.color || '#3B82F6',
                boxShadow: `0 0 0 2px white, 0 0 0 4px ${selectedCategory?.color || '#3B82F6'}`,
              }}
            />
            <Popover open={isCategoryPopoverOpen} onOpenChange={(open) => {
              onCategoryPopoverChange(open);
              if (!open) onNewCategoryModeChange(false);
            }}>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className="flex items-center gap-2 h-8 text-sm hover:bg-accent rounded px-2 -ml-2 transition-colors"
                >
                  {selectedCategory ? (
                    <>
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: selectedCategory.color }} />
                      {selectedCategory.name}
                    </>
                  ) : (
                    <span className="text-muted-foreground">{t('projects.tasks.category')}</span>
                  )}
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-64 p-0" align="start">
                {!isNewCategoryMode ? (
                  <div className="py-1">
                    {eventCategories.map((category) => (
                      <button
                        key={category.id}
                        type="button"
                        className={`w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-accent transition-colors ${
                          formData.categoryId === category.id ? 'bg-accent' : ''
                        }`}
                        onClick={() => {
                          onFormDataChange({ ...formData, categoryId: category.id });
                          onCategoryPopoverChange(false);
                        }}
                      >
                        <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: category.color }} />
                        {category.name}
                      </button>
                    ))}
                    <div className="border-t my-1" />
                    <button
                      type="button"
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-accent text-primary transition-colors"
                      onClick={() => {
                        onNewCategoryModeChange(true);
                        onNewCategoryNameChange('');
                        onNewCategoryColorChange(CATEGORY_COLORS[10]);
                      }}
                    >
                      <Plus className="h-3.5 w-3.5" />
                      {t('projects.calendar.newCategory')}
                    </button>
                  </div>
                ) : (
                  <div className="p-3 space-y-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs">{t('projects.calendar.categoryName')}</Label>
                      <Input
                        value={newCategoryName}
                        onChange={(e) => onNewCategoryNameChange(e.target.value)}
                        placeholder={t('projects.calendar.categoryName')}
                        className="h-8 text-sm"
                        autoFocus
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">{t('projects.calendar.selectColor')}</Label>
                      <div className="flex flex-wrap gap-1.5">
                        {CATEGORY_COLORS.map((color) => (
                          <button
                            key={color}
                            type="button"
                            className={`w-6 h-6 rounded-full border-2 transition-all ${
                              newCategoryColor === color ? 'border-foreground scale-110' : 'border-transparent'
                            }`}
                            style={{ backgroundColor: color }}
                            onClick={() => onNewCategoryColorChange(color)}
                          />
                        ))}
                      </div>
                    </div>
                    <div className="flex gap-2 justify-end">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => onNewCategoryModeChange(false)}
                      >
                        {t('projects.calendar.cancel')}
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        disabled={!newCategoryName.trim()}
                        onClick={onCreateCategory}
                      >
                        {t('projects.calendar.addCategory')}
                      </Button>
                    </div>
                  </div>
                )}
              </PopoverContent>
            </Popover>
          </div>

          <div className="border-t" />

          {/* 종일 토글 */}
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              {t('projects.calendar.allDay')}
            </Label>
            <Switch
              checked={formData.allDay}
              onCheckedChange={(checked) => onFormDataChange({ ...formData, allDay: checked })}
            />
          </div>

          {/* 날짜/시간 */}
          <div className="rounded-lg border bg-muted/30 p-3 space-y-3">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground uppercase tracking-wider">
                {t('projects.calendar.startDate')}
              </Label>
              <Input
                type={formData.allDay ? 'date' : 'datetime-local'}
                value={formData.allDay
                  ? format(formData.startDate, 'yyyy-MM-dd')
                  : format(formData.startDate, "yyyy-MM-dd'T'HH:mm")
                }
                onChange={(e) =>
                  onFormDataChange({ ...formData, startDate: new Date(e.target.value) })
                }
                className="border-0 bg-transparent shadow-none px-0 h-9 text-base focus-visible:ring-0"
              />
            </div>
            <div className="border-t" />
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground uppercase tracking-wider">
                {t('projects.calendar.endDate')}
              </Label>
              <Input
                type={formData.allDay ? 'date' : 'datetime-local'}
                value={formData.allDay
                  ? format(formData.endDate, 'yyyy-MM-dd')
                  : format(formData.endDate, "yyyy-MM-dd'T'HH:mm")
                }
                onChange={(e) =>
                  onFormDataChange({ ...formData, endDate: new Date(e.target.value) })
                }
                className="border-0 bg-transparent shadow-none px-0 h-9 text-base focus-visible:ring-0"
              />
            </div>
          </div>

          {/* 반복 일정 */}
          <div className="flex items-center gap-3">
            <Repeat className="h-4 w-4 text-muted-foreground shrink-0" />
            <Select
              value={formData.recurrenceType}
              onValueChange={(value) =>
                onFormDataChange({ ...formData, recurrenceType: value as RecurrenceType | 'none' })
              }
            >
              <SelectTrigger className="border-0 shadow-none px-0 h-8 focus:ring-0">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">{t('projects.calendar.noRepeat')}</SelectItem>
                <SelectItem value="daily">{t('projects.calendar.daily')}</SelectItem>
                <SelectItem value="weekly">{t('projects.calendar.weekly')}</SelectItem>
                <SelectItem value="monthly">{t('projects.calendar.monthly')}</SelectItem>
                <SelectItem value="yearly">{t('projects.calendar.yearly')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* 반복 상세 설정 */}
          {formData.recurrenceType !== 'none' && (
            <div className="ml-7 space-y-3 rounded-lg border bg-muted/30 p-3">
              <div className="flex items-center gap-2">
                <Label className="text-sm shrink-0">{t('projects.calendar.every')}</Label>
                <Input
                  type="number"
                  min={1}
                  max={99}
                  value={formData.recurrenceInterval}
                  onChange={(e) =>
                    onFormDataChange({ ...formData, recurrenceInterval: Math.max(1, parseInt(e.target.value) || 1) })
                  }
                  className="w-16 h-8 text-center"
                />
                <span className="text-sm text-muted-foreground">
                  {formData.recurrenceType === 'daily' && t('projects.calendar.days')}
                  {formData.recurrenceType === 'weekly' && t('projects.calendar.weeks')}
                  {formData.recurrenceType === 'monthly' && t('projects.calendar.months')}
                  {formData.recurrenceType === 'yearly' && t('projects.calendar.years')}
                </span>
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground uppercase tracking-wider">
                  {t('projects.calendar.repeatEnd')}
                </Label>
                <Select
                  value={formData.recurrenceEndType}
                  onValueChange={(value) =>
                    onFormDataChange({ ...formData, recurrenceEndType: value as 'never' | 'onDate' | 'afterCount' })
                  }
                >
                  <SelectTrigger className="h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="never">{t('projects.calendar.never')}</SelectItem>
                    <SelectItem value="onDate">{t('projects.calendar.onDate')}</SelectItem>
                    <SelectItem value="afterCount">{t('projects.calendar.afterCount')}</SelectItem>
                  </SelectContent>
                </Select>
                {formData.recurrenceEndType === 'onDate' && (
                  <Input
                    type="date"
                    value={format(formData.recurrenceEndDate, 'yyyy-MM-dd')}
                    onChange={(e) =>
                      onFormDataChange({ ...formData, recurrenceEndDate: new Date(e.target.value) })
                    }
                    className="h-8"
                  />
                )}
                {formData.recurrenceEndType === 'afterCount' && (
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      min={1}
                      max={999}
                      value={formData.recurrenceEndCount}
                      onChange={(e) =>
                        onFormDataChange({ ...formData, recurrenceEndCount: Math.max(1, parseInt(e.target.value) || 1) })
                      }
                      className="w-20 h-8 text-center"
                    />
                    <span className="text-sm text-muted-foreground">{t('projects.calendar.times')}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="border-t" />

          {/* 알림 */}
          <div className="flex items-center gap-3">
            <Bell className="h-4 w-4 text-muted-foreground shrink-0" />
            <Select
              value={formData.reminderMinutes === null ? 'none' : String(formData.reminderMinutes)}
              onValueChange={(value) =>
                onFormDataChange({ ...formData, reminderMinutes: value === 'none' ? null : parseInt(value) })
              }
            >
              <SelectTrigger className="border-0 shadow-none px-0 h-8 focus:ring-0">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">{t('projects.calendar.noReminder')}</SelectItem>
                {REMINDER_PRESETS.map((preset) => (
                  <SelectItem key={preset.value} value={preset.value}>
                    {preset.n !== undefined
                      ? t(preset.labelKey, { n: preset.n })
                      : t(preset.labelKey)
                    }
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 장소 */}
          <div className="flex items-center gap-3">
            <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
            <Input
              value={formData.location}
              onChange={(e) => onFormDataChange({ ...formData, location: e.target.value })}
              placeholder={t('projects.calendar.location')}
              className="border-0 shadow-none px-0 h-8 focus-visible:ring-0"
            />
          </div>

          {/* URL */}
          <div className="flex items-center gap-3">
            <Link2 className="h-4 w-4 text-muted-foreground shrink-0" />
            <Input
              value={formData.url}
              onChange={(e) => onFormDataChange({ ...formData, url: e.target.value })}
              placeholder={t('projects.calendar.url')}
              className="border-0 shadow-none px-0 h-8 focus-visible:ring-0"
            />
          </div>

          <div className="border-t" />

          {/* 메모 */}
          <div className="flex gap-3">
            <FileText className="h-4 w-4 text-muted-foreground shrink-0 mt-2" />
            <Textarea
              value={formData.description}
              onChange={(e) => onFormDataChange({ ...formData, description: e.target.value })}
              placeholder={t('projects.calendar.notes')}
              rows={3}
              className="border-0 shadow-none px-0 resize-none focus-visible:ring-0"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="border-t px-6 py-4 flex items-center justify-between bg-muted/30">
          {selectedEvent ? (
            <Button
              variant="ghost"
              size="sm"
              className="text-destructive hover:text-destructive hover:bg-destructive/10"
              onClick={onDelete}
            >
              <Trash2 className="h-4 w-4 mr-1" />
              {t('common.delete')}
            </Button>
          ) : (
            <div />
          )}
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              {t('common.cancel')}
            </Button>
            <Button
              onClick={onSubmit}
              disabled={!formData.title || isLoading}
              style={{ backgroundColor: selectedCategory?.color || undefined }}
            >
              {isLoading ? t('common.saving') : selectedEvent ? t('common.edit') : t('common.add')}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
});
