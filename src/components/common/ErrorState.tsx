import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTranslation } from 'react-i18next';

interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
}

export function ErrorState({ message, onRetry }: ErrorStateProps) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4" role="alert" aria-live="assertive">
      <div className="rounded-full bg-destructive/10 p-6">
        <AlertTriangle className="h-12 w-12 text-destructive" />
      </div>
      <p className="text-lg text-muted-foreground">
        {message ?? t('messages.loadError')}
      </p>
      {onRetry && (
        <Button onClick={onRetry} variant="outline">
          {t('common.retry')}
        </Button>
      )}
    </div>
  );
}
