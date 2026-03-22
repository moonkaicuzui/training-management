import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Eye,
  Trash2,
  MoreVertical,
  Star,
  StarOff,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { TrainingMaterial } from '@/types/material';
import { formatFileSize, getFileIcon, getFileIconColor } from './materialUtils';

interface MaterialTableProps {
  materials: TrainingMaterial[];
  selectedItems: string[];
  viewMode: 'grid' | 'list';
  onSelectItem: (materialId: string) => void;
  onSelectAll: () => void;
  onToggleStar: (materialId: string) => void;
  onViewDetails: (material: TrainingMaterial) => void;
  onDeleteMaterial: (materialId: string) => void;
}

export const MaterialTable = memo(function MaterialTable({
  materials,
  selectedItems,
  viewMode,
  onSelectItem,
  onSelectAll,
  onToggleStar,
  onViewDetails,
  onDeleteMaterial,
}: MaterialTableProps) {
  const { t } = useTranslation();

  if (viewMode === 'list') {
    return (
      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-8">
                  <Checkbox
                    checked={selectedItems.length === materials.length && materials.length > 0}
                    onCheckedChange={onSelectAll}
                  />
                </TableHead>
                <TableHead className="w-8"></TableHead>
                <TableHead>{t('materials.colFileName')}</TableHead>
                <TableHead>{t('materials.colSize')}</TableHead>
                <TableHead>{t('materials.colTags')}</TableHead>
                <TableHead>{t('materials.colUploader')}</TableHead>
                <TableHead>{t('materials.colUploadDate')}</TableHead>
                <TableHead>{t('materials.colDownloads')}</TableHead>
                <TableHead className="text-right">{t('materials.colActions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {materials.map((material) => {
                const FileIcon = getFileIcon(material.type);
                return (
                  <TableRow key={material.id}>
                    <TableCell>
                      <Checkbox
                        checked={selectedItems.includes(material.id)}
                        onCheckedChange={() => onSelectItem(material.id)}
                      />
                    </TableCell>
                    <TableCell>
                      <button onClick={() => onToggleStar(material.id)}>
                        {material.isStarred ? (
                          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        ) : (
                          <StarOff className="h-4 w-4 text-muted-foreground hover:text-yellow-400" />
                        )}
                      </button>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <FileIcon className={`h-5 w-5 ${getFileIconColor(material.type)}`} />
                        <div>
                          <p className="font-medium">{material.name}</p>
                          <p className="text-xs text-muted-foreground">{material.version}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{formatFileSize(material.size)}</TableCell>
                    <TableCell>
                      <div className="flex gap-1 flex-wrap">
                        {material.tags.slice(0, 2).map(tag => (
                          <Badge key={tag} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                        {material.tags.length > 2 && (
                          <Badge variant="outline" className="text-xs">
                            +{material.tags.length - 2}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{material.uploadedBy}</TableCell>
                    <TableCell>{material.uploadedAt.split('T')[0]}</TableCell>
                    <TableCell>{material.downloadCount}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => onViewDetails(material)}>
                            <Eye className="h-4 w-4 mr-2" />
                            {t('materials.menuDetail')}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => onDeleteMaterial(material.id)}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            {t('materials.menuDelete')}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    );
  }

  // Grid view
  return (
    <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      {materials.map((material) => {
        const FileIcon = getFileIcon(material.type);
        return (
          <Card
            key={material.id}
            className={`cursor-pointer transition-colors ${
              selectedItems.includes(material.id) ? 'border-primary' : 'hover:border-primary/50'
            }`}
          >
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center">
                <div className="relative w-full mb-4">
                  <button
                    className="absolute top-0 left-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectItem(material.id);
                    }}
                  >
                    <Checkbox checked={selectedItems.includes(material.id)} />
                  </button>
                  <button
                    className="absolute top-0 right-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleStar(material.id);
                    }}
                  >
                    {material.isStarred ? (
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    ) : (
                      <StarOff className="h-4 w-4 text-muted-foreground hover:text-yellow-400" />
                    )}
                  </button>
                  <FileIcon className={`h-16 w-16 mx-auto ${getFileIconColor(material.type)}`} />
                </div>
                <p className="font-medium truncate w-full" title={material.name}>
                  {material.name}
                </p>
                <p className="text-sm text-muted-foreground">
                  {formatFileSize(material.size)}
                </p>
                <div className="flex gap-1 mt-2 flex-wrap justify-center">
                  {material.tags.slice(0, 2).map(tag => (
                    <Badge key={tag} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
});

// Starred/Recent/Programs tab tables
interface MaterialSimpleTableProps {
  materials: TrainingMaterial[];
  onViewDetails: (material: TrainingMaterial) => void;
  title: string;
  description: string;
}

export function MaterialSimpleTable({
  materials,
  onViewDetails,
  title,
  description,
}: MaterialSimpleTableProps) {
  const { t } = useTranslation();

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('materials.colFileName')}</TableHead>
              <TableHead>{t('materials.colSize')}</TableHead>
              <TableHead>{t('materials.colUploader')}</TableHead>
              <TableHead>{t('materials.colUploadDate')}</TableHead>
              <TableHead className="text-right">{t('materials.colActions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {materials.map((material) => {
              const FileIcon = getFileIcon(material.type);
              return (
                <TableRow key={material.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <FileIcon className={`h-5 w-5 ${getFileIconColor(material.type)}`} />
                      <span className="font-medium">{material.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>{formatFileSize(material.size)}</TableCell>
                  <TableCell>{material.uploadedBy}</TableCell>
                  <TableCell>{material.uploadedAt.split('T')[0]}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" onClick={() => onViewDetails(material)}>
                      <Eye className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

// Programs tab content
interface MaterialProgramsViewProps {
  materials: TrainingMaterial[];
  onViewDetails: (material: TrainingMaterial) => void;
}

export function MaterialProgramsView({
  materials,
  onViewDetails,
}: MaterialProgramsViewProps) {
  const { t } = useTranslation();

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('materials.programsTitle')}</CardTitle>
        <CardDescription>{t('materials.programsDesc')}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {Array.from(new Set(materials.filter(m => m.programName).map(m => m.programName))).map(programName => (
            <div key={programName} className="border rounded-lg p-4">
              <h3 className="font-medium mb-3">{programName}</h3>
              <div className="space-y-2">
                {materials.filter(m => m.programName === programName).map((material) => {
                  const FileIcon = getFileIcon(material.type);
                  return (
                    <div key={material.id} className="flex items-center justify-between py-2 border-b last:border-0">
                      <div className="flex items-center gap-2">
                        <FileIcon className={`h-5 w-5 ${getFileIconColor(material.type)}`} />
                        <span>{material.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">
                          {formatFileSize(material.size)}
                        </span>
                        <Button variant="ghost" size="sm" onClick={() => onViewDetails(material)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
