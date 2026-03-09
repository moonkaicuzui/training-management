import { useTranslation } from 'react-i18next';
import { Plus, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
} from '@/components/ui/card';

interface EmptyTemplateStateProps {
  onAdd: () => void;
}

export default function EmptyTemplateState({ onAdd }: EmptyTemplateStateProps) {
  const { t } = useTranslation();

  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center py-12">
        <FileText className="h-12 w-12 text-muted-foreground/50 mb-4" />
        <p className="text-lg font-medium text-muted-foreground">
          {t('certificates.noTemplates')}
        </p>
        <p className="text-sm text-muted-foreground mb-4">
          {t('certificates.createFirstTemplate')}
        </p>
        <Button onClick={onAdd}>
          <Plus className="h-4 w-4 mr-2" />
          {t('certificates.addTemplate')}
        </Button>
      </CardContent>
    </Card>
  );
}
