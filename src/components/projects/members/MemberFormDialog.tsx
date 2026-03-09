import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import {
  Users,
  Mail,
  Phone,
  Building2,
  Briefcase,
} from 'lucide-react';
import type { MemberRole } from '@/types/project';
import type { MemberFormDialogProps } from './types';

export function MemberFormDialog({
  open,
  onOpenChange,
  selectedMember,
  formData,
  onFormDataChange,
  onSave,
  isLoading,
}: MemberFormDialogProps) {
  const { t } = useTranslation();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {selectedMember ? t('projects.members.editMember') : t('projects.members.addMember')}
          </DialogTitle>
          <DialogDescription>
            {selectedMember
              ? t('projects.members.editMember')
              : t('projects.members.addMember')}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="name">
              {t('projects.members.name')} <span className="text-red-500">*</span>
            </Label>
            <div className="relative">
              <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => onFormDataChange({ ...formData, name: e.target.value })}
                placeholder={t('projects.members.namePlaceholder')}
                className="pl-10"
              />
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="email">
              {t('projects.members.email')} <span className="text-red-500">*</span>
            </Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => onFormDataChange({ ...formData, email: e.target.value })}
                placeholder="hong@example.com"
                className="pl-10"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="department">
                {t('projects.members.department')} <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="department"
                  value={formData.department}
                  onChange={(e) => onFormDataChange({ ...formData, department: e.target.value })}
                  placeholder={t('projects.members.departmentPlaceholder')}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="position">
                {t('projects.members.position')} <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <Briefcase className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="position"
                  value={formData.position}
                  onChange={(e) => onFormDataChange({ ...formData, position: e.target.value })}
                  placeholder={t('projects.members.positionPlaceholder')}
                  className="pl-10"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="phone">{t('projects.members.name')}</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="phone"
                  value={formData.phone || ''}
                  onChange={(e) => onFormDataChange({ ...formData, phone: e.target.value })}
                  placeholder="010-1234-5678"
                  className="pl-10"
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="role">{t('projects.members.role')}</Label>
              <Select
                value={formData.role}
                onValueChange={(value) => onFormDataChange({ ...formData, role: value as MemberRole })}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('projects.members.role')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">{t('projects.roles.admin')}</SelectItem>
                  <SelectItem value="member">{t('projects.roles.member')}</SelectItem>
                  <SelectItem value="guest">{t('projects.roles.guest')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t('common.cancel')}
          </Button>
          <Button
            onClick={onSave}
            disabled={!formData.name || !formData.email || !formData.department || !formData.position || isLoading}
          >
            {isLoading ? t('common.saving') : selectedMember ? t('common.edit') : t('common.add')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
