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
import { Label } from '@/components/ui/label';

import {
  CAPA_STATUS_LABELS,
  type CAPAStatus,
  type CAPAStageUpdate,
  type CAPA,
} from '@/types/capa';

// Re-export types and constants from stage-forms/types for backward compatibility
export type {
  InvestigationFormData,
  ActionFormData,
  VerificationFormData,
  ClosureFormData,
} from '@/components/capa/stage-forms/types';

export { STATUS_COLORS, SEVERITY_COLORS } from '@/components/capa/stage-forms/types';

import { STATUS_COLORS } from '@/components/capa/stage-forms/types';
import type {
  InvestigationFormData,
  ActionFormData,
  VerificationFormData,
  ClosureFormData,
} from '@/components/capa/stage-forms/types';

import { InvestigationForm } from '@/components/capa/stage-forms/InvestigationForm';
import { ActionForm } from '@/components/capa/stage-forms/ActionForm';
import { VerificationForm } from '@/components/capa/stage-forms/VerificationForm';
import { ClosureForm } from '@/components/capa/stage-forms/ClosureForm';

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
          <InvestigationForm
            currentCAPA={currentCAPA}
            form={investigationForm}
            onChange={setInvestigationForm}
            validationErrors={stageValidationErrors}
          />
        );
      case 'investigation':
        return (
          <ActionForm
            form={actionForm}
            onChange={setActionForm}
            validationErrors={stageValidationErrors}
          />
        );
      case 'action':
        return (
          <VerificationForm
            form={verificationForm}
            onChange={setVerificationForm}
            validationErrors={stageValidationErrors}
          />
        );
      case 'verification':
        return (
          <ClosureForm
            verificationForm={verificationForm}
            onVerificationChange={setVerificationForm}
            closureForm={closureForm}
            onClosureChange={setClosureForm}
            validationErrors={stageValidationErrors}
          />
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
