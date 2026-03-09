import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Download, Plus } from 'lucide-react';

interface EvaluationHeaderProps {
  onExportExcel: () => void;
  onNewEvaluation: () => void;
}

export function EvaluationHeader({
  onExportExcel,
  onNewEvaluation,
}: EvaluationHeaderProps) {
  const { t } = useTranslation();

  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t('evaluation.title')}</h1>
        <p className="text-muted-foreground">
          {t('evaluation.description')}
        </p>
      </div>
      <div className="flex gap-2">
        <Button variant="outline" onClick={onExportExcel}>
          <Download className="mr-2 h-4 w-4" />
          {t('evaluation.exportExcel')}
        </Button>
        <Button onClick={onNewEvaluation}>
          <Plus className="mr-2 h-4 w-4" />
          {t('evaluation.newEvaluation')}
        </Button>
      </div>
    </div>
  );
}
