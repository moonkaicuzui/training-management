import { useState, useMemo, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { logger } from '@/utils/logger';
import * as api from '@/services/api';
import { Users, BarChart3, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { TrainingSession, TrainingResultRecord } from '@/types';
import TrainerAnalytics from '@/components/training/TrainerAnalytics';
import {
  TrainerFormDialog,
  TrainerStatsCards,
  TrainerFilters,
  TrainerTable,
} from '@/components/trainers';
import type { TrainerWithStats } from '@/components/trainers';

export default function TrainersPage() {
  const { t } = useTranslation();
  const [trainers, setTrainers] = useState<TrainerWithStats[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTrainer, setEditingTrainer] = useState<TrainerWithStats | null>(null);
  const [sessions, setSessions] = useState<TrainingSession[]>([]);
  const [results, setResults] = useState<TrainingResultRecord[]>([]);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [data, sessionsData, resultsData] = await Promise.all([
        api.getTrainers(),
        api.getSessions(),
        api.getResults(),
      ]);
      const trainersWithStats: TrainerWithStats[] = data.map((trainer) => ({
        ...trainer,
        total_sessions: 0,
        average_rating: 0,
      }));
      setTrainers(trainersWithStats);
      setSessions(sessionsData);
      setResults(resultsData);
    } catch (err) {
      logger.error('Failed to load trainers:', err);
      setError(err instanceof Error ? err.message : 'Failed to load trainers');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filteredTrainers = useMemo(() => {
    return trainers.filter((trainer) => {
      const matchesSearch =
        trainer.trainer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        trainer.specializations.some((s: string) => s.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesType = selectedType === 'all' || trainer.trainer_type === selectedType;
      const matchesStatus = selectedStatus === 'all' || trainer.status === selectedStatus;

      return matchesSearch && matchesType && matchesStatus;
    });
  }, [trainers, searchQuery, selectedType, selectedStatus]);

  const stats = useMemo(() => {
    return {
      total: trainers.length,
      internal: trainers.filter(t => t.trainer_type === 'INTERNAL').length,
      external: trainers.filter(t => t.trainer_type === 'EXTERNAL').length,
      active: trainers.filter(t => t.status === 'ACTIVE').length,
    };
  }, [trainers]);

  const handleAdd = () => {
    setEditingTrainer(null);
    setDialogOpen(true);
  };

  const handleEdit = (trainer: TrainerWithStats) => {
    setEditingTrainer(trainer);
    setDialogOpen(true);
  };

  const handleDelete = async (trainer: TrainerWithStats) => {
    if (!window.confirm(t('trainers.confirmDelete', { name: trainer.trainer_name }))) return;
    try {
      await api.deleteTrainer(trainer.trainer_id);
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete trainer');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t('trainers.title')}</h1>
          <p className="text-muted-foreground">{t('trainers.description')}</p>
        </div>
        <Button onClick={handleAdd}>
          <Plus className="h-4 w-4 mr-2" />
          {t('trainers.addTrainer')}
        </Button>
      </div>

      {/* Stats Cards */}
      <TrainerStatsCards stats={stats} />

      {/* Tabs: List / Analytics */}
      <Tabs defaultValue="list">
        <TabsList>
          <TabsTrigger value="list" className="gap-2">
            <Users className="h-4 w-4" />
            {t('trainers.trainerList')}
          </TabsTrigger>
          <TabsTrigger value="analytics" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            {t('trainers.analytics')}
          </TabsTrigger>
        </TabsList>

        {/* Trainer List Tab */}
        <TabsContent value="list" className="space-y-6">
          <TrainerFilters
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            selectedType={selectedType}
            onTypeChange={setSelectedType}
            selectedStatus={selectedStatus}
            onStatusChange={setSelectedStatus}
          />

          {/* Loading */}
          {isLoading && (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
            </div>
          )}

          {/* Error */}
          {error && (
            <Card>
              <CardContent className="p-6">
                <div className="text-center text-destructive">
                  <p className="font-medium">{error}</p>
                  <Button variant="outline" className="mt-4" onClick={loadData}>
                    {t('common.retry', 'Retry')}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Trainer Table */}
          {!isLoading && !error && (
            <TrainerTable
              trainers={filteredTrainers}
              onAdd={handleAdd}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          )}
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics">
          <TrainerAnalytics
            trainers={trainers}
            sessions={sessions}
            results={results}
            isLoading={isLoading}
          />
        </TabsContent>
      </Tabs>

      {/* Form Dialog */}
      <TrainerFormDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSaved={loadData}
        trainer={editingTrainer}
      />
    </div>
  );
}
