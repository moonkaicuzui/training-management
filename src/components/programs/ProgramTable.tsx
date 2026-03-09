import { useTranslation } from 'react-i18next';
import { MoreHorizontal, Pencil, Trash2, Eye, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/common/EmptyState';
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { TrainingProgram } from '@/types';

interface ProgramTableProps {
  programs: TrainingProgram[];
  language: string;
  onViewDetail: (program: TrainingProgram) => void;
  onEdit: (program: TrainingProgram) => void;
  onDelete: (programCode: string) => void;
  onCreateNew: () => void;
}

function getProgramName(program: TrainingProgram, language: string): string {
  switch (language) {
    case 'vi':
      return program.program_name_vn || program.program_name;
    case 'ko':
      return program.program_name_kr || program.program_name;
    default:
      return program.program_name;
  }
}

function getCategoryBadgeVariant(category: string): string {
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
}

export function ProgramTable({
  programs,
  language,
  onViewDetail,
  onEdit,
  onDelete,
  onCreateNew,
}: ProgramTableProps) {
  const { t } = useTranslation();

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('program.list')}</CardTitle>
        <CardDescription>{t('program.count', { count: programs.length })}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[80px]">{t('program.code')}</TableHead>
                <TableHead>{t('program.name')}</TableHead>
                <TableHead>{t('program.category')}</TableHead>
                <TableHead className="hidden md:table-cell">{t('program.targetPositions')}</TableHead>
                <TableHead className="text-center">{t('program.passingScore')}</TableHead>
                <TableHead className="text-center hidden sm:table-cell">{t('program.duration')}</TableHead>
                <TableHead className="text-center hidden sm:table-cell">{t('program.validity')}</TableHead>
                <TableHead className="hidden sm:table-cell">{t('common.status')}</TableHead>
                <TableHead className="w-[80px]">{t('common.actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {programs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9}>
                    <EmptyState
                      icon={BookOpen}
                      title={t('program.emptyTitle')}
                      description={t('program.emptyDescription')}
                      actionLabel={t('program.addProgram')}
                      onAction={onCreateNew}
                    />
                  </TableCell>
                </TableRow>
              ) : (
                programs.map((program) => (
                  <TableRow key={program.program_code}>
                    <TableCell className="font-mono font-medium">
                      {program.program_code}
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{getProgramName(program, language)}</div>
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
                    <TableCell className="hidden md:table-cell">
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
                    <TableCell className="text-center hidden sm:table-cell">
                      {program.duration_hours}{t('program.hours')}
                    </TableCell>
                    <TableCell className="text-center hidden sm:table-cell">
                      {program.validity_months
                        ? `${program.validity_months}${t('program.months')}`
                        : '-'}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
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
                          <DropdownMenuItem onClick={() => onViewDetail(program)}>
                            <Eye className="h-4 w-4 mr-2" />
                            {t('program.viewDetail')}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onEdit(program)}>
                            <Pencil className="h-4 w-4 mr-2" />
                            {t('common.edit')}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => onDelete(program.program_code)}
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
        </div>
      </CardContent>
    </Card>
  );
}
