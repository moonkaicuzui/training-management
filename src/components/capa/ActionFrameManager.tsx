/**
 * ActionFrameManager
 *
 * CAPA 대시보드 "관리 프레임" 탭에서 프레임을 관리하는 UI.
 * 초기에는 DEFAULT_ACTION_FRAMES를 표시하고,
 * Firestore config/action_frames 연동은 TODO로 남겨둡니다.
 */

import { useState, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Layers,
  Plus,
  Pencil,
  Power,
  PowerOff,
  GripVertical,
  Trash2,
} from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

import {
  DEFAULT_ACTION_FRAMES,
  type ActionFrame,
  type ActionFrameAction,
  type ActionFrameMatchCondition,
} from '@/data/actionFrames';

type LangKey = 'ko' | 'en' | 'vi';

function getLocalizedText(
  obj: { ko: string; en: string; vi: string },
  lang: string
): string {
  const key = (lang?.substring(0, 2) as LangKey) || 'ko';
  return obj[key] || obj.ko;
}

// 모든 불량 카테고리 목록
const ALL_DEFECT_CATEGORIES = [
  'BONDING',
  'PRESSING',
  'PAINTING',
  'CONTAMINATION',
  'SHAPE',
  'SPEC_QC',
  'APPEARANCE',
  'FINISHING',
  'COLOR',
];

const ALL_SEVERITIES: Array<'critical' | 'major' | 'minor'> = [
  'critical',
  'major',
  'minor',
];

const ALL_DISCOVERY_POINTS = [
  'in_production',
  'incoming_inspection',
  'outgoing_inspection',
  'customer_return',
];

const DEADLINE_OPTIONS: Array<{
  value: ActionFrameAction['defaultDeadline'];
  label: { ko: string; en: string; vi: string };
}> = [
  { value: 'immediate', label: { ko: '즉시', en: 'Immediate', vi: 'Ngay lập tức' } },
  { value: 'same_day', label: { ko: '당일', en: 'Same day', vi: 'Trong ngày' } },
  { value: '2_days', label: { ko: '2일 내', en: 'Within 2 days', vi: 'Trong 2 ngày' } },
  { value: '1_week', label: { ko: '1주 내', en: 'Within 1 week', vi: 'Trong 1 tuần' } },
  { value: '2_weeks', label: { ko: '2주 내', en: 'Within 2 weeks', vi: 'Trong 2 tuần' } },
];

interface EditingAction {
  id: string;
  description: { ko: string; en: string; vi: string };
  defaultDeadline: ActionFrameAction['defaultDeadline'];
  required: boolean;
  order: number;
}

interface EditFormState {
  name: { ko: string; en: string; vi: string };
  description: { ko: string; en: string; vi: string };
  matchConditions: {
    defectCategories: string[];
    severities: Array<'critical' | 'major' | 'minor'>;
    discoveryPoints: string[];
  };
  defaultActions: EditingAction[];
}

export default function ActionFrameManager() {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;

  // TODO: Firestore config/action_frames에서 읽기 — 현재는 시드 데이터 사용
  const [frames, setFrames] = useState<ActionFrame[]>(
    () => [...DEFAULT_ACTION_FRAMES]
  );

  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingFrameId, setEditingFrameId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<EditFormState | null>(null);

  // 프레임 편집 열기
  const handleEdit = useCallback(
    (frame: ActionFrame) => {
      setEditingFrameId(frame.id);
      setEditForm({
        name: { ...frame.name },
        description: { ...frame.description },
        matchConditions: {
          defectCategories: [...frame.matchConditions.defectCategories],
          severities: [...frame.matchConditions.severities],
          discoveryPoints: [...frame.matchConditions.discoveryPoints],
        },
        defaultActions: frame.defaultActions.map((a) => ({
          ...a,
          description: { ...a.description },
        })),
      });
      setEditDialogOpen(true);
    },
    []
  );

  // 새 프레임 추가
  const handleAddNew = useCallback(() => {
    setEditingFrameId(null);
    setEditForm({
      name: { ko: '', en: '', vi: '' },
      description: { ko: '', en: '', vi: '' },
      matchConditions: {
        defectCategories: [],
        severities: [],
        discoveryPoints: [],
      },
      defaultActions: [],
    });
    setEditDialogOpen(true);
  }, []);

  // 활성/비활성 토글
  const handleToggleActive = useCallback(
    (frameId: string) => {
      // TODO: Firestore 업데이트
      setFrames((prev) =>
        prev.map((f) =>
          f.id === frameId ? { ...f, isActive: !f.isActive } : f
        )
      );
    },
    []
  );

  // 편집 폼에서 매칭 조건 체크박스 토글
  const toggleCategory = useCallback(
    (category: string) => {
      if (!editForm) return;
      const cats = editForm.matchConditions.defectCategories;
      setEditForm({
        ...editForm,
        matchConditions: {
          ...editForm.matchConditions,
          defectCategories: cats.includes(category)
            ? cats.filter((c) => c !== category)
            : [...cats, category],
        },
      });
    },
    [editForm]
  );

  const toggleSeverity = useCallback(
    (severity: 'critical' | 'major' | 'minor') => {
      if (!editForm) return;
      const sevs = editForm.matchConditions.severities;
      setEditForm({
        ...editForm,
        matchConditions: {
          ...editForm.matchConditions,
          severities: sevs.includes(severity)
            ? sevs.filter((s) => s !== severity)
            : [...sevs, severity],
        },
      });
    },
    [editForm]
  );

  const toggleDiscoveryPoint = useCallback(
    (point: string) => {
      if (!editForm) return;
      const pts = editForm.matchConditions.discoveryPoints;
      setEditForm({
        ...editForm,
        matchConditions: {
          ...editForm.matchConditions,
          discoveryPoints: pts.includes(point)
            ? pts.filter((p) => p !== point)
            : [...pts, point],
        },
      });
    },
    [editForm]
  );

  // 액션 추가
  const handleAddAction = useCallback(() => {
    if (!editForm) return;
    const newAction: EditingAction = {
      id: `act-new-${Date.now()}`,
      description: { ko: '', en: '', vi: '' },
      defaultDeadline: 'same_day',
      required: false,
      order: editForm.defaultActions.length + 1,
    };
    setEditForm({
      ...editForm,
      defaultActions: [...editForm.defaultActions, newAction],
    });
  }, [editForm]);

  // 액션 삭제
  const handleRemoveAction = useCallback(
    (actionId: string) => {
      if (!editForm) return;
      setEditForm({
        ...editForm,
        defaultActions: editForm.defaultActions
          .filter((a) => a.id !== actionId)
          .map((a, idx) => ({ ...a, order: idx + 1 })),
      });
    },
    [editForm]
  );

  // 액션 순서 변경 (위로)
  const handleMoveUp = useCallback(
    (index: number) => {
      if (!editForm || index === 0) return;
      const actions = [...editForm.defaultActions];
      [actions[index - 1], actions[index]] = [actions[index], actions[index - 1]];
      setEditForm({
        ...editForm,
        defaultActions: actions.map((a, idx) => ({ ...a, order: idx + 1 })),
      });
    },
    [editForm]
  );

  // 저장
  const handleSave = useCallback(() => {
    if (!editForm) return;

    // TODO: Firestore에 저장
    if (editingFrameId) {
      // 기존 프레임 수정
      setFrames((prev) =>
        prev.map((f) =>
          f.id === editingFrameId
            ? {
                ...f,
                name: editForm.name,
                description: editForm.description,
                matchConditions: editForm.matchConditions as ActionFrameMatchCondition,
                defaultActions: editForm.defaultActions,
              }
            : f
        )
      );
    } else {
      // 새 프레임 추가
      const newFrame: ActionFrame = {
        id: `FRAME-${String(frames.length + 1).padStart(3, '0')}`,
        name: editForm.name,
        description: editForm.description,
        matchConditions: editForm.matchConditions as ActionFrameMatchCondition,
        defaultActions: editForm.defaultActions,
        isActive: true,
        usageCount: 0,
        avgEffectiveness: 0,
      };
      setFrames((prev) => [...prev, newFrame]);
    }

    setEditDialogOpen(false);
    setEditForm(null);
    setEditingFrameId(null);
  }, [editForm, editingFrameId, frames.length]);

  // 정렬된 프레임 목록
  const sortedFrames = useMemo(
    () =>
      [...frames].sort((a, b) => {
        // 활성 먼저, 그 다음 ID 순
        if (a.isActive !== b.isActive) return a.isActive ? -1 : 1;
        return a.id.localeCompare(b.id);
      }),
    [frames]
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Layers className="h-5 w-5" />
            {t('capa.frameManager.title')}
          </CardTitle>
          <Button onClick={handleAddNew} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            {t('capa.frameManager.addFrame')}
          </Button>
        </div>
        <p className="text-sm text-muted-foreground">
          {t('capa.frameManager.description')}
        </p>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('capa.frameManager.frameName')}</TableHead>
              <TableHead>{t('capa.frameManager.matchConditions')}</TableHead>
              <TableHead className="text-center">
                {t('capa.frameManager.actionCount')}
              </TableHead>
              <TableHead className="text-center">
                {t('capa.frameManager.usageCount')}
              </TableHead>
              <TableHead className="text-center">
                {t('capa.frameManager.avgEffectiveness')}
              </TableHead>
              <TableHead className="text-center">
                {t('capa.frameManager.status')}
              </TableHead>
              <TableHead className="text-right">
                {t('capa.frameManager.actions')}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedFrames.map((frame) => (
              <TableRow
                key={frame.id}
                className={!frame.isActive ? 'opacity-50' : ''}
              >
                <TableCell>
                  <div>
                    <span className="font-medium">
                      {getLocalizedText(frame.name, lang)}
                    </span>
                    <p className="text-xs text-muted-foreground mt-1">
                      {frame.id}
                    </p>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {frame.matchConditions.defectCategories.map((cat) => (
                      <Badge key={cat} variant="outline" className="text-xs">
                        {cat}
                      </Badge>
                    ))}
                  </div>
                </TableCell>
                <TableCell className="text-center">
                  {frame.defaultActions.length}
                </TableCell>
                <TableCell className="text-center">
                  {frame.usageCount}
                </TableCell>
                <TableCell className="text-center">
                  {frame.avgEffectiveness > 0
                    ? `${frame.avgEffectiveness}%`
                    : '-'}
                </TableCell>
                <TableCell className="text-center">
                  <Badge
                    variant={frame.isActive ? 'default' : 'secondary'}
                  >
                    {frame.isActive
                      ? t('capa.frameManager.active')
                      : t('capa.frameManager.inactive')}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(frame)}
                      aria-label={t('capa.frameManager.edit')}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleToggleActive(frame.id)}
                      aria-label={
                        frame.isActive
                          ? t('capa.frameManager.deactivate')
                          : t('capa.frameManager.activate')
                      }
                    >
                      {frame.isActive ? (
                        <PowerOff className="h-4 w-4" />
                      ) : (
                        <Power className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {/* 편집 Dialog */}
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingFrameId
                  ? t('capa.frameManager.editFrame')
                  : t('capa.frameManager.addFrame')}
              </DialogTitle>
              <DialogDescription>
                {t('capa.frameManager.editDescription')}
              </DialogDescription>
            </DialogHeader>

            {editForm && (
              <div className="space-y-6">
                {/* 프레임명 (ko/en/vi) */}
                <div className="space-y-3">
                  <Label className="font-medium">
                    {t('capa.frameManager.frameName')}
                  </Label>
                  <div className="grid grid-cols-1 gap-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="w-8 text-center">
                        KO
                      </Badge>
                      <Input
                        value={editForm.name.ko}
                        onChange={(e) =>
                          setEditForm({
                            ...editForm,
                            name: { ...editForm.name, ko: e.target.value },
                          })
                        }
                        placeholder={t('capa.frameManager.nameKoPlaceholder')}
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="w-8 text-center">
                        EN
                      </Badge>
                      <Input
                        value={editForm.name.en}
                        onChange={(e) =>
                          setEditForm({
                            ...editForm,
                            name: { ...editForm.name, en: e.target.value },
                          })
                        }
                        placeholder={t('capa.frameManager.nameEnPlaceholder')}
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="w-8 text-center">
                        VI
                      </Badge>
                      <Input
                        value={editForm.name.vi}
                        onChange={(e) =>
                          setEditForm({
                            ...editForm,
                            name: { ...editForm.name, vi: e.target.value },
                          })
                        }
                        placeholder={t('capa.frameManager.nameViPlaceholder')}
                      />
                    </div>
                  </div>
                </div>

                {/* 매칭 조건: 불량 카테고리 */}
                <div className="space-y-2">
                  <Label className="font-medium">
                    {t('capa.frameManager.defectCategories')}
                  </Label>
                  <div className="flex flex-wrap gap-2">
                    {ALL_DEFECT_CATEGORIES.map((cat) => (
                      <label
                        key={cat}
                        className="flex items-center gap-1.5 cursor-pointer"
                      >
                        <Checkbox
                          checked={editForm.matchConditions.defectCategories.includes(
                            cat
                          )}
                          onCheckedChange={() => toggleCategory(cat)}
                        />
                        <span className="text-sm">{cat}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* 매칭 조건: 심각도 */}
                <div className="space-y-2">
                  <Label className="font-medium">
                    {t('capa.frameManager.severities')}
                  </Label>
                  <div className="flex gap-4">
                    {ALL_SEVERITIES.map((sev) => (
                      <label
                        key={sev}
                        className="flex items-center gap-1.5 cursor-pointer"
                      >
                        <Checkbox
                          checked={editForm.matchConditions.severities.includes(
                            sev
                          )}
                          onCheckedChange={() => toggleSeverity(sev)}
                        />
                        <span className="text-sm">
                          {t(`capa.severityLabels.${sev}`)}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* 매칭 조건: 발견 시점 */}
                <div className="space-y-2">
                  <Label className="font-medium">
                    {t('capa.frameManager.discoveryPoints')}
                  </Label>
                  <div className="flex flex-wrap gap-4">
                    {ALL_DISCOVERY_POINTS.map((point) => (
                      <label
                        key={point}
                        className="flex items-center gap-1.5 cursor-pointer"
                      >
                        <Checkbox
                          checked={editForm.matchConditions.discoveryPoints.includes(
                            point
                          )}
                          onCheckedChange={() => toggleDiscoveryPoint(point)}
                        />
                        <span className="text-sm">
                          {t(`capa.frameManager.discoveryPoint_${point}`)}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* 기본 액션 목록 */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="font-medium">
                      {t('capa.frameManager.defaultActions')}
                    </Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleAddAction}
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      {t('capa.frameManager.addAction')}
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {editForm.defaultActions.map((action, index) => (
                      <div
                        key={action.id}
                        className="flex items-start gap-2 p-3 border rounded-lg"
                      >
                        <button
                          type="button"
                          className="mt-2 cursor-grab text-muted-foreground hover:text-foreground"
                          onClick={() => handleMoveUp(index)}
                          disabled={index === 0}
                          aria-label={t('capa.frameManager.moveUp')}
                        >
                          <GripVertical className="h-4 w-4" />
                        </button>
                        <div className="flex-1 space-y-2">
                          <div className="grid grid-cols-1 gap-1">
                            <Input
                              value={action.description.ko}
                              onChange={(e) => {
                                const newActions = [
                                  ...editForm.defaultActions,
                                ];
                                newActions[index] = {
                                  ...newActions[index],
                                  description: {
                                    ...newActions[index].description,
                                    ko: e.target.value,
                                  },
                                };
                                setEditForm({
                                  ...editForm,
                                  defaultActions: newActions,
                                });
                              }}
                              placeholder="KO"
                              className="text-sm"
                            />
                            <Input
                              value={action.description.en}
                              onChange={(e) => {
                                const newActions = [
                                  ...editForm.defaultActions,
                                ];
                                newActions[index] = {
                                  ...newActions[index],
                                  description: {
                                    ...newActions[index].description,
                                    en: e.target.value,
                                  },
                                };
                                setEditForm({
                                  ...editForm,
                                  defaultActions: newActions,
                                });
                              }}
                              placeholder="EN"
                              className="text-sm"
                            />
                            <Input
                              value={action.description.vi}
                              onChange={(e) => {
                                const newActions = [
                                  ...editForm.defaultActions,
                                ];
                                newActions[index] = {
                                  ...newActions[index],
                                  description: {
                                    ...newActions[index].description,
                                    vi: e.target.value,
                                  },
                                };
                                setEditForm({
                                  ...editForm,
                                  defaultActions: newActions,
                                });
                              }}
                              placeholder="VI"
                              className="text-sm"
                            />
                          </div>
                          <div className="flex items-center gap-3">
                            <select
                              className="h-8 rounded-md border border-input bg-background px-2 text-xs"
                              value={action.defaultDeadline}
                              onChange={(e) => {
                                const newActions = [
                                  ...editForm.defaultActions,
                                ];
                                newActions[index] = {
                                  ...newActions[index],
                                  defaultDeadline: e.target
                                    .value as EditingAction['defaultDeadline'],
                                };
                                setEditForm({
                                  ...editForm,
                                  defaultActions: newActions,
                                });
                              }}
                            >
                              {DEADLINE_OPTIONS.map((opt) => (
                                <option key={opt.value} value={opt.value}>
                                  {getLocalizedText(opt.label, lang)}
                                </option>
                              ))}
                            </select>
                            <label className="flex items-center gap-1 cursor-pointer">
                              <Checkbox
                                checked={action.required}
                                onCheckedChange={(checked) => {
                                  const newActions = [
                                    ...editForm.defaultActions,
                                  ];
                                  newActions[index] = {
                                    ...newActions[index],
                                    required: checked === true,
                                  };
                                  setEditForm({
                                    ...editForm,
                                    defaultActions: newActions,
                                  });
                                }}
                              />
                              <span className="text-xs">
                                {t('capa.frameManager.requiredAction')}
                              </span>
                            </label>
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveAction(action.id)}
                          aria-label={t('capa.frameManager.removeAction')}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setEditDialogOpen(false)}
              >
                {t('common.cancel')}
              </Button>
              <Button onClick={handleSave}>
                {t('common.save')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
