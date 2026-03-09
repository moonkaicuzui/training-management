/**
 * 카테고리 관리 섹션
 *
 * 카테고리 CRUD (생성, 수정, 삭제) + 다이얼로그
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { Plus, Tag, Trash2, Edit } from 'lucide-react';
import { CATEGORY_COLORS } from '@/types/project';
import type { Category } from '@/types/project';

interface CategoryManagementSectionProps {
  categories: Category[];
  isLoading: boolean;
  onCreateCategory: (name: string, color: string, type: 'event' | 'task', icon?: string) => Promise<Category>;
  onUpdateCategory: (id: string, data: Partial<Category>) => Promise<void>;
  onDeleteCategory: (id: string) => Promise<void>;
}

export function CategoryManagementSection({
  categories,
  isLoading,
  onCreateCategory,
  onUpdateCategory,
  onDeleteCategory,
}: CategoryManagementSectionProps) {
  const { t } = useTranslation();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    color: CATEGORY_COLORS[0],
    type: 'task' as 'event' | 'task',
    icon: '',
  });

  const resetForm = () => {
    setFormData({
      name: '',
      color: CATEGORY_COLORS[0],
      type: 'task',
      icon: '',
    });
    setSelectedCategory(null);
  };

  const openDialog = (category?: Category) => {
    if (category) {
      setSelectedCategory(category);
      setFormData({
        name: category.name,
        color: category.color,
        type: category.type,
        icon: category.icon || '',
      });
    } else {
      resetForm();
    }
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    try {
      if (selectedCategory) {
        await onUpdateCategory(selectedCategory.id, formData);
      } else {
        await onCreateCategory(formData.name, formData.color, formData.type, formData.icon || undefined);
      }
      setIsDialogOpen(false);
      resetForm();
    } catch {
      // 에러는 스토어에서 처리
    }
  };

  const handleDelete = async (categoryId: string) => {
    if (confirm(t('projects.settings.deleteCategoryConfirm'))) {
      await onDeleteCategory(categoryId);
    }
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>{t('projects.settings.categories')}</CardTitle>
            <CardDescription>
              {t('projects.settings.categories')}
            </CardDescription>
          </div>
          <Button onClick={() => openDialog()}>
            <Plus className="h-4 w-4 mr-2" />
            {t('projects.settings.addCategory')}
          </Button>
        </CardHeader>
        <CardContent>
          {categories.length === 0 ? (
            <div className="text-center py-12">
              <Tag className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">{t('common.noData')}</p>
              <Button onClick={() => openDialog()}>
                <Plus className="h-4 w-4 mr-2" />
                {t('projects.settings.addCategory')}
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {categories.map((category) => (
                <div
                  key={category.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: category.color }}
                    />
                    <span className="font-medium">{category.name}</span>
                    <Badge variant="outline">
                      {category.type === 'task' ? t('projects.tasks.title') : t('projects.calendar.title')}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openDialog(category)}
                      title={t('common.edit')}
                      aria-label={t('projects.settings.editCategory')}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(category.id)}
                      title={t('common.delete')}
                      aria-label={t('projects.settings.deleteCategory')}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 카테고리 추가/수정 다이얼로그 */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedCategory ? t('projects.settings.editCategory') : t('projects.settings.addCategory')}
            </DialogTitle>
            <DialogDescription>
              {selectedCategory
                ? t('projects.settings.editCategory')
                : t('projects.settings.addCategory')}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">{t('projects.settings.categoryName')}</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder={t('projects.settings.categoryName')}
              />
            </div>

            <div className="grid gap-2">
              <Label>{t('projects.settings.categoryColor')}</Label>
              <div className="flex flex-wrap gap-2">
                {CATEGORY_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    className={`w-8 h-8 rounded-full border-2 transition-transform ${
                      formData.color === color
                        ? 'border-primary scale-110'
                        : 'border-transparent hover:scale-105'
                    }`}
                    style={{ backgroundColor: color }}
                    onClick={() => setFormData({ ...formData, color })}
                  />
                ))}
              </div>
            </div>

            <div className="grid gap-2">
              <Label>{t('projects.tasks.category')}</Label>
              <Select
                value={formData.type}
                onValueChange={(value) =>
                  setFormData({ ...formData, type: value as 'event' | 'task' })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('common.select')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="task">{t('projects.tasks.title')}</SelectItem>
                  <SelectItem value="event">{t('projects.calendar.title')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button onClick={handleSave} disabled={!formData.name || isLoading}>
              {isLoading ? t('common.saving') : selectedCategory ? t('common.edit') : t('common.add')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
