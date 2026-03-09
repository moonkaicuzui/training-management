import { useTranslation } from 'react-i18next';
import { Search, Trash2, List, Grid3X3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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

interface MaterialsToolbarProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  selectedType: string;
  onTypeChange: (value: string) => void;
  viewMode: 'grid' | 'list';
  onViewModeChange: (mode: 'grid' | 'list') => void;
  selectedItemsCount: number;
  onDeleteSelected: () => void;
}

export function MaterialsToolbar({
  searchTerm,
  onSearchChange,
  selectedType,
  onTypeChange,
  viewMode,
  onViewModeChange,
  selectedItemsCount,
  onDeleteSelected,
}: MaterialsToolbarProps) {
  const { t } = useTranslation();

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex flex-wrap gap-4 items-center justify-between">
          <div className="flex flex-wrap gap-4 flex-1">
            <div className="flex-1 min-w-[200px] max-w-md">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={t('materials.searchPlaceholder')}
                  value={searchTerm}
                  onChange={(e) => onSearchChange(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            <Select value={selectedType} onValueChange={onTypeChange}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder={t('materials.allTypes')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('materials.allTypes')}</SelectItem>
                <SelectItem value="document">{t('materials.typeDocument')}</SelectItem>
                <SelectItem value="video">{t('materials.typeVideo')}</SelectItem>
                <SelectItem value="image">{t('materials.typeImage')}</SelectItem>
                <SelectItem value="archive">{t('materials.typeArchive')}</SelectItem>
                <SelectItem value="other">{t('materials.typeOther')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-2">
            {selectedItemsCount > 0 && (
              <Button variant="destructive" size="sm" onClick={onDeleteSelected}>
                <Trash2 className="h-4 w-4 mr-1" />
                {t('common.delete')}
              </Button>
            )}
            <div className="flex border rounded-md">
              <Button
                variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => onViewModeChange('list')}
              >
                <List className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => onViewModeChange('grid')}
              >
                <Grid3X3 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
