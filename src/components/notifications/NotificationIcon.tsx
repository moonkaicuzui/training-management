import {
  Bell,
  Calendar,
  Clock,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Award,
} from 'lucide-react';
import type { NotificationType } from '@/types/notification';

export const NotificationIcon = ({ type }: { type: NotificationType }) => {
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
