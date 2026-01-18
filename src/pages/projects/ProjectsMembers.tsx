/**
 * 팀원 관리 페이지
 *
 * 팀원 CRUD, 상태 관리, 통계 표시
 */

import { useEffect, useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
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
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Users,
  Plus,
  Search,
  MoreHorizontal,
  Edit,
  Trash2,
  UserMinus,
  UserCheck,
  Mail,
  Phone,
  Building2,
  Briefcase,
} from 'lucide-react';
import { useProjectStore } from '@/stores/projectStore';
import type { ProjectMember, CreateMemberInput, MemberRole, MemberStatus } from '@/types/project';

// 역할 라벨
const ROLE_LABELS: Record<MemberRole, string> = {
  admin: '관리자',
  member: '멤버',
  guest: '게스트',
};

// 역할 색상
const ROLE_COLORS: Record<MemberRole, string> = {
  admin: 'bg-purple-100 text-purple-800',
  member: 'bg-blue-100 text-blue-800',
  guest: 'bg-gray-100 text-gray-800',
};

// 상태 라벨
const STATUS_LABELS: Record<MemberStatus, string> = {
  active: '활성',
  inactive: '비활성',
};

export default function ProjectsMembers() {
  const {
    members,
    fetchMembers,
    createMember,
    updateMember,
    deleteMember,
    isMembersLoading,
    isLoading,
    error,
    subscribeMembersRealtime,
  } = useProjectStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<MemberStatus | 'all'>('all');
  const [roleFilter, setRoleFilter] = useState<MemberRole | 'all'>('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<ProjectMember | null>(null);
  const [formData, setFormData] = useState<CreateMemberInput>({
    name: '',
    email: '',
    role: 'member',
    department: '',
    position: '',
    phone: '',
  });
  const initializedRef = useRef(false);

  useEffect(() => {
    if (!initializedRef.current) {
      initializedRef.current = true;
      fetchMembers();
      subscribeMembersRealtime();
    }
  }, [fetchMembers, subscribeMembersRealtime]);

  // 필터링된 팀원 목록
  const filteredMembers = members.filter((member) => {
    // 검색 필터
    const matchesSearch =
      searchQuery === '' ||
      member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.department.toLowerCase().includes(searchQuery.toLowerCase());

    // 상태 필터
    const matchesStatus = statusFilter === 'all' || member.status === statusFilter;

    // 역할 필터
    const matchesRole = roleFilter === 'all' || member.role === roleFilter;

    return matchesSearch && matchesStatus && matchesRole;
  });

  // 폼 초기화
  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      role: 'member',
      department: '',
      position: '',
      phone: '',
    });
    setSelectedMember(null);
  };

  // 다이얼로그 열기 (생성/수정)
  const openDialog = (member?: ProjectMember) => {
    if (member) {
      setSelectedMember(member);
      setFormData({
        name: member.name,
        email: member.email,
        role: member.role,
        department: member.department,
        position: member.position,
        phone: member.phone || '',
      });
    } else {
      resetForm();
    }
    setIsDialogOpen(true);
  };

  // 팀원 저장
  const handleSave = async () => {
    try {
      if (selectedMember) {
        await updateMember(selectedMember.id, formData);
      } else {
        await createMember(formData);
      }
      setIsDialogOpen(false);
      resetForm();
    } catch {
      // 에러는 스토어에서 처리됨
    }
  };

  // 팀원 삭제 (비활성화)
  const handleDelete = async () => {
    if (selectedMember) {
      try {
        await deleteMember(selectedMember.id);
        setIsDeleteDialogOpen(false);
        setSelectedMember(null);
      } catch {
        // 에러는 스토어에서 처리됨
      }
    }
  };

  // 상태 토글
  const handleToggleStatus = async (member: ProjectMember) => {
    const newStatus: MemberStatus = member.status === 'active' ? 'inactive' : 'active';
    await updateMember(member.id, { status: newStatus });
  };

  // 이니셜 가져오기
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Users className="h-6 w-6" />
            팀원 관리
          </h1>
          <p className="text-muted-foreground mt-1">
            프로젝트 팀원을 추가하고 관리하세요
          </p>
        </div>
        <Button onClick={() => openDialog()}>
          <Plus className="h-4 w-4 mr-2" />
          팀원 추가
        </Button>
      </div>

      {/* 에러 표시 */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* 필터 및 검색 */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="이름, 이메일, 부서로 검색..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select
              value={statusFilter}
              onValueChange={(value) => setStatusFilter(value as MemberStatus | 'all')}
            >
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="상태" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체 상태</SelectItem>
                <SelectItem value="active">활성</SelectItem>
                <SelectItem value="inactive">비활성</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={roleFilter}
              onValueChange={(value) => setRoleFilter(value as MemberRole | 'all')}
            >
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="역할" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체 역할</SelectItem>
                <SelectItem value="admin">관리자</SelectItem>
                <SelectItem value="member">멤버</SelectItem>
                <SelectItem value="guest">게스트</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* 팀원 목록 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            팀원 목록 ({filteredMembers.length}명)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isMembersLoading && members.length === 0 ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
              <p className="text-muted-foreground">팀원 목록을 불러오는 중...</p>
            </div>
          ) : filteredMembers.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                {searchQuery || statusFilter !== 'all' || roleFilter !== 'all'
                  ? '검색 결과가 없습니다'
                  : '등록된 팀원이 없습니다'}
              </p>
              {!searchQuery && statusFilter === 'all' && roleFilter === 'all' && (
                <Button className="mt-4" onClick={() => openDialog()}>
                  <Plus className="h-4 w-4 mr-2" />
                  첫 번째 팀원 추가
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[250px]">팀원</TableHead>
                    <TableHead>부서</TableHead>
                    <TableHead>직책</TableHead>
                    <TableHead>역할</TableHead>
                    <TableHead>상태</TableHead>
                    <TableHead className="w-[100px]">작업</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMembers.map((member) => (
                    <TableRow key={member.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={member.photoURL} alt={member.name} />
                            <AvatarFallback>{getInitials(member.name)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">{member.name}</div>
                            <div className="text-sm text-muted-foreground">{member.email}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{member.department}</TableCell>
                      <TableCell>{member.position}</TableCell>
                      <TableCell>
                        <Badge className={ROLE_COLORS[member.role]} variant="secondary">
                          {ROLE_LABELS[member.role]}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={member.status === 'active' ? 'default' : 'secondary'}
                          className={member.status === 'active' ? 'bg-green-100 text-green-800' : ''}
                        >
                          {STATUS_LABELS[member.status]}
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
                            <DropdownMenuItem onClick={() => openDialog(member)}>
                              <Edit className="h-4 w-4 mr-2" />
                              수정
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleToggleStatus(member)}>
                              {member.status === 'active' ? (
                                <>
                                  <UserMinus className="h-4 w-4 mr-2" />
                                  비활성화
                                </>
                              ) : (
                                <>
                                  <UserCheck className="h-4 w-4 mr-2" />
                                  활성화
                                </>
                              )}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-red-600"
                              onClick={() => {
                                setSelectedMember(member);
                                setIsDeleteDialogOpen(true);
                              }}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              삭제
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 팀원 추가/수정 다이얼로그 */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {selectedMember ? '팀원 수정' : '팀원 추가'}
            </DialogTitle>
            <DialogDescription>
              {selectedMember
                ? '팀원 정보를 수정하세요.'
                : '새로운 팀원을 추가하세요.'}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">
                이름 <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="홍길동"
                  className="pl-10"
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="email">
                이메일 <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="hong@example.com"
                  className="pl-10"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="department">
                  부서 <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="department"
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    placeholder="품질관리팀"
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="position">
                  직책 <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <Briefcase className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="position"
                    value={formData.position}
                    onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                    placeholder="과장"
                    className="pl-10"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="phone">전화번호</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="phone"
                    value={formData.phone || ''}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="010-1234-5678"
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="role">역할</Label>
                <Select
                  value={formData.role}
                  onValueChange={(value) => setFormData({ ...formData, role: value as MemberRole })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="역할 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">관리자</SelectItem>
                    <SelectItem value="member">멤버</SelectItem>
                    <SelectItem value="guest">게스트</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              취소
            </Button>
            <Button
              onClick={handleSave}
              disabled={!formData.name || !formData.email || !formData.department || !formData.position || isLoading}
            >
              {isLoading ? '저장 중...' : selectedMember ? '수정' : '추가'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 삭제 확인 다이얼로그 */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>팀원 삭제</DialogTitle>
            <DialogDescription>
              정말로 <strong>{selectedMember?.name}</strong> 팀원을 삭제하시겠습니까?
              <br />
              삭제된 팀원은 비활성 상태로 변경됩니다.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              취소
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isLoading}>
              {isLoading ? '삭제 중...' : '삭제'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
