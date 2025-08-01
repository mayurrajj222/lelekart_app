import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Package2,
  Truck,
  ClipboardCheck,
  Clock,
  Search,
  ShoppingBag,
  ChevronRight,
  ArrowDownAZ,
  ArrowUpAZ,
  X,
  ImageIcon,
  UploadIcon,
  XIcon,
  Camera,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

// Types
interface Order {
  id: number;
  userId: number;
  status: string;
  total: number;
  date: string;
  shippingDetails: string;
  paymentMethod: string;
  walletDiscount?: number;
  rewardDiscount?: number;
  discount?: number;
  couponDiscount?: number;
  items?: {
    id: number;
    product: {
      id: number;
      name: string;
      image: string;
      imageUrl?: string;
      images?: string;
    };
    quantity: number;
    price: number;
  }[];
}

// Helper to format dates with time
function formatDate(dateString: string) {
  const options: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  };
  return new Date(dateString).toLocaleString("en-IN", options);
}

// Helper to get status badge color
function getStatusColor(status: string) {
  switch (status.toLowerCase()) {
    case "delivered":
      return "bg-green-100 text-green-800";
    case "shipped":
      return "bg-blue-100 text-blue-800";
    case "processing":
      return "bg-yellow-100 text-yellow-800";
    case "cancelled":
      return "bg-red-100 text-red-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
}

// Helper to get product image URL
function getProductImageUrl(product: any): string {
  console.log('Getting image URL for product:', product);
  
  // First try product.image
  if (product?.image) {
    console.log('Using product.image:', product.image);
    return product.image;
  }

  // Then try product.imageUrl
  if (product?.imageUrl) {
    console.log('Using product.imageUrl:', product.imageUrl);
    return product.imageUrl;
  }

  // Finally try to get first image from product.images JSON
  if (product?.images) {
    try {
      const imagesArray = JSON.parse(product.images);
      if (Array.isArray(imagesArray) && imagesArray.length > 0) {
        console.log('Using product.images[0]:', imagesArray[0]);
        return imagesArray[0];
      }
    } catch {
      // If JSON parsing fails, try using it directly
      console.log('Using product.images directly:', product.images);
      return product.images;
    }
  }

  console.log('No image found, using placeholder');
  // Return a default image if nothing found
  return "https://placehold.co/100x100?text=No+Image";
}

// Helper to get status icon
function StatusIcon({ status }: { status: string }) {
  switch (status.toLowerCase()) {
    case "delivered":
      return <ClipboardCheck className="h-5 w-5 text-green-600" />;
    case "shipped":
      return <Truck className="h-5 w-5 text-blue-600" />;
    case "processing":
      return <Package2 className="h-5 w-5 text-yellow-600" />;
    case "cancelled":
      return <Clock className="h-5 w-5 text-red-600" />;
    default:
      return <Clock className="h-5 w-5 text-gray-600" />;
  }
}

export default function OrdersPage() {
  const [, navigate] = useLocation();
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortDescending, setSortDescending] = useState(true); // Default to newest first
  const [orderToCancel, setOrderToCancel] = useState<Order | null>(null);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [returningOrderId, setReturningOrderId] = useState<number | null>(null);
  const { toast } = useToast();
  const [cancelReason, setCancelReason] = useState("");
  
  // Return dialog state
  const [returnDialogOpen, setReturnDialogOpen] = useState(false);
  const [selectedOrderForReturn, setSelectedOrderForReturn] = useState<Order | null>(null);
  const [returnReason, setReturnReason] = useState("");
  const [returnDescription, setReturnDescription] = useState("");
  const [returnImages, setReturnImages] = useState<File[]>([]);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [returnReasons, setReturnReasons] = useState<any[]>([]);
  const [showCamera, setShowCamera] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [cameraVideoRef, setCameraVideoRef] = useState<HTMLVideoElement | null>(null);

  // Add this useEffect after the cameraVideoRef and cameraStream states
  useEffect(() => {
    if (cameraVideoRef && cameraStream) {
      cameraVideoRef.srcObject = cameraStream;
    }
  }, [cameraVideoRef, cameraStream]);

  // Cancel order mutation
  const cancelOrderMutation = useMutation({
    mutationFn: async ({
      orderId,
      reason,
    }: {
      orderId: number;
      reason: string;
    }) => {
      const response = await apiRequest(
        "POST",
        `/api/orders/${orderId}/cancel`,
        { reason }
      );
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to cancel order");
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Order Cancelled",
        description: "Your order has been successfully cancelled.",
      });
      // Refetch orders
      fetchOrders();
      // Close dialog
      setShowCancelDialog(false);
      setOrderToCancel(null);
      setCancelReason("");
    },
    onError: (error: Error) => {
      toast({
        title: "Cancellation Failed",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Function to fetch orders
  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/orders", {
        credentials: "include",
        headers: {
          "Cache-Control": "no-cache",
          Pragma: "no-cache",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch orders");
      }

      const ordersData = await response.json();
      console.log('Orders data:', ordersData); // Debug log

      // Fetch items for each order
      const ordersWithItems = await Promise.all(
        ordersData.map(async (order: any) => {
          try {
            const itemsResponse = await fetch(`/api/orders/${order.id}/items`, {
              credentials: "include",
            });
            if (itemsResponse.ok) {
              const itemsData = await itemsResponse.json();
              console.log(`Items for order ${order.id}:`, itemsData);
              return { ...order, items: itemsData };
            } else {
              console.log(`Failed to fetch items for order ${order.id}`);
              return { ...order, items: [] };
            }
          } catch (error) {
            console.error(`Error fetching items for order ${order.id}:`, error);
            return { ...order, items: [] };
          }
        })
      );

      console.log('Orders with items:', ordersWithItems);
      setOrders(ordersWithItems);
      setFilteredOrders(ordersWithItems);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching orders:", error);
      toast({
        title: "Error",
        description: "Failed to fetch orders. Please try again.",
        variant: "destructive",
      });
      setLoading(false);
    }
  };

  useEffect(() => {
    // Check if user is logged in
    const cachedUser = queryClient.getQueryData<any>(["/api/user"]);
    if (!cachedUser) {
      navigate("/auth");
      return;
    }

    // Fetch orders on component mount
    fetchOrders();
  }, [navigate]);

  useEffect(() => {
    fetchReturnReasons();
  }, []);

  // Cleanup camera stream on unmount
  useEffect(() => {
    return () => {
      if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [cameraStream]);

  const fetchReturnReasons = async () => {
    try {
      const response = await fetch('/api/returns/reasons?type=return');
      if (response.ok) {
        const reasons = await response.json();
        setReturnReasons(reasons);
      }
    } catch (error) {
      console.error('Error fetching return reasons:', error);
    }
  };

  // Sort orders by date
  const sortOrders = (ordersToSort: Order[]): Order[] => {
    return [...ordersToSort].sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      return sortDescending ? dateB - dateA : dateA - dateB;
    });
  };

  // Handle search and sorting
  useEffect(() => {
    // Check if orders array is available first
    if (!orders || orders.length === 0) {
      setFilteredOrders([]);
      return;
    }

    let result = [...orders];

    // Apply search filter
    if (searchQuery.trim() !== "") {
      const query = searchQuery.toLowerCase();

      result = result.filter((order) => {
        const idMatch = order.id.toString().includes(query);
        const statusMatch = order.status.toLowerCase().includes(query);
        const paymentMatch = order.paymentMethod.toLowerCase().includes(query);

        return idMatch || statusMatch || paymentMatch;
      });
    }

    // Apply sorting
    result = sortOrders(result);

    setFilteredOrders(result);
  }, [searchQuery, orders, sortDescending]);

  const handleReturnOrder = async (order: Order) => {
    setSelectedOrderForReturn(order);
    setReturnDialogOpen(true);
  };

  const submitReturnRequest = async () => {
    if (!selectedOrderForReturn || !returnReason || !returnDescription.trim() || returnImages.length === 0) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    setReturningOrderId(selectedOrderForReturn.id);
    try {
      // First, get the order details to get the actual order items
      console.log('Fetching order details for order:', selectedOrderForReturn.id);
      const orderDetailsResponse = await fetch(`/api/orders/${selectedOrderForReturn.id}`, {
        method: 'GET',
        credentials: 'include',
      });

      if (!orderDetailsResponse.ok) {
        throw new Error('Failed to fetch order details');
      }

      const orderDetails = await orderDetailsResponse.json();
      console.log('Order details:', orderDetails);

      // Get the first order item ID
      const orderItemId = orderDetails.items?.[0]?.id;
      if (!orderItemId) {
        throw new Error('No order items found for this order');
      }

      // Get the order item details to check its status
      const orderItem = orderDetails.items?.[0];
      console.log('Order item details:', orderItem);
      console.log('Order item status:', orderItem?.status);
      console.log('Order status:', orderDetails.status);

      console.log('Using order item ID:', orderItemId);

      // Upload images first
      let imageUrls: string[] = [];
      if (returnImages.length > 0) {
        setUploadingImages(true);
        const formData = new FormData();
        returnImages.forEach((file) => {
          formData.append('file', file);
        });

        console.log('Uploading images...');
        const uploadResponse = await fetch('/api/upload-multiple', {
          method: 'POST',
          body: formData,
          credentials: 'include',
        });

        if (uploadResponse.ok) {
          const uploadResult = await uploadResponse.json();
          imageUrls = uploadResult.urls || [];
          console.log('Images uploaded successfully:', imageUrls);
        } else {
          console.error('Image upload failed:', uploadResponse.status, uploadResponse.statusText);
          // Continue without images if upload fails
        }
      }

      // Create return request
      const returnData = {
        orderId: selectedOrderForReturn.id,
        orderItemId: orderItemId,
        requestType: 'return',
        reasonId: parseInt(returnReason),
        description: returnDescription,
        mediaUrls: imageUrls,
      };

      console.log('Submitting return request with data:', returnData);

      const returnResponse = await fetch('/api/returns/request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(returnData),
      });

      console.log('Return request response status:', returnResponse.status);

      if (!returnResponse.ok) {
        const errorText = await returnResponse.text();
        console.error('Return request failed:', errorText);
        throw new Error(`Failed to create return request: ${returnResponse.status} ${returnResponse.statusText}`);
      }

      const returnResult = await returnResponse.json();
      console.log('Return request created successfully:', returnResult);

      // Mark order for return
      console.log('Marking order for return...');
      const markResponse = await fetch(`/api/orders/${selectedOrderForReturn.id}/mark-for-return`, {
        method: "POST",
        credentials: "include",
      });
      
      if (!markResponse.ok) {
        console.error('Failed to mark order for return:', markResponse.status, markResponse.statusText);
        // Don't throw error here as the return request was already created
      } else {
        console.log('Order marked for return successfully');
      }

      toast({
        title: "Return Request Submitted",
        description: "Your return request has been submitted successfully. You can track it in My Returns.",
      });
      
      setReturnDialogOpen(false);
      setReturnReason("");
      setReturnDescription("");
      setReturnImages([]);
      setSelectedOrderForReturn(null);
      // refetch(); // Assuming refetch is available from queryClient or similar
    } catch (error) {
      console.error('Error in submitReturnRequest:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to submit return request. Please try again.",
        variant: "destructive",
      });
    } finally {
      setReturningOrderId(null);
      setUploadingImages(false);
    }
  };

  // Refactor image upload handler to ensure only valid images are added and previewed
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    const validFiles = files.filter(file =>
      file.type.startsWith('image/') && file.size <= 5 * 1024 * 1024 // 5MB limit
    );
    if (validFiles.length !== files.length) {
      toast({
        title: "Invalid Files",
        description: "Some files were not uploaded. Only images under 5MB are allowed.",
        variant: "destructive",
      });
    }
    setReturnImages(prev => [...prev, ...validFiles]);
  };

  const removeImage = (index: number) => {
    setReturnImages(prev => prev.filter((_, i) => i !== index));
  };

  // Camera functions
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } // Use back camera if available
      });
      setCameraStream(stream);
      setShowCamera(true);
      if (cameraVideoRef) {
        cameraVideoRef.srcObject = stream;
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      toast({
        title: "Camera Error",
        description: "Unable to access camera. Please check permissions.",
        variant: "destructive",
      });
    }
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
    setShowCamera(false);
  };

  const capturePhoto = () => {
    if (cameraVideoRef) {
      const canvas = document.createElement('canvas');
      canvas.width = cameraVideoRef.videoWidth;
      canvas.height = cameraVideoRef.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(cameraVideoRef, 0, 0);
        canvas.toBlob((blob) => {
          if (blob) {
            const file = new File([blob], `camera-photo-${Date.now()}.jpg`, { type: 'image/jpeg' });
            setReturnImages(prev => [...prev, file]);
            stopCamera();
          }
        }, 'image/jpeg', 0.8);
      }
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

    return (
      <div className="bg-[#F8F5E4] min-h-screen">
        <div className="mb-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
            <div>
              <h1 className="text-2xl font-bold">My Orders</h1>
              <p className="text-muted-foreground">
                Track, return, or buy again
              </p>
            </div>

            <div className="mt-4 md:mt-0 flex flex-col md:flex-row gap-3 w-full md:w-auto">
              {/* Sort Toggle Button */}
              <Button
                variant="outline"
                size="sm"
                className="flex items-center justify-center gap-2 h-10 bg-[#F8F5E4]"
                onClick={() => setSortDescending(!sortDescending)}
                aria-label={
                  sortDescending
                    ? "Sort by oldest first"
                    : "Sort by newest first"
                }
              >
                {sortDescending ? (
                  <>
                    <ArrowDownAZ className="h-4 w-4" />
                    <span>Newest First</span>
                  </>
                ) : (
                  <>
                    <ArrowUpAZ className="h-4 w-4" />
                    <span>Oldest First</span>
                  </>
                )}
              </Button>

              {/* Search Box */}
              <div className="relative md:min-w-[250px]">
                <Input
                  type="text"
                  placeholder="Search by order ID or status"
                  className="pl-10 w-full bg-[#F8F5E4]"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  aria-label="Search orders"
                />
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              </div>
            </div>
          </div>
        </div>

        {filteredOrders.length === 0 ? (
          <div className="bg-[#F8F5E4] rounded-lg shadow-sm p-8 text-center">
            <ShoppingBag className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">No Orders Found</h2>
            <p className="text-muted-foreground mb-4">
              {searchQuery
                ? "No orders match your search criteria."
                : "You haven't placed any orders yet."}
            </p>
            <Button onClick={() => navigate("/")} className="bg-[#F8F5E4]">Start Shopping</Button>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredOrders.map((order) => (
              <Card
                key={order.id}
                className="p-6 hover:shadow-md transition-shadow cursor-pointer bg-[#F8F5E4]"
                onClick={() => navigate(`/order/${order.id}`)}
              >
                <div className="flex flex-col md:flex-row justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <StatusIcon status={order.status} />
                      <Badge className={`${getStatusColor(order.status)} bg-[#F8F5E4]`}>
                        {order.status.charAt(0).toUpperCase() +
                          order.status.slice(1)}
                      </Badge>
                    </div>

                    <h3 className="font-medium">Order #{order.id}</h3>
                    <p className="text-sm text-muted-foreground">
                      Placed on {formatDate(order.date)}
                    </p>

                                        {/* Product Images */}
                    {order.items && order.items.length > 0 ? (
                      <>
                        {console.log('Order items for order', order.id, ':', order.items)}
                        <div className="flex items-center space-x-2 mt-3">
                          <span className="text-sm text-muted-foreground">Products:</span>
                          <div className="flex space-x-2">
                            {order.items.slice(0, 3).map((item, index) => (
                              <div key={index} className="relative">
                                <img
                                  src={getProductImageUrl(item.product)}
                                  alt={item.product?.name || 'Product'}
                                  className="w-12 h-12 object-cover rounded border bg-[#EADDCB]"
                                  onError={(e) => {
                                    console.log('Image failed to load for product:', item.product?.name, 'URL:', e.currentTarget.src);
                                    e.currentTarget.src = 'https://placehold.co/100x100?text=No+Image';
                                  }}
                                  onLoad={() => {
                                    console.log('Image loaded successfully for product:', item.product?.name);
                                  }}
                                />
                                {/* Debug overlay to show if image container is rendered */}
                                <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full text-xs text-white flex items-center justify-center">
                                  {index + 1}
                                </div>
                              </div>
                            ))}
                            {order.items.length > 3 && (
                              <div className="w-12 h-12 bg-[#EADDCB] rounded border flex items-center justify-center text-xs text-gray-500">
                                +{order.items.length - 3}
                              </div>
                            )}
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="flex items-center space-x-2 mt-3">
                        <span className="text-sm text-muted-foreground">Products:</span>
                        <div className="w-12 h-12 bg-[#EADDCB] rounded border flex items-center justify-center text-xs text-gray-500">
                          <Package2 className="h-6 w-6" />
                        </div>
                      </div>
                    )}

                    <div className="mt-3">
                      <p className="text-sm text-muted-foreground">
                        <span className="font-medium">Payment Method:</span>{" "}
                        {order.paymentMethod === "cod"
                          ? "Cash on Delivery"
                          : order.paymentMethod}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 md:mt-0 flex flex-col md:items-end justify-between">
                    {/* Show the final total after all discounts */}
                    <p className="font-semibold text-xl">
                      ₹
                      {(
                        order.total -
                        (order.walletDiscount || 0) -
                        (order.couponDiscount || 0)
                      ).toFixed(2)}
                    </p>
                    {/* Show wallet discount if used and > 0 */}
                    {(order.walletDiscount ?? 0) > 0 && (
                      <p className="text-green-600 text-sm">
                        Wallet Points Used: -₹{order.walletDiscount?.toFixed(2)}
                      </p>
                    )}
                    {/* Show coupon discount if used and > 0 */}
                    {(order.couponDiscount ?? 0) > 0 && (
                      <p className="text-green-600 text-sm">
                        Coupon Discount: -₹{order.couponDiscount?.toFixed(2)}
                      </p>
                    )}
                    {(order.discount ?? 0) > 0 && (
                      <p className="text-green-600 text-sm">
                        Redeemed Coins Used: -₹{order.discount?.toFixed(2)}
                      </p>
                    )}
                    {/* Show reward discount if used and > 0 */}
                    {order.rewardDiscount && order.rewardDiscount > 0 ? (
                      <p className="text-blue-600 text-sm">
                        Reward Points Used: -₹{order.rewardDiscount.toFixed(2)}
                      </p>
                    ) : null}

                    <div className="flex space-x-2 mt-2 md:mt-auto">
                      {/* Only show cancel button for pending/processing orders */}
                      {(order.status === "pending" ||
                        order.status === "processing") && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex items-center text-red-500 border-red-200 hover:bg-red-50 bg-[#F8F5E4]"
                          onClick={(e) => {
                            e.stopPropagation();
                            setOrderToCancel(order);
                            setShowCancelDialog(true);
                          }}
                        >
                          <X className="mr-1 h-4 w-4" />
                          Cancel Order
                        </Button>
                      )}

                      {order.status === "delivered" && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex items-center text-blue-500 border-blue-200 hover:bg-blue-50 bg-[#F8F5E4]"
                          disabled={returningOrderId === order.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleReturnOrder(order);
                          }}
                        >
                          {returningOrderId === order.id ? (
                            <span className="animate-spin mr-2">⟳</span>
                          ) : null}
                          Return
                        </Button>
                      )}

                      <Button
                        variant="ghost"
                        className="flex items-center bg-[#F8F5E4]"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/order/${order.id}`);
                        }}
                      >
                        View Details <ChevronRight className="ml-1 h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    );
  };

  // Fallback reasons if API returns nothing
  const fallbackReasons = [
    { id: 1, text: 'Wrong item received' },
    { id: 2, text: 'Item damaged' },
    { id: 3, text: 'Not as described' },
    { id: 4, text: 'Other' },
  ];
  const filteredReturnReasons =
    Array.isArray(returnReasons) && returnReasons.length > 0
      ? returnReasons.filter(r => r && r.id && r.text)
      : fallbackReasons;

  // Debug logs
  console.log('filteredReturnReasons:', filteredReturnReasons);
  console.log('returnImages:', returnImages);

  return (
    <DashboardLayout>
      {renderContent()}

      {/* Cancel Order Confirmation Dialog */}
      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Cancel Order #{orderToCancel?.id}</DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel this order? This action cannot be
              undone.
            </DialogDescription>
          </DialogHeader>

          <div className="p-4 mt-2 bg-red-50 border border-red-100 rounded-md">
            <p className="text-sm text-red-800">
              <strong>Note:</strong> Order cancellation is only possible for
              orders that have not been shipped. If payment was made, a refund
              will be initiated automatically.
            </p>
          </div>

          {/* Reason selection */}
          <div className="mt-4">
            <label className="block text-sm font-medium mb-2">
              Select a reason for cancellation{" "}
              <span className="text-red-500">*</span>
            </label>
            <Select value={cancelReason} onValueChange={setCancelReason}>
              <SelectTrigger className="w-full bg-[#F8F5E4]">
                <SelectValue placeholder="Choose a reason" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Late delivery date">
                  Due to late delivery date
                </SelectItem>
                <SelectItem value="Product quality issue">
                  Due to product quality
                </SelectItem>
                <SelectItem value="Found cheaper price elsewhere">
                  Looking for cheaper price
                </SelectItem>
                <SelectItem value="Ordered by mistake">
                  Ordered by mistake
                </SelectItem>
                <SelectItem value="Change of mind">Change of mind</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <DialogFooter className="flex justify-between sm:justify-between mt-4">
            <Button
              type="button"
              variant="outline"
              className="bg-[#F8F5E4]"
              onClick={() => {
                setShowCancelDialog(false);
                setOrderToCancel(null);
                setCancelReason("");
              }}
            >
              Keep Order
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={cancelOrderMutation.isPending || !cancelReason}
              onClick={() => {
                if (orderToCancel && cancelReason) {
                  cancelOrderMutation.mutate({
                    orderId: orderToCancel.id,
                    reason: cancelReason,
                  });
                }
              }}
            >
              {cancelOrderMutation.isPending ? (
                <>
                  <span className="animate-spin mr-2">⟳</span> Cancelling...
                </>
              ) : (
                "Cancel Order"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Return Request Dialog */}
      <Dialog open={returnDialogOpen} onOpenChange={setReturnDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Request Return</DialogTitle>
            <DialogDescription>
              Please provide details about your return request for Order #{selectedOrderForReturn?.id}
            </DialogDescription>
          </DialogHeader>
          
          {selectedOrderForReturn && (
            <div className="space-y-4">
              {/* Return Reason */}
              <div className="space-y-2">
                <label htmlFor="return-reason" className="block font-medium mb-1">Return Reason *</label>
                <select
                  id="return-reason"
                  value={returnReason}
                  onChange={e => setReturnReason(e.target.value)}
                  required
                  className="block w-full border rounded px-3 py-2 bg-[#F8F5E4]"
                >
                  <option value="">Select a reason for return</option>
                  {fallbackReasons.map((reason) => (
                    <option key={reason.id} value={reason.id.toString()}>
                      {reason.text}
                    </option>
                  ))}
                </select>
              </div>
              {/* Description */}
              <div className="space-y-2">
                <label htmlFor="return-description" className="block font-medium mb-1">Description *</label>
                <textarea
                  id="return-description"
                  placeholder="Please provide detailed description of the issue..."
                  value={returnDescription}
                  onChange={e => setReturnDescription(e.target.value)}
                  rows={4}
                  required
                  className="block w-full border rounded px-3 py-2 bg-[#F8F5E4]"
                />
              </div>
              {/* Image Upload */}
              <div className="space-y-2">
                <label className="block font-medium mb-1">Images *</label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="flex-1"
                    aria-label="Upload images from device"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={startCamera}
                    className="flex items-center gap-2 bg-[#F8F5E4]"
                    aria-label="Take photo with camera"
                  >
                    <Camera className="h-4 w-4" />
                    Camera
                  </Button>
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {returnImages.map((file, idx) => (
                    <div key={idx} style={{ position: 'relative', display: 'inline-block' }}>
                      <img
                        src={URL.createObjectURL(file)}
                        alt=""
                        style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 4, border: '1px solid #eee' }}
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(idx)}
                        style={{
                          position: 'absolute',
                          top: 2,
                          right: 2,
                          background: 'rgba(0,0,0,0.6)',
                          color: 'white',
                          border: 'none',
                          borderRadius: '50%',
                          width: 22,
                          height: 22,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          fontSize: 14,
                          zIndex: 2,
                        }}
                        title="Remove image"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              className="bg-[#F8F5E4]"
              onClick={() => setReturnDialogOpen(false)}
              disabled={returningOrderId === selectedOrderForReturn?.id}
            >
              Cancel
            </Button>
            <Button
              onClick={submitReturnRequest}
              disabled={
                returningOrderId === selectedOrderForReturn?.id ||
                !returnReason ||
                !returnDescription.trim() ||
                returnImages.length === 0
              }
            >
              {returningOrderId === selectedOrderForReturn?.id ? (
                <>
                  <div className="animate-spin mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                  Submitting...
                </>
              ) : (
                'Submit Return Request'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Camera Modal */}
      <Dialog open={showCamera} onOpenChange={setShowCamera}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Take Photo</DialogTitle>
            <DialogDescription>
              Take a photo of the item you want to return
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="relative bg-black rounded-lg overflow-hidden">
              <video
                ref={setCameraVideoRef}
                autoPlay
                playsInline
                className="w-full h-64 object-cover"
                onLoadedMetadata={() => {
                  if (cameraVideoRef) {
                    cameraVideoRef.play();
                  }
                }}
              />
            </div>
            
            <div className="flex justify-center gap-4">
              <Button
                variant="outline"
                onClick={stopCamera}
                className="flex items-center gap-2 bg-[#F8F5E4]"
              >
                Cancel
              </Button>
              <Button
                onClick={capturePhoto}
                className="flex items-center gap-2 bg-[#F8F5E4]"
              >
                <Camera className="h-4 w-4" />
                Capture Photo
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
