import { useState, useMemo } from 'react';
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

// 샘플 강사 데이터 (확장된 타입)
interface TrainerWithStats extends Trainer {
  total_sessions?: number;
  average_rating?: number;
}

const sampleTrainers: TrainerWithStats[] = [
  {
    trainer_id: 'TR001',
    trainer_name: 'Nguyễn Văn Minh',
    trainer_type: 'INTERNAL',
    department: 'QIP',
    specializations: ['품질관리', 'SPC', '검사기법'],
    email: 'minh.nguyen@hwk.com',
    phone: '0901234567',
    certifications: ['QIP Master Trainer'],
    status: 'ACTIVE',
    total_sessions: 45,
    average_rating: 4.8,
    created_at: '2024-01-15',
    updated_at: '2024-12-20',
  },
  {
    trainer_id: 'TR002',
    trainer_name: 'Trần Thị Hương',
    trainer_type: 'INTERNAL',
    department: 'PRODUCTION',
    specializations: ['생산관리', '공정개선', 'Lean'],
    email: 'huong.tran@hwk.com',
    phone: '0912345678',
    certifications: ['Lean Six Sigma Green Belt'],
    status: 'ACTIVE',
    total_sessions: 32,
    average_rating: 4.6,
    created_at: '2024-02-20',
    updated_at: '2024-12-18',
  },
  {
    trainer_id: 'TR003',
    trainer_name: 'Dr. 김철수',
    trainer_type: 'EXTERNAL',
    company: '품질연구소',
    specializations: ['고급 SPC', '통계분석', '품질경영'],
    email: 'kim.cs@qualitylab.co.kr',
    phone: '+82-10-1234-5678',
    certifications: ['Ph.D Quality Engineering'],
    status: 'ACTIVE',
    total_sessions: 12,
    average_rating: 4.9,
    created_at: '2024-03-01',
    updated_at: '2024-12-15',
  },
  {
    trainer_id: 'TR004',
    trainer_name: 'Lê Văn Đức',
    trainer_type: 'INTERNAL',
    department: 'QIP',
    specializations: ['신입교육', '안전교육'],
    email: 'duc.le@hwk.com',
    phone: '0923456789',
    status: 'INACTIVE',
    total_sessions: 28,
    average_rating: 4.3,
    created_at: '2024-01-10',
    updated_at: '2024-11-01',
  },
];

// 강사 등록/수정 폼 다이얼로그
function TrainerFormDialog({
  open,
  onClose,
  trainer,
}: {
  open: boolean;
  onClose: () => void;
  trainer?: TrainerWithStats | null;
}) {
  const isEdit = !!trainer;
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

  const handleSubmit = () => {
    console.log('Submit trainer:', formData);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? '강사 정보 수정' : '신규 강사 등록'}</DialogTitle>
          <DialogDescription>
            {isEdit ? '강사 정보를 수정합니다.' : '새로운 강사를 등록합니다.'}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>강사명 *</Label>
              <Input
                value={formData.trainer_name}
                onChange={(e) => setFormData({ ...formData, trainer_name: e.target.value })}
                placeholder="강사 이름"
              />
            </div>
            <div className="space-y-2">
              <Label>유형 *</Label>
              <Select
                value={formData.trainer_type}
                onValueChange={(value: TrainerType) => setFormData({ ...formData, trainer_type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="INTERNAL">내부 강사</SelectItem>
                  <SelectItem value="EXTERNAL">외부 강사</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {formData.trainer_type === 'INTERNAL' ? (
            <div className="space-y-2">
              <Label>소속 부서</Label>
              <Select
                value={formData.department}
                onValueChange={(value) => setFormData({ ...formData, department: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="부서 선택" />
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
              <Label>소속 회사</Label>
              <Input
                value={formData.company}
                onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                placeholder="소속 회사명"
              />
            </div>
          )}

          <div className="space-y-2">
            <Label>전문 분야 (쉼표로 구분)</Label>
            <Textarea
              value={formData.specializations}
              onChange={(e) => setFormData({ ...formData, specializations: e.target.value })}
              placeholder="품질관리, SPC, 검사기법"
              rows={2}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>이메일</Label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="email@example.com"
              />
            </div>
            <div className="space-y-2">
              <Label>연락처</Label>
              <Input
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="0901234567"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>자격증 (쉼표로 구분)</Label>
            <Input
              value={formData.certifications}
              onChange={(e) => setFormData({ ...formData, certifications: e.target.value })}
              placeholder="자격증 또는 인증 정보"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            취소
          </Button>
          <Button onClick={handleSubmit}>
            {isEdit ? '수정' : '등록'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function TrainersPage() {
  const [trainers] = useState<TrainerWithStats[]>(sampleTrainers);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTrainer, setEditingTrainer] = useState<TrainerWithStats | null>(null);

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
          <h1 className="text-2xl font-bold tracking-tight">강사 관리</h1>
          <p className="text-muted-foreground">교육 강사 등록 및 관리</p>
        </div>
        <Button onClick={handleAdd}>
          <Plus className="h-4 w-4 mr-2" />
          신규 강사 등록
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
                <p className="text-xs text-muted-foreground">전체 강사</p>
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
                <p className="text-xs text-muted-foreground">내부 강사</p>
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
                <p className="text-xs text-muted-foreground">외부 강사</p>
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
                <p className="text-xs text-muted-foreground">활성 강사</p>
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
                placeholder="강사명 또는 전문분야 검색..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger className="w-full md:w-40">
                <SelectValue placeholder="유형" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체 유형</SelectItem>
                <SelectItem value="INTERNAL">내부 강사</SelectItem>
                <SelectItem value="EXTERNAL">외부 강사</SelectItem>
              </SelectContent>
            </Select>
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="w-full md:w-40">
                <SelectValue placeholder="상태" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체 상태</SelectItem>
                <SelectItem value="ACTIVE">활성</SelectItem>
                <SelectItem value="INACTIVE">비활성</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* 강사 목록 */}
      <Card>
        <CardHeader>
          <CardTitle>강사 목록</CardTitle>
          <CardDescription>
            등록된 강사 {filteredTrainers.length}명
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>강사명</TableHead>
                <TableHead>유형</TableHead>
                <TableHead>소속</TableHead>
                <TableHead>전문분야</TableHead>
                <TableHead>연락처</TableHead>
                <TableHead>교육횟수</TableHead>
                <TableHead>평점</TableHead>
                <TableHead>상태</TableHead>
                <TableHead className="text-right">액션</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTrainers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                    <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    등록된 강사가 없습니다
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
                        {trainer.trainer_type === 'INTERNAL' ? '내부' : '외부'}
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
                      {trainer.total_sessions || 0}회
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
                        {trainer.status === 'ACTIVE' ? '활성' : '비활성'}
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
                            수정
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <FileText className="h-4 w-4 mr-2" />
                            교육 이력
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-destructive">
                            <Trash2 className="h-4 w-4 mr-2" />
                            삭제
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

      {/* 강사 등록/수정 다이얼로그 */}
      <TrainerFormDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        trainer={editingTrainer}
      />
    </div>
  );
}
