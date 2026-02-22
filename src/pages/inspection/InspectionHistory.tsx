import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import { History, Search, ChevronDown, ChevronUp, AlertTriangle, Calendar } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { InspectionPairGrid } from '@/components/inspection/InspectionPairGrid';
import { InspectionStrikeIndicator } from '@/components/inspection/InspectionStrikeIndicator';
import { useInspectionStore } from '@/stores/inspectionStore';
import type { InspectionResultDetail } from '@/types/inspection';

export default function InspectionHistory() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const {
    results,
    strikeMap,
    isLoadingResults,
    error,
    fetchResults,
    fetchResultsByEmployee,
    checkStrikes,
    clearError,
  } = useInspectionStore();

  const [searchTerm, setSearchTerm] = useState(searchParams.get('employee') || '');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  useEffect(() => {
    if (searchTerm) {
      fetchResultsByEmployee(searchTerm);
      checkStrikes(searchTerm);
    } else {
      fetchResults();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSearch = () => {
    if (searchTerm.trim()) {
      fetchResultsByEmployee(searchTerm.trim());
      checkStrikes(searchTerm.trim());
    } else {
      fetchResults();
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  const currentStrike = searchTerm ? strikeMap[searchTerm] : null;

  // Client-side date filtering
  const filteredResults = results.filter((r) => {
    if (dateFrom && r.training_date < dateFrom) return false;
    if (dateTo && r.training_date > dateTo) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <History className="h-6 w-6" />
          {t('inspection.history.title')}
        </h1>
      </div>

      {/* Error */}
      {error && (
        <Card className="border-destructive bg-destructive/10">
          <CardContent className="flex items-center justify-between py-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              <p className="text-destructive">{error}</p>
            </div>
            <Button variant="ghost" size="sm" onClick={clearError}>
              {t('common.dismiss')}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Search & Filters */}
      <div className="flex flex-wrap gap-3 items-end">
        <div className="flex-1 min-w-[200px] max-w-sm">
          <Label className="text-xs">{t('inspection.history.searchEmployee')}</Label>
          <Input
            placeholder={t('inspection.history.searchEmployee')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          />
        </div>
        <div>
          <Label className="text-xs flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {t('inspection.history.dateFrom')}
          </Label>
          <Input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="w-[160px]"
          />
        </div>
        <div>
          <Label className="text-xs">{t('inspection.history.dateTo')}</Label>
          <Input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="w-[160px]"
          />
        </div>
        <Button onClick={handleSearch}>
          <Search className="h-4 w-4 mr-2" />
          {t('common.search')}
        </Button>
        {(dateFrom || dateTo) && (
          <Button variant="ghost" size="sm" onClick={() => { setDateFrom(''); setDateTo(''); }}>
            {t('inspection.history.clearFilter')}
          </Button>
        )}
      </div>

      {/* Strike Info */}
      {currentStrike && currentStrike.consecutive_failures > 0 && (
        <Card className="border-yellow-300 bg-yellow-50">
          <CardContent className="py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <InspectionStrikeIndicator consecutiveFailures={currentStrike.consecutive_failures} />
              {currentStrike.requires_reassignment && (
                <Badge variant="destructive">{t('inspection.history.requiresReassignment')}</Badge>
              )}
            </div>
            <span className="text-sm text-muted-foreground">
              {t('inspection.history.consecutiveFailures')}: {currentStrike.consecutive_failures}
            </span>
          </CardContent>
        </Card>
      )}

      {/* Loading */}
      {isLoadingResults && (
        <div className="flex justify-center py-12">
          <div className="animate-spin h-8 w-8 border-b-2 border-primary rounded-full" />
        </div>
      )}

      {/* Results List */}
      {!isLoadingResults && (
        <Card>
          <CardContent className="pt-6">
            {filteredResults.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                {t('inspection.history.noHistory')}
              </p>
            ) : (
              <div className="space-y-3">
                {filteredResults.map((result) => (
                  <ResultRow
                    key={result.inspection_id}
                    result={result}
                    isExpanded={expandedId === result.inspection_id}
                    onToggle={() => toggleExpand(result.inspection_id)}
                    t={t}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function ResultRow({
  result,
  isExpanded,
  onToggle,
  t,
}: {
  result: InspectionResultDetail;
  isExpanded: boolean;
  onToggle: () => void;
  t: (key: string) => string;
}) {
  return (
    <div className="border rounded-lg overflow-hidden">
      <div
        className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/50"
        onClick={onToggle}
      >
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <p className="font-medium">{result.employee_id}</p>
            <span className="text-xs text-muted-foreground">{result.inspection_id}</span>
          </div>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span>{t('inspection.history.date')}: {result.training_date}</span>
            <span>{t('inspection.history.inspector')}: {result.inspector_name}</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-lg font-bold">{result.match_rate}%</span>
          <Badge variant={result.match_rate >= 80 ? 'default' : 'destructive'}>
            {result.match_rate >= 80 ? t('inspection.common.pass') : t('inspection.common.fail')}
          </Badge>
          {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </div>
      </div>
      {isExpanded && (
        <div className="px-4 pb-4 border-t pt-4">
          <h4 className="text-sm font-semibold mb-3">{t('inspection.history.pairDetails')}</h4>
          <InspectionPairGrid pairs={result.pairs} readOnly />
        </div>
      )}
    </div>
  );
}
