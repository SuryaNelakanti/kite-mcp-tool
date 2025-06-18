import { ColumnDef } from '@tanstack/react-table';

export interface HoldingRow {
  tradingsymbol: string;
  quantity: number;
  average_price: number;
  last_price: number;
  pnl: number;
}

export const holdingColumns: ColumnDef<HoldingRow>[] = [
  {
    accessorKey: 'tradingsymbol',
    header: 'Symbol',
  },
  {
    accessorKey: 'quantity',
    header: 'Qty',
  },
  {
    accessorKey: 'average_price',
    header: 'Avg. Price',
    cell: ({ getValue }) => `₹${(getValue() as number).toFixed(2)}`,
  },
  {
    accessorKey: 'last_price',
    header: 'LTP',
    cell: ({ getValue }) => `₹${(getValue() as number).toFixed(2)}`,
  },
  {
    accessorKey: 'pnl',
    header: 'P/L',
    cell: ({ getValue }) => {
      const val = getValue() as number;
      const cls = val >= 0 ? 'text-success' : 'text-error';
      return <span className={cls}>{val.toFixed(2)}</span>;
    },
  },
];
