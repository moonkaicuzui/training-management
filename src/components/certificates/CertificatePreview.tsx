import { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import DOMPurify from 'dompurify';
import { Award, Download, Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { CertificateData } from './types';

interface CertificatePreviewProps {
  data: CertificateData;
  onClose: () => void;
}

export function CertificatePreview({ data, onClose }: CertificatePreviewProps) {
  const { t } = useTranslation();
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    const content = printRef.current;
    if (!content) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${t('certificates.certTitle')} - ${data.certificateNumber}</title>
          <style>
            @page { size: A4 landscape; margin: 0; }
            body {
              margin: 0;
              padding: 40px;
              font-family: 'Malgun Gothic', sans-serif;
              background: white;
            }
            .certificate {
              border: 8px double #1E40AF;
              padding: 40px;
              text-align: center;
              min-height: 500px;
              position: relative;
            }
            .logo { font-size: 24px; font-weight: bold; color: #1E40AF; margin-bottom: 10px; }
            .title { font-size: 36px; font-weight: bold; margin: 20px 0; color: #1E3A8A; }
            .subtitle { font-size: 18px; color: #64748B; margin-bottom: 30px; }
            .content { font-size: 16px; line-height: 2; margin: 30px 0; }
            .name { font-size: 28px; font-weight: bold; color: #0F172A; margin: 20px 0; }
            .details { display: flex; justify-content: center; gap: 40px; margin: 30px 0; }
            .detail-item { text-align: center; }
            .detail-label { font-size: 12px; color: #64748B; }
            .detail-value { font-size: 16px; font-weight: bold; }
            .footer { position: absolute; bottom: 40px; left: 0; right: 0; }
            .signature { margin-top: 40px; }
            .cert-number { font-size: 12px; color: #94A3B8; position: absolute; bottom: 20px; right: 40px; }
          </style>
        </head>
        <body>
          ${DOMPurify.sanitize(content.innerHTML)}
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Award className="h-5 w-5" />
            {t('certificates.previewTitle')}
          </DialogTitle>
        </DialogHeader>

        <div className="flex gap-2 mb-4">
          <Button onClick={handlePrint}>
            <Printer className="h-4 w-4 mr-2" />
            {t('certificates.print')}
          </Button>
          <Button variant="outline" onClick={handlePrint}>
            <Download className="h-4 w-4 mr-2" />
            {t('certificates.savePdf')}
          </Button>
        </div>

        <div
          ref={printRef}
          className="border-8 border-double border-primary p-8 bg-white text-center"
          style={{ minHeight: '400px' }}
        >
          <div className="certificate">
            <p className="text-2xl font-bold text-primary mb-2">Q-TRAIN</p>
            <p className="text-sm text-muted-foreground">{t('certificates.certOrgName')}</p>

            <h1 className="text-4xl font-bold my-8 text-primary">{t('certificates.certTitle')}</h1>
            <p className="text-lg text-muted-foreground mb-8">{t('certificates.certSubtitle')}</p>

            <div className="my-8">
              <p className="text-lg mb-4">{t('certificates.certBody')}</p>
              <p className="text-3xl font-bold my-6">{data.employeeName}</p>
              <p className="text-muted-foreground">{data.department} / {data.position}</p>
            </div>

            <div className="flex justify-center gap-12 my-8">
              <div className="text-center">
                <p className="text-sm text-muted-foreground">{t('certificates.certProgram')}</p>
                <p className="text-lg font-bold">{data.programName}</p>
                <Badge variant="outline" className="mt-1">{data.programCode}</Badge>
              </div>
              <div className="text-center">
                <p className="text-sm text-muted-foreground">{t('certificates.certDate')}</p>
                <p className="text-lg font-bold">{data.trainingDate}</p>
              </div>
              {data.score !== null && (
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">{t('certificates.certScore')}</p>
                  <p className="text-lg font-bold">{data.score}{t('certificates.certScoreUnit')}</p>
                  {data.grade && <Badge className="mt-1">{data.grade}</Badge>}
                </div>
              )}
            </div>

            <div className="mt-12 pt-8 border-t">
              <p className="text-lg">{t('certificates.certIssueDate')} {data.issueDate}</p>
              <div className="mt-8">
                <p className="text-sm text-muted-foreground">HWK Vietnam QIP Team</p>
                <p className="mt-2 font-bold">{t('certificates.certManager')}</p>
              </div>
            </div>

            <p className="text-xs text-muted-foreground mt-8">
              {t('certificates.certNumber')} {data.certificateNumber}
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
