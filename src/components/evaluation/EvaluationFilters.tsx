import { useTranslation } from 'react-i18next';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search } from 'lucide-react';

interface EvaluationFiltersProps {
  searchTerm: string;
  onSearchTermChange: (value: string) => void;
  selectedType: string;
  onSelectedTypeChange: (value: string) => void;
  selectedStatus: string;
  onSelectedStatusChange: (value: string) => void;
}

export default function EvaluationFilters({
  searchTerm,
  onSearchTermChange,
  selectedType,
  onSelectedTypeChange,
  selectedStatus,
  onSelectedStatusChange,
}: EvaluationFiltersProps) {
  const { t } = useTranslation();

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t('evaluation.searchPlaceholder')}
                value={searchTerm}
                onChange={(e) => onSearchTermChange(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>
          <Select value={selectedType} onValueChange={onSelectedTypeChange}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder={t('evaluation.typeFilter')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('evaluation.allTypes')}</SelectItem>
              <SelectItem value="reaction">{t('evaluation.typeReaction')}</SelectItem>
              <SelectItem value="learning">{t('evaluation.typeLearning')}</SelectItem>
              <SelectItem value="behavior">{t('evaluation.typeBehavior')}</SelectItem>
              <SelectItem value="results">{t('evaluation.typeResults')}</SelectItem>
            </SelectContent>
          </Select>
          <Select value={selectedStatus} onValueChange={onSelectedStatusChange}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder={t('evaluation.statusFilter')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('evaluation.allStatuses')}</SelectItem>
              <SelectItem value="pending">{t('evaluation.statusPending')}</SelectItem>
              <SelectItem value="submitted">{t('evaluation.statusSubmitted')}</SelectItem>
              <SelectItem value="reviewed">{t('evaluation.statusReviewed')}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
}
