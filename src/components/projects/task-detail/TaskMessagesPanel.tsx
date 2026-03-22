/**
 * TaskMessagesPanel - The messages/communication tab with message list and compose area
 */

import { useState, useCallback, useMemo, useRef, memo } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  MessageSquare,
  Send,
  CheckCheck,
  AtSign,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';
import type { MessageType } from '@/types/project';
import type { Member, Message } from './types';
import { MessageTypeIcon } from './MessageTypeIcon';
import { MESSAGE_TYPE_COLORS } from './messageUtils';

interface TaskMessagesPanelProps {
  messages: Message[];
  members: Member[];
  isMessagesLoading: boolean;
  getMemberById: (id: string) => Member | undefined;
  onSendMessage: (data: { taskId: string; content: string; type: MessageType; mentions?: string[] }) => Promise<void>;
  onMarkMessageAsRead: (messageId: string) => void;
  onResolveMessage: (messageId: string) => Promise<void>;
  taskId: string;
}

export const TaskMessagesPanel = memo(function TaskMessagesPanel({
  messages,
  members,
  isMessagesLoading,
  getMemberById,
  onSendMessage,
  onMarkMessageAsRead,
  onResolveMessage,
  taskId,
}: TaskMessagesPanelProps) {
  const { t } = useTranslation();

  const MESSAGE_TYPE_LABELS: Record<MessageType, string> = {
    question: t('projects.messageType.question'),
    request: t('projects.messageType.request'),
    approval: t('projects.messageType.approval'),
    rejection: t('projects.messageType.rejection'),
    info: t('projects.messageType.info'),
    comment: t('projects.messageType.comment'),
  };

  const [newMessageContent, setNewMessageContent] = useState('');
  const [newMessageType, setNewMessageType] = useState<MessageType>('comment');
  const [mentionSearch, setMentionSearch] = useState('');
  const [showMentionPopup, setShowMentionPopup] = useState(false);
  const [selectedMentions, setSelectedMentions] = useState<string[]>([]);
  const messageInputRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const handleSendMessage = useCallback(async () => {
    if (!newMessageContent.trim()) return;
    await onSendMessage({
      taskId,
      content: newMessageContent,
      type: newMessageType,
      mentions: selectedMentions.length > 0 ? selectedMentions : undefined,
    });
    setNewMessageContent('');
    setNewMessageType('comment');
    setSelectedMentions([]);
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  }, [newMessageContent, newMessageType, taskId, selectedMentions, onSendMessage]);

  const handleMentionSelect = useCallback((memberId: string) => {
    if (!selectedMentions.includes(memberId)) {
      setSelectedMentions([...selectedMentions, memberId]);
    }
    setShowMentionPopup(false);
    setMentionSearch('');
    messageInputRef.current?.focus();
  }, [selectedMentions]);

  const handleRemoveMention = useCallback((memberId: string) => {
    setSelectedMentions(selectedMentions.filter(id => id !== memberId));
  }, [selectedMentions]);

  const handleMessageInputChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setNewMessageContent(value);
    const lastAtIndex = value.lastIndexOf('@');
    if (lastAtIndex !== -1 && lastAtIndex === value.length - 1) {
      setShowMentionPopup(true);
      setMentionSearch('');
    } else if (lastAtIndex !== -1) {
      const searchText = value.substring(lastAtIndex + 1);
      if (!searchText.includes(' ')) {
        setMentionSearch(searchText);
        setShowMentionPopup(true);
      } else {
        setShowMentionPopup(false);
      }
    } else {
      setShowMentionPopup(false);
    }
  }, []);

  const filteredMentionMembers = useMemo(() => {
    if (!mentionSearch) return members.filter(m => m.status === 'active');
    return members.filter(
      m => m.status === 'active' &&
           (m.name.toLowerCase().includes(mentionSearch.toLowerCase()) ||
            m.email.toLowerCase().includes(mentionSearch.toLowerCase()))
    );
  }, [members, mentionSearch]);

  const formatMessageTime = useCallback((date: Date | { toDate: () => Date }) => {
    const d = date instanceof Date ? date : date.toDate();
    return formatDistanceToNow(d, { addSuffix: true, locale: ko });
  }, []);

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <ScrollArea className="flex-1 pr-4">
        <div className="space-y-4 py-4">
          {isMessagesLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">{t('common.loading')}</p>
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center py-8">
              <MessageSquare className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">{t('projects.tasks.message')}</p>
              <p className="text-xs text-muted-foreground mt-1">{t('projects.tasks.message')}</p>
            </div>
          ) : (
            messages.map((message) => {
              const sender = getMemberById(message.senderId);
              return (
                <div
                  key={message.id}
                  className={`flex gap-3 ${message.isResolved ? 'opacity-60' : ''}`}
                  onMouseEnter={() => onMarkMessageAsRead(message.id)}
                >
                  <Avatar className="h-8 w-8 shrink-0">
                    <AvatarImage src={sender?.photoURL} />
                    <AvatarFallback className="text-xs">{sender?.name?.charAt(0) || '?'}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-sm">{sender?.name || t('common.noData')}</span>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger>
                            <Badge
                              variant="outline"
                              className="h-5 px-1.5 text-xs"
                              style={{ borderColor: MESSAGE_TYPE_COLORS[message.type], color: MESSAGE_TYPE_COLORS[message.type] }}
                            >
                              <MessageTypeIcon type={message.type} className="h-3 w-3 mr-1" />
                              {MESSAGE_TYPE_LABELS[message.type]}
                            </Badge>
                          </TooltipTrigger>
                          <TooltipContent>{MESSAGE_TYPE_LABELS[message.type]}</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      <span className="text-xs text-muted-foreground">{formatMessageTime(message.createdAt)}</span>
                      {message.isResolved && (
                        <Badge variant="secondary" className="h-5 px-1.5 text-xs">
                          <CheckCheck className="h-3 w-3 mr-1" />
                          {t('projects.status.completed')}
                        </Badge>
                      )}
                    </div>
                    <div className="mt-1 text-sm whitespace-pre-wrap break-words">{message.content}</div>
                    {message.mentions && message.mentions.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {message.mentions.map((mentionId) => {
                          const mentionedMember = getMemberById(mentionId);
                          return (
                            <Badge key={mentionId} variant="secondary" className="h-5 px-1.5 text-xs bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300">
                              <AtSign className="h-3 w-3 mr-0.5" />
                              {mentionedMember?.name || mentionId}
                            </Badge>
                          );
                        })}
                      </div>
                    )}
                    {Object.keys(message.readBy).length > 0 && (
                      <div className="flex items-center gap-1 mt-2">
                        <CheckCheck className="h-3 w-3 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">{Object.keys(message.readBy).length}</span>
                      </div>
                    )}
                    {!message.isResolved && (message.type === 'question' || message.type === 'request') && (
                      <Button variant="ghost" size="sm" className="h-6 mt-2 text-xs" onClick={() => onResolveMessage(message.id)}>
                        <CheckCheck className="h-3 w-3 mr-1" />
                        {t('projects.status.completed')}
                      </Button>
                    )}
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      <Separator className="my-2" />

      {/* Message input area */}
      <div className="space-y-3">
        {selectedMentions.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {selectedMentions.map((mentionId) => {
              const member = getMemberById(mentionId);
              return (
                <Badge key={mentionId} variant="secondary" className="h-6 px-2 text-xs bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300">
                  <AtSign className="h-3 w-3 mr-0.5" />
                  {member?.name || mentionId}
                  <button className="ml-1 hover:text-red-500" onClick={() => handleRemoveMention(mentionId)}>x</button>
                </Badge>
              );
            })}
          </div>
        )}

        <div className="flex items-center gap-2">
          <Label className="text-xs">{t('projects.tasks.message')}:</Label>
          <div className="flex gap-1">
            {(['comment', 'question', 'request', 'info', 'approval', 'rejection'] as MessageType[]).map((type) => (
              <TooltipProvider key={type}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant={newMessageType === type ? 'default' : 'outline'}
                      size="sm"
                      className="h-7 w-7 p-0"
                      style={newMessageType === type ? { backgroundColor: MESSAGE_TYPE_COLORS[type] } : {}}
                      onClick={() => setNewMessageType(type)}
                    >
                      <MessageTypeIcon type={type} className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>{MESSAGE_TYPE_LABELS[type]}</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ))}
          </div>
        </div>

        <div className="relative">
          <Textarea
            ref={messageInputRef}
            value={newMessageContent}
            onChange={handleMessageInputChange}
            placeholder={t('projects.tasks.message')}
            rows={2}
            className="pr-12 resize-none"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); }
            }}
          />
          <Button
            size="sm"
            className="absolute bottom-2 right-2 h-8 w-8 p-0"
            onClick={handleSendMessage}
            disabled={!newMessageContent.trim()}
          >
            <Send className="h-4 w-4" />
          </Button>
          {showMentionPopup && filteredMentionMembers.length > 0 && (
            <div className="absolute bottom-full left-0 mb-1 w-64 max-h-48 overflow-y-auto bg-background border rounded-lg shadow-lg z-50">
              {filteredMentionMembers.slice(0, 5).map((member) => (
                <button
                  key={member.id}
                  className="w-full flex items-center gap-2 p-2 hover:bg-muted text-left"
                  onClick={() => handleMentionSelect(member.id)}
                >
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={member.photoURL} />
                    <AvatarFallback className="text-xs">{member.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{member.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{member.department}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
        <p className="text-xs text-muted-foreground">Enter / Shift+Enter</p>
      </div>
    </div>
  );
});
