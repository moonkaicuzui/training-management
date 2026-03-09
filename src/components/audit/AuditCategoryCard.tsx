/**
 * Audit Category Card Component
 * 카테고리별 요약 카드 + calculateCategorySummaries 유틸리티
 */

import { useState, memo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ChevronDown,
  ChevronRight,
  AlertCircle,
  FileText,
  Clock,
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { StatusBadge } from '@/components/audit/AuditBadges';
import type {
  AuditComplianceMetric,
  AuditCategory,
  AuditCategorySummary,
} from '@/types/executive';

// 카테고리별 i18n 키 매핑
const categoryI18nKeys: Record<AuditCategory, string> = {
  TRAINING_COVERAGE: 'auditCompliance.catTrainingScope',
  CERTIFICATION: 'auditCompliance.catQualification',
  DOCUMENTATION: 'auditCompliance.catDocumentation',
  COMPETENCY: 'auditCompliance.catCompetencyEval',
  RETRAINING: 'auditCompliance.catRetraining',
  RECORDS_RETENTION: 'auditCompliance.catRecordKeeping',
};

export { categoryI18nKeys };

// 카테고리별 요약 계산
export function calculateCategorySummaries(
  metrics: AuditComplianceMetric[]
): AuditCategorySummary[] {
  const categories = Object.keys(categoryI18nKeys) as AuditCategory[];

  return categories.map((category) => {
    const categoryMetrics = metrics.filter((m) => m.category === category);
    const compliantCount = categoryMetrics.filter(
      (m) => m.currentStatus === 'COMPLIANT'
    ).length;
    const nonCompliantCount = categoryMetrics.filter(
      (m) => m.currentStatus === 'NON_COMPLIANT'
    ).length;
    const partialCount = categoryMetrics.filter(
      (m) => m.currentStatus === 'PARTIAL'
    ).length;
    const totalCount = categoryMetrics.length;

    const score =
      totalCount > 0
        ? Math.round(((compliantCount + partialCount * 0.5) / totalCount) * 100)
        : 100;

    let status: 'PASS' | 'ATTENTION' | 'FAIL';
    if (nonCompliantCount > 0) {
      status = 'FAIL';
    } else if (partialCount > 0) {
      status = 'ATTENTION';
    } else {
      status = 'PASS';
    }

    return {
      category,
      categoryName: categoryI18nKeys[category],
      compliantCount,
      nonCompliantCount,
      partialCount,
      totalCount,
      score,
      status,
    };
  });
}

// 카테고리 카드 컴포넌트
export const CategoryCard = memo(function CategoryCard({
  summary,
  metrics,
}: {
  summary: AuditCategorySummary;
  metrics: AuditComplianceMetric[];
}) {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card
        className={`border-l-4 ${
          summary.status === 'PASS'
            ? 'border-l-green-500'
            : summary.status === 'ATTENTION'
              ? 'border-l-yellow-500'
              : 'border-l-red-500'
        }`}
      >
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {isOpen ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
                <div>
                  <CardTitle className="text-base">
                    {t(summary.categoryName)}
                  </CardTitle>
                  <CardDescription>
                    {t('auditCompliance.categoryItemCount', { total: summary.totalCount, compliant: summary.compliantCount })}
                  </CardDescription>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <span className="text-2xl font-bold">{summary.score}%</span>
                </div>
                <Badge
                  className={
                    summary.status === 'PASS'
                      ? 'bg-green-500'
                      : summary.status === 'ATTENTION'
                        ? 'bg-yellow-500'
                        : 'bg-red-500'
                  }
                >
                  {summary.status === 'PASS'
                    ? t('auditCompliance.categoryStatusPass')
                    : summary.status === 'ATTENTION'
                      ? t('auditCompliance.categoryStatusWarning')
                      : t('auditCompliance.categoryStatusFail')}
                </Badge>
              </div>
            </div>
            <Progress value={summary.score} className="mt-2 h-2" />
          </CardHeader>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent className="pt-0">
            <div className="space-y-3">
              {metrics.map((metric) => (
                <div
                  key={metric.id}
                  className="p-3 bg-muted/50 rounded-lg space-y-2"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="font-medium">{metric.requirement}</div>
                      <div className="text-sm text-muted-foreground">
                        {metric.description}
                      </div>
                    </div>
                    <StatusBadge status={metric.currentStatus} />
                  </div>

                  {metric.currentValue !== undefined && (
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-muted-foreground">{t('auditCompliance.metricCurrent')}</span>
                      <span className="font-medium">
                        {metric.currentValue}
                        {metric.unit}
                      </span>
                      {metric.targetValue !== undefined && (
                        <>
                          <span className="text-muted-foreground">/ {t('auditCompliance.metricTarget')}</span>
                          <span>
                            {metric.targetValue}
                            {metric.unit}
                          </span>
                        </>
                      )}
                    </div>
                  )}

                  {metric.actionRequired && (
                    <div className="flex items-start gap-2 text-sm text-orange-600">
                      <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                      <span>{metric.actionRequired}</span>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-1">
                    {metric.evidence.map((e) => (
                      <Badge key={e} variant="outline" className="text-xs">
                        <FileText className="h-3 w-3 mr-1" />
                        {e}
                      </Badge>
                    ))}
                  </div>

                  <div className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {t('auditCompliance.lastChecked')} {metric.lastChecked}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
});
