/**
 * Audit Badge Components
 * StatusBadge, SeverityBadge, ActionStatusBadge - 감사 상태/심각도/조치 배지
 */

import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

// 상태별 배지 컴포넌트
export const StatusBadge = memo(function StatusBadge({
  status,
}: {
  status: 'COMPLIANT' | 'NON_COMPLIANT' | 'PARTIAL' | 'NOT_APPLICABLE';
}) {
  const { t } = useTranslation();
  switch (status) {
    case 'COMPLIANT':
      return (
        <Badge className="bg-green-500 hover:bg-green-600">
          <CheckCircle2 className="h-3 w-3 mr-1" />
          {t('auditCompliance.statusCompliant')}
        </Badge>
      );
    case 'NON_COMPLIANT':
      return (
        <Badge className="bg-red-500 hover:bg-red-600">
          <XCircle className="h-3 w-3 mr-1" />
          {t('auditCompliance.statusNonCompliant')}
        </Badge>
      );
    case 'PARTIAL':
      return (
        <Badge className="bg-yellow-500 hover:bg-yellow-600">
          <AlertTriangle className="h-3 w-3 mr-1" />
          {t('auditCompliance.statusPartial')}
        </Badge>
      );
    case 'NOT_APPLICABLE':
      return (
        <Badge variant="secondary">
          {t('auditCompliance.statusNA')}
        </Badge>
      );
  }
});

// 심각도별 배지 컴포넌트
export const SeverityBadge = memo(function SeverityBadge({
  severity,
}: {
  severity: 'CRITICAL' | 'MAJOR' | 'MINOR' | 'OBSERVATION';
}) {
  const { t } = useTranslation();
  switch (severity) {
    case 'CRITICAL':
      return <Badge className="bg-red-600">{t('auditCompliance.severityCritical')}</Badge>;
    case 'MAJOR':
      return <Badge className="bg-orange-500">{t('auditCompliance.severityMajor')}</Badge>;
    case 'MINOR':
      return <Badge className="bg-yellow-500">{t('auditCompliance.severityMinor')}</Badge>;
    case 'OBSERVATION':
      return <Badge variant="secondary">{t('auditCompliance.severityObservation')}</Badge>;
  }
});

// 조치 상태별 배지
export const ActionStatusBadge = memo(function ActionStatusBadge({
  status,
}: {
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'OVERDUE';
}) {
  const { t } = useTranslation();
  switch (status) {
    case 'COMPLETED':
      return <Badge className="bg-green-500">{t('auditCompliance.actionCompleted')}</Badge>;
    case 'IN_PROGRESS':
      return <Badge className="bg-blue-500">{t('auditCompliance.actionInProgress')}</Badge>;
    case 'PENDING':
      return <Badge variant="secondary">{t('auditCompliance.actionPending')}</Badge>;
    case 'OVERDUE':
      return <Badge className="bg-red-500">{t('auditCompliance.actionOverdue')}</Badge>;
  }
});
