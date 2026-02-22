import { useTranslation } from 'react-i18next';
import {
  BookOpen,
  UserPlus,
  Factory,
  TrendingUp,
  Search,
  Target,
  ArrowRight,
  CheckCircle2,
  XCircle,
  AlertTriangle,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const GRADE_TABLE = [
  { grade: 'AA', rate: '100%', result: 'pass' },
  { grade: 'A', rate: '95%+', result: 'pass' },
  { grade: 'B', rate: '85%+', result: 'pass' },
  { grade: 'PASS', rate: '80%+', result: 'pass' },
  { grade: 'FAIL', rate: '< 80%', result: 'fail' },
];

const PROCESS_STEPS = [1, 2, 3, 4, 5];

export default function ProgramIntro() {
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <BookOpen className="h-6 w-6" />
          {t('programIntro.title')}
        </h1>
        <p className="text-muted-foreground mt-1">{t('programIntro.subtitle')}</p>
      </div>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">{t('programIntro.tabs.overview')}</TabsTrigger>
          <TabsTrigger value="inspection">{t('programIntro.tabs.inspection')}</TabsTrigger>
        </TabsList>

        {/* Tab 1: Overview */}
        <TabsContent value="overview" className="space-y-4 mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            <ProgramCard
              icon={<BookOpen className="h-8 w-8 text-blue-600" />}
              title={t('programIntro.overview.qip.title')}
              count={t('programIntro.overview.qip.count')}
              desc={t('programIntro.overview.qip.desc')}
              target={t('programIntro.overview.qip.target')}
              evalType={t('programIntro.overview.qip.evalType')}
              color="border-blue-200 bg-blue-50/50"
            />
            <ProgramCard
              icon={<UserPlus className="h-8 w-8 text-green-600" />}
              title={t('programIntro.overview.newEmployee.title')}
              desc={t('programIntro.overview.newEmployee.desc')}
              target={t('programIntro.overview.newEmployee.target')}
              evalType={t('programIntro.overview.newEmployee.evalType')}
              color="border-green-200 bg-green-50/50"
            />
            <ProgramCard
              icon={<Factory className="h-8 w-8 text-orange-600" />}
              title={t('programIntro.overview.production.title')}
              desc={t('programIntro.overview.production.desc')}
              target={t('programIntro.overview.production.target')}
              evalType={t('programIntro.overview.production.evalType')}
              color="border-orange-200 bg-orange-50/50"
            />
            <ProgramCard
              icon={<TrendingUp className="h-8 w-8 text-purple-600" />}
              title={t('programIntro.overview.promotion.title')}
              desc={t('programIntro.overview.promotion.desc')}
              target={t('programIntro.overview.promotion.target')}
              evalType={t('programIntro.overview.promotion.evalType')}
              color="border-purple-200 bg-purple-50/50"
            />
            <ProgramCard
              icon={<Search className="h-8 w-8 text-red-600" />}
              title={t('programIntro.overview.inspection.title')}
              badge={t('programIntro.overview.inspection.badge')}
              desc={t('programIntro.overview.inspection.desc')}
              target={t('programIntro.overview.inspection.target')}
              evalType={t('programIntro.overview.inspection.evalType')}
              color="border-red-200 bg-red-50/50"
            />
          </div>
        </TabsContent>

        {/* Tab 2: Inspection Detail */}
        <TabsContent value="inspection" className="space-y-6 mt-4">
          {/* Purpose */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                {t('programIntro.inspectionDetail.purpose.title')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground leading-relaxed">
                {t('programIntro.inspectionDetail.purpose.desc')}
              </p>
            </CardContent>
          </Card>

          {/* Selection Criteria */}
          <Card>
            <CardHeader>
              <CardTitle>{t('programIntro.inspectionDetail.criteria.title')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="rounded-lg border p-4 bg-blue-50/50">
                  <h4 className="font-semibold text-blue-800 mb-2">
                    {t('programIntro.inspectionDetail.criteria.autoEnroll')}
                  </h4>
                  <ul className="space-y-1 text-sm text-blue-700">
                    <li className="flex items-center gap-2">
                      <ArrowRight className="h-3 w-3" />
                      {t('programIntro.inspectionDetail.criteria.fivePrs')}
                    </li>
                    <li className="flex items-center gap-2">
                      <ArrowRight className="h-3 w-3" />
                      {t('programIntro.inspectionDetail.criteria.aql')}
                    </li>
                  </ul>
                </div>
                <div className="rounded-lg border p-4 bg-gray-50">
                  <h4 className="font-semibold text-gray-800 mb-2">
                    {t('programIntro.inspectionDetail.criteria.manualEnroll')}
                  </h4>
                  <p className="text-sm text-gray-600">
                    {t('programIntro.inspectionDetail.criteria.manual')}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Process Steps */}
          <Card>
            <CardHeader>
              <CardTitle>{t('programIntro.inspectionDetail.process.title')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                {PROCESS_STEPS.map((step) => (
                  <div key={step} className="text-center">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-2">
                      <span className="text-lg font-bold text-primary">{step}</span>
                    </div>
                    <h4 className="font-semibold text-sm">
                      {t(`programIntro.inspectionDetail.process.step${step}`)}
                    </h4>
                    <p className="text-xs text-muted-foreground mt-1">
                      {t(`programIntro.inspectionDetail.process.step${step}Desc`)}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Grading Criteria */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>{t('programIntro.inspectionDetail.grading.title')}</CardTitle>
              </CardHeader>
              <CardContent>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="py-2 text-left">{t('programIntro.inspectionDetail.grading.grade')}</th>
                      <th className="py-2 text-left">{t('programIntro.inspectionDetail.grading.matchRate')}</th>
                      <th className="py-2 text-left">{t('programIntro.inspectionDetail.grading.result')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {GRADE_TABLE.map(({ grade, rate, result }) => (
                      <tr key={grade} className="border-b">
                        <td className="py-2 font-semibold">{grade}</td>
                        <td className="py-2">{rate}</td>
                        <td className="py-2">
                          {result === 'pass' ? (
                            <span className="text-green-600 flex items-center gap-1">
                              <CheckCircle2 className="h-4 w-4" />
                              {t('programIntro.inspectionDetail.grading.pass')}
                            </span>
                          ) : (
                            <span className="text-red-600 flex items-center gap-1">
                              <XCircle className="h-4 w-4" />
                              {t('programIntro.inspectionDetail.grading.fail')}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>

            {/* Strike Rule */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-yellow-600" />
                  {t('programIntro.inspectionDetail.strikeRule.title')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-yellow-50 border border-yellow-200">
                    <Badge variant="outline" className="mt-0.5">1</Badge>
                    <p className="text-sm">{t('programIntro.inspectionDetail.strikeRule.strike1')}</p>
                  </div>
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-orange-50 border border-orange-200">
                    <Badge variant="secondary" className="mt-0.5">2</Badge>
                    <p className="text-sm">{t('programIntro.inspectionDetail.strikeRule.strike2')}</p>
                  </div>
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-red-50 border border-red-200">
                    <Badge variant="destructive" className="mt-0.5">3</Badge>
                    <p className="text-sm font-semibold">{t('programIntro.inspectionDetail.strikeRule.strike3')}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function ProgramCard({
  icon,
  title,
  count,
  badge,
  desc,
  target,
  evalType,
  color,
}: {
  icon: React.ReactNode;
  title: string;
  count?: string;
  badge?: string;
  desc: string;
  target: string;
  evalType: string;
  color: string;
}) {
  return (
    <Card className={`${color} hover:shadow-md transition-shadow`}>
      <CardContent className="pt-6 space-y-3">
        <div className="flex items-start justify-between">
          {icon}
          {badge && <Badge variant="destructive" className="text-xs">{badge}</Badge>}
        </div>
        <div>
          <h3 className="font-bold text-lg">{title}</h3>
          {count && <p className="text-sm text-muted-foreground">{count}</p>}
        </div>
        <p className="text-sm text-muted-foreground">{desc}</p>
        <div className="text-xs space-y-1 pt-2 border-t">
          <p><span className="font-medium">Target:</span> {target}</p>
          <p><span className="font-medium">Eval:</span> {evalType}</p>
        </div>
      </CardContent>
    </Card>
  );
}
