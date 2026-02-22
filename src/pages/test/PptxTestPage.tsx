/**
 * PPTX Report Generation Test Page
 *
 * Generates PPTX reports directly in the browser using pptxgenjs.
 * Uses sample/real data from Firestore for testing.
 */

import { useState } from 'react';
import { FileDown, Loader2, TestTube2 } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { generatePptxReport, type PptxReportInput } from '@/utils/pptxGenerator';

// Sample data for testing
const SAMPLE_INPUT: PptxReportInput = {
  period: '2026-02',
  kpi: {
    period: '2026-02',
    overallCompletionRate: 87.5,
    passRate: 92.3,
    firstTimePassRate: 85.1,
    averageScore: 78.4,
    retrainingCount: 12,
    expiringCount: 8,
    totalEmployees: 342,
    monthlyCompletions: 156,
  },
  monthlyTrends: [
    { month: '2025-09', completionRate: 82.1, passRate: 89.5, averageScore: 75.2, retrainingRate: 5.3 },
    { month: '2025-10', completionRate: 83.4, passRate: 90.1, averageScore: 76.0, retrainingRate: 4.8 },
    { month: '2025-11', completionRate: 84.7, passRate: 90.8, averageScore: 76.9, retrainingRate: 4.5 },
    { month: '2025-12', completionRate: 85.2, passRate: 91.2, averageScore: 77.3, retrainingRate: 4.2 },
    { month: '2026-01', completionRate: 86.8, passRate: 91.9, averageScore: 77.8, retrainingRate: 3.9 },
    { month: '2026-02', completionRate: 87.5, passRate: 92.3, averageScore: 78.4, retrainingRate: 3.5 },
  ],
  gradeDistribution: [
    { grade: 'AA', count: 89, percentage: 26.0 },
    { grade: 'A', count: 145, percentage: 42.4 },
    { grade: 'B', count: 78, percentage: 22.8 },
    { grade: 'C', count: 30, percentage: 8.8 },
  ],
  capaSummary: {
    total: 24,
    open: 8,
    closed: 14,
    overdue: 2,
  },
  recommendations: [
    'Focus retraining on Building A, Line 3 — highest defect concentration',
    'Schedule refresher courses for 8 employees with expiring certifications',
    'Investigate root cause of surface defect increase in January (+15%)',
    'Consider additional TQC training for inspectors with >5% reject rate',
    'Standardize training materials across all buildings for consistency',
  ],
};

export default function PptxTestPage() {
  // useTranslation will be added when i18n keys are ready
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [period, setPeriod] = useState('2026-02');
  const [sections, setSections] = useState({
    kpi: true,
    trends: true,
    grades: true,
    capa: true,
    recommendations: true,
  });

  const handleGenerate = async () => {
    setIsGenerating(true);
    setError(null);
    setSuccess(false);

    try {
      const input: PptxReportInput = {
        ...SAMPLE_INPUT,
        period,
        monthlyTrends: sections.trends ? SAMPLE_INPUT.monthlyTrends : undefined,
        gradeDistribution: sections.grades ? SAMPLE_INPUT.gradeDistribution : undefined,
        capaSummary: sections.capa ? SAMPLE_INPUT.capaSummary : undefined,
        recommendations: sections.recommendations ? SAMPLE_INPUT.recommendations : undefined,
      };

      await generatePptxReport(input);
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate PPTX');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <TestTube2 className="h-6 w-6" />
          PPTX Report Generator Test
        </h1>
        <p className="text-muted-foreground">
          Generate PowerPoint training reports directly in your browser
        </p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert>
          <AlertDescription className="text-green-700">
            PPTX file downloaded successfully!
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {/* Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Report Settings</CardTitle>
            <CardDescription>Configure which sections to include</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="period">Report Period</Label>
              <Input
                id="period"
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                placeholder="YYYY-MM"
              />
            </div>

            <div className="space-y-3">
              <Label>Included Sections</Label>
              {Object.entries(sections).map(([key, value]) => (
                <div key={key} className="flex items-center space-x-2">
                  <Checkbox
                    id={key}
                    checked={value}
                    onCheckedChange={(checked) =>
                      setSections((prev) => ({ ...prev, [key]: !!checked }))
                    }
                  />
                  <label htmlFor={key} className="text-sm capitalize cursor-pointer">
                    {key === 'kpi' ? 'KPI Summary' :
                     key === 'trends' ? 'Monthly Trends' :
                     key === 'grades' ? 'Grade Distribution' :
                     key === 'capa' ? 'CAPA Summary' :
                     'Recommendations'}
                  </label>
                </div>
              ))}
            </div>

            <Button
              onClick={handleGenerate}
              disabled={isGenerating}
              className="w-full"
              size="lg"
            >
              {isGenerating ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <FileDown className="h-4 w-4 mr-2" />
              )}
              {isGenerating ? 'Generating...' : 'Generate PPTX Report'}
            </Button>
          </CardContent>
        </Card>

        {/* Preview / Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Slide Preview</CardTitle>
            <CardDescription>Slides that will be generated</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center gap-2 p-2 rounded bg-blue-50 dark:bg-blue-950">
                <span className="text-xs font-mono text-blue-600 w-6">1</span>
                <span className="text-sm">Title Slide — Q-TRAIN Report, {period}</span>
              </div>
              {sections.kpi && (
                <div className="flex items-center gap-2 p-2 rounded bg-gray-50 dark:bg-gray-900">
                  <span className="text-xs font-mono text-gray-500 w-6">2</span>
                  <span className="text-sm">KPI Summary — 8 key metrics</span>
                </div>
              )}
              {sections.trends && (
                <div className="flex items-center gap-2 p-2 rounded bg-gray-50 dark:bg-gray-900">
                  <span className="text-xs font-mono text-gray-500 w-6">3</span>
                  <span className="text-sm">Monthly Trends — 6 months table</span>
                </div>
              )}
              {sections.grades && (
                <div className="flex items-center gap-2 p-2 rounded bg-gray-50 dark:bg-gray-900">
                  <span className="text-xs font-mono text-gray-500 w-6">4</span>
                  <span className="text-sm">Grade Distribution — AA/A/B/C</span>
                </div>
              )}
              {sections.capa && (
                <div className="flex items-center gap-2 p-2 rounded bg-gray-50 dark:bg-gray-900">
                  <span className="text-xs font-mono text-gray-500 w-6">5</span>
                  <span className="text-sm">CAPA Summary — Status overview</span>
                </div>
              )}
              {sections.recommendations && (
                <div className="flex items-center gap-2 p-2 rounded bg-gray-50 dark:bg-gray-900">
                  <span className="text-xs font-mono text-gray-500 w-6">6</span>
                  <span className="text-sm">Recommendations — Action items</span>
                </div>
              )}
            </div>

            <div className="mt-4 p-3 rounded border text-xs text-muted-foreground">
              <p className="font-medium mb-1">How it works:</p>
              <ul className="list-disc list-inside space-y-0.5">
                <li>Uses <code>pptxgenjs</code> library (browser-side)</li>
                <li>No server/Cloud Function required</li>
                <li>Currently uses sample data for testing</li>
                <li>Production version will pull from Firestore</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
