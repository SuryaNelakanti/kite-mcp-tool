import React from "react"
import { NavLink, Outlet } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { rpc } from '../api/rpc';
import useWebSocket from '../hooks/useWebSocket';
import DarkModeToggle from './DarkModeToggle';
import { Home, Briefcase, BarChart2, FileText, Clock, LineChart, User } from 'lucide-react';

const links = [
  { to: '/', label: 'Dashboard', icon: Home },
  { to: '/holdings', label: 'Holdings', icon: Briefcase },
  { to: '/positions', label: 'Positions', icon: BarChart2 },
  { to: '/orders', label: 'Orders', icon: FileText },
  { to: '/gtt-orders', label: 'GTT', icon: Clock },
  { to: '/market-data', label: 'Market', icon: LineChart },
  { to: '/profile', label: 'Profile', icon: User },
];

interface MarginsData {
  available_cash: number;
}

export default function Layout() {
  const { connected } = useWebSocket();
  const { data } = useQuery<MarginsData>({
    queryKey: ['margins'],
    queryFn: () => rpc<MarginsData>({ method: 'get_margins' })
  });
  return (
    <div className="grid grid-cols-[60px,1fr] lg:grid-cols-[200px,1fr] min-h-screen">
      <aside className="bg-base-200 text-base-content sticky top-0 h-screen group">
        <nav className="menu p-2 lg:p-4 w-16 lg:w-48 group-hover:w-48 transition-all overflow-x-hidden">
          {links.map(l => (
            <NavLink key={l.to} to={l.to} className="tooltip tooltip-right" data-tip={l.label}>
              {({ isActive }) => {
                const Icon = l.icon;
                return (
                  <span className={`flex items-center gap-2 p-2 rounded-lg ${isActive ? 'bg-primary text-primary-content' : ''}`}> 
                    <Icon className="w-5 h-5" />
                    <span className="hidden lg:inline">{l.label}</span>
                  </span>
                );
              }}
            </NavLink>
          ))}
        </nav>
      </aside>
      <main className="p-4">
        <header className="flex justify-between items-center mb-4">
          <h1 className="text-xl font-semibold">Kite MCP</h1>
          <div className="flex items-center gap-4">
            <span className="badge badge-outline" aria-label="available margin">
              ₹{data?.available_cash?.toFixed(2) ?? '--'}
            </span>
            <DarkModeToggle />
            <span className={`badge ${connected ? 'badge-success' : 'badge-error'}`} aria-label="websocket status">
              {connected ? '✅' : '❌'}
            </span>
          </div>
        </header>
        <section className="p-4"><Outlet /></section>
      </main>
    </div>
  );
}
