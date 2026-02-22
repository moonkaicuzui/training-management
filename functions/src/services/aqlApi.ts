/**
 * AQL Google Apps Script API Client (Cloud Functions / Node.js)
 *
 * Fetches AQL inspection data from the GAS web-app endpoint.
 * Follows the same pattern as fivePrsApi.ts.
 */

import { logger } from "firebase-functions";

// ========== GAS API ==========
// NOTE: Replace with actual AQL GAS API URL once the GAS script is deployed
const AQL_GAS_API_URL =
  process.env.AQL_GAS_API_URL ||
  "https://script.google.com/macros/s/AKfycbyf_hQLMVYJsU_HLC52cukikTgvJeDE3gBWQyzOmdFm1vl7YpDrOyxq__sthgmL48vjkA/exec";

// ========== Types (server-side copies) ==========

export interface AqlMonthOption {
  year: number;
  month: number;
  year_month: string;
  label: string;
}

export interface AqlRawRow {
  "EMPLOYEE NO": string;
  "OFFICIAL INSPECTOR": string;
  RESULT: string;
  "PO NO 1.": string;
  BUILDING: string;
  LINE: string;
  DESCRIPTION: string;
  DATE: string;
  MODEL: string;
  MONTH: string;
  [key: string]: string;
}

// ========== API Functions ==========

export async function fetchAqlMonthList(): Promise<AqlMonthOption[]> {
  const url = `${AQL_GAS_API_URL}?action=getMonths`;
  logger.info(`fetchAqlMonthList: GET ${url}`);

  const response = await fetch(url, {
    method: "GET",
    headers: { Accept: "application/json" },
    redirect: "follow",
  });

  if (!response.ok) {
    throw new Error(
      `fetchAqlMonthList failed: ${response.status} ${response.statusText}`
    );
  }

  const json = await response.json();

  if (!json.success) {
    throw new Error(`fetchAqlMonthList API error: ${JSON.stringify(json)}`);
  }

  logger.info(
    `fetchAqlMonthList: received ${json.months?.length ?? 0} months`
  );
  return json.months as AqlMonthOption[];
}

export interface ManpowerRow {
  employee_no: string;
  full_name: string;
  direct_boss_name: string;
  building: string;
}

export async function fetchAqlManpower(): Promise<ManpowerRow[]> {
  const url = `${AQL_GAS_API_URL}?action=getManpower`;
  logger.info(`fetchAqlManpower: GET ${url}`);

  const response = await fetch(url, {
    method: "GET",
    headers: { Accept: "application/json" },
    redirect: "follow",
  });

  if (!response.ok) {
    throw new Error(
      `fetchAqlManpower failed: ${response.status} ${response.statusText}`
    );
  }

  const json = await response.json();

  if (!json.success) {
    throw new Error(`fetchAqlManpower API error: ${JSON.stringify(json)}`);
  }

  logger.info(
    `fetchAqlManpower: received ${json.row_count ?? json.data?.length ?? 0} rows from ${json.file_name ?? "unknown"}`
  );
  return json.data as ManpowerRow[];
}

export async function fetchAqlMonthData(
  yearMonth: string
): Promise<AqlRawRow[]> {
  const url = `${AQL_GAS_API_URL}?action=getData&month=${yearMonth}`;
  logger.info(`fetchAqlMonthData: GET ${url}`);

  const response = await fetch(url, {
    method: "GET",
    headers: { Accept: "application/json" },
    redirect: "follow",
  });

  if (!response.ok) {
    throw new Error(
      `fetchAqlMonthData failed: ${response.status} ${response.statusText}`
    );
  }

  const json = await response.json();

  if (!json.success) {
    throw new Error(`fetchAqlMonthData API error: ${JSON.stringify(json)}`);
  }

  logger.info(
    `fetchAqlMonthData(${yearMonth}): received ${json.row_count ?? json.data?.length ?? 0} rows`
  );
  return json.data as AqlRawRow[];
}
