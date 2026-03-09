import { useTranslation } from 'react-i18next';
import {
  GraduationCap,
  Mail,
  Phone,
  Star,
  MoreHorizontal,
  Edit,
  Trash2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { EmptyState } from '@/components/common/EmptyState';
import type { TrainerWithStats } from './types';

interface TrainerTableProps {
  trainers: TrainerWithStats[];
  onAdd: () => void;
  onEdit: (trainer: TrainerWithStats) => void;
  onDelete: (trainer: TrainerWithStats) => void;
}

export default function TrainerTable({
  trainers,
  onAdd,
  onEdit,
  onDelete,
}: TrainerTableProps) {
  const { t } = useTranslation();

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('trainers.trainerList')}</CardTitle>
        <CardDescription>
          {t('trainers.registeredCount', { count: trainers.length })}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('trainers.trainerName')}</TableHead>
              <TableHead>{t('trainers.type')}</TableHead>
              <TableHead>{t('trainers.affiliation')}</TableHead>
              <TableHead>{t('trainers.specialty')}</TableHead>
              <TableHead>{t('trainers.phone')}</TableHead>
              <TableHead>{t('trainers.sessionCount')}</TableHead>
              <TableHead>{t('trainers.rating')}</TableHead>
              <TableHead>{t('common.status')}</TableHead>
              <TableHead className="text-right">{t('common.actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {trainers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9}>
                  <EmptyState
                    icon={GraduationCap}
                    title={t('trainers.emptyTitle')}
                    description={t('trainers.emptyDescription')}
                    actionLabel={t('trainers.addTrainer')}
                    onAction={onAdd}
                  />
                </TableCell>
              </TableRow>
            ) : (
              trainers.map((trainer) => (
                <TableRow key={trainer.trainer_id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <GraduationCap className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{trainer.trainer_name}</p>
                        <p className="text-xs text-muted-foreground">{trainer.trainer_id}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={trainer.trainer_type === 'INTERNAL' ? 'default' : 'secondary'}>
                      {trainer.trainer_type === 'INTERNAL' ? t('trainers.internalShort') : t('trainers.externalShort')}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {trainer.trainer_type === 'INTERNAL' ? trainer.department : trainer.company}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {trainer.specializations.slice(0, 2).map((spec: string) => (
                        <Badge key={spec} variant="outline" className="text-xs">
                          {spec}
                        </Badge>
                      ))}
                      {trainer.specializations.length > 2 && (
                        <Badge variant="outline" className="text-xs">
                          +{trainer.specializations.length - 2}
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {trainer.email && (
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Mail className="h-3 w-3" />
                          <span className="truncate max-w-[120px]">{trainer.email}</span>
                        </div>
                      )}
                      {trainer.phone && (
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Phone className="h-3 w-3" />
                          <span>{trainer.phone}</span>
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    {trainer.total_sessions || 0}{t('trainers.sessionUnit')}
                  </TableCell>
                  <TableCell>
                    {trainer.average_rating && (
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                        <span className="font-medium">{trainer.average_rating.toFixed(1)}</span>
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={trainer.status === 'ACTIVE' ? 'success' : 'secondary'}>
                      {trainer.status === 'ACTIVE' ? t('common.active') : t('common.inactive')}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onEdit(trainer)}>
                          <Edit className="h-4 w-4 mr-2" />
                          {t('common.edit')}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => onDelete(trainer)}
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
  );
}
