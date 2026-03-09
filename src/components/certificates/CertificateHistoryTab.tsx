import { useTranslation } from 'react-i18next';
import { Award, Search, Loader2, Ban } from 'lucide-react';
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
import { EmptyState } from '@/components/common/EmptyState';
import type { Certificate } from '@/services/certificateService';

interface CertificateHistoryTabProps {
  certificates: Certificate[];
  isLoading: boolean;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onRevoke: (certificateId: string) => void;
}

export function CertificateHistoryTab({
  certificates,
  isLoading,
  searchQuery,
  onSearchChange,
  onRevoke,
}: CertificateHistoryTabProps) {
  const { t } = useTranslation();

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t('certificates.searchIssuedPlaceholder')}
              className="pl-8"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('certificates.certificateHistory')}</CardTitle>
          <CardDescription>{t('certificates.certificateHistoryDesc')}</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('certificates.certNumber')}</TableHead>
                  <TableHead>{t('certificates.colEmployeeId')}</TableHead>
                  <TableHead>{t('certificates.colName')}</TableHead>
                  <TableHead>{t('certificates.colProgram')}</TableHead>
                  <TableHead>{t('certificates.colTrainingDate')}</TableHead>
                  <TableHead>{t('certificates.issueDate')}</TableHead>
                  <TableHead>{t('common.status')}</TableHead>
                  <TableHead className="text-right">{t('common.actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {certificates.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8}>
                      <EmptyState
                        icon={Award}
                        title={t('certificates.historyEmptyTitle')}
                        description={t('certificates.historyEmptyDescription')}
                      />
                    </TableCell>
                  </TableRow>
                ) : (
                  certificates.map((cert) => (
                    <TableRow key={cert.certificate_id}>
                      <TableCell className="font-mono text-sm">{cert.certificate_number}</TableCell>
                      <TableCell className="font-mono text-sm">{cert.employee_id}</TableCell>
                      <TableCell className="font-medium">{cert.employee_name}</TableCell>
                      <TableCell>
                        <div>
                          <p className="text-sm">{cert.program_name}</p>
                          <p className="text-xs text-muted-foreground">{cert.program_code}</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">{cert.training_date}</TableCell>
                      <TableCell className="text-sm">{cert.issue_date}</TableCell>
                      <TableCell>
                        <Badge variant={cert.status === 'ISSUED' ? 'success' : 'destructive'}>
                          {cert.status === 'ISSUED'
                            ? t('certificates.issuedStatus')
                            : t('certificates.revokedStatus')}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {cert.status === 'ISSUED' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:text-destructive"
                            onClick={() => onRevoke(cert.certificate_id)}
                          >
                            <Ban className="h-4 w-4 mr-1" />
                            {t('certificates.revoke')}
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
