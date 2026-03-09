import { BatchActionBar } from '@/components/common/recommendations';

interface Props {
  selectedCount: number;
  onBatchEnroll: () => void;
  onClearSelection: () => void;
  isEnrolling: boolean;
}

export function AqlBatchActionBar(props: Props) {
  return <BatchActionBar {...props} i18nPrefix="aql.recommendations" />;
}
