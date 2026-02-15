import { useState, useMemo, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { logger } from '@/utils/logger';
import * as api from '@/services/api';
import {
  Users,
  Plus,
  Search,
  Building2,
  Briefcase,
  Star,
  Phone,
  Mail,
  GraduationCap,
  MoreHorizontal,
  Edit,
  Trash2,
  FileText,
} from 'lucide-react';
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { Trainer, TrainerType } from '@/types';

// 확장된 타입 (통계 포함)
interface TrainerWithStats extends Trainer {
  total_sessions?: number;
  average_rating?: number;
}


// 강사 등록/수정 폼 다이얼로그
function TrainerFormDialog({
  open,
  onClose,
  onSaved,
  trainer,
}: {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  trainer?: TrainerWithStats | null;
}) {
  const { t } = useTranslation();
  const isEdit = !!trainer;
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    trainer_name: trainer?.trainer_name || '',
    trainer_type: trainer?.trainer_type || 'INTERNAL' as TrainerType,
    department: trainer?.department || '',
    company: trainer?.company || '',
    specializations: trainer?.specializations?.join(', ') || '',
    email: trainer?.email || '',
    phone: trainer?.phone || '',
    certifications: trainer?.certifications?.join(', ') || '',
  });

  const handleSubmit = async () => {
    setIsSaving(true);
    try {
      const trainerData = {
        trainer_name: formData.trainer_name,
        trainer_type: formData.trainer_type as TrainerType,
        department: formData.trainer_type === 'INTERNAL' ? formData.department : undefined,
        company: formData.trainer_type === 'EXTERNAL' ? formData.company : undefined,
        specializations: formData.specializations.split(',').map(s => s.trim()).filter(Boolean),
        email: formData.email || undefined,
        phone: formData.phone || undefined,
        certifications: formData.certifications ? formData.certifications.split(',').map(s => s.trim()).filter(Boolean) : undefined,
        status: 'ACTIVE' as const,
      };

      if (isEdit && trainer) {
        await api.updateTrainer(trainer.trainer_id, trainerData);
      } else {
        await api.createTrainer(trainerData);
      }
      onSaved();
      onClose();
    } catch (error) {
      logger.error('Failed to save trainer:', error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? t('trainers.editTrainer') : t('trainers.addTrainer')}</DialogTitle>
          <DialogDescription>
            {isEdit ? t('trainers.editDescription') : t('trainers.addDescription')}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t('trainers.nameRequired')}</Label>
              <Input
                value={formData.trainer_name}
                onChange={(e) => setFormData({ ...formData, trainer_name: e.target.value })}
                placeholder={t('trainers.namePlaceholder')}
              />
            </div>
            <div className="space-y-2">
              <Label>{t('trainers.typeRequired')}</Label>
              <Select
                value={formData.trainer_type}
                onValueChange={(value: TrainerType) => setFormData({ ...formData, trainer_type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="INTERNAL">{t('trainers.internal')}</SelectItem>
                  <SelectItem value="EXTERNAL">{t('trainers.external')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {formData.trainer_type === 'INTERNAL' ? (
            <div className="space-y-2">
              <Label>{t('trainers.department')}</Label>
              <Select
                value={formData.department}
                onValueChange={(value) => setFormData({ ...formData, department: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('trainers.departmentPlaceholder')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="QIP">QIP</SelectItem>
                  <SelectItem value="PRODUCTION">PRODUCTION</SelectItem>
                  <SelectItem value="MTL">MTL</SelectItem>
                  <SelectItem value="OSC">OSC</SelectItem>
                </SelectContent>
              </Select>
            </div>
          ) : (
            <div className="space-y-2">
              <Label>{t('trainers.company')}</Label>
              <Input
                value={formData.company}
                onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                placeholder={t('trainers.companyPlaceholder')}
              />
            </div>
          )}

          <div className="space-y-2">
            <Label>{t('trainers.specialty')}</Label>
            <Textarea
              value={formData.specializations}
              onChange={(e) => setFormData({ ...formData, specializations: e.target.value })}
              placeholder={t('trainers.specialtyPlaceholder')}
              rows={2}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t('trainers.email')}</Label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="email@example.com"
              />
            </div>
            <div className="space-y-2">
              <Label>{t('trainers.phone')}</Label>
              <Input
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="0901234567"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>{t('trainers.certifications')}</Label>
            <Input
              value={formData.certifications}
              onChange={(e) => setFormData({ ...formData, certifications: e.target.value })}
              placeholder={t('trainers.certificationsPlaceholder')}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSaving}>
            {t('common.cancel')}
          </Button>
          <Button onClick={handleSubmit} disabled={isSaving}>
            {isSaving ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
            ) : null}
            {isEdit ? t('common.edit') : t('trainers.register')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function TrainersPage() {
  const { t } = useTranslation();
  const [trainers, setTrainers] = useState<TrainerWithStats[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTrainer, setEditingTrainer] = useState<TrainerWithStats | null>(null);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await api.getTrainers();
      const trainersWithStats: TrainerWithStats[] = data.map((trainer) => ({
        ...trainer,
        total_sessions: 0,
        average_rating: 0,
      }));
      setTrainers(trainersWithStats);
    } catch (err) {
      logger.error('Failed to load trainers:', err);
      setError(err instanceof Error ? err.message : 'Failed to load trainers');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // 필터링된 강사 목록
  const filteredTrainers = useMemo(() => {
    return trainers.filter((trainer) => {
      const matchesSearch =
        trainer.trainer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        trainer.specializations.some(s => s.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesType = selectedType === 'all' || trainer.trainer_type === selectedType;
      const matchesStatus = selectedStatus === 'all' || trainer.status === selectedStatus;

      return matchesSearch && matchesType && matchesStatus;
    });
  }, [trainers, searchQuery, selectedType, selectedStatus]);

  // 통계
  const stats = useMemo(() => {
    return {
      total: trainers.length,
      internal: trainers.filter(t => t.trainer_type === 'INTERNAL').length,
      external: trainers.filter(t => t.trainer_type === 'EXTERNAL').length,
      active: trainers.filter(t => t.status === 'ACTIVE').length,
    };
  }, [trainers]);

  const handleAdd = () => {
    setEditingTrainer(null);
    setDialogOpen(true);
  };

  const handleEdit = (trainer: TrainerWithStats) => {
    setEditingTrainer(trainer);
    setDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t('trainers.title')}</h1>
          <p className="text-muted-foreground">{t('trainers.description')}</p>
        </div>
        <Button onClick={handleAdd}>
          <Plus className="h-4 w-4 mr-2" />
          {t('trainers.addTrainer')}
        </Button>
      </div>

      {/* 통계 카드 */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-xs text-muted-foreground">{t('trainers.totalTrainers')}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Building2 className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.internal}</p>
                <p className="text-xs text-muted-foreground">{t('trainers.internalTrainers')}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Briefcase className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.external}</p>
                <p className="text-xs text-muted-foreground">{t('trainers.externalTrainers')}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Star className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.active}</p>
                <p className="text-xs text-muted-foreground">{t('trainers.activeTrainers')}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 필터 */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t('trainers.searchPlaceholder')}
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger className="w-full md:w-40">
                <SelectValue placeholder={t('trainers.type')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('trainers.allTypes')}</SelectItem>
                <SelectItem value="INTERNAL">{t('trainers.internalTrainers')}</SelectItem>
                <SelectItem value="EXTERNAL">{t('trainers.externalTrainers')}</SelectItem>
              </SelectContent>
            </Select>
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="w-full md:w-40">
                <SelectValue placeholder={t('common.status')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('trainers.allStatuses')}</SelectItem>
                <SelectItem value="ACTIVE">{t('common.active')}</SelectItem>
                <SelectItem value="INACTIVE">{t('common.inactive')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* 로딩 상태 */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        </div>
      )}

      {/* 에러 상태 */}
      {error && (
        <Card>
          <CardContent className="p-6">
            <div className="text-center text-destructive">
              <p className="font-medium">{error}</p>
              <Button variant="outline" className="mt-4" onClick={loadData}>
                {t('common.retry', 'Retry')}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 강사 목록 */}
      {!isLoading && !error && <Card>
        <CardHeader>
          <CardTitle>{t('trainers.trainerList')}</CardTitle>
          <CardDescription>
            {t('trainers.registeredCount', { count: filteredTrainers.length })}
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
              {filteredTrainers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                    <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    {t('trainers.emptyState')}
                  </TableCell>
                </TableRow>
              ) : (
                filteredTrainers.map((trainer) => (
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
                        {trainer.specializations.slice(0, 2).map((spec) => (
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
                          <DropdownMenuItem onClick={() => handleEdit(trainer)}>
                            <Edit className="h-4 w-4 mr-2" />
                            {t('common.edit')}
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <FileText className="h-4 w-4 mr-2" />
                            {t('trainers.trainingHistory')}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-destructive">
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
      </Card>}

      {/* 강사 등록/수정 다이얼로그 */}
      <TrainerFormDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSaved={loadData}
        trainer={editingTrainer}
      />
    </div>
  );
}
