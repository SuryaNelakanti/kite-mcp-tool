import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { formatCurrency, formatDateTime } from '../lib/utils';
import { rpcRequest } from '../api/client';
import useAuth from '../hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/Card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/Table';
import { Tabs, TabsList, TabsTrigger } from '../components/ui/Tabs';
import { Button } from '../components/ui/Button';
import { Icons } from '../components/ui/Icons';
import { Skeleton } from '../components/ui/Skeleton';
import { Badge } from '../components/ui/Badge';
import { toast } from 'react-hot-toast';

type OrderStatus = 'OPEN' | 'COMPLETE' | 'CANCELLED' | 'REJECTED' | 'TRIGGER_PENDING' | 'ALL';

interface Order {
  order_id: string;
  exchange_order_id: string;
  status: string;
  order_timestamp: string;
  variety: string;
  exchange: string;
  tradingsymbol: string;
  order_type: string;
  transaction_type: 'BUY' | 'SELL';
  validity: string;
  product: string;
  quantity: number;
  filled_quantity: number;
  pending_quantity: number;
  cancelled_quantity: number;
  price: number;
  trigger_price: number;
  average_price: number;
}

const Orders = () => {
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<OrderStatus>('OPEN');
  
  // Fetch orders data
  const {
    data: orders = [],
    isLoading,
    error,
    refetch,
  } = useQuery<Order[]>({
    queryKey: ['orders', activeTab],
    queryFn: async () => {
      if (!isAuthenticated) return [];
      try {
        const response = await rpcRequest('get_orders');
        if (activeTab === 'ALL') return response || [];
        return (response || []).filter(order => order.status === activeTab);
      } catch (err) {
        console.error('Error fetching orders:', err);
        throw err;
      }
    },
    enabled: isAuthenticated,
    refetchInterval: 30000,
  });

  // Cancel order mutation
  const cancelOrderMutation = useMutation({
    mutationFn: async (orderId: string) => {
      await rpcRequest('cancel_order', { order_id: orderId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      toast.success('Order cancelled successfully');
    },
    onError: (error: any) => {
      console.error('Error cancelling order:', error);
      toast.error(error.message || 'Failed to cancel order');
    },
  });

  // Handle cancel order
  const handleCancelOrder = (orderId: string) => {
    if (window.confirm('Are you sure you want to cancel this order?')) {
      cancelOrderMutation.mutate(orderId);
    }
  };

  // Get status badge variant
  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'COMPLETE': return 'success';
      case 'CANCELLED':
      case 'REJECTED': return 'destructive';
      case 'TRIGGER_PENDING': return 'warning';
      default: return 'default';
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
              Error loading orders
            </h3>
            <div className="mt-2 text-sm text-red-700">
              <p>Failed to load your orders. Please try again.</p>
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
  if (orders.length === 0) {
    return (
      <div className="text-center">
        <Icons.orders className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">
          {activeTab === 'ALL' ? 'No orders found' : `No ${activeTab.toLowerCase()} orders found`}
        </h3>
        <p className="mt-1 text-sm text-gray-500">
          Your {activeTab === 'ALL' ? '' : `${activeTab.toLowerCase()} `}orders will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Orders</h2>
          <p className="text-muted-foreground">View and manage your orders</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          <Icons.refresh className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Order History</CardTitle>
              <CardDescription>View and manage your order history</CardDescription>
            </div>
            <Tabs 
              value={activeTab}
              onValueChange={(value) => setActiveTab(value as OrderStatus)}
              className="w-[400px]"
            >
              <TabsList>
                <TabsTrigger value="OPEN">Open</TabsTrigger>
                <TabsTrigger value="COMPLETE">Completed</TabsTrigger>
                <TabsTrigger value="CANCELLED">Cancelled</TabsTrigger>
                <TabsTrigger value="ALL">All</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order ID</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead>Symbol</TableHead>
                  <TableHead>Transaction</TableHead>
                  <TableHead>Qty</TableHead>
                  <TableHead>Avg. Price</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((order) => (
                  <TableRow key={order.order_id}>
                    <TableCell className="font-medium">
                      <div className="flex flex-col">
                        <span className="text-xs text-muted-foreground">
                          {order.exchange_order_id || 'N/A'}
                        </span>
                        <span>{order.order_id}</span>
                      </div>
                    </TableCell>
                    <TableCell>{formatDateTime(order.order_timestamp)}</TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span>{order.tradingsymbol}</span>
                        <span className="text-xs text-muted-foreground">
                          {order.exchange}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={order.transaction_type === 'BUY' ? 'success' : 'destructive'}>
                        {order.transaction_type}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span>{order.filled_quantity || 0}/{order.quantity}</span>
                        <span className="text-xs text-muted-foreground">
                          {order.pending_quantity} pending
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {order.average_price > 0 
                        ? formatCurrency(order.average_price) 
                        : formatCurrency(order.price)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusVariant(order.status)}>
                        {order.status.replace('_', ' ').toLowerCase()}
                      </Badge>
                    </TableCell>
                    <TableCell>{order.product}</TableCell>
                    <TableCell className="text-right">
                      {order.status === 'OPEN' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleCancelOrder(order.order_id)}
                          disabled={cancelOrderMutation.isPending}
                        >
                          {cancelOrderMutation.isPending ? 'Cancelling...' : 'Cancel'}
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

export default Orders;
