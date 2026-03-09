import { useTranslation } from 'react-i18next';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ExportDropdown } from '@/components/common/ExportDropdown';

interface ResultsToolbarProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  resultFilter: string;
  onResultFilterChange: (value: string) => void;
  onExportExcel: () => void;
  onExportPDF: () => void;
  exporting: boolean;
}

export function ResultsToolbar({
  searchQuery,
  onSearchChange,
  resultFilter,
  onResultFilterChange,
  onExportExcel,
  onExportPDF,
  exporting,
}: ResultsToolbarProps) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-wrap gap-2">
      <div className="relative">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder={t('results.searchPlaceholder')}
          className="pl-8 w-full sm:w-[200px]"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>
      <Select value={resultFilter} onValueChange={onResultFilterChange}>
        <SelectTrigger className="w-[120px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{t('common.all')}</SelectItem>
          <SelectItem value="PASS">{t('training.pass')}</SelectItem>
          <SelectItem value="FAIL">{t('training.fail')}</SelectItem>
          <SelectItem value="ABSENT">{t('training.absent')}</SelectItem>
        </SelectContent>
      </Select>
      <ExportDropdown
        onExportExcel={onExportExcel}
        onExportPDF={onExportPDF}
        loading={exporting}
      />
    </div>
  );
}
