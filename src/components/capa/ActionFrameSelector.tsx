/**
 * ActionFrameSelector
 *
 * CAPAForm에서 이슈 등록 시 관리 프레임을 추천/선택하는 UI.
 * matchActionFrames()로 점수 기반 추천, 사용자가 프레임 선택 후 액션 토글 가능.
 */

import { useState, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Layers, ChevronDown, ChevronUp, Plus } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';

import {
  matchActionFrames,
  DEFAULT_ACTION_FRAMES,
  type ActionFrame,
  type ActionFrameAction,
} from '@/data/actionFrames';

interface ActionFrameSelectorProps {
  defectCategory: string;
  severity: 'critical' | 'major' | 'minor';
  discoveryPoint: string;
  onSelect: (frameId: string, actions: ActionFrameAction[]) => void;
  selectedFrameId?: string;
}

const CUSTOM_FRAME_ID = '__custom__';

type LangKey = 'ko' | 'en' | 'vi';

function getLocalizedText(
  obj: { ko: string; en: string; vi: string },
  lang: string
): string {
  const key = (lang?.substring(0, 2) as LangKey) || 'ko';
  return obj[key] || obj.ko;
}

const DEADLINE_LABELS: Record<string, { ko: string; en: string; vi: string }> = {
  immediate: { ko: '즉시', en: 'Immediate', vi: 'Ngay lập tức' },
  same_day: { ko: '당일', en: 'Same day', vi: 'Trong ngày' },
  '2_days': { ko: '2일 내', en: 'Within 2 days', vi: 'Trong 2 ngày' },
  '1_week': { ko: '1주 내', en: 'Within 1 week', vi: 'Trong 1 tuần' },
  '2_weeks': { ko: '2주 내', en: 'Within 2 weeks', vi: 'Trong 2 tuần' },
};

export default function ActionFrameSelector({
  defectCategory,
  severity,
  discoveryPoint,
  onSelect,
  selectedFrameId,
}: ActionFrameSelectorProps) {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;

  // 추천 프레임 목록 (점수순)
  const recommendations = useMemo(
    () =>
      matchActionFrames(
        defectCategory,
        severity,
        discoveryPoint,
        DEFAULT_ACTION_FRAMES
      ),
    [defectCategory, severity, discoveryPoint]
  );

  // 선택된 프레임의 액션 토글 상태
  const [actionStates, setActionStates] = useState<Record<string, boolean>>({});
  const [expandedFrameId, setExpandedFrameId] = useState<string | null>(null);

  const handleFrameSelect = useCallback(
    (frame: ActionFrame) => {
      // 액션 초기 상태 설정: required는 true, 나머지는 true
      const initialStates: Record<string, boolean> = {};
      frame.defaultActions.forEach((action) => {
        initialStates[action.id] = true;
      });
      setActionStates(initialStates);
      setExpandedFrameId(frame.id);

      // 모든 액션을 선택된 상태로 전달
      onSelect(frame.id, frame.defaultActions);
    },
    [onSelect]
  );

  const handleActionToggle = useCallback(
    (frame: ActionFrame, actionId: string, checked: boolean) => {
      const action = frame.defaultActions.find((a) => a.id === actionId);
      if (action?.required) return; // required는 토글 불가

      const newStates = { ...actionStates, [actionId]: checked };
      setActionStates(newStates);

      // 선택된 액션만 전달
      const selectedActions = frame.defaultActions.filter(
        (a) => newStates[a.id] !== false
      );
      onSelect(frame.id, selectedActions);
    },
    [actionStates, onSelect]
  );

  const handleCustomSelect = useCallback(() => {
    setExpandedFrameId(CUSTOM_FRAME_ID);
    setActionStates({});
    onSelect(CUSTOM_FRAME_ID, []);
  }, [onSelect]);

  if (!defectCategory && !severity && !discoveryPoint) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Layers className="h-5 w-5" />
          {t('capa.actionFrame.title')}
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          {t('capa.actionFrame.description')}
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        {recommendations.length === 0 && (
          <p className="text-sm text-muted-foreground py-4 text-center">
            {t('capa.actionFrame.noMatch')}
          </p>
        )}

        {recommendations.map(({ frame, score }) => {
          const isSelected = selectedFrameId === frame.id;
          const isExpanded = expandedFrameId === frame.id;

          return (
            <div
              key={frame.id}
              className={`border rounded-lg transition-colors ${
                isSelected
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-primary/50'
              }`}
            >
              {/* 프레임 헤더 (선택 영역) */}
              <button
                type="button"
                className="w-full flex items-center justify-between p-4 text-left"
                onClick={() => handleFrameSelect(frame)}
                aria-label={getLocalizedText(frame.name, lang)}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                        isSelected
                          ? 'border-primary bg-primary'
                          : 'border-muted-foreground'
                      }`}
                    >
                      {isSelected && (
                        <span className="w-2 h-2 rounded-full bg-white" />
                      )}
                    </span>
                    <span className="font-medium">
                      {getLocalizedText(frame.name, lang)}
                    </span>
                    {score >= 70 && (
                      <Badge variant="default" className="text-xs">
                        {t('capa.actionFrame.recommended')}
                      </Badge>
                    )}
                    <Badge variant="outline" className="text-xs">
                      {t('capa.actionFrame.score', { score })}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground ml-6">
                    {getLocalizedText(frame.description, lang)}
                  </p>
                  <p className="text-xs text-muted-foreground ml-6 mt-1">
                    {t('capa.actionFrame.actionCount', {
                      count: frame.defaultActions.length,
                    })}
                  </p>
                </div>
                {isSelected && (
                  <div className="ml-2">
                    {isExpanded ? (
                      <ChevronUp className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                )}
              </button>

              {/* 액션 목록 (펼침) */}
              {isSelected && isExpanded && (
                <div className="px-4 pb-4 border-t">
                  <p className="text-sm font-medium mt-3 mb-2">
                    {t('capa.actionFrame.actionList')}
                  </p>
                  <div className="space-y-2">
                    {frame.defaultActions
                      .sort((a, b) => a.order - b.order)
                      .map((action) => {
                        const isChecked =
                          actionStates[action.id] !== false;
                        return (
                          <label
                            key={action.id}
                            className="flex items-start gap-3 p-2 rounded hover:bg-accent/50 cursor-pointer"
                          >
                            <Checkbox
                              checked={isChecked}
                              disabled={action.required}
                              onCheckedChange={(checked) =>
                                handleActionToggle(
                                  frame,
                                  action.id,
                                  checked === true
                                )
                              }
                              aria-label={getLocalizedText(
                                action.description,
                                lang
                              )}
                            />
                            <div className="flex-1">
                              <span className="text-sm">
                                {getLocalizedText(action.description, lang)}
                              </span>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge
                                  variant="outline"
                                  className="text-xs"
                                >
                                  {getLocalizedText(
                                    DEADLINE_LABELS[action.defaultDeadline] ||
                                      DEADLINE_LABELS.immediate,
                                    lang
                                  )}
                                </Badge>
                                {action.required && (
                                  <Badge
                                    variant="secondary"
                                    className="text-xs"
                                  >
                                    {t('capa.actionFrame.required')}
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </label>
                        );
                      })}
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {/* 커스텀 옵션 */}
        <div
          className={`border rounded-lg transition-colors ${
            selectedFrameId === CUSTOM_FRAME_ID
              ? 'border-primary bg-primary/5'
              : 'border-dashed border-border hover:border-primary/50'
          }`}
        >
          <Button
            type="button"
            variant="ghost"
            className="w-full flex items-center justify-start gap-2 p-4 h-auto"
            onClick={handleCustomSelect}
          >
            <span
              className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                selectedFrameId === CUSTOM_FRAME_ID
                  ? 'border-primary bg-primary'
                  : 'border-muted-foreground'
              }`}
            >
              {selectedFrameId === CUSTOM_FRAME_ID && (
                <span className="w-2 h-2 rounded-full bg-white" />
              )}
            </span>
            <Plus className="h-4 w-4" />
            <span className="font-medium">
              {t('capa.actionFrame.custom')}
            </span>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
