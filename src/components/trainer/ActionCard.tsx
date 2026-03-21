import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import TrendIndicator from './TrendIndicator';
import type { DirectiveAction } from '@/types/trainerDirective';

export default function ActionCard({
  action,
  index,
  priority,
}: {
  action: DirectiveAction;
  index: number;
  priority: 'immediate' | 'preventive';
}) {
  const [expanded, setExpanded] = useState(false);
  const priorityColor =
    priority === 'immediate'
      ? 'border-l-red-500 bg-red-50/50'
      : 'border-l-amber-500 bg-amber-50/50';

  return (
    <div
      className={`border-l-4 rounded-r-lg p-4 mb-3 cursor-pointer transition-all hover:shadow-sm ${priorityColor}`}
      onClick={() => setExpanded(!expanded)}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-semibold text-gray-900">
              {index + 1}. [{action.employee_name}]
            </span>
            <span className="text-xs text-gray-500">
              {action.building}, {action.line}
            </span>
            <TrendIndicator trend={action.trend} />
          </div>
          <p className="text-sm text-gray-600">{action.issue}</p>
        </div>
        <div className="flex items-center gap-3 ml-4">
          <span
            className={`text-lg font-bold ${
              action.reject_rate >= 5 ? 'text-red-600' : 'text-amber-600'
            }`}
          >
            {action.reject_rate}%
          </span>
          {expanded ? (
            <ChevronUp className="h-4 w-4 text-gray-400" />
          ) : (
            <ChevronDown className="h-4 w-4 text-gray-400" />
          )}
        </div>
      </div>

      {expanded && (
        <div className="mt-3 pt-3 border-t border-gray-200 space-y-2">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Instruction:</span>
              <p className="text-gray-800 font-medium mt-0.5">
                {action.instruction}
              </p>
            </div>
            <div>
              <span className="text-gray-500">Program:</span>
              <p className="text-gray-800 font-medium mt-0.5">
                {action.program_code}
              </p>
            </div>
            <div>
              <span className="text-gray-500">Deadline:</span>
              <p className="text-gray-800 font-medium mt-0.5">
                {action.deadline}
              </p>
            </div>
            <div>
              <span className="text-gray-500">Threshold:</span>
              <p className="text-gray-800 font-medium mt-0.5">
                {action.threshold}%
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
