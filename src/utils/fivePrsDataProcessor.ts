/**
 * 5 PRS Data Processor
 *
 * Processes raw CSV data into aggregated statistics for dashboard display.
 * Ported from the original dataProcessor.js with TypeScript types.
 */

import type {
  FivePrsRawRow,
  TqcRecord,
  BuildingRecord,
  ModelRecord,
  DailyRecord,
  DefectType,
  ProcessedData,
  ProcessedStats,
  AiBriefingRequest,
} from '@/types/fivePrs';

// ========== Date Parsing ==========

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
  if (!errorString || typeof errorString !== 'string' || errorString.trim() === '') return [];
  return errorString.split(',').map((d) => d.trim()).filter(Boolean);
}

// ========== Main Processing ==========

export function processRawData(rows: FivePrsRawRow[]): ProcessedData {
  let totalValidation = 0;
  let totalReject = 0;

  const tqcMap: Record<string, {
    id: string;
    name: string;
    buildings: Set<string>;
    totalValidation: number;
    totalReject: number;
    defects: Record<string, number>;
  }> = {};

  const buildingMap: Record<string, {
    totalValidation: number;
    totalReject: number;
    defects: Record<string, number>;
  }> = {};

  const modelMap: Record<string, {
    totalValidation: number;
    totalReject: number;
    defects: Record<string, number>;
  }> = {};

  const dailyMap: Record<string, {
    totalValidation: number;
    totalReject: number;
  }> = {};

  const defectMap: Record<string, number> = {};

  // Also track PO/Line/Building for risk items
  const poMap: Record<string, { totalValidation: number; totalReject: number }> = {};
  const lineMap: Record<string, { totalValidation: number; totalReject: number }> = {};

  rows.forEach((row) => {
    const validationQty = parseInt(row['Validation Qty']) || 0;
    const rejectQty = parseInt(row['Reject Qty']) || 0;
    if (validationQty === 0 && rejectQty === 0) return;

    totalValidation += validationQty;
    totalReject += rejectQty;

    // Daily
    const date = parseDate(row['Inspection Date']);
    if (date) {
      const dateStr = date.toISOString().split('T')[0];
      if (!dailyMap[dateStr]) {
        dailyMap[dateStr] = { totalValidation: 0, totalReject: 0 };
      }
      dailyMap[dateStr].totalValidation += validationQty;
      dailyMap[dateStr].totalReject += rejectQty;
    }

    // TQC
    if (row['TQC ID'] && row['TQC Name']) {
      const tqcKey = `${row['TQC ID']}-${row['TQC Name']}`;
      if (!tqcMap[tqcKey]) {
        tqcMap[tqcKey] = {
          id: row['TQC ID'],
          name: row['TQC Name'],
          buildings: new Set(),
          totalValidation: 0,
          totalReject: 0,
          defects: {},
        };
      }
      const tqc = tqcMap[tqcKey];
      tqc.totalValidation += validationQty;
      tqc.totalReject += rejectQty;
      tqc.buildings.add(row['Building'] || 'Unknown');

      if (row['Error'] && rejectQty > 0) {
        const defectList = parseDefectTypes(row['Error']);
        const perType = defectList.length > 0 ? rejectQty / defectList.length : 0;
        defectList.forEach((defect) => {
          tqc.defects[defect] = (tqc.defects[defect] || 0) + perType;
          defectMap[defect] = (defectMap[defect] || 0) + perType;
        });
      }
    }

    // Building
    const building = row['Building'] || 'Unknown';
    if (!buildingMap[building]) {
      buildingMap[building] = { totalValidation: 0, totalReject: 0, defects: {} };
    }
    buildingMap[building].totalValidation += validationQty;
    buildingMap[building].totalReject += rejectQty;
    if (row['Error'] && rejectQty > 0) {
      const defectList = parseDefectTypes(row['Error']);
      if (defectList.length > 0) {
        defectList.forEach((defect) => {
          buildingMap[building].defects[defect] =
            (buildingMap[building].defects[defect] || 0) + rejectQty / defectList.length;
        });
      }
    }

    // Model
    const model = row['Model'] || 'Unknown';
    if (!modelMap[model]) {
      modelMap[model] = { totalValidation: 0, totalReject: 0, defects: {} };
    }
    modelMap[model].totalValidation += validationQty;
    modelMap[model].totalReject += rejectQty;
    if (row['Error'] && rejectQty > 0) {
      const modelDefectList = parseDefectTypes(row['Error']);
      if (modelDefectList.length > 0) {
        modelDefectList.forEach((defect) => {
          modelMap[model].defects[defect] =
            (modelMap[model].defects[defect] || 0) + rejectQty / modelDefectList.length;
        });
      }
    }

    // PO
    const po = row['PO No'] || 'Unknown';
    if (!poMap[po]) poMap[po] = { totalValidation: 0, totalReject: 0 };
    poMap[po].totalValidation += validationQty;
    poMap[po].totalReject += rejectQty;

    // Line
    const line = row['Line'] || 'Unknown';
    if (!lineMap[line]) lineMap[line] = { totalValidation: 0, totalReject: 0 };
    lineMap[line].totalValidation += validationQty;
    lineMap[line].totalReject += rejectQty;
  });

  // Build TQC records
  const tqcRecords: TqcRecord[] = Object.values(tqcMap)
    .map((t) => {
      const rejectRate = t.totalValidation > 0 ? (t.totalReject / t.totalValidation) * 100 : 0;
      const mainDefectEntry = Object.entries(t.defects).sort(([, a], [, b]) => b - a)[0];
      return {
        id: t.id,
        name: t.name,
        buildings: Array.from(t.buildings),
        totalValidation: t.totalValidation,
        totalReject: t.totalReject,
        rejectRate: Math.round(rejectRate * 100) / 100,
        defects: t.defects,
        mainDefect: mainDefectEntry ? mainDefectEntry[0] : 'N/A',
      };
    })
    .sort((a, b) => b.rejectRate - a.rejectRate);

  // Build building records
  const buildingRecords: BuildingRecord[] = Object.entries(buildingMap)
    .map(([building, b]) => ({
      building,
      totalValidation: b.totalValidation,
      totalReject: b.totalReject,
      rejectRate: b.totalValidation > 0
        ? Math.round((b.totalReject / b.totalValidation) * 10000) / 100
        : 0,
      defects: b.defects,
    }))
    .sort((a, b) => b.rejectRate - a.rejectRate);

  // Build model records
  const modelRecords: ModelRecord[] = Object.entries(modelMap)
    .map(([model, m]) => ({
      model,
      totalValidation: m.totalValidation,
      totalReject: m.totalReject,
      rejectRate: m.totalValidation > 0
        ? Math.round((m.totalReject / m.totalValidation) * 10000) / 100
        : 0,
      defects: m.defects,
    }))
    .sort((a, b) => b.rejectRate - a.rejectRate);

  // Build daily records
  const sortedDates = Object.keys(dailyMap).sort();
  const dailyRecords: DailyRecord[] = sortedDates.map((date) => ({
    date,
    totalValidation: dailyMap[date].totalValidation,
    totalReject: dailyMap[date].totalReject,
    rejectRate: dailyMap[date].totalValidation > 0
      ? Math.round((dailyMap[date].totalReject / dailyMap[date].totalValidation) * 10000) / 100
      : 0,
  }));

  // Build defect types
  const totalDefectCount = Object.values(defectMap).reduce((a, b) => a + b, 0);
  const defectTypes: DefectType[] = Object.entries(defectMap)
    .map(([type, count]) => ({
      type,
      count: Math.round(count),
      ratio: totalDefectCount > 0
        ? Math.round((count / totalDefectCount) * 1000) / 10
        : 0,
    }))
    .sort((a, b) => b.count - a.count);

  const totalDays = sortedDates.length;
  const totalRejectRate = totalValidation > 0
    ? Math.round((totalReject / totalValidation) * 10000) / 100
    : 0;

  const highRiskTqcCount = tqcRecords.filter(
    (t) => t.rejectRate > 5 && t.totalValidation >= 100
  ).length;

  const stats: ProcessedStats = {
    totalValidation,
    totalReject,
    totalRejectRate,
    avgDailyValidation: totalDays > 0 ? Math.round(totalValidation / totalDays) : 0,
    totalDays,
    highRiskTqcCount,
  };

  return {
    stats,
    tqcRecords,
    buildingRecords,
    modelRecords,
    dailyRecords,
    defectTypes,
    firstDate: sortedDates[0] || '',
    lastDate: sortedDates[sortedDates.length - 1] || '',
  };
}

// ========== AI Briefing Payload ==========

export function extractBriefingPayload(
  processed: ProcessedData,
  yearMonth: string,
  lang: string
): AiBriefingRequest {
  const { stats, tqcRecords, defectTypes, buildingRecords, modelRecords } = processed;

  const topTqcIssues = tqcRecords
    .filter((t) => t.totalValidation >= 100 && t.rejectRate > 0)
    .slice(0, 5)
    .map((t) => {
      const sortedDefects = Object.entries(t.defects)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 3)
        .map(([type, count]) => ({ type, count: Math.round(count) }));
      return {
        name: t.name,
        id: t.id,
        rejectRate: t.rejectRate,
        totalReject: t.totalReject,
        totalValidation: t.totalValidation,
        buildings: t.buildings,
        defects: sortedDefects,
        mainDefect: t.mainDefect,
      };
    });

  const topDefects = defectTypes.slice(0, 5);

  // Build defect→model mapping for top defects
  const defectModelMap: Record<string, Array<{ model: string; count: number }>> = {};
  for (const m of modelRecords) {
    for (const [defect, count] of Object.entries(m.defects)) {
      if (!defectModelMap[defect]) defectModelMap[defect] = [];
      defectModelMap[defect].push({ model: m.model, count: Math.round(count) });
    }
  }
  const topDefectModels = topDefects.slice(0, 5).map((d) => ({
    type: d.type,
    models: (defectModelMap[d.type] || [])
      .sort((a, b) => b.count - a.count)
      .slice(0, 3),
  }));

  // Model defect data
  const modelDefects = modelRecords
    .filter((m) => m.totalReject > 0)
    .slice(0, 8)
    .map((m) => {
      const sortedDefects = Object.entries(m.defects)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 3)
        .map(([type, count]) => ({ type, count: Math.round(count) }));
      return {
        model: m.model,
        rejectRate: m.rejectRate,
        totalReject: m.totalReject,
        totalValidation: m.totalValidation,
        defects: sortedDefects,
      };
    });

  const buildingIssues = buildingRecords.slice(0, 10).map((b) => ({
    building: b.building,
    rejectRate: b.rejectRate,
    totalValidation: b.totalValidation,
  }));

  const highRiskBuildings = buildingRecords
    .filter((b) => b.rejectRate > 3)
    .slice(0, 5)
    .map((b) => b.building);

  return {
    date: new Date().toISOString().slice(0, 10),
    yearMonth,
    firstDate: processed.firstDate,
    lastDate: processed.lastDate,
    lang,
    stats: {
      totalValidation: stats.totalValidation,
      totalReject: stats.totalReject,
      totalRejectRate: stats.totalRejectRate,
      avgDailyValidation: stats.avgDailyValidation,
    },
    topTqcIssues,
    topDefects,
    topDefectModels,
    modelDefects,
    buildingIssues,
    riskItems: {
      highRiskPOs: [],
      highRiskBuildings: highRiskBuildings,
      highRiskLines: [],
    },
  };
}
