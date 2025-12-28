import { useState, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
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
import type { AttendanceStatus } from '@/types/attendance';

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

// 샘플 세션 데이터
const sampleSessions: SessionWithAttendance[] = [
  {
    session_id: 'SES-001',
    program_code: 'QIP-001',
    program_name: 'QIP 기초 교육',
    session_date: format(new Date(), 'yyyy-MM-dd'),
    session_time: '09:00',
    trainer_name: '김강사',
    location: 'A동 2층 교육실',
    attendees: [
      { employee_id: 'EMP-001', employee_name: '홍길동', department: 'QIP', position: 'TQC' },
      { employee_id: 'EMP-002', employee_name: '김철수', department: 'QIP', position: 'RQC' },
      { employee_id: 'EMP-003', employee_name: '이영희', department: 'Production', position: 'Line Leader' },
    ],
  },
  {
    session_id: 'SES-002',
    program_code: 'PRO-001',
    program_name: '생산 품질 관리',
    session_date: format(new Date(), 'yyyy-MM-dd'),
    session_time: '14:00',
    trainer_name: '박강사',
    location: 'B동 1층 대강당',
    attendees: [
      { employee_id: 'EMP-004', employee_name: '박지성', department: 'Production', position: 'Operator' },
      { employee_id: 'EMP-005', employee_name: '손흥민', department: 'Production', position: 'Line Leader' },
    ],
  },
];

export default function AttendancePage() {
  useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session');

  const [searchQuery, setSearchQuery] = useState('');
  const [attendanceData, setAttendanceData] = useState<Record<string, AttendanceStatus>>({});
  const [selectedEmployees, setSelectedEmployees] = useState<Set<string>>(new Set());
  const [bulkStatus, setBulkStatus] = useState<AttendanceStatus>('PRESENT');

  // 선택된 세션
  const selectedSession = useMemo(() => {
    if (!sessionId) return null;
    const session = sampleSessions.find(s => s.session_id === sessionId);
    if (session && Object.keys(attendanceData).length === 0) {
      // 초기 출석 데이터 설정
      const initial: Record<string, AttendanceStatus> = {};
      session.attendees.forEach(emp => {
        initial[emp.employee_id] = 'PRESENT';
      });
      setAttendanceData(initial);
    }
    return session;
  }, [sessionId, attendanceData]);

  // 오늘 예정된 세션
  const todaySessions = useMemo(() => {
    const today = format(new Date(), 'yyyy-MM-dd');
    return sampleSessions.filter(s => s.session_date === today);
  }, []);

  // 세션의 참석자 목록
  const sessionAttendees = useMemo(() => {
    if (!selectedSession) return [];
    return selectedSession.attendees.filter(emp =>
      emp.employee_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.employee_id.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [selectedSession, searchQuery]);

  // 출석 통계
  const attendanceStats = useMemo(() => {
    const stats = { present: 0, absent: 0, late: 0, excused: 0, total: 0 };
    Object.values(attendanceData).forEach((status) => {
      stats[status.toLowerCase() as keyof typeof stats]++;
      stats.total++;
    });
    return stats;
  }, [attendanceData]);

  // 출석 상태 변경
  const handleStatusChange = (employeeId: string, status: AttendanceStatus) => {
    setAttendanceData((prev) => ({ ...prev, [employeeId]: status }));
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
    setSelectedEmployees(new Set());
  };

  // 출석 저장
  const handleSaveAttendance = async () => {
    // TODO: API 호출로 출석 데이터 저장
    console.log('Saving attendance:', {
      session_id: selectedSession?.session_id,
      attendance: attendanceData,
    });
    alert('출석이 저장되었습니다.');
  };

  // 세션 미선택 시 세션 목록 표시
  if (!selectedSession) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">출석 체크</h1>
          <p className="text-muted-foreground">교육 세션별 출석을 관리합니다</p>
        </div>

        {/* 오늘 세션 */}
        {todaySessions.length > 0 && (
          <Card className="border-primary/50 bg-primary/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" />
                오늘 예정된 교육
              </CardTitle>
              <CardDescription>{todaySessions.length}개의 세션이 오늘 예정되어 있습니다</CardDescription>
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
                        <span>{session.attendees.length}명 예정</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* 전체 세션 목록 */}
        <Card>
          <CardHeader>
            <CardTitle>예정된 교육 세션</CardTitle>
            <CardDescription>출석을 체크할 세션을 선택하세요</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>날짜</TableHead>
                  <TableHead>시간</TableHead>
                  <TableHead>프로그램</TableHead>
                  <TableHead>강사</TableHead>
                  <TableHead>장소</TableHead>
                  <TableHead>예정 인원</TableHead>
                  <TableHead>액션</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sampleSessions.map((session) => (
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
                      <Badge variant="secondary">{session.attendees.length}명</Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        onClick={() => navigate(`/attendance?session=${session.session_id}`)}
                      >
                        <UserCheck className="h-4 w-4 mr-1" />
                        출석 체크
                      </Button>
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
            <h1 className="text-2xl font-bold tracking-tight">출석 체크</h1>
            <p className="text-muted-foreground">
              {selectedSession.program_name} - {selectedSession.session_date} {selectedSession.session_time}
            </p>
          </div>
        </div>
        <Button onClick={handleSaveAttendance}>
          <CheckCircle2 className="h-4 w-4 mr-2" />
          출석 저장
        </Button>
      </div>

      {/* 통계 카드 */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardContent className="p-4 text-center">
            <Users className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
            <p className="text-2xl font-bold">{attendanceStats.total}</p>
            <p className="text-xs text-muted-foreground">전체</p>
          </CardContent>
        </Card>
        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-4 text-center">
            <UserCheck className="h-6 w-6 mx-auto mb-2 text-green-600" />
            <p className="text-2xl font-bold text-green-700">{attendanceStats.present}</p>
            <p className="text-xs text-green-600">출석</p>
          </CardContent>
        </Card>
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4 text-center">
            <UserX className="h-6 w-6 mx-auto mb-2 text-red-600" />
            <p className="text-2xl font-bold text-red-700">{attendanceStats.absent}</p>
            <p className="text-xs text-red-600">결석</p>
          </CardContent>
        </Card>
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="p-4 text-center">
            <Clock className="h-6 w-6 mx-auto mb-2 text-yellow-600" />
            <p className="text-2xl font-bold text-yellow-700">{attendanceStats.late}</p>
            <p className="text-xs text-yellow-600">지각</p>
          </CardContent>
        </Card>
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-4 text-center">
            <AlertCircle className="h-6 w-6 mx-auto mb-2 text-blue-600" />
            <p className="text-2xl font-bold text-blue-700">{attendanceStats.excused}</p>
            <p className="text-xs text-blue-600">사유결석</p>
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
                placeholder="이름 또는 사번 검색..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            {selectedEmployees.size > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  {selectedEmployees.size}명 선택됨
                </span>
                <Select value={bulkStatus} onValueChange={(v) => setBulkStatus(v as AttendanceStatus)}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PRESENT">출석</SelectItem>
                    <SelectItem value="ABSENT">결석</SelectItem>
                    <SelectItem value="LATE">지각</SelectItem>
                    <SelectItem value="EXCUSED">사유결석</SelectItem>
                  </SelectContent>
                </Select>
                <Button size="sm" onClick={handleBulkStatusChange}>
                  일괄 적용
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
                <TableHead>사번</TableHead>
                <TableHead>이름</TableHead>
                <TableHead>부서</TableHead>
                <TableHead>직책</TableHead>
                <TableHead>출석 상태</TableHead>
                <TableHead>빠른 체크</TableHead>
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
                    <Select
                      value={attendanceData[employee.employee_id] || 'PRESENT'}
                      onValueChange={(v) => handleStatusChange(employee.employee_id, v as AttendanceStatus)}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="PRESENT">출석</SelectItem>
                        <SelectItem value="ABSENT">결석</SelectItem>
                        <SelectItem value="LATE">지각</SelectItem>
                        <SelectItem value="EXCUSED">사유결석</SelectItem>
                      </SelectContent>
                    </Select>
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
