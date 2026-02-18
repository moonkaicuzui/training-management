/**
 * CompetencyRadar Component
 * Bar chart showing department average competency levels vs targets
 */

import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { LazyBarChart } from '@/components/charts/LazyCharts';
import type { Competency, EmployeeCompetency } from '@/types/curriculum';
import { COMPETENCY_LEVEL_VALUES } from '@/types/curriculum';
import type { Employee } from '@/types';
import type { Department } from '@/types';

interface CompetencyRadarProps {
  employees: Employee[];
  competencies: Competency[];
  employeeCompetencies: EmployeeCompetency[];
  department?: Department;
}

interface DeptCompetencyData {
  name: string;
  average: number;
  target: number;
  gap: number;
}

export function CompetencyRadar({
  employees,
  competencies,
  employeeCompetencies,
  department,
}: CompetencyRadarProps) {
  const { t } = useTranslation();

  const chartData = useMemo<DeptCompetencyData[]>(() => {
    const filteredEmployees = department
      ? employees.filter((e) => e.department === department)
      : employees;

    const employeeIds = new Set(filteredEmployees.map((e) => e.employee_id));

    // For each competency, calculate average level vs target
    return competencies
      .filter((c) => c.is_active)
      .map((comp) => {
        const relevantRecords = employeeCompetencies.filter(
          (ec) =>
            ec.competency_id === comp.competency_id &&
            employeeIds.has(ec.employee_id)
        );

        if (relevantRecords.length === 0) {
          return {
            name: comp.competency_code,
            average: 0,
            target: 3, // Default target: COMPETENT
            gap: 3,
          };
        }

        const avgLevel =
          relevantRecords.reduce(
            (sum, ec) => sum + COMPETENCY_LEVEL_VALUES[ec.current_level],
            0
          ) / relevantRecords.length;

        const avgTarget =
          relevantRecords.reduce(
            (sum, ec) => sum + COMPETENCY_LEVEL_VALUES[ec.target_level],
            0
          ) / relevantRecords.length;

        return {
          name: comp.competency_code,
          average: Math.round(avgLevel * 10) / 10,
          target: Math.round(avgTarget * 10) / 10,
          gap: Math.max(0, Math.round((avgTarget - avgLevel) * 10) / 10),
        };
      })
      .sort((a, b) => b.gap - a.gap); // Sort by gap (largest first)
  }, [employees, competencies, employeeCompetencies, department]);

  if (chartData.length === 0) {
    return (
      <div className="flex items-center justify-center p-8 text-muted-foreground">
        {t('common.noData')}
      </div>
    );
  }

  return (
    <LazyBarChart
      data={chartData}
      height={350}
      xAxisKey="name"
      bars={[
        {
          dataKey: 'average',
          name: t('competency.chart.currentAvg'),
          fill: 'hsl(var(--primary))',
          radius: [4, 4, 0, 0],
        },
        {
          dataKey: 'target',
          name: t('competency.chart.targetLevel'),
          fill: 'hsl(var(--muted-foreground) / 0.3)',
          radius: [4, 4, 0, 0],
        },
      ]}
    />
  );
}
