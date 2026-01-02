import { useEffect, useState } from 'react';
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
import { format } from 'date-fns';

export default function NewTQCSettings() {
  const { toast } = useToast();

  const teams = useNewTQCTeams();
  const loading = useNewTQCLoading();
  const { fetchTeams, createTeam, updateTeam, deleteTeam } = useNewTQCActions();

  const [teamDialogOpen, setTeamDialogOpen] = useState(false);

  useEffect(() => {
    const loadTeams = async () => {
      try {
        await fetchTeams(true); // Include inactive teams
      } catch {
        toast({
          variant: 'destructive',
          title: '데이터 로드 실패',
          description: '팀 목록을 불러오는데 실패했습니다.',
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
        title: '상태 변경 완료',
        description: `팀이 ${isActive ? '활성화' : '비활성화'}되었습니다.`,
      });
    } catch {
      toast({
        variant: 'destructive',
        title: '상태 변경 실패',
        description: '팀 상태 변경에 실패했습니다.',
      });
    }
  };

  if (loading.teams && teams.length === 0) {
    return <PageLoading />;
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">설정</h1>
          <p className="text-muted-foreground">
            신입 TQC 교육 모듈 설정 관리
          </p>
        </div>
      </div>

      <Tabs defaultValue="teams" className="space-y-6">
        <TabsList>
          <TabsTrigger value="teams" className="gap-2">
            <Building className="h-4 w-4" />
            팀 관리
          </TabsTrigger>
          <TabsTrigger value="trainers" className="gap-2">
            <User className="h-4 w-4" />
            트레이너
          </TabsTrigger>
          <TabsTrigger value="stages" className="gap-2">
            <Settings className="h-4 w-4" />
            교육 단계
          </TabsTrigger>
        </TabsList>

        {/* Teams Tab */}
        <TabsContent value="teams">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Building className="h-5 w-5" />
                  배치예정팀 관리
                </CardTitle>
                <CardDescription>
                  교육생 배치 예정 팀을 관리합니다.
                </CardDescription>
              </div>
              <Button onClick={() => setTeamDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                팀 추가
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>팀 이름</TableHead>
                    <TableHead>베트남어</TableHead>
                    <TableHead>공장</TableHead>
                    <TableHead>라인</TableHead>
                    <TableHead className="text-center">상태</TableHead>
                    <TableHead>생성일</TableHead>
                    <TableHead className="text-right">작업</TableHead>
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
                            {team.is_active ? '활성' : '비활성'}
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
                            onClick={() => {
                              // TODO: Open edit dialog
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
                                deleteTeam(team.team_id);
                              }
                            }}
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
                트레이너 목록
              </CardTitle>
              <CardDescription>
                신입 교육 담당 트레이너 명단입니다.
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
                        <p className="text-sm text-muted-foreground">트레이너</p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
              <p className="text-sm text-muted-foreground mt-4">
                ※ 트레이너 관리는 별도 시스템에서 진행됩니다.
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
                기본 교육 단계
              </CardTitle>
              <CardDescription>
                신입 교육생에게 적용되는 기본 교육 단계입니다.
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
                        기본 교육 단계
                      </p>
                    </div>
                    <Badge variant="outline">1주</Badge>
                  </div>
                ))}
              </div>
              <p className="text-sm text-muted-foreground mt-4">
                ※ 교육 단계 수정은 관리자에게 문의하세요.
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
    </div>
  );
}
