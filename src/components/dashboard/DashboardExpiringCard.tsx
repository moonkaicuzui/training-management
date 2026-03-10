import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Clock, Calendar } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { NormalizedExpiringTraining } from '@/types/normalized';

interface DashboardExpiringCardProps {
  expiringTrainings: readonly NormalizedExpiringTraining[];
}

export function DashboardExpiringCard({ expiringTrainings }: DashboardExpiringCardProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  if (expiringTrainings.length === 0) return null;

  return (
    <Card className="border-warning/50 bg-warning/5">
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-full bg-warning/20">
            <Clock className="h-5 w-5 text-warning" />
          </div>
          <div>
            <CardTitle className="text-lg">{t('progress.expiring')}</CardTitle>
            <CardDescription>
              {t('dashboard.recent10')} - {expiringTrainings.length}건
            </CardDescription>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={() => navigate('/retraining')}>
          {t('common.viewAll')}
        </Button>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {expiringTrainings.slice(0, 6).map((item, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-3 rounded-lg border bg-background hover:shadow-sm transition-shadow cursor-pointer"
              onClick={() => navigate(`/employees/${item.employee.employee_id}`)}
            >
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{item.employee.employee_name}</p>
                <p className="text-sm text-muted-foreground truncate">
                  {item.program.program_name}
                </p>
              </div>
              <div className="flex items-center gap-2 ml-2">
                <Badge
                  variant={item.days_until_expiry <= 7 ? 'destructive' : 'outline'}
                  className={item.days_until_expiry <= 7 ? '' : 'border-warning text-warning'}
                >
                  <Calendar className="h-3 w-3 mr-1" />
                  D-{item.days_until_expiry}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
