import { useTranslation } from 'react-i18next';
import type { CertificateTemplate } from '@/services/certificateService';
import {
  Pencil,
  Trash2,
  Star,
  Palette,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface TemplateTableProps {
  templates: CertificateTemplate[];
  onEdit: (template: CertificateTemplate) => void;
  onDelete: (templateId: string) => void;
  onSetDefault: (templateId: string) => void;
  onPreview: (template: CertificateTemplate) => void;
}

function getBorderStyleLabel(style: string, t: (key: string) => string): string {
  switch (style) {
    case 'double':
      return t('certificates.borderDouble');
    case 'solid':
      return t('certificates.borderSolid');
    case 'ornate':
      return t('certificates.borderOrnate');
    default:
      return style;
  }
}

export default function TemplateTable({
  templates,
  onEdit,
  onDelete,
  onSetDefault,
  onPreview,
}: TemplateTableProps) {
  const { t } = useTranslation();

  return (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('certificates.templateName')}</TableHead>
              <TableHead>{t('certificates.templateDesc')}</TableHead>
              <TableHead>{t('certificates.borderStyle')}</TableHead>
              <TableHead>{t('certificates.borderColor')}</TableHead>
              <TableHead>{t('common.status')}</TableHead>
              <TableHead className="text-right">{t('common.actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {templates.map((template) => (
              <TableRow key={template.template_id}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{template.name}</span>
                    {template.is_default && (
                      <Badge variant="default" className="gap-1">
                        <Star className="h-3 w-3" />
                        {t('certificates.isDefault')}
                      </Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground max-w-[200px] truncate">
                  {template.description || '-'}
                </TableCell>
                <TableCell>{getBorderStyleLabel(template.border_style, t)}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <div
                      className="w-6 h-6 rounded border"
                      style={{ backgroundColor: template.border_color }}
                    />
                    <span className="text-xs font-mono">{template.border_color}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={template.is_active ? 'success' : 'secondary'}>
                    {template.is_active ? t('common.active') : t('common.inactive')}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onPreview(template)}
                      title={t('certificates.previewTitle')}
                    >
                      <Palette className="h-4 w-4" />
                    </Button>
                    {!template.is_default && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onSetDefault(template.template_id)}
                        title={t('certificates.setDefault')}
                      >
                        <Star className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onEdit(template)}
                      title={t('common.edit')}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDelete(template.template_id)}
                      title={t('common.delete')}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
