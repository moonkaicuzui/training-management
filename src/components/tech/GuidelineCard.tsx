import { useTranslation } from 'react-i18next';
import { Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { TechReviewGuideline } from '@/types/techModel';

interface GuidelineCardProps {
  guideline: TechReviewGuideline;
  modelName: string;
  onEdit: (guideline: TechReviewGuideline) => void;
  onDelete: (id: string) => void;
  onPhotoPreview: (url: string) => void;
}

export function GuidelineCard({
  guideline,
  modelName,
  onEdit,
  onDelete,
  onPhotoPreview,
}: GuidelineCardProps) {
  const { t } = useTranslation();
  const g = guideline;

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <CardTitle className="text-base">
            {modelName}
          </CardTitle>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" onClick={() => onEdit(g)}>
              <Pencil className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(g.id)}
              className="text-destructive hover:text-destructive"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
        <div className="flex flex-wrap gap-1.5 mt-2">
          <Badge variant="outline" className="text-xs">{t(`tech.materialPoints.${g.materialPoint}`)}</Badge>
          <Badge variant="secondary" className="text-xs">{t(`tech.processPoints.${g.processPoint}`)}</Badge>
          <Badge className="text-xs">{t(`tech.standardInfos.${g.standardInfo}`)}</Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-0 space-y-2">
        <div>
          <span className="text-xs text-muted-foreground">{t('tech.guidelines.processName')}:</span>
          <p className="text-sm font-medium">{g.processName}</p>
        </div>
        {g.details && (
          <div>
            <span className="text-xs text-muted-foreground">{t('tech.guidelines.details')}:</span>
            <p className="text-sm line-clamp-3">{g.details}</p>
          </div>
        )}
        {g.referencePhotos && g.referencePhotos.length > 0 && (
          <div>
            <span className="text-xs text-muted-foreground">{t('tech.guidelines.referencePhotos')}:</span>
            <div className="flex gap-2 mt-1 flex-wrap">
              {g.referencePhotos.map((photo, idx) => (
                <button
                  key={idx}
                  onClick={() => onPhotoPreview(photo.url)}
                  className="w-16 h-16 rounded border overflow-hidden hover:ring-2 ring-primary transition-all"
                >
                  <img
                    src={photo.url}
                    alt={photo.originalName}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
