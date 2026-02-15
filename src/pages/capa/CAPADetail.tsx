/**
 * CAPA Detail Page
 *
 * CAPA 상세 보기 및 워크플로우 단계 전환
 */

import { useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  ArrowLeft,
  Edit,
  CheckCircle2,
  AlertTriangle,
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

import { useCAPAStore } from '@/stores/capaStore';
import {
  CAPA_STATUS_LABELS,
  CAPA_SEVERITY_LABELS,
  CAPA_PRIORITY_LABELS,
  CAPA_SOURCE_LABELS,
  CAPA_TYPE_LABELS,
  CAPA_STATUS_ORDER,
  type CAPAStatus,
  type CAPASeverity,
} from '@/types/capa';
import type { Timestamp } from 'firebase/firestore';

// Status badge colors
const STATUS_COLORS: Record<CAPAStatus, string> = {
  discovery: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
  investigation: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
  action: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
  verification: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
  closed: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  rejected: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300',
};

const SEVERITY_COLORS: Record<CAPASeverity, string> = {
  critical: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
  major: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
  minor: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
};

// Stage icons
const STAGE_ICONS: Record<CAPAStatus, React.ReactNode> = {
  discovery: <FileText className="h-4 w-4" />,
  investigation: <Search className="h-4 w-4" />,
  action: <Hammer className="h-4 w-4" />,
  verification: <ShieldCheck className="h-4 w-4" />,
  closed: <CheckCircle2 className="h-4 w-4" />,
  rejected: <XCircle className="h-4 w-4" />,
};

function formatDate(date: Date | Timestamp | undefined): string {
  if (!date) return '-';
  const d = date instanceof Date ? date : (date as { toDate: () => Date }).toDate();
  return d.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export default function CAPADetail() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const initializedRef = useRef(false);

  const { currentCAPA, fetchCAPAById, isLoading, error } = useCAPAStore();

  // Load CAPA data
  useEffect(() => {
    if (id && !initializedRef.current) {
      initializedRef.current = true;
      fetchCAPAById(id);
    }
  }, [id, fetchCAPAById]);

  // Get current stage index
  const currentStageIndex = currentCAPA
    ? CAPA_STATUS_ORDER.indexOf(currentCAPA.status)
    : 0;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

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
                {CAPA_SEVERITY_LABELS[currentCAPA.severity]}
              </Badge>
              <Badge variant="secondary">
                {CAPA_TYPE_LABELS[currentCAPA.type]}
              </Badge>
            </div>
            <h1 className="text-2xl font-bold">{currentCAPA.title}</h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => navigate(`/capa/${id}/edit`)}>
            <Edit className="h-4 w-4 mr-2" />
            {t('common.edit')}
          </Button>
        </div>
      </div>

      {/* Workflow Steps */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            {CAPA_STATUS_ORDER.filter(s => s !== 'rejected').map((status, index) => {
              const isCompleted = index < currentStageIndex;
              const isCurrent = index === currentStageIndex;
              const isPending = index > currentStageIndex;

              return (
                <div key={status} className="flex items-center">
                  <div className="flex flex-col items-center">
                    <div
                      className={`
                        flex items-center justify-center w-10 h-10 rounded-full border-2
                        ${isCompleted ? 'bg-primary border-primary text-primary-foreground' : ''}
                        ${isCurrent ? 'border-primary text-primary' : ''}
                        ${isPending ? 'border-muted text-muted-foreground' : ''}
                      `}
                    >
                      {isCompleted ? (
                        <CheckCircle2 className="h-5 w-5" />
                      ) : (
                        STAGE_ICONS[status]
                      )}
                    </div>
                    <span
                      className={`mt-2 text-sm ${
                        isCurrent ? 'font-medium' : 'text-muted-foreground'
                      }`}
                    >
                      {CAPA_STATUS_LABELS[status]}
                    </span>
                  </div>
                  {index < CAPA_STATUS_ORDER.filter(s => s !== 'rejected').length - 1 && (
                    <div
                      className={`w-16 h-0.5 mx-2 ${
                        isCompleted ? 'bg-primary' : 'bg-muted'
                      }`}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Main Content */}
        <div className="md:col-span-2 space-y-6">
          {/* Description */}
          <Card>
            <CardHeader>
              <CardTitle>{t('capa.description')}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap">{currentCAPA.description}</p>
            </CardContent>
          </Card>

          {/* Discovery Stage */}
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
                  <p className="mt-1">{CAPA_SOURCE_LABELS[currentCAPA.source]}</p>
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
                발견: {currentCAPA.discovery.discoveredBy} /{' '}
                {formatDate(currentCAPA.discovery.discoveredAt)}
              </div>
            </CardContent>
          </Card>

          {/* Investigation Stage */}
          {currentCAPA.investigation && (
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
                  조사: {currentCAPA.investigation.investigatedBy} /{' '}
                  {formatDate(currentCAPA.investigation.investigatedAt)}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Action Stage */}
          {currentCAPA.action && (
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
                              담당: {action.assignedTo} / 기한: {formatDate(action.dueDate)}
                            </p>
                          </div>
                          <Badge
                            variant={action.status === 'completed' ? 'default' : 'outline'}
                          >
                            {action.status === 'completed'
                              ? '완료'
                              : action.status === 'in_progress'
                              ? '진행중'
                              : '대기'}
                          </Badge>
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
                              담당: {action.assignedTo} / 기한: {formatDate(action.dueDate)}
                            </p>
                          </div>
                          <Badge
                            variant={action.status === 'completed' ? 'default' : 'outline'}
                          >
                            {action.status === 'completed'
                              ? '완료'
                              : action.status === 'in_progress'
                              ? '진행중'
                              : '대기'}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                <div className="text-sm text-muted-foreground">
                  계획: {currentCAPA.action.plannedBy} /{' '}
                  {formatDate(currentCAPA.action.plannedAt)}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Verification Stage */}
          {currentCAPA.verification && (
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
                    {currentCAPA.verification.isEffective ? '효과적' : '미흡'}
                  </Badge>
                  {currentCAPA.verification.effectivenessScore !== undefined && (
                    <span className="text-sm">
                      효과성 점수: {currentCAPA.verification.effectivenessScore}%
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
                  검증: {currentCAPA.verification.verifiedBy} /{' '}
                  {formatDate(currentCAPA.verification.verifiedAt)}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Closure Stage */}
          {currentCAPA.closure && (
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                  <CardTitle>{t('capa.closureStage')}</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">최종 검토</p>
                  <p className="mt-1">{currentCAPA.closure.finalReview}</p>
                </div>
                {currentCAPA.closure.lessonsLearned && (
                  <div>
                    <p className="text-sm text-muted-foreground">교훈</p>
                    <p className="mt-1">{currentCAPA.closure.lessonsLearned}</p>
                  </div>
                )}
                <div className="flex gap-4">
                  <Badge
                    variant={
                      currentCAPA.closure.documentationComplete ? 'default' : 'outline'
                    }
                  >
                    문서화 {currentCAPA.closure.documentationComplete ? '완료' : '미완료'}
                  </Badge>
                  <Badge
                    variant={
                      currentCAPA.closure.knowledgeShared ? 'default' : 'outline'
                    }
                  >
                    교훈 공유 {currentCAPA.closure.knowledgeShared ? '완료' : '미완료'}
                  </Badge>
                </div>
                <div className="text-sm text-muted-foreground">
                  종료: {currentCAPA.closure.closedBy} /{' '}
                  {formatDate(currentCAPA.closure.closedAt)}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status Card */}
          <Card>
            <CardHeader>
              <CardTitle>{t('capa.status')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">{t('capa.stage')}</span>
                <Badge className={STATUS_COLORS[currentCAPA.status]}>
                  {CAPA_STATUS_LABELS[currentCAPA.status]}
                </Badge>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">{t('capa.priority')}</span>
                <span>{CAPA_PRIORITY_LABELS[currentCAPA.priority]}</span>
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
            </CardContent>
          </Card>

          {/* Timeline Card */}
          <Card>
            <CardHeader>
              <CardTitle>{t('capa.history')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 mt-2 rounded-full bg-primary" />
                  <div>
                    <p className="font-medium">{t('capa.createdAt')}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatDate(currentCAPA.createdAt)}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {currentCAPA.createdBy}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 mt-2 rounded-full bg-muted" />
                  <div>
                    <p className="font-medium">{t('capa.updatedAt')}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatDate(currentCAPA.updatedAt)}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  );
}
