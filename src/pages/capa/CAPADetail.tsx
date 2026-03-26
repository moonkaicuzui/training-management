/**
 * CAPA Detail Page
 *
 * CAPA 상세 보기 및 워크플로우 단계 전환
 * 오케스트레이션 전용 — UI 컴포넌트는 분리됨:
 *   - CAPAStageDialogs: 단계 전환 다이얼로그
 *   - CAPAStatusTimeline: 워크플로우 스텝 + 타임라인
 *   - CAPAInfoCards: 각 단계별 정보 카드 + 사이드바
 */

import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  ArrowLeft,
  ArrowRight,
  Edit,
  AlertTriangle,
  XCircle,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

import { useShallow } from 'zustand/react/shallow';
import { useCAPAStore } from '@/stores/capaStore';
import { useAuthStore } from '@/stores/authStore';
import { useToast } from '@/hooks/use-toast';
import {
  CAPA_STATUS_ORDER,
  type CAPAStageUpdate,
} from '@/types/capa';

// Extracted components
import { SEVERITY_COLORS, AdvanceStageDialog, RejectDialog } from '@/components/capa/CAPAStageDialogs';
import { WorkflowSteps, HistoryTimeline } from '@/components/capa/CAPAStatusTimeline';
import {
  DescriptionCard,
  DiscoveryCard,
  InvestigationCard,
  ActionCard,
  VerificationCard,
  ClosureCard,
  StatusCard,
} from '@/components/capa/CAPAInfoCards';
import { CrossSystemPanel } from '@/components/capa/CrossSystemPanel';

export default function CAPADetail() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const initializedRef = useRef(false);
  const { toast } = useToast();

  const { currentCAPA, fetchCAPAById, updateCAPAStage, isLoading, error } = useCAPAStore(useShallow((state) => ({
    currentCAPA: state.currentCAPA,
    fetchCAPAById: state.fetchCAPAById,
    updateCAPAStage: state.updateCAPAStage,
    isLoading: state.isLoading,
    error: state.error,
  })));
  const user = useAuthStore((s) => s.user);

  // Dialog states
  const [advanceDialogOpen, setAdvanceDialogOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);

  // Load CAPA data
  useEffect(() => {
    if (id && !initializedRef.current) {
      initializedRef.current = true;
      fetchCAPAById(id);
    }
  }, [id, fetchCAPAById]);

  // Derive stage transition state
  const currentStageIndex = currentCAPA
    ? CAPA_STATUS_ORDER.indexOf(currentCAPA.status)
    : 0;

  const canAdvance =
    currentCAPA &&
    currentCAPA.status !== 'closed' &&
    currentCAPA.status !== 'rejected' &&
    currentStageIndex >= 0 &&
    currentStageIndex < CAPA_STATUS_ORDER.length - 1;

  const canReject =
    currentCAPA &&
    currentCAPA.status !== 'closed' &&
    currentCAPA.status !== 'rejected';

  const nextStatus = canAdvance
    ? CAPA_STATUS_ORDER[currentStageIndex + 1]
    : null;

  // Handle stage advance submission
  const handleStageUpdate = async (stageUpdate: CAPAStageUpdate) => {
    if (!id) return;
    try {
      await updateCAPAStage(id, stageUpdate);
      toast({
        title: stageUpdate.status === 'rejected' ? t('capa.capaRejected') : t('capa.stageUpdated'),
        description: stageUpdate.status === 'rejected' ? t('capa.capaRejectedDesc') : t('capa.stageUpdatedDesc'),
      });
    } catch (err) {
      toast({
        title: t('capa.stageUpdateError'),
        description: String(err || t('capa.stageUpdateErrorDesc')),
        variant: 'destructive',
      });
      throw err; // Re-throw so dialog knows it failed
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  // Error / not found state
  if (error || !currentCAPA) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
        <p className="text-muted-foreground">{error || t('capa.noDataAvailable')}</p>
        <Button variant="link" onClick={() => navigate('/capa')}>
          {t('capa.backToList')}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/capa')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="outline">{currentCAPA.capaNumber}</Badge>
              <Badge className={SEVERITY_COLORS[currentCAPA.severity]}>
                {t(`capa.severityLabels.${currentCAPA.severity}`)}
              </Badge>
              <Badge variant="secondary">
                {t(`capa.typeLabels.${currentCAPA.type}`)}
              </Badge>
            </div>
            <h1 className="text-2xl font-bold">{currentCAPA.title}</h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {canReject && (
            <Button variant="destructive" size="sm" onClick={() => setRejectDialogOpen(true)}>
              <XCircle className="h-4 w-4 mr-2" />
              {t('capa.rejectCapa')}
            </Button>
          )}
          {canAdvance && nextStatus && (
            <Button onClick={() => setAdvanceDialogOpen(true)}>
              <ArrowRight className="h-4 w-4 mr-2" />
              {t('capa.advanceStage')}: {t(`capa.statusLabels.${nextStatus}`)}
            </Button>
          )}
          <Button variant="outline" onClick={() => navigate(`/capa/${id}/edit`)}>
            <Edit className="h-4 w-4 mr-2" />
            {t('common.edit')}
          </Button>
        </div>
      </div>

      {/* Workflow Steps */}
      <WorkflowSteps currentCAPA={currentCAPA} />

      <div className="grid gap-6 md:grid-cols-3">
        {/* Main Content */}
        <div className="md:col-span-2 space-y-6">
          <DescriptionCard description={currentCAPA.description} />
          <DiscoveryCard currentCAPA={currentCAPA} />
          <InvestigationCard currentCAPA={currentCAPA} />
          <ActionCard currentCAPA={currentCAPA} />
          <VerificationCard currentCAPA={currentCAPA} />
          <ClosureCard currentCAPA={currentCAPA} />
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <StatusCard
            currentCAPA={currentCAPA}
            canAdvance={!!canAdvance}
            canReject={!!canReject}
            nextStatus={nextStatus}
            onAdvance={() => setAdvanceDialogOpen(true)}
            onReject={() => setRejectDialogOpen(true)}
          />
          <HistoryTimeline currentCAPA={currentCAPA} />
        </div>
      </div>

      {/* Cross System Panel */}
      {currentCAPA?.qualityContext && (
        <CrossSystemPanel
          model={currentCAPA.qualityContext.model}
          defectKey={currentCAPA.qualityContext.defectCode}
          supplierId={currentCAPA.qualityContext.supplierId}
          process={currentCAPA.qualityContext.process}
          issueDate={currentCAPA.createdAt instanceof Date
            ? currentCAPA.createdAt.toISOString().split('T')[0]
            : currentCAPA.createdAt && 'toDate' in currentCAPA.createdAt
              ? currentCAPA.createdAt.toDate().toISOString().split('T')[0]
              : new Date().toISOString().split('T')[0]}
          linkedSystems={currentCAPA.qualityContext.linkedSystems}
        />
      )}

      {/* Advance Stage Dialog */}
      {canAdvance && nextStatus && (
        <AdvanceStageDialog
          open={advanceDialogOpen}
          onOpenChange={setAdvanceDialogOpen}
          currentCAPA={currentCAPA}
          nextStatus={nextStatus}
          userName={user?.name || ''}
          onSubmit={handleStageUpdate}
        />
      )}

      {/* Reject Dialog */}
      {canReject && (
        <RejectDialog
          open={rejectDialogOpen}
          onOpenChange={setRejectDialogOpen}
          onSubmit={handleStageUpdate}
        />
      )}
    </div>
  );
}
