import React, { useEffect, useState } from "react";
import { useParams, useLocation } from "wouter";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import {
  Package,
  Truck,
  CheckCircle2,
  Clock,
  XCircle,
  ArrowRight,
  ShoppingBag,
  MapPin,
  User,
  Calendar,
  CreditCard,
  ExternalLink,
  ArrowLeft,
} from "lucide-react";

interface Order {
  id: number;
  userId: number;
  status: string;
  total: number;
  date: string;
  shippingDetails:
    | string
    | {
        name: string;
        email: string;
        phone: string;
        address: string;
        city: string;
        state: string;
        zipCode: string;
        notes?: string;
      };
  paymentMethod: string;
  items?: Array<{
    id: number;
    product: {
      name: string;
      imageUrl?: string;
      image_url?: string;
      images?: string;
    };
    quantity: number;
    price: number;
  }>;
  tracking?: {
    carrier: string;
    trackingNumber: string;
    trackingUrl: string;
    shippedDate: string;
    estimatedDeliveryDate: string;
    deliveredDate: string;
    status: string;
    statusUpdates: string;
  };
}

function getStatusColor(status: string) {
  switch (status.toLowerCase()) {
    case "pending":
      return "bg-yellow-100 text-yellow-800 border-yellow-200";
    case "processing":
      return "bg-blue-100 text-blue-800 border-blue-200";
    case "shipped":
      return "bg-indigo-100 text-indigo-800 border-indigo-200";
    case "delivered":
      return "bg-green-100 text-green-800 border-green-200";
    case "cancelled":
      return "bg-red-100 text-red-800 border-red-200";
    case "refunded":
      return "bg-purple-100 text-purple-800 border-purple-200";
    default:
      return "bg-gray-100 text-gray-800 border-gray-200";
  }
}

function StatusIcon({ status }: { status: string }) {
  switch (status.toLowerCase()) {
    case "pending":
      return <Clock className="h-4 w-4 mr-1" />;
    case "processing":
      return <ArrowRight className="h-4 w-4 mr-1" />;
    case "shipped":
      return <Truck className="h-4 w-4 mr-1" />;
    case "delivered":
      return <CheckCircle2 className="h-4 w-4 mr-1" />;
    case "cancelled":
      return <XCircle className="h-4 w-4 mr-1" />;
    case "refunded":
      return <CreditCard className="h-4 w-4 mr-1" />;
    default:
      return <Package className="h-4 w-4 mr-1" />;
  }
}

function getStatusTimeline(status: string) {
  const timeline = [
    {
      status: "pending",
      title: "Order Placed",
      description: "Your order has been placed successfully",
      icon: <ShoppingBag className="h-5 w-5" />,
    },
    {
      status: "processing",
      title: "Order Confirmed",
      description: "Your order has been confirmed and is being processed",
      icon: <CheckCircle2 className="h-5 w-5" />,
    },
    {
      status: "shipped",
      title: "Order Shipped",
      description: "Your order has been shipped and is on its way",
      icon: <Truck className="h-5 w-5" />,
    },
    {
      status: "delivered",
      title: "Order Delivered",
      description: "Your order has been delivered successfully",
      icon: <Package className="h-5 w-5" />,
    },
  ];

  const currentStatusIndex = timeline.findIndex(
    (item) => item.status === status.toLowerCase()
  );

  return timeline.map((item, index) => ({
    ...item,
    completed: index <= currentStatusIndex,
    current: index === currentStatusIndex,
  }));
}

function formatDate(dateString: string) {
  const options: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  };
  return new Date(dateString).toLocaleDateString("en-US", options);
}

export default function TrackOrderPage() {
  const { id } = useParams();
  const orderId = id ? parseInt(id) : 0;
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    fetchOrderDetails();
  }, [orderId]);

  const fetchOrderDetails = async () => {
    try {
      setLoading(true);
      const [orderResponse, trackingResponse] = await Promise.all([
        fetch(`/api/orders/${orderId}`),
        fetch(`/api/orders/${orderId}/shipping-tracking`),
      ]);

      if (!orderResponse.ok) {
        throw new Error("Failed to fetch order details");
      }

      const orderData = await orderResponse.json();
      const trackingData = trackingResponse.ok
        ? await trackingResponse.json()
        : null;

      setOrder({
        ...orderData,
        tracking: trackingData,
      });
    } catch (error) {
      console.error("Error fetching order details:", error);
      toast({
        title: "Error",
        description: "Failed to fetch order details. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      );
    }

    if (!order) {
      return (
        <div className="text-center">
          <h2 className="text-2xl font-bold">Order Not Found</h2>
          <p className="text-muted-foreground mt-2">
            The order you're looking for doesn't exist or you don't have
            permission to view it.
          </p>
          <Button onClick={() => navigate("/")} className="mt-4">
            Return to Home
          </Button>
        </div>
      );
    }

    // Parse shipping details
    let shippingDetails;
    if (typeof order.shippingDetails === "string") {
      try {
        shippingDetails = JSON.parse(order.shippingDetails);
      } catch (error) {
        shippingDetails = {
          name: "Unknown",
          email: "Unknown",
          phone: "Unknown",
          address: "Unknown",
          city: "Unknown",
          state: "Unknown",
          zipCode: "Unknown",
        };
      }
    } else {
      shippingDetails = order.shippingDetails;
    }

    const timeline = getStatusTimeline(order.status);

    return (
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start gap-4">
          <div>
            <h1 className="text-2xl font-bold">Track Order</h1>
            <p className="text-muted-foreground">Order #{order.id}</p>
          </div>
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              className="flex items-center gap-2"
              onClick={() => navigate(`/order/${order.id}`)}
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Order
            </Button>
            <div
              className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(
                order.status
              )}`}
            >
              <StatusIcon status={order.status} />
              {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
            </div>
          </div>
        </div>

        {/* Order Timeline */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-6">Order Status Timeline</h2>
          <div className="space-y-8">
            {timeline.map((item, index) => (
              <div key={item.status} className="relative">
                {index !== timeline.length - 1 && (
                  <div
                    className={`absolute left-4 top-8 w-0.5 h-8 ${
                      item.completed ? "bg-primary" : "bg-gray-200"
                    }`}
                  />
                )}
                <div className="flex items-start gap-4">
                  <div
                    className={`flex items-center justify-center w-8 h-8 rounded-full ${
                      item.completed
                        ? "bg-primary text-primary-foreground"
                        : "bg-gray-100 text-gray-400"
                    }`}
                  >
                    {item.completed ? (
                      // Show green checkmark for completed steps
                      <svg className="h-5 w-5 text-green-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                    ) : (
                      item.icon
                    )}
                  </div>
                  <div>
                    <h3 className="font-medium">{item.title}</h3>
                    <p className="text-sm text-muted-foreground">
                      {item.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Shipping Information */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">Shipping Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Recipient:</span>
                <span>{shippingDetails.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Address:</span>
                <span>
                  {shippingDetails.address}, {shippingDetails.city},{" "}
                  {shippingDetails.state} {shippingDetails.zipCode}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Order Date:</span>
                <span>{formatDate(order.date)}</span>
              </div>
            </div>
          </div>
        </Card>

        {/* Tracking Information */}
        {order.tracking && (
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4">Tracking Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Truck className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Carrier:</span>
                  <span>{order.tracking.carrier}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Tracking Number:</span>
                  <span>{order.tracking.trackingNumber}</span>
                </div>
                {order.tracking.trackingUrl && (
                  <div className="flex items-center gap-2">
                    <ExternalLink className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Tracking Link:</span>
                    <a
                      href={order.tracking.trackingUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      Track Package
                    </a>
                  </div>
                )}
              </div>
              <div className="space-y-2">
                {order.tracking.shippedDate && (
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Shipped Date:</span>
                    <span>{formatDate(order.tracking.shippedDate)}</span>
                  </div>
                )}
                {order.tracking.estimatedDeliveryDate && (
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Estimated Delivery:</span>
                    <span>
                      {formatDate(order.tracking.estimatedDeliveryDate)}
                    </span>
                  </div>
                )}
                {order.tracking.deliveredDate && (
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Delivered Date:</span>
                    <span>{formatDate(order.tracking.deliveredDate)}</span>
                  </div>
                )}
              </div>
            </div>
            {order.tracking.statusUpdates && (
              <div className="mt-4">
                <h3 className="font-medium mb-2">Status Updates</h3>
                <div className="space-y-2">
                  {JSON.parse(order.tracking.statusUpdates).map(
                    (update: any, index: number) => (
                      <div
                        key={index}
                        className="flex items-start gap-2 text-sm"
                      >
                        <Calendar className="h-4 w-4 text-muted-foreground mt-0.5" />
                        <div>
                          <span className="font-medium">
                            {formatDate(update.timestamp)}
                          </span>
                          <p className="text-muted-foreground">
                            {update.status}
                          </p>
                        </div>
                      </div>
                    )
                  )}
                </div>
              </div>
            )}
          </Card>
        )}

        {/* Order Items */}
        {order.items && order.items.length > 0 && (
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4">Order Items</h2>
            <div className="space-y-4">
              {order.items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-4 p-4 border rounded-lg"
                >
                  <div className="w-16 h-16 bg-gray-100 rounded-md overflow-hidden">
                    {item.product.imageUrl || item.product.image_url ? (
                      <img
                        src={item.product.imageUrl || item.product.image_url}
                        alt={item.product.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <Package className="h-8 w-8" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium">{item.product.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      Quantity: {item.quantity}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">
                      ₹{(item.price * item.quantity).toFixed(2)}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      ₹{item.price.toFixed(2)} each
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    );
  };

  return (
    <DashboardLayout>
      <div className="container mx-auto py-6">{renderContent()}</div>
    </DashboardLayout>
  );
}
