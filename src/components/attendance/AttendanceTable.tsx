import { useTranslation } from 'react-i18next';
import { CheckCircle2, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
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
import type { AttendanceStatus } from '@/types/attendance';
import type { AttendeeRecord } from './types';

interface AttendanceTableProps {
  attendees: AttendeeRecord[];
  attendanceData: Record<string, AttendanceStatus>;
  reasonData: Record<string, string>;
  selectedEmployees: Set<string>;
  onStatusChange: (employeeId: string, status: AttendanceStatus) => void;
  onReasonChange: (employeeId: string, reason: string) => void;
  onSelectAll: (checked: boolean) => void;
  onSelectEmployee: (employeeId: string, checked: boolean) => void;
}

export function AttendanceTable({
  attendees,
  attendanceData,
  reasonData,
  selectedEmployees,
  onStatusChange,
  onReasonChange,
  onSelectAll,
  onSelectEmployee,
}: AttendanceTableProps) {
  const { t } = useTranslation();

  return (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox
                  checked={selectedEmployees.size === attendees.length && attendees.length > 0}
                  onCheckedChange={onSelectAll}
                  aria-label={t('attendance.selectAll')}
                />
              </TableHead>
              <TableHead>{t('employee.id')}</TableHead>
              <TableHead>{t('employee.name')}</TableHead>
              <TableHead>{t('employee.department')}</TableHead>
              <TableHead>{t('employee.position')}</TableHead>
              <TableHead>{t('attendance.attendanceStatus')}</TableHead>
              <TableHead>{t('attendance.quickCheck')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {attendees.map((employee) => (
              <TableRow key={employee.employee_id}>
                <TableCell>
                  <Checkbox
                    checked={selectedEmployees.has(employee.employee_id)}
                    onCheckedChange={(checked) =>
                      onSelectEmployee(employee.employee_id, checked as boolean)
                    }
                    aria-label={t('attendance.selectEmployee', { name: employee.employee_name })}
                  />
                </TableCell>
                <TableCell className="font-mono">{employee.employee_id}</TableCell>
                <TableCell className="font-medium">{employee.employee_name}</TableCell>
                <TableCell>{employee.department}</TableCell>
                <TableCell>{employee.position}</TableCell>
                <TableCell>
                  <div className="space-y-2">
                    <Select
                      value={attendanceData[employee.employee_id] || 'PRESENT'}
                      onValueChange={(v) => onStatusChange(employee.employee_id, v as AttendanceStatus)}
                    >
                      <SelectTrigger className="w-44">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="PRESENT">{t('attendance.present')}</SelectItem>
                        <SelectItem value="ABSENT">{t('attendance.absent')}</SelectItem>
                        <SelectItem value="ABSENT_WITH_REASON">{t('attendance.absentWithReason')}</SelectItem>
                        <SelectItem value="LATE">{t('attendance.late')}</SelectItem>
                        <SelectItem value="EXCUSED">{t('attendance.excused')}</SelectItem>
                      </SelectContent>
                    </Select>
                    {attendanceData[employee.employee_id] === 'ABSENT_WITH_REASON' && (
                      <Textarea
                        placeholder={t('attendance.reasonPlaceholder')}
                        value={reasonData[employee.employee_id] || ''}
                        onChange={(e) => onReasonChange(employee.employee_id, e.target.value)}
                        className="min-h-[60px] text-sm"
                      />
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button
                      size="icon"
                      variant={attendanceData[employee.employee_id] === 'PRESENT' ? 'default' : 'outline'}
                      className="h-8 w-8"
                      onClick={() => onStatusChange(employee.employee_id, 'PRESENT')}
                    >
                      <CheckCircle2 className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant={attendanceData[employee.employee_id] === 'ABSENT' ? 'destructive' : 'outline'}
                      className="h-8 w-8"
                      onClick={() => onStatusChange(employee.employee_id, 'ABSENT')}
                    >
                      <XCircle className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
