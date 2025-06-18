import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { cn, formatCurrency, formatDateTime } from '../lib/utils';
import { rpcRequest } from '../api/client';
import useAuth  from '../hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/Card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/Table';
import { Button } from '../components/ui/Button';
import { Icons } from '../components/ui/Icons';
import { Skeleton } from '../components/ui/Skeleton';
import { Badge } from '../components/ui/Badge';
import { toast } from 'react-hot-toast';

interface GttOrder {
  id: number;
  user_id: string;
  parent_trigger_id: number | null;
  status: 'ACTIVE' | 'TRIGGERED' | 'CANCELLED' | 'EXPIRED' | 'CANCELLED' | 'REJECTED';
  condition: {
    exchange: string;
    tradingsymbol: string;
    last_price: number;
    trigger_values: number[];
  };
  orders: Array<{
    exchange: string;
    tradingsymbol: string;
    transaction_type: 'BUY' | 'SELL';
    quantity: number;
    order_type: 'LIMIT' | 'MARKET' | 'SL' | 'SL-M';
    product: string;
    price: number;
    trigger_price: number;
  }>;
  created_at: string;
  updated_at: string;
  expires_at: string;
  meta: any;
  message: string;
}

const GttOrders = () => {
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  
  // Fetch GTT orders
  const {
    data: gttOrders = [],
    isLoading,
    error,
    refetch,
  } = useQuery<GttOrder[]>({
    queryKey: ['gtt-orders'],
    queryFn: async () => {
      if (!isAuthenticated) return [];
      try {
        const response = await rpcRequest('get_gtts');
        return response || [];
      } catch (err) {
        console.error('Error fetching GTT orders:', err);
        throw err;
      }
    },
    enabled: isAuthenticated,
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Delete GTT order mutation
  const deleteGttOrderMutation = useMutation({
    mutationFn: async (triggerId: number) => {
      await rpcRequest('delete_gtt_order', { trigger_id: triggerId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gtt-orders'] });
      toast.success('GTT order deleted successfully');
    },
    onError: (error: any) => {
      console.error('Error deleting GTT order:', error);
      toast.error(error.message || 'Failed to delete GTT order');
    },
  });

  // Handle delete GTT order
  const handleDeleteGttOrder = (triggerId: number) => {
    if (window.confirm('Are you sure you want to delete this GTT order?')) {
      deleteGttOrderMutation.mutate(triggerId);
    }
  };

  // Get status badge variant
  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'success';
      case 'TRIGGERED': return 'default';
      case 'CANCELLED':
      case 'REJECTED':
        return 'destructive';
      case 'EXPIRED':
        return 'warning';
      default:
        return 'default';
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-48" />
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
              Error loading GTT orders
            </h3>
            <div className="mt-2 text-sm text-red-700">
              <p>Failed to load your GTT orders. Please try again.</p>
            </div>
            <div className="mt-4">
              <Button variant="outline" size="sm" onClick={() => refetch()}>
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
  if (gttOrders.length === 0) {
    return (
      <div className="text-center">
        <Icons.clock className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">No GTT orders</h3>
        <p className="mt-1 text-sm text-gray-500">
          Your GTT (Good Till Triggered) orders will appear here.
        </p>
        <div className="mt-6">
          <Button>
            <Icons.plus className="mr-2 h-4 w-4" />
            New GTT Order
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">GTT Orders</h2>
          <p className="text-muted-foreground">
            Manage your Good Till Triggered orders
          </p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <Icons.refresh className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button>
            <Icons.plus className="mr-2 h-4 w-4" />
            New GTT Order
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Active GTT Orders</CardTitle>
          <CardDescription>
            View and manage your Good Till Triggered orders
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Symbol</TableHead>
                  <TableHead>Trigger</TableHead>
                  <TableHead>Orders</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Expires</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {gttOrders.map((gtt) => (
                  <TableRow key={gtt.id}>
                    <TableCell className="font-medium">{gtt.id}</TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span>{gtt.condition.tradingsymbol}</span>
                        <span className="text-xs text-muted-foreground">
                          {gtt.condition.exchange}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span>
                          {gtt.condition.trigger_values.map((v, i) => (
                            <span key={i}>
                              {i > 0 ? ' / ' : ''}
                              {formatCurrency(v)}
                            </span>
                          ))}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          LTP: {formatCurrency(gtt.condition.last_price)}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {gtt.orders.map((order, i) => (
                          <div key={i} className="text-sm">
                            <span className={cn(
                              'font-medium',
                              order.transaction_type === 'BUY' ? 'text-green-500' : 'text-red-500'
                            )}>
                              {order.transaction_type} {order.quantity} @ 
                              {order.order_type === 'MARKET' 
                                ? 'Market' 
                                : formatCurrency(order.price)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusVariant(gtt.status)}>
                        {gtt.status.toLowerCase()}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {formatDateTime(gtt.created_at)}
                    </TableCell>
                    <TableCell>
                      {gtt.expires_at ? formatDateTime(gtt.expires_at) : 'Never'}
                    </TableCell>
                    <TableCell className="text-right">
                      {gtt.status === 'ACTIVE' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteGttOrder(gtt.id)}
                          disabled={deleteGttOrderMutation.isPending}
                        >
                          {deleteGttOrderMutation.isPending ? 'Deleting...' : 'Delete'}
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default GttOrders;
