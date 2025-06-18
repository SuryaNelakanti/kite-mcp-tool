import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Skeleton } from '../components/ui/Skeleton';
import { rpcRequest } from '../api/client';
import useAuth from '../hooks/useAuth';
import { Icons } from '../components/ui/Icons';
import { toast } from 'react-hot-toast';

interface PortfolioSummary {
  total_value?: number;
  today_pnl?: number;
  available_balance?: number;
  used_margin?: number;
  net_balance?: number;
  open_positions?: number;
  today_pnl_percentage?: number;
  pnl?: number;
}

interface Position {
  tradingsymbol: string;
  pnl?: number;
  // Add other position properties as needed
}

interface Order {
  order_id: string;
  status: string;
  // Add other order properties as needed
}

const Dashboard: React.FC = () => {
  const { user, isAuthenticated } = useAuth();

  // Fetch user profile
  const { 
    data: profile, 
    isLoading: isLoadingProfile,
    error: profileError 
  } = useQuery({
    queryKey: ['profile'],
    queryFn: () => rpcRequest('get_profile'),
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
  });

  // Fetch portfolio summary
  const { 
    data: portfolio, 
    isLoading: isLoadingPortfolio,
    error: portfolioError 
  } = useQuery<PortfolioSummary>({
    queryKey: ['portfolio'],
    queryFn: () => rpcRequest('get_portfolio_summary'),
    enabled: isAuthenticated,
    refetchInterval: 30000, // 30 seconds
    staleTime: 30000,
    retry: 1,
  });

  // Fetch recent positions
  const { 
    data: positions = [], 
    isLoading: isLoadingPositions,
    error: positionsError 
  } = useQuery<Position[]>({
    queryKey: ['positions', 'recent'],
    queryFn: () => rpcRequest('get_positions', { limit: 5 }),
    enabled: isAuthenticated,
    staleTime: 30000,
    retry: 1,
  });

  // Fetch recent orders
  const { 
    data: orders = [], 
    isLoading: isLoadingOrders,
    error: ordersError 
  } = useQuery<Order[]>({
    queryKey: ['orders', 'recent'],
    queryFn: () => rpcRequest('get_orders', { limit: 5 }),
    enabled: isAuthenticated,
    staleTime: 30000,
    retry: 1,
  });

  const isLoading = isLoadingProfile || isLoadingPortfolio || isLoadingPositions || isLoadingOrders;
  
  // Handle errors
  React.useEffect(() => {
    const errors = [profileError, portfolioError, positionsError, ordersError].filter(Boolean);
    if (errors.length > 0) {
      errors.forEach(error => {
        toast.error(error?.message || 'An error occurred');
      });
    }
  }, [profileError, portfolioError, positionsError, ordersError]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Welcome back, {profile?.user_name || 'Trader'}!</h2>
        <p className="text-gray-500">Here's what's happening with your portfolio today.</p>
      </div>

      {/* Portfolio Summary */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Value</CardTitle>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              className="h-4 w-4 text-muted-foreground"
            >
              <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <div className="text-2xl font-bold">
                ₹{portfolio?.total_value?.toLocaleString('en-IN') || '0'}
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              {portfolio?.today_pnl_percentage !== undefined ? (
                <span className={portfolio.today_pnl_percentage >= 0 ? 'text-green-500' : 'text-red-500'}>
                  {portfolio.today_pnl_percentage >= 0 ? '↑' : '↓'} {Math.abs(portfolio.today_pnl_percentage)}% today
                </span>
              ) : (
                'Loading...'
              )}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Available Balance</CardTitle>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              className="h-4 w-4 text-muted-foreground"
            >
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <div className="text-2xl font-bold">
                ₹{portfolio?.available_balance?.toLocaleString('en-IN') || '0'}
              </div>
            )}
            <p className="text-xs text-muted-foreground">Available for trading</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Open Positions</CardTitle>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              className="h-4 w-4 text-muted-foreground"
            >
              <rect width="20" height="14" x="2" y="5" rx="2" />
              <path d="M2 10h20" />
            </svg>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <div className="text-2xl font-bold">
                {portfolio?.open_positions ?? 0}
              </div>
            )}
            <p className="text-xs text-muted-foreground">Active positions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's P&L</CardTitle>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              className="h-4 w-4 text-muted-foreground"
            >
              <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <div 
                className={`text-2xl font-bold ${
                  (portfolio?.today_pnl ?? 0) >= 0 ? 'text-green-500' : 'text-red-500'
                }`}
              >
                {(portfolio?.today_pnl ?? 0) >= 0 ? '+' : ''}
                {portfolio?.today_pnl?.toLocaleString('en-IN', { style: 'currency', currency: 'INR' }) || '₹0'}
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              {portfolio?.today_pnl_percentage !== undefined ? (
                <span className={portfolio.today_pnl_percentage >= 0 ? 'text-green-500' : 'text-red-500'}>
                  {portfolio.today_pnl_percentage >= 0 ? '↑' : '↓'} {Math.abs(portfolio.today_pnl_percentage)}% today
                </span>
              ) : (
                'Loading...'
              )}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Recent Positions */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Positions</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingPositions ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center justify-between">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-16" />
                  </div>
                ))}
              </div>
            ) : positions?.length ? (
              <div className="space-y-4">
                {positions.map((position: any) => (
                  <div key={position.tradingsymbol} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{position.tradingsymbol}</p>
                      <p className="text-sm text-gray-500">
                        {position.exchange}:{position.instrument_token}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className={position.pnl >= 0 ? 'text-green-500' : 'text-red-500'}>
                        {position.pnl >= 0 ? '+' : ''}
                        {position.pnl.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}
                      </p>
                      <p className="text-xs text-gray-500">
                        {position.quantity} {position.quantity > 1 ? 'units' : 'unit'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">No recent positions</p>
            )}
          </CardContent>
        </Card>

        {/* Recent Orders */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Orders</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingOrders ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center justify-between">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-16" />
                  </div>
                ))}
              </div>
            ) : orders?.length ? (
              <div className="space-y-4">
                {orders.map((order: any) => (
                  <div key={order.order_id} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{order.tradingsymbol}</p>
                      <p className="text-sm text-gray-500">
                        {order.transaction_type.toUpperCase()} • {order.product}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className={order.status === 'COMPLETE' ? 'text-green-500' : 'text-yellow-500'}>
                        {order.status}
                      </p>
                      <p className="text-sm text-gray-500">
                        {order.quantity} {order.quantity > 1 ? 'units' : 'unit'} at {order.average_price}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">No recent orders</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
