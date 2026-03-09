import { useTranslation } from 'react-i18next';
import { Award, CheckCircle, Calendar, User } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface CertificateStats {
  totalEligible: number;
  totalIssued: number;
  uniqueEmployees: number;
  thisMonthCount: number;
}

interface CertificateStatsCardsProps {
  stats: CertificateStats;
}

export default function CertificateStatsCards({ stats }: CertificateStatsCardsProps) {
  const { t } = useTranslation();

  return (
    <div className="grid gap-4 md:grid-cols-4">
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.totalEligible}</p>
              <p className="text-xs text-muted-foreground">{t('certificates.issuableCount')}</p>
            </div>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Award className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.totalIssued}</p>
              <p className="text-xs text-muted-foreground">{t('certificates.issuedCount')}</p>
            </div>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <User className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.uniqueEmployees}</p>
              <p className="text-xs text-muted-foreground">{t('certificates.completedEmployees')}</p>
            </div>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Calendar className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.thisMonthCount}</p>
              <p className="text-xs text-muted-foreground">{t('certificates.thisMonthCompleted')}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
