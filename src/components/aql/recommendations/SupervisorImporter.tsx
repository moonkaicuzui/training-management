import { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Upload, FileUp, CheckCircle, AlertTriangle, Loader2, CloudDownload } from 'lucide-react';
import type { AqlSupervisorLink } from '@/types/aql';

interface ImportResult {
  success: number;
  errors: Array<{ row: number; message: string }>;
}

interface Props {
  supervisorLinks: AqlSupervisorLink[];
  onImport: (
    csvText: string,
    fileName: string
  ) => Promise<{ success: number; errors: Array<{ row: number; message: string }> }>;
  onAutoImport: () => Promise<{ success: number; errors: Array<{ row: number; message: string }> }>;
  isImporting: boolean;
}

export function SupervisorImporter({
  supervisorLinks,
  onImport,
  onAutoImport,
  isImporting,
}: Props) {
  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setImportResult(null);
    }
  };

  const handleImport = async () => {
    if (!selectedFile) return;

    const csvText = await selectedFile.text();
    const result = await onImport(csvText, selectedFile.name);
    setImportResult(result);
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold flex items-center gap-2">
        <Upload className="h-5 w-5" />
        {t('aql.recommendations.supervisorImporter', 'Supervisor Importer')}
      </h3>

      {/* Auto-Import from Drive */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <CloudDownload className="h-4 w-4" />
            {t('aql.recommendations.autoImport', 'Auto-Import from Google Drive')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-3">
            {t(
              'aql.recommendations.autoImportDesc',
              'Automatically fetch Basic Manpower CSV from Google Drive and import supervisor links.'
            )}
          </p>
          <Button
            onClick={async () => {
              const result = await onAutoImport();
              setImportResult(result);
            }}
            disabled={isImporting}
            className="w-full"
            variant="default"
          >
            {isImporting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <CloudDownload className="mr-2 h-4 w-4" />
            )}
            {isImporting
              ? t('aql.recommendations.importing', 'Importing...')
              : t('aql.recommendations.autoImportButton', 'Import from Drive')}
          </Button>
        </CardContent>
      </Card>

      {/* Import Result */}
      {importResult && (
        <div className="space-y-2">
          {importResult.success > 0 && (
            <Alert>
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription>
                {t('aql.recommendations.importSuccess', {
                  count: importResult.success,
                  defaultValue: '{{count}} records imported successfully.',
                })}
              </AlertDescription>
            </Alert>
          )}

          {importResult.errors.length > 0 && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <p className="font-medium mb-1">
                  {t('aql.recommendations.importErrors', {
                    count: importResult.errors.length,
                    defaultValue: '{{count}} errors occurred:',
                  })}
                </p>
                <ul className="list-disc list-inside text-sm space-y-0.5">
                  {importResult.errors.slice(0, 10).map((err) => (
                    <li key={err.row}>
                      {t('aql.recommendations.importErrorRow', {
                        row: err.row,
                        message: err.message,
                        defaultValue: 'Row {{row}}: {{message}}',
                      })}
                    </li>
                  ))}
                  {importResult.errors.length > 10 && (
                    <li className="text-muted-foreground">
                      {t('aql.recommendations.moreErrors', {
                        count: importResult.errors.length - 10,
                        defaultValue: '...and {{count}} more errors',
                      })}
                    </li>
                  )}
                </ul>
              </AlertDescription>
            </Alert>
          )}
        </div>
      )}

      {/* Manual Upload Section */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center justify-between">
            <span>
              {t('aql.recommendations.importCsv', 'Import CSV')}
            </span>
            <Badge variant="secondary">
              {t('aql.recommendations.currentLinksCount', {
                count: supervisorLinks.length,
                defaultValue: '{{count}} links',
              })}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* File Upload Area */}
          <div
            className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-primary/50 transition-colors"
            onClick={handleUploadClick}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileSelect}
              className="hidden"
            />
            <FileUp className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
            {selectedFile ? (
              <p className="text-sm font-medium">{selectedFile.name}</p>
            ) : (
              <p className="text-sm text-muted-foreground">
                {t(
                  'aql.recommendations.clickToUpload',
                  'Click to select a CSV file'
                )}
              </p>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              {t(
                'aql.recommendations.csvFormat',
                'Format: employee_no, employee_name, supervisor_no, supervisor_name, building'
              )}
            </p>
          </div>

          {/* Import Button */}
          <Button
            onClick={handleImport}
            disabled={!selectedFile || isImporting}
            className="w-full"
          >
            {isImporting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Upload className="mr-2 h-4 w-4" />
            )}
            {isImporting
              ? t('aql.recommendations.importing', 'Importing...')
              : t('aql.recommendations.importButton', 'Import')}
          </Button>

        </CardContent>
      </Card>

      {/* Current Supervisor Links Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">
            {t('aql.recommendations.currentSupervisorLinks', 'Current Supervisor Links')}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-auto max-h-[400px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>
                    {t('aql.recommendations.employeeNo', 'Employee No')}
                  </TableHead>
                  <TableHead>
                    {t('aql.recommendations.employeeName', 'Employee Name')}
                  </TableHead>
                  <TableHead>
                    {t('aql.recommendations.supervisorName', 'Supervisor Name')}
                  </TableHead>
                  <TableHead>
                    {t('aql.recommendations.building', 'Building')}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {supervisorLinks.map((link) => (
                  <TableRow key={link.link_id}>
                    <TableCell className="font-mono text-sm">
                      {link.employee_no}
                    </TableCell>
                    <TableCell>{link.employee_name}</TableCell>
                    <TableCell>{link.supervisor_name}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {link.building}
                    </TableCell>
                  </TableRow>
                ))}
                {supervisorLinks.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={4}
                      className="text-center text-muted-foreground py-8"
                    >
                      {t('aql.recommendations.noSupervisorLinks', 'No supervisor links imported')}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
