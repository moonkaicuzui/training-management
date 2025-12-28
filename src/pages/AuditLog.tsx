import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { format, subDays } from 'date-fns';
import {
  History,
  Search,
  FileText,
  User,
  Calendar,
  Clock,
  Eye,
  Download,
  Edit,
  Trash2,
  Plus,
  RefreshCcw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import type { ChangeAction } from '@/types';

interface AuditLogEntry {
  log_id: string;
  entity_type: 'PROGRAM' | 'RESULT' | 'SESSION' | 'EMPLOYEE' | 'USER';
  entity_id: string;
  action: ChangeAction | 'LOGIN' | 'LOGOUT' | 'VIEW' | 'EXPORT';
  changed_by: string;
  changed_at: string;
  ip_address?: string;
  user_agent?: string;
  before_data?: Record<string, unknown>;
  after_data?: Record<string, unknown>;
  reason?: string;
}

// 샘플 감사 로그 데이터
const generateSampleLogs = (): AuditLogEntry[] => {
  const logs: AuditLogEntry[] = [];
  const users = ['admin@hwk.com', 'qip.manager@hwk.com', 'trainer01@hwk.com'];
  const entityTypes: AuditLogEntry['entity_type'][] = ['PROGRAM', 'RESULT', 'SESSION', 'EMPLOYEE'];
  const actions: AuditLogEntry['action'][] = ['CREATE', 'UPDATE', 'DELETE', 'VIEW', 'EXPORT'];

  for (let i = 0; i < 50; i++) {
    const entityType = entityTypes[Math.floor(Math.random() * entityTypes.length)];
    const action = actions[Math.floor(Math.random() * actions.length)];
    const daysAgo = Math.floor(Math.random() * 30);
    const hoursAgo = Math.floor(Math.random() * 24);

    logs.push({
      log_id: `LOG-${String(i + 1).padStart(6, '0')}`,
      entity_type: entityType,
      entity_id: `${entityType.substring(0, 3)}-${String(Math.floor(Math.random() * 100)).padStart(3, '0')}`,
      action,
      changed_by: users[Math.floor(Math.random() * users.length)],
      changed_at: format(subDays(new Date(), daysAgo).setHours(hoursAgo, Math.floor(Math.random() * 60)), "yyyy-MM-dd'T'HH:mm:ss"),
      ip_address: `192.168.1.${Math.floor(Math.random() * 255)}`,
      user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      before_data: action === 'UPDATE' ? { field: 'old_value' } : undefined,
      after_data: action !== 'DELETE' && action !== 'VIEW' ? { field: 'new_value' } : undefined,
      reason: action === 'UPDATE' || action === 'DELETE' ? '관리자 요청에 의한 수정' : undefined,
    });
  }

  return logs.sort((a, b) => new Date(b.changed_at).getTime() - new Date(a.changed_at).getTime());
};

// 로그 상세 다이얼로그
function LogDetailDialog({
  open,
  onClose,
  log,
}: {
  open: boolean;
  onClose: () => void;
  log: AuditLogEntry | null;
}) {
  if (!log) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            감사 로그 상세
          </DialogTitle>
          <DialogDescription>
            로그 ID: {log.log_id}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* 기본 정보 */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">기본 정보</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">작업 유형</p>
                  <Badge variant={
                    log.action === 'CREATE' ? 'success' :
                    log.action === 'UPDATE' ? 'warning' :
                    log.action === 'DELETE' ? 'destructive' : 'secondary'
                  } className="mt-1">
                    {log.action}
                  </Badge>
                </div>
                <div>
                  <p className="text-muted-foreground">대상 유형</p>
                  <p className="font-medium">{log.entity_type}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">대상 ID</p>
                  <p className="font-mono">{log.entity_id}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">작업자</p>
                  <p className="font-medium">{log.changed_by}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">작업 일시</p>
                  <p>{format(new Date(log.changed_at), 'yyyy-MM-dd HH:mm:ss')}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">IP 주소</p>
                  <p className="font-mono">{log.ip_address || '-'}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 변경 사유 */}
          {log.reason && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">변경 사유</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">{log.reason}</p>
              </CardContent>
            </Card>
          )}

          {/* 변경 내역 */}
          {(log.before_data || log.after_data) && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">변경 내역</CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="after">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="before" disabled={!log.before_data}>
                      변경 전
                    </TabsTrigger>
                    <TabsTrigger value="after" disabled={!log.after_data}>
                      변경 후
                    </TabsTrigger>
                  </TabsList>
                  <TabsContent value="before" className="mt-2">
                    <pre className="text-xs bg-muted p-3 rounded overflow-auto max-h-48">
                      {JSON.stringify(log.before_data, null, 2)}
                    </pre>
                  </TabsContent>
                  <TabsContent value="after" className="mt-2">
                    <pre className="text-xs bg-muted p-3 rounded overflow-auto max-h-48">
                      {JSON.stringify(log.after_data, null, 2)}
                    </pre>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          )}

          {/* 브라우저 정보 */}
          {log.user_agent && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">클라이언트 정보</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground break-all">{log.user_agent}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function AuditLogPage() {
  useTranslation();
  const [logs] = useState<AuditLogEntry[]>(generateSampleLogs);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEntityType, setSelectedEntityType] = useState<string>('all');
  const [selectedAction, setSelectedAction] = useState<string>('all');
  const [selectedPeriod, setSelectedPeriod] = useState<string>('7');
  const [selectedLog, setSelectedLog] = useState<AuditLogEntry | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);

  // 필터링된 로그
  const filteredLogs = useMemo(() => {
    const periodDays = parseInt(selectedPeriod);
    const cutoffDate = subDays(new Date(), periodDays);

    return logs.filter((log) => {
      const matchesSearch =
        log.log_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.entity_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.changed_by.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesEntityType = selectedEntityType === 'all' || log.entity_type === selectedEntityType;
      const matchesAction = selectedAction === 'all' || log.action === selectedAction;
      const matchesPeriod = new Date(log.changed_at) >= cutoffDate;

      return matchesSearch && matchesEntityType && matchesAction && matchesPeriod;
    });
  }, [logs, searchQuery, selectedEntityType, selectedAction, selectedPeriod]);

  // 통계
  const stats = useMemo(() => {
    const periodDays = parseInt(selectedPeriod);
    const cutoffDate = subDays(new Date(), periodDays);
    const periodLogs = logs.filter(log => new Date(log.changed_at) >= cutoffDate);

    return {
      total: periodLogs.length,
      creates: periodLogs.filter(l => l.action === 'CREATE').length,
      updates: periodLogs.filter(l => l.action === 'UPDATE').length,
      deletes: periodLogs.filter(l => l.action === 'DELETE').length,
      uniqueUsers: new Set(periodLogs.map(l => l.changed_by)).size,
    };
  }, [logs, selectedPeriod]);

  const handleViewDetail = (log: AuditLogEntry) => {
    setSelectedLog(log);
    setDetailDialogOpen(true);
  };

  const getActionIcon = (action: AuditLogEntry['action']) => {
    switch (action) {
      case 'CREATE':
        return <Plus className="h-4 w-4 text-green-500" />;
      case 'UPDATE':
        return <Edit className="h-4 w-4 text-blue-500" />;
      case 'DELETE':
        return <Trash2 className="h-4 w-4 text-red-500" />;
      case 'VIEW':
        return <Eye className="h-4 w-4 text-gray-500" />;
      case 'EXPORT':
        return <Download className="h-4 w-4 text-purple-500" />;
      default:
        return <RefreshCcw className="h-4 w-4 text-gray-500" />;
    }
  };

  const getActionBadge = (action: AuditLogEntry['action']) => {
    const variants: Record<string, 'success' | 'warning' | 'destructive' | 'secondary' | 'default'> = {
      CREATE: 'success',
      UPDATE: 'warning',
      DELETE: 'destructive',
      VIEW: 'secondary',
      EXPORT: 'default',
      LOGIN: 'default',
      LOGOUT: 'secondary',
    };
    return variants[action] || 'secondary';
  };

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">감사 로그</h1>
          <p className="text-muted-foreground">시스템 활동 및 변경 이력 조회</p>
        </div>
        <Button variant="outline">
          <Download className="h-4 w-4 mr-2" />
          로그 내보내기
        </Button>
      </div>

      {/* 통계 카드 */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <History className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-xs text-muted-foreground">전체 활동</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Plus className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.creates}</p>
                <p className="text-xs text-muted-foreground">생성</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Edit className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.updates}</p>
                <p className="text-xs text-muted-foreground">수정</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <Trash2 className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.deletes}</p>
                <p className="text-xs text-muted-foreground">삭제</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <User className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.uniqueUsers}</p>
                <p className="text-xs text-muted-foreground">활동 사용자</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 필터 */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="로그 ID, 대상 ID, 사용자로 검색..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select value={selectedEntityType} onValueChange={setSelectedEntityType}>
              <SelectTrigger className="w-full md:w-40">
                <SelectValue placeholder="대상 유형" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체 유형</SelectItem>
                <SelectItem value="PROGRAM">프로그램</SelectItem>
                <SelectItem value="RESULT">교육 결과</SelectItem>
                <SelectItem value="SESSION">교육 세션</SelectItem>
                <SelectItem value="EMPLOYEE">직원</SelectItem>
              </SelectContent>
            </Select>
            <Select value={selectedAction} onValueChange={setSelectedAction}>
              <SelectTrigger className="w-full md:w-40">
                <SelectValue placeholder="작업 유형" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체 작업</SelectItem>
                <SelectItem value="CREATE">생성</SelectItem>
                <SelectItem value="UPDATE">수정</SelectItem>
                <SelectItem value="DELETE">삭제</SelectItem>
                <SelectItem value="VIEW">조회</SelectItem>
                <SelectItem value="EXPORT">내보내기</SelectItem>
              </SelectContent>
            </Select>
            <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
              <SelectTrigger className="w-full md:w-40">
                <SelectValue placeholder="기간" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">최근 1일</SelectItem>
                <SelectItem value="7">최근 7일</SelectItem>
                <SelectItem value="30">최근 30일</SelectItem>
                <SelectItem value="90">최근 90일</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* 로그 목록 */}
      <Card>
        <CardHeader>
          <CardTitle>활동 로그</CardTitle>
          <CardDescription>
            조회된 로그 {filteredLogs.length}건
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>로그 ID</TableHead>
                <TableHead>작업</TableHead>
                <TableHead>대상</TableHead>
                <TableHead>대상 ID</TableHead>
                <TableHead>작업자</TableHead>
                <TableHead>일시</TableHead>
                <TableHead>IP</TableHead>
                <TableHead className="text-right">상세</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLogs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    조회된 로그가 없습니다
                  </TableCell>
                </TableRow>
              ) : (
                filteredLogs.slice(0, 50).map((log) => (
                  <TableRow key={log.log_id}>
                    <TableCell className="font-mono text-xs">{log.log_id}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getActionIcon(log.action)}
                        <Badge variant={getActionBadge(log.action)}>
                          {log.action}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{log.entity_type}</Badge>
                    </TableCell>
                    <TableCell className="font-mono text-xs">{log.entity_id}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center">
                          <User className="h-3 w-3 text-primary" />
                        </div>
                        <span className="text-sm truncate max-w-[120px]">{log.changed_by}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3 text-muted-foreground" />
                          {format(new Date(log.changed_at), 'yyyy-MM-dd')}
                        </div>
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {format(new Date(log.changed_at), 'HH:mm:ss')}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-xs">{log.ip_address || '-'}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleViewDetail(log)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        상세
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {filteredLogs.length > 50 && (
            <div className="mt-4 text-center">
              <p className="text-sm text-muted-foreground">
                {filteredLogs.length - 50}개의 추가 로그가 있습니다
              </p>
              <Button variant="outline" className="mt-2">
                더 보기
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 로그 상세 다이얼로그 */}
      <LogDetailDialog
        open={detailDialogOpen}
        onClose={() => setDetailDialogOpen(false)}
        log={selectedLog}
      />
    </div>
  );
}
