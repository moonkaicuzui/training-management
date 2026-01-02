import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import {
  ArrowLeft,
  Edit,
  UserMinus,
  Calendar,
  GraduationCap,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { PageLoading } from '@/components/common/LoadingSpinner';
import {
  TraineeStatusBadge,
  ColorBlindBadge,
  TrainingStageTimeline,
  ColorBlindTestSection,
  MeetingScheduleCard,
  TraineeFormDialog,
} from '@/components/new-tqc';
import {
  useNewTQCSelectedTrainee,
  useNewTQCTeams,
  useNewTQCLoading,
  useNewTQCActions,
} from '@/stores/newTqcStore';
import { format } from 'date-fns';
import type { NewTQCColorBlindTestInput } from '@/types/newTqc';

export default function NewTQCTraineeDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const traineeDetails = useNewTQCSelectedTrainee();
  const teams = useNewTQCTeams();
  const loading = useNewTQCLoading();
  const {
    fetchTraineeDetail,
    fetchTeams,
    createColorBlindTest,
    updateMeeting,
  } = useNewTQCActions();

  const [editDialogOpen, setEditDialogOpen] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      if (id) {
        try {
          await Promise.all([fetchTraineeDetail(id), fetchTeams()]);
        } catch {
          toast({
            variant: 'destructive',
            title: '데이터 로드 실패',
            description: '교육생 정보를 불러오는데 실패했습니다.',
          });
        }
      }
    };
    loadData();
  }, [id]);

  if (loading.traineeDetail || !traineeDetails) {
    return <PageLoading />;
  }

  // traineeDetails extends NewTQCTrainee with stages, colorBlindTests, meetings
  const trainee = traineeDetails;
  const { stages, colorBlindTests, meetings } = traineeDetails;
  const team = teams.find((t) => t.team_id === trainee.team_id);

  const handleColorBlindTest = async (input: NewTQCColorBlindTestInput) => {
    try {
      await createColorBlindTest(input);
      if (id) await fetchTraineeDetail(id);
      toast({
        title: '색맹 검사 완료',
        description: '검사 결과가 저장되었습니다.',
      });
    } catch {
      toast({
        variant: 'destructive',
        title: '저장 실패',
        description: '색맹 검사 결과 저장에 실패했습니다.',
      });
    }
  };

  const handleMeetingComplete = async (meetingId: string) => {
    try {
      await updateMeeting({
        meeting_id: meetingId,
        status: 'COMPLETED',
        completed_date: new Date().toISOString().split('T')[0],
      });
      if (id) await fetchTraineeDetail(id);
      toast({
        title: '미팅 완료',
        description: '미팅이 완료 처리되었습니다.',
      });
    } catch {
      toast({
        variant: 'destructive',
        title: '업데이트 실패',
        description: '미팅 상태 변경에 실패했습니다.',
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/new-tqc/trainees')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight">{trainee.name}</h1>
            <TraineeStatusBadge status={trainee.status} />
          </div>
          <p className="text-muted-foreground">
            {team?.team_name || trainee.team_id} • {trainee.trainer_id} 트레이너 • {trainee.start_week}주차
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setEditDialogOpen(true)}>
            <Edit className="h-4 w-4 mr-2" />
            수정
          </Button>
          {trainee.status === 'IN_TRAINING' && (
            <Button
              variant="destructive"
              onClick={() => navigate(`/new-tqc/trainees/${id}/resign`)}
            >
              <UserMinus className="h-4 w-4 mr-2" />
              퇴사 처리
            </Button>
          )}
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">개요</TabsTrigger>
          <TabsTrigger value="training">교육 진행</TabsTrigger>
          <TabsTrigger value="meetings">미팅</TabsTrigger>
          <TabsTrigger value="colorblind">Color Blind 검사</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Basic Info Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">기본 정보</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">이름</p>
                    <p className="font-medium">{trainee.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">사번</p>
                    <p className="font-medium">{trainee.employee_id || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">배치예정팀</p>
                    <p className="font-medium">{team?.team_name || trainee.team_id}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">담당 트레이너</p>
                    <p className="font-medium">{trainee.trainer_id}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">시작일</p>
                    <p className="font-medium">
                      {format(new Date(trainee.start_date), 'yyyy-MM-dd')} ({trainee.start_week}주차)
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">소개자</p>
                    <p className="font-medium">{trainee.introducer || '-'}</p>
                  </div>
                </div>

                <Separator />

                <div>
                  <p className="text-sm text-muted-foreground mb-2">Color Blind 상태</p>
                  <ColorBlindBadge result={trainee.color_blind_status} />
                </div>
              </CardContent>
            </Card>

            {/* Progress Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">교육 진행률</CardTitle>
                <CardDescription>
                  전체 교육 과정 진행 현황
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Progress Circle */}
                  <div className="flex items-center justify-center">
                    <div className="relative w-32 h-32">
                      <svg className="w-full h-full transform -rotate-90">
                        <circle
                          cx="64"
                          cy="64"
                          r="56"
                          stroke="currentColor"
                          strokeWidth="12"
                          fill="none"
                          className="text-muted"
                        />
                        <circle
                          cx="64"
                          cy="64"
                          r="56"
                          stroke="currentColor"
                          strokeWidth="12"
                          fill="none"
                          strokeDasharray={`${(trainee.progress_percentage / 100) * 352} 352`}
                          className="text-primary"
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-2xl font-bold">
                          {trainee.progress_percentage}%
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Stage Summary */}
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="p-2 bg-status-pass/10 rounded-lg">
                      <p className="text-2xl font-bold text-status-pass">
                        {stages.filter((s) => s.status === 'COMPLETED').length}
                      </p>
                      <p className="text-xs text-muted-foreground">완료</p>
                    </div>
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <p className="text-2xl font-bold text-primary">
                        {stages.filter((s) => s.status === 'IN_PROGRESS').length}
                      </p>
                      <p className="text-xs text-muted-foreground">진행중</p>
                    </div>
                    <div className="p-2 bg-muted rounded-lg">
                      <p className="text-2xl font-bold text-muted-foreground">
                        {stages.filter((s) => s.status === 'PENDING').length}
                      </p>
                      <p className="text-xs text-muted-foreground">대기</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Upcoming Meetings Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                미팅 일정
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                {meetings.map((meeting) => (
                  <MeetingScheduleCard
                    key={meeting.meeting_id}
                    meeting={meeting}
                    onComplete={handleMeetingComplete}
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Training Tab */}
        <TabsContent value="training">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <GraduationCap className="h-5 w-5" />
                교육 단계
              </CardTitle>
              <CardDescription>
                교육 진행 단계별 현황입니다. 클릭하여 상태를 변경할 수 있습니다.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <TrainingStageTimeline
                stages={stages}
                onStageClick={(stage) => {
                  // TODO: Open stage edit dialog
                  console.log('Stage clicked:', stage);
                }}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Meetings Tab */}
        <TabsContent value="meetings">
          <div className="grid gap-4 md:grid-cols-3">
            {meetings.map((meeting) => (
              <MeetingScheduleCard
                key={meeting.meeting_id}
                meeting={meeting}
                onComplete={handleMeetingComplete}
              />
            ))}
          </div>
        </TabsContent>

        {/* Color Blind Tab */}
        <TabsContent value="colorblind">
          <ColorBlindTestSection
            traineeId={trainee.trainee_id}
            traineeName={trainee.name}
            currentStatus={trainee.color_blind_status}
            tests={colorBlindTests}
            onAddTest={handleColorBlindTest}
          />
        </TabsContent>
      </Tabs>

      {/* Edit Dialog */}
      <TraineeFormDialog
        open={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
        onSubmit={async (data) => {
          // TODO: Implement update
          console.log('Update trainee:', data);
          setEditDialogOpen(false);
        }}
        trainee={trainee}
        teams={teams}
      />
    </div>
  );
}
