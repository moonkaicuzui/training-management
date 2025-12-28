import { CheckCircle2, Circle, Clock, Play } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { NewTQCTrainingStage } from '@/types/newTqc';
import { format } from 'date-fns';

interface TrainingStageTimelineProps {
  stages: NewTQCTrainingStage[];
  className?: string;
  onStageClick?: (stage: NewTQCTrainingStage) => void;
}

const getStageIcon = (status: NewTQCTrainingStage['status']) => {
  switch (status) {
    case 'COMPLETED':
      return <CheckCircle2 className="h-5 w-5 text-status-pass" />;
    case 'IN_PROGRESS':
      return <Play className="h-5 w-5 text-primary" />;
    case 'PENDING':
    default:
      return <Circle className="h-5 w-5 text-muted-foreground" />;
  }
};

const getStageLineColor = (status: NewTQCTrainingStage['status']) => {
  switch (status) {
    case 'COMPLETED':
      return 'bg-status-pass';
    case 'IN_PROGRESS':
      return 'bg-primary';
    case 'PENDING':
    default:
      return 'bg-muted';
  }
};

export function TrainingStageTimeline({
  stages,
  className,
  onStageClick,
}: TrainingStageTimelineProps) {
  // Sort stages by order
  const sortedStages = [...stages].sort((a, b) => a.stage_order - b.stage_order);

  return (
    <div className={cn('space-y-0', className)}>
      {sortedStages.map((stage, index) => (
        <div
          key={stage.stage_id}
          className={cn(
            'relative flex items-start gap-4 pb-6',
            onStageClick && 'cursor-pointer hover:bg-accent/50 -mx-2 px-2 rounded-lg transition-colors'
          )}
          onClick={() => onStageClick?.(stage)}
          role={onStageClick ? 'button' : undefined}
          tabIndex={onStageClick ? 0 : undefined}
        >
          {/* Timeline line */}
          {index < sortedStages.length - 1 && (
            <div
              className={cn(
                'absolute left-[10px] top-8 w-0.5 h-[calc(100%-24px)]',
                getStageLineColor(stage.status)
              )}
            />
          )}

          {/* Stage icon */}
          <div className="relative z-10 flex-shrink-0">
            {getStageIcon(stage.status)}
          </div>

          {/* Stage content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <h4
                className={cn(
                  'font-medium text-sm',
                  stage.status === 'COMPLETED' && 'text-status-pass',
                  stage.status === 'IN_PROGRESS' && 'text-primary font-semibold',
                  stage.status === 'PENDING' && 'text-muted-foreground'
                )}
              >
                {stage.stage_order}. {stage.stage_name}
              </h4>
              {stage.status === 'IN_PROGRESS' && (
                <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                  진행중
                </span>
              )}
            </div>

            {/* Date information */}
            <div className="mt-1 flex items-center gap-4 text-xs text-muted-foreground">
              {stage.start_date && (
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  시작: {format(new Date(stage.start_date), 'yyyy-MM-dd')}
                </span>
              )}
              {stage.end_date && (
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  완료: {format(new Date(stage.end_date), 'yyyy-MM-dd')}
                </span>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// Compact version for list views
interface TrainingStageProgressProps {
  stages: NewTQCTrainingStage[];
  className?: string;
}

export function TrainingStageProgress({ stages, className }: TrainingStageProgressProps) {
  const completedCount = stages.filter((s) => s.status === 'COMPLETED').length;
  const totalCount = stages.length;
  const percentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <div className={cn('flex items-center gap-2', className)}>
      {/* Progress bar */}
      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
        <div
          className="h-full bg-primary transition-all duration-300"
          style={{ width: `${percentage}%` }}
        />
      </div>
      {/* Progress text */}
      <span className="text-xs text-muted-foreground whitespace-nowrap">
        {completedCount}/{totalCount}
      </span>
    </div>
  );
}
