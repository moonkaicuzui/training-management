import type { ReportResult } from './types';
import { getAvailableFields } from './fields';
import { escapeCSVField } from './helpers';

export const exportReportToCSV = (result: ReportResult): string => {
  const { data, config } = result;

  if (data.length === 0) {
    return '';
  }

  const allKeys = new Set<string>();
  for (const row of data) {
    for (const key of Object.keys(row)) {
      allKeys.add(key);
    }
  }

  const orderedKeys: string[] = [];
  for (const fieldKey of config.fields) {
    if (allKeys.has(fieldKey)) {
      orderedKeys.push(fieldKey);
      allKeys.delete(fieldKey);
    }
  }
  for (const key of allKeys) {
    orderedKeys.push(key);
  }

  const availableFields = getAvailableFields(config.source);
  const fieldLabelMap = new Map(availableFields.map((f) => [f.key, f.label]));

  const headerRow = orderedKeys
    .map((key) => escapeCSVField(fieldLabelMap.get(key) || key))
    .join(',');

  const dataRows = data.map((row) =>
    orderedKeys.map((key) => escapeCSVField(row[key])).join(',')
  );

  return [headerRow, ...dataRows].join('\n');
};

export const exportReportToJSON = (result: ReportResult): string => {
  return JSON.stringify(
    {
      reportName: result.config.name,
      source: result.config.source,
      generatedAt: result.generatedAt,
      totalRows: result.totalRows,
      aggregatedValues: result.aggregatedValues || null,
      data: result.data,
    },
    null,
    2
  );
};
