import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { format, subDays } from 'date-fns';
import {
  Bell,
  BellRing,
  Calendar,
  Clock,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Award,
  Settings,
  Mail,
  MailOpen,
  Trash2,
  Search,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
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
  DialogFooter,
} from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import type { Notification, NotificationType, NotificationPriority } from '@/types/notification';

// 샘플 알림 데이터 생성
const generateSampleNotifications = (): Notification[] => {
  const notifications: Notification[] = [];
  const types: NotificationType[] = [
    'TRAINING_REMINDER',
    'EXPIRY_WARNING',
    'RETRAINING_REQUIRED',
    'SESSION_CANCELLED',
    'RESULT_AVAILABLE',
    'CERTIFICATE_READY',
    'SYSTEM',
  ];
  const priorities: NotificationPriority[] = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];

  const titles: Record<NotificationType, string[]> = {
    TRAINING_REMINDER: ['QIP 기초 교육 예정', '생산 품질 관리 교육 임박', '안전 교육 D-3'],
    EXPIRY_WARNING: ['QIP 자격 만료 임박 (7일)', '생산 품질 자격 만료 (14일)', '안전 교육 갱신 필요'],
    RETRAINING_REQUIRED: ['재교육 필요: 불합격', '역량 평가 미달', '정기 재교육 대상자'],
    SESSION_CANCELLED: ['3월 15일 교육 취소', '일정 변경 안내', '장소 변경 안내'],
    RESULT_AVAILABLE: ['교육 결과 확인 가능', '시험 결과 발표', '평가 완료'],
    CERTIFICATE_READY: ['이수증 발급 완료', '자격증 갱신 완료', '수료증 다운로드 가능'],
    SYSTEM: ['시스템 점검 안내', '새 기능 업데이트', '보안 알림'],
  };

  for (let i = 0; i < 30; i++) {
    const type = types[Math.floor(Math.random() * types.length)];
    const priority = priorities[Math.floor(Math.random() * priorities.length)];
    const daysAgo = Math.floor(Math.random() * 14);
    const titleOptions = titles[type];
    const title = titleOptions[Math.floor(Math.random() * titleOptions.length)];

    notifications.push({
      notification_id: `NOTIF-${String(i + 1).padStart(4, '0')}`,
      type,
      priority,
      title,
      message: `${title}에 대한 상세 내용입니다. 확인 후 필요한 조치를 취해주세요.`,
      recipient_type: 'EMPLOYEE',
      recipient_id: `EMP-${String(Math.floor(Math.random() * 100) + 1).padStart(3, '0')}`,
      is_read: Math.random() > 0.6,
      created_at: format(subDays(new Date(), daysAgo), "yyyy-MM-dd'T'HH:mm:ss"),
      expires_at: format(subDays(new Date(), daysAgo - 30), "yyyy-MM-dd'T'HH:mm:ss"),
    });
  }

  return notifications.sort((a, b) =>
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
};

// 알림 타입 아이콘
const NotificationIcon = ({ type }: { type: NotificationType }) => {
  switch (type) {
    case 'TRAINING_REMINDER':
      return <Calendar className="h-5 w-5 text-blue-500" />;
    case 'EXPIRY_WARNING':
      return <Clock className="h-5 w-5 text-orange-500" />;
    case 'RETRAINING_REQUIRED':
      return <AlertTriangle className="h-5 w-5 text-red-500" />;
    case 'SESSION_CANCELLED':
      return <XCircle className="h-5 w-5 text-gray-500" />;
    case 'RESULT_AVAILABLE':
      return <CheckCircle className="h-5 w-5 text-green-500" />;
    case 'CERTIFICATE_READY':
      return <Award className="h-5 w-5 text-purple-500" />;
    case 'SYSTEM':
      return <Bell className="h-5 w-5 text-gray-600" />;
    default:
      return <Bell className="h-5 w-5" />;
  }
};

// 우선순위 배지
const PriorityBadge = ({ priority }: { priority: NotificationPriority }) => {
  const config: Record<NotificationPriority, { label: string; variant: 'default' | 'secondary' | 'warning' | 'destructive' }> = {
    LOW: { label: '낮음', variant: 'secondary' },
    MEDIUM: { label: '보통', variant: 'default' },
    HIGH: { label: '높음', variant: 'warning' },
    URGENT: { label: '긴급', variant: 'destructive' },
  };
  const { label, variant } = config[priority];
  return <Badge variant={variant}>{label}</Badge>;
};

export default function NotificationsPage() {
  useTranslation();
  const [notifications, setNotifications] = useState<Notification[]>(generateSampleNotifications);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedPriority, setSelectedPriority] = useState<string>('all');
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);
  const [selectedNotifications, setSelectedNotifications] = useState<Set<string>>(new Set());
  const [settingsDialogOpen, setSettingsDialogOpen] = useState(false);

  // 알림 설정
  const [settings, setSettings] = useState({
    emailNotifications: true,
    inAppNotifications: true,
    trainingReminder: true,
    expiryWarning: true,
    retrainingRequired: true,
    reminderDays: [7, 3, 1],
  });

  // 필터링된 알림
  const filteredNotifications = useMemo(() => {
    return notifications.filter(n => {
      const matchesSearch = n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        n.message.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesType = selectedType === 'all' || n.type === selectedType;
      const matchesPriority = selectedPriority === 'all' || n.priority === selectedPriority;
      const matchesUnread = !showUnreadOnly || !n.is_read;
      return matchesSearch && matchesType && matchesPriority && matchesUnread;
    });
  }, [notifications, searchQuery, selectedType, selectedPriority, showUnreadOnly]);

  // 통계
  const stats = useMemo(() => ({
    total: notifications.length,
    unread: notifications.filter(n => !n.is_read).length,
    urgent: notifications.filter(n => n.priority === 'URGENT' && !n.is_read).length,
    today: notifications.filter(n =>
      format(new Date(n.created_at), 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')
    ).length,
  }), [notifications]);

  // 읽음 처리
  const handleMarkAsRead = (notificationId: string) => {
    setNotifications(prev => prev.map(n =>
      n.notification_id === notificationId ? { ...n, is_read: true } : n
    ));
  };

  // 전체 읽음 처리
  const handleMarkAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
  };

  // 선택 항목 읽음 처리
  const handleMarkSelectedAsRead = () => {
    setNotifications(prev => prev.map(n =>
      selectedNotifications.has(n.notification_id) ? { ...n, is_read: true } : n
    ));
    setSelectedNotifications(new Set());
  };

  // 삭제
  const handleDelete = (notificationId: string) => {
    setNotifications(prev => prev.filter(n => n.notification_id !== notificationId));
  };

  // 선택 항목 삭제
  const handleDeleteSelected = () => {
    setNotifications(prev => prev.filter(n => !selectedNotifications.has(n.notification_id)));
    setSelectedNotifications(new Set());
  };

  // 전체 선택
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedNotifications(new Set(filteredNotifications.map(n => n.notification_id)));
    } else {
      setSelectedNotifications(new Set());
    }
  };

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">알림 센터</h1>
          <p className="text-muted-foreground">교육 일정 및 시스템 알림 관리</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setSettingsDialogOpen(true)}>
            <Settings className="h-4 w-4 mr-2" />
            알림 설정
          </Button>
          <Button onClick={handleMarkAllAsRead} disabled={stats.unread === 0}>
            <MailOpen className="h-4 w-4 mr-2" />
            모두 읽음 처리
          </Button>
        </div>
      </div>

      {/* 통계 카드 */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Bell className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-xs text-muted-foreground">전체 알림</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Mail className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.unread}</p>
                <p className="text-xs text-muted-foreground">읽지 않음</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <BellRing className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.urgent}</p>
                <p className="text-xs text-muted-foreground">긴급 알림</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Calendar className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.today}</p>
                <p className="text-xs text-muted-foreground">오늘 알림</p>
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
                placeholder="알림 검색..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger className="w-full md:w-40">
                <SelectValue placeholder="유형" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체 유형</SelectItem>
                <SelectItem value="TRAINING_REMINDER">교육 일정</SelectItem>
                <SelectItem value="EXPIRY_WARNING">만료 임박</SelectItem>
                <SelectItem value="RETRAINING_REQUIRED">재교육 필요</SelectItem>
                <SelectItem value="RESULT_AVAILABLE">결과 확인</SelectItem>
                <SelectItem value="CERTIFICATE_READY">이수증 발급</SelectItem>
                <SelectItem value="SYSTEM">시스템</SelectItem>
              </SelectContent>
            </Select>
            <Select value={selectedPriority} onValueChange={setSelectedPriority}>
              <SelectTrigger className="w-full md:w-32">
                <SelectValue placeholder="우선순위" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체</SelectItem>
                <SelectItem value="URGENT">긴급</SelectItem>
                <SelectItem value="HIGH">높음</SelectItem>
                <SelectItem value="MEDIUM">보통</SelectItem>
                <SelectItem value="LOW">낮음</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex items-center gap-2">
              <Switch
                checked={showUnreadOnly}
                onCheckedChange={setShowUnreadOnly}
              />
              <Label>읽지 않은 알림만</Label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 일괄 작업 */}
      {selectedNotifications.size > 0 && (
        <Card>
          <CardContent className="p-3">
            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground">
                {selectedNotifications.size}개 선택됨
              </span>
              <Button size="sm" variant="outline" onClick={handleMarkSelectedAsRead}>
                <MailOpen className="h-4 w-4 mr-1" />
                읽음 처리
              </Button>
              <Button size="sm" variant="outline" onClick={handleDeleteSelected}>
                <Trash2 className="h-4 w-4 mr-1" />
                삭제
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 알림 목록 */}
      <Card>
        <CardHeader>
          <CardTitle>알림 목록</CardTitle>
          <CardDescription>
            총 {filteredNotifications.length}건의 알림
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox
                    checked={selectedNotifications.size === filteredNotifications.length && filteredNotifications.length > 0}
                    onCheckedChange={handleSelectAll}
                  />
                </TableHead>
                <TableHead>유형</TableHead>
                <TableHead>제목</TableHead>
                <TableHead>우선순위</TableHead>
                <TableHead>일시</TableHead>
                <TableHead>상태</TableHead>
                <TableHead className="text-right">액션</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredNotifications.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    알림이 없습니다
                  </TableCell>
                </TableRow>
              ) : (
                filteredNotifications.slice(0, 20).map((notification) => (
                  <TableRow
                    key={notification.notification_id}
                    className={notification.is_read ? 'opacity-60' : ''}
                  >
                    <TableCell>
                      <Checkbox
                        checked={selectedNotifications.has(notification.notification_id)}
                        onCheckedChange={(checked) => {
                          const next = new Set(selectedNotifications);
                          if (checked) {
                            next.add(notification.notification_id);
                          } else {
                            next.delete(notification.notification_id);
                          }
                          setSelectedNotifications(next);
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <NotificationIcon type={notification.type} />
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className={`font-medium ${!notification.is_read ? 'font-bold' : ''}`}>
                          {notification.title}
                        </p>
                        <p className="text-xs text-muted-foreground truncate max-w-xs">
                          {notification.message}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <PriorityBadge priority={notification.priority} />
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {format(new Date(notification.created_at), 'yyyy-MM-dd HH:mm')}
                      </div>
                    </TableCell>
                    <TableCell>
                      {notification.is_read ? (
                        <Badge variant="secondary">읽음</Badge>
                      ) : (
                        <Badge variant="default">새 알림</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        {!notification.is_read && (
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleMarkAsRead(notification.notification_id)}
                          >
                            <MailOpen className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleDelete(notification.notification_id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* 알림 설정 다이얼로그 */}
      <Dialog open={settingsDialogOpen} onOpenChange={setSettingsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>알림 설정</DialogTitle>
            <DialogDescription>
              알림 수신 방법과 유형을 설정합니다
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            <div className="space-y-4">
              <h4 className="font-medium">수신 방법</h4>
              <div className="flex items-center justify-between">
                <Label htmlFor="email">이메일 알림</Label>
                <Switch
                  id="email"
                  checked={settings.emailNotifications}
                  onCheckedChange={(checked: boolean) =>
                    setSettings(s => ({ ...s, emailNotifications: checked }))
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="inapp">앱 내 알림</Label>
                <Switch
                  id="inapp"
                  checked={settings.inAppNotifications}
                  onCheckedChange={(checked: boolean) =>
                    setSettings(s => ({ ...s, inAppNotifications: checked }))
                  }
                />
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-medium">알림 유형</h4>
              <div className="flex items-center justify-between">
                <Label htmlFor="training">교육 일정 알림</Label>
                <Switch
                  id="training"
                  checked={settings.trainingReminder}
                  onCheckedChange={(checked: boolean) =>
                    setSettings(s => ({ ...s, trainingReminder: checked }))
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="expiry">만료 임박 알림</Label>
                <Switch
                  id="expiry"
                  checked={settings.expiryWarning}
                  onCheckedChange={(checked: boolean) =>
                    setSettings(s => ({ ...s, expiryWarning: checked }))
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="retraining">재교육 필요 알림</Label>
                <Switch
                  id="retraining"
                  checked={settings.retrainingRequired}
                  onCheckedChange={(checked: boolean) =>
                    setSettings(s => ({ ...s, retrainingRequired: checked }))
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="font-medium">리마인더 시기</h4>
              <p className="text-sm text-muted-foreground">
                교육 시작 전 알림을 받을 시기를 선택하세요
              </p>
              <div className="flex flex-wrap gap-2">
                {[1, 3, 7, 14, 30].map((days) => (
                  <Badge
                    key={days}
                    variant={settings.reminderDays.includes(days) ? 'default' : 'outline'}
                    className="cursor-pointer"
                    onClick={() => {
                      setSettings(s => ({
                        ...s,
                        reminderDays: s.reminderDays.includes(days)
                          ? s.reminderDays.filter(d => d !== days)
                          : [...s.reminderDays, days].sort((a, b) => b - a),
                      }));
                    }}
                  >
                    {days}일 전
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setSettingsDialogOpen(false)}>
              취소
            </Button>
            <Button onClick={() => setSettingsDialogOpen(false)}>
              저장
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
