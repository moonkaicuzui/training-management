/**
 * CompetencyListTab - Complete list tab with filters, table, and stats
 */

import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { CompetencyFilters } from '@/components/competency/CompetencyFilters';
import { useToast } from '@/hooks/use-toast';
import * as api from '@/services/api';
import type { Employee } from '@/types';
import type {
  Competency,
  EmployeeCompetency,
} from '@/types/curriculum';
import { COMPETENCY_LEVEL_VALUES } from '@/types/curriculum';

interface CompetencyListTabProps {
  competencies: Competency[];
  employeeCompetencies: EmployeeCompetency[];
  employees: Employee[];
  onEditCompetency: (comp: Competency) => void;
  onAddCompetency: () => void;
  onOpenBulkDialog: () => void;
  onDataChanged: () => void;
}

export function CompetencyListTab({
  competencies,
  employeeCompetencies,
  employees,
  onEditCompetency,
  onAddCompetency,
  onOpenBulkDialog,
  onDataChanged,
}: CompetencyListTabProps) {
  const { t } = useTranslation();
  const { toast } = useToast();

  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  // Filtered competencies
  const filteredCompetencies = useMemo(() => {
    return competencies.filter((c) => {
      const matchesSearch =
        !searchTerm ||
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.competency_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.name_vn.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory =
        categoryFilter === 'all' || c.category === categoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [competencies, searchTerm, categoryFilter]);

  // Competency achievement stats
  const competencyStats = useMemo(() => {
    const stats: Record<string, { assessed: number; atTarget: number; total: number }> = {};
    for (const comp of competencies) {
      const records = employeeCompetencies.filter((ec) => ec.competency_id === comp.competency_id);
      const atTarget = records.filter(
        (ec) => COMPETENCY_LEVEL_VALUES[ec.current_level] >= COMPETENCY_LEVEL_VALUES[ec.target_level]
      ).length;
      stats[comp.competency_id] = {
        assessed: records.length,
        atTarget,
        total: employees.length,
      };
    }
    return stats;
  }, [competencies, employeeCompetencies, employees]);

  const handleDeleteCompetency = async (id: string) => {
    try {
      await api.deleteCompetency(id);
      toast({ title: t('messages.deleteSuccess') });
      onDataChanged();
    } catch {
      toast({ title: t('messages.deleteError'), variant: 'destructive' });
    }
  };

  return (
    <>
      <CompetencyFilters
        searchTerm={searchTerm}
        onSearchTermChange={setSearchTerm}
        categoryFilter={categoryFilter}
        onCategoryFilterChange={setCategoryFilter}
        onOpenBulkDialog={onOpenBulkDialog}
        onOpenCompetencyDialog={onAddCompetency}
      />

      <Card>
        <CardHeader>
          <CardTitle>{t('competency.listTitle')}</CardTitle>
          <CardDescription>
            {t('competency.listCount', { count: filteredCompetencies.length })}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('competency.code')}</TableHead>
                <TableHead>{t('competency.name')}</TableHead>
                <TableHead>{t('competency.categoryLabel')}</TableHead>
                <TableHead>{t('competency.coreLabel')}</TableHead>
                <TableHead>{t('competency.achievementRate', { defaultValue: 'Achievement' })}</TableHead>
                <TableHead>{t('common.status')}</TableHead>
                <TableHead className="text-right">{t('common.actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCompetencies.map((comp) => (
                <TableRow key={comp.competency_id}>
                  <TableCell className="font-mono text-sm">
                    {comp.competency_code}
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{comp.name}</div>
                      {comp.name_vn && (
                        <div className="text-xs text-muted-foreground">
                          {comp.name_vn}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {t(`competency.category.${comp.category}`)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {comp.is_core && (
                      <Badge variant="default">
                        {t('competency.core')}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {(() => {
                      const stat = competencyStats[comp.competency_id];
                      if (!stat || stat.total === 0) return <span className="text-xs text-muted-foreground">-</span>;
                      const rate = stat.assessed > 0
                        ? Math.round((stat.atTarget / stat.total) * 100)
                        : 0;
                      return (
                        <div className="flex items-center gap-2 min-w-[120px]">
                          <Progress value={rate} className="h-2 flex-1" />
                          <span className="text-xs text-muted-foreground whitespace-nowrap">
                            {stat.atTarget}/{stat.total}
                          </span>
                        </div>
                      );
                    })()}
                  </TableCell>
                  <TableCell>
                    <Badge variant={comp.is_active ? 'default' : 'secondary'}>
                      {comp.is_active ? t('common.active') : t('common.inactive')}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onEditCompetency(comp)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteCompetency(comp.competency_id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filteredCompetencies.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    {t('common.noData')}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  );
}
