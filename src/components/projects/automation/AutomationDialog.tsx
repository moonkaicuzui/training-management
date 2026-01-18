/**
 * 자동화 규칙 추가/수정 다이얼로그 컴포넌트
 */

import { useState, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
  Zap,
  Plus,
  Target,
  GitBranch,
  ArrowRight,
  Trash2,
  AlertCircle,
} from 'lucide-react';
import type { Automation, ActionType, TaskStatus } from '@/types/project';
import {
  TRIGGER_OPTIONS,
  ACTION_OPTIONS,
  STATUS_LABELS,
  getTriggerIcon,
  getActionIcon,
  getTriggerLabel,
  getActionLabel,
  DEFAULT_AUTOMATION_FORM,
  type AutomationFormData,
} from './constants';

interface AutomationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  automation?: Automation | null;
  onSave: (data: AutomationFormData, isEdit: boolean) => void;
  isLoading?: boolean;
}

export default function AutomationDialog({
  open,
  onOpenChange,
  automation,
  onSave,
  isLoading = false,
}: AutomationDialogProps) {
  const [formData, setFormData] = useState<AutomationFormData>(DEFAULT_AUTOMATION_FORM);

  // 편집 모드일 때 폼 데이터 초기화
  useEffect(() => {
    if (automation) {
      // Automation 타입에서 폼 데이터로 변환
      const fromStatusCondition = automation.trigger.conditions?.find(c => c.field === 'fromStatus');
      const toStatusCondition = automation.trigger.conditions?.find(c => c.field === 'toStatus');
      const progressCondition = automation.trigger.conditions?.find(c => c.field === 'progress');

      setFormData({
        name: automation.name,
        description: automation.description || '',
        triggerType: automation.trigger.type,
        triggerConditions: {
          fromStatus: fromStatusCondition?.value as TaskStatus | undefined,
          toStatus: toStatusCondition?.value as TaskStatus | undefined,
          daysBefore: automation.trigger.schedule?.daysBefore,
          progressThreshold: progressCondition?.value as number | undefined,
        },
        actions: automation.actions.map(a => ({
          type: a.type,
          params: a.params as { status?: TaskStatus; message?: string; daysToExtend?: number },
        })),
      });
    } else {
      setFormData(DEFAULT_AUTOMATION_FORM);
    }
  }, [automation, open]);

  // 액션 추가
  const addAction = useCallback((actionType: ActionType) => {
    setFormData(prev => ({
      ...prev,
      actions: [...prev.actions, { type: actionType, params: {} }],
    }));
  }, []);

  // 액션 제거
  const removeAction = useCallback((index: number) => {
    setFormData(prev => ({
      ...prev,
      actions: prev.actions.filter((_, i) => i !== index),
    }));
  }, []);

  // 액션 파라미터 업데이트
  const updateActionParams = useCallback((index: number, params: Record<string, unknown>) => {
    setFormData(prev => ({
      ...prev,
      actions: prev.actions.map((action, i) =>
        i === index ? { ...action, params: { ...action.params, ...params } } : action
      ),
    }));
  }, []);

  // 폼 제출
  const handleSubmit = () => {
    if (!formData.name.trim() || formData.actions.length === 0) return;
    onSave(formData, !!automation);
  };

  const isValid = formData.name.trim() && formData.actions.length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            {automation ? '자동화 수정' : '새 자동화 추가'}
          </DialogTitle>
          <DialogDescription>
            트리거 조건과 실행할 액션을 설정하세요
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* 기본 정보 */}
          <div className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="automation-name">자동화 이름 *</Label>
              <Input
                id="automation-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="예: 완료 시 알림 전송"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="automation-desc">설명</Label>
              <Input
                id="automation-desc"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="자동화 규칙에 대한 설명"
              />
            </div>
          </div>

          <Separator />

          {/* 트리거 설정 */}
          <div className="space-y-4">
            <h4 className="font-medium flex items-center gap-2">
              <Target className="h-4 w-4 text-blue-500" />
              트리거 (When)
            </h4>
            <p className="text-sm text-muted-foreground">
              어떤 조건에서 자동화가 실행될지 선택하세요
            </p>

            <div className="grid grid-cols-2 gap-3">
              {TRIGGER_OPTIONS.map((trigger) => (
                <button
                  key={trigger.value}
                  type="button"
                  onClick={() => setFormData({ ...formData, triggerType: trigger.value })}
                  className={`p-3 rounded-lg border text-left transition-all ${
                    formData.triggerType === trigger.value
                      ? 'border-blue-500 bg-blue-500/10'
                      : 'border-border hover:border-blue-500/50'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div className={`p-1.5 rounded ${
                      formData.triggerType === trigger.value
                        ? 'bg-blue-500/20 text-blue-600'
                        : 'bg-muted text-muted-foreground'
                    }`}>
                      {trigger.icon}
                    </div>
                    <span className="font-medium text-sm">{trigger.label}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1.5 ml-8">
                    {trigger.description}
                  </p>
                </button>
              ))}
            </div>

            {/* 트리거 조건 상세 */}
            <div className="bg-muted/50 rounded-lg p-4 space-y-3">
              <h5 className="text-sm font-medium">조건 설정</h5>

              {formData.triggerType === 'task_status_changed' && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label className="text-xs">이전 상태 (선택)</Label>
                    <Select
                      value={formData.triggerConditions.fromStatus || '__any__'}
                      onValueChange={(value) => setFormData({
                        ...formData,
                        triggerConditions: {
                          ...formData.triggerConditions,
                          fromStatus: value === '__any__' ? undefined : value as TaskStatus
                        }
                      })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="모든 상태" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__any__">모든 상태</SelectItem>
                        {Object.entries(STATUS_LABELS).map(([value, label]) => (
                          <SelectItem key={value} value={value}>{label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label className="text-xs">변경될 상태</Label>
                    <Select
                      value={formData.triggerConditions.toStatus || '__any__'}
                      onValueChange={(value) => setFormData({
                        ...formData,
                        triggerConditions: {
                          ...formData.triggerConditions,
                          toStatus: value === '__any__' ? undefined : value as TaskStatus
                        }
                      })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="상태 선택" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__any__">모든 상태</SelectItem>
                        {Object.entries(STATUS_LABELS).map(([value, label]) => (
                          <SelectItem key={value} value={value}>{label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              {formData.triggerType === 'task_due_date' && (
                <div className="grid gap-2">
                  <Label className="text-xs">마감일 며칠 전</Label>
                  <Input
                    type="number"
                    min={1}
                    max={30}
                    value={formData.triggerConditions.daysBefore || 3}
                    onChange={(e) => setFormData({
                      ...formData,
                      triggerConditions: {
                        ...formData.triggerConditions,
                        daysBefore: parseInt(e.target.value) || 3
                      }
                    })}
                  />
                </div>
              )}

              {formData.triggerType === 'task_progress_changed' && (
                <div className="grid gap-2">
                  <Label className="text-xs">진행률 임계값 (%)</Label>
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    value={formData.triggerConditions.progressThreshold || 100}
                    onChange={(e) => setFormData({
                      ...formData,
                      triggerConditions: {
                        ...formData.triggerConditions,
                        progressThreshold: parseInt(e.target.value) || 100
                      }
                    })}
                  />
                </div>
              )}

              {(formData.triggerType === 'task_created' ||
                formData.triggerType === 'task_assignee_changed' ||
                formData.triggerType === 'scheduled_time') && (
                <p className="text-sm text-muted-foreground">
                  이 트리거는 추가 조건 설정이 필요하지 않습니다.
                </p>
              )}
            </div>
          </div>

          <Separator />

          {/* 액션 설정 */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium flex items-center gap-2">
                  <GitBranch className="h-4 w-4 text-green-500" />
                  액션 (Then)
                </h4>
                <p className="text-sm text-muted-foreground">
                  트리거 조건 충족 시 실행할 작업을 추가하세요
                </p>
              </div>
            </div>

            {/* 추가된 액션 목록 */}
            {formData.actions.length > 0 && (
              <div className="space-y-2">
                {formData.actions.map((action, index) => {
                  const actionOption = ACTION_OPTIONS.find(a => a.value === action.type);
                  return (
                    <div key={index} className="flex items-start gap-3 p-3 bg-green-500/5 border border-green-500/20 rounded-lg">
                      <div className="p-1.5 rounded bg-green-500/20 text-green-600">
                        {actionOption?.icon}
                      </div>
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-sm">{actionOption?.label}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeAction(index)}
                            title="액션 삭제"
                            aria-label="액션 삭제"
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>

                        {/* 액션별 파라미터 */}
                        {action.type === 'change_status' && (
                          <Select
                            value={action.params.status || ''}
                            onValueChange={(value) => updateActionParams(index, { status: value })}
                          >
                            <SelectTrigger className="h-8">
                              <SelectValue placeholder="변경할 상태 선택" />
                            </SelectTrigger>
                            <SelectContent>
                              {Object.entries(STATUS_LABELS).map(([value, label]) => (
                                <SelectItem key={value} value={value}>{label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}

                        {(action.type === 'send_notification' ||
                          action.type === 'send_email' ||
                          action.type === 'add_comment') && (
                          <Input
                            className="h-8"
                            placeholder="메시지 내용"
                            value={action.params.message || ''}
                            onChange={(e) => updateActionParams(index, { message: e.target.value })}
                          />
                        )}

                        {action.type === 'extend_due_date' && (
                          <Input
                            type="number"
                            className="h-8"
                            placeholder="연장 일수"
                            min={1}
                            value={action.params.daysToExtend || ''}
                            onChange={(e) => updateActionParams(index, { daysToExtend: parseInt(e.target.value) })}
                          />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* 액션 추가 버튼들 */}
            <div className="grid grid-cols-2 gap-2">
              {ACTION_OPTIONS.map((action) => (
                <button
                  key={action.value}
                  type="button"
                  onClick={() => addAction(action.value)}
                  className="flex items-center gap-2 p-2 rounded-lg border border-dashed border-muted-foreground/30 hover:border-green-500/50 hover:bg-green-500/5 transition-all text-sm"
                >
                  <Plus className="h-3 w-3 text-muted-foreground" />
                  <span className="text-muted-foreground">{action.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* 미리보기 */}
          {formData.actions.length > 0 && (
            <>
              <Separator />
              <div className="bg-muted/30 rounded-lg p-4">
                <h5 className="text-sm font-medium mb-3 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  워크플로우 미리보기
                </h5>
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-500/10 text-blue-600 rounded-full text-sm">
                    {getTriggerIcon(formData.triggerType)}
                    <span>{getTriggerLabel(formData.triggerType)}</span>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  {formData.actions.map((action, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <div className="flex items-center gap-2 px-3 py-1.5 bg-green-500/10 text-green-600 rounded-full text-sm">
                        {getActionIcon(action.type)}
                        <span>{getActionLabel(action.type)}</span>
                      </div>
                      {index < formData.actions.length - 1 && (
                        <ArrowRight className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          {/* 유효성 검사 피드백 */}
          {!isValid && (
            <div className="flex-1 text-sm text-muted-foreground flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-amber-500" />
              {!formData.name.trim()
                ? '자동화 이름을 입력해주세요'
                : '최소 1개 이상의 액션을 추가해주세요'}
            </div>
          )}
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              취소
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!isValid || isLoading}
            >
              {isLoading ? '저장 중...' : automation ? '수정' : '추가'}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
