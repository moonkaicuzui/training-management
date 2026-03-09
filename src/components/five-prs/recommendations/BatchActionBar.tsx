import { BatchActionBar as CommonBatchActionBar } from '@/components/common/recommendations';

interface Props {
  selectedCount: number;
  onBatchEnroll: () => void;
  onClearSelection: () => void;
  isEnrolling: boolean;
}

export function BatchActionBar(props: Props) {
  return <CommonBatchActionBar {...props} i18nPrefix="recommendation" />;
}
