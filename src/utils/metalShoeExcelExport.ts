import * as XLSX from 'xlsx';
import type { MetalShoeCase } from '../types/metalShoe';

/**
 * 금속 신발 년도별 엑셀 다운로드
 * 기존 양식 호환: DATA, SUPPLIER TRACKING, ACTION TRACKING, SUMMARY 시트
 */
export async function generateMetalShoeExcel(cases: MetalShoeCase[], year: number): Promise<void> {
  const wb = XLSX.utils.book_new();

  // ── Sheet 1: DATA ──────────────────────────────────────────
  const dataRows = cases.map((c) => ({
    'YEAR': c.year,
    'MONTH': c.month,
    'WEEK': c.week,
    'WEEK NO': c.weekNumber,
    'DATE': c.detectionDate,
    'FACTORY': c.factory,
    'LINE': c.line,
    'MODEL': c.model,
    'PGSC': c.pgsc,
    'PO NUMBER': c.poNumber,
    'DESTINATION': c.destination,
    'ORDER QTY': c.orderQty,
    'SIZE': c.size,
    'SUPPLIER ID': c.supplierId,
    'SUPPLIER': c.supplierName,
    'COMPONENT': c.component,
    'SIDE': c.side,
    'PCS QTY': c.piecesQty,
    'C-GRADE PAIRS': c.cGradePairs,
    'X-RAY SENT': c.xraySentStatus,
    'X-RAY SENT DATE': c.xraySentDate || '',
    'X-RAY RECEIVED DATE': c.xrayReceivedDate || '',
    'METAL CONFIRM': c.metalConfirm,
    'REMARK': c.remark || '',
    'STATUS': c.status,
  }));

  const dataSheet = XLSX.utils.json_to_sheet(dataRows);
  XLSX.utils.book_append_sheet(wb, dataSheet, 'DATA');

  // ── Sheet 2: SUPPLIER TRACKING ─────────────────────────────
  const supplierMap = new Map<string, { name: string; total: number; bottom: number; upper: number; byWeek: Map<number, number> }>();
  for (const c of cases) {
    if (!supplierMap.has(c.supplierId)) {
      supplierMap.set(c.supplierId, { name: c.supplierName, total: 0, bottom: 0, upper: 0, byWeek: new Map() });
    }
    const s = supplierMap.get(c.supplierId)!;
    s.total++;
    if (c.component === 'BOTTOM') s.bottom++;
    else s.upper++;
    s.byWeek.set(c.weekNumber, (s.byWeek.get(c.weekNumber) || 0) + 1);
  }

  const weeks = [...new Set(cases.map((c) => c.weekNumber))].sort((a, b) => a - b);
  const supplierRows = Array.from(supplierMap.entries()).map(([id, data]) => {
    const row: Record<string, string | number> = {
      'SUPPLIER ID': id,
      'SUPPLIER': data.name,
      'TOTAL': data.total,
      'BOTTOM': data.bottom,
      'UPPER': data.upper,
    };
    for (const w of weeks) {
      row[`W${String(w).padStart(2, '0')}`] = data.byWeek.get(w) || 0;
    }
    return row;
  });

  const supplierSheet = XLSX.utils.json_to_sheet(supplierRows);
  XLSX.utils.book_append_sheet(wb, supplierSheet, 'SUPPLIER TRACKING');

  // ── Sheet 3: SUMMARY ───────────────────────────────────────
  const totalCases = cases.length;
  const bottomCases = cases.filter((c) => c.component === 'BOTTOM').length;
  const upperCases = cases.filter((c) => c.component === 'UPPER').length;
  const closedCases = cases.filter((c) => c.status === 'closed').length;
  const pendingCases = cases.filter((c) => c.status !== 'closed').length;

  const summaryRows = [
    { 'METRIC': 'Total Cases', 'VALUE': totalCases },
    { 'METRIC': 'Bottom Cases', 'VALUE': bottomCases },
    { 'METRIC': 'Upper Cases', 'VALUE': upperCases },
    { 'METRIC': 'Closed Cases', 'VALUE': closedCases },
    { 'METRIC': 'Pending Cases', 'VALUE': pendingCases },
    { 'METRIC': 'Total Suppliers', 'VALUE': supplierMap.size },
    { 'METRIC': 'Year', 'VALUE': year },
  ];

  const summarySheet = XLSX.utils.json_to_sheet(summaryRows);
  XLSX.utils.book_append_sheet(wb, summarySheet, 'SUMMARY');

  // ── Download ───────────────────────────────────────────────
  const fileName = `Metal_Shoe_Report_${year}.xlsx`;
  XLSX.writeFile(wb, fileName);
}
