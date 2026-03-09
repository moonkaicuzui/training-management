/**
 * Audit Detail View Component
 * 발견사항(Findings) + 시정조치(Corrective Actions) 탭 콘텐츠
 */

import { useTranslation } from 'react-i18next';
import {
  CheckCircle2,
  FileText,
  Calendar,
  User,
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { SeverityBadge, ActionStatusBadge } from '@/components/audit/AuditBadges';
import { categoryI18nKeys } from '@/components/audit/AuditCategoryCard';
import type { AuditFinding, CorrectiveAction } from '@/types/executive';

interface AuditFindingsViewProps {
  findings: AuditFinding[];
}

export function AuditFindingsView({ findings }: AuditFindingsViewProps) {
  const { t } = useTranslation();

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('auditCompliance.findingsTitle')}</CardTitle>
        <CardDescription>
          {t('auditCompliance.findingsDesc')}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {findings.map((finding) => (
            <div
              key={finding.id}
              className="p-4 border rounded-lg space-y-3"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <SeverityBadge severity={finding.severity} />
                  <Badge variant="outline">
                    {t(categoryI18nKeys[finding.category])}
                  </Badge>
                </div>
                <span className="text-xs text-muted-foreground">
                  {finding.id}
                </span>
              </div>

              <div>
                <p className="font-medium">{finding.description}</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {t('auditCompliance.requirement')} {finding.requirement}
                </p>
              </div>

              <div className="flex items-start gap-2 text-sm">
                <FileText className="h-4 w-4 mt-0.5 text-muted-foreground" />
                <span className="text-muted-foreground">
                  {t('auditCompliance.evidence')} {finding.evidence}
                </span>
              </div>

              <div className="p-3 bg-blue-50 rounded-lg">
                <p className="text-sm font-medium text-blue-700">
                  {t('auditCompliance.recommendation')}
                </p>
                <p className="text-sm text-blue-600">
                  {finding.recommendation}
                </p>
              </div>
            </div>
          ))}

          {findings.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <CheckCircle2 className="h-12 w-12 mx-auto mb-4 text-green-500" />
              <p>{t('auditCompliance.noFindings')}</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

interface AuditActionsViewProps {
  correctiveActions: CorrectiveAction[];
  findings: AuditFinding[];
}

export function AuditActionsView({ correctiveActions, findings }: AuditActionsViewProps) {
  const { t } = useTranslation();

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('auditCompliance.actionsTitle')}</CardTitle>
        <CardDescription>{t('auditCompliance.actionsDesc')}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {correctiveActions.map((action) => {
            const finding = findings.find(
              (f) => f.id === action.findingId
            );

            return (
              <div
                key={action.id}
                className="p-4 border rounded-lg space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <ActionStatusBadge status={action.status} />
                    {finding && (
                      <span className="text-sm text-muted-foreground">
                        {t('auditCompliance.relatedTo')} {finding.description}
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {action.id}
                  </span>
                </div>

                <p className="font-medium">{action.action}</p>

                <div className="flex flex-wrap gap-4 text-sm">
                  <div className="flex items-center gap-1">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span>{t('auditCompliance.assignee')} {action.responsiblePerson}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>{t('auditCompliance.targetDate')} {action.targetDate}</span>
                  </div>
                  {action.completedDate && (
                    <div className="flex items-center gap-1 text-green-600">
                      <CheckCircle2 className="h-4 w-4" />
                      <span>{t('auditCompliance.completionDate')} {action.completedDate}</span>
                    </div>
                  )}
                </div>

                {action.verificationNotes && (
                  <div className="p-3 bg-green-50 rounded-lg text-sm">
                    <p className="font-medium text-green-700">{t('auditCompliance.verificationNotes')}</p>
                    <p className="text-green-600">
                      {action.verificationNotes}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
