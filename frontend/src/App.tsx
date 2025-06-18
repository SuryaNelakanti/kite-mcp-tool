import React, { Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { QueryErrorResetBoundary } from '@tanstack/react-query';
import { ErrorBoundary } from 'react-error-boundary';
import { Toaster } from 'react-hot-toast';
import Layout from './components/Layout';
import LoadingSpinner from './components/LoadingSpinner';
import Dashboard from './pages/Dashboard';
import Holdings from './pages/Holdings';
import Positions from './pages/Positions';
import Orders from './pages/Orders';
import GttOrders from './pages/GttOrders';
import MarketData from './pages/MarketData';
import Profile from './pages/Profile';
import Login from './pages/Login';
import useAuth from './hooks/useAuth';

// Development mode - bypassing authentication
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  // For development, directly render children without auth check
  // In production, you should enable the authentication checks below
  
  // Development mode - bypass auth
  return <>{children}</>;
  
  /* Production mode - enable this code
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingSpinner fullPage />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}>;
  */
};

function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <QueryErrorResetBoundary>
        {({ reset }) => (
          <ErrorBoundary
            onReset={reset}
            fallbackRender={() => <div> We brokend</div>}
          >
            <Suspense fallback={<LoadingSpinner fullPage />}>
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route
                  path="/"
                  element={
                    <ProtectedRoute>
                      <Layout />
                    </ProtectedRoute>
                  }
                >
                  <Route index element={<Dashboard />} />
                  <Route path="holdings" element={<Holdings />} />
                  <Route path="positions" element={<Positions />} />
                  <Route path="orders" element={<Orders />} />
                  <Route path="gtt" element={<GttOrders />} />
                  <Route path="market-data" element={<MarketData />} />
                  <Route path="profile" element={<Profile />} />
                </Route>
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Suspense>
          </ErrorBoundary>
        )}
      </QueryErrorResetBoundary>
      <Toaster position="top-right" />
    </div>
  );
}

export default App;
