import { useQuery } from '@tanstack/react-query';
import React, { useState } from 'react';
import useAuth from '../hooks/useAuth';
import { rpcRequest } from '../api/client';
import { formatCurrency, formatPercentage } from '../lib/utils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/Card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/Table';
import { Skeleton } from '../components/ui/Skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/Tabs';
import { Icons } from '../components/ui/Icons';
import { Button } from '../components/ui/Button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '../components/ui/DropdownMenu';

interface Holding {
  tradingsymbol: string;
  exchange: string;
  isin: string;
  instrument_token: string;
  product: string;
  price: number;
  quantity: number;
  used_quantity: number;
  t1_quantity: number;
  realised_quantity: number;
  average_price: number;
  last_price: number;
  close_price: number;
  pnl: number;
  day_change: number;
  day_change_percentage: number;
  collateral_quantity: number;
  collateral_type: string;
  disallow_orders: boolean;
  holdings_update_at: string;
  last_price_at: string;
  ohlc: {
    open: number;
    high: number;
    low: number;
    close: number;
  };
  tradable: boolean;
  mode: string;
  m2m: number;
  m2m_pl: number;
  m2m_pl_percentage: number;
  value: number;
  total_value: number;
  ltp: number;
  fytoken: string;
  exchange_timestamp: string;
}

const Holdings = () => {
  const { isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState('equity');

  // Fetch holdings data
  const {
    data: holdings = [],
    isLoading,
    error,
    refetch,
  } = useQuery<Holding[]>({
    queryKey: ['holdings'],
    queryFn: async () => {
      if (!isAuthenticated) return [];
      try {
        const response = await rpcRequest('get_holdings');
        return response || [];
      } catch (err) {
        console.error('Error fetching holdings:', err);
        throw err;
      }
    },
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Filter holdings based on active tab
  const filteredHoldings = holdings.filter((holding) => {
    if (activeTab === 'equity') {
      return holding.product === 'CNC' || holding.product === 'MIS';
    } else if (activeTab === 'mf') {
      return holding.product === 'CNC' && holding.exchange === 'MF';
    }
    return true;
  });

  // Calculate totals
  const totalInvestment = filteredHoldings.reduce(
    (sum, holding) => sum + holding.average_price * holding.quantity,
    0
  );
  const totalCurrentValue = filteredHoldings.reduce(
    (sum, holding) => sum + (holding.last_price || holding.close_price || 0) * holding.quantity,
    0
  );
  const totalPnl = totalCurrentValue - totalInvestment;
  const totalPnlPercentage = totalInvestment > 0 ? (totalPnl / totalInvestment) * 100 : 0;

  // Group by instrument type
  const equityHoldings = filteredHoldings.filter(
    (h) => h.product === 'CNC' || h.product === 'MIS'
  );
  const mfHoldings = filteredHoldings.filter(
    (h) => h.product === 'CNC' && h.exchange === 'MF'
  );

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="rounded-md bg-red-50 p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <Icons.close className="h-5 w-5 text-red-400" />
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">
              Error loading holdings
            </h3>
            <div className="mt-2 text-sm text-red-700">
              <p>Failed to load your holdings. Please try again.</p>
            </div>
            <div className="mt-4">
              <button
                type="button"
                onClick={() => refetch()}
                className="rounded-md bg-red-50 px-2 py-1.5 text-sm font-medium text-red-800 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
              >
                Retry
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Empty state
  if (filteredHoldings.length === 0) {
    return (
      <div className="text-center">
        <Icons.portfolio className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">No holdings</h3>
        <p className="mt-1 text-sm text-gray-500">
          Get started by adding some funds to your account.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">My Holdings</h2>
          <p className="text-muted-foreground">
            View and manage your investment portfolio
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Investment
            </CardTitle>
            <Icons.dollar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(totalInvestment)}
            </div>
            <p className="text-xs text-muted-foreground">
              Across all holdings
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Current Value
            </CardTitle>
            <Icons.barChart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(totalCurrentValue)}
            </div>
            <p className="text-xs text-muted-foreground">
              Based on last traded price
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total P&L
            </CardTitle>
            <Icons.trendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold ${
                totalPnl >= 0 ? 'text-green-500' : 'text-red-500'
              }`}
            >
              {formatCurrency(totalPnl)}
            </div>
            <p
              className={`text-xs ${
                totalPnl >= 0 ? 'text-green-500' : 'text-red-500'
              }`}
            >
              {formatPercentage(totalPnlPercentage)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Holdings
            </CardTitle>
            <Icons.pieChart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {filteredHoldings.length}
            </div>
            <p className="text-xs text-muted-foreground">
              {equityHoldings.length} Stocks • {mfHoldings.length} Mutual Funds
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Holdings Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Your Holdings</CardTitle>
              <CardDescription>
                View and manage your investment portfolio
              </CardDescription>
            </div>
            <div className="flex space-x-2">
              <Tabs
                defaultValue="equity"
                onValueChange={setActiveTab}
                className="w-[400px]"
              >
                <TabsList>
                  <TabsTrigger value="equity">Equity</TabsTrigger>
                  <TabsTrigger value="mf">Mutual Funds</TabsTrigger>
                  <TabsTrigger value="all">All</TabsTrigger>
                </TabsList>
              </Tabs>
              <Button variant="outline" size="sm" onClick={() => refetch()}>
                <Icons.refresh className="mr-2 h-4 w-4" />
                Refresh
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Symbol</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Avg. Price</TableHead>
                  <TableHead>LTP</TableHead>
                  <TableHead>Invested Amount</TableHead>
                  <TableHead>Current Value</TableHead>
                  <TableHead>P&L</TableHead>
                  <TableHead>Day Change</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredHoldings.map((holding) => {
                  const investedAmount = holding.average_price * holding.quantity;
                  const currentPrice = holding.last_price || holding.close_price || 0;
                  const currentValue = currentPrice * holding.quantity;
                  const pnl = currentValue - investedAmount;
                  const pnlPercentage = (pnl / investedAmount) * 100;
                  const dayChange = holding.day_change || 0;
                  const dayChangePercentage = holding.day_change_percentage || 0;

                  return (
                    <TableRow key={`${holding.tradingsymbol}-${holding.exchange}`}>
                      <TableCell className="font-medium">
                        <div className="flex flex-col">
                          <span>{holding.tradingsymbol}</span>
                          <span className="text-xs text-muted-foreground">
                            {holding.exchange}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>{holding.quantity}</TableCell>
                      <TableCell>{formatCurrency(holding.average_price)}</TableCell>
                      <TableCell>{formatCurrency(currentPrice)}</TableCell>
                      <TableCell>{formatCurrency(investedAmount)}</TableCell>
                      <TableCell>{formatCurrency(currentValue)}</TableCell>
                      <TableCell
                        className={
                          pnl >= 0 ? 'text-green-500' : 'text-red-500'
                        }
                      >
                        <div className="flex flex-col">
                          <span>{formatCurrency(pnl)}</span>
                          <span className="text-xs">
                            {formatPercentage(pnlPercentage)}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell
                        className={
                          dayChange >= 0 ? 'text-green-500' : 'text-red-500'
                        }
                      >
                        <div className="flex flex-col">
                          <span>{formatCurrency(dayChange)}</span>
                          <span className="text-xs">
                            {formatPercentage(dayChangePercentage)}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <Icons.more className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                              <Icons.plus className="mr-2 h-4 w-4" />
                              Buy More
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Icons.minus className="mr-2 h-4 w-4" />
                              Sell
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem>
                              <Icons.barChart className="mr-2 h-4 w-4" />
                              View Chart
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Holdings;
