import { useTranslation } from 'react-i18next';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { TechModel } from '@/types/techModel';

interface GuidelineFilterCardProps {
  modelFilter: string;
  onModelFilterChange: (value: string) => void;
  models: TechModel[];
  filteredCount: number;
}

export function GuidelineFilterCard({
  modelFilter,
  onModelFilterChange,
  models,
  filteredCount,
}: GuidelineFilterCardProps) {
  const { t } = useTranslation();

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center gap-4">
          <div className="w-64">
            <Label>{t('tech.guidelines.filterByModel')}</Label>
            <Select value={modelFilter} onValueChange={onModelFilterChange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('common.all')}</SelectItem>
                {models.map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    {m.season} - {m.modelName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="text-sm text-muted-foreground mt-5">
            {t('common.count')}: {filteredCount}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
