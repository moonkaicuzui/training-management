import { Clock, Eye, CheckCircle2 } from 'lucide-react';
import type { TrainerDirective } from '@/types/trainerDirective';

const STATUS_CONFIG = {
  generated: {
    label: 'Generated',
    bg: 'bg-gray-100',
    text: 'text-gray-700',
    icon: Clock,
  },
  sent: {
    label: 'Sent',
    bg: 'bg-blue-100',
    text: 'text-blue-700',
    icon: Eye,
  },
  read: {
    label: 'Read',
    bg: 'bg-yellow-100',
    text: 'text-yellow-700',
    icon: Eye,
  },
  acknowledged: {
    label: 'Acknowledged',
    bg: 'bg-green-100',
    text: 'text-green-700',
    icon: CheckCircle2,
  },
} as const;

export default function StatusBadge({ status }: { status: TrainerDirective['status'] }) {
  const c = STATUS_CONFIG[status] || STATUS_CONFIG.generated;
  const Icon = c.icon;

  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${c.bg} ${c.text}`}
    >
      <Icon className="h-3 w-3" />
      {c.label}
    </span>
  );
}
