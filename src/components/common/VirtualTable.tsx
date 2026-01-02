/**
 * Virtual Table Component
 * 대용량 데이터를 위한 가상화된 테이블 컴포넌트
 * @tanstack/react-virtual을 사용하여 성능 최적화
 */

import { useRef, type ReactNode } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';

export interface VirtualTableColumn<T> {
  key: string;
  header: ReactNode;
  width?: string;
  className?: string;
  render: (item: T, index: number) => ReactNode;
}

interface VirtualTableProps<T> {
  data: T[];
  columns: VirtualTableColumn<T>[];
  rowKey: (item: T) => string;
  estimateRowHeight?: number;
  maxHeight?: number | string;
  emptyMessage?: ReactNode;
  onRowClick?: (item: T, index: number) => void;
  rowClassName?: string | ((item: T, index: number) => string);
  /** Minimum row count to enable virtualization (default: 50) */
  virtualizationThreshold?: number;
}

/**
 * VirtualTable - 대용량 데이터 테이블을 위한 가상화 컴포넌트
 *
 * @example
 * ```tsx
 * <VirtualTable
 *   data={employees}
 *   columns={[
 *     { key: 'id', header: 'ID', render: (e) => e.employee_id },
 *     { key: 'name', header: 'Name', render: (e) => e.employee_name },
 *   ]}
 *   rowKey={(e) => e.employee_id}
 *   maxHeight={500}
 * />
 * ```
 */
export function VirtualTable<T>({
  data,
  columns,
  rowKey,
  estimateRowHeight = 53,
  maxHeight = 600,
  emptyMessage = 'No data available',
  onRowClick,
  rowClassName,
  virtualizationThreshold = 50,
}: VirtualTableProps<T>) {
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: data.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => estimateRowHeight,
    overscan: 10,
  });

  const virtualItems = virtualizer.getVirtualItems();
  const totalSize = virtualizer.getTotalSize();

  // If data is below threshold, render normal table without virtualization
  const shouldVirtualize = data.length >= virtualizationThreshold;

  if (data.length === 0) {
    return (
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((col) => (
              <TableHead
                key={col.key}
                style={{ width: col.width }}
                className={col.className}
              >
                {col.header}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell
              colSpan={columns.length}
              className="text-center py-8 text-muted-foreground"
            >
              {emptyMessage}
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    );
  }

  // Non-virtualized table for small datasets
  if (!shouldVirtualize) {
    return (
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((col) => (
              <TableHead
                key={col.key}
                style={{ width: col.width }}
                className={col.className}
              >
                {col.header}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((item, index) => {
            const className =
              typeof rowClassName === 'function'
                ? rowClassName(item, index)
                : rowClassName;
            return (
              <TableRow
                key={rowKey(item)}
                className={cn(
                  onRowClick && 'cursor-pointer hover:bg-muted/50',
                  className
                )}
                onClick={() => onRowClick?.(item, index)}
              >
                {columns.map((col) => (
                  <TableCell
                    key={col.key}
                    style={{ width: col.width }}
                    className={col.className}
                  >
                    {col.render(item, index)}
                  </TableCell>
                ))}
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    );
  }

  // Virtualized table for large datasets
  return (
    <div className="w-full">
      {/* Fixed Header */}
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((col) => (
              <TableHead
                key={col.key}
                style={{ width: col.width }}
                className={col.className}
              >
                {col.header}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
      </Table>

      {/* Virtualized Body */}
      <div
        ref={parentRef}
        style={{
          maxHeight: typeof maxHeight === 'number' ? `${maxHeight}px` : maxHeight,
          overflow: 'auto',
        }}
        className="relative"
      >
        <div
          style={{
            height: `${totalSize}px`,
            width: '100%',
            position: 'relative',
          }}
        >
          <Table>
            <TableBody>
              {virtualItems.map((virtualRow) => {
                const item = data[virtualRow.index];
                const className =
                  typeof rowClassName === 'function'
                    ? rowClassName(item, virtualRow.index)
                    : rowClassName;

                return (
                  <TableRow
                    key={rowKey(item)}
                    data-index={virtualRow.index}
                    ref={virtualizer.measureElement}
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      transform: `translateY(${virtualRow.start}px)`,
                    }}
                    className={cn(
                      onRowClick && 'cursor-pointer hover:bg-muted/50',
                      className
                    )}
                    onClick={() => onRowClick?.(item, virtualRow.index)}
                  >
                    {columns.map((col) => (
                      <TableCell
                        key={col.key}
                        style={{ width: col.width }}
                        className={col.className}
                      >
                        {col.render(item, virtualRow.index)}
                      </TableCell>
                    ))}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}

export default VirtualTable;
