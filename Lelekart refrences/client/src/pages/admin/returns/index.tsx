import { useState } from 'react';
import { Link } from 'wouter';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Table, 
  TableHeader, 
  TableRow, 
  TableHead, 
  TableBody, 
  TableCell 
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Loader2Icon,
  Package,
  ClockIcon,
  AlertTriangleIcon,
  CheckCircleIcon,
  TruckIcon,
  CheckIcon,
  XCircleIcon
} from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { apiRequest } from '@/lib/queryClient';
import { AdminLayout } from '@/components/layout/admin-layout';
import { StatCard } from '@/components/dashboard/stat-card';

// Order interface
interface Order {
  id: number;
  date: string;
  status: string;
  total: number;
  paymentMethod: string;
  customer: string;
  items: any[];
}

// Format payment method
const formatPaymentMethod = (method: string) => {
  switch (method) {
    case 'cod':
      return 'Cash on Delivery';
    case 'online':
      return 'Online Payment';
    default:
      return method.charAt(0).toUpperCase() + method.slice(1);
  }
};

// Format status for display
const formatStatus = (status: string) => {
  return status.split('_').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join(' ');
};

export default function AdminReturnManagement() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch all orders
  const {
    data: orders,
    isLoading,
    error
  } = useQuery<Order[]>({
    queryKey: ['/api/orders'],
    queryFn: async () => {
      const res = await fetch('/api/orders', { credentials: 'include' });
      if (!res.ok) return [];
      const data = await res.json();
      return data || [];
    },
    enabled: !!user && user.role === 'admin'
  });

  // Only show orders with these return statuses
  const allowedStatuses = [
    'marked_for_return',
    'approve_return',
    'reject_return',
    'process_return',
    'completed_return',
  ];

  // Filter orders by return statuses
  const filteredOrders = (orders || []).filter(order => allowedStatuses.includes(order.status));

  // Get status counts for stats
  const getStatusCounts = () => {
    const counts = {
      marked_for_return: 0,
      approve_return: 0,
      reject_return: 0,
      process_return: 0,
      completed_return: 0,
    };

    filteredOrders.forEach((order) => {
      if (counts.hasOwnProperty(order.status)) {
        counts[order.status as keyof typeof counts]++;
    }
    });

    return counts;
  };

  const statusCounts = getStatusCounts();
  const totalCount = filteredOrders.length;

  if (!user || user.role !== 'admin') {
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <p className="text-lg text-gray-600 mb-4">Access denied. Admin privileges required.</p>
      </div>
    );
    }

  return (
    <AdminLayout>
      <div className="p-6">
        <h1 className="text-2xl font-bold tracking-tight mb-6">Return Management</h1>
        
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <StatCard
            title="Marked for Return"
            value={statusCounts.marked_for_return.toString()}
            icon={<AlertTriangleIcon className="h-4 w-4" />}
            description="Orders marked for return"
          />
          <StatCard
            title="Approved Returns"
            value={statusCounts.approve_return.toString()}
            icon={<CheckCircleIcon className="h-4 w-4" />}
            description="Returns approved"
          />
          <StatCard
            title="Processing Returns"
            value={statusCounts.process_return.toString()}
            icon={<TruckIcon className="h-4 w-4" />}
            description="Returns in process"
          />
          <StatCard
            title="Completed Returns"
            value={statusCounts.completed_return.toString()}
            icon={<CheckIcon className="h-4 w-4" />}
            description="Returns completed"
          />
          <StatCard
            title="Rejected Returns"
            value={statusCounts.reject_return.toString()}
            icon={<XCircleIcon className="h-4 w-4" />}
            description="Returns rejected"
          />
        </div>

        {/* Orders Table */}
        <Card>
          <CardHeader>
            <CardTitle>Orders with Return Status</CardTitle>
            <CardDescription>
              {totalCount} {totalCount === 1 ? 'order' : 'orders'} found
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center items-center h-64">
                <Loader2Icon className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : totalCount > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Order ID</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Items</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Payment</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredOrders.map((order: Order) => (
                      <TableRow key={order.id}>
                        <TableCell className="font-medium">#{order.id}</TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <ClockIcon className="mr-2 h-4 w-4 text-gray-500" />
                            {format(new Date(order.date), 'MMM d, yyyy')}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <Package className="mr-2 h-4 w-4 text-gray-500" />
                            {order.items?.length || 0} item{(order.items?.length || 0) === 1 ? '' : 's'}
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">
                          ₹{order.total.toFixed(2)}
                        </TableCell>
                        <TableCell>
                          {formatPaymentMethod(order.paymentMethod)}
                        </TableCell>
                        <TableCell>
                          {formatStatus(order.status)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="flex justify-center items-center h-32 text-gray-500">
                No orders with return status found.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}