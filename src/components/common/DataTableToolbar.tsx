import type { Table } from '@tanstack/react-table';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface DataTableToolbarProps<TData> {
  table: Table<TData>;
  searchPlaceholder?: string;
  searchColumn?: string;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  children?: React.ReactNode;
}

export function DataTableToolbar<TData>({
  table,
  searchPlaceholder,
  searchColumn,
  searchValue,
  onSearchChange,
  children,
}: DataTableToolbarProps<TData>) {
  const { t } = useTranslation();
  const isFiltered = table.getState().columnFilters.length > 0;

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
      <div className="flex flex-1 items-center gap-2">
        {onSearchChange && (
          <div className="relative w-full sm:w-auto">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={searchPlaceholder ?? t('common.search')}
              value={
                searchColumn
                  ? (table.getColumn(searchColumn)?.getFilterValue() as string) ?? ''
                  : searchValue ?? ''
              }
              onChange={(e) => {
                if (searchColumn) {
                  table.getColumn(searchColumn)?.setFilterValue(e.target.value);
                }
                onSearchChange(e.target.value);
              }}
              className="pl-8 w-full sm:w-[250px] lg:w-[300px]"
            />
          </div>
        )}
        {isFiltered && (
          <Button
            variant="ghost"
            onClick={() => table.resetColumnFilters()}
            className="h-8 px-2 lg:px-3"
          >
            {t('common.filter')}
            <X className="ml-2 h-4 w-4" />
          </Button>
        )}
      </div>
      <div className="flex items-center gap-2">
        {children}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="ml-auto">
              <SlidersHorizontal className="mr-2 h-4 w-4" />
              {t('dataTable.columns')}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-[180px]">
            <DropdownMenuLabel>{t('dataTable.toggleColumns')}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {table
              .getAllColumns()
              .filter((column) => column.getCanHide())
              .map((column) => (
                <DropdownMenuCheckboxItem
                  key={column.id}
                  className="capitalize"
                  checked={column.getIsVisible()}
                  onCheckedChange={(value) => column.toggleVisibility(!!value)}
                >
                  {column.id}
                </DropdownMenuCheckboxItem>
              ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
