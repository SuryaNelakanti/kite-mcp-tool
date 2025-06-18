import React, { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import useWebSocket from '../hooks/useWebSocket';

// Icons (using inline SVGs for better control)
const Icons = {
  home: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
  ),
  briefcase: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  ),
  'chart-bar': (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  ),
  'document-text': (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  ),
  clock: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  'chart-pie': (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
    </svg>
  ),
  user: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  ),
  logout: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
    </svg>
  ),
  menu: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  ),
  close: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  )
};

const navigation = [
  { name: 'Dashboard', href: '/', icon: 'home' },
  { name: 'Holdings', href: '/holdings', icon: 'briefcase' },
  { name: 'Positions', href: '/positions', icon: 'chart-bar' },
  { name: 'Orders', href: '/orders', icon: 'document-text' },
  { name: 'GTT', href: '/gtt', icon: 'clock' },
  { name: 'Market Data', href: '/market-data', icon: 'chart-pie' },
  { name: 'Profile', href: '/profile', icon: 'user' },
];

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}

export default function Layout() {
  const location = useLocation();
  const { logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  // Initialize WebSocket connection
  useWebSocket();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar for desktop */}
      <div className="hidden lg:flex lg:flex-shrink-0">
        <div className="flex flex-col w-64 border-r border-gray-200 bg-white">
          <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
            <div className="flex items-center flex-shrink-0 px-4">
              <h1 className="text-xl font-semibold text-gray-900">Zerodha MCP</h1>
            </div>
            <nav className="mt-5 flex-1 px-2 space-y-1">
              {navigation.map((item) => {
                const isActive = location.pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={classNames(
                      isActive
                        ? 'bg-gray-100 text-blue-600'
                        : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900',
                      'group flex items-center px-3 py-2.5 text-sm font-medium rounded-md transition-colors duration-150'
                    )}
                  >
                    <span className={classNames(
                      isActive ? 'text-blue-500' : 'text-gray-400 group-hover:text-gray-500',
                      'mr-3 flex-shrink-0 h-5 w-5'
                    )}>
                      {Icons[item.icon as keyof typeof Icons]}
                    </span>
                    {item.name}
                  </Link>
                );
              })}
            </nav>
          </div>
          <div className="flex-shrink-0 flex border-t border-gray-200 p-4">
            <button
              onClick={logout}
              className="group flex w-full items-center px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-gray-900 rounded-md transition-colors duration-150"
            >
              <span className="text-gray-400 group-hover:text-gray-500 mr-3">
                {Icons.logout}
              </span>
              Sign out
            </button>
          </div>
        </div>
      </div>

      {/* Mobile sidebar */}
      <div className="lg:hidden">
        <div className="fixed inset-0 z-40">
          {/* Overlay */}
          {sidebarOpen && (
            <div
              className="fixed inset-0 bg-black/50 backdrop-blur-sm"
              onClick={() => setSidebarOpen(false)}
              aria-hidden="true"
            />
          )}
          {/* Sidebar */}
          <div
            className={`fixed inset-y-0 left-0 w-72 bg-white shadow-xl transform ${
              sidebarOpen ? 'translate-x-0' : '-translate-x-full'
            } transition-transform duration-300 ease-in-out`}
          >
            <div className="flex h-full flex-col">
              {/* Header */}
              <div className="flex h-16 items-center justify-between px-4 border-b border-gray-100">
                <h1 className="text-lg font-semibold text-gray-900">Zerodha MCP</h1>
                <button
                  type="button"
                  className="rounded-md p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-500"
                  onClick={() => setSidebarOpen(false)}
                >
                  <span className="sr-only">Close sidebar</span>
                  {Icons.close}
                </button>
              </div>
              {/* Navigation */}
              <nav className="flex-1 overflow-y-auto py-4 px-2">
                <div className="space-y-1">
                  {navigation.map((item) => {
                    const isActive = location.pathname === item.href;
                    return (
                      <Link
                        key={item.name}
                        to={item.href}
                        className={classNames(
                          isActive
                            ? 'bg-blue-50 text-blue-600'
                            : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900',
                          'group flex items-center px-3 py-2.5 text-sm font-medium rounded-lg mx-1 transition-colors duration-150'
                        )}
                        onClick={() => setSidebarOpen(false)}
                      >
                        <span className={classNames(
                          isActive ? 'text-blue-500' : 'text-gray-400 group-hover:text-gray-500',
                          'mr-3 flex-shrink-0 h-5 w-5'
                        )}>
                          {Icons[item.icon as keyof typeof Icons]}
                        </span>
                        {item.name}
                      </Link>
                    );
                  })}
                </div>
              </nav>
              {/* Footer */}
              <div className="border-t border-gray-100 p-4">
                <button
                  onClick={logout}
                  className="group flex w-full items-center rounded-lg p-2 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors duration-150"
                >
                  <span className="text-gray-400 group-hover:text-gray-500 mr-3">
                    {Icons.logout}
                  </span>
                  Sign out
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile header */}
      <div className="lg:hidden sticky top-0 z-30 flex h-16 items-center bg-white px-4 shadow-sm">
        <button
          type="button"
          className="inline-flex items-center justify-center rounded-md p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-600"
          onClick={() => setSidebarOpen(true)}
        >
          <span className="sr-only">Open sidebar</span>
          {Icons.menu}
        </button>
        <h1 className="ml-4 text-lg font-semibold text-gray-900">
          {navigation.find((item) => item.href === location.pathname)?.name || 'Dashboard'}
        </h1>
      </div>

      {/* Main content */}
      <div className="lg:pl-64 flex flex-col flex-1">
        <div className="py-6">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 md:px-8">
            <h1 className="text-2xl font-semibold text-gray-900">
              {navigation.find((item) => item.href === location.pathname)?.name || 'Dashboard'}
            </h1>
          </div>
          <div className="mx-auto max-w-7xl px-4 sm:px-6 md:px-8 py-4">
            <div className="py-4">
              <Outlet />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
