import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Search, MoreHorizontal, Pencil, Trash2, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { useTrainingStore } from '@/stores/trainingStore';
import { useUIStore } from '@/stores/uiStore';
import { PageLoading } from '@/components/common/LoadingSpinner';
import type { ProgramCategory } from '@/types';
import { categories } from '@/data/mockData';

export default function Programs() {
  const { t } = useTranslation();
  const { programs, loading, fetchPrograms, deleteProgram } = useTrainingStore();
  const { addToast, language } = useUIStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [showInactive, setShowInactive] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [programToDelete, setProgramToDelete] = useState<string | null>(null);

  useEffect(() => {
    fetchPrograms({
      search: searchQuery || undefined,
      category: categoryFilter !== 'all' ? (categoryFilter as ProgramCategory) : undefined,
      showInactive,
    });
  }, [searchQuery, categoryFilter, showInactive]);

  const handleDelete = async () => {
    if (!programToDelete) return;

    try {
      await deleteProgram(programToDelete);
      addToast({
        type: 'success',
        title: t('messages.deleteSuccess'),
      });
    } catch (error) {
      addToast({
        type: 'error',
        title: t('messages.deleteError'),
      });
    } finally {
      setDeleteDialogOpen(false);
      setProgramToDelete(null);
    }
  };

  const getProgramName = (program: typeof programs[0]) => {
    switch (language) {
      case 'vi':
        return program.program_name_vn || program.program_name;
      case 'ko':
        return program.program_name_kr || program.program_name;
      default:
        return program.program_name;
    }
  };

  const getCategoryBadgeVariant = (category: string) => {
    switch (category) {
      case 'QIP':
        return 'default';
      case 'PRODUCTION':
        return 'secondary';
      case 'RETRAINING':
        return 'warning';
      case 'NEWCOMER':
        return 'success';
      case 'PROMOTION':
        return 'default';
      default:
        return 'outline';
    }
  };

  if (loading.programs) {
    return <PageLoading />;
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t('program.title')}</h1>
          <p className="text-muted-foreground">
            {t('program.description')}
          </p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          {t('program.addProgram')}
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t('program.searchPlaceholder')}
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder={t('program.category')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('common.all')}</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {t(`category.${cat.value}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="showInactive"
                checked={showInactive}
                onCheckedChange={(checked) => setShowInactive(checked === true)}
              />
              <Label htmlFor="showInactive" className="text-sm">
                {t('program.includeInactive')}
              </Label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Programs Table */}
      <Card>
        <CardHeader>
          <CardTitle>{t('program.list')}</CardTitle>
          <CardDescription>{t('program.count', { count: programs.length })}</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[80px]">{t('program.code')}</TableHead>
                <TableHead>{t('program.name')}</TableHead>
                <TableHead>{t('program.category')}</TableHead>
                <TableHead>{t('program.targetPositions')}</TableHead>
                <TableHead className="text-center">{t('program.passingScore')}</TableHead>
                <TableHead className="text-center">{t('program.duration')}</TableHead>
                <TableHead className="text-center">{t('program.validity')}</TableHead>
                <TableHead>{t('common.status')}</TableHead>
                <TableHead className="w-[80px]">{t('common.actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {programs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                    {t('common.noData')}
                  </TableCell>
                </TableRow>
              ) : (
                programs.map((program) => (
                  <TableRow key={program.program_code}>
                    <TableCell className="font-mono font-medium">
                      {program.program_code}
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{getProgramName(program)}</div>
                      {program.tags.length > 0 && (
                        <div className="flex gap-1 mt-1">
                          {program.tags.slice(0, 3).map((tag) => (
                            <Badge key={tag} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={getCategoryBadgeVariant(program.category) as 'default'}>
                        {t(`category.${program.category}`)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {program.target_positions.slice(0, 2).map((pos) => (
                          <Badge key={pos} variant="outline" className="text-xs">
                            {pos}
                          </Badge>
                        ))}
                        {program.target_positions.length > 2 && (
                          <Badge variant="outline" className="text-xs">
                            +{program.target_positions.length - 2}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-center font-medium">
                      {program.passing_score}{t('program.scoreUnit')}
                    </TableCell>
                    <TableCell className="text-center">
                      {program.duration_hours}{t('program.hours')}
                    </TableCell>
                    <TableCell className="text-center">
                      {program.validity_months
                        ? `${program.validity_months}${t('program.months')}`
                        : '-'}
                    </TableCell>
                    <TableCell>
                      <Badge variant={program.is_active ? 'success' : 'inactive'}>
                        {program.is_active ? t('common.active') : t('common.inactive')}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <Eye className="h-4 w-4 mr-2" />
                            {t('program.viewDetail')}
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Pencil className="h-4 w-4 mr-2" />
                            {t('common.edit')}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => {
                              setProgramToDelete(program.program_code);
                              setDeleteDialogOpen(true);
                            }}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            {t('common.delete')}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('messages.confirmDeleteTitle')}</DialogTitle>
            <DialogDescription>
              {t('program.confirmDelete')}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              {t('common.delete')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
