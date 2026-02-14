import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/utils/logger';
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
  const { t } = useTranslation();
  const { toast } = useToast();

  const traineeDetails = useNewTQCSelectedTrainee();
  const teams = useNewTQCTeams();
  const loading = useNewTQCLoading();
  const {
    fetchTraineeDetail,
    fetchTeams,
    createColorBlindTest,
    updateMeeting,
    updateTrainee,
    updateTrainingStage,
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
            title: t('newTqc.traineeDetail.loadError'),
            description: t('newTqc.traineeDetail.loadErrorDesc'),
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
        title: t('newTqc.traineeDetail.colorBlindSuccess'),
        description: t('newTqc.traineeDetail.colorBlindSuccessDesc'),
      });
    } catch {
      toast({
        variant: 'destructive',
        title: t('newTqc.traineeDetail.colorBlindError'),
        description: t('newTqc.traineeDetail.colorBlindErrorDesc'),
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
        title: t('newTqc.traineeDetail.meetingComplete'),
        description: t('newTqc.traineeDetail.meetingCompleteDesc'),
      });
    } catch {
      toast({
        variant: 'destructive',
        title: t('newTqc.traineeDetail.meetingUpdateError'),
        description: t('newTqc.traineeDetail.meetingUpdateErrorDesc'),
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
            {team?.team_name || trainee.team_id} • {trainee.trainer_id} {t('newTqc.traineeDetail.trainerLabel')} • {t('newTqc.traineeDetail.weekLabel', { week: trainee.start_week })}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setEditDialogOpen(true)}>
            <Edit className="h-4 w-4 mr-2" />
            {t('newTqc.traineeDetail.edit')}
          </Button>
          {trainee.status === 'IN_TRAINING' && (
            <Button
              variant="destructive"
              onClick={() => navigate(`/new-tqc/trainees/${id}/resign`)}
            >
              <UserMinus className="h-4 w-4 mr-2" />
              {t('newTqc.traineeDetail.processResign')}
            </Button>
          )}
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">{t('newTqc.traineeDetail.tabOverview')}</TabsTrigger>
          <TabsTrigger value="training">{t('newTqc.traineeDetail.tabTraining')}</TabsTrigger>
          <TabsTrigger value="meetings">{t('newTqc.traineeDetail.tabMeetings')}</TabsTrigger>
          <TabsTrigger value="colorblind">{t('newTqc.traineeDetail.tabColorBlind')}</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Basic Info Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{t('newTqc.traineeDetail.basicInfo')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">{t('newTqc.traineeDetail.name')}</p>
                    <p className="font-medium">{trainee.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{t('newTqc.traineeDetail.employeeId')}</p>
                    <p className="font-medium">{trainee.employee_id || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{t('newTqc.traineeDetail.assignedTeam')}</p>
                    <p className="font-medium">{team?.team_name || trainee.team_id}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{t('newTqc.traineeDetail.assignedTrainer')}</p>
                    <p className="font-medium">{trainee.trainer_id}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{t('newTqc.traineeDetail.startDate')}</p>
                    <p className="font-medium">
                      {format(new Date(trainee.start_date), 'yyyy-MM-dd')} ({t('newTqc.traineeDetail.weekLabel', { week: trainee.start_week })})
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{t('newTqc.traineeDetail.introducer')}</p>
                    <p className="font-medium">{trainee.introducer || '-'}</p>
                  </div>
                </div>

                <Separator />

                <div>
                  <p className="text-sm text-muted-foreground mb-2">{t('newTqc.traineeDetail.colorBlindStatus')}</p>
                  <ColorBlindBadge result={trainee.color_blind_status} />
                </div>
              </CardContent>
            </Card>

            {/* Progress Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{t('newTqc.traineeDetail.trainingProgress')}</CardTitle>
                <CardDescription>
                  {t('newTqc.traineeDetail.trainingProgressDesc')}
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
                      <p className="text-xs text-muted-foreground">{t('newTqc.traineeDetail.completed')}</p>
                    </div>
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <p className="text-2xl font-bold text-primary">
                        {stages.filter((s) => s.status === 'IN_PROGRESS').length}
                      </p>
                      <p className="text-xs text-muted-foreground">{t('newTqc.traineeDetail.inProgress')}</p>
                    </div>
                    <div className="p-2 bg-muted rounded-lg">
                      <p className="text-2xl font-bold text-muted-foreground">
                        {stages.filter((s) => s.status === 'PENDING').length}
                      </p>
                      <p className="text-xs text-muted-foreground">{t('newTqc.traineeDetail.pending')}</p>
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
                {t('newTqc.traineeDetail.meetingSchedule')}
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
                {t('newTqc.traineeDetail.trainingStages')}
              </CardTitle>
              <CardDescription>
                {t('newTqc.traineeDetail.trainingStagesDesc')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <TrainingStageTimeline
                stages={stages}
                onStageClick={async (stage) => {
                  // Cycle through stage statuses: PENDING -> IN_PROGRESS -> COMPLETED -> PENDING
                  const statusOrder = ['PENDING', 'IN_PROGRESS', 'COMPLETED'] as const;
                  const currentIndex = statusOrder.indexOf(stage.status);
                  const nextStatus = statusOrder[(currentIndex + 1) % 3];

                  try {
                    await updateTrainingStage({
                      stage_id: stage.stage_id,
                      status: nextStatus,
                    });
                    const statusLabel = nextStatus === 'COMPLETED' ? t('newTqc.traineeDetail.completed') : nextStatus === 'IN_PROGRESS' ? t('newTqc.traineeDetail.inProgress') : t('newTqc.traineeDetail.pending');
                    toast({
                      title: t('newTqc.traineeDetail.stageUpdated'),
                      description: t('newTqc.traineeDetail.stageUpdatedTo', { stage: stage.stage_name, status: statusLabel }),
                    });
                    // Refresh trainee detail
                    if (id) {
                      fetchTraineeDetail(id);
                    }
                  } catch (error) {
                    logger.error('Failed to update stage:', error);
                    toast({
                      title: t('newTqc.traineeDetail.error'),
                      description: t('newTqc.traineeDetail.stageUpdateErrorDesc'),
                      variant: 'destructive',
                    });
                  }
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
          try {
            await updateTrainee({
              trainee_id: trainee.trainee_id,
              ...data,
            });
            toast({
              title: t('newTqc.traineeDetail.traineeUpdated'),
              description: t('newTqc.traineeDetail.traineeUpdatedDesc'),
            });
            setEditDialogOpen(false);
            // Refresh trainee detail
            if (id) {
              fetchTraineeDetail(id);
            }
          } catch (error) {
            logger.error('Failed to update trainee:', error);
            toast({
              title: t('newTqc.traineeDetail.error'),
              description: t('newTqc.traineeDetail.traineeUpdateErrorDesc'),
              variant: 'destructive',
            });
          }
        }}
        trainee={trainee}
        teams={teams}
      />
    </div>
  );
}
