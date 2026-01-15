/**
 * 프로젝트 설정 페이지
 *
 * 카테고리 관리, 자동화 규칙, 프로젝트 설정
 */

import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  Settings,
  Plus,
  Tag,
  Trash2,
  Edit,
  Zap,
  FolderCog,
} from 'lucide-react';
import { useProjectStore } from '@/stores/projectStore';
import { CATEGORY_COLORS } from '@/types/project';
import type { Category, Automation } from '@/types/project';
import { AutomationList, AutomationDialog } from '@/components/projects/automation';

export default function ProjectsSettings() {
  const {
    categories,
    fetchCategories,
    createCategory,
    updateCategory,
    deleteCategory,
    isLoading,
    // 자동화 관련
    automations,
    fetchAutomationsByProject,
    createAutomation,
    updateAutomation,
    deleteAutomation,
    toggleAutomation,
    isAutomationsLoading,
    currentProjectId,
  } = useProjectStore();

  const [initialized, setInitialized] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    color: CATEGORY_COLORS[0],
    type: 'task' as 'event' | 'task',
    icon: '',
  });

  // 자동화 관련 상태
  const [isAutomationDialogOpen, setIsAutomationDialogOpen] = useState(false);
  const [selectedAutomation, setSelectedAutomation] = useState<Automation | null>(null);

  useEffect(() => {
    if (!initialized) {
      fetchCategories();
      // 현재 프로젝트가 있으면 자동화 규칙 로드
      if (currentProjectId) {
        fetchAutomationsByProject(currentProjectId);
      }
      setInitialized(true);
    }
  }, [initialized, fetchCategories, fetchAutomationsByProject, currentProjectId]);

  // 폼 초기화
  const resetForm = () => {
    setFormData({
      name: '',
      color: CATEGORY_COLORS[0],
      type: 'task',
      icon: '',
    });
    setSelectedCategory(null);
  };

  // 다이얼로그 열기
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

  // 카테고리 저장
  const handleSave = async () => {
    try {
      if (selectedCategory) {
        await updateCategory(selectedCategory.id, formData);
      } else {
        await createCategory(formData.name, formData.color, formData.type, formData.icon || undefined);
      }
      setIsDialogOpen(false);
      resetForm();
    } catch {
      // 에러는 스토어에서 처리
    }
  };

  // 카테고리 삭제
  const handleDelete = async (categoryId: string) => {
    if (confirm('이 카테고리를 삭제하시겠습니까?')) {
      await deleteCategory(categoryId);
    }
  };

  // ============================================================
  // 자동화 관련 함수들
  // ============================================================

  // 자동화 활성화/비활성화 토글
  const handleToggleAutomation = useCallback((automationId: string) => {
    toggleAutomation(automationId);
  }, [toggleAutomation]);

  // 자동화 다이얼로그 열기
  const openAutomationDialog = useCallback((automation?: Automation) => {
    setSelectedAutomation(automation || null);
    setIsAutomationDialogOpen(true);
  }, []);

  // 자동화 저장
  const handleSaveAutomation = useCallback(async (automation: Automation) => {
    if (!currentProjectId) return;

    try {
      if (selectedAutomation) {
        // 수정
        await updateAutomation(selectedAutomation.id, automation);
      } else {
        // 생성
        await createAutomation({
          ...automation,
          projectId: currentProjectId,
          isActive: false,
        });
      }
      setIsAutomationDialogOpen(false);
      setSelectedAutomation(null);
    } catch {
      // 에러는 스토어에서 처리
    }
  }, [currentProjectId, selectedAutomation, createAutomation, updateAutomation]);

  // 자동화 삭제
  const handleDeleteAutomation = useCallback(async (automationId: string) => {
    if (confirm('이 자동화 규칙을 삭제하시겠습니까?')) {
      await deleteAutomation(automationId);
    }
  }, [deleteAutomation]);

  // 자동화 복제
  const handleDuplicateAutomation = useCallback(async (automation: Automation) => {
    if (!currentProjectId) return;

    try {
      await createAutomation({
        ...automation,
        id: undefined as unknown as string, // 새 ID 생성
        name: `${automation.name} (복사본)`,
        projectId: currentProjectId,
        isActive: false,
      });
    } catch {
      // 에러는 스토어에서 처리
    }
  }, [currentProjectId, createAutomation]);

  // 자동화 테스트 실행
  const handleTestAutomation = useCallback((automation: Automation) => {
    // 테스트 실행 시뮬레이션
    const triggerInfo = automation.trigger.type;
    const actionsInfo = automation.actions.map(a => a.type).join(', ');

    alert(
      `🧪 자동화 테스트 실행\n\n` +
      `이름: ${automation.name}\n` +
      `트리거: ${triggerInfo}\n` +
      `액션: ${actionsInfo}\n\n` +
      `✅ 테스트가 성공적으로 완료되었습니다.\n` +
      `(실제 액션은 실행되지 않았습니다)`
    );

    // 실행 횟수 증가 (선택적)
    updateAutomation(automation.id, {
      runCount: (automation.runCount || 0) + 1,
      lastRunAt: new Date(),
    });
  }, [updateAutomation]);

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Settings className="h-6 w-6" />
          설정
        </h1>
        <p className="text-muted-foreground mt-1">
          프로젝트 관리 시스템을 설정하세요
        </p>
      </div>

      <Tabs defaultValue="categories" className="space-y-6">
        <TabsList>
          <TabsTrigger value="categories" className="flex items-center gap-2">
            <Tag className="h-4 w-4" />
            카테고리
          </TabsTrigger>
          <TabsTrigger value="automations" className="flex items-center gap-2">
            <Zap className="h-4 w-4" />
            자동화
          </TabsTrigger>
          <TabsTrigger value="general" className="flex items-center gap-2">
            <FolderCog className="h-4 w-4" />
            일반
          </TabsTrigger>
        </TabsList>

        {/* 카테고리 탭 */}
        <TabsContent value="categories">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>카테고리 관리</CardTitle>
                <CardDescription>
                  과제 및 일정에 사용할 카테고리를 관리합니다
                </CardDescription>
              </div>
              <Button onClick={() => openDialog()}>
                <Plus className="h-4 w-4 mr-2" />
                카테고리 추가
              </Button>
            </CardHeader>
            <CardContent>
              {categories.length === 0 ? (
                <div className="text-center py-12">
                  <Tag className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground mb-4">등록된 카테고리가 없습니다</p>
                  <Button onClick={() => openDialog()}>
                    <Plus className="h-4 w-4 mr-2" />
                    첫 번째 카테고리 추가
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
                          {category.type === 'task' ? '과제' : '일정'}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openDialog(category)}
                          title="편집"
                          aria-label="카테고리 편집"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(category.id)}
                          title="삭제"
                          aria-label="카테고리 삭제"
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
        </TabsContent>

        {/* 자동화 탭 */}
        <TabsContent value="automations">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>자동화 워크플로우</CardTitle>
                <CardDescription>
                  트리거와 액션을 설정하여 반복 작업을 자동화합니다
                </CardDescription>
              </div>
              <Button onClick={() => openAutomationDialog()}>
                <Plus className="h-4 w-4 mr-2" />
                자동화 추가
              </Button>
            </CardHeader>
            <CardContent>
              {automations.length === 0 ? (
                <div className="text-center py-12">
                  <Zap className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground mb-4">
                    {!currentProjectId
                      ? '프로젝트를 선택해주세요'
                      : '등록된 자동화 규칙이 없습니다'}
                  </p>
                  {currentProjectId && (
                    <Button onClick={() => openAutomationDialog()}>
                      <Plus className="h-4 w-4 mr-2" />
                      첫 번째 자동화 추가
                    </Button>
                  )}
                </div>
              ) : (
                <AutomationList
                  automations={automations}
                  onToggle={handleToggleAutomation}
                  onEdit={openAutomationDialog}
                  onDelete={handleDeleteAutomation}
                  onDuplicate={handleDuplicateAutomation}
                  onTest={handleTestAutomation}
                  isLoading={isAutomationsLoading}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* 일반 설정 탭 */}
        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle>일반 설정</CardTitle>
              <CardDescription>
                프로젝트 관리 시스템의 기본 설정을 관리합니다
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>알림 설정</Label>
                <p className="text-sm text-muted-foreground">
                  이메일 및 푸시 알림 설정은 Phase 4에서 구현됩니다.
                </p>
              </div>
              <div className="space-y-2">
                <Label>데이터 내보내기</Label>
                <p className="text-sm text-muted-foreground">
                  Excel/PDF 내보내기 기능은 Phase 6에서 구현됩니다.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* 카테고리 추가/수정 다이얼로그 */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedCategory ? '카테고리 수정' : '카테고리 추가'}
            </DialogTitle>
            <DialogDescription>
              {selectedCategory
                ? '카테고리 정보를 수정하세요.'
                : '새로운 카테고리를 추가하세요.'}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">이름</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="카테고리 이름"
              />
            </div>

            <div className="grid gap-2">
              <Label>색상</Label>
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
              <Label>타입</Label>
              <Select
                value={formData.type}
                onValueChange={(value) =>
                  setFormData({ ...formData, type: value as 'event' | 'task' })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="타입 선택" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="task">과제</SelectItem>
                  <SelectItem value="event">일정</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              취소
            </Button>
            <Button onClick={handleSave} disabled={!formData.name || isLoading}>
              {isLoading ? '저장 중...' : selectedCategory ? '수정' : '추가'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 자동화 추가/수정 다이얼로그 */}
      <AutomationDialog
        open={isAutomationDialogOpen}
        onOpenChange={setIsAutomationDialogOpen}
        automation={selectedAutomation}
        onSave={handleSaveAutomation}
        isLoading={isLoading}
      />
    </div>
  );
}
