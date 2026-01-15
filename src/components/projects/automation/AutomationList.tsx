/**
 * 자동화 규칙 목록 컴포넌트
 */

import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Play,
  Pause,
  ArrowRight,
  Clock,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Copy,
  Edit,
  Trash2,
  Target,
  GitBranch,
  PlayCircle,
} from 'lucide-react';
import { TASK_STATUS_COLORS } from '@/types/project';
import type { Automation, TriggerType, ActionType, TaskStatus } from '@/types/project';
import {
  getTriggerIcon,
  getActionIcon,
  getTriggerLabel,
  getActionLabel,
  STATUS_LABELS,
} from './constants';

interface AutomationListProps {
  automations: Automation[];
  onToggle: (automationId: string) => void;
  onEdit: (automation: Automation) => void;
  onDelete: (automationId: string) => void;
  onDuplicate: (automation: Automation) => void;
  onTest?: (automation: Automation) => void;
  isLoading?: boolean;
}

export default function AutomationList({
  automations,
  onToggle,
  onEdit,
  onDelete,
  onDuplicate,
  onTest,
  isLoading = false,
}: AutomationListProps) {
  const [expandedAutomationId, setExpandedAutomationId] = useState<string | null>(null);

  const handleToggleExpand = useCallback((automationId: string) => {
    setExpandedAutomationId(prev => prev === automationId ? null : automationId);
  }, []);

  // 트리거 조건에서 상태 가져오기
  const getFromStatus = (automation: Automation): TaskStatus | undefined => {
    if (automation.trigger.conditions) {
      const condition = automation.trigger.conditions.find(c => c.field === 'fromStatus');
      return condition?.value as TaskStatus | undefined;
    }
    return undefined;
  };

  const getToStatus = (automation: Automation): TaskStatus | undefined => {
    if (automation.trigger.conditions) {
      const condition = automation.trigger.conditions.find(c => c.field === 'toStatus');
      return condition?.value as TaskStatus | undefined;
    }
    return undefined;
  };

  const getDaysBefore = (automation: Automation): number | undefined => {
    return automation.trigger.schedule?.daysBefore;
  };

  const getProgressThreshold = (automation: Automation): number | undefined => {
    if (automation.trigger.conditions) {
      const condition = automation.trigger.conditions.find(c => c.field === 'progress');
      return condition?.value as number | undefined;
    }
    return undefined;
  };

  if (automations.length === 0) {
    return null;
  }

  return (
    <ScrollArea className="h-[500px] pr-4">
      <div className="space-y-4">
        {automations.map((automation) => {
          const isExpanded = expandedAutomationId === automation.id;
          const fromStatus = getFromStatus(automation);
          const toStatus = getToStatus(automation);
          const daysBefore = getDaysBefore(automation);
          const progressThreshold = getProgressThreshold(automation);

          return (
            <div
              key={automation.id}
              className={`border rounded-lg transition-all ${
                automation.isActive ? 'border-primary/50 bg-primary/5' : 'border-border'
              } ${isLoading ? 'opacity-50 pointer-events-none' : ''}`}
            >
              {/* 자동화 헤더 */}
              <div className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${
                      automation.isActive ? 'bg-primary/10' : 'bg-muted'
                    }`}>
                      {automation.isActive ? (
                        <Play className="h-4 w-4 text-primary" />
                      ) : (
                        <Pause className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                    <div>
                      <h4 className="font-medium">{automation.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        {automation.description}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={automation.isActive}
                      onCheckedChange={() => onToggle(automation.id)}
                      aria-label={automation.isActive ? '자동화 비활성화' : '자동화 활성화'}
                    />
                  </div>
                </div>

                {/* 워크플로우 미리보기 */}
                <div className="mt-4 flex items-center gap-2 flex-wrap">
                  {/* 트리거 */}
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-500/10 text-blue-600 rounded-full text-sm">
                    {getTriggerIcon(automation.trigger.type)}
                    <span>{getTriggerLabel(automation.trigger.type)}</span>
                  </div>

                  <ArrowRight className="h-4 w-4 text-muted-foreground" />

                  {/* 액션들 */}
                  {automation.actions.map((action, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <div className="flex items-center gap-2 px-3 py-1.5 bg-green-500/10 text-green-600 rounded-full text-sm">
                        {getActionIcon(action.type)}
                        <span>{getActionLabel(action.type)}</span>
                      </div>
                      {index < automation.actions.length - 1 && (
                        <ArrowRight className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                  ))}
                </div>

                {/* 실행 통계 및 액션 버튼 */}
                <div className="mt-4 flex items-center justify-between">
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <CheckCircle2 className="h-4 w-4" />
                      {automation.runCount || 0}회 실행
                    </span>
                    {automation.lastRunAt && (
                      <span className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        최근: {new Date(automation.lastRunAt instanceof Date ? automation.lastRunAt : automation.lastRunAt.toDate()).toLocaleDateString('ko-KR')}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleToggleExpand(automation.id)}
                      title={isExpanded ? '접기' : '펼치기'}
                      aria-label={isExpanded ? '상세 정보 접기' : '상세 정보 펼치기'}
                    >
                      {isExpanded ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </Button>
                    {onTest && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onTest(automation)}
                        title="테스트 실행"
                        aria-label="자동화 테스트 실행"
                        disabled={!automation.isActive}
                      >
                        <PlayCircle className="h-4 w-4 text-blue-500" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDuplicate(automation)}
                      title="복제"
                      aria-label="자동화 규칙 복제"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onEdit(automation)}
                      title="편집"
                      aria-label="자동화 규칙 편집"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDelete(automation.id)}
                      title="삭제"
                      aria-label="자동화 규칙 삭제"
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* 확장된 상세 정보 */}
              {isExpanded && (
                <div className="border-t px-4 py-3 bg-muted/30">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <h5 className="font-medium mb-2 flex items-center gap-2">
                        <Target className="h-4 w-4" />
                        트리거 조건
                      </h5>
                      <div className="space-y-1 text-muted-foreground">
                        {fromStatus && (
                          <p>이전 상태: <Badge variant="outline" style={{ backgroundColor: TASK_STATUS_COLORS[fromStatus] + '20' }}>{STATUS_LABELS[fromStatus]}</Badge></p>
                        )}
                        {toStatus && (
                          <p>변경 상태: <Badge variant="outline" style={{ backgroundColor: TASK_STATUS_COLORS[toStatus] + '20' }}>{STATUS_LABELS[toStatus]}</Badge></p>
                        )}
                        {daysBefore && (
                          <p>마감 {daysBefore}일 전</p>
                        )}
                        {progressThreshold && (
                          <p>진행률 {progressThreshold}% 도달 시</p>
                        )}
                        {!fromStatus && !toStatus && !daysBefore && !progressThreshold && (
                          <p className="text-muted-foreground italic">추가 조건 없음</p>
                        )}
                      </div>
                    </div>
                    <div>
                      <h5 className="font-medium mb-2 flex items-center gap-2">
                        <GitBranch className="h-4 w-4" />
                        실행 액션
                      </h5>
                      <div className="space-y-2">
                        {automation.actions.map((action, index) => (
                          <div key={index} className="text-muted-foreground">
                            <span className="font-medium text-foreground">{index + 1}. {getActionLabel(action.type)}</span>
                            {action.params.status && typeof action.params.status === 'string' && (
                              <p className="ml-4">→ 상태: {STATUS_LABELS[action.params.status as TaskStatus]}</p>
                            )}
                            {action.params.message && (
                              <p className="ml-4">→ 메시지: "{action.params.message}"</p>
                            )}
                            {action.params.daysToExtend && (
                              <p className="ml-4">→ {action.params.daysToExtend}일 연장</p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </ScrollArea>
  );
}
