import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Award, Printer, CheckCircle2, Clock } from 'lucide-react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useNewTQCStore } from '@/stores/newTqcStore';
import { useUIStore } from '@/stores/uiStore';

export default function NewTQCCertificates() {
  const { t } = useTranslation();
  const { trainees, updateTrainee } = useNewTQCStore();
  const { addToast } = useUIStore();
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // Only trainees who passed final result are eligible
  const eligibleTrainees = useMemo(() => {
    return trainees.filter(tr => tr.final_result === 'PASS');
  }, [trainees]);

  const filteredTrainees = useMemo(() => {
    if (filterStatus === 'all') return eligibleTrainees;
    if (filterStatus === 'issued') return eligibleTrainees.filter(tr => tr.certificate_issued);
    if (filterStatus === 'notIssued') return eligibleTrainees.filter(tr => !tr.certificate_issued);
    return eligibleTrainees;
  }, [eligibleTrainees, filterStatus]);

  const notIssuedCount = useMemo(() => {
    return eligibleTrainees.filter(tr => !tr.certificate_issued).length;
  }, [eligibleTrainees]);

  const handleIssueCertificate = async (traineeId: string) => {
    try {
      await updateTrainee({
        trainee_id: traineeId,
        certificate_issued: true,
        certificate_date: new Date().toISOString().split('T')[0],
      });
      // updateTrainee가 스토어를 자동 갱신하므로 직접 변경 불필요
      addToast({
        type: 'success',
        title: t('messages.saveSuccess'),
      });
    } catch {
      addToast({
        type: 'error',
        title: t('messages.saveError'),
      });
    }
  };

  const handleIssueAll = async () => {
    const notIssued = eligibleTrainees.filter(tr => !tr.certificate_issued);
    const results = await Promise.allSettled(
      notIssued.map(trainee => updateTrainee({
        trainee_id: trainee.trainee_id,
        certificate_issued: true,
        certificate_date: new Date().toISOString().split('T')[0],
      }))
    );
    const successCount = results.filter(r => r.status === 'fulfilled').length;
    const failCount = results.filter(r => r.status === 'rejected').length;
    if (successCount > 0) {
      addToast({ type: 'success', title: t('messages.saveSuccess'), description: `${successCount}/${notIssued.length}` });
    }
    if (failCount > 0) {
      addToast({ type: 'error', title: t('messages.saveError'), description: `${failCount} failed` });
    }
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString();
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {t('newTQCModule.certificates.title')}
          </h1>
          <p className="text-muted-foreground">
            {t('newTQCModule.certificates.description')}
          </p>
        </div>
        {notIssuedCount > 0 && (
          <Button onClick={handleIssueAll}>
            <Award className="h-4 w-4 mr-2" />
            {t('newTQCModule.certificates.issueAll')}
            <Badge variant="secondary" className="ml-2">
              {notIssuedCount}
            </Badge>
          </Button>
        )}
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{eligibleTrainees.length}</div>
            <p className="text-muted-foreground text-sm">
              {t('newTQCModule.certificates.eligibleCount', { count: eligibleTrainees.length })}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-green-600">
              {eligibleTrainees.filter(tr => tr.certificate_issued).length}
            </div>
            <p className="text-muted-foreground text-sm">{t('newTQCModule.certificates.issued')}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-orange-600">{notIssuedCount}</div>
            <p className="text-muted-foreground text-sm">{t('newTQCModule.certificates.notIssued')}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filter */}
      <Card>
        <CardContent className="pt-6">
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[200px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('common.all')}</SelectItem>
              <SelectItem value="issued">{t('newTQCModule.certificates.issued')}</SelectItem>
              <SelectItem value="notIssued">{t('newTQCModule.certificates.notIssued')}</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Certificates Table */}
      <Card>
        <CardHeader>
          <CardTitle>{t('newTQCModule.certificates.title')}</CardTitle>
          <CardDescription>
            {filteredTrainees.length} {t('nav.newTQC.trainees')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('common.name')}</TableHead>
                <TableHead>{t('newTQCModule.building')}</TableHead>
                <TableHead>{t('newTQCModule.workingArea')}</TableHead>
                <TableHead>{t('newTQCModule.certificates.trainingPeriod')}</TableHead>
                <TableHead className="text-center">{t('newTQCModule.finalResult.testScore')}</TableHead>
                <TableHead className="text-center">{t('newTQCModule.finalResult.grade')}</TableHead>
                <TableHead className="text-center">{t('common.status')}</TableHead>
                <TableHead>{t('newTQCModule.certificates.issueDate')}</TableHead>
                <TableHead>{t('common.actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTrainees.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                    {t('common.noData')}
                  </TableCell>
                </TableRow>
              ) : (
                filteredTrainees.map((trainee) => (
                  <TableRow key={trainee.trainee_id}>
                    <TableCell className="font-medium">{trainee.name}</TableCell>
                    <TableCell>{trainee.building || '-'}</TableCell>
                    <TableCell>{trainee.working_area || '-'}</TableCell>
                    <TableCell>
                      {formatDate(trainee.start_date)} ~ {formatDate(trainee.training_end_date || trainee.expected_end_date)}
                    </TableCell>
                    <TableCell className="text-center font-mono">
                      {trainee.final_test_score ?? '-'}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant={trainee.final_grade === 'C' ? 'destructive' : 'default'}>
                        {trainee.final_grade || '-'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      {trainee.certificate_issued ? (
                        <Badge variant="success">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          {t('newTQCModule.certificates.issued')}
                        </Badge>
                      ) : (
                        <Badge variant="outline">
                          <Clock className="h-3 w-3 mr-1" />
                          {t('newTQCModule.certificates.notIssued')}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {trainee.certificate_date ? formatDate(trainee.certificate_date) : '-'}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        {!trainee.certificate_issued && (
                          <Button
                            size="sm"
                            onClick={() => handleIssueCertificate(trainee.trainee_id)}
                          >
                            <Award className="h-3 w-3 mr-1" />
                            {t('newTQCModule.certificates.issueCertificate')}
                          </Button>
                        )}
                        {trainee.certificate_issued && (
                          <Button size="sm" variant="outline">
                            <Printer className="h-3 w-3 mr-1" />
                            {t('newTQCModule.certificates.printCertificate')}
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
