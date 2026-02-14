import { useEffect, useState, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useToast } from '@/hooks/use-toast';
import {
  Plus,
  MoreHorizontal,
  Eye,
  Edit,
  UserMinus,
  Download,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { PageLoading } from '@/components/common/LoadingSpinner';
import {
  TraineeStatusBadge,
  ColorBlindBadge,
  TraineeFilters,
  TraineeFormDialog,
} from '@/components/new-tqc';
import {
  useNewTQCTrainees,
  useNewTQCTeams,
  useNewTQCTraineeFilters,
  useNewTQCLoading,
  useNewTQCActions,
} from '@/stores/newTqcStore';
import { NEW_TQC_TRAINERS } from '@/types/newTqc';
import type { NewTQCTrainee, NewTQCTraineeFilters as FiltersType, NewTQCTraineeInput } from '@/types/newTqc';
import { BUILDINGS, WORKING_AREAS } from '@/data/constants';
import { format } from 'date-fns';

export default function NewTQCTrainees() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { toast } = useToast();

  const trainees = useNewTQCTrainees();
  const teams = useNewTQCTeams();
  const filters = useNewTQCTraineeFilters();
  const loading = useNewTQCLoading();
  const {
    fetchTrainees,
    fetchTeams,
    setTraineeFilters,
    createTrainee,
  } = useNewTQCActions();

  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [editingTrainee, setEditingTrainee] = useState<NewTQCTrainee | null>(null);

  // Initialize from URL params
  useEffect(() => {
    const urlFilters: FiltersType = {};
    const status = searchParams.get('status');
    const team = searchParams.get('team');
    const trainer = searchParams.get('trainer');

    if (status) urlFilters.status = status as FiltersType['status'];
    if (team) urlFilters.team = team;
    if (trainer) urlFilters.trainer = trainer;

    if (Object.keys(urlFilters).length > 0) {
      setTraineeFilters(urlFilters);
    }
  }, []);

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      try {
        await Promise.all([fetchTeams(), fetchTrainees(filters)]);
      } catch {
        toast({
          variant: 'destructive',
          title: t('messages.loadError'),
          description: t('newTQCModule.trainees.loadErrorDesc'),
        });
      }
    };
    fetchData();
  }, [filters]);

  // Filter trainees based on current filters
  const filteredTrainees = useMemo(() => {
    return trainees.filter((trainee) => {
      if (filters.status && filters.status !== 'all' && trainee.status !== filters.status) return false;
      if (filters.team && filters.team !== 'all' && trainee.team_id !== filters.team) return false;
      if (filters.trainer && filters.trainer !== 'all' && trainee.trainer_id !== filters.trainer) return false;
      if (filters.startWeek && trainee.start_week !== parseInt(filters.startWeek)) return false;
      if (filters.search) {
        const search = filters.search.toLowerCase();
        if (
          !trainee.name.toLowerCase().includes(search) &&
          !(trainee.employee_id?.toLowerCase().includes(search))
        ) {
          return false;
        }
      }
      return true;
    });
  }, [trainees, filters]);

  const handleFiltersChange = (newFilters: FiltersType) => {
    setTraineeFilters(newFilters);
    // Update URL params
    const params = new URLSearchParams();
    if (newFilters.status && newFilters.status !== 'all') params.set('status', newFilters.status);
    if (newFilters.team && newFilters.team !== 'all') params.set('team', newFilters.team);
    if (newFilters.trainer && newFilters.trainer !== 'all') params.set('trainer', newFilters.trainer);
    setSearchParams(params);
  };

  const handleClearFilters = () => {
    setTraineeFilters({});
    setSearchParams({});
  };

  const handleCreateTrainee = async (data: NewTQCTraineeInput) => {
    await createTrainee(data);
    setFormDialogOpen(false);
    await fetchTrainees(filters);
  };

  if (loading.teams && teams.length === 0) {
    return <PageLoading />;
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t('newTQCModule.trainees.title')}</h1>
          <p className="text-muted-foreground">
            {t('newTQCModule.trainees.countDesc', { count: filteredTrainees.length })}
            {filters.status && filters.status !== 'all' && ` (${filters.status})`}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            {t('common.export')}
          </Button>
          <Button onClick={() => setFormDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            {t('newTQCModule.trainees.register')}
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <TraineeFilters
            filters={filters}
            teams={teams}
            trainers={[...NEW_TQC_TRAINERS]}
            onFiltersChange={handleFiltersChange}
            onClear={handleClearFilters}
          />
        </CardContent>
      </Card>

      {/* Trainees Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('common.name')}</TableHead>
                <TableHead>{t('newTQCModule.trainees.employeeId')}</TableHead>
                <TableHead>{t('newTQCModule.trainees.assignedTeam')}</TableHead>
                <TableHead>{t('newTqc.traineeForm.building')}</TableHead>
                <TableHead>{t('newTqc.traineeForm.workingArea')}</TableHead>
                <TableHead>{t('newTQCModule.trainees.trainer')}</TableHead>
                <TableHead>{t('newTQCModule.trainees.week')}</TableHead>
                <TableHead>{t('newTQCModule.trainees.startDate')}</TableHead>
                <TableHead>{t('common.status')}</TableHead>
                <TableHead>Color Blind</TableHead>
                <TableHead>{t('newTQCModule.trainees.progress')}</TableHead>
                <TableHead className="text-right">{t('common.actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading.trainees ? (
                <TableRow>
                  <TableCell colSpan={12} className="text-center py-8">
                    <div className="flex items-center justify-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary" />
                      {t('common.loading')}
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredTrainees.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={12} className="text-center py-8 text-muted-foreground">
                    {t('common.noData')}
                  </TableCell>
                </TableRow>
              ) : (
                filteredTrainees.map((trainee) => (
                  <TableRow
                    key={trainee.trainee_id}
                    className="cursor-pointer hover:bg-accent"
                    onClick={() => navigate(`/new-tqc/trainees/${trainee.trainee_id}`)}
                  >
                    <TableCell className="font-medium">{trainee.name}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {trainee.employee_id || '-'}
                    </TableCell>
                    <TableCell>
                      {teams.find((t) => t.team_id === trainee.team_id)?.team_name ||
                        trainee.team_id}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {trainee.building
                        ? BUILDINGS.find((b) => b.value === trainee.building)?.label || trainee.building
                        : '-'}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {trainee.working_area
                        ? WORKING_AREAS.find((a) => a.value === trainee.working_area)?.label || trainee.working_area
                        : '-'}
                    </TableCell>
                    <TableCell>{trainee.trainer_id}</TableCell>
                    <TableCell>{trainee.start_week}{t('newTQCModule.trainees.weekUnit')}</TableCell>
                    <TableCell>
                      {format(new Date(trainee.start_date), 'yyyy-MM-dd')}
                    </TableCell>
                    <TableCell>
                      <TraineeStatusBadge status={trainee.status} />
                    </TableCell>
                    <TableCell>
                      <ColorBlindBadge result={trainee.color_blind_status} />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary transition-all"
                            style={{ width: `${trainee.progress_percentage}%` }}
                          />
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {trainee.progress_percentage}%
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/new-tqc/trainees/${trainee.trainee_id}`);
                            }}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            {t('program.viewDetail')}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingTrainee(trainee);
                              setFormDialogOpen(true);
                            }}
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            {t('common.edit')}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          {trainee.status === 'IN_TRAINING' && (
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/new-tqc/trainees/${trainee.trainee_id}/resign`);
                              }}
                            >
                              <UserMinus className="h-4 w-4 mr-2" />
                              {t('newTQCModule.trainees.processResignation')}
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <TraineeFormDialog
        open={formDialogOpen}
        onClose={() => {
          setFormDialogOpen(false);
          setEditingTrainee(null);
        }}
        onSubmit={handleCreateTrainee}
        trainee={editingTrainee}
        teams={teams}
      />
    </div>
  );
}
