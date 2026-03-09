import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { logger } from '@/utils/logger';
import { format } from 'date-fns';
import { ChevronLeft, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import type { AttendanceStatus } from '@/types/attendance';
import type { SessionId, EmployeeId } from '@/types/branded';
import { saveBulkAttendance } from '@/services/api';
import * as api from '@/services/api';
import {
  SessionListView,
  AttendanceStatsCards,
  AttendanceToolbar,
  AttendanceTable,
  AddTraineeDialog,
} from '@/components/attendance';
import type { AttendeeRecord, SessionWithAttendance } from '@/components/attendance';

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

      const empRecords: AttendeeRecord[] = employeesData
        .filter(e => e.status === 'ACTIVE')
        .map(e => ({
          employee_id: e.employee_id,
          employee_name: e.employee_name,
          department: e.department || '',
          position: e.position || '',
        }));
      setAllEmployees(empRecords);

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
      logger.error('Failed to load attendance data:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Selected session
  const selectedSession = useMemo(() => {
    if (!sessionId) return null;
    return sessionData.find(s => s.session_id === sessionId) ?? null;
  }, [sessionId, sessionData]);

  // Initialize attendance data when session changes
  const lastSessionIdRef = useRef<string | null>(null);
  const currentSessionId = selectedSession?.session_id ?? null;

  useEffect(() => {
    if (currentSessionId && lastSessionIdRef.current !== currentSessionId && selectedSession) {
      const initial: Record<string, AttendanceStatus> = {};
      selectedSession.attendees.forEach(emp => {
        initial[emp.employee_id] = 'PRESENT';
      });
      // eslint-disable-next-line react-hooks/set-state-in-effect -- session switch, runs once
      setAttendanceData(initial);
      setReasonData({});
      lastSessionIdRef.current = currentSessionId;
    }
  }, [currentSessionId, selectedSession]);

  // Today's sessions
  const todaySessions = useMemo(() => {
    const today = format(new Date(), 'yyyy-MM-dd');
    return sessionData.filter(s => s.session_date === today);
  }, [sessionData]);

  // Filtered attendees
  const sessionAttendees = useMemo(() => {
    if (!selectedSession) return [];
    return selectedSession.attendees.filter(emp =>
      emp.employee_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.employee_id.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [selectedSession, searchQuery]);

  // Available employees for add-trainee dialog
  const availableEmployees = useMemo(() => {
    if (!selectedSession) return [];
    const existingIds = new Set(selectedSession.attendees.map(a => a.employee_id));
    return allEmployees.filter(emp => !existingIds.has(emp.employee_id));
  }, [selectedSession, allEmployees]);

  // Attendance stats
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

  // Status change handler
  const handleStatusChange = (employeeId: string, status: AttendanceStatus) => {
    setAttendanceData((prev) => ({ ...prev, [employeeId]: status }));
    if (status !== 'ABSENT_WITH_REASON') {
      setReasonData((prev) => {
        const next = { ...prev };
        delete next[employeeId];
        return next;
      });
    }
  };

  // Reason change handler
  const handleReasonChange = (employeeId: string, reason: string) => {
    setReasonData((prev) => ({ ...prev, [employeeId]: reason }));
  };

  // Select all
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedEmployees(new Set(sessionAttendees.map(emp => emp.employee_id)));
    } else {
      setSelectedEmployees(new Set());
    }
  };

  // Select individual
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

  // Bulk status change
  const handleBulkStatusChange = () => {
    setAttendanceData((prev) => {
      const next = { ...prev };
      selectedEmployees.forEach((empId) => {
        next[empId] = bulkStatus;
      });
      return next;
    });
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

    setAttendanceData((prev) => ({
      ...prev,
      [employee.employee_id]: 'PRESENT',
    }));

    toast({
      title: t('attendance.addSuccess'),
      description: t('attendance.addSuccessDesc'),
    });

    setAddDialogOpen(false);
  };

  // Save attendance
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

  // No session selected - show session list
  if (!selectedSession) {
    return (
      <SessionListView
        isLoading={isLoading}
        todaySessions={todaySessions}
        sessionData={sessionData}
      />
    );
  }

  // Session selected - attendance check UI
  return (
    <div className="space-y-6">
      {/* Header */}
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
          <AddTraineeDialog
            open={addDialogOpen}
            onOpenChange={setAddDialogOpen}
            availableEmployees={availableEmployees}
            onAddTrainee={handleAddTrainee}
          />
          <Button onClick={handleSaveAttendance}>
            <CheckCircle2 className="h-4 w-4 mr-2" />
            {t('attendance.saveAttendance')}
          </Button>
        </div>
      </div>

      <AttendanceStatsCards stats={attendanceStats} />

      <AttendanceToolbar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedCount={selectedEmployees.size}
        bulkStatus={bulkStatus}
        onBulkStatusChange={setBulkStatus}
        onBulkApply={handleBulkStatusChange}
      />

      <AttendanceTable
        attendees={sessionAttendees}
        attendanceData={attendanceData}
        reasonData={reasonData}
        selectedEmployees={selectedEmployees}
        onStatusChange={handleStatusChange}
        onReasonChange={handleReasonChange}
        onSelectAll={handleSelectAll}
        onSelectEmployee={handleSelectEmployee}
      />
    </div>
  );
}
