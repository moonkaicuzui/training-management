/**
 * CAPA AI Root Cause Suggestions Panel
 *
 * Displays AI-suggested root causes, corrective/preventive actions.
 * Supports adopt/reject feedback to the knowledge base.
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { BrainCircuit, Loader2, ThumbsUp, ThumbsDown, Sparkles, BookOpen, History } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { adoptSuggestion, rejectSuggestion, createKBEntry } from '@/services/capaKbService';

interface RootCauseSuggestion {
  cause: string;
  confidence: number;
  reasoning: string;
  source: 'ai' | 'kb' | 'historical';
  kb_id?: string;
}

interface ActionSuggestion {
  action: string;
  priority: string;
}

interface CAPAAISuggestionsProps {
  capaId: string;
  problemDescription: string;
  affectedArea: string;
  severity: 'critical' | 'major' | 'minor';
  source: string;
  language?: 'ko' | 'en' | 'vi';
  onSelectRootCause?: (cause: string) => void;
  onSelectActions?: (corrective: string[], preventive: string[]) => void;
}

const SOURCE_ICONS = {
  ai: Sparkles,
  kb: BookOpen,
  historical: History,
};

const SOURCE_COLORS = {
  ai: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
  kb: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
  historical: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300',
};

export function CAPAAISuggestions({
  capaId,
  problemDescription,
  affectedArea,
  severity,
  source,
  language = 'en',
  onSelectRootCause,
  onSelectActions,
}: CAPAAISuggestionsProps) {
  const { t } = useTranslation();
  const { toast } = useToast();

  const [isLoading, setIsLoading] = useState(false);
  const [rootCauses, setRootCauses] = useState<RootCauseSuggestion[]>([]);
  const [correctiveActions, setCorrectiveActions] = useState<ActionSuggestion[]>([]);
  const [preventiveActions, setPreventiveActions] = useState<ActionSuggestion[]>([]);
  const [provider, setProvider] = useState('');
  const [adoptedIds, setAdoptedIds] = useState<Set<number>>(new Set());
  const [rejectedIds, setRejectedIds] = useState<Set<number>>(new Set());

  const handleAnalyze = async () => {
    setIsLoading(true);
    setRootCauses([]);
    setCorrectiveActions([]);
    setPreventiveActions([]);
    setAdoptedIds(new Set());
    setRejectedIds(new Set());

    try {
      const response = await fetch('/api/ai/capa-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          problemDescription,
          affectedArea,
          severity,
          source,
          language,
        }),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || `HTTP ${response.status}`);
      }

      const data = await response.json();
      setRootCauses(data.suggestedRootCauses || []);
      setCorrectiveActions(data.suggestedCorrectiveActions || []);
      setPreventiveActions(data.suggestedPreventiveActions || []);
      setProvider(data.provider || '');
    } catch (err) {
      toast({
        title: t('common.error'),
        description: err instanceof Error ? err.message : 'AI analysis failed',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAdopt = async (index: number, suggestion: RootCauseSuggestion) => {
    // Fill root cause into parent form
    onSelectRootCause?.(suggestion.cause);

    // Fill corrective/preventive actions if available
    if (correctiveActions.length > 0 || preventiveActions.length > 0) {
      onSelectActions?.(
        correctiveActions.map((a) => a.action),
        preventiveActions.map((a) => a.action)
      );
    }

    // Update KB confidence
    if (suggestion.kb_id) {
      try {
        await adoptSuggestion(suggestion.kb_id);
      } catch {
        // Non-blocking
      }
    } else if (suggestion.source === 'ai') {
      // Create new KB entry from AI suggestion
      try {
        await createKBEntry({
          problem_category: '',
          problem_area: affectedArea,
          root_cause: suggestion.cause,
          corrective_actions: correctiveActions.map((a) => a.action),
          preventive_actions: preventiveActions.map((a) => a.action),
          source: 'ai',
          adoption_count: 1,
          rejection_count: 0,
          confidence_score: 50,
          related_capa_ids: [capaId],
          tags: affectedArea.toLowerCase().split(/[\s,]+/).filter(Boolean),
        });
      } catch {
        // Non-blocking
      }
    }

    setAdoptedIds((prev) => new Set(prev).add(index));
    toast({
      title: t('capa.rootCauseAdopted') || 'Root cause adopted',
      description: suggestion.cause.slice(0, 100),
    });
  };

  const handleReject = async (index: number, suggestion: RootCauseSuggestion) => {
    if (suggestion.kb_id) {
      try {
        await rejectSuggestion(suggestion.kb_id);
      } catch {
        // Non-blocking
      }
    }

    setRejectedIds((prev) => new Set(prev).add(index));
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return 'text-green-600';
    if (confidence >= 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'high':
        return <Badge variant="destructive">HIGH</Badge>;
      case 'medium':
        return <Badge variant="secondary">MEDIUM</Badge>;
      default:
        return <Badge variant="outline">LOW</Badge>;
    }
  };

  return (
    <Card className="border-purple-200 dark:border-purple-800">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <BrainCircuit className="h-5 w-5 text-purple-600" />
            {t('capa.aiAnalysis') || 'AI Root Cause Analysis'}
          </CardTitle>
          <Button
            onClick={handleAnalyze}
            disabled={isLoading || !problemDescription}
            size="sm"
            variant={rootCauses.length > 0 ? 'outline' : 'default'}
          >
            {isLoading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            {rootCauses.length > 0
              ? (t('capa.reanalyze') || 'Re-analyze')
              : (t('capa.requestAnalysis') || 'Request AI Analysis')}
          </Button>
        </div>
        {provider && (
          <p className="text-xs text-muted-foreground">
            Powered by {provider}
          </p>
        )}
      </CardHeader>

      <CardContent className="space-y-4">
        {isLoading && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-purple-600 mr-3" />
            <span className="text-sm text-muted-foreground">
              {t('capa.analyzing') || 'Analyzing root causes...'}
            </span>
          </div>
        )}

        {!isLoading && rootCauses.length === 0 && (
          <p className="text-center py-6 text-sm text-muted-foreground">
            {t('capa.aiHint') || 'Click "Request AI Analysis" to get root cause suggestions based on the problem description and historical data.'}
          </p>
        )}

        {/* Root Cause Suggestions */}
        {rootCauses.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium">{t('capa.suggestedRootCauses') || 'Suggested Root Causes'}</h4>
            {rootCauses.map((rc, i) => {
              const SourceIcon = SOURCE_ICONS[rc.source];
              const isAdopted = adoptedIds.has(i);
              const isRejected = rejectedIds.has(i);

              return (
                <div
                  key={i}
                  className={`p-3 rounded-lg border ${
                    isAdopted
                      ? 'border-green-300 bg-green-50 dark:bg-green-950 dark:border-green-800'
                      : isRejected
                        ? 'border-gray-200 bg-gray-50 dark:bg-gray-900 opacity-50'
                        : 'border-border'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-sm font-bold ${getConfidenceColor(rc.confidence)}`}>
                          {rc.confidence}%
                        </span>
                        <Badge className={`text-xs ${SOURCE_COLORS[rc.source]}`}>
                          <SourceIcon className="h-3 w-3 mr-1" />
                          {rc.source.toUpperCase()}
                        </Badge>
                      </div>
                      <p className="text-sm font-medium">{rc.cause}</p>
                      {rc.reasoning && (
                        <p className="text-xs text-muted-foreground mt-1">{rc.reasoning}</p>
                      )}
                    </div>
                    {!isAdopted && !isRejected && (
                      <div className="flex gap-1 flex-shrink-0">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0 text-green-600 hover:text-green-700 hover:bg-green-100"
                          onClick={() => handleAdopt(i, rc)}
                          title={t('capa.adopt') || 'Adopt'}
                        >
                          <ThumbsUp className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-100"
                          onClick={() => handleReject(i, rc)}
                          title={t('capa.reject') || 'Reject'}
                        >
                          <ThumbsDown className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                    {isAdopted && (
                      <Badge variant="outline" className="border-green-500 text-green-600">
                        {t('capa.adopted') || 'Adopted'}
                      </Badge>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Corrective Actions */}
        {correctiveActions.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium">{t('capa.suggestedCorrectiveActions') || 'Suggested Corrective Actions'}</h4>
            {correctiveActions.map((ca, i) => (
              <div key={i} className="flex items-center gap-2 p-2 rounded border text-sm">
                {getPriorityBadge(ca.priority)}
                <span>{ca.action}</span>
              </div>
            ))}
          </div>
        )}

        {/* Preventive Actions */}
        {preventiveActions.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium">{t('capa.suggestedPreventiveActions') || 'Suggested Preventive Actions'}</h4>
            {preventiveActions.map((pa, i) => (
              <div key={i} className="flex items-center gap-2 p-2 rounded border text-sm">
                {getPriorityBadge(pa.priority)}
                <span>{pa.action}</span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
