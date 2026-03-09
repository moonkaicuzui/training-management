/**
 * LearningPathSection - Learning paths tab with CRUD dialog
 */

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
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
import { useToast } from '@/hooks/use-toast';
import * as api from '@/services/api';
import type { LearningPath, LearningPathType } from '@/types/curriculum';

const PATH_TYPES: LearningPathType[] = [
  'ONBOARDING',
  'POSITION',
  'PROMOTION',
  'SPECIALIZATION',
  'REMEDIAL',
];

interface PathFormState {
  path_code: string;
  name: string;
  name_vn: string;
  name_kr: string;
  description: string;
  type: LearningPathType;
  estimated_duration_hours: number;
  is_mandatory: boolean;
}

const INITIAL_PATH_FORM: PathFormState = {
  path_code: '',
  name: '',
  name_vn: '',
  name_kr: '',
  description: '',
  type: 'ONBOARDING',
  estimated_duration_hours: 0,
  is_mandatory: false,
};

interface LearningPathSectionProps {
  learningPaths: LearningPath[];
  onDataChanged: () => void;
}

export function LearningPathSection({
  learningPaths,
  onDataChanged,
}: LearningPathSectionProps) {
  const { t } = useTranslation();
  const { toast } = useToast();

  const [pathDialogOpen, setPathDialogOpen] = useState(false);
  const [editingPath, setEditingPath] = useState<LearningPath | null>(null);
  const [pathForm, setPathForm] = useState<PathFormState>(INITIAL_PATH_FORM);

  useEffect(() => {
    if (pathDialogOpen) {
      if (editingPath) {
        setPathForm({
          path_code: editingPath.path_code,
          name: editingPath.name,
          name_vn: editingPath.name_vn,
          name_kr: editingPath.name_kr,
          description: editingPath.description,
          type: editingPath.type,
          estimated_duration_hours: editingPath.estimated_duration_hours,
          is_mandatory: editingPath.is_mandatory,
        });
      } else {
        setPathForm(INITIAL_PATH_FORM);
      }
    }
  }, [pathDialogOpen, editingPath]);

  const openPathDialog = (path?: LearningPath) => {
    setEditingPath(path ?? null);
    setPathDialogOpen(true);
  };

  const savePath = async () => {
    if (!pathForm.path_code || !pathForm.name) {
      toast({ title: t('messages.requiredFields'), variant: 'destructive' });
      return;
    }

    try {
      if (editingPath) {
        await api.updateLearningPath(editingPath.path_id, {
          ...pathForm,
          is_active: true,
          target_positions: editingPath.target_positions,
          target_departments: editingPath.target_departments,
          required_competencies: editingPath.required_competencies,
          programs: editingPath.programs,
          validity_months: editingPath.validity_months,
        });
      } else {
        await api.createLearningPath({
          ...pathForm,
          is_active: true,
          target_positions: [],
          target_departments: [],
          required_competencies: [],
          programs: [],
          validity_months: null,
        });
      }
      toast({ title: t('messages.saveSuccess') });
      setPathDialogOpen(false);
      onDataChanged();
    } catch {
      toast({ title: t('messages.saveError'), variant: 'destructive' });
    }
  };

  return (
    <>
      <div className="flex justify-end">
        <Button onClick={() => openPathDialog()}>
          <Plus className="h-4 w-4 mr-2" />
          {t('competency.paths.add')}
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {learningPaths.map((path) => (
          <Card key={path.path_id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-base">{path.name}</CardTitle>
                  <CardDescription className="text-xs mt-1">
                    {path.path_code}
                  </CardDescription>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => openPathDialog(path)}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="outline">
                  {t(`competency.paths.type.${path.type}`)}
                </Badge>
                {path.is_mandatory && (
                  <Badge variant="destructive">
                    {t('competency.paths.mandatory')}
                  </Badge>
                )}
              </div>
              {path.description && (
                <p className="text-xs text-muted-foreground line-clamp-2">
                  {path.description}
                </p>
              )}
              <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t">
                <span>
                  {t('competency.paths.duration', {
                    hours: path.estimated_duration_hours,
                  })}
                </span>
                <span>
                  {t('competency.paths.programCount', {
                    count: path.programs.length,
                  })}
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
        {learningPaths.length === 0 && (
          <div className="col-span-full text-center py-8 text-muted-foreground">
            {t('common.noData')}
          </div>
        )}
      </div>

      {/* Learning Path Add/Edit Dialog */}
      <Dialog open={pathDialogOpen} onOpenChange={setPathDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {editingPath
                ? t('competency.paths.edit')
                : t('competency.paths.add')}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t('competency.paths.code')} *</Label>
                <Input
                  value={pathForm.path_code}
                  onChange={(e) =>
                    setPathForm((f) => ({ ...f, path_code: e.target.value }))
                  }
                  placeholder="LP-001"
                />
              </div>
              <div className="space-y-2">
                <Label>{t('competency.paths.typeLabel')} *</Label>
                <Select
                  value={pathForm.type}
                  onValueChange={(v) =>
                    setPathForm((f) => ({ ...f, type: v as LearningPathType }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PATH_TYPES.map((pt) => (
                      <SelectItem key={pt} value={pt}>
                        {t(`competency.paths.type.${pt}`)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>{t('competency.nameEn')} *</Label>
              <Input
                value={pathForm.name}
                onChange={(e) => setPathForm((f) => ({ ...f, name: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t('competency.nameVn')}</Label>
                <Input
                  value={pathForm.name_vn}
                  onChange={(e) =>
                    setPathForm((f) => ({ ...f, name_vn: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>{t('competency.nameKr')}</Label>
                <Input
                  value={pathForm.name_kr}
                  onChange={(e) =>
                    setPathForm((f) => ({ ...f, name_kr: e.target.value }))
                  }
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>{t('competency.descriptionLabel')}</Label>
              <Textarea
                value={pathForm.description}
                onChange={(e) =>
                  setPathForm((f) => ({ ...f, description: e.target.value }))
                }
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t('competency.paths.durationLabel')}</Label>
                <Input
                  type="number"
                  value={pathForm.estimated_duration_hours}
                  onChange={(e) =>
                    setPathForm((f) => ({
                      ...f,
                      estimated_duration_hours: Number(e.target.value),
                    }))
                  }
                />
              </div>
              <div className="flex items-center space-x-2 pt-6">
                <Switch
                  checked={pathForm.is_mandatory}
                  onCheckedChange={(v) => setPathForm((f) => ({ ...f, is_mandatory: v }))}
                />
                <Label>{t('competency.paths.mandatory')}</Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPathDialogOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button onClick={savePath}>{t('common.save')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
