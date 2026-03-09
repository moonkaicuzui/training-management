import { useTranslation } from 'react-i18next';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { TrainerWithStats } from './types';

interface TrainerSelectorProps {
  trainers: TrainerWithStats[];
  selectedTrainerId: string;
  onTrainerChange: (value: string) => void;
}

export default function TrainerSelector({
  trainers,
  selectedTrainerId,
  onTrainerChange,
}: TrainerSelectorProps) {
  const { t } = useTranslation();

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium">{t('trainers.selectTrainer')}:</span>
          <Select value={selectedTrainerId} onValueChange={onTrainerChange}>
            <SelectTrigger className="w-full md:w-64">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('trainers.allTrainers')}</SelectItem>
              {trainers.map((trainer) => (
                <SelectItem key={trainer.trainer_id} value={trainer.trainer_id}>
                  {trainer.trainer_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
}
