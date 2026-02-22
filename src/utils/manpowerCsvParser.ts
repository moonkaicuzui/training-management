/**
 * Manpower CSV Parser
 *
 * Parses Basic Manpower CSV to extract employee-supervisor links.
 * Target columns: Employee No, Full Name, direct boss name, BUILDING
 */

import type { AqlSupervisorLink } from '@/types/aql';

export interface ManpowerParseResult {
  links: Omit<AqlSupervisorLink, 'link_id' | 'imported_at' | 'source_file'>[];
  errors: Array<{ row: number; message: string }>;
  stats: { total: number; success: number; failed: number };
}

interface ManpowerRow {
  employee_no: string;
  full_name: string;
  direct_boss_name: string;
  building: string;
  rowIndex: number;
}

/**
 * Parse CSV text, handling quoted fields and various separators.
 */
function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }

  result.push(current.trim());
  return result;
}

/**
 * Find the column index by trying various header name variations.
 */
function findColumn(headers: string[], variations: string[]): number {
  const normalized = headers.map((h) => h.toLowerCase().replace(/[^a-z0-9]/g, ''));
  for (const v of variations) {
    const target = v.toLowerCase().replace(/[^a-z0-9]/g, '');
    const idx = normalized.indexOf(target);
    if (idx >= 0) return idx;
  }
  // Partial match
  for (const v of variations) {
    const target = v.toLowerCase().replace(/[^a-z0-9]/g, '');
    const idx = normalized.findIndex((h) => h.includes(target) || target.includes(h));
    if (idx >= 0) return idx;
  }
  return -1;
}

/**
 * Parse Basic Manpower CSV and extract supervisor links.
 */
export function parseManpowerCsv(csvText: string): ManpowerParseResult {
  const lines = csvText.split(/\r?\n/).filter((line) => line.trim());

  if (lines.length < 2) {
    return {
      links: [],
      errors: [{ row: 0, message: 'CSV file is empty or has no data rows' }],
      stats: { total: 0, success: 0, failed: 0 },
    };
  }

  // Parse header
  const headers = parseCsvLine(lines[0]);
  const empNoIdx = findColumn(headers, ['Employee No', 'EmployeeNo', 'EmpNo', 'Emp No', 'employee_no']);
  const nameIdx = findColumn(headers, ['Full Name', 'FullName', 'Name', 'Employee Name', 'full_name']);
  const bossIdx = findColumn(headers, ['direct boss name', 'DirectBossName', 'Boss Name', 'Supervisor', 'direct_boss_name']);
  const buildingIdx = findColumn(headers, ['BUILDING', 'Building', 'Bldg']);

  const errors: ManpowerParseResult['errors'] = [];

  if (empNoIdx < 0) errors.push({ row: 0, message: 'Column "Employee No" not found in CSV headers' });
  if (nameIdx < 0) errors.push({ row: 0, message: 'Column "Full Name" not found in CSV headers' });
  if (bossIdx < 0) errors.push({ row: 0, message: 'Column "direct boss name" not found in CSV headers' });

  if (empNoIdx < 0 || nameIdx < 0 || bossIdx < 0) {
    return {
      links: [],
      errors,
      stats: { total: 0, success: 0, failed: errors.length },
    };
  }

  // Parse data rows
  const rows: ManpowerRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    const fields = parseCsvLine(lines[i]);
    const employee_no = fields[empNoIdx]?.trim() || '';
    const full_name = fields[nameIdx]?.trim() || '';
    const direct_boss_name = fields[bossIdx]?.trim() || '';
    const building = buildingIdx >= 0 ? (fields[buildingIdx]?.trim() || '') : '';

    if (!employee_no) {
      errors.push({ row: i + 1, message: 'Missing Employee No' });
      continue;
    }

    if (!full_name) {
      errors.push({ row: i + 1, message: `Missing Full Name for Employee No ${employee_no}` });
      continue;
    }

    rows.push({
      employee_no,
      full_name,
      direct_boss_name,
      building,
      rowIndex: i + 1,
    });
  }

  // Build name → employee_no lookup for supervisor resolution
  const nameToEmpNo = new Map<string, string>();
  for (const row of rows) {
    const normalizedName = row.full_name.toLowerCase().trim();
    if (!nameToEmpNo.has(normalizedName)) {
      nameToEmpNo.set(normalizedName, row.employee_no);
    }
  }

  // Build links
  const links: ManpowerParseResult['links'] = [];
  let successCount = 0;

  for (const row of rows) {
    if (!row.direct_boss_name) {
      // No supervisor info – skip silently (top-level employees)
      continue;
    }

    const supervisorNo = nameToEmpNo.get(row.direct_boss_name.toLowerCase().trim());

    if (!supervisorNo) {
      errors.push({
        row: row.rowIndex,
        message: `Supervisor "${row.direct_boss_name}" not found in CSV for Employee No ${row.employee_no}`,
      });
      continue;
    }

    links.push({
      employee_no: row.employee_no,
      employee_name: row.full_name,
      supervisor_no: supervisorNo,
      supervisor_name: row.direct_boss_name,
      building: row.building,
    });
    successCount++;
  }

  return {
    links,
    errors,
    stats: {
      total: rows.length,
      success: successCount,
      failed: rows.length - successCount,
    },
  };
}
