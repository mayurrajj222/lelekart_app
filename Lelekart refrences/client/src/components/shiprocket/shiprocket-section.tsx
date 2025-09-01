import React, { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  TruckIcon,
  PackageIcon,
  XCircleIcon,
  MapPinIcon,
  RefreshCwIcon,
  ClockIcon,
  CheckCircleIcon
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Skeleton } from '@/components/ui/skeleton';

interface Order {
  id: number;
  status: string;
  trackingId?: string;
  courierName?: string;
  trackingUrl?: string;
}

interface TrackingActivity {
  date: string;
  activity: string;
  location: string;
}

interface TrackingData {
  track_status: string;
  shipment_track_activities: TrackingActivity[];
}

interface ShiprocketSectionProps {
  order: Order;
  onRefetch: () => void;
  isAdmin?: boolean;
  isSeller?: boolean;
}

export function ShiprocketSection({ order, onRefetch, isAdmin = false, isSeller = false }: ShiprocketSectionProps) {
  const { toast } = useToast();
  const [showTracking, setShowTracking] = useState(false);
  
  // Check if the order has shipping details
  const hasShippingDetails = Boolean(order.trackingId);
  
  // Fetch tracking data if available
  const {
    data: trackingData,
    isLoading: isLoadingTracking,
    refetch: refetchTracking
  } = useQuery<{ tracking_data: TrackingData }>({
    queryKey: ['/api/tracking', order.trackingId],
    queryFn: async () => {
      if (!order.trackingId) throw new Error('No tracking ID available');
      const res = await apiRequest('GET', `/api/tracking/${order.trackingId}`);
      if (!res.ok) throw new Error('Failed to fetch tracking data');
      return res.json();
    },
    enabled: Boolean(order.trackingId) && showTracking,
  });
  
  // Create shipment mutation
  const createShipmentMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest('POST', `/api/orders/${order.id}/ship`);
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to create shipment');
      }
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: 'Shipment created',
        description: 'The order has been shipped successfully.',
        variant: 'default',
      });
      onRefetch();
    },
    onError: (error) => {
      toast({
        title: 'Failed to create shipment',
        description: error.message,
        variant: 'destructive',
      });
    }
  });
  
  // Cancel shipment mutation
  const cancelShipmentMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest('POST', `/api/orders/${order.id}/cancel-shipment`);
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to cancel shipment');
      }
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: 'Shipment cancelled',
        description: 'The shipment has been cancelled successfully.',
        variant: 'default',
      });
      onRefetch();
    },
    onError: (error) => {
      toast({
        title: 'Failed to cancel shipment',
        description: error.message,
        variant: 'destructive',
      });
    }
  });
  
  // Helper function to format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  // Determine shipment status
  const getShipmentStatus = () => {
    if (!hasShippingDetails) return { label: 'Not Shipped', color: 'bg-gray-100 text-gray-800' };
    
    const status = order.status.toLowerCase();
    
    switch (status) {
      case 'delivered':
        return { label: 'Delivered', color: 'bg-green-100 text-green-800' };
      case 'shipped':
        return { label: 'In Transit', color: 'bg-blue-100 text-blue-800' };
      case 'processing':
        return { label: 'Processing', color: 'bg-yellow-100 text-yellow-800' };
      case 'cancelled':
        return { label: 'Cancelled', color: 'bg-red-100 text-red-800' };
      default:
        return { label: 'Unknown', color: 'bg-gray-100 text-gray-800' };
    }
  };
  
  // Calculate progress percentage based on status
  const getProgressPercentage = () => {
    const status = order.status.toLowerCase();
    
    switch (status) {
      case 'processing':
        return 25;
      case 'shipped':
        return 50;
      case 'outfordelivery':
        return 75;
      case 'delivered':
        return 100;
      case 'cancelled':
        return 100;
      default:
        return 0;
    }
  };
  
  // Handle create shipment
  const handleCreateShipment = async () => {
    await createShipmentMutation.mutateAsync();
  };
  
  // Handle cancel shipment
  const handleCancelShipment = async () => {
    if (window.confirm('Are you sure you want to cancel this shipment?')) {
      await cancelShipmentMutation.mutateAsync();
    }
  };
  
  // Show tracking details
  const handleViewTracking = () => {
    setShowTracking(true);
    refetchTracking();
  };
  
  // Get shipment status
  const shipmentStatus = getShipmentStatus();
  
  // Determine if user can manage the shipment
  const canManageShipment = isAdmin || isSeller;
  
  return (
    <Card className="my-6">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="flex items-center">
              <TruckIcon className="h-5 w-5 mr-2" />
              Shipping Information
            </CardTitle>
            <CardDescription>
              Track your shipment and delivery status
            </CardDescription>
          </div>
          <Badge className={shipmentStatus.color}>
            {shipmentStatus.label}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent>
        {!hasShippingDetails ? (
          <div className="text-center py-6">
            <PackageIcon className="h-12 w-12 mx-auto text-muted-foreground" />
            <p className="mt-2 text-sm text-muted-foreground">
              This order hasn't been shipped yet
            </p>
            {canManageShipment && order.status === 'processing' && (
              <Button
                className="mt-4"
                onClick={handleCreateShipment}
                disabled={createShipmentMutation.isPending}
              >
                {createShipmentMutation.isPending ? (
                  <>Creating Shipment...</>
                ) : (
                  <>Create Shipment</>
                )}
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {/* Shipping progress */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Order Placed</span>
                <span>Delivered</span>
              </div>
              <Progress value={getProgressPercentage()} className="h-2" />
            </div>
            
            {/* Shipping details */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="border rounded-md p-3 space-y-2">
                <div className="text-sm font-medium">Shipment Details</div>
                <div className="text-sm space-y-1">
                  {order.courierName && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Courier:</span>
                      <span>{order.courierName}</span>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="border rounded-md p-3 space-y-2">
                <div className="text-sm font-medium">Tracking Information</div>
                <div className="text-sm space-y-1">
                  {order.trackingId && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Tracking ID:</span>
                      <span>{order.trackingId}</span>
                    </div>
                  )}
                  {order.trackingUrl && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Tracking Link:</span>
                      <a
                        href={order.trackingUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        Track Package
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {/* Tracking details */}
            {order.trackingId && (
              <div>
                {!showTracking ? (
                  <Button variant="outline" className="w-full" onClick={handleViewTracking}>
                    <MapPinIcon className="h-4 w-4 mr-2" />
                    View Detailed Tracking
                  </Button>
                ) : isLoadingTracking ? (
                  <div className="space-y-3 border rounded-md p-4">
                    <Skeleton className="h-6 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                ) : trackingData ? (
                  <div className="border rounded-md p-4">
                    <div className="flex justify-between items-center mb-4">
                      <h4 className="font-medium">Tracking Details</h4>
                      <Badge className="bg-blue-100 text-blue-800">
                        {trackingData.tracking_data.track_status}
                      </Badge>
                    </div>
                    
                    <div className="space-y-4">
                      {trackingData.tracking_data.shipment_track_activities.map((activity, index) => (
                        <div key={index} className="flex gap-3">
                          <div className="flex flex-col items-center">
                            <div className={`h-6 w-6 rounded-full flex items-center justify-center ${index === 0 ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                              {index === 0 ? (
                                <CheckCircleIcon className="h-4 w-4" />
                              ) : (
                                <ClockIcon className="h-3 w-3" />
                              )}
                            </div>
                            {index !== trackingData.tracking_data.shipment_track_activities.length - 1 && (
                              <div className="w-px h-full bg-muted my-1" />
                            )}
                          </div>
                          <div className="space-y-1">
                            <p className="text-sm font-medium">{activity.activity}</p>
                            <p className="text-xs text-muted-foreground">
                              {formatDate(activity.date)} • {activity.location}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center p-4 border rounded-md">
                    <XCircleIcon className="h-8 w-8 mx-auto text-muted-foreground" />
                    <p className="mt-2 text-sm text-muted-foreground">
                      Unable to fetch tracking information
                    </p>
                    <Button variant="outline" size="sm" className="mt-2" onClick={refetchTracking}>
                      <RefreshCwIcon className="h-3 w-3 mr-1" />
                      Retry
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </CardContent>
      
      {hasShippingDetails && canManageShipment && order.status !== 'delivered' && order.status !== 'cancelled' && (
        <CardFooter>
          <Button 
            variant="destructive" 
            className="w-full"
            onClick={handleCancelShipment}
            disabled={cancelShipmentMutation.isPending}
          >
            {cancelShipmentMutation.isPending ? (
              <>Cancelling Shipment...</>
            ) : (
              <>Cancel Shipment</>
            )}
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}