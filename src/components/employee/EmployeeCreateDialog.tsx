import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { departments, positions, buildings } from '@/data/constants';
import type { Department, Position, Building, EmployeeStatus } from '@/types';

const emptyEmployeeForm = {
  employee_id: '',
  employee_name: '',
  department: 'ASSEMBLY' as Department,
  position: 'QIP_TQC' as Position,
  building: 'BUILDING_A' as Building,
  line: '',
  hire_date: new Date().toISOString().split('T')[0],
  status: 'ACTIVE' as EmployeeStatus,
};

interface EmployeeCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateEmployee: (formData: typeof emptyEmployeeForm) => Promise<void>;
}

export function EmployeeCreateDialog({
  open,
  onOpenChange,
  onCreateEmployee,
}: EmployeeCreateDialogProps) {
  const { t } = useTranslation();
  const [formData, setFormData] = useState(emptyEmployeeForm);

  const handleCreate = async () => {
    await onCreateEmployee(formData);
    setFormData(emptyEmployeeForm);
  };

  const handleOpenChange = (openState: boolean) => {
    if (!openState) {
      setFormData(emptyEmployeeForm);
    }
    onOpenChange(openState);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t('employee.addEmployee')}</DialogTitle>
          <DialogDescription>{t('employee.createDescription')}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t('employee.id')} *</Label>
              <Input
                value={formData.employee_id}
                onChange={(e) => setFormData({ ...formData, employee_id: e.target.value })}
                placeholder="618030XXX"
              />
            </div>
            <div className="space-y-2">
              <Label>{t('employee.name')} *</Label>
              <Input
                value={formData.employee_name}
                onChange={(e) => setFormData({ ...formData, employee_name: e.target.value })}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t('employee.department')}</Label>
              <Select
                value={formData.department}
                onValueChange={(v) => setFormData({ ...formData, department: v as Department })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {departments.map((dept) => (
                    <SelectItem key={dept.value} value={dept.value}>{dept.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{t('employee.position')}</Label>
              <Select
                value={formData.position}
                onValueChange={(v) => setFormData({ ...formData, position: v as Position })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {positions.map((pos) => (
                    <SelectItem key={pos.value} value={pos.value}>
                      {t(`position.${pos.value}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t('employee.building')}</Label>
              <Select
                value={formData.building}
                onValueChange={(v) => setFormData({ ...formData, building: v as Building })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {buildings.map((bldg) => (
                    <SelectItem key={bldg.value} value={bldg.value}>
                      {t(`building.${bldg.value}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{t('employee.line')}</Label>
              <Input
                value={formData.line}
                onChange={(e) => setFormData({ ...formData, line: e.target.value })}
                placeholder="LINE 1-1"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>{t('employee.hireDate')}</Label>
            <Input
              type="date"
              value={formData.hire_date}
              onChange={(e) => setFormData({ ...formData, hire_date: e.target.value })}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            {t('common.cancel')}
          </Button>
          <Button onClick={handleCreate}>
            {t('common.save')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
