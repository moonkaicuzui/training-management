/**
 * MessageTypeIcon component - renders the appropriate icon for a message type
 */

import {
  HelpCircle,
  FileText,
  ThumbsUp,
  ThumbsDown,
  Info,
  MessageSquare,
} from 'lucide-react';
import type { MessageType } from '@/types/project';

interface MessageTypeIconProps {
  type: MessageType;
  className?: string;
}

export const MessageTypeIcon: React.FC<MessageTypeIconProps> = ({ type, className = 'h-4 w-4' }) => {
  switch (type) {
    case 'question': return <HelpCircle className={className} />;
    case 'request': return <FileText className={className} />;
    case 'approval': return <ThumbsUp className={className} />;
    case 'rejection': return <ThumbsDown className={className} />;
    case 'info': return <Info className={className} />;
    case 'comment':
    default: return <MessageSquare className={className} />;
  }
};
