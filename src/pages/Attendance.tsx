import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { logger } from '@/utils/logger';
import { format } from 'date-fns';
import {
  UserCheck,
  UserX,
  Clock,
  Users,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Search,
  ChevronLeft,
  UserPlus,
  FileWarning,
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
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import type { AttendanceStatus } from '@/types/attendance';
import type { SessionId, EmployeeId } from '@/types/branded';
import { saveBulkAttendance } from '@/services/api';
import * as api from '@/services/api';

// 로컬 타입 정의
interface AttendeeRecord {
  employee_id: string;
  employee_name: string;
  department: string;
  position: string;
}

interface SessionWithAttendance {
  session_id: string;
  program_code: string;
  program_name: string;
  session_date: string;
  session_time: string;
  trainer_name: string;
  location: string;
  attendees: AttendeeRecord[];
}

export default function AttendancePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session');

  const [searchQuery, setSearchQuery] = useState('');
  const [attendanceData, setAttendanceData] = useState<Record<string, AttendanceStatus>>({});
  const [reasonData, setReasonData] = useState<Record<string, string>>({});
  const [selectedEmployees, setSelectedEmployees] = useState<Set<string>>(new Set());
  const [bulkStatus, setBulkStatus] = useState<AttendanceStatus>('PRESENT');

  // Add Trainee dialog state
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [addSearchQuery, setAddSearchQuery] = useState('');

  // Mutable session data (loaded from Firebase)
  const [sessionData, setSessionData] = useState<SessionWithAttendance[]>([]);
  const [allEmployees, setAllEmployees] = useState<AttendeeRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load data from Firebase
  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [sessionsData, employeesData] = await Promise.all([
        api.getSessions(),
        api.getEmployees(),
      ]);

      // Map employees for lookup and for the add-trainee dialog
      const empRecords: AttendeeRecord[] = employeesData
        .filter(e => e.status === 'ACTIVE')
        .map(e => ({
          employee_id: e.employee_id,
          employee_name: e.employee_name,
          department: e.department || '',
          position: e.position || '',
        }));
      setAllEmployees(empRecords);

      // Map sessions - only SCHEDULED or IN_PROGRESS sessions
      const mappedSessions: SessionWithAttendance[] = sessionsData
        .filter(s => s.status !== 'CANCELLED')
        .map(s => ({
          session_id: s.session_id,
          program_code: s.program_code,
          program_name: (s as unknown as Record<string, string>).program_name ?? s.program_code,
          session_date: s.session_date,
          session_time: s.session_time ?? '',
          trainer_name: s.trainer_name ?? '',
          location: s.location ?? '',
          attendees: (s.attendees || []).map((empId: string) => {
            const emp = employeesData.find(e => e.employee_id === empId);
            return {
              employee_id: empId,
              employee_name: emp?.employee_name ?? empId,
              department: emp?.department ?? '',
              position: emp?.position ?? '',
            };
          }),
        }));
      setSessionData(mappedSessions);
    } catch (err) {
      console.error('Failed to load attendance data:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // 선택된 세션
  const selectedSession = useMemo(() => {
    if (!sessionId) return null;
    return sessionData.find(s => s.session_id === sessionId) ?? null;
  }, [sessionId, sessionData]);

  // 세션 변경 시 초기 출석 데이터 설정
  // useEffect에서 ref를 사용하여 불필요한 재실행 방지
  const lastSessionIdRef = useRef<string | null>(null);
  const currentSessionId = selectedSession?.session_id ?? null;

  useEffect(() => {
    if (currentSessionId && lastSessionIdRef.current !== currentSessionId && selectedSession) {
      const initial: Record<string, AttendanceStatus> = {};
      selectedSession.attendees.forEach(emp => {
        initial[emp.employee_id] = 'PRESENT';
      });
      // eslint-disable-next-line react-hooks/set-state-in-effect -- 세션 전환 시 한 번만 실행
      setAttendanceData(initial);
      setReasonData({});
      lastSessionIdRef.current = currentSessionId;
    }
  }, [currentSessionId, selectedSession]);

  // 오늘 예정된 세션
  const todaySessions = useMemo(() => {
    const today = format(new Date(), 'yyyy-MM-dd');
    return sessionData.filter(s => s.session_date === today);
  }, [sessionData]);

  // 세션의 참석자 목록
  const sessionAttendees = useMemo(() => {
    if (!selectedSession) return [];
    return selectedSession.attendees.filter(emp =>
      emp.employee_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.employee_id.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [selectedSession, searchQuery]);

  // Add Trainee dialog: employees not already in attendance list
  const availableEmployees = useMemo(() => {
    if (!selectedSession) return [];
    const existingIds = new Set(selectedSession.attendees.map(a => a.employee_id));
    return allEmployees
      .filter(emp => !existingIds.has(emp.employee_id))
      .filter(emp =>
        addSearchQuery === '' ||
        emp.employee_name.toLowerCase().includes(addSearchQuery.toLowerCase()) ||
        emp.employee_id.toLowerCase().includes(addSearchQuery.toLowerCase()) ||
        emp.department.toLowerCase().includes(addSearchQuery.toLowerCase())
      );
  }, [selectedSession, addSearchQuery, allEmployees]);

  // 출석 통계
  const attendanceStats = useMemo(() => {
    const stats = { present: 0, absent: 0, late: 0, excused: 0, absent_with_reason: 0, total: 0 };
    Object.values(attendanceData).forEach((status) => {
      const key = status.toLowerCase() as keyof typeof stats;
      if (key in stats) {
        stats[key]++;
      }
      stats.total++;
    });
    return stats;
  }, [attendanceData]);

  // 출석 상태 변경
  const handleStatusChange = (employeeId: string, status: AttendanceStatus) => {
    setAttendanceData((prev) => ({ ...prev, [employeeId]: status }));
    // Clear reason if status is not ABSENT_WITH_REASON
    if (status !== 'ABSENT_WITH_REASON') {
      setReasonData((prev) => {
        const next = { ...prev };
        delete next[employeeId];
        return next;
      });
    }
  };

  // 결석 사유 변경
  const handleReasonChange = (employeeId: string, reason: string) => {
    setReasonData((prev) => ({ ...prev, [employeeId]: reason }));
  };

  // 전체 선택/해제
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedEmployees(new Set(sessionAttendees.map(emp => emp.employee_id)));
    } else {
      setSelectedEmployees(new Set());
    }
  };

  // 개별 선택
  const handleSelectEmployee = (employeeId: string, checked: boolean) => {
    setSelectedEmployees((prev) => {
      const next = new Set(prev);
      if (checked) {
        next.add(employeeId);
      } else {
        next.delete(employeeId);
      }
      return next;
    });
  };

  // 일괄 상태 변경
  const handleBulkStatusChange = () => {
    setAttendanceData((prev) => {
      const next = { ...prev };
      selectedEmployees.forEach((empId) => {
        next[empId] = bulkStatus;
      });
      return next;
    });
    // Clear reasons for bulk status change if not ABSENT_WITH_REASON
    if (bulkStatus !== 'ABSENT_WITH_REASON') {
      setReasonData((prev) => {
        const next = { ...prev };
        selectedEmployees.forEach((empId) => {
          delete next[empId];
        });
        return next;
      });
    }
    setSelectedEmployees(new Set());
  };

  // Add trainee to session
  const handleAddTrainee = (employee: AttendeeRecord) => {
    if (!selectedSession) return;

    // Update session data to include the new attendee
    setSessionData((prev) =>
      prev.map((session) => {
        if (session.session_id === selectedSession.session_id) {
          return {
            ...session,
            attendees: [...session.attendees, employee],
          };
        }
        return session;
      })
    );

    // Set default attendance status for the new trainee
    setAttendanceData((prev) => ({
      ...prev,
      [employee.employee_id]: 'PRESENT',
    }));

    toast({
      title: t('attendance.addSuccess'),
      description: t('attendance.addSuccessDesc'),
    });

    setAddDialogOpen(false);
    setAddSearchQuery('');
  };

  // 출석 저장
  const handleSaveAttendance = async () => {
    if (!selectedSession) return;

    try {
      const attendances = Object.entries(attendanceData).map(([employeeId, status]) => ({
        employee_id: employeeId as EmployeeId,
        status,
        notes: status === 'ABSENT_WITH_REASON' ? reasonData[employeeId] : undefined,
      }));

      await saveBulkAttendance({
        session_id: selectedSession.session_id as SessionId,
        attendances,
      });

      logger.log('Attendance saved:', {
        session_id: selectedSession.session_id,
        count: attendances.length,
      });
      alert(t('messages.saveSuccess'));
    } catch (error) {
      logger.error('Failed to save attendance:', error);
      alert(t('messages.saveError'));
    }
  };

  // 세션 미선택 시 세션 목록 표시
  if (!selectedSession) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t('attendance.title')}</h1>
          <p className="text-muted-foreground">{t('attendance.description')}</p>
        </div>

        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
          </div>
        )}

        {/* 오늘 세션 */}
        {!isLoading && todaySessions.length > 0 && (
          <Card className="border-primary/50 bg-primary/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" />
                {t('attendance.todayScheduled')}
              </CardTitle>
              <CardDescription>{t('attendance.todaySessionCount', { count: todaySessions.length })}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {todaySessions.map((session) => (
                  <Card
                    key={session.session_id}
                    className="cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => navigate(`/attendance?session=${session.session_id}`)}
                  >
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start mb-2">
                        <Badge variant="outline">{session.program_code}</Badge>
                        <span className="text-sm text-muted-foreground">{session.session_time}</span>
                      </div>
                      <p className="font-medium truncate">{session.program_name}</p>
                      <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                        <Users className="h-4 w-4" />
                        <span>{t('attendance.attendeesExpected', { count: session.attendees.length })}</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* 전체 세션 목록 */}
        {!isLoading && <Card>
          <CardHeader>
            <CardTitle>{t('attendance.scheduledSessions')}</CardTitle>
            <CardDescription>{t('attendance.selectSessionDesc')}</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('attendance.date')}</TableHead>
                  <TableHead>{t('attendance.time')}</TableHead>
                  <TableHead>{t('common.program')}</TableHead>
                  <TableHead>{t('training.trainer')}</TableHead>
                  <TableHead>{t('training.location')}</TableHead>
                  <TableHead>{t('attendance.expectedCount')}</TableHead>
                  <TableHead>{t('common.actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sessionData.map((session) => (
                  <TableRow key={session.session_id}>
                    <TableCell>{session.session_date}</TableCell>
                    <TableCell>{session.session_time}</TableCell>
                    <TableCell>
                      <div>
                        <Badge variant="outline" className="mr-2">{session.program_code}</Badge>
                        {session.program_name}
                      </div>
                    </TableCell>
                    <TableCell>{session.trainer_name}</TableCell>
                    <TableCell>{session.location}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{t('attendance.countPeople', { count: session.attendees.length })}</Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        onClick={() => navigate(`/attendance?session=${session.session_id}`)}
                      >
                        <UserCheck className="h-4 w-4 mr-1" />
                        {t('attendance.checkAttendance')}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>}
      </div>
    );
  }

  // 세션 선택됨 - 출석 체크 UI
  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/attendance')}>
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{t('attendance.title')}</h1>
            <p className="text-muted-foreground">
              {selectedSession.program_name} - {selectedSession.session_date} {selectedSession.session_time}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Add Trainee Dialog */}
          <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
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
                    value={addSearchQuery}
                    onChange={(e) => setAddSearchQuery(e.target.value)}
                  />
                </div>
                <div className="max-h-[300px] overflow-y-auto border rounded-md">
                  {availableEmployees.length === 0 ? (
                    <div className="p-4 text-center text-sm text-muted-foreground">
                      {t('attendance.alreadyAdded')}
                    </div>
                  ) : (
                    availableEmployees.map((employee) => (
                      <div
                        key={employee.employee_id}
                        className="flex items-center justify-between p-3 hover:bg-muted/50 cursor-pointer border-b last:border-b-0"
                        onClick={() => handleAddTrainee(employee)}
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
                <Button variant="outline" onClick={() => { setAddDialogOpen(false); setAddSearchQuery(''); }}>
                  {t('common.close')}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Button onClick={handleSaveAttendance}>
            <CheckCircle2 className="h-4 w-4 mr-2" />
            {t('attendance.saveAttendance')}
          </Button>
        </div>
      </div>

      {/* 통계 카드 */}
      <div className="grid gap-4 md:grid-cols-6">
        <Card>
          <CardContent className="p-4 text-center">
            <Users className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
            <p className="text-2xl font-bold">{attendanceStats.total}</p>
            <p className="text-xs text-muted-foreground">{t('attendance.total')}</p>
          </CardContent>
        </Card>
        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-4 text-center">
            <UserCheck className="h-6 w-6 mx-auto mb-2 text-green-600" />
            <p className="text-2xl font-bold text-green-700">{attendanceStats.present}</p>
            <p className="text-xs text-green-600">{t('attendance.present')}</p>
          </CardContent>
        </Card>
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4 text-center">
            <UserX className="h-6 w-6 mx-auto mb-2 text-red-600" />
            <p className="text-2xl font-bold text-red-700">{attendanceStats.absent}</p>
            <p className="text-xs text-red-600">{t('attendance.absent')}</p>
          </CardContent>
        </Card>
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="p-4 text-center">
            <FileWarning className="h-6 w-6 mx-auto mb-2 text-orange-600" />
            <p className="text-2xl font-bold text-orange-700">{attendanceStats.absent_with_reason}</p>
            <p className="text-xs text-orange-600">{t('attendance.absentWithReason')}</p>
          </CardContent>
        </Card>
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="p-4 text-center">
            <Clock className="h-6 w-6 mx-auto mb-2 text-yellow-600" />
            <p className="text-2xl font-bold text-yellow-700">{attendanceStats.late}</p>
            <p className="text-xs text-yellow-600">{t('attendance.late')}</p>
          </CardContent>
        </Card>
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-4 text-center">
            <AlertCircle className="h-6 w-6 mx-auto mb-2 text-blue-600" />
            <p className="text-2xl font-bold text-blue-700">{attendanceStats.excused}</p>
            <p className="text-xs text-blue-600">{t('attendance.excused')}</p>
          </CardContent>
        </Card>
      </div>

      {/* 필터 및 일괄 처리 */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="relative w-full md:w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t('attendance.searchPlaceholder')}
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            {selectedEmployees.size > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  {t('attendance.selectedCount', { count: selectedEmployees.size })}
                </span>
                <Select value={bulkStatus} onValueChange={(v) => setBulkStatus(v as AttendanceStatus)}>
                  <SelectTrigger className="w-40">
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
                <Button size="sm" onClick={handleBulkStatusChange}>
                  {t('attendance.bulkApply')}
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 출석 명단 */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox
                    checked={selectedEmployees.size === sessionAttendees.length && sessionAttendees.length > 0}
                    onCheckedChange={handleSelectAll}
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
              {sessionAttendees.map((employee) => (
                <TableRow key={employee.employee_id}>
                  <TableCell>
                    <Checkbox
                      checked={selectedEmployees.has(employee.employee_id)}
                      onCheckedChange={(checked) =>
                        handleSelectEmployee(employee.employee_id, checked as boolean)
                      }
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
                        onValueChange={(v) => handleStatusChange(employee.employee_id, v as AttendanceStatus)}
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
                          onChange={(e) => handleReasonChange(employee.employee_id, e.target.value)}
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
                        onClick={() => handleStatusChange(employee.employee_id, 'PRESENT')}
                      >
                        <CheckCircle2 className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant={attendanceData[employee.employee_id] === 'ABSENT' ? 'destructive' : 'outline'}
                        className="h-8 w-8"
                        onClick={() => handleStatusChange(employee.employee_id, 'ABSENT')}
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
    </div>
  );
}
