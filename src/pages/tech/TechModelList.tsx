/**
 * TECH / NEW MODEL - 신규 모델 관리 페이지
 */

import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Plus, Pencil, Trash2, FileCheck, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
} from '@/components/ui/card';
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useTechModelStore } from '@/stores/techModelStore';
import { useAuthStore } from '@/stores/authStore';

// 시즌 목록 생성 (현재 연도 기준 ±2년)
function generateSeasons(): string[] {
  const currentYear = new Date().getFullYear();
  const seasons: string[] = [];
  for (let y = currentYear - 1; y <= currentYear + 2; y++) {
    const shortYear = String(y).slice(2);
    seasons.push(`SS${shortYear}`, `FW${shortYear}`);
  }
  return seasons;
}

export default function TechModelList() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const user = useAuthStore((s) => s.user);
  const {
    models,
    guidelines,
    isLoading,
    fetchModels,
    fetchGuidelines,
    createModel,
    updateModel,
    deleteModel,
  } = useTechModelStore();

  const [seasonFilter, setSeasonFilter] = useState<string>('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingModel, setEditingModel] = useState<{ id: string; season: string; modelName: string } | null>(null);
  const [formSeason, setFormSeason] = useState('');
  const [formModelName, setFormModelName] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const seasons = useMemo(() => generateSeasons(), []);

  // 초기 데이터 로드
  useEffect(() => {
    fetchModels();
    fetchGuidelines(); // 전체 지침 가져오기 (카운트용)
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // 시즌 필터 적용
  const filteredModels = useMemo(() => {
    if (seasonFilter === 'all') return models;
    return models.filter((m) => m.season === seasonFilter);
  }, [models, seasonFilter]);

  // 모델별 지침 수 계산
  const guidelineCountMap = useMemo(() => {
    const map = new Map<string, number>();
    guidelines.forEach((g) => {
      map.set(g.modelId, (map.get(g.modelId) || 0) + 1);
    });
    return map;
  }, [guidelines]);

  // 시즌 목록 (데이터에서 추출 + 기본값)
  const availableSeasons = useMemo(() => {
    const fromData = new Set(models.map((m) => m.season));
    const all = new Set([...fromData, ...seasons]);
    return Array.from(all).sort();
  }, [models, seasons]);

  const openCreateDialog = () => {
    setEditingModel(null);
    setFormSeason(seasons.find((s) => s.startsWith('SS')) || seasons[0] || '');
    setFormModelName('');
    setDialogOpen(true);
  };

  const openEditDialog = (model: typeof models[0]) => {
    setEditingModel({ id: model.id, season: model.season, modelName: model.modelName });
    setFormSeason(model.season);
    setFormModelName(model.modelName);
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!formSeason.trim() || !formModelName.trim()) {
      toast({ title: t('common.error'), description: t('tech.models.fillRequired'), variant: 'destructive' });
      return;
    }

    try {
      if (editingModel) {
        await updateModel(editingModel.id, {
          season: formSeason,
          modelName: formModelName,
        });
        toast({ title: t('tech.models.updated') });
      } else {
        await createModel({
          season: formSeason,
          modelName: formModelName,
          createdBy: user?.email || '',
        });
        toast({ title: t('tech.models.created') });
      }
      setDialogOpen(false);
    } catch {
      toast({ title: t('common.error'), description: t('tech.models.saveFailed'), variant: 'destructive' });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteModel(id);
      toast({ title: t('tech.models.deleted') });
      setDeleteConfirmId(null);
    } catch {
      toast({ title: t('common.error'), description: t('tech.models.deleteFailed'), variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t('tech.models.title')}</h1>
          <p className="text-muted-foreground">{t('tech.models.description')}</p>
        </div>
        <Button onClick={openCreateDialog}>
          <Plus className="h-4 w-4 mr-2" />
          {t('tech.models.addModel')}
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="w-48">
              <Label>{t('tech.models.season')}</Label>
              <Select value={seasonFilter} onValueChange={setSeasonFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('common.all')}</SelectItem>
                  {availableSeasons.map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="text-sm text-muted-foreground mt-5">
              {t('common.count')}: {filteredModels.length}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Model Table */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : filteredModels.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            {t('tech.models.noModels')}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('tech.models.season')}</TableHead>
                <TableHead>{t('tech.models.modelName')}</TableHead>
                <TableHead>{t('tech.models.guidelineCount')}</TableHead>
                <TableHead>{t('tech.models.createdAt')}</TableHead>
                <TableHead className="text-right">{t('common.actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredModels.map((model) => (
                <TableRow key={model.id} className="cursor-pointer hover:bg-muted/50">
                  <TableCell>
                    <Badge variant="outline">{model.season}</Badge>
                  </TableCell>
                  <TableCell className="font-medium">{model.modelName}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">
                      <FileCheck className="h-3 w-3 mr-1" />
                      {guidelineCountMap.get(model.id) || 0}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {model.createdAt ? new Date(model.createdAt).toLocaleDateString() : '-'}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate(`/tech/review-guidelines?modelId=${model.id}`)}
                        title={t('tech.models.viewGuidelines')}
                      >
                        <FileCheck className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditDialog(model)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeleteConfirmId(model.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingModel ? t('tech.models.editModel') : t('tech.models.addModel')}
            </DialogTitle>
            <DialogDescription>
              {t('tech.models.dialogDescription')}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>{t('tech.models.season')}</Label>
              <Select value={formSeason} onValueChange={setFormSeason}>
                <SelectTrigger>
                  <SelectValue placeholder={t('tech.models.selectSeason')} />
                </SelectTrigger>
                <SelectContent>
                  {seasons.map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{t('tech.models.modelName')}</Label>
              <Input
                value={formModelName}
                onChange={(e) => setFormModelName(e.target.value)}
                placeholder={t('tech.models.modelNamePlaceholder')}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button onClick={handleSubmit} disabled={isLoading}>
              {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {t('common.save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteConfirmId} onOpenChange={() => setDeleteConfirmId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('tech.models.deleteConfirm')}</DialogTitle>
            <DialogDescription>
              {t('tech.models.deleteWarning')}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirmId(null)}>
              {t('common.cancel')}
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteConfirmId && handleDelete(deleteConfirmId)}
              disabled={isLoading}
            >
              {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {t('common.delete')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
