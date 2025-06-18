import { useQuery } from '@tanstack/react-query';
import { rpc } from '../api/rpc';
import React from 'react';
interface Portfolio { available_cash: number; }

export default function Dashboard() {
  const { data } = useQuery<Portfolio>({ queryKey: ['portfolio'], queryFn: () => rpc({ method: 'get_margins' }) });
  return (
    <section className="space-y-4">
      <h1 className="text-xl font-semibold">Dashboard</h1>
      <div className="card p-4">Available cash: ₹{data?.available_cash ?? '--'}</div>
    </section>
  );
}
