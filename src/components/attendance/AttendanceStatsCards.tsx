import { useTranslation } from 'react-i18next';
import {
  UserCheck,
  UserX,
  Clock,
  Users,
  AlertCircle,
  FileWarning,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import type { AttendanceStats } from './types';

interface AttendanceStatsCardsProps {
  stats: AttendanceStats;
}

export function AttendanceStatsCards({ stats }: AttendanceStatsCardsProps) {
  const { t } = useTranslation();

  return (
    <div className="grid gap-4 md:grid-cols-6">
      <Card>
        <CardContent className="p-4 text-center">
          <Users className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
          <p className="text-2xl font-bold">{stats.total}</p>
          <p className="text-xs text-muted-foreground">{t('attendance.total')}</p>
        </CardContent>
      </Card>
      <Card className="border-green-200 bg-green-50">
        <CardContent className="p-4 text-center">
          <UserCheck className="h-6 w-6 mx-auto mb-2 text-green-600" />
          <p className="text-2xl font-bold text-green-700">{stats.present}</p>
          <p className="text-xs text-green-600">{t('attendance.present')}</p>
        </CardContent>
      </Card>
      <Card className="border-red-200 bg-red-50">
        <CardContent className="p-4 text-center">
          <UserX className="h-6 w-6 mx-auto mb-2 text-red-600" />
          <p className="text-2xl font-bold text-red-700">{stats.absent}</p>
          <p className="text-xs text-red-600">{t('attendance.absent')}</p>
        </CardContent>
      </Card>
      <Card className="border-orange-200 bg-orange-50">
        <CardContent className="p-4 text-center">
          <FileWarning className="h-6 w-6 mx-auto mb-2 text-orange-600" />
          <p className="text-2xl font-bold text-orange-700">{stats.absent_with_reason}</p>
          <p className="text-xs text-orange-600">{t('attendance.absentWithReason')}</p>
        </CardContent>
      </Card>
      <Card className="border-yellow-200 bg-yellow-50">
        <CardContent className="p-4 text-center">
          <Clock className="h-6 w-6 mx-auto mb-2 text-yellow-600" />
          <p className="text-2xl font-bold text-yellow-700">{stats.late}</p>
          <p className="text-xs text-yellow-600">{t('attendance.late')}</p>
        </CardContent>
      </Card>
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="p-4 text-center">
          <AlertCircle className="h-6 w-6 mx-auto mb-2 text-blue-600" />
          <p className="text-2xl font-bold text-blue-700">{stats.excused}</p>
          <p className="text-xs text-blue-600">{t('attendance.excused')}</p>
        </CardContent>
      </Card>
    </div>
  );
}
