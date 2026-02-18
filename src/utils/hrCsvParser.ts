import type { Employee } from '@/types';
import {
  resolvePosition,
  resolveDepartment,
  resolveBuilding,
  convertHRDate,
  getEmployeeStatus,
} from '@/data/hrPositionMapping';

export interface ParseResult {
  employees: Omit<Employee, 'updated_at'>[];
  errors: ParseError[];
  warnings: ParseWarning[];
  stats: {
    total: number;
    success: number;
    failed: number;
    active: number;
    inactive: number;
  };
}

export interface ParseError {
  row: number;
  message: string;
}

export interface ParseWarning {
  row: number;
  field: string;
  message: string;
}

/**
 * Parse a CSV line handling quoted fields with commas
 */
function parseCsvLine(line: string): string[] {
  const fields: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && i + 1 < line.length && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      fields.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  fields.push(current.trim());
  return fields;
}

/**
 * Find column index by header name (case-insensitive, trimmed)
 */
function findColumnIndex(headers: string[], ...names: string[]): number {
  for (const name of names) {
    const normalized = name.trim().toUpperCase();
    const idx = headers.findIndex(
      (h) => h.trim().toUpperCase() === normalized
    );
    if (idx !== -1) return idx;
  }
  return -1;
}

/**
 * Parse HR CSV text into Employee array
 */
export function parseHRCsv(csvText: string): ParseResult {
  const lines = csvText.split(/\r?\n/).filter((line) => line.trim() !== '');

  if (lines.length < 2) {
    return {
      employees: [],
      errors: [{ row: 0, message: 'CSV 파일에 데이터가 없습니다' }],
      warnings: [],
      stats: { total: 0, success: 0, failed: 0, active: 0, inactive: 0 },
    };
  }

  const headers = parseCsvLine(lines[0]);

  // Locate required columns
  const colEmployeeNo = findColumnIndex(headers, 'Employee No');
  const colFullName = findColumnIndex(headers, 'Full Name');
  const colBuilding = findColumnIndex(headers, 'BUILDING');
  const colPosition3rd = findColumnIndex(
    headers,
    'QIP POSITION 3RD  NAME',
    'QIP POSITION 3RD NAME'
  );
  const colEntranceDate = findColumnIndex(headers, 'Entrance Date');
  const colStopWorking = findColumnIndex(
    headers,
    'Stop working Date',
    'Stop Working Date'
  );

  // Validate required columns
  const missingCols: string[] = [];
  if (colEmployeeNo === -1) missingCols.push('Employee No');
  if (colFullName === -1) missingCols.push('Full Name');

  if (missingCols.length > 0) {
    return {
      employees: [],
      errors: [
        {
          row: 0,
          message: `필수 컬럼을 찾을 수 없습니다: ${missingCols.join(', ')}`,
        },
      ],
      warnings: [],
      stats: { total: 0, success: 0, failed: 0, active: 0, inactive: 0 },
    };
  }

  const employees: Omit<Employee, 'updated_at'>[] = [];
  const errors: ParseError[] = [];
  const warnings: ParseWarning[] = [];
  let active = 0;
  let inactive = 0;

  for (let i = 1; i < lines.length; i++) {
    const fields = parseCsvLine(lines[i]);
    const rowNum = i + 1;

    const employeeId = fields[colEmployeeNo] || '';
    const employeeName = fields[colFullName] || '';

    // Skip rows without required fields
    if (!employeeId || !employeeName) {
      errors.push({
        row: rowNum,
        message: `필수 필드 누락 (사번: "${employeeId}", 이름: "${employeeName}")`,
      });
      continue;
    }

    // Parse optional fields
    const rawBuilding = colBuilding !== -1 ? fields[colBuilding] || '' : '';
    const rawPosition =
      colPosition3rd !== -1 ? fields[colPosition3rd] || '' : '';
    const rawEntranceDate =
      colEntranceDate !== -1 ? fields[colEntranceDate] || '' : '';
    const rawStopWorking =
      colStopWorking !== -1 ? fields[colStopWorking] || '' : '';

    // Resolve mapped values with warnings
    const building = rawBuilding ? resolveBuilding(rawBuilding) : 'BUILDING_A';
    if (rawBuilding && building === 'BUILDING_A' && rawBuilding.trim().toUpperCase() !== 'A') {
      warnings.push({
        row: rowNum,
        field: 'building',
        message: `"${rawBuilding}" → 기본값 BUILDING_A 적용`,
      });
    }

    const position = rawPosition ? resolvePosition(rawPosition) : 'QIP_TQC';
    if (rawPosition && position === 'QIP_TQC') {
      // Check if it's actually a known TQC mapping or a fallback
      const normalized = rawPosition.trim().toUpperCase();
      const knownTQC = [
        'ASSEMBLY FULL PROCESS QUALITY',
        'ASSEMBLY PROCESS QUALITY',
        'BOTTOM PROCESS QUALITY',
        'CUTTING PROCESS QUALITY',
        'MTL INCOMING QUALITY',
        'OSC PROCESS QUALITY',
        'STITCHING PROCESS QUALITY',
        'STOCKFIT PROCESS QUALITY',
      ];
      if (!knownTQC.includes(normalized)) {
        warnings.push({
          row: rowNum,
          field: 'position',
          message: `"${rawPosition}" → 기본값 QIP_TQC 적용`,
        });
      }
    }

    const department = rawPosition
      ? resolveDepartment(rawPosition)
      : 'OFFICE';
    const hireDate = rawEntranceDate ? convertHRDate(rawEntranceDate) : '';
    const status = getEmployeeStatus(rawStopWorking || null);

    if (status === 'ACTIVE') active++;
    else inactive++;

    employees.push({
      employee_id: employeeId,
      employee_name: employeeName,
      department,
      position,
      building,
      line: '',
      hire_date: hireDate,
      status,
    });
  }

  return {
    employees,
    errors,
    warnings,
    stats: {
      total: lines.length - 1,
      success: employees.length,
      failed: errors.length,
      active,
      inactive,
    },
  };
}
