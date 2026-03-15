/**
 * CAPA Status Timeline
 *
 * 워크플로우 단계 시각화 + 사이드바 타임라인
 */

import { useTranslation } from 'react-i18next';
import {
  CheckCircle2,
  FileText,
  Search,
  Hammer,
  ShieldCheck,
  XCircle,
} from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  CAPA_STATUS_ORDER,
  type CAPAStatus,
} from '@/types/capa';
import type { CAPA } from '@/types/capa';
import type { Timestamp } from 'firebase/firestore';

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

// ========== Workflow Steps (5-stage progress bar) ==========

interface WorkflowStepsProps {
  currentCAPA: CAPA;
}

export function WorkflowSteps({ currentCAPA }: WorkflowStepsProps) {
  const { t } = useTranslation();
  const currentStageIndex = CAPA_STATUS_ORDER.indexOf(currentCAPA.status);
  const filteredStatuses = CAPA_STATUS_ORDER.filter(s => s !== 'rejected');

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          {filteredStatuses.map((status, index) => {
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
                    {t(`capa.statusLabels.${status}`)}
                  </span>
                </div>
                {index < filteredStatuses.length - 1 && (
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
  );
}

// ========== History Timeline (sidebar) ==========

interface HistoryTimelineProps {
  currentCAPA: CAPA;
}

export function HistoryTimeline({ currentCAPA }: HistoryTimelineProps) {
  const { t } = useTranslation();

  return (
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
  );
}
