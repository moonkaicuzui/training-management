import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useToast } from '@/hooks/use-toast';
import {
  UserMinus,
  Download,
  TrendingDown,
  Plus,
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
import { PageLoading } from '@/components/common/LoadingSpinner';
import {
  ResignationPieChart,
  ResignationByTeamChart,
  ResignationByMonthChart,
  ResignationStats,
  ResignationFilters,
  ResignationFormDialog,
} from '@/components/new-tqc';
import {
  useNewTQCResignations,
  useNewTQCResignationAnalysis,
  useNewTQCTeams,
  useNewTQCTrainees,
  useNewTQCResignationFilters,
  useNewTQCLoading,
  useNewTQCActions,
} from '@/stores/newTqcStore';
import type { NewTQCResignationFilters as FiltersType, NewTQCResignationInput, ResignationReason } from '@/types/newTqc';
import { format } from 'date-fns';

// Reason labels will be resolved via i18n t() function at render time

export default function NewTQCResignations() {
  const { t } = useTranslation();
  const { toast } = useToast();

  const [formDialogOpen, setFormDialogOpen] = useState(false);

  const REASON_LABELS: Record<ResignationReason, string> = {
    HEALTH_ISSUE: t('newTqc.resignations.reasons.healthIssue'),
    FAMILY_MATTERS: t('newTqc.resignations.reasons.familyMatters'),
    DISTANCE: t('newTqc.resignations.reasons.distance'),
    LOW_SALARY: t('newTqc.resignations.reasons.lowSalary'),
    JOB_CHANGE: t('newTqc.resignations.reasons.jobChange'),
    ABSENCE: t('newTqc.resignations.reasons.absence'),
    ACCIDENT: t('newTqc.resignations.reasons.accident'),
    OTHER: t('newTqc.resignations.reasons.other'),
  };
  const resignations = useNewTQCResignations();
  const analysis = useNewTQCResignationAnalysis();
  const teams = useNewTQCTeams();
  const trainees = useNewTQCTrainees();
  const filters = useNewTQCResignationFilters();
  const loading = useNewTQCLoading();
  const {
    fetchResignations,
    fetchResignationAnalysis,
    fetchTeams,
    fetchTrainees,
    setResignationFilters,
    createResignation,
  } = useNewTQCActions();

  const inTrainingTrainees = useMemo(
    () => trainees.filter((t) => t.status === 'IN_TRAINING'),
    [trainees]
  );

  useEffect(() => {
    const fetchData = async () => {
      try {
        await Promise.all([
          fetchResignations(filters),
          fetchResignationAnalysis(),
          fetchTeams(),
          fetchTrainees(),
        ]);
      } catch {
        toast({
          variant: 'destructive',
          title: t('newTqc.resignations.loadError'),
          description: t('newTqc.resignations.loadErrorDesc'),
        });
      }
    };
    fetchData();
  }, [filters]);

  // Filter resignations
  const filteredResignations = useMemo(() => {
    return resignations.filter((r) => {
      if (filters.reasonCategory && filters.reasonCategory !== 'all' && r.reason_category !== filters.reasonCategory) return false;
      if (filters.team && filters.team !== 'all' && r.trainee_id !== filters.team) return false; // Would need to join with trainee data
      if (filters.dateFrom && r.resign_date < filters.dateFrom) return false;
      if (filters.dateTo && r.resign_date > filters.dateTo) return false;
      return true;
    });
  }, [resignations, filters]);

  const handleFiltersChange = (newFilters: FiltersType) => {
    setResignationFilters(newFilters);
  };

  const handleClearFilters = () => {
    setResignationFilters({});
  };

  const handleCreateResignation = async (data: NewTQCResignationInput) => {
    await createResignation(data);
    setFormDialogOpen(false);
    await Promise.all([
      fetchResignations(filters),
      fetchResignationAnalysis(),
    ]);
  };

  if (loading.analysis && !analysis) {
    return <PageLoading />;
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t('newTqc.resignations.title')}</h1>
          <p className="text-muted-foreground">
            {t('newTqc.resignations.description')}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="destructive" onClick={() => setFormDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            {t('newTqc.resignationForm.submit')}
          </Button>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            {t('newTqc.resignations.downloadReport')}
          </Button>
        </div>
      </div>

      {/* Summary Stats */}
      <ResignationStats analysis={analysis} />

      {/* Charts Row */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <ResignationPieChart analysis={analysis} isLoading={loading.analysis} />
        <ResignationByTeamChart analysis={analysis} isLoading={loading.analysis} />
        <ResignationByMonthChart analysis={analysis} isLoading={loading.analysis} />
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <ResignationFilters
            filters={filters}
            teams={teams}
            onFiltersChange={handleFiltersChange}
            onClear={handleClearFilters}
          />
        </CardContent>
      </Card>

      {/* Resignations Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <UserMinus className="h-5 w-5" />
            {t('newTqc.resignations.listTitle', { count: filteredResignations.length })}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('newTqc.resignations.resignDate')}</TableHead>
                <TableHead>{t('newTqc.resignations.traineeId')}</TableHead>
                <TableHead>{t('newTqc.resignations.reason')}</TableHead>
                <TableHead>{t('newTqc.resignations.reasonDetail')}</TableHead>
                <TableHead>{t('newTqc.resignations.trainingDuration')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading.resignations ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">
                    <div className="flex items-center justify-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary" />
                      {t('common.loading')}
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredResignations.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    {t('newTqc.resignations.noRecords')}
                  </TableCell>
                </TableRow>
              ) : (
                filteredResignations.map((resignation) => (
                  <TableRow key={resignation.resignation_id}>
                    <TableCell>
                      {format(new Date(resignation.resign_date), 'yyyy-MM-dd')}
                    </TableCell>
                    <TableCell className="font-medium">
                      {resignation.trainee_id}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {REASON_LABELS[resignation.reason_category]}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground max-w-[300px] truncate">
                      {resignation.reason_detail || '-'}
                    </TableCell>
                    <TableCell>
                      {t('newTqc.resignations.daysCount', { count: resignation.training_duration_days })}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Insights Card */}
      {analysis && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingDown className="h-5 w-5" />
              {t('newTqc.resignations.insights')}
            </CardTitle>
            <CardDescription>
              {t('newTqc.resignations.insightsDesc')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Top reason insight */}
              {analysis.byReason.length > 0 && (() => {
                const totalResignations = analysis.byReason.reduce((sum, item) => sum + item.count, 0);
                return (
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <h4 className="font-medium mb-2">{t('newTqc.resignations.topReason')}</h4>
                    <p className="text-sm text-muted-foreground">
                      {t('newTqc.resignations.topReasonDetail', {
                        reason: REASON_LABELS[analysis.byReason[0].reason],
                        percentage: totalResignations > 0 ? Math.round((analysis.byReason[0].count / totalResignations) * 100) : 0,
                      })}
                    </p>
                  </div>
                );
              })()}

              {/* Average training duration insight */}
              <div className="p-4 bg-muted/50 rounded-lg">
                <h4 className="font-medium mb-2">{t('newTqc.resignations.avgTrainingDuration')}</h4>
                <p className="text-sm text-muted-foreground">
                  {t('newTqc.resignations.avgTrainingDetail', { days: analysis.averageTrainingDays })}
                  {analysis.averageTrainingDays < 14 && (
                    <span className="text-destructive"> {t('newTqc.resignations.earlyResignWarning')}</span>
                  )}
                </p>
              </div>

              {/* Team with highest resignation */}
              {analysis.byTeam.length > 0 && (
                <div className="p-4 bg-muted/50 rounded-lg">
                  <h4 className="font-medium mb-2">{t('newTqc.resignations.teamStatus')}</h4>
                  <p className="text-sm text-muted-foreground">
                    {t('newTqc.resignations.teamStatusDetail', { team: analysis.byTeam[0].team, count: analysis.byTeam[0].count })}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Resignation Form Dialog */}
      <ResignationFormDialog
        open={formDialogOpen}
        onClose={() => setFormDialogOpen(false)}
        onSubmit={handleCreateResignation}
        trainees={inTrainingTrainees}
      />
    </div>
  );
}
