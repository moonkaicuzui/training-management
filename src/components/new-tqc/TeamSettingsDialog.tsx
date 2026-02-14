import { useState } from 'react';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();
  const [editingTeam, setEditingTeam] = useState<NewTQCTeam | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            {t('newTqc.settings.teamSettingsTitle')}
          </DialogTitle>
          <DialogDescription>
            {t('newTqc.settings.teamSettingsDesc')}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-auto">
          {/* Team List Table */}
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('newTqc.settings.teamName')}</TableHead>
                  <TableHead>{t('newTqc.settings.vietnameseName')}</TableHead>
                  <TableHead>{t('newTqc.settings.factory')}</TableHead>
                  <TableHead>{t('newTqc.settings.line')}</TableHead>
                  <TableHead className="text-center">{t('common.status')}</TableHead>
                  <TableHead className="text-right">{t('newTqc.settings.actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {teams.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      {t('newTqc.settings.noTeams')}
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
                          {team.is_active ? t('newTqc.settings.active') : t('newTqc.settings.inactive')}
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
                              if (confirm(t('newTqc.settings.confirmDelete', { name: team.team_name }))) {
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
            {t('newTqc.settings.close')}
          </Button>
          <Button
            onClick={() => {
              setEditingTeam(null);
              setIsFormOpen(true);
            }}
          >
            <Plus className="h-4 w-4 mr-1" />
            {t('newTqc.settings.addTeam')}
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

// 초기 폼 데이터 계산 함수
function getInitialTeamFormData(team: NewTQCTeam | null): NewTQCTeamInput {
  if (team) {
    return {
      team_name: team.team_name,
      team_name_vn: team.team_name_vn,
      factory: team.factory,
      line: team.line,
    };
  }
  return {
    team_name: '',
    team_name_vn: undefined,
    factory: undefined,
    line: undefined,
  };
}

function TeamFormDialog({ open, onClose, team, onSubmit, isSaving }: TeamFormDialogProps) {
  const { t } = useTranslation();
  const isEdit = !!team;

  // 초기값으로 폼 데이터 설정
  const [formData, setFormData] = useState<NewTQCTeamInput>(() => getInitialTeamFormData(team));
  const [errors, setErrors] = useState<Record<string, string>>({});

  // team이 변경될 때 폼 리셋 (useEffect 대신 조건부 상태 업데이트 사용)
  const teamId = team?.team_id ?? 'new';
  const [lastTeamId, setLastTeamId] = useState(teamId);

  if (teamId !== lastTeamId) {
    setFormData(getInitialTeamFormData(team));
    setErrors({});
    setLastTeamId(teamId);
  }

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.team_name.trim()) {
      newErrors.team_name = t('newTqc.settings.teamNameRequired');
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
          <DialogTitle>{isEdit ? t('newTqc.settings.editTeam') : t('newTqc.settings.newTeam')}</DialogTitle>
          <DialogDescription>
            {isEdit ? t('newTqc.settings.editTeamDesc') : t('newTqc.settings.newTeamDesc')}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {/* Team Name */}
          <div className="space-y-2">
            <Label htmlFor="team_name">
              {t('newTqc.settings.teamName')} <span className="text-destructive">*</span>
            </Label>
            <Input
              id="team_name"
              value={formData.team_name}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, team_name: e.target.value }))
              }
              placeholder={t('newTqc.settings.exampleTeam')}
              className={errors.team_name ? 'border-destructive' : ''}
            />
            {errors.team_name && (
              <p className="text-xs text-destructive">{errors.team_name}</p>
            )}
          </div>

          {/* Team Name (Vietnamese) */}
          <div className="space-y-2">
            <Label htmlFor="team_name_vn">{t('newTqc.settings.vnNameOptional')}</Label>
            <Input
              id="team_name_vn"
              value={formData.team_name_vn || ''}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  team_name_vn: e.target.value || undefined,
                }))
              }
              placeholder={t('newTqc.settings.exampleVnName')}
            />
          </div>

          {/* Factory */}
          <div className="space-y-2">
            <Label htmlFor="factory">{t('newTqc.settings.factoryOptional')}</Label>
            <Input
              id="factory"
              value={formData.factory || ''}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  factory: e.target.value || undefined,
                }))
              }
              placeholder={t('newTqc.settings.exampleFactory')}
            />
          </div>

          {/* Line */}
          <div className="space-y-2">
            <Label htmlFor="line">{t('newTqc.settings.lineOptional')}</Label>
            <Input
              id="line"
              value={formData.line || ''}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  line: e.target.value || undefined,
                }))
              }
              placeholder={t('newTqc.settings.exampleLine')}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSaving}>
            {t('common.cancel')}
          </Button>
          <Button onClick={handleSubmit} disabled={isSaving}>
            {isSaving ? t('common.saving') : isEdit ? t('common.edit') : t('common.add')}
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
  const { t } = useTranslation();
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
        {team.is_active ? t('newTqc.settings.active') : t('newTqc.settings.inactive')}
      </span>
    </div>
  );
}
