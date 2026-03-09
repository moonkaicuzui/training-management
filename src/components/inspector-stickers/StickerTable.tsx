import { useTranslation } from 'react-i18next';
import { Pencil, Trash2, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { StickerTableProps } from './types';

export function StickerTable({
  stickers,
  isLoading,
  search,
  onEdit,
  onDelete,
  onToggleStatus,
}: StickerTableProps) {
  const { t } = useTranslation();

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('inspectorStickers.listTitle')}</CardTitle>
        <CardDescription>
          {t('inspectorStickers.totalCount', { count: stickers.length })}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : stickers.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            {search
              ? t('inspectorStickers.noSearchResults')
              : t('inspectorStickers.noData')}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('inspectorStickers.columns.stickerId')}</TableHead>
                <TableHead>{t('inspectorStickers.columns.employeeId')}</TableHead>
                <TableHead>{t('inspectorStickers.columns.employeeName')}</TableHead>
                <TableHead>{t('inspectorStickers.columns.department')}</TableHead>
                <TableHead>{t('inspectorStickers.columns.building')}</TableHead>
                <TableHead>{t('inspectorStickers.columns.line')}</TableHead>
                <TableHead>{t('inspectorStickers.columns.status')}</TableHead>
                <TableHead>{t('inspectorStickers.columns.notes')}</TableHead>
                <TableHead className="text-right">{t('common.actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {stickers.map((sticker) => (
                <TableRow key={sticker.id}>
                  <TableCell className="font-mono font-semibold">
                    {sticker.sticker_id}
                  </TableCell>
                  <TableCell className="font-mono text-sm">
                    {sticker.employee_id}
                  </TableCell>
                  <TableCell>{sticker.employee_name}</TableCell>
                  <TableCell>{sticker.department || '-'}</TableCell>
                  <TableCell>{sticker.building || '-'}</TableCell>
                  <TableCell>{sticker.line || '-'}</TableCell>
                  <TableCell>
                    <Badge
                      variant={sticker.status === 'ACTIVE' ? 'default' : 'secondary'}
                      className="cursor-pointer"
                      onClick={() => onToggleStatus(sticker)}
                    >
                      {sticker.status === 'ACTIVE'
                        ? t('common.active')
                        : t('common.inactive')}
                    </Badge>
                  </TableCell>
                  <TableCell className="max-w-[200px] truncate text-sm text-muted-foreground">
                    {sticker.notes || '-'}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onEdit(sticker)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onDelete(sticker)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
