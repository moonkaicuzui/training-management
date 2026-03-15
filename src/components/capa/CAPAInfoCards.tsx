/**
 * CAPA Info Cards
 *
 * 상세 페이지 메인 콘텐츠 영역:
 * - 설명 카드
 * - 발견(Discovery) 단계 카드
 * - 조사(Investigation) 단계 카드
 * - 조치(Action) 단계 카드
 * - 검증(Verification) 단계 카드
 * - 종결(Closure) 단계 카드
 * - 사이드바 상태 카드
 */

import { useTranslation } from 'react-i18next';
import {
  ArrowRight,
  CheckCircle2,
  FileText,
  Search,
  Hammer,
  ShieldCheck,
  XCircle,
} from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

import { STATUS_COLORS } from '@/components/capa/CAPAStageDialogs';
import {
  type CAPAStatus,
  type CAPA,
} from '@/types/capa';
import type { Timestamp } from 'firebase/firestore';

function formatDate(date: Date | Timestamp | undefined): string {
  if (!date) return '-';
  const d = date instanceof Date ? date : (date as { toDate: () => Date }).toDate();
  return d.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

// ========== Description Card ==========

interface DescriptionCardProps {
  description: string;
}

export function DescriptionCard({ description }: DescriptionCardProps) {
  const { t } = useTranslation();

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('capa.description')}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="whitespace-pre-wrap">{description}</p>
      </CardContent>
    </Card>
  );
}

// ========== Discovery Stage Card ==========

interface DiscoveryCardProps {
  currentCAPA: CAPA;
}

export function DiscoveryCard({ currentCAPA }: DiscoveryCardProps) {
  const { t } = useTranslation();

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-blue-500" />
          <CardTitle>{t('capa.findingStage')}</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="text-sm text-muted-foreground">{t('capa.problemDescription')}</p>
          <p className="mt-1 whitespace-pre-wrap">
            {currentCAPA.discovery.problemDescription}
          </p>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-muted-foreground">{t('capa.cause')}</p>
            <p className="mt-1">{t(`capa.sourceLabels.${currentCAPA.source}`)}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">{t('capa.affectedArea')}</p>
            <p className="mt-1">{currentCAPA.discovery.affectedArea}</p>
          </div>
        </div>
        {currentCAPA.discovery.immediateActions && (
          <div>
            <p className="text-sm text-muted-foreground">{t('capa.immediateAction')}</p>
            <p className="mt-1">{currentCAPA.discovery.immediateActions}</p>
          </div>
        )}
        <div className="text-sm text-muted-foreground">
          {currentCAPA.discovery.discoveredBy} /{' '}
          {formatDate(currentCAPA.discovery.discoveredAt)}
        </div>
      </CardContent>
    </Card>
  );
}

// ========== Investigation Stage Card ==========

interface InvestigationCardProps {
  currentCAPA: CAPA;
}

export function InvestigationCard({ currentCAPA }: InvestigationCardProps) {
  const { t } = useTranslation();

  if (!currentCAPA.investigation) return null;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Search className="h-5 w-5 text-yellow-500" />
          <CardTitle>{t('capa.investigationStage')}</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="text-sm text-muted-foreground">{t('capa.rootCauseAnalysis')}</p>
          <p className="mt-1 whitespace-pre-wrap">
            {currentCAPA.investigation.rootCauseAnalysis}
          </p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">{t('capa.impactAssessment')}</p>
          <p className="mt-1">{currentCAPA.investigation.impactAssessment}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">{t('capa.investigationResult')}</p>
          <p className="mt-1">{currentCAPA.investigation.findings}</p>
        </div>
        <div className="text-sm text-muted-foreground">
          {currentCAPA.investigation.investigatedBy} /{' '}
          {formatDate(currentCAPA.investigation.investigatedAt)}
        </div>
      </CardContent>
    </Card>
  );
}

// ========== Action Stage Card ==========

interface ActionCardProps {
  currentCAPA: CAPA;
}

export function ActionCard({ currentCAPA }: ActionCardProps) {
  const { t } = useTranslation();

  if (!currentCAPA.action) return null;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Hammer className="h-5 w-5 text-orange-500" />
          <CardTitle>{t('capa.correctiveStage')}</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {currentCAPA.action.correctiveActions.length > 0 && (
          <div>
            <p className="text-sm text-muted-foreground mb-2">{t('capa.correctiveAction')}</p>
            <div className="space-y-2">
              {currentCAPA.action.correctiveActions.map((action) => (
                <div
                  key={action.id}
                  className="flex items-center justify-between p-3 bg-muted rounded-lg"
                >
                  <div>
                    <p>{action.description}</p>
                    <p className="text-sm text-muted-foreground">
                      {action.assignedTo} / {formatDate(action.dueDate)}
                    </p>
                  </div>
                  <ActionStatusBadge status={action.status} />
                </div>
              ))}
            </div>
          </div>
        )}
        {currentCAPA.action.preventiveActions.length > 0 && (
          <div>
            <p className="text-sm text-muted-foreground mb-2">{t('capa.preventiveAction')}</p>
            <div className="space-y-2">
              {currentCAPA.action.preventiveActions.map((action) => (
                <div
                  key={action.id}
                  className="flex items-center justify-between p-3 bg-muted rounded-lg"
                >
                  <div>
                    <p>{action.description}</p>
                    <p className="text-sm text-muted-foreground">
                      {action.assignedTo} / {formatDate(action.dueDate)}
                    </p>
                  </div>
                  <ActionStatusBadge status={action.status} />
                </div>
              ))}
            </div>
          </div>
        )}
        {currentCAPA.action.resourcesRequired && (
          <div>
            <p className="text-sm text-muted-foreground">{t('capa.actionNotes')}</p>
            <p className="mt-1 whitespace-pre-wrap">{currentCAPA.action.resourcesRequired}</p>
          </div>
        )}
        <div className="text-sm text-muted-foreground">
          {currentCAPA.action.plannedBy} /{' '}
          {formatDate(currentCAPA.action.plannedAt)}
        </div>
      </CardContent>
    </Card>
  );
}

function ActionStatusBadge({ status }: { status: string }) {
  const { t } = useTranslation();

  const label =
    status === 'completed'
      ? t('common.completed')
      : status === 'in_progress'
      ? t('common.inProgress')
      : t('common.pending');

  return (
    <Badge variant={status === 'completed' ? 'default' : 'outline'}>
      {label}
    </Badge>
  );
}

// ========== Verification Stage Card ==========

interface VerificationCardProps {
  currentCAPA: CAPA;
}

export function VerificationCard({ currentCAPA }: VerificationCardProps) {
  const { t } = useTranslation();

  if (!currentCAPA.verification) return null;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-purple-500" />
          <CardTitle>{t('capa.verificationStage')}</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-4">
          <Badge
            className={
              currentCAPA.verification.isEffective
                ? 'bg-green-100 text-green-800'
                : 'bg-red-100 text-red-800'
            }
          >
            {currentCAPA.verification.isEffective
              ? t('capa.effective')
              : t('capa.ineffective')}
          </Badge>
          {currentCAPA.verification.effectivenessScore !== undefined && (
            <span className="text-sm">
              {t('capa.effectivenessScore')}: {currentCAPA.verification.effectivenessScore}%
            </span>
          )}
        </div>
        <div>
          <p className="text-sm text-muted-foreground">{t('capa.verificationMethod')}</p>
          <p className="mt-1">{currentCAPA.verification.verificationMethod}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">{t('capa.verificationResult')}</p>
          <p className="mt-1">{currentCAPA.verification.verificationNotes}</p>
        </div>
        <div className="text-sm text-muted-foreground">
          {currentCAPA.verification.verifiedBy} /{' '}
          {formatDate(currentCAPA.verification.verifiedAt)}
        </div>
      </CardContent>
    </Card>
  );
}

// ========== Closure Stage Card ==========

interface ClosureCardProps {
  currentCAPA: CAPA;
}

export function ClosureCard({ currentCAPA }: ClosureCardProps) {
  const { t } = useTranslation();

  if (!currentCAPA.closure) return null;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-5 w-5 text-green-500" />
          <CardTitle>{t('capa.closureStage')}</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="text-sm text-muted-foreground">{t('capa.finalReview')}</p>
          <p className="mt-1">{currentCAPA.closure.finalReview}</p>
        </div>
        {currentCAPA.closure.lessonsLearned && (
          <div>
            <p className="text-sm text-muted-foreground">{t('capa.lessonsLearned')}</p>
            <p className="mt-1">{currentCAPA.closure.lessonsLearned}</p>
          </div>
        )}
        <div className="flex gap-4">
          <Badge
            variant={
              currentCAPA.closure.documentationComplete ? 'default' : 'outline'
            }
          >
            {t('capa.documentationComplete')}: {currentCAPA.closure.documentationComplete ? 'O' : 'X'}
          </Badge>
          <Badge
            variant={
              currentCAPA.closure.knowledgeShared ? 'default' : 'outline'
            }
          >
            {t('capa.knowledgeShared')}: {currentCAPA.closure.knowledgeShared ? 'O' : 'X'}
          </Badge>
        </div>
        <div className="text-sm text-muted-foreground">
          {currentCAPA.closure.closedBy} /{' '}
          {formatDate(currentCAPA.closure.closedAt)}
        </div>
      </CardContent>
    </Card>
  );
}

// ========== Sidebar Status Card ==========

interface StatusCardProps {
  currentCAPA: CAPA;
  canAdvance: boolean;
  canReject: boolean;
  nextStatus: CAPAStatus | null;
  onAdvance: () => void;
  onReject: () => void;
}

export function StatusCard({
  currentCAPA,
  canAdvance,
  canReject,
  nextStatus,
  onAdvance,
  onReject,
}: StatusCardProps) {
  const { t } = useTranslation();

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('capa.status')}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">{t('capa.stage')}</span>
          <Badge className={STATUS_COLORS[currentCAPA.status]}>
            {t(`capa.statusLabels.${currentCAPA.status}`)}
          </Badge>
        </div>
        <Separator />
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">{t('capa.priority')}</span>
          <span>{t(`capa.priorityLabels.${currentCAPA.priority}`)}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">{t('capa.assignedTo')}</span>
          <span>{currentCAPA.owner}</span>
        </div>
        {currentCAPA.dueDate && (
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">{t('capa.dueDate')}</span>
            <span>{formatDate(currentCAPA.dueDate)}</span>
          </div>
        )}

        {(canAdvance || canReject) && (
          <>
            <Separator />
            <div className="space-y-2">
              <p className="text-sm font-medium">{t('capa.stageTransition')}</p>
              {canAdvance && nextStatus && (
                <Button
                  className="w-full"
                  size="sm"
                  onClick={onAdvance}
                >
                  <ArrowRight className="h-4 w-4 mr-2" />
                  {t(`capa.statusLabels.${nextStatus}`)}
                </Button>
              )}
              {canReject && (
                <Button
                  variant="destructive"
                  className="w-full"
                  size="sm"
                  onClick={onReject}
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  {t('capa.rejectCapa')}
                </Button>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
