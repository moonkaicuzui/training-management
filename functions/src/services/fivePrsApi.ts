/**
 * 5PRS Google Apps Script API Client (Cloud Functions / Node.js)
 *
 * Fetches inspection data from the legacy GAS web-app endpoint and
 * processes raw CSV rows into aggregated records for the recommendation engine.
 */

import { logger } from "firebase-functions";

// ========== GAS API ==========

const GAS_API_URL =
  "https://script.google.com/macros/s/AKfycbxS2020t2o--mUb-o-ag-OJM5WUGsjZEsQq6YcALTyTxJOsM9Diuqpk-sDswAuuWrf_/exec";

// ========== Types (server-side copies, no frontend imports) ==========

export interface MonthOption {
  year: number;
  month: number;
  year_month: string;
  label: string;
}

export interface FivePrsRawRow {
  "Inspection Date": string;
  "Inspector ID": string;
  "Inspector Name": string;
  Time: string;
  Building: string;
  Line: string;
  "PO No": string;
  Item: string;
  Model: string;
  "TQC ID": string;
  "TQC Name": string;
  "Validation Qty": string;
  "Pass Qty": string;
  "Reject Qty": string;
  Error: string;
  [key: string]: string;
}

export interface TqcRecord {
  id: string;
  name: string;
  buildings: string[];
  totalValidation: number;
  totalReject: number;
  rejectRate: number;
  defects: Record<string, number>;
  mainDefect: string;
}

export interface BuildingRecord {
  building: string;
  totalValidation: number;
  totalReject: number;
  rejectRate: number;
  defects: Record<string, number>;
}

export interface DefectType {
  type: string;
  count: number;
  ratio: number;
}

export interface ProcessedData {
  tqcRecords: TqcRecord[];
  buildingRecords: BuildingRecord[];
  defectTypes: DefectType[];
  totalValidation: number;
  totalReject: number;
}

// ========== API Functions ==========

/**
 * Fetches the list of available months from the 5PRS GAS API.
 */
export async function fetchMonthList(): Promise<MonthOption[]> {
  const url = `${GAS_API_URL}?action=getMonths`;
  logger.info(`fetchMonthList: GET ${url}`);

  const response = await fetch(url, {
    method: "GET",
    headers: { Accept: "application/json" },
    redirect: "follow",
  });

  if (!response.ok) {
    throw new Error(
      `fetchMonthList failed: ${response.status} ${response.statusText}`
    );
  }

  const json = await response.json();

  if (!json.success) {
    throw new Error(`fetchMonthList API error: ${JSON.stringify(json)}`);
  }

  logger.info(`fetchMonthList: received ${json.months?.length ?? 0} months`);
  return json.months as MonthOption[];
}

/**
 * Fetches raw inspection data for a given month (YYYY-MM).
 */
export async function fetchMonthData(
  yearMonth: string
): Promise<FivePrsRawRow[]> {
  const url = `${GAS_API_URL}?action=getData&month=${yearMonth}`;
  logger.info(`fetchMonthData: GET ${url}`);

  const response = await fetch(url, {
    method: "GET",
    headers: { Accept: "application/json" },
    redirect: "follow",
  });

  if (!response.ok) {
    throw new Error(
      `fetchMonthData failed: ${response.status} ${response.statusText}`
    );
  }

  const json = await response.json();

  if (!json.success) {
    throw new Error(`fetchMonthData API error: ${JSON.stringify(json)}`);
  }

  logger.info(
    `fetchMonthData(${yearMonth}): received ${json.row_count ?? json.data?.length ?? 0} rows`
  );
  return json.data as FivePrsRawRow[];
}

// ========== Date & Defect Helpers ==========

function parseDate(dateValue: string): Date | null {
  if (!dateValue) return null;
  const standardDate = new Date(dateValue);
  if (!isNaN(standardDate.getTime())) return standardDate;

  const parts = dateValue.match(/(\d+)/g);
  if (parts && parts.length === 3) {
    let y = parts[0].length === 4 ? parts[0] : parts[2];
    const m = parts[0].length === 4 ? parts[1] : parts[0];
    const d = parts[0].length === 4 ? parts[2] : parts[1];
    if (y.length === 2) y = `20${y}`;
    const date = new Date(`${y}-${m}-${d}`);
    if (!isNaN(date.getTime())) return date;
  }
  return null;
}

function parseDefectTypes(errorString: string): string[] {
  if (
    !errorString ||
    typeof errorString !== "string" ||
    errorString.trim() === ""
  )
    return [];
  return errorString
    .split(",")
    .map((d) => d.trim())
    .filter(Boolean);
}

// ========== Data Processing (server-side port) ==========

/**
 * Processes raw 5PRS rows into aggregated TQC, building, and defect records.
 *
 * This is a simplified server-side port of the frontend
 * `src/utils/fivePrsDataProcessor.ts processRawData()`.
 * It omits model/daily/PO/line records that are not needed by the
 * recommendation engine.
 */
export function processRawData(rows: FivePrsRawRow[]): ProcessedData {
  let totalValidation = 0;
  let totalReject = 0;

  const tqcMap: Record<
    string,
    {
      id: string;
      name: string;
      buildings: Set<string>;
      totalValidation: number;
      totalReject: number;
      defects: Record<string, number>;
    }
  > = {};

  const buildingMap: Record<
    string,
    {
      totalValidation: number;
      totalReject: number;
      defects: Record<string, number>;
    }
  > = {};

  const defectMap: Record<string, number> = {};

  for (const row of rows) {
    const validationQty = parseInt(row["Validation Qty"]) || 0;
    const rejectQty = parseInt(row["Reject Qty"]) || 0;
    if (validationQty === 0 && rejectQty === 0) continue;

    totalValidation += validationQty;
    totalReject += rejectQty;

    // TQC aggregation
    if (row["TQC ID"] && row["TQC Name"]) {
      const tqcKey = `${row["TQC ID"]}-${row["TQC Name"]}`;
      if (!tqcMap[tqcKey]) {
        tqcMap[tqcKey] = {
          id: row["TQC ID"],
          name: row["TQC Name"],
          buildings: new Set(),
          totalValidation: 0,
          totalReject: 0,
          defects: {},
        };
      }
      const tqc = tqcMap[tqcKey];
      tqc.totalValidation += validationQty;
      tqc.totalReject += rejectQty;
      tqc.buildings.add(row["Building"] || "Unknown");

      if (row["Error"] && rejectQty > 0) {
        const defectList = parseDefectTypes(row["Error"]);
        const perType = rejectQty / (defectList.length || 1);
        for (const defect of defectList) {
          tqc.defects[defect] = (tqc.defects[defect] || 0) + perType;
          defectMap[defect] = (defectMap[defect] || 0) + perType;
        }
      }
    }

    // Building aggregation
    const building = row["Building"] || "Unknown";
    if (!buildingMap[building]) {
      buildingMap[building] = {
        totalValidation: 0,
        totalReject: 0,
        defects: {},
      };
    }
    buildingMap[building].totalValidation += validationQty;
    buildingMap[building].totalReject += rejectQty;
    if (row["Error"] && rejectQty > 0) {
      const defectList = parseDefectTypes(row["Error"]);
      for (const defect of defectList) {
        buildingMap[building].defects[defect] =
          (buildingMap[building].defects[defect] || 0) +
          rejectQty / (defectList.length || 1);
      }
    }
  }

  // Build TQC records
  const tqcRecords: TqcRecord[] = Object.values(tqcMap)
    .map((t) => {
      const rejectRate =
        t.totalValidation > 0
          ? (t.totalReject / t.totalValidation) * 100
          : 0;
      const mainDefectEntry = Object.entries(t.defects).sort(
        ([, a], [, b]) => b - a
      )[0];
      return {
        id: t.id,
        name: t.name,
        buildings: Array.from(t.buildings),
        totalValidation: t.totalValidation,
        totalReject: t.totalReject,
        rejectRate: Math.round(rejectRate * 100) / 100,
        defects: t.defects,
        mainDefect: mainDefectEntry ? mainDefectEntry[0] : "N/A",
      };
    })
    .sort((a, b) => b.rejectRate - a.rejectRate);

  // Build building records
  const buildingRecords: BuildingRecord[] = Object.entries(buildingMap)
    .map(([bldg, b]) => ({
      building: bldg,
      totalValidation: b.totalValidation,
      totalReject: b.totalReject,
      rejectRate:
        b.totalValidation > 0
          ? Math.round((b.totalReject / b.totalValidation) * 10000) / 100
          : 0,
      defects: b.defects,
    }))
    .sort((a, b) => b.rejectRate - a.rejectRate);

  // Build defect types
  const totalDefectCount = Object.values(defectMap).reduce(
    (a, b) => a + b,
    0
  );
  const defectTypes: DefectType[] = Object.entries(defectMap)
    .map(([type, count]) => ({
      type,
      count: Math.round(count),
      ratio:
        totalDefectCount > 0
          ? Math.round((count / totalDefectCount) * 1000) / 10
          : 0,
    }))
    .sort((a, b) => b.count - a.count);

  return {
    tqcRecords,
    buildingRecords,
    defectTypes,
    totalValidation,
    totalReject,
  };
}

// Re-export parseDate and parseDefectTypes for the recommendation engine
export { parseDate as parseDateValue, parseDefectTypes };
