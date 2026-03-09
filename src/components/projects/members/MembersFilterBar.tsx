import { useTranslation } from 'react-i18next';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search } from 'lucide-react';
import type { MemberRole, MemberStatus } from '@/types/project';
import type { MembersFilterBarProps } from './types';

export function MembersFilterBar({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  roleFilter,
  onRoleFilterChange,
}: MembersFilterBarProps) {
  const { t } = useTranslation();

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t('common.search')}
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select
            value={statusFilter}
            onValueChange={(value) => onStatusFilterChange(value as MemberStatus | 'all')}
          >
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder={t('common.status')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('common.all')} {t('common.status')}</SelectItem>
              <SelectItem value="active">{t('common.active')}</SelectItem>
              <SelectItem value="inactive">{t('common.inactive')}</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={roleFilter}
            onValueChange={(value) => onRoleFilterChange(value as MemberRole | 'all')}
          >
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder={t('projects.members.role')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('common.all')} {t('projects.members.role')}</SelectItem>
              <SelectItem value="admin">{t('projects.roles.admin')}</SelectItem>
              <SelectItem value="member">{t('projects.roles.member')}</SelectItem>
              <SelectItem value="guest">{t('projects.roles.guest')}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
}
