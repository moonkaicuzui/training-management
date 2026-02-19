/**
 * 5 PRS (5-Person Review System) Type Definitions
 *
 * Types for the quality inspection system where 5 PRS auditors
 * manage 104+ TQC inspectors at HWK Vietnam.
 */

// ========== Raw CSV Data ==========

/** Single row from the 5PRS CSV file */
export interface FivePrsRawRow {
  'Inspection Date': string;
  'Inspector ID': string;
  'Inspector Name': string;
  'Time': string;
  'Building': string;
  'Line': string;
  'PO No': string;
  'Item': string;
  'Model': string;
  'TQC ID': string;
  'TQC Name': string;
  'Validation Qty': string;
  'Pass Qty': string;
  'Reject Qty': string;
  'Error': string;
  [key: string]: string;
}

// ========== API Responses ==========

export interface MonthOption {
  year: number;
  month: number;
  year_month: string;
  label: string;
}

export interface MonthsResponse {
  success: boolean;
  months: MonthOption[];
  total: number;
}

export interface DataResponse {
  success: boolean;
  data: FivePrsRawRow[];
  row_count: number;
  year: number;
  month: number;
  source_file?: string;
  source: string;
}

export interface AiBriefingResponse {
  success: boolean;
  briefing: string;
  cached: boolean;
}

// ========== Processed Data ==========

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

export interface ModelRecord {
  model: string;
  totalValidation: number;
  totalReject: number;
  rejectRate: number;
  defects: Record<string, number>;
}

export interface DailyRecord {
  date: string;
  totalValidation: number;
  totalReject: number;
  rejectRate: number;
}

export interface DefectType {
  type: string;
  count: number;
  ratio: number;
}

export interface ProcessedStats {
  totalValidation: number;
  totalReject: number;
  totalRejectRate: number;
  avgDailyValidation: number;
  totalDays: number;
  highRiskTqcCount: number;
}

export interface ProcessedData {
  stats: ProcessedStats;
  tqcRecords: TqcRecord[];
  buildingRecords: BuildingRecord[];
  modelRecords: ModelRecord[];
  dailyRecords: DailyRecord[];
  defectTypes: DefectType[];
  firstDate: string;
  lastDate: string;
}

// ========== AI Briefing ==========

export interface AiBriefingRequest {
  date: string;
  yearMonth: string;
  firstDate: string;
  lastDate: string;
  lang: string;
  stats: {
    totalValidation: number;
    totalReject: number;
    totalRejectRate: number;
    avgDailyValidation: number;
  };
  topTqcIssues: Array<{
    name: string;
    id: string;
    rejectRate: number;
    totalReject: number;
    totalValidation: number;
    buildings: string[];
    defects: Array<{ type: string; count: number }>;
    mainDefect: string;
  }>;
  topDefects: Array<{
    type: string;
    count: number;
    ratio: number;
  }>;
  topDefectModels?: Array<{
    type: string;
    models: Array<{ model: string; count: number }>;
  }>;
  modelDefects?: Array<{
    model: string;
    rejectRate: number;
    totalReject: number;
    totalValidation: number;
    defects: Array<{ type: string; count: number }>;
  }>;
  buildingIssues: Array<{
    building: string;
    rejectRate: number;
    totalValidation: number;
  }>;
  riskItems: {
    highRiskPOs: string[];
    highRiskBuildings: string[];
    highRiskLines: string[];
  };
}
