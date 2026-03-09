import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Search, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import type { AttendeeRecord } from './types';

interface AddTraineeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  availableEmployees: AttendeeRecord[];
  onAddTrainee: (employee: AttendeeRecord) => void;
}

export function AddTraineeDialog({
  open,
  onOpenChange,
  availableEmployees,
  onAddTrainee,
}: AddTraineeDialogProps) {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredEmployees = availableEmployees.filter(emp =>
    searchQuery === '' ||
    emp.employee_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    emp.employee_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    emp.department.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleClose = () => {
    onOpenChange(false);
    setSearchQuery('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <UserPlus className="h-4 w-4 mr-2" />
          {t('attendance.addTrainee')}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{t('attendance.addTrainee')}</DialogTitle>
          <DialogDescription>
            {t('attendance.searchEmployee')}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t('attendance.searchEmployee')}
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="max-h-[300px] overflow-y-auto border rounded-md">
            {filteredEmployees.length === 0 ? (
              <div className="p-4 text-center text-sm text-muted-foreground">
                {t('attendance.alreadyAdded')}
              </div>
            ) : (
              filteredEmployees.map((employee) => (
                <div
                  key={employee.employee_id}
                  className="flex items-center justify-between p-3 hover:bg-muted/50 cursor-pointer border-b last:border-b-0"
                  onClick={() => onAddTrainee(employee)}
                >
                  <div>
                    <p className="font-medium text-sm">{employee.employee_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {employee.employee_id} - {employee.department} / {employee.position}
                    </p>
                  </div>
                  <UserPlus className="h-4 w-4 text-muted-foreground" />
                </div>
              ))
            )}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            {t('common.close')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
