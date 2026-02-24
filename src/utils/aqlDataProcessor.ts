/**
 * AQL Data Processor
 *
 * Processes raw AQL API data into aggregated records for analysis.
 * Groups by EMPLOYEE NO and calculates fail rates, defect distributions.
 */

import type {
  AqlRawRow,
  AqlProcessedData,
  AqlInspectorRecord,
} from '@/types/aql';

// ========== Defect Parsing ==========

/**
 * Parses AQL DESCRIPTION field into individual defect types.
 * Example: "Off Center(5), Poor Shape(3)" → ["Off Center", "Poor Shape"]
 */
export function parseAqlDescription(description: string): string[] {
  if (!description || typeof description !== 'string' || description.trim() === '') {
    return [];
  }

  return description
    .split(',')
    .map((part) => {
      // Remove quantity in parentheses: "Off Center(5)" → "Off Center"
      return part.replace(/\(\d+\)/g, '').trim();
    })
    .filter(Boolean);
}

/**
 * Parses defect counts from DESCRIPTION field.
 * Example: "Off Center(5), Poor Shape(3)" → { "Off Center": 5, "Poor Shape": 3 }
 */
function parseDefectCounts(description: string): Record<string, number> {
  if (!description || typeof description !== 'string' || description.trim() === '') {
    return {};
  }

  const counts: Record<string, number> = {};
  const parts = description.split(',');

  for (const part of parts) {
    const trimmed = part.trim();
    if (!trimmed) continue;

    // Match "DefectName(count)" or just "DefectName"
    const match = trimmed.match(/^(.+?)(?:\((\d+)\))?$/);
    if (match) {
      const name = match[1].trim();
      const count = match[2] ? parseInt(match[2], 10) : 1;
      if (name) {
        counts[name] = (counts[name] || 0) + count;
      }
    }
  }

  return counts;
}

// ========== Main Processing ==========

/**
 * @param rows Raw AQL data rows
 * @param employeeMap Optional map of employee_id → employee_name from HR data.
 *   Used to resolve inspector names from EMPLOYEE NO instead of OFFICIAL INSPECTOR.
 */
export function processAqlRawData(
  rows: AqlRawRow[],
  employeeMap?: Map<string, string>
): AqlProcessedData {
  if (!rows || rows.length === 0) {
    return {
      stats: { total: 0, pass: 0, fail: 0, fail_rate: 0, inspectors: 0, failing_inspectors: 0 },
      inspectorRecords: [],
      buildingRecords: [],
      defectTypes: [],
    };
  }

  // Group by EMPLOYEE NO
  const inspectorMap: Record<string, {
    employee_no: string;
    employee_name: string;
    tqc_num: string;
    official_inspector: string;
    buildings: Set<string>;
    total: number;
    pass: number;
    fail: number;
    defects: Record<string, number>;
    po_numbers: Set<string>;
  }> = {};

  const buildingMap: Record<string, { total: number; fail: number }> = {};
  const globalDefectMap: Record<string, number> = {};

  let totalInspections = 0;
  let totalPass = 0;
  let totalFail = 0;

  for (const row of rows) {
    const employeeNo = row['EMPLOYEE NO']?.trim();
    if (!employeeNo) continue;

    const result = (row['RESULT'] || '').trim().toUpperCase();
    const isFail = result === 'FAIL';
    const isPass = result === 'PASS';

    if (!isFail && !isPass) continue;

    totalInspections++;
    if (isPass) totalPass++;
    if (isFail) totalFail++;

    // Inspector aggregation
    if (!inspectorMap[employeeNo]) {
      const tqcNum = (row['TQC NUM'] || '').trim();
      const officialInspector = (row['OFFICIAL INSPECTOR'] || '').trim();
      // Resolve name: HR employee data → TQC NUM → EMPLOYEE NO fallback
      const resolvedName = employeeMap?.get(employeeNo) || tqcNum || employeeNo;

      inspectorMap[employeeNo] = {
        employee_no: employeeNo,
        employee_name: resolvedName,
        tqc_num: tqcNum,
        official_inspector: officialInspector,
        buildings: new Set(),
        total: 0,
        pass: 0,
        fail: 0,
        defects: {},
        po_numbers: new Set(),
      };
    }

    const inspector = inspectorMap[employeeNo];
    inspector.total++;
    if (isPass) inspector.pass++;
    if (isFail) {
      inspector.fail++;
      const poNo = (row['PO NO 1.'] || '').trim();
      if (poNo) inspector.po_numbers.add(poNo);

      // Parse defects from DESCRIPTION
      const defectCounts = parseDefectCounts(row['DESCRIPTION'] || '');
      for (const [defect, count] of Object.entries(defectCounts)) {
        inspector.defects[defect] = (inspector.defects[defect] || 0) + count;
        globalDefectMap[defect] = (globalDefectMap[defect] || 0) + count;
      }

      // If no defects parsed from DESCRIPTION, count as "Unspecified"
      if (Object.keys(defectCounts).length === 0) {
        const fallback = 'Unspecified';
        inspector.defects[fallback] = (inspector.defects[fallback] || 0) + 1;
        globalDefectMap[fallback] = (globalDefectMap[fallback] || 0) + 1;
      }
    }

    const building = (row['BUILDING'] || 'Unknown').trim();
    inspector.buildings.add(building);

    // Building aggregation
    if (!buildingMap[building]) {
      buildingMap[building] = { total: 0, fail: 0 };
    }
    buildingMap[building].total++;
    if (isFail) buildingMap[building].fail++;
  }

  // Build inspector records
  const inspectorRecords: AqlInspectorRecord[] = Object.values(inspectorMap)
    .map((i) => ({
      employee_no: i.employee_no,
      employee_name: i.employee_name,
      tqc_num: i.tqc_num,
      official_inspector: i.official_inspector,
      buildings: Array.from(i.buildings),
      total_inspections: i.total,
      pass_count: i.pass,
      fail_count: i.fail,
      fail_rate: i.total > 0 ? Math.round((i.fail / i.total) * 10000) / 100 : 0,
      parsed_defects: i.defects,
      po_numbers: Array.from(i.po_numbers),
    }))
    .sort((a, b) => b.fail_rate - a.fail_rate);

  // Build building records
  const buildingRecords = Object.entries(buildingMap)
    .map(([building, b]) => ({
      building,
      total: b.total,
      fail_count: b.fail,
      fail_rate: b.total > 0 ? Math.round((b.fail / b.total) * 10000) / 100 : 0,
    }))
    .sort((a, b) => b.fail_rate - a.fail_rate);

  // Build defect types
  const defectTypes = Object.entries(globalDefectMap)
    .map(([type, count]) => ({ type, count }))
    .sort((a, b) => b.count - a.count);

  const failingInspectors = inspectorRecords.filter((i) => i.fail_count > 0).length;

  return {
    stats: {
      total: totalInspections,
      pass: totalPass,
      fail: totalFail,
      fail_rate: totalInspections > 0 ? Math.round((totalFail / totalInspections) * 10000) / 100 : 0,
      inspectors: inspectorRecords.length,
      failing_inspectors: failingInspectors,
    },
    inspectorRecords,
    buildingRecords,
    defectTypes,
  };
}
