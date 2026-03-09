import { useTranslation } from 'react-i18next';
import { Award, Search, Users } from 'lucide-react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { TrainingResult, ProgramOption } from './types';

interface CertificateIssuanceTabProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  selectedProgram: string;
  onProgramChange: (value: string) => void;
  programs: ProgramOption[];
  eligibleResults: TrainingResult[];
  onIssueCertificate: (result: TrainingResult) => void;
  onBatchIssue: () => void;
}

export default function CertificateIssuanceTab({
  searchQuery,
  onSearchChange,
  selectedProgram,
  onProgramChange,
  programs,
  eligibleResults,
  onIssueCertificate,
  onBatchIssue,
}: CertificateIssuanceTabProps) {
  const { t } = useTranslation();

  return (
    <div className="space-y-4">
      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t('certificates.searchPlaceholder')}
                className="pl-8"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
              />
            </div>
            <Select value={selectedProgram} onValueChange={onProgramChange}>
              <SelectTrigger className="w-full md:w-64">
                <SelectValue placeholder={t('certificates.allPrograms')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('certificates.allPrograms')}</SelectItem>
                {programs.map((program) => (
                  <SelectItem key={program.program_code} value={program.program_code}>
                    {program.program_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={onBatchIssue}>
              <Users className="h-4 w-4 mr-2" />
              {t('certificates.batchIssue')}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Results List */}
      <Card>
        <CardHeader>
          <CardTitle>{t('certificates.listTitle')}</CardTitle>
          <CardDescription>
            {t('certificates.listDescription')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('certificates.colEmployeeId')}</TableHead>
                <TableHead>{t('certificates.colName')}</TableHead>
                <TableHead>{t('certificates.colDepartment')}</TableHead>
                <TableHead>{t('certificates.colProgram')}</TableHead>
                <TableHead>{t('certificates.colTrainingDate')}</TableHead>
                <TableHead>{t('certificates.colScore')}</TableHead>
                <TableHead>{t('certificates.colGrade')}</TableHead>
                <TableHead className="text-right">{t('certificates.colActions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {eligibleResults.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8}>
                    <EmptyState
                      icon={Award}
                      title={t('certificates.emptyTitle')}
                      description={t('certificates.emptyDescription')}
                    />
                  </TableCell>
                </TableRow>
              ) : (
                eligibleResults.map((result) => (
                  <TableRow key={result.result_id}>
                    <TableCell className="font-mono">{result.employee_id}</TableCell>
                    <TableCell className="font-medium">{result.employee_name}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{result.department}</Badge>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{result.program_name}</p>
                        <p className="text-xs text-muted-foreground">{result.program_code}</p>
                      </div>
                    </TableCell>
                    <TableCell>{result.training_date}</TableCell>
                    <TableCell>{result.score ?? '-'}</TableCell>
                    <TableCell>
                      {result.grade && (
                        <Badge variant={
                          result.grade === 'AA' ? 'default' :
                          result.grade === 'A' ? 'success' :
                          result.grade === 'B' ? 'warning' : 'secondary'
                        }>
                          {result.grade}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        onClick={() => onIssueCertificate(result)}
                      >
                        <Award className="h-4 w-4 mr-1" />
                        {t('certificates.issueCertificate')}
                      </Button>
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
