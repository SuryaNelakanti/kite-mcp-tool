import React from 'react';
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { useVirtualizer } from '@tanstack/react-virtual';

interface Props<T> {
  columns: ColumnDef<T>[];
  data: T[];
}

export function DataTable<T extends object>({ columns, data }: Props<T>) {
  const table = useReactTable({ columns, data, getCoreRowModel: getCoreRowModel() });
  const parentRef = React.useRef<HTMLDivElement>(null);
  const rowVirtualizer = useVirtualizer({
    count: table.getRowModel().rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 40,
  });
  const rows = rowVirtualizer.getVirtualItems();

  return (
    <div ref={parentRef} className="overflow-auto max-h-96">
      <table className="table table-zebra w-full">
        <thead className="sticky top-0 bg-base-200 z-10">
          {table.getHeaderGroups().map(hg => (
            <tr key={hg.id}>
              {hg.headers.map(h => (
                <th key={h.id}>{flexRender(h.column.columnDef.header, h.getContext())}</th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {rows.map(vRow => {
            const row = table.getRowModel().rows[vRow.index];
            return (
              <tr key={row.id} style={{ height: `${vRow.size}px` }} className="hover">
                {row.getVisibleCells().map(cell => (
                  <td key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
