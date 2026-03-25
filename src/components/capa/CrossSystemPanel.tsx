/**
 * CrossSystemPanel — CAPA Detail 내 연관 시스템 데이터 패널
 * OSC 검사 추이 + AQL 합격률을 이슈 등록일 기준 Before/After로 시각화
 */

import { useEffect, useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  BarChart, LineChart, Bar, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine, ReferenceArea, Legend,
} from 'recharts';
import { Activity, TrendingDown, TrendingUp, AlertTriangle, CheckCircle, Loader2 } from 'lucide-react';
import {
  fetchCrossSystemData,
  type CrossSystemData,
  type CrossQueryInput,
} from '@/services/crossSystemService';
import { logger } from '@/utils/logger';

interface CrossSystemPanelProps {
  model?: string;
  defectKey?: string;
  supplierId?: string;
  process?: string;
  issueDate: string;       // YYYY-MM-DD
  linkedSystems?: string[];
}

export function CrossSystemPanel({
  model,
  defectKey,
  supplierId,
  process,
  issueDate,
  linkedSystems = [],
}: CrossSystemPanelProps) {
  const { t } = useTranslation();
  const [data, setData] = useState<CrossSystemData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!model) return;

    const input: CrossQueryInput = {
      model,
      defectKey,
      supplierId,
      process,
      issueDate,
      beforeDays: 30,
      afterDays: 30,
    };

    setLoading(true);
    setError(null);

    fetchCrossSystemData(input)
      .then(result => {
        setData(result);
      })
      .catch(err => {
        logger.error('[CrossSystemPanel] fetch failed:', err);
        setError(t('capa.crossSystem.fetchError', 'Failed to load cross-system data'));
      })
      .finally(() => setLoading(false));
  }, [model, defectKey, supplierId, process, issueDate, t]);

  // Before/After 날짜 범위 계산
  const dateRange = useMemo(() => {
    const issue = new Date(issueDate);
    const beforeStart = new Date(issue);
    beforeStart.setDate(beforeStart.getDate() - 30);
    const afterEnd = new Date(issue);
    afterEnd.setDate(afterEnd.getDate() + 30);
    return {
      beforeStart: beforeStart.toISOString().split('T')[0],
      afterEnd: afterEnd.toISOString().split('T')[0],
    };
  }, [issueDate]);

  if (!model) {
    return null;
  }

  return (
    <Card className="mt-6">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">
              {t('capa.crossSystem.title', '연관 시스템 데이터')}
            </CardTitle>
          </div>
          <div className="flex gap-1">
            {linkedSystems.map(sys => (
              <Badge key={sys} variant="outline" className="text-xs">
                {sys}
              </Badge>
            ))}
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          {model} · {t('capa.crossSystem.issueDate', '이슈 등록일')}: {issueDate}
        </p>
      </CardHeader>
      <CardContent>
        {loading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            <span className="ml-2 text-muted-foreground">
              {t('capa.crossSystem.loading', '크로스 시스템 데이터 조회 중...')}
            </span>
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 py-8 justify-center text-destructive">
            <AlertTriangle className="h-5 w-5" />
            <span>{error}</span>
          </div>
        )}

        {!loading && !error && !data && (
          <div className="text-center py-12 text-muted-foreground">
            <Activity className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p className="font-medium">
              {t('capa.crossSystem.pending', 'QOS Cross-Query API 연동 대기 중')}
            </p>
            <p className="text-sm mt-1">
              {t('capa.crossSystem.pendingDesc', 'Phase 0 배포 후 OSC/AQL 데이터가 자동으로 연계됩니다')}
            </p>
            <div className="mt-4 p-4 bg-muted/50 rounded-lg text-left max-w-md mx-auto">
              <p className="text-xs font-medium mb-2">
                {t('capa.crossSystem.willShow', '연동 후 표시될 항목:')}
              </p>
              <ul className="text-xs space-y-1">
                <li>📊 OSC {t('capa.crossSystem.inspectionTrend', '검사 추이')} (Before/After)</li>
                <li>📊 OSC {t('capa.crossSystem.defectRateTrend', '불량률 추이')} (Before/After)</li>
                <li>📊 AQL {t('capa.crossSystem.passRateTrend', '합격률 추이')} (Before/After)</li>
                <li>📋 {t('capa.crossSystem.recentRejects', '최근 리젝 이력')}</li>
                <li>📷 {t('capa.crossSystem.defectPhotos', '불량 사진 갤러리')}</li>
              </ul>
            </div>
          </div>
        )}

        {!loading && !error && data && (
          <div className="space-y-6">
            {/* Before/After 비교 카드 */}
            <BeforeAfterSummary data={data} issueDate={issueDate} />

            {/* OSC 검사 추이 차트 */}
            {linkedSystems.includes('OSC') && data.osc.dailyTrend.length > 0 && (
              <OscTrendChart
                dailyTrend={data.osc.dailyTrend}
                issueDate={issueDate}
                dateRange={dateRange}
              />
            )}

            {/* AQL 합격률 차트 */}
            {linkedSystems.includes('AQL') && data.aql.dailyTrend.length > 0 && (
              <AqlTrendChart
                dailyTrend={data.aql.dailyTrend}
                issueDate={issueDate}
                dateRange={dateRange}
              />
            )}

            {/* 최근 검사 이력 테이블 */}
            {data.osc.inspections.length > 0 && (
              <RecentInspections inspections={data.osc.inspections} issueDate={issueDate} />
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Before/After 비교 요약 카드 ────────────────────────

function BeforeAfterSummary({ data, issueDate }: { data: CrossSystemData; issueDate: string }) {
  const { t } = useTranslation();
  const imp = data.improvement;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* OSC 불량률 */}
      <Card className="border-l-4 border-l-blue-500">
        <CardContent className="pt-4 pb-3">
          <p className="text-xs text-muted-foreground font-medium">
            OSC {t('capa.crossSystem.defectRate', '불량률')}
          </p>
          <div className="flex items-center gap-3 mt-2">
            <div className="text-center">
              <p className="text-xs text-muted-foreground">Before</p>
              <p className="text-lg font-bold text-orange-600">
                {data.osc.before.defectRate.toFixed(1)}%
              </p>
            </div>
            <div className="text-2xl text-muted-foreground">→</div>
            <div className="text-center">
              <p className="text-xs text-muted-foreground">After</p>
              <p className="text-lg font-bold text-blue-600">
                {data.osc.after.defectRate.toFixed(1)}%
              </p>
            </div>
            <div className="ml-auto">
              {imp.oscDefectRateChange < 0 ? (
                <Badge className="bg-green-100 text-green-800 flex items-center gap-1">
                  <TrendingDown className="h-3 w-3" />
                  {Math.abs(imp.oscDefectRateChangePercent).toFixed(0)}%↓
                </Badge>
              ) : imp.oscDefectRateChange > 0 ? (
                <Badge className="bg-red-100 text-red-800 flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" />
                  {Math.abs(imp.oscDefectRateChangePercent).toFixed(0)}%↑
                </Badge>
              ) : (
                <Badge variant="secondary">—</Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* AQL 합격률 */}
      <Card className="border-l-4 border-l-green-500">
        <CardContent className="pt-4 pb-3">
          <p className="text-xs text-muted-foreground font-medium">
            AQL {t('capa.crossSystem.passRate', '합격률')}
          </p>
          <div className="flex items-center gap-3 mt-2">
            <div className="text-center">
              <p className="text-xs text-muted-foreground">Before</p>
              <p className="text-lg font-bold text-orange-600">
                {data.aql.before.passRate.toFixed(1)}%
              </p>
            </div>
            <div className="text-2xl text-muted-foreground">→</div>
            <div className="text-center">
              <p className="text-xs text-muted-foreground">After</p>
              <p className="text-lg font-bold text-blue-600">
                {data.aql.after.passRate.toFixed(1)}%
              </p>
            </div>
            <div className="ml-auto">
              {imp.aqlPassRateChange > 0 ? (
                <Badge className="bg-green-100 text-green-800 flex items-center gap-1">
                  <CheckCircle className="h-3 w-3" />
                  +{imp.aqlPassRateChange.toFixed(1)}%p
                </Badge>
              ) : imp.aqlPassRateChange < 0 ? (
                <Badge className="bg-red-100 text-red-800 flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  {imp.aqlPassRateChange.toFixed(1)}%p
                </Badge>
              ) : (
                <Badge variant="secondary">—</Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 이슈 등록일 */}
      <Card className="border-l-4 border-l-red-500">
        <CardContent className="pt-4 pb-3">
          <p className="text-xs text-muted-foreground font-medium">
            {t('capa.crossSystem.issueDateLabel', '이슈 등록일')}
          </p>
          <p className="text-lg font-bold mt-2">{issueDate}</p>
          <div className="flex gap-4 mt-1 text-xs text-muted-foreground">
            <span>Before: {data.osc.before.totalInspections}건</span>
            <span>After: {data.osc.after.totalInspections}건</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── OSC 검사 추이 차트 (Before/After) ────────────────────

function OscTrendChart({
  dailyTrend,
  issueDate,
  dateRange,
}: {
  dailyTrend: { date: string; defectRate: number; specificDefectCount: number; period: string }[];
  issueDate: string;
  dateRange: { beforeStart: string; afterEnd: string };
}) {
  const { t } = useTranslation();

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">
          📊 OSC {t('capa.crossSystem.defectRateTrend', '불량률 추이')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={dailyTrend} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="date" tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 10 }} unit="%" />
            <Tooltip
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              formatter={((value: any, name: any) => [
                `${Number(value).toFixed(1)}%`,
                name === 'defectRate' ? t('capa.crossSystem.defectRate', '불량률') : name,
              ]) as never}
              labelFormatter={(label: string) => {
                const period = label < issueDate ? 'Before' : 'After';
                return `${label} (${period})`;
              }}
            />
            <Legend />

            {/* Before 영역 배경 (연한 주황) */}
            <ReferenceArea
              x1={dateRange.beforeStart}
              x2={issueDate}
              fill="#FFF3E0"
              fillOpacity={0.4}
              label={{ value: 'BEFORE', position: 'insideTopLeft', fontSize: 10, fill: '#E65100' }}
            />

            {/* After 영역 배경 (연한 파랑) */}
            <ReferenceArea
              x1={issueDate}
              x2={dateRange.afterEnd}
              fill="#E3F2FD"
              fillOpacity={0.4}
              label={{ value: 'AFTER', position: 'insideTopRight', fontSize: 10, fill: '#1565C0' }}
            />

            {/* 이슈 등록일 수직선 (빨간 점선) */}
            <ReferenceLine
              x={issueDate}
              stroke="#D32F2F"
              strokeDasharray="5 5"
              strokeWidth={2}
              label={{
                value: `⚠ ${t('capa.crossSystem.issueRegistered', '이슈 등록')}`,
                position: 'top',
                fontSize: 11,
                fill: '#D32F2F',
                fontWeight: 'bold',
              }}
            />

            <Line
              type="monotone"
              dataKey="defectRate"
              name={t('capa.crossSystem.defectRate', '불량률')}
              stroke="#1976D2"
              strokeWidth={2}
              dot={{ fill: '#1976D2', r: 3 }}
              activeDot={{ r: 5 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

// ─── AQL 합격률 차트 (Before/After) ────────────────────

function AqlTrendChart({
  dailyTrend,
  issueDate,
  dateRange,
}: {
  dailyTrend: { date: string; passRate: number; period: string }[];
  issueDate: string;
  dateRange: { beforeStart: string; afterEnd: string };
}) {
  const { t } = useTranslation();

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">
          📊 AQL {t('capa.crossSystem.passRateTrend', '합격률 추이')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={dailyTrend} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="date" tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 10 }} unit="%" domain={[0, 100]} />
            <Tooltip
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              formatter={((value: any) => [`${Number(value).toFixed(1)}%`, t('capa.crossSystem.passRate', '합격률')]) as never}
              labelFormatter={(label: string) => {
                const period = label < issueDate ? 'Before' : 'After';
                return `${label} (${period})`;
              }}
            />

            <ReferenceArea x1={dateRange.beforeStart} x2={issueDate} fill="#FFF3E0" fillOpacity={0.3} />
            <ReferenceArea x1={issueDate} x2={dateRange.afterEnd} fill="#E8F5E9" fillOpacity={0.3} />

            <ReferenceLine
              x={issueDate}
              stroke="#D32F2F"
              strokeDasharray="5 5"
              strokeWidth={2}
              label={{ value: '⚠ 이슈 등록', position: 'top', fontSize: 11, fill: '#D32F2F', fontWeight: 'bold' }}
            />

            <Bar
              dataKey="passRate"
              name={t('capa.crossSystem.passRate', '합격률')}
              fill="#4CAF50"
              radius={[2, 2, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

// ─── 최근 검사 이력 테이블 ────────────────────

function RecentInspections({
  inspections,
  issueDate,
}: {
  inspections: { date: string; supplierId: string; part: string; process: string; inspectionQty: number; rejectQty: number; result: string; period: string }[];
  issueDate: string;
}) {
  const { t } = useTranslation();
  const recent = inspections.slice(0, 10);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">
          📋 OSC {t('capa.crossSystem.recentInspections', '최근 검사 이력')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-muted-foreground">
                <th className="text-left py-2 px-2">{t('common.date', '날짜')}</th>
                <th className="text-left py-2 px-2">Period</th>
                <th className="text-left py-2 px-2">{t('capa.crossSystem.supplier', '업체')}</th>
                <th className="text-left py-2 px-2">Part</th>
                <th className="text-left py-2 px-2">Process</th>
                <th className="text-right py-2 px-2">{t('capa.crossSystem.inspQty', '검사')}</th>
                <th className="text-right py-2 px-2">{t('capa.crossSystem.rejectQty', '불량')}</th>
                <th className="text-center py-2 px-2">{t('capa.crossSystem.result', '결과')}</th>
              </tr>
            </thead>
            <tbody>
              {recent.map((insp, i) => {
                const isBefore = insp.date < issueDate;
                return (
                  <tr
                    key={i}
                    className={`border-b ${isBefore ? 'bg-orange-50/50' : 'bg-blue-50/50'}`}
                  >
                    <td className="py-2 px-2 font-mono text-xs">{insp.date}</td>
                    <td className="py-2 px-2">
                      <Badge
                        variant="outline"
                        className={isBefore ? 'text-orange-700 border-orange-300 text-xs' : 'text-blue-700 border-blue-300 text-xs'}
                      >
                        {isBefore ? 'Before' : 'After'}
                      </Badge>
                    </td>
                    <td className="py-2 px-2">{insp.supplierId}</td>
                    <td className="py-2 px-2">{insp.part}</td>
                    <td className="py-2 px-2">{insp.process}</td>
                    <td className="py-2 px-2 text-right">{insp.inspectionQty}</td>
                    <td className="py-2 px-2 text-right font-medium text-red-600">{insp.rejectQty}</td>
                    <td className="py-2 px-2 text-center">
                      <Badge
                        className={insp.result === 'PASS' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}
                      >
                        {insp.result}
                      </Badge>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

export default CrossSystemPanel;
