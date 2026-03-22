import { useState, useMemo, memo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Link2, Trash2, Search, UserPlus } from 'lucide-react';
import { useShallow } from 'zustand/react/shallow';
import { useRecommendationStore } from '@/stores/recommendationStore';
import type { Employee } from '@/types';

export const TqcEmployeeLinker = memo(function TqcEmployeeLinker() {
  const { t } = useTranslation();
  const {
    recommendations,
    tqcLinks,
    employees,
    createLink,
    deleteLink,
  } = useRecommendationStore(useShallow((state) => ({ recommendations: state.recommendations, tqcLinks: state.tqcLinks, employees: state.employees, createLink: state.createLink, deleteLink: state.deleteLink })));

  const [employeeSearch, setEmployeeSearch] = useState('');
  const [selectedTqcId, setSelectedTqcId] = useState<string | null>(null);

  // Find TQC IDs that are not yet linked
  const unlinkedTqcIds = useMemo(() => {
    const linkedTqcIds = new Set(tqcLinks.map((l) => l.tqc_id));
    const uniqueTqcs = new Map<string, string>();
    for (const rec of recommendations) {
      if (!linkedTqcIds.has(rec.tqc_id)) {
        uniqueTqcs.set(rec.tqc_id, rec.tqc_name);
      }
    }
    return Array.from(uniqueTqcs.entries()).map(([id, name]) => ({
      tqc_id: id,
      tqc_name: name,
    }));
  }, [recommendations, tqcLinks]);

  // Filter employees by search query
  const filteredEmployees = useMemo(() => {
    if (!employeeSearch.trim()) return employees;
    const q = employeeSearch.toLowerCase();
    return employees.filter(
      (emp) =>
        emp.employee_id.toLowerCase().includes(q) ||
        emp.employee_name.toLowerCase().includes(q)
    );
  }, [employees, employeeSearch]);

  const handleLinkEmployee = async (employee: Employee) => {
    if (!selectedTqcId) return;

    const tqc = unlinkedTqcIds.find((t) => t.tqc_id === selectedTqcId);
    if (!tqc) return;

    await createLink({
      tqc_id: tqc.tqc_id,
      tqc_name: tqc.tqc_name,
      employee_id: employee.employee_id,
      employee_name: employee.employee_name,
    });

    setSelectedTqcId(null);
  };

  const handleDeleteLink = async (linkId: string) => {
    await deleteLink(linkId);
  };

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">
        {t('recommendation.tqcEmployeeLinker')}
      </h3>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Left: Unlinked TQC IDs */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">
              {t('recommendation.unlinkedTqcIds')}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-auto max-h-[300px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('recommendation.tqcId')}</TableHead>
                    <TableHead>{t('recommendation.tqcName')}</TableHead>
                    <TableHead className="w-20">
                      {t('recommendation.action')}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {unlinkedTqcIds.map((tqc) => (
                    <TableRow
                      key={tqc.tqc_id}
                      className={
                        selectedTqcId === tqc.tqc_id ? 'bg-muted/50' : ''
                      }
                    >
                      <TableCell className="font-mono text-sm">
                        {tqc.tqc_id}
                      </TableCell>
                      <TableCell>{tqc.tqc_name}</TableCell>
                      <TableCell>
                        <Button
                          variant={
                            selectedTqcId === tqc.tqc_id
                              ? 'default'
                              : 'outline'
                          }
                          size="sm"
                          onClick={() =>
                            setSelectedTqcId(
                              selectedTqcId === tqc.tqc_id
                                ? null
                                : tqc.tqc_id
                            )
                          }
                          aria-label={t('recommendation.selectTqc', {
                            id: tqc.tqc_id,
                          })}
                        >
                          <UserPlus className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {unlinkedTqcIds.length === 0 && (
                    <TableRow>
                      <TableCell
                        colSpan={3}
                        className="text-center text-muted-foreground py-8"
                      >
                        {t('recommendation.allLinked')}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Right: Employee search & select */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">
              {t('recommendation.searchEmployee')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t('recommendation.employeeSearchPlaceholder')}
                value={employeeSearch}
                onChange={(e) => setEmployeeSearch(e.target.value)}
                className="pl-9"
              />
            </div>

            {selectedTqcId ? (
              <p className="text-sm">
                {t('recommendation.linkingTqc')}:{' '}
                <Badge variant="outline">{selectedTqcId}</Badge>
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">
                {t('recommendation.selectTqcFirst')}
              </p>
            )}

            <div className="overflow-auto max-h-[220px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('recommendation.employeeId')}</TableHead>
                    <TableHead>{t('recommendation.employeeName')}</TableHead>
                    <TableHead className="w-20">
                      {t('recommendation.action')}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredEmployees.slice(0, 50).map((emp) => (
                    <TableRow key={emp.employee_id}>
                      <TableCell className="font-mono text-sm">
                        {emp.employee_id}
                      </TableCell>
                      <TableCell>{emp.employee_name}</TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={!selectedTqcId}
                          onClick={() => handleLinkEmployee(emp)}
                          aria-label={t('recommendation.linkEmployee', {
                            name: emp.employee_name,
                          })}
                        >
                          <Link2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredEmployees.length === 0 && (
                    <TableRow>
                      <TableCell
                        colSpan={3}
                        className="text-center text-muted-foreground py-4"
                      >
                        {t('common.noData')}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Existing Links Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">
            {t('recommendation.existingLinks')}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-auto max-h-[300px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('recommendation.tqcId')}</TableHead>
                  <TableHead>{t('recommendation.tqcName')}</TableHead>
                  <TableHead>{t('recommendation.employeeId')}</TableHead>
                  <TableHead>{t('recommendation.employeeName')}</TableHead>
                  <TableHead className="text-right">
                    {t('recommendation.action')}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tqcLinks.map((link) => (
                  <TableRow key={link.link_id}>
                    <TableCell className="font-mono text-sm">
                      {link.tqc_id}
                    </TableCell>
                    <TableCell>{link.tqc_name}</TableCell>
                    <TableCell className="font-mono text-sm">
                      {link.employee_id}
                    </TableCell>
                    <TableCell>{link.employee_name}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteLink(link.link_id)}
                        aria-label={t('recommendation.removeLink', {
                          tqc: link.tqc_id,
                        })}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {tqcLinks.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="text-center text-muted-foreground py-8"
                    >
                      {t('recommendation.noLinks')}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
});
