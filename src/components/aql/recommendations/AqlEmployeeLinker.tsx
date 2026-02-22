import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Link2, Trash2, Search, Save } from 'lucide-react';
import type { AqlEmployeeLink } from '@/types/aql';
import type { Employee } from '@/types';

interface Props {
  aqlLinks: AqlEmployeeLink[];
  employees: Employee[];
  inspectorNames: Array<{ employee_no: string; employee_name: string }>;
  onCreateLink: (
    input: Omit<AqlEmployeeLink, 'link_id' | 'created_at'>
  ) => void;
  onDeleteLink: (linkId: string) => void;
}

export function AqlEmployeeLinker({
  aqlLinks,
  employees,
  inspectorNames,
  onCreateLink,
  onDeleteLink,
}: Props) {
  const { t } = useTranslation();
  const [selectedAqlEmployee, setSelectedAqlEmployee] = useState<string>('');
  const [selectedQtrainEmployee, setSelectedQtrainEmployee] = useState<string>('');
  const [employeeSearch, setEmployeeSearch] = useState('');

  // Find AQL inspectors not yet linked
  const unlinkedInspectors = useMemo(() => {
    const linkedAqlNos = new Set(aqlLinks.map((l) => l.aql_employee_no));
    return inspectorNames.filter((insp) => !linkedAqlNos.has(insp.employee_no));
  }, [inspectorNames, aqlLinks]);

  // Filter Q-TRAIN employees by search
  const filteredEmployees = useMemo(() => {
    if (!employeeSearch.trim()) return employees;
    const q = employeeSearch.toLowerCase();
    return employees.filter(
      (emp) =>
        emp.employee_id.toLowerCase().includes(q) ||
        emp.employee_name.toLowerCase().includes(q)
    );
  }, [employees, employeeSearch]);

  const handleSave = () => {
    if (!selectedAqlEmployee || !selectedQtrainEmployee) return;

    const aqlInspector = inspectorNames.find(
      (i) => i.employee_no === selectedAqlEmployee
    );
    const qtrainEmployee = employees.find(
      (e) => e.employee_id === selectedQtrainEmployee
    );

    if (!aqlInspector || !qtrainEmployee) return;

    onCreateLink({
      aql_employee_no: aqlInspector.employee_no,
      aql_employee_name: aqlInspector.employee_name,
      employee_id: qtrainEmployee.employee_id,
      employee_name: qtrainEmployee.employee_name,
    });

    setSelectedAqlEmployee('');
    setSelectedQtrainEmployee('');
  };

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold flex items-center gap-2">
        <Link2 className="h-5 w-5" />
        {t('aql.recommendations.employeeLinker', 'AQL Employee Linker')}
      </h3>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Left: Existing Links */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">
              {t('aql.recommendations.existingLinks', 'Existing Links')}
              <span className="ml-2 text-sm font-normal text-muted-foreground">
                ({aqlLinks.length})
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-auto max-h-[350px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>
                      {t('aql.recommendations.aqlEmployeeNo', 'AQL Employee No')}
                    </TableHead>
                    <TableHead>
                      {t('aql.recommendations.aqlName', 'AQL Name')}
                    </TableHead>
                    <TableHead>
                      {t('aql.recommendations.qtrainEmployee', 'Q-TRAIN Employee')}
                    </TableHead>
                    <TableHead className="w-16">
                      {t('aql.recommendations.actions', 'Actions')}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {aqlLinks.map((link) => (
                    <TableRow key={link.link_id}>
                      <TableCell className="font-mono text-sm">
                        {link.aql_employee_no}
                      </TableCell>
                      <TableCell>{link.aql_employee_name}</TableCell>
                      <TableCell>
                        <span className="text-sm">
                          {link.employee_name}
                        </span>
                        <span className="text-xs text-muted-foreground ml-1">
                          ({link.employee_id})
                        </span>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onDeleteLink(link.link_id)}
                          aria-label={t('aql.recommendations.removeLink', {
                            name: link.aql_employee_name,
                            defaultValue: `Remove link for ${link.aql_employee_name}`,
                          })}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {aqlLinks.length === 0 && (
                    <TableRow>
                      <TableCell
                        colSpan={4}
                        className="text-center text-muted-foreground py-8"
                      >
                        {t('aql.recommendations.noLinks', 'No links created yet')}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Right: Create New Link */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">
              {t('aql.recommendations.createLink', 'Create New Link')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* AQL Employee Dropdown */}
            <div className="space-y-2">
              <Label>
                {t('aql.recommendations.aqlEmployeeNo', 'AQL Employee No')}
              </Label>
              <Select
                value={selectedAqlEmployee}
                onValueChange={setSelectedAqlEmployee}
              >
                <SelectTrigger className="w-full">
                  <SelectValue
                    placeholder={t(
                      'aql.recommendations.selectAqlEmployee',
                      'Select AQL employee...'
                    )}
                  />
                </SelectTrigger>
                <SelectContent>
                  {unlinkedInspectors.map((insp) => (
                    <SelectItem key={insp.employee_no} value={insp.employee_no}>
                      {insp.employee_no} - {insp.employee_name}
                    </SelectItem>
                  ))}
                  {unlinkedInspectors.length === 0 && (
                    <SelectItem value="__none__" disabled>
                      {t('aql.recommendations.allLinked', 'All inspectors are linked')}
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Q-TRAIN Employee Dropdown with Search */}
            <div className="space-y-2">
              <Label>
                {t('aql.recommendations.qtrainEmployee', 'Q-TRAIN Employee')}
              </Label>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={t(
                    'aql.recommendations.employeeSearchPlaceholder',
                    'Search by ID or name...'
                  )}
                  value={employeeSearch}
                  onChange={(e) => setEmployeeSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select
                value={selectedQtrainEmployee}
                onValueChange={setSelectedQtrainEmployee}
              >
                <SelectTrigger className="w-full">
                  <SelectValue
                    placeholder={t(
                      'aql.recommendations.selectQtrainEmployee',
                      'Select Q-TRAIN employee...'
                    )}
                  />
                </SelectTrigger>
                <SelectContent>
                  {filteredEmployees.slice(0, 50).map((emp) => (
                    <SelectItem key={emp.employee_id} value={emp.employee_id}>
                      {emp.employee_id} - {emp.employee_name}
                    </SelectItem>
                  ))}
                  {filteredEmployees.length === 0 && (
                    <SelectItem value="__none__" disabled>
                      {t('common.noData', 'No data')}
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Save Button */}
            <Button
              onClick={handleSave}
              disabled={!selectedAqlEmployee || !selectedQtrainEmployee}
              className="w-full"
            >
              <Save className="mr-2 h-4 w-4" />
              {t('aql.recommendations.saveLink', 'Save Link')}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
