import React, { useState, useMemo, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { formatCurrency, formatPercentage, cn } from '../lib/utils';
import { rpcRequest } from '../api/client';
import useAuth from '../hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/Card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/Table';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Icons } from '../components/ui/Icons';
import { Skeleton } from '../components/ui/Skeleton';
import { Badge } from '../components/ui/Badge';

interface Quote {
  instrument_token: number;
  timestamp: string;
  last_price: number;
  last_traded_quantity: number;
  average_price: number;
  volume: number;
  buy_quantity: number;
  sell_quantity: number;
  ohlc: {
    open: number;
    high: number;
    low: number;
    close: number;
  };
  net_change: number;
  oi: number;
  oi_day_high: number;
  oi_day_low: number;
  exchange_timestamp: string;
  exchange: string;
  tradingsymbol: string;
  name: string;
  last_trade_time: string;
  expiry: string;
  strike: number;
  tick_size: number;
  lot_size: number;
  instrument_type: string;
  segment: string;
  exchange_code: string;
}

interface Instrument {
  instrument_token: number;
  exchange_token: string;
  tradingsymbol: string;
  name: string;
  last_price: number;
  expiry: string;
  strike: number;
  tick_size: number;
  lot_size: number;
  instrument_type: string;
  segment: string;
  exchange: string;
  exchange_code: string;
}

const MarketData = () => {
  const { isAuthenticated } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedInstruments, setSelectedInstruments] = useState<string[]>([]);
  
  // Fetch watchlist instruments (example: NIFTY 50, BANKNIFTY, etc.)
  const {
    data: watchlist = [],
    isLoading: isWatchlistLoading,
    error: watchlistError,
  } = useQuery<Quote[]>({
    queryKey: ['market-watchlist'],
    queryFn: async () => {
      if (!isAuthenticated) return [];
      try {
        // These are example instruments - in a real app, you might fetch a user's watchlist
        const nifty50 = await rpcRequest('get_quotes', { 
          instruments: ['NSE:NIFTY 50'] 
        });
        const bankNifty = await rpcRequest('get_quotes', { 
          instruments: ['NSE:NIFTY BANK'] 
        });
        const sensex = await rpcRequest('get_quotes', { 
          instruments: ['BSE:SENSEX'] 
        });
        return [...(nifty50 || []), ...(bankNifty || []), ...(sensex || [])];
      } catch (err) {
        console.error('Error fetching watchlist:', err);
        throw err;
      }
    },
    enabled: isAuthenticated,
    refetchInterval: 10000, // Refresh every 10 seconds
  });

  // Search for instruments
  const {
    data: searchResults = [],
    isLoading: isSearching,
    error: searchError,
  } = useQuery<Instrument[]>({
    queryKey: ['market-search', searchQuery],
    queryFn: async () => {
      if (!searchQuery.trim() || !isAuthenticated) return [];
      try {
        const response = await rpcRequest('search_instruments', { 
          query: searchQuery,
          exchange: 'NSE,BSE,NFO,CDS,MCX,BFO',
        });
        return response || [];
      } catch (err) {
        console.error('Error searching instruments:', err);
        throw err;
      }
    },
    enabled: isAuthenticated && searchQuery.trim().length > 0,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Fetch quotes for selected instruments
  const {
    data: selectedQuotes = [],
    isLoading: isQuotesLoading,
    error: quotesError,
    refetch: refetchQuotes,
  } = useQuery<Quote[]>({
    queryKey: ['market-quotes', selectedInstruments],
    queryFn: async () => {
      if (selectedInstruments.length === 0 || !isAuthenticated) return [];
      try {
        const response = await rpcRequest('get_quotes', { 
          instruments: selectedInstruments 
        });
        return response || [];
      } catch (err) {
        console.error('Error fetching quotes:', err);
        throw err;
      }
    },
    enabled: isAuthenticated && selectedInstruments.length > 0,
    refetchInterval: 10000, // Refresh every 10 seconds
  });

  // Toggle instrument selection
  const toggleInstrument = useCallback((instrumentKey: string) => {
    setSelectedInstruments(prev => 
      prev.includes(instrumentKey)
        ? prev.filter(key => key !== instrumentKey)
        : [...prev, instrumentKey]
    );
  }, []);

  // Loading state
  if (isWatchlistLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  // Error state
  if (watchlistError) {
    return (
      <div className="rounded-md bg-red-50 p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <Icons.close className="h-5 w-5 text-red-400" />
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">
              Error loading market data
            </h3>
            <div className="mt-2 text-sm text-red-700">
              <p>Failed to load market data. Please try again.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Market Data</h2>
          <p className="text-muted-foreground">
            Real-time market quotes and instrument search
          </p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" size="sm" onClick={() => refetchQuotes()}>
            <Icons.refresh className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Watchlist */}
      <Card>
        <CardHeader>
          <CardTitle>Market Indices</CardTitle>
          <CardDescription>
            Major market indices with real-time updates
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {watchlist.map((index) => (
              <div 
                key={`${index.exchange}:${index.tradingsymbol}`}
                className="border rounded-lg p-4 hover:bg-accent/50 transition-colors cursor-pointer"
                onClick={() => toggleInstrument(`${index.exchange}:${index.tradingsymbol}`)}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">{index.tradingsymbol}</h3>
                    <p className="text-sm text-muted-foreground">
                      {index.exchange}
                    </p>
                  </div>
                  <Badge variant="outline">
                    {index.segment}
                  </Badge>
                </div>
                <div className="mt-2">
                  <div className="flex items-baseline space-x-2">
                    <span className="text-2xl font-bold">
                      {formatCurrency(index.last_price)}
                    </span>
                    <span 
                      className={cn(
                        'text-sm font-medium',
                        index.net_change >= 0 ? 'text-green-500' : 'text-red-500'
                      )}
                    >
                      {index.net_change >= 0 ? '↑' : '↓'} {formatCurrency(Math.abs(index.net_change))} 
                      ({formatPercentage(index.net_change / (index.last_price - index.net_change) * 100)}%)
                    </span>
                  </div>
                  <div className="mt-1 grid grid-cols-3 gap-2 text-xs text-muted-foreground">
                    <div>Open: {formatCurrency(index.ohlc.open)}</div>
                    <div>High: {formatCurrency(index.ohlc.high)}</div>
                    <div>Low: {formatCurrency(index.ohlc.low)}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Search and Add Instruments */}
      <Card>
        <CardHeader>
          <CardTitle>Search Instruments</CardTitle>
          <CardDescription>
            Search and add instruments to track
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <div className="relative">
              <Icons.search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search for stocks, indices, futures, options..."
                className="w-full pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            {isSearching && (
              <div className="absolute z-10 mt-1 w-full rounded-md border bg-popover p-2 text-sm">
                <div className="flex items-center justify-center p-4">
                  <Icons.loader className="mr-2 h-4 w-4 animate-spin" />
                  Searching...
                </div>
              </div>
            )}
            
            {!isSearching && searchQuery && searchResults.length > 0 && (
              <div className="absolute z-10 mt-1 w-full rounded-md border bg-popover shadow-lg">
                <div className="max-h-60 overflow-auto">
                  {searchResults.map((instrument) => {
                    const key = `${instrument.exchange}:${instrument.tradingsymbol}`;
                    return (
                      <div
                        key={key}
                        className="flex items-center justify-between p-2 hover:bg-accent cursor-pointer"
                        onClick={() => {
                          toggleInstrument(key);
                          setSearchQuery('');
                        }}
                      >
                        <div>
                          <div className="font-medium">
                            {instrument.tradingsymbol}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {instrument.exchange} • {instrument.name}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">
                            {formatCurrency(instrument.last_price)}
                          </div>
                          <div className="text-xs">
                            {instrument.instrument_type}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Selected Instruments */}
      {selectedInstruments.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Tracked Instruments</CardTitle>
                <CardDescription>
                  Your selected instruments with real-time updates
                </CardDescription>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedInstruments([])}
                disabled={selectedInstruments.length === 0}
              >
                Clear All
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Symbol</TableHead>
                    <TableHead>LTP</TableHead>
                    <TableHead>Change</TableHead>
                    <TableHead>Volume</TableHead>
                    <TableHead>Open</TableHead>
                    <TableHead>High</TableHead>
                    <TableHead>Low</TableHead>
                    <TableHead>Close</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isQuotesLoading ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-4">
                        <Icons.loader className="mx-auto h-6 w-6 animate-spin" />
                      </TableCell>
                    </TableRow>
                  ) : selectedQuotes.length > 0 ? (
                    selectedQuotes.map((quote) => {
                      const key = `${quote.exchange}:${quote.tradingsymbol}`;
                      const changePercent = quote.net_change / (quote.last_price - quote.net_change) * 100;
                      
                      return (
                        <TableRow key={key}>
                          <TableCell>
                            <div className="font-medium">
                              {quote.tradingsymbol}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {quote.exchange}
                            </div>
                          </TableCell>
                          <TableCell className="font-medium">
                            {formatCurrency(quote.last_price)}
                          </TableCell>
                          <TableCell className={cn(
                            'font-medium',
                            quote.net_change >= 0 ? 'text-green-500' : 'text-red-500'
                          )}>
                            {quote.net_change >= 0 ? '↑' : '↓'} {formatCurrency(Math.abs(quote.net_change))}
                            <br />
                            <span className="text-xs">
                              ({formatPercentage(changePercent)}%)
                            </span>
                          </TableCell>
                          <TableCell>{quote.volume?.toLocaleString() || '-'}</TableCell>
                          <TableCell>{formatCurrency(quote.ohlc.open)}</TableCell>
                          <TableCell>{formatCurrency(quote.ohlc.high)}</TableCell>
                          <TableCell>{formatCurrency(quote.ohlc.low)}</TableCell>
                          <TableCell>{formatCurrency(quote.ohlc.close)}</TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleInstrument(key)}
                            >
                              <Icons.x className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  ) : (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-4 text-muted-foreground">
                        No instruments selected
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default MarketData;
