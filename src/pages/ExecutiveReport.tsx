/**
 * Executive Report Page
 *
 * AI-powered monthly quality & training report generation.
 */

import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Loader2,
  FileText,
  Clipboard,
  Printer,
  RefreshCw,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { generateExecutiveReport } from '@/services/api';

export default function ExecutiveReport() {
  const { t, i18n } = useTranslation();
  const { toast } = useToast();

  // Form state
  const now = new Date();
  const defaultPeriod = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const [period, setPeriod] = useState(defaultPeriod);
  const [language, setLanguage] = useState<'ko' | 'en' | 'vi'>(
    (i18n.language?.substring(0, 2) as 'ko' | 'en' | 'vi') || 'en'
  );
  const [sections, setSections] = useState({
    includeKPI: true,
    includeCAPA: true,
    includeTQC: true,
    include5PRS: false,
    includeTraining: true,
  });

  // Result state
  const [isLoading, setIsLoading] = useState(false);
  const [report, setReport] = useState('');
  const [provider, setProvider] = useState('');
  const [copied, setCopied] = useState(false);
  const copiedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (copiedTimerRef.current) clearTimeout(copiedTimerRef.current);
    };
  }, []);

  const handleGenerate = async () => {
    setIsLoading(true);
    setReport('');

    try {
      const result = await generateExecutiveReport({
        period,
        language,
        sections,
      });

      if (result.success && result.report) {
        setReport(result.report);
        setProvider(result.provider || '');
      } else {
        throw new Error(result.error || 'Failed to generate report');
      }
    } catch (err) {
      toast({
        title: t('common.error'),
        description: err instanceof Error ? err.message : t('executiveReport.generateFailed', 'Report generation failed'),
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!report) return;
    await navigator.clipboard.writeText(report);
    setCopied(true);
    if (copiedTimerRef.current) clearTimeout(copiedTimerRef.current);
    copiedTimerRef.current = setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  const toggleSection = (key: keyof typeof sections) => {
    setSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const renderMarkdown = (text: string) => {
    return text.split('\n').map((line, i) => {
      // Headers
      if (line.startsWith('# ')) {
        return <h1 key={i} className="text-2xl font-bold mt-6 mb-3">{line.slice(2)}</h1>;
      }
      if (line.startsWith('## ')) {
        return <h2 key={i} className="text-xl font-semibold mt-5 mb-2">{line.slice(3)}</h2>;
      }
      if (line.startsWith('### ')) {
        return <h3 key={i} className="text-lg font-medium mt-4 mb-2">{line.slice(4)}</h3>;
      }
      // Bullet points
      if (line.startsWith('- ') || line.startsWith('* ')) {
        const content = line.slice(2);
        const parts = content.split(/\*\*(.+?)\*\*/g);
        return (
          <li key={i} className="ml-6 my-0.5 list-disc text-sm">
            {parts.map((part, j) =>
              j % 2 === 1 ? <strong key={j}>{part}</strong> : part
            )}
          </li>
        );
      }
      // Bold text in paragraphs
      if (line.trim()) {
        const parts = line.split(/\*\*(.+?)\*\*/g);
        return (
          <p key={i} className="my-1 text-sm">
            {parts.map((part, j) =>
              j % 2 === 1 ? <strong key={j}>{part}</strong> : part
            )}
          </p>
        );
      }
      return <br key={i} />;
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <FileText className="h-6 w-6" />
          {t('executiveReport.title')}
        </h1>
        <p className="text-muted-foreground">
          {t('executiveReport.description')}
        </p>
      </div>

      {/* Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {t('executiveReport.configuration')}
          </CardTitle>
          <CardDescription>
            {t('executiveReport.configDesc')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-3">
            {/* Period */}
            <div className="space-y-2">
              <Label>{t('executiveReport.period')}</Label>
              <input
                type="month"
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
            </div>

            {/* Language */}
            <div className="space-y-2">
              <Label>{t('executiveReport.language')}</Label>
              <Select value={language} onValueChange={(v) => setLanguage(v as 'ko' | 'en' | 'vi')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ko">한국어 (Korean)</SelectItem>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="vi">Tiếng Việt (Vietnamese)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Sections */}
            <div className="space-y-2">
              <Label>{t('executiveReport.sections')}</Label>
              <div className="space-y-2">
                {[
                  { key: 'includeKPI' as const, labelKey: 'executiveReport.sectionKPI', fallback: 'KPI Performance' },
                  { key: 'includeTraining' as const, labelKey: 'executiveReport.sectionTraining', fallback: 'Training Activities' },
                  { key: 'includeCAPA' as const, labelKey: 'executiveReport.sectionCAPA', fallback: 'CAPA Status' },
                  { key: 'includeTQC' as const, labelKey: 'executiveReport.sectionTQC', fallback: 'TQC New Employee' },
                  { key: 'include5PRS' as const, labelKey: 'executiveReport.section5PRS', fallback: '5PRS Inspection' },
                ].map((item) => (
                  <div key={item.key} className="flex items-center gap-2">
                    <Checkbox
                      id={item.key}
                      checked={sections[item.key]}
                      onCheckedChange={() => toggleSection(item.key)}
                    />
                    <Label htmlFor={item.key} className="text-sm font-normal cursor-pointer">
                      {t(item.labelKey, item.fallback)}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-6 flex gap-2">
            <Button onClick={handleGenerate} disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  {t('executiveReport.generating')}
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  {t('executiveReport.generate')}
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Report Display */}
      {(report || isLoading) && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base">
                {t('executiveReport.reportTitle')}
              </CardTitle>
              {provider && (
                <CardDescription>Powered by {provider}</CardDescription>
              )}
            </div>
            {report && (
              <div className="flex gap-2 print:hidden">
                <Button variant="outline" size="sm" onClick={handleCopy}>
                  <Clipboard className="h-4 w-4 mr-1" />
                  {copied ? t('common.copied') : t('common.copy')}
                </Button>
                <Button variant="outline" size="sm" onClick={handlePrint}>
                  <Printer className="h-4 w-4 mr-1" />
                  {t('common.print')}
                </Button>
              </div>
            )}
          </CardHeader>
          <CardContent>
            {isLoading && (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary mr-3" />
                <span className="text-muted-foreground">
                  {t('executiveReport.generatingReport')}
                </span>
              </div>
            )}
            {!isLoading && report && (
              <div className="prose prose-sm max-w-none dark:prose-invert">
                {renderMarkdown(report)}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
