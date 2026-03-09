/**
 * 팀원 관리 페이지
 *
 * 팀원 CRUD, 상태 관리, 통계 표시
 */

import { useEffect, useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Users, Plus } from 'lucide-react';
import { useShallow } from 'zustand/react/shallow';
import { useProjectStore } from '@/stores/projectStore';
import {
  MembersFilterBar,
  MembersTable,
  MemberFormDialog,
  MemberDeleteDialog,
} from '@/components/projects/members';
import type { ProjectMember, CreateMemberInput, MemberRole, MemberStatus } from '@/types/project';

export default function ProjectsMembers() {
  const { t } = useTranslation();

  const ROLE_LABELS: Record<MemberRole, string> = {
    admin: t('projects.roles.admin'),
    member: t('projects.roles.member'),
    guest: t('projects.roles.guest'),
  };

  const STATUS_LABELS: Record<MemberStatus, string> = {
    active: t('common.active'),
    inactive: t('common.inactive'),
  };

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
  } = useProjectStore(useShallow((state) => ({ members: state.members, fetchMembers: state.fetchMembers, createMember: state.createMember, updateMember: state.updateMember, deleteMember: state.deleteMember, isMembersLoading: state.isMembersLoading, isLoading: state.isLoading, error: state.error, subscribeMembersRealtime: state.subscribeMembersRealtime })));

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
  const cleanup = useProjectStore((s) => s.cleanup);

  useEffect(() => {
    if (!initializedRef.current) {
      initializedRef.current = true;
      Promise.all([
        fetchMembers(),
        subscribeMembersRealtime(),
      ]);
    }
    return () => {
      cleanup();
    };
  }, [fetchMembers, subscribeMembersRealtime, cleanup]);

  const filteredMembers = members.filter((member) => {
    const matchesSearch =
      searchQuery === '' ||
      member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.department.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'all' || member.status === statusFilter;
    const matchesRole = roleFilter === 'all' || member.role === roleFilter;

    return matchesSearch && matchesStatus && matchesRole;
  });

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

  const handleToggleStatus = async (member: ProjectMember) => {
    const newStatus: MemberStatus = member.status === 'active' ? 'inactive' : 'active';
    await updateMember(member.id, { status: newStatus });
  };

  const hasActiveFilters = searchQuery !== '' || statusFilter !== 'all' || roleFilter !== 'all';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Users className="h-6 w-6" />
            {t('projects.members.title')}
          </h1>
          <p className="text-muted-foreground mt-1">
            {t('projects.members.description')}
          </p>
        </div>
        <Button onClick={() => openDialog()}>
          <Plus className="h-4 w-4 mr-2" />
          {t('projects.members.addMember')}
        </Button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      <MembersFilterBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        roleFilter={roleFilter}
        onRoleFilterChange={setRoleFilter}
      />

      <MembersTable
        members={filteredMembers}
        isLoading={isMembersLoading}
        allMembersCount={members.length}
        hasActiveFilters={hasActiveFilters}
        roleLabels={ROLE_LABELS}
        statusLabels={STATUS_LABELS}
        onAdd={() => openDialog()}
        onEdit={(member) => openDialog(member)}
        onDelete={(member) => {
          setSelectedMember(member);
          setIsDeleteDialogOpen(true);
        }}
        onToggleStatus={handleToggleStatus}
      />

      <MemberFormDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        selectedMember={selectedMember}
        formData={formData}
        onFormDataChange={setFormData}
        onSave={handleSave}
        isLoading={isLoading}
      />

      <MemberDeleteDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        memberName={selectedMember?.name}
        onDelete={handleDelete}
        isLoading={isLoading}
      />
    </div>
  );
}
