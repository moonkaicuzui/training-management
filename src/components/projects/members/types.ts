import type { MemberRole, MemberStatus, ProjectMember, CreateMemberInput } from '@/types/project';

export const ROLE_COLORS: Record<MemberRole, string> = {
  admin: 'bg-purple-100 text-purple-800',
  member: 'bg-blue-100 text-blue-800',
  guest: 'bg-gray-100 text-gray-800',
};

export interface MembersFilterBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  statusFilter: MemberStatus | 'all';
  onStatusFilterChange: (value: MemberStatus | 'all') => void;
  roleFilter: MemberRole | 'all';
  onRoleFilterChange: (value: MemberRole | 'all') => void;
}

export interface MembersTableProps {
  members: ProjectMember[];
  isLoading: boolean;
  allMembersCount: number;
  hasActiveFilters: boolean;
  roleLabels: Record<MemberRole, string>;
  statusLabels: Record<MemberStatus, string>;
  onAdd: () => void;
  onEdit: (member: ProjectMember) => void;
  onDelete: (member: ProjectMember) => void;
  onToggleStatus: (member: ProjectMember) => void;
}

export interface MemberFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedMember: ProjectMember | null;
  formData: CreateMemberInput;
  onFormDataChange: (data: CreateMemberInput) => void;
  onSave: () => void;
  isLoading: boolean;
}

export interface MemberDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  memberName: string | undefined;
  onDelete: () => void;
  isLoading: boolean;
}
