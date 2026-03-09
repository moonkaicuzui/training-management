import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import {
  Clock,
  Users,
  UserCheck,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
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
import type { SessionWithAttendance } from './types';

interface SessionListViewProps {
  isLoading: boolean;
  todaySessions: SessionWithAttendance[];
  sessionData: SessionWithAttendance[];
}

export function SessionListView({
  isLoading,
  todaySessions,
  sessionData,
}: SessionListViewProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();

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

      {/* Today's sessions */}
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

      {/* All sessions table */}
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
