/**
 * CAPA Stage Dialogs
 *
 * 5개 단계별 전환 다이얼로그 + 거부 다이얼로그
 * - Discovery → Investigation 폼
 * - Investigation → Action 폼
 * - Action → Verification 폼
 * - Verification → Closure 폼
 * - Reject 다이얼로그
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowRight } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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

import { CAPAAISuggestions } from '@/components/capa/CAPAAISuggestions';
import {
  CAPA_STATUS_LABELS,
  type CAPAStatus,
  type CAPASeverity,
  type CAPAStageUpdate,
  type CAPA,
} from '@/types/capa';

// Status badge colors (shared with CAPADetail)
export const STATUS_COLORS: Record<CAPAStatus, string> = {
  discovery: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
  investigation: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
  action: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
  verification: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
  closed: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  rejected: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300',
};

export const SEVERITY_COLORS: Record<CAPASeverity, string> = {
  critical: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
  major: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
  minor: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
};

// Stage-specific form data interfaces
export interface InvestigationFormData {
  rootCauseAnalysis: string;
  impactAssessment: string;
  findings: string;
  investigatedBy: string;
}

export interface ActionFormData {
  actionNotes: string;
  plannedBy: string;
}

export interface VerificationFormData {
  verificationMethod: string;
  effectivenessScore: string;
  isEffective: boolean;
  verificationNotes: string;
  verifiedBy: string;
}

export interface ClosureFormData {
  finalReview: string;
  lessonsLearned: string;
  documentationComplete: boolean;
  knowledgeShared: boolean;
  closedBy: string;
}

// ========== Advance Stage Dialog ==========

interface AdvanceStageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentCAPA: CAPA;
  nextStatus: CAPAStatus | null;
  userName: string;
  onSubmit: (stageUpdate: CAPAStageUpdate) => Promise<void>;
}

export function AdvanceStageDialog({
  open,
  onOpenChange,
  currentCAPA,
  nextStatus,
  userName,
  onSubmit,
}: AdvanceStageDialogProps) {
  const { t } = useTranslation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [stageValidationErrors, setStageValidationErrors] = useState<Record<string, string>>({});

  const [investigationForm, setInvestigationForm] = useState<InvestigationFormData>({
    rootCauseAnalysis: '',
    impactAssessment: '',
    findings: '',
    investigatedBy: userName,
  });

  const [actionForm, setActionForm] = useState<ActionFormData>({
    actionNotes: '',
    plannedBy: userName,
  });

  const [verificationForm, setVerificationForm] = useState<VerificationFormData>({
    verificationMethod: '',
    effectivenessScore: '',
    isEffective: true,
    verificationNotes: '',
    verifiedBy: userName,
  });

  const [closureForm, setClosureForm] = useState<ClosureFormData>({
    finalReview: '',
    lessonsLearned: '',
    documentationComplete: false,
    knowledgeShared: false,
    closedBy: userName,
  });

  // Validate stage-specific form data
  const validateAdvanceForm = (): boolean => {
    const errors: Record<string, string> = {};

    switch (currentCAPA.status) {
      case 'discovery':
        if (!currentCAPA.discovery?.immediateActions?.trim()) {
          errors.immediateActions = t('capa.validation.immediateActionRequired');
        }
        if (!investigationForm.rootCauseAnalysis.trim()) {
          errors.rootCauseAnalysis = t('capa.validation.rootCauseRequired');
        }
        if (!investigationForm.impactAssessment.trim()) {
          errors.impactAssessment = t('capa.validation.missingRequiredFields');
        }
        if (!investigationForm.findings.trim()) {
          errors.findings = t('capa.validation.missingRequiredFields');
        }
        if (!investigationForm.investigatedBy.trim()) {
          errors.investigatedBy = t('capa.validation.missingRequiredFields');
        }
        break;
      case 'investigation':
        if (!actionForm.actionNotes.trim()) {
          errors.actionNotes = t('capa.validation.missingRequiredFields');
        }
        if (!actionForm.plannedBy.trim()) {
          errors.plannedBy = t('capa.validation.missingRequiredFields');
        }
        break;
      case 'action':
        if (!verificationForm.verificationMethod.trim()) {
          errors.verificationMethod = t('capa.validation.missingRequiredFields');
        }
        if (!verificationForm.verificationNotes.trim()) {
          errors.verificationNotes = t('capa.validation.missingRequiredFields');
        }
        if (!verificationForm.verifiedBy.trim()) {
          errors.verifiedBy = t('capa.validation.missingRequiredFields');
        }
        break;
      case 'verification': {
        if (!verificationForm.effectivenessScore.trim()) {
          errors.effectivenessScore = t('capa.validation.effectivenessScoreRequired');
        } else {
          const score = Number(verificationForm.effectivenessScore);
          if (isNaN(score) || score < 0 || score > 100) {
            errors.effectivenessScore = t('capa.validation.effectivenessScoreRange');
          }
        }
        if (!closureForm.finalReview.trim()) {
          errors.finalReview = t('capa.validation.missingRequiredFields');
        }
        if (!closureForm.closedBy.trim()) {
          errors.closedBy = t('capa.validation.missingRequiredFields');
        }
        break;
      }
    }

    setStageValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Backward-compatible form validity check
  const isAdvanceFormValid = (): boolean => {
    switch (currentCAPA.status) {
      case 'discovery':
        return (
          (currentCAPA.discovery?.immediateActions?.trim() !== '' && currentCAPA.discovery?.immediateActions !== undefined) &&
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
      case 'verification': {
        const score = Number(verificationForm.effectivenessScore);
        return (
          verificationForm.effectivenessScore.trim() !== '' &&
          !isNaN(score) && score >= 0 && score <= 100 &&
          closureForm.finalReview.trim() !== '' &&
          closureForm.closedBy.trim() !== ''
        );
      }
      default:
        return false;
    }
  };

  // Build stage update and submit
  const handleAdvanceStage = async () => {
    if (!nextStatus) return;
    if (!validateAdvanceForm()) return;

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
            effectivenessScore: Number(verificationForm.effectivenessScore) || undefined,
            isEffective: verificationForm.isEffective,
            recurrenceCheck: false,
            verifiedBy: verificationForm.verifiedBy,
            verificationNotes: verificationForm.verificationNotes,
          };
          break;
        case 'verification':
          stageUpdate.verification = {
            verificationMethod: currentCAPA.verification?.verificationMethod || '',
            effectivenessScore: Number(verificationForm.effectivenessScore),
            isEffective: currentCAPA.verification?.isEffective ?? true,
            recurrenceCheck: currentCAPA.verification?.recurrenceCheck ?? false,
            verifiedBy: currentCAPA.verification?.verifiedBy || userName,
            verificationNotes: currentCAPA.verification?.verificationNotes || '',
          };
          stageUpdate.closure = {
            finalReview: closureForm.finalReview,
            lessonsLearned: closureForm.lessonsLearned || undefined,
            documentationComplete: closureForm.documentationComplete,
            knowledgeShared: closureForm.knowledgeShared,
            closedBy: closureForm.closedBy,
          };
          break;
      }

      await onSubmit(stageUpdate);
      onOpenChange(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Render stage-specific form fields
  const renderStageFields = () => {
    switch (currentCAPA.status) {
      case 'discovery':
        return (
          <div className="space-y-4">
            {(!currentCAPA.discovery?.immediateActions?.trim()) && (
              <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                <p className="text-sm text-destructive">
                  {t('capa.validation.immediateActionRequired')}
                </p>
              </div>
            )}
            {stageValidationErrors.immediateActions && (
              <p className="text-sm text-destructive">{stageValidationErrors.immediateActions}</p>
            )}

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
                className={stageValidationErrors.rootCauseAnalysis ? 'border-destructive' : ''}
              />
              {stageValidationErrors.rootCauseAnalysis && (
                <p className="text-sm text-destructive">{stageValidationErrors.rootCauseAnalysis}</p>
              )}
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
                className={stageValidationErrors.impactAssessment ? 'border-destructive' : ''}
              />
              {stageValidationErrors.impactAssessment && (
                <p className="text-sm text-destructive">{stageValidationErrors.impactAssessment}</p>
              )}
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
                className={stageValidationErrors.findings ? 'border-destructive' : ''}
              />
              {stageValidationErrors.findings && (
                <p className="text-sm text-destructive">{stageValidationErrors.findings}</p>
              )}
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
                className={stageValidationErrors.investigatedBy ? 'border-destructive' : ''}
              />
              {stageValidationErrors.investigatedBy && (
                <p className="text-sm text-destructive">{stageValidationErrors.investigatedBy}</p>
              )}
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
                className={stageValidationErrors.actionNotes ? 'border-destructive' : ''}
              />
              {stageValidationErrors.actionNotes && (
                <p className="text-sm text-destructive">{stageValidationErrors.actionNotes}</p>
              )}
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
                className={stageValidationErrors.plannedBy ? 'border-destructive' : ''}
              />
              {stageValidationErrors.plannedBy && (
                <p className="text-sm text-destructive">{stageValidationErrors.plannedBy}</p>
              )}
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
                className={stageValidationErrors.verificationMethod ? 'border-destructive' : ''}
              />
              {stageValidationErrors.verificationMethod && (
                <p className="text-sm text-destructive">{stageValidationErrors.verificationMethod}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="effectivenessScore">{t('capa.form.effectivenessScoreLabel')} *</Label>
              <Input
                id="effectivenessScore"
                type="number"
                min={0}
                max={100}
                value={verificationForm.effectivenessScore}
                onChange={(e) =>
                  setVerificationForm((prev) => ({
                    ...prev,
                    effectivenessScore: e.target.value,
                  }))
                }
                placeholder={t('capa.form.effectivenessScorePlaceholder')}
                className={stageValidationErrors.effectivenessScore ? 'border-destructive' : ''}
              />
              {stageValidationErrors.effectivenessScore && (
                <p className="text-sm text-destructive">{stageValidationErrors.effectivenessScore}</p>
              )}
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
                className={stageValidationErrors.verificationNotes ? 'border-destructive' : ''}
              />
              {stageValidationErrors.verificationNotes && (
                <p className="text-sm text-destructive">{stageValidationErrors.verificationNotes}</p>
              )}
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
                className={stageValidationErrors.verifiedBy ? 'border-destructive' : ''}
              />
              {stageValidationErrors.verifiedBy && (
                <p className="text-sm text-destructive">{stageValidationErrors.verifiedBy}</p>
              )}
            </div>
          </div>
        );

      case 'verification':
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="effectivenessScoreClosure">{t('capa.form.effectivenessScoreLabel')} *</Label>
              <Input
                id="effectivenessScoreClosure"
                type="number"
                min={0}
                max={100}
                value={verificationForm.effectivenessScore}
                onChange={(e) =>
                  setVerificationForm((prev) => ({
                    ...prev,
                    effectivenessScore: e.target.value,
                  }))
                }
                placeholder={t('capa.form.effectivenessScorePlaceholder')}
                className={stageValidationErrors.effectivenessScore ? 'border-destructive' : ''}
              />
              {stageValidationErrors.effectivenessScore && (
                <p className="text-sm text-destructive">{stageValidationErrors.effectivenessScore}</p>
              )}
            </div>
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
                className={stageValidationErrors.finalReview ? 'border-destructive' : ''}
              />
              {stageValidationErrors.finalReview && (
                <p className="text-sm text-destructive">{stageValidationErrors.finalReview}</p>
              )}
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
                className={stageValidationErrors.closedBy ? 'border-destructive' : ''}
              />
              {stageValidationErrors.closedBy && (
                <p className="text-sm text-destructive">{stageValidationErrors.closedBy}</p>
              )}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>{t('capa.confirmAdvance')}</DialogTitle>
          <DialogDescription>{t('capa.confirmAdvanceDesc')}</DialogDescription>
        </DialogHeader>

        {/* Current -> Next stage indicator */}
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
            onClick={() => onOpenChange(false)}
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
  );
}

// ========== Reject Dialog ==========

interface RejectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (stageUpdate: CAPAStageUpdate) => Promise<void>;
}

export function RejectDialog({
  open,
  onOpenChange,
  onSubmit,
}: RejectDialogProps) {
  const { t } = useTranslation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  const handleReject = async () => {
    if (!rejectReason.trim()) return;

    setIsSubmitting(true);
    try {
      const stageUpdate: CAPAStageUpdate = {
        status: 'rejected',
      };
      await onSubmit(stageUpdate);
      onOpenChange(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
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
            onClick={() => onOpenChange(false)}
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
  );
}
