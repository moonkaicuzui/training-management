/**
 * BulkAssignmentDialog - Bulk assign competency to multiple employees
 */

import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Loader2, Users, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
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
import { useToast } from '@/hooks/use-toast';
import * as api from '@/services/api';
import type { Employee } from '@/types';
import type { Competency, CompetencyLevel } from '@/types/curriculum';

const LEVELS: CompetencyLevel[] = [
  'NOVICE',
  'BEGINNER',
  'COMPETENT',
  'PROFICIENT',
  'EXPERT',
];

interface BulkAssignmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  competencies: Competency[];
  employees: Employee[];
  departments: string[];
  onDataChanged: () => void;
}

export function BulkAssignmentDialog({
  open,
  onOpenChange,
  competencies,
  employees,
  departments,
  onDataChanged,
}: BulkAssignmentDialogProps) {
  const { t } = useTranslation();
  const { toast } = useToast();

  const [bulkCompetencyId, setBulkCompetencyId] = useState<string>('');
  const [bulkTargetLevel, setBulkTargetLevel] = useState<CompetencyLevel>('COMPETENT');
  const [bulkDeptFilter, setBulkDeptFilter] = useState<string>('all');
  const [bulkSelectedEmployees, setBulkSelectedEmployees] = useState<Set<string>>(new Set());
  const [bulkAssigning, setBulkAssigning] = useState(false);

  const bulkFilteredEmployees = useMemo(() => {
    if (bulkDeptFilter === 'all') return employees;
    return employees.filter((e) => e.department === bulkDeptFilter);
  }, [employees, bulkDeptFilter]);

  const handleBulkAssign = async () => {
    if (!bulkCompetencyId || bulkSelectedEmployees.size === 0) return;
    setBulkAssigning(true);
    try {
      const promises = Array.from(bulkSelectedEmployees).map((empId) =>
        api.updateEmployeeCompetency({
          employee_id: empId,
          competency_id: bulkCompetencyId,
          current_level: 'NOVICE',
          target_level: bulkTargetLevel,
          last_assessed_at: new Date().toISOString(),
          assessed_by: 'admin',
          evidence: [],
        })
      );
      await Promise.all(promises);
      toast({
        title: t('messages.saveSuccess'),
        description: `${bulkSelectedEmployees.size} ${t('competency.bulk.employeesAssigned', { defaultValue: 'employees assigned' })}`,
      });
      onOpenChange(false);
      setBulkSelectedEmployees(new Set());
      onDataChanged();
    } catch {
      toast({ title: t('messages.saveError'), variant: 'destructive' });
    } finally {
      setBulkAssigning(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (newOpen) {
      // Reset state when opening
      setBulkCompetencyId('');
      setBulkTargetLevel('COMPETENT');
      setBulkDeptFilter('all');
      setBulkSelectedEmployees(new Set());
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            {t('competency.bulk.title', { defaultValue: 'Bulk Assign Competency' })}
          </DialogTitle>
          <DialogDescription>
            {t('competency.bulk.description', {
              defaultValue: 'Assign a competency with target level to multiple employees at once.',
            })}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2 flex-1 overflow-hidden flex flex-col">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t('competency.bulk.selectCompetency', { defaultValue: 'Competency' })} *</Label>
              <Select value={bulkCompetencyId} onValueChange={setBulkCompetencyId}>
                <SelectTrigger>
                  <SelectValue placeholder={t('competency.bulk.choosePlaceholder', { defaultValue: 'Select competency...' })} />
                </SelectTrigger>
                <SelectContent>
                  {competencies.filter((c) => c.is_active).map((c) => (
                    <SelectItem key={c.competency_id} value={c.competency_id}>
                      {c.competency_code} - {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-1">
                <Target className="h-3.5 w-3.5" />
                {t('competency.bulk.targetLevel', { defaultValue: 'Target Level' })}
              </Label>
              <Select value={bulkTargetLevel} onValueChange={(v) => setBulkTargetLevel(v as CompetencyLevel)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LEVELS.map((level) => (
                    <SelectItem key={level} value={level}>
                      {LEVELS.indexOf(level) + 1} - {t(`competency.level.${level}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label>{t('competency.bulk.filterByDept', { defaultValue: 'Filter by Department' })}</Label>
            <Select value={bulkDeptFilter} onValueChange={setBulkDeptFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('common.all')}</SelectItem>
                {departments.map((dept) => (
                  <SelectItem key={dept} value={dept}>
                    {t(`department.${dept}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center justify-between">
            <Label className="text-sm">
              {t('competency.bulk.selectEmployees', { defaultValue: 'Select Employees' })}
              {' '}
              <span className="text-muted-foreground">
                ({bulkSelectedEmployees.size}/{bulkFilteredEmployees.length})
              </span>
            </Label>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                if (bulkSelectedEmployees.size === bulkFilteredEmployees.length) {
                  setBulkSelectedEmployees(new Set());
                } else {
                  setBulkSelectedEmployees(new Set(bulkFilteredEmployees.map((e) => e.employee_id)));
                }
              }}
            >
              {bulkSelectedEmployees.size === bulkFilteredEmployees.length
                ? t('common.deselectAll', { defaultValue: 'Deselect All' })
                : t('common.selectAll', { defaultValue: 'Select All' })}
            </Button>
          </div>
          <div className="flex-1 overflow-auto border rounded-md max-h-[250px]">
            {bulkFilteredEmployees.map((emp) => (
              <label
                key={emp.employee_id}
                className="flex items-center gap-3 px-3 py-2 hover:bg-muted/50 cursor-pointer border-b last:border-b-0"
              >
                <Checkbox
                  checked={bulkSelectedEmployees.has(emp.employee_id)}
                  onCheckedChange={(checked) => {
                    const next = new Set(bulkSelectedEmployees);
                    if (checked) next.add(emp.employee_id);
                    else next.delete(emp.employee_id);
                    setBulkSelectedEmployees(next);
                  }}
                />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{emp.employee_name}</div>
                  <div className="text-xs text-muted-foreground">
                    {emp.employee_id} · {t(`department.${emp.department}`)}
                  </div>
                </div>
              </label>
            ))}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t('common.cancel')}
          </Button>
          <Button
            onClick={handleBulkAssign}
            disabled={!bulkCompetencyId || bulkSelectedEmployees.size === 0 || bulkAssigning}
          >
            {bulkAssigning && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {t('competency.bulk.assignButton', {
              defaultValue: `Assign to ${bulkSelectedEmployees.size} employees`,
              count: bulkSelectedEmployees.size,
            })}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
