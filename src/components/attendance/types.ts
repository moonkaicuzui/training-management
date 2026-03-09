export interface AttendeeRecord {
  employee_id: string;
  employee_name: string;
  department: string;
  position: string;
}

export interface SessionWithAttendance {
  session_id: string;
  program_code: string;
  program_name: string;
  session_date: string;
  session_time: string;
  trainer_name: string;
  location: string;
  attendees: AttendeeRecord[];
}

export interface AttendanceStats {
  present: number;
  absent: number;
  late: number;
  excused: number;
  absent_with_reason: number;
  total: number;
}
