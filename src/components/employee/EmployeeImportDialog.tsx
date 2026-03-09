import { useRef, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Upload, AlertTriangle, CheckCircle2, Loader2, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { parseHRCsv, type ParseResult } from '@/utils/hrCsvParser';
import * as api from '@/services/api';
import { useUIStore } from '@/stores/uiStore';

interface EmployeeImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImportComplete: () => void;
}

export function EmployeeImportDialog({
  open,
  onOpenChange,
  onImportComplete,
}: EmployeeImportDialogProps) {
  const { t } = useTranslation();
  const addToast = useUIStore((s) => s.addToast);
  const [importResult, setImportResult] = useState<ParseResult | null>(null);
  const [importing, setImporting] = useState(false);
  const [selectedFileName, setSelectedFileName] = useState('');
  const [sheetsUrl, setSheetsUrl] = useState('');
  const [fetchingSheets, setFetchingSheets] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const result = parseHRCsv(text);
      setImportResult(result);
    };
    reader.readAsText(file, 'UTF-8');
  }, []);

  const handleFetchSheets = useCallback(async () => {
    if (!sheetsUrl.trim()) return;

    const match = sheetsUrl.match(/\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/);
    if (!match) {
      addToast({ type: 'error', title: t('employee.importInvalidUrl') });
      return;
    }

    const sheetId = match[1];
    const csvUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv`;

    setFetchingSheets(true);
    setImportResult(null);
    try {
      const response = await fetch(csvUrl);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const text = await response.text();
      const result = parseHRCsv(text);
      setImportResult(result);
      setSelectedFileName(`Google Sheets (${sheetId.substring(0, 8)}...)`);
    } catch {
      addToast({ type: 'error', title: t('employee.importFetchError') });
    } finally {
      setFetchingSheets(false);
    }
  }, [sheetsUrl, addToast, t]);

  const handleImport = useCallback(async () => {
    if (!importResult || importResult.employees.length === 0) return;

    setImporting(true);
    try {
      const count = await api.batchUpsertEmployees(importResult.employees);
      addToast({
        type: 'success',
        title: t('employee.importSuccess', { count }),
      });
      onOpenChange(false);
      setImportResult(null);
      setSelectedFileName('');
      if (fileInputRef.current) fileInputRef.current.value = '';
      onImportComplete();
    } catch {
      addToast({ type: 'error', title: t('employee.importError') });
    } finally {
      setImporting(false);
    }
  }, [importResult, addToast, t, onOpenChange, onImportComplete]);

  const handleClose = useCallback((openState: boolean) => {
    if (!openState) {
      setImportResult(null);
      setSelectedFileName('');
      setSheetsUrl('');
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
    onOpenChange(openState);
  }, [onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{t('employee.importTitle')}</DialogTitle>
          <DialogDescription>{t('employee.importDesc')}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <Tabs defaultValue="sheets" onValueChange={() => setImportResult(null)}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="sheets">
                <Globe className="h-4 w-4 mr-2" />
                Google Sheets
              </TabsTrigger>
              <TabsTrigger value="file">
                <Upload className="h-4 w-4 mr-2" />
                {t('employee.importSelectFile')}
              </TabsTrigger>
            </TabsList>

            {/* Google Sheets Tab */}
            <TabsContent value="sheets" className="space-y-3">
              <p className="text-xs text-muted-foreground">
                {t('employee.importSheetsHelp')}
              </p>
              <div className="flex gap-2">
                <Input
                  placeholder="https://docs.google.com/spreadsheets/d/..."
                  value={sheetsUrl}
                  onChange={(e) => setSheetsUrl(e.target.value)}
                  disabled={fetchingSheets || importing}
                  className="flex-1"
                />
                <Button
                  onClick={handleFetchSheets}
                  disabled={!sheetsUrl.trim() || fetchingSheets || importing}
                  size="default"
                >
                  {fetchingSheets ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    t('employee.importFetch')
                  )}
                </Button>
              </div>
            </TabsContent>

            {/* File Upload Tab */}
            <TabsContent value="file" className="space-y-3">
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={importing}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  {t('employee.importSelectFile')}
                </Button>
                {selectedFileName && !sheetsUrl && (
                  <span className="text-sm text-muted-foreground truncate max-w-[250px]">
                    {selectedFileName}
                  </span>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  className="hidden"
                  onChange={handleFileSelect}
                />
              </div>
            </TabsContent>
          </Tabs>

          {/* Parse Results (shared between tabs) */}
          {importResult && (
            <>
              {/* Stats */}
              <div className="space-y-2 rounded-md border p-3">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <span className="text-sm font-medium">
                    {t('employee.importStats', { count: importResult.stats.success })}
                  </span>
                </div>
                <div className="flex gap-4 text-sm text-muted-foreground ml-6">
                  <span>{t('employee.importActive', { count: importResult.stats.active })}</span>
                  <span>{t('employee.importInactive', { count: importResult.stats.inactive })}</span>
                </div>
                {importResult.warnings.length > 0 && (
                  <div className="flex items-center gap-2 ml-6">
                    <AlertTriangle className="h-3.5 w-3.5 text-yellow-500" />
                    <span className="text-sm text-yellow-600">
                      {t('employee.importWarning', { count: importResult.warnings.length })}
                    </span>
                  </div>
                )}
                {importResult.errors.length > 0 && (
                  <div className="flex items-center gap-2 ml-6">
                    <AlertTriangle className="h-3.5 w-3.5 text-red-500" />
                    <span className="text-sm text-red-600">
                      {t('employee.importErrors', { count: importResult.errors.length })}
                    </span>
                  </div>
                )}
              </div>

              {/* Preview Table */}
              {importResult.employees.length > 0 && (
                <div>
                  <p className="text-sm font-medium mb-2">{t('employee.importPreview')}</p>
                  <div className="rounded-md border overflow-auto max-h-[200px]">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-xs">{t('employee.id')}</TableHead>
                          <TableHead className="text-xs">{t('employee.name')}</TableHead>
                          <TableHead className="text-xs">{t('employee.building')}</TableHead>
                          <TableHead className="text-xs">{t('employee.position')}</TableHead>
                          <TableHead className="text-xs">{t('common.status')}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {importResult.employees.slice(0, 5).map((emp) => (
                          <TableRow key={emp.employee_id}>
                            <TableCell className="text-xs font-mono">{emp.employee_id}</TableCell>
                            <TableCell className="text-xs">{emp.employee_name}</TableCell>
                            <TableCell className="text-xs">{emp.building}</TableCell>
                            <TableCell className="text-xs">{emp.position}</TableCell>
                            <TableCell className="text-xs">
                              <Badge variant={emp.status === 'ACTIVE' ? 'success' : 'inactive'} className="text-[10px]">
                                {emp.status}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => handleClose(false)} disabled={importing}>
            {t('common.cancel')}
          </Button>
          <Button
            onClick={handleImport}
            disabled={!importResult || importResult.employees.length === 0 || importing}
          >
            {importing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {t('employee.importing')}
              </>
            ) : (
              t('employee.importButton')
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
