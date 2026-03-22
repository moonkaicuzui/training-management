/**
 * Dashboard & Analytics: KPI, Weekly Trend, Weekly Comparison, Repeated Issues
 */

import { db, collection, query, where, getDocs } from '@/services/firebase';
import { logger } from '@/utils/logger';
import type { MDInspection, MDDashboardKPI, MDWeeklyTrend, MDWeeklyComparison, MDRepeatedIssueSummary, MDRepeatedIssue, FactoryCode, ImprovementStatus } from '@/types/metalDetector';
import { INSPECTIONS_COLLECTION, FAILURES_COLLECTION, getISOWeekNumber, docToInspection, docToFailure } from './helpers';

function calcFactoryStats(inspections: MDInspection[]): Record<FactoryCode, { total: number; pass: number; fail: number; passRate: number }> {
  const factories: FactoryCode[] = ['A', 'B', 'B3', 'C', 'D', 'FGWH', 'SCANPACK_AB', 'SCANPACK_C', 'SCANPACK_D'];
  const result = {} as Record<FactoryCode, { total: number; pass: number; fail: number; passRate: number }>;
  factories.forEach((f) => {
    const items = inspections.filter((i) => i.factory === f);
    const pass = items.filter((i) => i.result === 'PASS').length;
    result[f] = { total: items.length, pass, fail: items.length - pass, passRate: items.length > 0 ? (pass / items.length) * 100 : 0 };
  });
  return result;
}

export async function getDashboardKPIs(year: number, weekNumber?: number): Promise<MDDashboardKPI> {
  try {
    const constraints: Parameters<typeof query>[1][] = [where('year', '==', year)];
    if (weekNumber) constraints.push(where('weekNumber', '==', weekNumber));
    const q = query(collection(db, INSPECTIONS_COLLECTION), ...constraints);
    const snapshot = await getDocs(q);
    const inspections = snapshot.docs.map((d) => docToInspection(d.id, d.data() as Record<string, unknown>));

    const factories: FactoryCode[] = ['A', 'B', 'B3', 'C', 'D', 'FGWH', 'SCANPACK_AB', 'SCANPACK_C', 'SCANPACK_D'];
    const byFactory = {} as MDDashboardKPI['byFactory'];
    factories.forEach((f) => {
      const items = inspections.filter((i) => i.factory === f);
      const pass = items.filter((i) => i.result === 'PASS').length;
      byFactory[f] = { total: items.length, pass, fail: items.length - pass, passRate: items.length > 0 ? (pass / items.length) * 100 : 0 };
    });

    const passCount = inspections.filter((i) => i.result === 'PASS').length;
    const failureQ = query(collection(db, FAILURES_COLLECTION), where('caStatus', 'in', ['pending', 'in_progress', 'overdue']));
    const failureSnapshot = await getDocs(failureQ);
    const failures = failureSnapshot.docs.map((d) => docToFailure(d.id, d.data() as Record<string, unknown>));

    return {
      totalInspections: inspections.length, passCount, failCount: inspections.length - passCount,
      passRate: inspections.length > 0 ? (passCount / inspections.length) * 100 : 0,
      byFactory, openCAs: failures.filter((f) => f.caStatus !== 'completed').length,
      overdueCAs: failures.filter((f) => f.caStatus === 'overdue').length,
    };
  } catch (error) {
    logger.error('[MDInspectionService] getDashboardKPIs failed', error);
    throw error;
  }
}

export async function getWeeklyTrend(year: number, weekCount: number = 12): Promise<MDWeeklyTrend[]> {
  try {
    const currentWeek = getISOWeekNumber(new Date());
    const startWeek = Math.max(1, currentWeek - weekCount + 1);
    const q = query(collection(db, INSPECTIONS_COLLECTION), where('year', '==', year), where('weekNumber', '>=', startWeek), where('weekNumber', '<=', currentWeek));
    const snapshot = await getDocs(q);
    const inspections = snapshot.docs.map((d) => docToInspection(d.id, d.data() as Record<string, unknown>));

    const weekMap = new Map<number, MDInspection[]>();
    inspections.forEach((i) => { const list = weekMap.get(i.weekNumber) || []; list.push(i); weekMap.set(i.weekNumber, list); });

    const trends: MDWeeklyTrend[] = [];
    for (let w = startWeek; w <= currentWeek; w++) {
      const items = weekMap.get(w) || [];
      const pass = items.filter((i) => i.result === 'PASS').length;
      trends.push({ weekNumber: w, year, total: items.length, pass, fail: items.length - pass, passRate: items.length > 0 ? (pass / items.length) * 100 : 0 });
    }
    return trends;
  } catch (error) {
    logger.error('[MDInspectionService] getWeeklyTrend failed', error);
    throw error;
  }
}

export async function getWeeklyComparison(year: number, weekNumber: number): Promise<MDWeeklyComparison> {
  try {
    const lastWeekNumber = weekNumber > 1 ? weekNumber - 1 : 52;
    const lastWeekYear = weekNumber > 1 ? year : year - 1;

    const thisWeekQ = query(collection(db, INSPECTIONS_COLLECTION), where('year', '==', year), where('weekNumber', '==', weekNumber));
    const lastWeekQ = query(collection(db, INSPECTIONS_COLLECTION), where('year', '==', lastWeekYear), where('weekNumber', '==', lastWeekNumber));
    const [thisWeekSnap, lastWeekSnap] = await Promise.all([getDocs(thisWeekQ), getDocs(lastWeekQ)]);

    const thisWeekInspections = thisWeekSnap.docs.map((d) => docToInspection(d.id, d.data() as Record<string, unknown>));
    const lastWeekInspections = lastWeekSnap.docs.map((d) => docToInspection(d.id, d.data() as Record<string, unknown>));

    const thisWeekByFactory = calcFactoryStats(thisWeekInspections);
    const lastWeekByFactory = calcFactoryStats(lastWeekInspections);
    const thisWeekPassCount = thisWeekInspections.filter((i) => i.result === 'PASS').length;
    const lastWeekPassCount = lastWeekInspections.filter((i) => i.result === 'PASS').length;

    const factories: FactoryCode[] = ['A', 'B', 'B3', 'C', 'D', 'FGWH', 'SCANPACK_AB', 'SCANPACK_C', 'SCANPACK_D'];
    const factoryComparison = {} as MDWeeklyComparison['factoryComparison'];
    factories.forEach((f) => {
      const lw = lastWeekByFactory[f].fail;
      const tw = thisWeekByFactory[f].fail;
      let improvement: ImprovementStatus = 'no_change';
      if (tw < lw) improvement = 'improved';
      else if (tw > lw) improvement = 'increased';
      factoryComparison[f] = { failedLastWeek: lw, failedThisWeek: tw, improvement };
    });

    const lastWeekFailIds = lastWeekInspections.filter((i) => i.result === 'FAIL').map((i) => i.id);
    const machinesFailedLastWeek = lastWeekFailIds.length;
    let machinesFixedOnTime = 0;
    if (machinesFailedLastWeek > 0) {
      const failureQ = query(collection(db, FAILURES_COLLECTION), where('caStatus', '==', 'completed'));
      const failureSnap = await getDocs(failureQ);
      const completedFailures = failureSnap.docs.map((d) => docToFailure(d.id, d.data() as Record<string, unknown>));
      machinesFixedOnTime = completedFailures.filter((f) => lastWeekFailIds.includes(f.inspectionId)).length;
    }

    return {
      thisWeek: { weekNumber, totalChecked: thisWeekInspections.length, failCount: thisWeekInspections.length - thisWeekPassCount, passRate: thisWeekInspections.length > 0 ? (thisWeekPassCount / thisWeekInspections.length) * 100 : 0, byFactory: thisWeekByFactory },
      lastWeek: { weekNumber: lastWeekNumber, totalChecked: lastWeekInspections.length, failCount: lastWeekInspections.length - lastWeekPassCount, passRate: lastWeekInspections.length > 0 ? (lastWeekPassCount / lastWeekInspections.length) * 100 : 0, byFactory: lastWeekByFactory },
      factoryComparison, maintenanceFixRate: machinesFailedLastWeek > 0 ? (machinesFixedOnTime / machinesFailedLastWeek) * 100 : 0,
      machinesFixedOnTime, machinesFailedLastWeek,
    };
  } catch (error) {
    logger.error('[MDInspectionService] getWeeklyComparison failed', error);
    throw error;
  }
}

export async function getRepeatedIssues(year: number, weekNumber: number): Promise<MDRepeatedIssueSummary> {
  try {
    const lastWeekNumber = weekNumber > 1 ? weekNumber - 1 : 52;
    const lastWeekYear = weekNumber > 1 ? year : year - 1;

    const thisWeekQ = query(collection(db, INSPECTIONS_COLLECTION), where('year', '==', year), where('weekNumber', '==', weekNumber), where('result', '==', 'FAIL'));
    const lastWeekQ = query(collection(db, INSPECTIONS_COLLECTION), where('year', '==', lastWeekYear), where('weekNumber', '==', lastWeekNumber), where('result', '==', 'FAIL'));
    const thisWeekAllQ = query(collection(db, INSPECTIONS_COLLECTION), where('year', '==', year), where('weekNumber', '==', weekNumber));

    const [thisWeekFailSnap, lastWeekFailSnap, thisWeekAllSnap] = await Promise.all([getDocs(thisWeekQ), getDocs(lastWeekQ), getDocs(thisWeekAllQ)]);

    const thisWeekFails = thisWeekFailSnap.docs.map((d) => docToInspection(d.id, d.data() as Record<string, unknown>));
    const lastWeekFails = lastWeekFailSnap.docs.map((d) => docToInspection(d.id, d.data() as Record<string, unknown>));
    const thisWeekAll = thisWeekAllSnap.docs.map((d) => docToInspection(d.id, d.data() as Record<string, unknown>));

    const getMachineKey = (i: MDInspection) => i.machineId || `${i.factory}-${i.line}`;
    const lastWeekFailKeys = new Set(lastWeekFails.map(getMachineKey));
    const repeatedMachines: MDRepeatedIssue[] = [];
    const seen = new Set<string>();

    thisWeekFails.forEach((i) => {
      const key = getMachineKey(i);
      if (lastWeekFailKeys.has(key) && !seen.has(key)) {
        seen.add(key);
        let keyIssue = i.remarks || '';
        if (!keyIssue && i.checklist) {
          const failed = Object.entries(i.checklist).filter(([, v]) => v === 'FAIL' || v === 'OFF' || v === 'NG').map(([k]) => k);
          keyIssue = failed.length > 0 ? `Checklist fail: ${failed.join(', ')}` : 'Inspection failed';
        }
        if (!keyIssue) keyIssue = 'Inspection failed';
        repeatedMachines.push({ machineId: i.machineId || `${i.factory}-${i.line}`, factory: i.factory, line: i.line, keyIssue, weeksFailed: [lastWeekNumber, weekNumber], status: 'repeated' });
      }
    });

    const uniqueMachines = new Set(thisWeekAll.map(getMachineKey));
    const totalInspected = uniqueMachines.size;

    return { machines: repeatedMachines, totalInspected, repeatedCount: repeatedMachines.length, repeatedRate: totalInspected > 0 ? (repeatedMachines.length / totalInspected) * 100 : 0 };
  } catch (error) {
    logger.error('[MDInspectionService] getRepeatedIssues failed', error);
    throw error;
  }
}
