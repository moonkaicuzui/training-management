/**
 * Metal Shoe Case Excel Parser
 *
 * 엑셀 파일에서 금속 발견 신발 케이스 데이터를 파싱하고
 * 업체명을 표준 ID로 매칭하는 유틸리티
 */

import * as XLSX from 'xlsx';
import type {
  MetalShoeCase,
  MetalShoeComponent,
  MetalShoeSide,
  XraySentStatus,
  MetalConfirm,
} from '@/types/metalShoe';

// ─── Supplier Alias Map ──────────────────────────────────────
const SUPPLIER_ALIAS_MAP: Record<string, string> = {
  'TAESUNG RACH GIA': 'TAESUNG_RG_OUTSOLE',
  'TSRG': 'TAESUNG_RG_OUTSOLE',
  'TS RG OUTSOLE': 'TAESUNG_RG_OUTSOLE',
  'TAESUNG CU CHI': 'TAESUNG_CC',
  'TAESUNG CỬU CHI': 'TAESUNG_CC',
  'TSCC': 'TAESUNG_CC',
  'DONG NAI (HVC)': 'HVC',
  'DONG NAI': 'HVC',
  'HVC': 'HVC',
  'EZ': 'EZ',
  'RG A': 'HWK_RG_A',
  'STITCHING A': 'HWK_RG_A',
  'RG C': 'HWK_RG_C',
  'RG D': 'HWK_RG_D',
  'STITCHING D': 'HWK_RG_D',
  'RG E': 'HWK_RG_E',
  'CUTTING D': 'HWK_CUTTING_D',
  'CUTTING': 'HWK_CUTTING_D',
  'SOC TRANG': 'SOC_TRANG',
  'S TECH': 'S_TECH',
};

// ─── Supplier Name Map (ID → Display Name) ──────────────────
const SUPPLIER_NAME_MAP: Record<string, string> = {
  'TAESUNG_RG_OUTSOLE': 'TS RG Outsole',
  'TAESUNG_RG_STOCKFIT': 'TS RG Stockfit',
  'TAESUNG_CC': 'Taesung Cu Chi',
  'EZ': 'EZ',
  'HVC': 'HVC',
  'SOC_TRANG': 'Soc Trang',
  'HWK_RG_A': 'RG A (Stitching)',
  'HWK_RG_C': 'RG C (Stitching)',
  'HWK_RG_D': 'RG D (Stitching)',
  'HWK_RG_E': 'RG E (Stitching)',
  'HWK_CUTTING_D': 'Cutting D',
  'S_TECH': 'S TECH',
};

function fuzzyMatch(input: string, keys: string[]): string | null {
  const normalized = input.replace(/\s+/g, '').toUpperCase();
  for (const key of keys) {
    const normKey = key.replace(/\s+/g, '').toUpperCase();
    if (normKey.includes(normalized) || normalized.includes(normKey)) {
      return key;
    }
  }
  return null;
}

export function matchSupplierId(rawName: string): string {
  if (!rawName) return 'UNKNOWN';
  const normalized = rawName.trim().toUpperCase();

  // Direct match
  if (SUPPLIER_ALIAS_MAP[normalized]) return SUPPLIER_ALIAS_MAP[normalized];

  // Try case-insensitive match
  for (const [alias, id] of Object.entries(SUPPLIER_ALIAS_MAP)) {
    if (alias.toUpperCase() === normalized) return id;
  }

  // Fuzzy match
  const fuzzy = fuzzyMatch(normalized, Object.keys(SUPPLIER_ALIAS_MAP));
  if (fuzzy) return SUPPLIER_ALIAS_MAP[fuzzy];

  return 'UNKNOWN';
}

export function getSupplierName(supplierId: string): string {
  return SUPPLIER_NAME_MAP[supplierId] || supplierId;
}

// ─── Excel Parsing ───────────────────────────────────────────

interface ParseResult {
  cases: Array<Omit<MetalShoeCase, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>>;
  errors: Array<{ row: number; message: string }>;
  unmatchedSuppliers: string[];
}

export function parseMetalShoeExcel(file: ArrayBuffer): ParseResult {
  const workbook = XLSX.read(file, { type: 'array', cellDates: true });
  const sheet = workbook.Sheets[workbook.SheetNames[0]]; // DATA sheet
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '' });

  const cases: ParseResult['cases'] = [];
  const errors: ParseResult['errors'] = [];
  const unmatchedSet = new Set<string>();

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rowNum = i + 2; // 1-based + header

    try {
      // Detection date
      let detectionDate: string;
      const rawDate = row['DATE'] || row['Detection Date'] || row['날짜'];
      if (rawDate instanceof Date) {
        // UTC로 변환하여 시간대에 의한 날짜 밀림 방지
        const y = rawDate.getFullYear();
        const m = String(rawDate.getMonth() + 1).padStart(2, '0');
        const d = String(rawDate.getDate()).padStart(2, '0');
        detectionDate = `${y}-${m}-${d}`;
      } else if (typeof rawDate === 'string' && rawDate) {
        // MM/DD/YYYY → YYYY-MM-DD 변환
        const parts = rawDate.match(/(\d+)\/(\d+)\/(\d+)/);
        if (parts) {
          const yr = parseInt(parts[3]) < 100 ? 2000 + parseInt(parts[3]) : parseInt(parts[3]);
          detectionDate = `${yr}-${String(parseInt(parts[1])).padStart(2, '0')}-${String(parseInt(parts[2])).padStart(2, '0')}`;
        } else {
          detectionDate = rawDate;
        }
      } else {
        errors.push({ row: rowNum, message: 'Missing detection date' });
        continue;
      }

      // Supplier matching
      const rawSupplier = String(row['SUPPLIER'] || row['Supplier'] || row['업체'] || '').trim();
      const supplierId = matchSupplierId(rawSupplier);
      if (supplierId === 'UNKNOWN') {
        unmatchedSet.add(rawSupplier);
      }

      const component = (String(row['COMPONENT'] || row['Component'] || row['부품'] || 'BOTTOM').toUpperCase()) as MetalShoeComponent;
      const side = (String(row['SIDE'] || row['Side'] || row['좌우'] || 'RIGHT').toUpperCase()) as MetalShoeSide;

      // X-Ray status
      let xraySentStatus: XraySentStatus = 'NOT_SENT';
      const rawXray = String(row['X-RAY'] || row['X-Ray Sent'] || '').toUpperCase();
      if (rawXray === 'OK' || rawXray === 'SENT') xraySentStatus = 'OK';
      else if (rawXray === 'N/A') xraySentStatus = 'N/A';

      let metalConfirm: MetalConfirm = 'NOT_YET';
      const rawConfirm = String(row['METAL CONFIRM'] || row['Metal Confirm'] || '').toUpperCase();
      if (rawConfirm === 'YES') metalConfirm = 'YES';
      else if (rawConfirm === 'NO') metalConfirm = 'NO';

      const caseData: ParseResult['cases'][number] = {
        year: 0,
        month: 0,
        week: '',
        weekNumber: 0,
        detectionDate,
        factory: String(row['FACTORY'] || row['Factory'] || row['공장'] || ''),
        line: String(row['LINE'] || row['Line'] || row['라인'] || ''),
        model: String(row['MODEL'] || row['Model'] || row['모델'] || ''),
        pgsc: String(row['PGSC'] || row['Article'] || ''),
        poNumber: String(row['PO'] || row['PO Number'] || row['PO NO'] || ''),
        destination: String(row['DESTINATION'] || row['Destination'] || row['목적지'] || ''),
        orderQty: Number(row['ORDER QTY'] || row['Order Qty'] || 0),
        size: String(row['SIZE'] || row['Size'] || row['사이즈'] || ''),
        supplierId,
        supplierName: supplierId !== 'UNKNOWN' ? getSupplierName(supplierId) : rawSupplier,
        component: ['BOTTOM', 'UPPER'].includes(component) ? component : 'BOTTOM',
        side: ['RIGHT', 'LEFT'].includes(side) ? side : 'RIGHT',
        piecesQty: Number(row['PCS QTY'] || row['Pieces'] || 1),
        cGradePairs: Number(row['C-GRADE PAIRS'] || row['C-Grade'] || 0),
        xraySentDate: row['X-RAY SENT DATE'] ? String(row['X-RAY SENT DATE']) : undefined,
        xraySentStatus,
        xrayReceivedDate: row['X-RAY RECEIVED DATE'] ? String(row['X-RAY RECEIVED DATE']) : undefined,
        metalConfirm,
        remark: row['REMARK'] || row['Remark'] ? String(row['REMARK'] || row['Remark']) : undefined,
        isInternalOperation: false,
        status: 'registered',
      };

      cases.push(caseData);
    } catch (err) {
      errors.push({ row: rowNum, message: err instanceof Error ? err.message : String(err) });
    }
  }

  return { cases, errors, unmatchedSuppliers: Array.from(unmatchedSet) };
}
