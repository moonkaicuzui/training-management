/**
 * 엑셀 임포트 패널 - 파일 업로드, 미리보기, 업체 매칭, 임포트 실행
 */
import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Loader2, Upload } from 'lucide-react';
import { parseMetalShoeExcel } from '../../utils/metalShoeExcelParser';
import type { MetalShoeCase } from '../../types/metalShoe';

type ParsedCase = Omit<MetalShoeCase, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>;

interface ImportPreview {
  cases: ParsedCase[];
  errors: Array<{ row: number; message: string }>;
  unmatchedSuppliers: string[];
}

interface ExcelImportPanelProps {
  userId: string;
  userEmail: string;
  userName: string;
  createBulkCases: (
    cases: Array<ParsedCase & { status: 'registered'; createdBy: { uid: string; email: string; displayName: string } }>,
    user: { uid: string; email: string; displayName: string }
  ) => Promise<number>;
  onError: (msg: string) => void;
  onImportSuccess: (count: number) => void;
}

export default function ExcelImportPanel({
  userId,
  userEmail,
  userName,
  createBulkCases,
  onError,
  onImportSuccess,
}: ExcelImportPanelProps) {
  const { t } = useTranslation();
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importPreview, setImportPreview] = useState<ImportPreview | null>(null);
  const [importing, setImporting] = useState(false);

  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportFile(file);
    try {
      const buffer = await file.arrayBuffer();
      const result = parseMetalShoeExcel(buffer);
      setImportPreview(result);
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Failed to parse Excel');
    }
  }, [onError]);

  const handleImport = async () => {
    if (!importPreview) return;
    setImporting(true);
    try {
      const userInfo = { uid: userId, email: userEmail, displayName: userName };
      const count = await createBulkCases(
        importPreview.cases.map((c) => ({ ...c, status: 'registered' as const, createdBy: userInfo })),
        userInfo
      );
      onImportSuccess(count);
      setImportPreview(null);
      setImportFile(null);
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Import failed');
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6">
      <div className="mb-4">
        <p className="text-sm text-gray-600">
          {t('metalShoe.importDesc', 'Upload the existing Metal Found Shoe Excel file. The system will match supplier names to standard IDs.')}
        </p>
      </div>

      {/* File Upload */}
      <div className="mb-6">
        <label className="flex cursor-pointer flex-col items-center gap-2 rounded-lg border-2 border-dashed border-gray-300 p-8 hover:border-blue-400 hover:bg-blue-50">
          <Upload className="h-8 w-8 text-gray-400" />
          <span className="text-sm font-medium text-gray-600">
            {importFile ? importFile.name : t('metalShoe.dropExcel', 'Click to upload Excel file (.xlsx)')}
          </span>
          <input
            type="file"
            accept=".xlsx,.xls"
            onChange={handleFileChange}
            className="hidden"
          />
        </label>
      </div>

      {/* Preview */}
      {importPreview && (
        <div className="space-y-4">
          {/* Summary */}
          <div className="flex flex-wrap gap-3">
            <span className="rounded-full bg-blue-100 px-3 py-1 text-sm text-blue-700">
              {importPreview.cases.length} {t('metalShoe.casesFound', 'cases found')}
            </span>
            {importPreview.errors.length > 0 && (
              <span className="rounded-full bg-red-100 px-3 py-1 text-sm text-red-700">
                {importPreview.errors.length} {t('metalShoe.errors', 'errors')}
              </span>
            )}
            {importPreview.unmatchedSuppliers.length > 0 && (
              <span className="rounded-full bg-amber-100 px-3 py-1 text-sm text-amber-700">
                {importPreview.unmatchedSuppliers.length} {t('metalShoe.unmatchedSuppliers', 'unmatched suppliers')}
              </span>
            )}
          </div>

          {/* Unmatched Suppliers */}
          {importPreview.unmatchedSuppliers.length > 0 && (
            <div className="rounded-lg bg-amber-50 border border-amber-200 p-3">
              <p className="mb-1 text-xs font-medium text-amber-700">
                {t('metalShoe.unmatchedWarning', 'These supplier names could not be matched:')}
              </p>
              <div className="flex flex-wrap gap-1">
                {importPreview.unmatchedSuppliers.map((s) => (
                  <span key={s} className="rounded bg-amber-100 px-2 py-0.5 text-xs text-amber-800">{s}</span>
                ))}
              </div>
            </div>
          )}

          {/* Errors */}
          {importPreview.errors.length > 0 && (
            <div className="max-h-32 overflow-y-auto rounded-lg bg-red-50 border border-red-200 p-3">
              {importPreview.errors.map((err, i) => (
                <p key={i} className="text-xs text-red-700">Row {err.row}: {err.message}</p>
              ))}
            </div>
          )}

          {/* Preview Table */}
          {importPreview.cases.length > 0 && (
            <div className="max-h-64 overflow-auto rounded-lg border border-gray-200">
              <table className="w-full text-xs">
                <thead className="sticky top-0 bg-gray-50">
                  <tr>
                    <th className="px-2 py-1.5 text-left font-medium text-gray-500">Date</th>
                    <th className="px-2 py-1.5 text-left font-medium text-gray-500">Factory</th>
                    <th className="px-2 py-1.5 text-left font-medium text-gray-500">Model</th>
                    <th className="px-2 py-1.5 text-left font-medium text-gray-500">Supplier</th>
                    <th className="px-2 py-1.5 text-left font-medium text-gray-500">Component</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {importPreview.cases.slice(0, 20).map((c, i) => (
                    <tr key={i} className="hover:bg-gray-50">
                      <td className="px-2 py-1.5 text-gray-700">{c.detectionDate}</td>
                      <td className="px-2 py-1.5 text-gray-700">{c.factory}</td>
                      <td className="px-2 py-1.5 text-gray-700">{c.model}</td>
                      <td className="px-2 py-1.5">
                        <span className={c.supplierId === 'UNKNOWN' ? 'text-red-600 font-medium' : 'text-gray-700'}>
                          {c.supplierName}
                        </span>
                      </td>
                      <td className="px-2 py-1.5 text-gray-700">{c.component}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {importPreview.cases.length > 20 && (
                <p className="px-2 py-1 text-center text-xs text-gray-400">
                  ... {t('metalShoe.moreRows', 'and {{count}} more', { count: importPreview.cases.length - 20 })}
                </p>
              )}
            </div>
          )}

          {/* Import Button */}
          <div className="flex justify-end">
            <button
              onClick={handleImport}
              disabled={importing || importPreview.cases.length === 0}
              className="flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {importing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              {t('metalShoe.importCases', 'Import {{count}} Cases', { count: importPreview.cases.length })}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
