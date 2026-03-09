import { useTranslation } from 'react-i18next';
import type { ProgramStats } from './types';
import { getScoreColor, renderStars } from './helpers';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  BarChart3,
  TrendingUp,
  ThumbsUp,
  Award,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface ProgramsTabProps {
  programStats: ProgramStats[];
  expandedProgram: string | null;
  onExpandedProgramChange: (programId: string | null) => void;
}

export function ProgramsTab({ programStats, expandedProgram, onExpandedProgramChange }: ProgramsTabProps) {
  const { t } = useTranslation();

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('evaluation.programAnalysis')}</CardTitle>
        <CardDescription>
          {t('evaluation.programAnalysisDesc')}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {programStats.map((program) => (
            <div key={program.programId} className="border rounded-lg">
              <div
                className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/50"
                onClick={() => onExpandedProgramChange(
                  expandedProgram === program.programId ? null : program.programId
                )}
              >
                <div className="flex items-center gap-4">
                  <div>
                    <p className="font-medium">{program.programName}</p>
                    <p className="text-sm text-muted-foreground">
                      {t('evaluation.evaluationCount', { count: program.totalEvaluations, rate: program.completionRate })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  {renderStars(program.averageScore)}
                  {expandedProgram === program.programId ? (
                    <ChevronUp className="h-5 w-5" />
                  ) : (
                    <ChevronDown className="h-5 w-5" />
                  )}
                </div>
              </div>
              {expandedProgram === program.programId && (
                <div className="border-t p-4 bg-muted/20">
                  <div className="grid gap-4 md:grid-cols-4">
                    <div className="text-center p-4 bg-background rounded-lg">
                      <ThumbsUp className="h-6 w-6 mx-auto text-blue-500 mb-2" />
                      <p className="text-sm text-muted-foreground">{t('evaluation.reaction')}</p>
                      <p className={`text-xl font-bold ${getScoreColor(program.reactionScore)}`}>
                        {program.reactionScore || '-'}
                      </p>
                    </div>
                    <div className="text-center p-4 bg-background rounded-lg">
                      <BarChart3 className="h-6 w-6 mx-auto text-green-500 mb-2" />
                      <p className="text-sm text-muted-foreground">{t('evaluation.learning')}</p>
                      <p className={`text-xl font-bold ${getScoreColor(program.learningScore)}`}>
                        {program.learningScore || '-'}
                      </p>
                    </div>
                    <div className="text-center p-4 bg-background rounded-lg">
                      <TrendingUp className="h-6 w-6 mx-auto text-yellow-500 mb-2" />
                      <p className="text-sm text-muted-foreground">{t('evaluation.behavior')}</p>
                      <p className={`text-xl font-bold ${getScoreColor(program.behaviorScore)}`}>
                        {program.behaviorScore || '-'}
                      </p>
                    </div>
                    <div className="text-center p-4 bg-background rounded-lg">
                      <Award className="h-6 w-6 mx-auto text-purple-500 mb-2" />
                      <p className="text-sm text-muted-foreground">{t('evaluation.results')}</p>
                      <p className={`text-xl font-bold ${getScoreColor(program.resultsScore)}`}>
                        {program.resultsScore || '-'}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
