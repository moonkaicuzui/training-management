/**
 * Google Sheets Service - Read/Write operations for employee sync.
 *
 * Uses the QIP Dashboard service account (qip-drive-sync@qip-dashboard.iam.gserviceaccount.com)
 * with spreadsheets scope for read/write access.
 *
 * Sheet column mapping (A-K):
 * A: employee_id, B: employee_name, C: department, D: position,
 * E: building, F: line, G: hire_date, H: status, I: updated_at,
 * J: _sync_source, K: _sync_timestamp
 */

import { google } from "googleapis";
import { logger } from "firebase-functions";
import * as path from "path";

// Service account key path (relative to compiled output)
const SERVICE_ACCOUNT_KEY_PATH = path.join(
  __dirname,
  "..",
  "..",
  "service-account-key.json"
);

const SHEET_NAME = "Employees";
const DATA_RANGE = `${SHEET_NAME}!A:K`;
const HEADER_ROW = [
  "employee_id",
  "employee_name",
  "department",
  "position",
  "building",
  "line",
  "hire_date",
  "status",
  "updated_at",
  "_sync_source",
  "_sync_timestamp",
];

export interface EmployeeRow {
  employee_id: string;
  employee_name: string;
  department: string;
  position: string;
  building: string;
  line: string;
  hire_date: string;
  status: string;
  updated_at: string;
  _sync_source?: string;
  _sync_timestamp?: string;
}

/**
 * Get authenticated Google Sheets client using service account
 */
function getSheetsClient() {
  const auth = new google.auth.GoogleAuth({
    keyFile: SERVICE_ACCOUNT_KEY_PATH,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
  return google.sheets({ version: "v4", auth });
}

/**
 * Convert a row array to EmployeeRow object
 */
function rowToEmployee(row: string[]): EmployeeRow {
  return {
    employee_id: (row[0] || "").trim(),
    employee_name: (row[1] || "").trim(),
    department: (row[2] || "").trim(),
    position: (row[3] || "").trim(),
    building: (row[4] || "").trim(),
    line: (row[5] || "").trim(),
    hire_date: (row[6] || "").trim(),
    status: (row[7] || "ACTIVE").trim(),
    updated_at: (row[8] || "").trim(),
    _sync_source: (row[9] || "").trim(),
    _sync_timestamp: (row[10] || "").trim(),
  };
}

/**
 * Convert EmployeeRow to a row array for Sheets API
 */
function employeeToRow(data: EmployeeRow): string[] {
  return [
    data.employee_id,
    data.employee_name,
    data.department,
    data.position,
    data.building,
    data.line,
    data.hire_date,
    data.status,
    data.updated_at,
    data._sync_source || "",
    data._sync_timestamp || "",
  ];
}

/**
 * Read all employees from the Google Sheet (skipping header row)
 */
export async function readAllEmployees(
  sheetId: string
): Promise<EmployeeRow[]> {
  const sheets = getSheetsClient();

  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: sheetId,
    range: DATA_RANGE,
  });

  const rows = response.data.values || [];
  if (rows.length <= 1) return []; // Only header or empty

  // Skip header row (row 0)
  const employees: EmployeeRow[] = [];
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const emp = rowToEmployee(row);
    if (emp.employee_id) {
      employees.push(emp);
    }
  }

  logger.info(
    `sheetsService: Read ${employees.length} employees from Sheet ${sheetId}`
  );
  return employees;
}

/**
 * Find the row number of an employee by employee_id.
 * Returns 1-based row number (for Sheets API), or null if not found.
 */
export async function findEmployeeRow(
  sheetId: string,
  employeeId: string
): Promise<number | null> {
  const sheets = getSheetsClient();

  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: sheetId,
    range: `${SHEET_NAME}!A:A`,
  });

  const rows = response.data.values || [];
  for (let i = 1; i < rows.length; i++) {
    if ((rows[i][0] || "").trim() === employeeId) {
      return i + 1; // 1-based row number
    }
  }

  return null;
}

/**
 * Update a specific row in the Sheet (1-based row number)
 */
export async function updateEmployeeRow(
  sheetId: string,
  rowNumber: number,
  data: EmployeeRow
): Promise<void> {
  const sheets = getSheetsClient();
  const range = `${SHEET_NAME}!A${rowNumber}:K${rowNumber}`;

  await sheets.spreadsheets.values.update({
    spreadsheetId: sheetId,
    range,
    valueInputOption: "RAW",
    requestBody: {
      values: [employeeToRow(data)],
    },
  });

  logger.info(
    `sheetsService: Updated row ${rowNumber} for employee ${data.employee_id}`
  );
}

/**
 * Append a new employee row at the end of the Sheet
 */
export async function appendEmployee(
  sheetId: string,
  data: EmployeeRow
): Promise<void> {
  const sheets = getSheetsClient();

  await sheets.spreadsheets.values.append({
    spreadsheetId: sheetId,
    range: DATA_RANGE,
    valueInputOption: "RAW",
    insertDataOption: "INSERT_ROWS",
    requestBody: {
      values: [employeeToRow(data)],
    },
  });

  logger.info(
    `sheetsService: Appended employee ${data.employee_id} to Sheet`
  );
}

/**
 * Ensure the Sheet has the correct header row.
 * Creates the header if the sheet is empty.
 */
export async function ensureHeader(sheetId: string): Promise<void> {
  const sheets = getSheetsClient();

  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: sheetId,
    range: `${SHEET_NAME}!A1:K1`,
  });

  const firstRow = response.data.values?.[0];
  if (!firstRow || firstRow.length === 0) {
    await sheets.spreadsheets.values.update({
      spreadsheetId: sheetId,
      range: `${SHEET_NAME}!A1:K1`,
      valueInputOption: "RAW",
      requestBody: {
        values: [HEADER_ROW],
      },
    });
    logger.info("sheetsService: Created header row");
  }
}
