/**
 * Google Drive Service - Fetches files from Google Drive using a service account.
 *
 * Uses the QIP Dashboard service account (qip-drive-sync@qip-dashboard.iam.gserviceaccount.com)
 * which has read access to the monthly_data folder in Google Drive.
 */

import { google } from "googleapis";
import { logger } from "firebase-functions";
import * as path from "path";

// Monthly data folder ID in Google Drive
const MONTHLY_DATA_FOLDER_ID = "1yFbEIjfpLgPKB7CQhTWyrdKLkn55NlXv";

// Service account key path (relative to compiled output)
const SERVICE_ACCOUNT_KEY_PATH = path.join(
  __dirname,
  "..",
  "..",
  "service-account-key.json"
);

export interface ManpowerRow {
  employee_no: string;
  full_name: string;
  direct_boss_name: string;
  building: string;
  role_type_std: string;
  stop_working_date: string;
  entrance_date: string;
}

/**
 * Get authenticated Google Drive client using service account
 */
function getDriveClient() {
  const auth = new google.auth.GoogleAuth({
    keyFile: SERVICE_ACCOUNT_KEY_PATH,
    scopes: ["https://www.googleapis.com/auth/drive.readonly"],
  });
  return google.drive({ version: "v3", auth });
}

/**
 * Find the most recent basic_manpower_data.csv in the monthly_data folder.
 * Searches subfolders sorted by name descending (most recent first).
 */
async function findLatestManpowerFile(): Promise<{
  fileId: string;
  fileName: string;
  folderName: string;
} | null> {
  const drive = getDriveClient();

  // List subfolders in monthly_data folder
  const foldersRes = await drive.files.list({
    q: `'${MONTHLY_DATA_FOLDER_ID}' in parents and mimeType = 'application/vnd.google-apps.folder' and trashed = false`,
    fields: "files(id, name)",
    orderBy: "name desc",
    pageSize: 24,
  });

  const folders = foldersRes.data.files || [];
  logger.info(
    `driveService: Found ${folders.length} subfolders in monthly_data`
  );

  // Search each subfolder for basic_manpower_data.csv (most recent first)
  for (const folder of folders) {
    const filesRes = await drive.files.list({
      q: `'${folder.id}' in parents and name = 'basic_manpower_data.csv' and trashed = false`,
      fields: "files(id, name)",
      pageSize: 1,
    });

    const files = filesRes.data.files || [];
    if (files.length > 0) {
      logger.info(
        `driveService: Found manpower CSV in folder ${folder.name}: ${files[0].name} (${files[0].id})`
      );
      return {
        fileId: files[0].id!,
        fileName: files[0].name!,
        folderName: folder.name!,
      };
    }
  }

  return null;
}

/**
 * Download a CSV file from Drive and parse it into rows.
 */
async function downloadCsvFile(fileId: string): Promise<string> {
  const drive = getDriveClient();

  const response = await drive.files.get(
    { fileId, alt: "media" },
    { responseType: "text" }
  );

  return response.data as string;
}

/**
 * Parse CSV content into ManpowerRow objects.
 * Handles quoted fields and various CSV edge cases.
 */
function parseCsvToManpowerRows(csvContent: string): ManpowerRow[] {
  const lines = csvContent.split("\n");
  if (lines.length < 2) return [];

  // Parse header to find column indices
  const headers = parseCsvLine(lines[0]);
  const employeeNoIdx = headers.findIndex(
    (h) => h.trim().toLowerCase() === "employee no"
  );
  const fullNameIdx = headers.findIndex(
    (h) => h.trim().toLowerCase() === "full name"
  );
  const directBossIdx = headers.findIndex(
    (h) => h.trim().toLowerCase() === "direct boss name"
  );
  const buildingIdx = headers.findIndex(
    (h) => h.trim().toLowerCase() === "building"
  );
  const roleTypeStdIdx = headers.findIndex(
    (h) => h.trim().toLowerCase() === "role type std"
  );
  const stopWorkingDateIdx = headers.findIndex(
    (h) => h.trim().toLowerCase() === "stop working date"
  );
  const entranceDateIdx = headers.findIndex(
    (h) => h.trim().toLowerCase() === "entrance date"
  );

  if (employeeNoIdx === -1 || fullNameIdx === -1) {
    logger.warn(
      "driveService: CSV missing required columns. Headers found:",
      headers
    );
    return [];
  }

  const rows: ManpowerRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const cols = parseCsvLine(line);
    const employeeNo = (cols[employeeNoIdx] || "").trim();
    const fullName = (cols[fullNameIdx] || "").trim();

    if (!employeeNo || !fullName) continue;

    rows.push({
      employee_no: employeeNo,
      full_name: fullName,
      direct_boss_name:
        directBossIdx >= 0 ? (cols[directBossIdx] || "").trim() : "",
      building: buildingIdx >= 0 ? (cols[buildingIdx] || "").trim() : "",
      role_type_std:
        roleTypeStdIdx >= 0 ? (cols[roleTypeStdIdx] || "").trim() : "",
      stop_working_date:
        stopWorkingDateIdx >= 0 ? (cols[stopWorkingDateIdx] || "").trim() : "",
      entrance_date:
        entranceDateIdx >= 0 ? (cols[entranceDateIdx] || "").trim() : "",
    });
  }

  return rows;
}

/**
 * Parse a single CSV line handling quoted fields.
 */
function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (i + 1 < line.length && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        current += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === ",") {
        result.push(current);
        current = "";
      } else {
        current += ch;
      }
    }
  }
  result.push(current);
  return result;
}

/**
 * Fetch the latest manpower data from Google Drive.
 * Returns parsed ManpowerRow array.
 */
export async function fetchManpowerFromDrive(): Promise<{
  data: ManpowerRow[];
  file_name: string;
  folder_name: string;
}> {
  logger.info("driveService: Fetching manpower data from Google Drive...");

  const fileInfo = await findLatestManpowerFile();
  if (!fileInfo) {
    throw new Error(
      "No basic_manpower_data.csv found in monthly_data folder on Google Drive"
    );
  }

  const csvContent = await downloadCsvFile(fileInfo.fileId);
  const rows = parseCsvToManpowerRows(csvContent);

  logger.info(
    `driveService: Parsed ${rows.length} manpower rows from ${fileInfo.folderName}/${fileInfo.fileName}`
  );

  return {
    data: rows,
    file_name: fileInfo.fileName,
    folder_name: fileInfo.folderName,
  };
}
