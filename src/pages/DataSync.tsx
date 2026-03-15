import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  RefreshCcw,
  Loader2,
  CheckCircle2,
  AlertCircle,
  ArrowRightLeft,
  ArrowRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import {
  SYNC_COLLECTIONS,
  triggerSync,
  triggerSyncAll,
  type SyncDirection,
  type SyncResult,
} from '@/services/syncService';

function getSyncModeIcon(syncMode: string) {
  switch (syncMode) {
    case 'bidirectional':
      return <ArrowRightLeft className="h-3.5 w-3.5" />;
    case 'append_only':
      return <ArrowRight className="h-3.5 w-3.5" />;
    case 'firestore_to_sheets':
      return <ArrowRight className="h-3.5 w-3.5" />;
    default:
      return null;
  }
}

export default function DataSync() {
  const { t } = useTranslation();
  const [direction, setDirection] = useState<SyncDirection>('bidirectional');
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(
    new Set(SYNC_COLLECTIONS.map((c) => c.key))
  );
  const [syncing, setSyncing] = useState(false);
  const [results, setResults] = useState<SyncResult[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [lastSyncTime, setLastSyncTime] = useState<Record<string, Date>>({});

  const toggleCollection = useCallback((key: string) => {
    setSelectedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  }, []);

  const toggleAll = useCallback(() => {
    setSelectedKeys((prev) => {
      if (prev.size === SYNC_COLLECTIONS.length) {
        return new Set();
      }
      return new Set(SYNC_COLLECTIONS.map((c) => c.key));
    });
  }, []);

  const handleSyncAll = useCallback(async () => {
    setSyncing(true);
    setError(null);
    setResults([]);
    try {
      const res = await triggerSyncAll(direction);
      setResults(res);
      const now = new Date();
      const times: Record<string, Date> = {};
      res.forEach((r) => {
        times[r.collection] = now;
      });
      setLastSyncTime((prev) => ({ ...prev, ...times }));
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setSyncing(false);
    }
  }, [direction]);

  const handleSyncSelected = useCallback(async () => {
    if (selectedKeys.size === 0) return;
    setSyncing(true);
    setError(null);
    setResults([]);
    try {
      const res = await triggerSync(Array.from(selectedKeys), direction);
      setResults(res);
      const now = new Date();
      const times: Record<string, Date> = {};
      res.forEach((r) => {
        times[r.collection] = now;
      });
      setLastSyncTime((prev) => ({ ...prev, ...times }));
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setSyncing(false);
    }
  }, [selectedKeys, direction]);

  const formatLastSync = (key: string) => {
    const time = lastSyncTime[key];
    if (!time) return '-';
    const diff = Math.round((Date.now() - time.getTime()) / 1000);
    if (diff < 60) return `${diff}${t('sync.secondsAgo')}`;
    const mins = Math.round(diff / 60);
    return `${mins}${t('sync.minutesAgo')}`;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t('sync.title')}</h1>
        <p className="text-muted-foreground">{t('sync.description')}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCcw className="h-5 w-5" />
            {t('sync.title')}
          </CardTitle>
          <CardDescription>{t('sync.description')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Controls */}
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">{t('sync.direction')}:</span>
              <Select
                value={direction}
                onValueChange={(v) => setDirection(v as SyncDirection)}
              >
                <SelectTrigger className="w-[200px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bidirectional">{t('sync.bidirectional')}</SelectItem>
                  <SelectItem value="toSheets">{t('sync.toSheets')}</SelectItem>
                  <SelectItem value="toFirestore">{t('sync.toFirestore')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleSyncAll} disabled={syncing}>
              {syncing ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <RefreshCcw className="mr-2 h-4 w-4" />
              )}
              {t('sync.syncAll')}
            </Button>
          </div>

          {/* Collection table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]">
                    <Checkbox
                      checked={selectedKeys.size === SYNC_COLLECTIONS.length}
                      onCheckedChange={toggleAll}
                    />
                  </TableHead>
                  <TableHead>{t('sync.collection')}</TableHead>
                  <TableHead>{t('sync.mode')}</TableHead>
                  <TableHead>{t('sync.lastSync')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {SYNC_COLLECTIONS.map((col) => (
                  <TableRow key={col.key}>
                    <TableCell>
                      <Checkbox
                        checked={selectedKeys.has(col.key)}
                        onCheckedChange={() => toggleCollection(col.key)}
                      />
                    </TableCell>
                    <TableCell className="font-medium">{t(col.label)}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="gap-1">
                        {getSyncModeIcon(col.syncMode)}
                        {t(`sync.mode.${col.syncMode}`)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatLastSync(col.key)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <Button
            variant="outline"
            onClick={handleSyncSelected}
            disabled={syncing || selectedKeys.size === 0}
          >
            {syncing ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <RefreshCcw className="mr-2 h-4 w-4" />
            )}
            {t('sync.syncSelected')}
          </Button>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-destructive">
              <AlertCircle className="h-5 w-5 shrink-0" />
              <div>
                <p className="font-medium">{t('sync.error')}</p>
                <p className="text-sm">{error}</p>
              </div>
            </div>
          )}

          {/* Results */}
          {results.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-medium flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                {t('sync.success')}
              </h3>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('sync.collection')}</TableHead>
                      <TableHead className="text-center">{t('sync.result.created')}</TableHead>
                      <TableHead className="text-center">{t('sync.result.updated')}</TableHead>
                      <TableHead className="text-center">{t('sync.result.skipped')}</TableHead>
                      <TableHead className="text-center">{t('sync.result.errors')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {results.map((r) => {
                      const col = SYNC_COLLECTIONS.find((c) => c.key === r.collection);
                      return (
                        <TableRow key={r.collection}>
                          <TableCell className="font-medium">
                            {col ? t(col.label) : r.collection}
                          </TableCell>
                          <TableCell className="text-center">
                            {r.created > 0 ? (
                              <Badge variant="default">{r.created}</Badge>
                            ) : (
                              <span className="text-muted-foreground">0</span>
                            )}
                          </TableCell>
                          <TableCell className="text-center">
                            {r.updated > 0 ? (
                              <Badge variant="secondary">{r.updated}</Badge>
                            ) : (
                              <span className="text-muted-foreground">0</span>
                            )}
                          </TableCell>
                          <TableCell className="text-center text-muted-foreground">
                            {r.skipped}
                          </TableCell>
                          <TableCell className="text-center">
                            {r.errors.length > 0 ? (
                              <Badge variant="destructive">{r.errors.length}</Badge>
                            ) : (
                              <span className="text-muted-foreground">0</span>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              {/* Error details */}
              {results.some((r) => r.errors.length > 0) && (
                <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
                  <p className="font-medium text-destructive mb-2">{t('sync.result.errors')}</p>
                  <ul className="text-sm text-destructive space-y-1">
                    {results
                      .filter((r) => r.errors.length > 0)
                      .flatMap((r) =>
                        r.errors.map((err, i) => (
                          <li key={`${r.collection}-${i}`}>
                            [{r.collection}] {err}
                          </li>
                        ))
                      )}
                  </ul>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
