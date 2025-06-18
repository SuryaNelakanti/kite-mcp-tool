import { useQuery } from '@tanstack/react-query';
import { holdingColumns, HoldingRow } from '../tables/holdings';
import { DataTable } from '../components/DataTable';
import { rpc } from '../api/rpc';

export default function Holdings() {
  const { data = [] } = useQuery<HoldingRow[]>({
    queryKey: ['holdings'],
    queryFn: () => rpc<HoldingRow[]>({ method: 'get_holdings' }),
    refetchInterval: 60000,
  });

  return (
    <section className="space-y-4">
      <h1 className="text-xl font-semibold">Holdings</h1>
      <div className="card p-4">
        <DataTable columns={holdingColumns} data={data} />
      </div>
    </section>
  );
}
