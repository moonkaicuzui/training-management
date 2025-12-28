import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
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
import { Badge } from '@/components/ui/badge';
import type { NewTQCTeam, NewTQCTeamInput, NewTQCTeamUpdate } from '@/types/newTqc';

interface TeamSettingsDialogProps {
  open: boolean;
  onClose: () => void;
  teams: NewTQCTeam[];
  onCreateTeam: (input: NewTQCTeamInput) => Promise<void>;
  onUpdateTeam: (input: NewTQCTeamUpdate) => Promise<void>;
  onDeleteTeam: (teamId: string) => Promise<void>;
}

export function TeamSettingsDialog({
  open,
  onClose,
  teams,
  onCreateTeam,
  onUpdateTeam,
  onDeleteTeam,
}: TeamSettingsDialogProps) {
  const [editingTeam, setEditingTeam] = useState<NewTQCTeam | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            팀 설정 관리
          </DialogTitle>
          <DialogDescription>
            배치예정팀 목록을 관리합니다. 팀 추가, 수정, 삭제가 가능합니다.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-auto">
          {/* Team List Table */}
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>팀 이름</TableHead>
                  <TableHead>베트남어</TableHead>
                  <TableHead>공장</TableHead>
                  <TableHead>라인</TableHead>
                  <TableHead className="text-center">상태</TableHead>
                  <TableHead className="text-right">작업</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {teams.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      등록된 팀이 없습니다.
                    </TableCell>
                  </TableRow>
                ) : (
                  teams.map((team) => (
                    <TableRow key={team.team_id}>
                      <TableCell className="font-medium">{team.team_name}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {team.team_name_vn || '-'}
                      </TableCell>
                      <TableCell>{team.factory || '-'}</TableCell>
                      <TableCell>{team.line || '-'}</TableCell>
                      <TableCell className="text-center">
                        <Badge variant={team.is_active ? 'success' : 'secondary'}>
                          {team.is_active ? '활성' : '비활성'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setEditingTeam(team);
                              setIsFormOpen(true);
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:text-destructive"
                            onClick={() => {
                              if (confirm(`'${team.team_name}' 팀을 삭제하시겠습니까?`)) {
                                onDeleteTeam(team.team_id);
                              }
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={onClose}>
            닫기
          </Button>
          <Button
            onClick={() => {
              setEditingTeam(null);
              setIsFormOpen(true);
            }}
          >
            <Plus className="h-4 w-4 mr-1" />
            팀 추가
          </Button>
        </DialogFooter>
      </DialogContent>

      {/* Team Form Dialog */}
      <TeamFormDialog
        open={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingTeam(null);
        }}
        team={editingTeam}
        onSubmit={async (data) => {
          setSaving(true);
          try {
            if (editingTeam) {
              await onUpdateTeam({ team_id: editingTeam.team_id, ...data });
            } else {
              await onCreateTeam(data);
            }
            setIsFormOpen(false);
            setEditingTeam(null);
          } finally {
            setSaving(false);
          }
        }}
        isSaving={saving}
      />
    </Dialog>
  );
}

// Team Form Dialog (used for both create and edit)
interface TeamFormDialogProps {
  open: boolean;
  onClose: () => void;
  team: NewTQCTeam | null;
  onSubmit: (data: NewTQCTeamInput) => Promise<void>;
  isSaving?: boolean;
}

function TeamFormDialog({ open, onClose, team, onSubmit, isSaving }: TeamFormDialogProps) {
  const isEdit = !!team;
  const [formData, setFormData] = useState<NewTQCTeamInput>({
    team_name: '',
    team_name_vn: undefined,
    factory: undefined,
    line: undefined,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (team) {
      setFormData({
        team_name: team.team_name,
        team_name_vn: team.team_name_vn,
        factory: team.factory,
        line: team.line,
      });
    } else {
      setFormData({
        team_name: '',
        team_name_vn: undefined,
        factory: undefined,
        line: undefined,
      });
    }
    setErrors({});
  }, [team, open]);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.team_name.trim()) {
      newErrors.team_name = '팀 이름을 입력하세요.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    await onSubmit(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>{isEdit ? '팀 수정' : '새 팀 추가'}</DialogTitle>
          <DialogDescription>
            {isEdit ? '팀 정보를 수정합니다.' : '새로운 배치예정팀을 추가합니다.'}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {/* Team Name */}
          <div className="space-y-2">
            <Label htmlFor="team_name">
              팀 이름 <span className="text-destructive">*</span>
            </Label>
            <Input
              id="team_name"
              value={formData.team_name}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, team_name: e.target.value }))
              }
              placeholder="예: ASSEMBLY"
              className={errors.team_name ? 'border-destructive' : ''}
            />
            {errors.team_name && (
              <p className="text-xs text-destructive">{errors.team_name}</p>
            )}
          </div>

          {/* Team Name (Vietnamese) */}
          <div className="space-y-2">
            <Label htmlFor="team_name_vn">베트남어 이름 (선택)</Label>
            <Input
              id="team_name_vn"
              value={formData.team_name_vn || ''}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  team_name_vn: e.target.value || undefined,
                }))
              }
              placeholder="예: Lắp ráp"
            />
          </div>

          {/* Factory */}
          <div className="space-y-2">
            <Label htmlFor="factory">공장 (선택)</Label>
            <Input
              id="factory"
              value={formData.factory || ''}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  factory: e.target.value || undefined,
                }))
              }
              placeholder="예: Building A"
            />
          </div>

          {/* Line */}
          <div className="space-y-2">
            <Label htmlFor="line">라인 (선택)</Label>
            <Input
              id="line"
              value={formData.line || ''}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  line: e.target.value || undefined,
                }))
              }
              placeholder="예: Line 1"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSaving}>
            취소
          </Button>
          <Button onClick={handleSubmit} disabled={isSaving}>
            {isSaving ? '저장 중...' : isEdit ? '수정' : '추가'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Toggle team active status component
interface TeamActiveToggleProps {
  team: NewTQCTeam;
  onToggle: (teamId: string, isActive: boolean) => Promise<void>;
}

export function TeamActiveToggle({ team, onToggle }: TeamActiveToggleProps) {
  const [isUpdating, setIsUpdating] = useState(false);

  const handleToggle = async (checked: boolean) => {
    setIsUpdating(true);
    try {
      await onToggle(team.team_id, checked);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Switch
        checked={team.is_active}
        onCheckedChange={handleToggle}
        disabled={isUpdating}
      />
      <span className="text-sm text-muted-foreground">
        {team.is_active ? '활성' : '비활성'}
      </span>
    </div>
  );
}
