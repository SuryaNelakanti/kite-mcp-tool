import * as React from 'react';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { formatCurrency, formatPercentage } from '../lib/utils';
import { rpcRequest } from '../api/client';
import useAuth from '../hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/Card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/Table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/Tabs';
import { Button } from '../components/ui/Button';
import { Icons } from '../components/ui/Icons';
import { Skeleton } from '../components/ui/Skeleton';

interface Position {
  tradingsymbol: string;
  exchange: string;
  instrument_token: number;
  product: string;
  quantity: number;
  overnight_quantity: number;
  multiplier: number;
  average_price: number;
  close_price: number;
  last_price: number;
  value: number;
  pnl: number;
  m2m: number;
  unrealised: number;
  realised: number;
  day_buy_quantity: number;
  day_sell_quantity: number;
  day_buy_price: number;
  day_sell_price: number;
  day_buy_value: number;
  day_sell_value: number;
  day_buy_average_price: number;
  day_sell_average_price: number;
  day_change: number;
  day_change_percentage: number;
}

const Positions: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState('net');
  
  // Fetch positions data
  const { data: positions = [], isLoading, error, refetch } = useQuery<Position[]>({
    queryKey: ['positions'],
    queryFn: async () => {
      if (!isAuthenticated) return [];
      try {
        const response = await rpcRequest('get_positions');
        return response || [];
      } catch (err) {
        console.error('Error fetching positions:', err);
        throw err;
      }
    },
    enabled: isAuthenticated,
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Calculate totals
  const netPositions = positions || [];
  const dayPositions = positions || [];
  
  const netPnl = netPositions.reduce((sum, pos) => sum + (pos.pnl || 0), 0);
  const dayPnl = dayPositions.reduce((sum, pos) => sum + (pos.pnl || 0), 0);
  
  const totalInvestment = netPositions.reduce(
    (sum, pos) => sum + (pos.average_price * pos.quantity || 0),
    0
  );
  
  const totalCurrentValue = netPositions.reduce(
    (sum, pos) => sum + ((pos.last_price || pos.close_price || 0) * pos.quantity || 0),
    0
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
            <Icons.chart className="h-5 w-5 text-indigo-500" />
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">
              Error loading positions
            </h3>
            <div className="mt-2 text-sm text-red-700">
              <p>Failed to load your positions. Please try again.</p>
            </div>
            <div className="mt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => refetch()}
              >
                <Icons.refresh className="mr-2 h-4 w-4" />
                Retry
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Empty state
  if (netPositions.length === 0 && dayPositions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-center">No open positions</CardTitle>
          <CardDescription className="text-center">
            Your open positions will appear here when you have any.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center">
          <Icons.chart className="h-12 w-12 text-gray-400" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Positions</h2>
          <p className="text-muted-foreground">
            View and manage your open positions
          </p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <Icons.refresh className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Net P&L
            </CardTitle>
            <Icons.chart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(netPnl)}
            </div>
            <p className="text-xs text-muted-foreground">
              {netPnl >= 0 ? 'Profit' : 'Loss'} overall
            </p>
          </CardContent>
          <CardContent>
            <div
              className={`text-2xl font-bold ${
                netPnl >= 0 ? 'text-green-500' : 'text-red-500'
              }`}
            >
              {formatCurrency(netPnl)}
            </div>
            <p className="text-xs text-muted-foreground">
              Across all positions
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Day P&L
            </CardTitle>
            <Icons.chart className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${dayPnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(dayPnl)}
            </div>
            <p className="text-xs text-muted-foreground">
              {dayPnl >= 0 ? 'Up' : 'Down'} today
            </p>
          </CardContent>
          <CardContent>
            <div
              className={`text-2xl font-bold ${
                dayPnl >= 0 ? 'text-green-500' : 'text-red-500'
              }`}
            >
              {formatCurrency(dayPnl)}
            </div>
            <p className="text-xs text-muted-foreground">
              Profit/Loss for today
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Investment
            </CardTitle>
            <Icons.portfolio className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(totalInvestment)}
            </div>
            <p className="text-xs text-muted-foreground">
              Total invested amount
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Current Value
            </CardTitle>
            <Icons.chart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(totalCurrentValue)}
            </div>
            <p className="text-xs text-muted-foreground">
              Based on last traded price
            </p>
          </CardContent>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(totalCurrentValue)}
            </div>
            <p className="text-xs text-muted-foreground">
              Based on last traded price
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs 
        defaultValue="net" 
        value={activeTab} 
        onValueChange={setActiveTab}
        className="space-y-4"
      >
        <TabsList>
          <TabsTrigger value="net">
            <Icons.portfolio className="mr-2 h-4 w-4" />
            Net Positions
          </TabsTrigger>
          <TabsTrigger value="day">
            <Icons.clock className="mr-2 h-4 w-4" />
            Day Positions
          </TabsTrigger>
        </TabsList>

        <TabsContent value="net" className="space-y-4">
          {netPositions.length === 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>No positions found</CardTitle>
                <CardDescription>You don't have any open positions.</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground text-center py-4">
                  Your open positions will appear here.
                </p>
              </CardContent>
            </Card>
          ) : null}
          <Card>
            <CardHeader>
              <CardTitle>Net Positions</CardTitle>
              <CardDescription>
                Your current open positions across all segments
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Symbol</TableHead>
                      <TableHead>Product</TableHead>
                      <TableHead>Net Qty</TableHead>
                      <TableHead>Avg. Price</TableHead>
                      <TableHead>LTP</TableHead>
                      <TableHead>P&L</TableHead>
                      <TableHead>Day P&L</TableHead>
                      <TableHead>M2M</TableHead>
                      <TableHead>Value</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {netPositions.length > 0 ? (
                      netPositions.map((position) => (
                        <PositionRow 
                          key={`${position.tradingsymbol}-${position.product}`} 
                          position={position} 
                          type="net"
                        />
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={9} className="text-center py-4 text-muted-foreground">
                          No open net positions
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="day" className="space-y-4">
          {dayPositions.length === 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>No day positions</CardTitle>
                <CardDescription>You don't have any day positions.</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground text-center py-4">
                  Your day positions will appear here when you have any.
                </p>
              </CardContent>
            </Card>
          ) : null}
          <Card>
            <CardHeader>
              <CardTitle>Day Positions</CardTitle>
              <CardDescription>
                Your intraday positions for the current trading day
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Symbol</TableHead>
                      <TableHead>Product</TableHead>
                      <TableHead>Buy Qty</TableHead>
                      <TableHead>Sell Qty</TableHead>
                      <TableHead>Avg. Buy</TableHead>
                      <TableHead>Avg. Sell</TableHead>
                      <TableHead>LTP</TableHead>
                      <TableHead>P&L</TableHead>
                      <TableHead>Value</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {dayPositions.length > 0 ? (
                      dayPositions.map((position) => (
                        <PositionRow 
                          key={`${position.tradingsymbol}-${position.product}-day`} 
                          position={position} 
                          type="day"
                        />
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={9} className="text-center py-4 text-muted-foreground">
                          No day positions
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

// Position row component
interface PositionRowProps {
  position: Position;
  type: 'net' | 'day';
  key?: string;
}

const PositionRow: React.FC<PositionRowProps> = ({
  position,
  type,
  key
}) => {
  if (!position) return null;

  // Format values based on position type
  const formatValue = (value: number, isPercentage = false) => {
    if (isPercentage) {
      return formatPercentage(value / 100);
    }
    return formatCurrency(value);
  };

  // Get color class for P&L values
  const getPnlColor = (value: number) => {
    if (value > 0) return 'text-green-500';
    if (value < 0) return 'text-red-500';
    return '';
  };

  return (
    <TableRow key={key}>
      <TableCell className="font-medium">
        <div className="flex items-center">
          <span className="font-mono">{position.tradingsymbol}</span>
          <span className="ml-2 text-xs text-muted-foreground">
            {position.exchange}
          </span>
        </div>
      </TableCell>
      <TableCell className="uppercase">{position.product}</TableCell>
      
      {type === 'net' ? (
        <>
          <TableCell className={`text-right ${position.quantity < 0 ? 'text-red-500' : ''}`}>
            {position.quantity}
          </TableCell>
          <TableCell className="text-right">
            {formatCurrency(position.average_price || 0)}
          </TableCell>
          <TableCell className="text-right">
            {formatCurrency(position.last_price || 0)}
          </TableCell>
          <TableCell className={`text-right ${getPnlColor(position.pnl || 0)}`}>
            {formatValue(position.pnl || 0)}
          </TableCell>
          <TableCell className={`text-right ${getPnlColor(position.day_change || 0)}`}>
            {formatValue(position.day_change || 0)}
          </TableCell>
          <TableCell className="text-right">
            {formatValue(position.m2m || 0)}
          </TableCell>
          <TableCell className="text-right">
            {formatValue(position.value || 0)}
          </TableCell>
        </>
      ) : (
        <>
          <TableCell className="text-right">
            {position.day_buy_quantity || 0}
          </TableCell>
          <TableCell className="text-right">
            {position.day_sell_quantity || 0}
          </TableCell>
          <TableCell className="text-right">
            {formatCurrency(position.day_buy_average_price || 0)}
          </TableCell>
          <TableCell className="text-right">
            {formatCurrency(position.day_sell_average_price || 0)}
          </TableCell>
          <TableCell className="text-right">
            {formatCurrency(position.last_price || 0)}
          </TableCell>
          <TableCell className={`text-right ${getPnlColor(position.day_change || 0)}`}>
            {formatValue(position.day_change || 0)}
          </TableCell>
          <TableCell className="text-right">
            {formatValue((position.quantity || 0) * (position.last_price || 0))}
          </TableCell>
        </>
      )}
    </TableRow>
  );
};

export default Positions;
