import { useEffect, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useToast } from '@/hooks/use-toast';
import {
  Settings,
  Building,
  User,
  Plus,
  Edit,
  Trash2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PageLoading } from '@/components/common/LoadingSpinner';
import { TeamSettingsDialog } from '@/components/new-tqc';
import {
  useNewTQCTeams,
  useNewTQCLoading,
  useNewTQCActions,
} from '@/stores/newTqcStore';
import { NEW_TQC_TRAINERS, DEFAULT_TRAINING_STAGES } from '@/types/newTqc';
import type { NewTQCTeam } from '@/types/newTqc';
import { format } from 'date-fns';

export default function NewTQCSettings() {
  const { t } = useTranslation();
  const { toast } = useToast();

  const teams = useNewTQCTeams();
  const loading = useNewTQCLoading();
  const { fetchTeams, createTeam, updateTeam, deleteTeam } = useNewTQCActions();

  const [teamDialogOpen, setTeamDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<NewTQCTeam | null>(null);

  useEffect(() => {
    const loadTeams = async () => {
      try {
        await fetchTeams(true); // Include inactive teams
      } catch {
        toast({
          variant: 'destructive',
          title: t('newTqc.settings.loadError'),
          description: t('newTqc.settings.loadErrorDesc'),
        });
      }
    };
    loadTeams();
  }, []);

  const handleTeamActiveToggle = async (teamId: string, isActive: boolean) => {
    try {
      await updateTeam({ team_id: teamId, is_active: isActive });
      await fetchTeams(true);
      toast({
        title: t('newTqc.settings.statusChanged'),
        description: isActive ? t('newTqc.settings.statusActivated') : t('newTqc.settings.statusDeactivated'),
      });
    } catch {
      toast({
        variant: 'destructive',
        title: t('newTqc.settings.statusChangeFailed'),
        description: t('newTqc.settings.statusChangeError'),
      });
    }
  };

  const handleConfirmDelete = useCallback(async () => {
    if (!deleteTarget) return;
    await deleteTeam(deleteTarget.team_id);
    setDeleteTarget(null);
  }, [deleteTarget, deleteTeam]);

  if (loading.teams && teams.length === 0) {
    return <PageLoading />;
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t('newTqc.settings.title')}</h1>
          <p className="text-muted-foreground">
            {t('newTqc.settings.description')}
          </p>
        </div>
      </div>

      <Tabs defaultValue="teams" className="space-y-6">
        <TabsList>
          <TabsTrigger value="teams" className="gap-2">
            <Building className="h-4 w-4" />
            {t('newTqc.settings.teamManagement')}
          </TabsTrigger>
          <TabsTrigger value="trainers" className="gap-2">
            <User className="h-4 w-4" />
            {t('newTqc.settings.trainers')}
          </TabsTrigger>
          <TabsTrigger value="stages" className="gap-2">
            <Settings className="h-4 w-4" />
            {t('newTqc.settings.trainingStages')}
          </TabsTrigger>
        </TabsList>

        {/* Teams Tab */}
        <TabsContent value="teams">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Building className="h-5 w-5" />
                  {t('newTqc.settings.teamManagementTitle')}
                </CardTitle>
                <CardDescription>
                  {t('newTqc.settings.teamManagementDesc')}
                </CardDescription>
              </div>
              <Button onClick={() => setTeamDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                {t('newTqc.settings.addTeam')}
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('newTqc.settings.teamName')}</TableHead>
                    <TableHead>{t('newTqc.settings.vietnameseName')}</TableHead>
                    <TableHead>{t('newTqc.settings.factory')}</TableHead>
                    <TableHead>{t('newTqc.settings.line')}</TableHead>
                    <TableHead className="text-center">{t('common.status')}</TableHead>
                    <TableHead>{t('newTqc.settings.createdDate')}</TableHead>
                    <TableHead className="text-right">{t('newTqc.settings.actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {teams.map((team) => (
                    <TableRow key={team.team_id}>
                      <TableCell className="font-medium">{team.team_name}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {team.team_name_vn || '-'}
                      </TableCell>
                      <TableCell>{team.factory || '-'}</TableCell>
                      <TableCell>{team.line || '-'}</TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-2">
                          <Switch
                            checked={team.is_active}
                            onCheckedChange={(checked) =>
                              handleTeamActiveToggle(team.team_id, checked)
                            }
                          />
                          <span className="text-sm">
                            {team.is_active ? t('newTqc.settings.active') : t('newTqc.settings.inactive')}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {format(new Date(team.created_at), 'yyyy-MM-dd')}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setTeamDialogOpen(true)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:text-destructive"
                            onClick={() => setDeleteTarget(team)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Trainers Tab */}
        <TabsContent value="trainers">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <User className="h-5 w-5" />
                {t('newTqc.settings.trainerList')}
              </CardTitle>
              <CardDescription>
                {t('newTqc.settings.trainerListDesc')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-4">
                {NEW_TQC_TRAINERS.map((trainer) => (
                  <Card key={trainer} className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <User className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{trainer}</p>
                        <p className="text-sm text-muted-foreground">{t('newTqc.settings.trainerLabel')}</p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
              <p className="text-sm text-muted-foreground mt-4">
                {t('newTqc.settings.trainerNote')}
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Training Stages Tab */}
        <TabsContent value="stages">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Settings className="h-5 w-5" />
                {t('newTqc.settings.defaultStages')}
              </CardTitle>
              <CardDescription>
                {t('newTqc.settings.defaultStagesDesc')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {DEFAULT_TRAINING_STAGES.map((stageName, stageIndex) => (
                  <div
                    key={stageName}
                    className="flex items-center gap-4 p-4 border rounded-lg"
                  >
                    <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                      {stageIndex + 1}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{stageName}</p>
                      <p className="text-sm text-muted-foreground">
                        {t('newTqc.settings.defaultStages')}
                      </p>
                    </div>
                    <Badge variant="outline">{t('newTqc.settings.weekDuration')}</Badge>
                  </div>
                ))}
              </div>
              <p className="text-sm text-muted-foreground mt-4">
                {t('newTqc.settings.stagesNote')}
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Team Settings Dialog */}
      <TeamSettingsDialog
        open={teamDialogOpen}
        onClose={() => setTeamDialogOpen(false)}
        teams={teams}
        onCreateTeam={async (input) => {
          await createTeam(input);
          await fetchTeams(true);
        }}
        onUpdateTeam={async (input) => {
          await updateTeam(input);
          await fetchTeams(true);
        }}
        onDeleteTeam={async (teamId) => {
          await deleteTeam(teamId);
          await fetchTeams(true);
        }}
      />

      {/* 팀 삭제 확인 다이얼로그 */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('common.confirmDeleteTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('newTqc.settings.confirmDelete', { name: deleteTarget?.team_name })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t('common.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
