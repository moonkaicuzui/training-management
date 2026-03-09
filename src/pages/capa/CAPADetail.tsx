/**
 * CAPA Detail Page
 *
 * CAPA 상세 보기 및 워크플로우 단계 전환
 */

import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  ArrowLeft,
  ArrowRight,
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';

import { useShallow } from 'zustand/react/shallow';
import { CAPAAISuggestions } from '@/components/capa/CAPAAISuggestions';
import { useCAPAStore } from '@/stores/capaStore';
import { useAuthStore } from '@/stores/authStore';
import { useToast } from '@/hooks/use-toast';
import {
  CAPA_STATUS_LABELS,
  CAPA_SEVERITY_LABELS,
  CAPA_PRIORITY_LABELS,
  CAPA_SOURCE_LABELS,
  CAPA_TYPE_LABELS,
  CAPA_STATUS_ORDER,
  type CAPAStatus,
  type CAPASeverity,
  type CAPAStageUpdate,
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

// Stage-specific form data interfaces
interface InvestigationFormData {
  rootCauseAnalysis: string;
  impactAssessment: string;
  findings: string;
  investigatedBy: string;
}

interface ActionFormData {
  actionNotes: string;
  plannedBy: string;
}

interface VerificationFormData {
  verificationMethod: string;
  isEffective: boolean;
  verificationNotes: string;
  verifiedBy: string;
}

interface ClosureFormData {
  finalReview: string;
  lessonsLearned: string;
  documentationComplete: boolean;
  knowledgeShared: boolean;
  closedBy: string;
}

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
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reject form
  const [rejectReason, setRejectReason] = useState('');

  // Stage-specific form data
  const [investigationForm, setInvestigationForm] = useState<InvestigationFormData>({
    rootCauseAnalysis: '',
    impactAssessment: '',
    findings: '',
    investigatedBy: user?.name || '',
  });

  const [actionForm, setActionForm] = useState<ActionFormData>({
    actionNotes: '',
    plannedBy: user?.name || '',
  });

  const [verificationForm, setVerificationForm] = useState<VerificationFormData>({
    verificationMethod: '',
    isEffective: true,
    verificationNotes: '',
    verifiedBy: user?.name || '',
  });

  const [closureForm, setClosureForm] = useState<ClosureFormData>({
    finalReview: '',
    lessonsLearned: '',
    documentationComplete: false,
    knowledgeShared: false,
    closedBy: user?.name || '',
  });

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

  // Determine if stage transitions are possible
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

  // Reset forms when dialog opens
  const handleOpenAdvanceDialog = () => {
    if (user?.name) {
      setInvestigationForm((prev) => ({ ...prev, investigatedBy: user.name }));
      setActionForm((prev) => ({ ...prev, plannedBy: user.name }));
      setVerificationForm((prev) => ({ ...prev, verifiedBy: user.name }));
      setClosureForm((prev) => ({ ...prev, closedBy: user.name }));
    }
    setAdvanceDialogOpen(true);
  };

  const handleOpenRejectDialog = () => {
    setRejectReason('');
    setRejectDialogOpen(true);
  };

  // Validate stage-specific form data
  const isAdvanceFormValid = (): boolean => {
    if (!currentCAPA) return false;

    switch (currentCAPA.status) {
      case 'discovery':
        return (
          investigationForm.rootCauseAnalysis.trim() !== '' &&
          investigationForm.impactAssessment.trim() !== '' &&
          investigationForm.findings.trim() !== '' &&
          investigationForm.investigatedBy.trim() !== ''
        );
      case 'investigation':
        return (
          actionForm.actionNotes.trim() !== '' &&
          actionForm.plannedBy.trim() !== ''
        );
      case 'action':
        return (
          verificationForm.verificationMethod.trim() !== '' &&
          verificationForm.verificationNotes.trim() !== '' &&
          verificationForm.verifiedBy.trim() !== ''
        );
      case 'verification':
        return (
          closureForm.finalReview.trim() !== '' &&
          closureForm.closedBy.trim() !== ''
        );
      default:
        return false;
    }
  };

  // Handle advance stage submission
  const handleAdvanceStage = async () => {
    if (!currentCAPA || !id || !nextStatus) return;

    setIsSubmitting(true);
    try {
      const stageUpdate: CAPAStageUpdate = {
        status: nextStatus,
      };

      switch (currentCAPA.status) {
        case 'discovery':
          stageUpdate.investigation = {
            rootCauseAnalysis: investigationForm.rootCauseAnalysis,
            impactAssessment: investigationForm.impactAssessment,
            findings: investigationForm.findings,
            investigatedBy: investigationForm.investigatedBy,
          };
          break;
        case 'investigation':
          stageUpdate.action = {
            correctiveActions: [],
            preventiveActions: [],
            resourcesRequired: actionForm.actionNotes,
            plannedBy: actionForm.plannedBy,
          };
          break;
        case 'action':
          stageUpdate.verification = {
            verificationMethod: verificationForm.verificationMethod,
            isEffective: verificationForm.isEffective,
            recurrenceCheck: false,
            verifiedBy: verificationForm.verifiedBy,
            verificationNotes: verificationForm.verificationNotes,
          };
          break;
        case 'verification':
          stageUpdate.closure = {
            finalReview: closureForm.finalReview,
            lessonsLearned: closureForm.lessonsLearned || undefined,
            documentationComplete: closureForm.documentationComplete,
            knowledgeShared: closureForm.knowledgeShared,
            closedBy: closureForm.closedBy,
          };
          break;
      }

      await updateCAPAStage(id, stageUpdate);
      setAdvanceDialogOpen(false);
      toast({
        title: t('capa.stageUpdated'),
        description: t('capa.stageUpdatedDesc'),
      });
    } catch {
      toast({
        title: 'Error',
        description: String(error || 'Failed to update stage'),
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle reject submission
  const handleReject = async () => {
    if (!currentCAPA || !id || !rejectReason.trim()) return;

    setIsSubmitting(true);
    try {
      const stageUpdate: CAPAStageUpdate = {
        status: 'rejected',
      };

      await updateCAPAStage(id, stageUpdate);
      setRejectDialogOpen(false);
      toast({
        title: t('capa.capaRejected'),
        description: t('capa.capaRejectedDesc'),
      });
    } catch {
      toast({
        title: 'Error',
        description: String(error || 'Failed to reject CAPA'),
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Render stage-specific form fields
  const renderStageFields = () => {
    if (!currentCAPA) return null;

    switch (currentCAPA.status) {
      case 'discovery':
        return (
          <div className="space-y-4">
            {/* AI Root Cause Suggestions */}
            {currentCAPA && (
              <CAPAAISuggestions
                capaId={currentCAPA.id}
                problemDescription={currentCAPA.discovery?.problemDescription || ''}
                affectedArea={currentCAPA.discovery?.affectedArea || ''}
                severity={currentCAPA.severity}
                source={currentCAPA.discovery?.source || ''}
                onSelectRootCause={(cause) =>
                  setInvestigationForm((prev) => ({
                    ...prev,
                    rootCauseAnalysis: cause,
                  }))
                }
              />
            )}

            <div className="space-y-2">
              <Label htmlFor="rootCauseAnalysis">{t('capa.rootCauseAnalysis')} *</Label>
              <Textarea
                id="rootCauseAnalysis"
                value={investigationForm.rootCauseAnalysis}
                onChange={(e) =>
                  setInvestigationForm((prev) => ({
                    ...prev,
                    rootCauseAnalysis: e.target.value,
                  }))
                }
                rows={3}
                placeholder={t('capa.rootCauseAnalysis')}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="impactAssessment">{t('capa.impactAssessment')} *</Label>
              <Textarea
                id="impactAssessment"
                value={investigationForm.impactAssessment}
                onChange={(e) =>
                  setInvestigationForm((prev) => ({
                    ...prev,
                    impactAssessment: e.target.value,
                  }))
                }
                rows={3}
                placeholder={t('capa.impactAssessment')}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="findings">{t('capa.findings')} *</Label>
              <Textarea
                id="findings"
                value={investigationForm.findings}
                onChange={(e) =>
                  setInvestigationForm((prev) => ({
                    ...prev,
                    findings: e.target.value,
                  }))
                }
                rows={3}
                placeholder={t('capa.findings')}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="investigatedBy">{t('capa.investigatedBy')} *</Label>
              <Input
                id="investigatedBy"
                value={investigationForm.investigatedBy}
                onChange={(e) =>
                  setInvestigationForm((prev) => ({
                    ...prev,
                    investigatedBy: e.target.value,
                  }))
                }
                placeholder={t('capa.investigatedBy')}
              />
            </div>
          </div>
        );

      case 'investigation':
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="actionNotes">{t('capa.actionNotes')} *</Label>
              <Textarea
                id="actionNotes"
                value={actionForm.actionNotes}
                onChange={(e) =>
                  setActionForm((prev) => ({
                    ...prev,
                    actionNotes: e.target.value,
                  }))
                }
                rows={4}
                placeholder={t('capa.actionNotesPlaceholder')}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="plannedBy">{t('capa.assignedTo')} *</Label>
              <Input
                id="plannedBy"
                value={actionForm.plannedBy}
                onChange={(e) =>
                  setActionForm((prev) => ({
                    ...prev,
                    plannedBy: e.target.value,
                  }))
                }
                placeholder={t('capa.assignedTo')}
              />
            </div>
          </div>
        );

      case 'action':
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="verificationMethod">{t('capa.verificationMethod')} *</Label>
              <Input
                id="verificationMethod"
                value={verificationForm.verificationMethod}
                onChange={(e) =>
                  setVerificationForm((prev) => ({
                    ...prev,
                    verificationMethod: e.target.value,
                  }))
                }
                placeholder={t('capa.verificationMethod')}
              />
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="isEffective"
                checked={verificationForm.isEffective}
                onCheckedChange={(checked) =>
                  setVerificationForm((prev) => ({
                    ...prev,
                    isEffective: checked === true,
                  }))
                }
              />
              <Label htmlFor="isEffective">{t('capa.isEffective')}</Label>
            </div>
            <div className="space-y-2">
              <Label htmlFor="verificationNotes">{t('capa.verificationNotes')} *</Label>
              <Textarea
                id="verificationNotes"
                value={verificationForm.verificationNotes}
                onChange={(e) =>
                  setVerificationForm((prev) => ({
                    ...prev,
                    verificationNotes: e.target.value,
                  }))
                }
                rows={3}
                placeholder={t('capa.verificationNotesPlaceholder')}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="verifiedBy">{t('capa.verifiedBy')} *</Label>
              <Input
                id="verifiedBy"
                value={verificationForm.verifiedBy}
                onChange={(e) =>
                  setVerificationForm((prev) => ({
                    ...prev,
                    verifiedBy: e.target.value,
                  }))
                }
                placeholder={t('capa.verifiedBy')}
              />
            </div>
          </div>
        );

      case 'verification':
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="finalReview">{t('capa.finalReview')} *</Label>
              <Textarea
                id="finalReview"
                value={closureForm.finalReview}
                onChange={(e) =>
                  setClosureForm((prev) => ({
                    ...prev,
                    finalReview: e.target.value,
                  }))
                }
                rows={3}
                placeholder={t('capa.finalReviewPlaceholder')}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lessonsLearned">{t('capa.lessonsLearned')}</Label>
              <Textarea
                id="lessonsLearned"
                value={closureForm.lessonsLearned}
                onChange={(e) =>
                  setClosureForm((prev) => ({
                    ...prev,
                    lessonsLearned: e.target.value,
                  }))
                }
                rows={3}
                placeholder={t('capa.lessonsLearnedPlaceholder')}
              />
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="documentationComplete"
                checked={closureForm.documentationComplete}
                onCheckedChange={(checked) =>
                  setClosureForm((prev) => ({
                    ...prev,
                    documentationComplete: checked === true,
                  }))
                }
              />
              <Label htmlFor="documentationComplete">{t('capa.documentationComplete')}</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="knowledgeShared"
                checked={closureForm.knowledgeShared}
                onCheckedChange={(checked) =>
                  setClosureForm((prev) => ({
                    ...prev,
                    knowledgeShared: checked === true,
                  }))
                }
              />
              <Label htmlFor="knowledgeShared">{t('capa.knowledgeShared')}</Label>
            </div>
            <div className="space-y-2">
              <Label htmlFor="closedBy">{t('capa.closedBy')} *</Label>
              <Input
                id="closedBy"
                value={closureForm.closedBy}
                onChange={(e) =>
                  setClosureForm((prev) => ({
                    ...prev,
                    closedBy: e.target.value,
                  }))
                }
                placeholder={t('capa.closedBy')}
              />
            </div>
          </div>
        );

      default:
        return null;
    }
  };

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
          {canReject && (
            <Button variant="destructive" size="sm" onClick={handleOpenRejectDialog}>
              <XCircle className="h-4 w-4 mr-2" />
              {t('capa.rejectCapa')}
            </Button>
          )}
          {canAdvance && nextStatus && (
            <Button onClick={handleOpenAdvanceDialog}>
              <ArrowRight className="h-4 w-4 mr-2" />
              {t('capa.advanceStage')}: {CAPA_STATUS_LABELS[nextStatus]}
            </Button>
          )}
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
                {currentCAPA.discovery.discoveredBy} /{' '}
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
                  {currentCAPA.investigation.investigatedBy} /{' '}
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
                              {action.assignedTo} / {formatDate(action.dueDate)}
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
                              {action.assignedTo} / {formatDate(action.dueDate)}
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
                  {currentCAPA.verification.verifiedBy} /{' '}
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

              {/* Stage Transition Buttons in Sidebar */}
              {(canAdvance || canReject) && (
                <>
                  <Separator />
                  <div className="space-y-2">
                    <p className="text-sm font-medium">{t('capa.stageTransition')}</p>
                    {canAdvance && nextStatus && (
                      <Button
                        className="w-full"
                        size="sm"
                        onClick={handleOpenAdvanceDialog}
                      >
                        <ArrowRight className="h-4 w-4 mr-2" />
                        {CAPA_STATUS_LABELS[nextStatus]}
                      </Button>
                    )}
                    {canReject && (
                      <Button
                        variant="destructive"
                        className="w-full"
                        size="sm"
                        onClick={handleOpenRejectDialog}
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

      {/* Advance Stage Dialog */}
      <Dialog open={advanceDialogOpen} onOpenChange={setAdvanceDialogOpen}>
        <DialogContent className="sm:max-w-[525px]">
          <DialogHeader>
            <DialogTitle>{t('capa.confirmAdvance')}</DialogTitle>
            <DialogDescription>{t('capa.confirmAdvanceDesc')}</DialogDescription>
          </DialogHeader>

          {/* Current → Next stage indicator */}
          <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
            <div className="flex items-center gap-2">
              <Badge className={STATUS_COLORS[currentCAPA.status]}>
                {CAPA_STATUS_LABELS[currentCAPA.status]}
              </Badge>
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground" />
            <div className="flex items-center gap-2">
              {nextStatus && (
                <Badge className={STATUS_COLORS[nextStatus]}>
                  {CAPA_STATUS_LABELS[nextStatus]}
                </Badge>
              )}
            </div>
          </div>

          {/* Stage-specific fields */}
          <div className="max-h-[400px] overflow-y-auto">
            {renderStageFields()}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setAdvanceDialogOpen(false)}
              disabled={isSubmitting}
            >
              {t('common.cancel')}
            </Button>
            <Button
              onClick={handleAdvanceStage}
              disabled={isSubmitting || !isAdvanceFormValid()}
            >
              {isSubmitting ? t('common.saving') : t('common.confirm')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{t('capa.confirmReject')}</DialogTitle>
            <DialogDescription>{t('capa.confirmRejectDesc')}</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="rejectReason">{t('capa.rejectReason')} *</Label>
              <Textarea
                id="rejectReason"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                rows={4}
                placeholder={t('capa.rejectReasonPlaceholder')}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRejectDialogOpen(false)}
              disabled={isSubmitting}
            >
              {t('common.cancel')}
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={isSubmitting || !rejectReason.trim()}
            >
              {isSubmitting ? t('common.saving') : t('capa.rejectCapa')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
