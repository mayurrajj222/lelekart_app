import { useState } from 'react';
import { Link, useParams } from 'wouter';
import { useQuery, useMutation } from '@tanstack/react-query';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from '@/components/ui/form';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { 
  Input, 
  InputProps 
} from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink } from '@/components/ui/breadcrumb';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { 
  ChevronLeftIcon, 
  Loader2Icon, 
  AlertCircleIcon, 
  ClockIcon, 
  FileTextIcon, 
  RefreshCcwIcon, 
  MessageSquareIcon, 
  ImageIcon, 
  XCircleIcon, 
  CheckCircleIcon, 
  PackageIcon, 
  TruckIcon, 
  InfoIcon,
  UploadIcon,
  SendIcon,
  ShoppingBagIcon
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { format, formatDistanceToNow } from 'date-fns';
import { queryClient, apiRequest } from '@/lib/queryClient';

// Message schema for form validation
const messageSchema = z.object({
  message: z.string().min(1, {
    message: "Message cannot be empty",
  }).max(500, {
    message: "Message cannot be more than 500 characters"
  }),
});

// Tracking info schema for adding tracking information
const trackingSchema = z.object({
  trackingNumber: z.string().min(1, {
    message: "Tracking number is required",
  }),
  courierName: z.string().min(1, {
    message: "Courier name is required",
  }),
  trackingUrl: z.string().url({
    message: "Please provide a valid URL",
  }).optional(),
});

// Return status badge colors
const statusColors = {
  pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  approved: 'bg-blue-100 text-blue-800 border-blue-200',
  item_in_transit: 'bg-purple-100 text-purple-800 border-purple-200',
  item_received: 'bg-indigo-100 text-indigo-800 border-indigo-200',
  replacement_in_transit: 'bg-cyan-100 text-cyan-800 border-cyan-200',
  refund_initiated: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  refund_processed: 'bg-green-100 text-green-800 border-green-200',
  completed: 'bg-green-100 text-green-800 border-green-200',
  rejected: 'bg-red-100 text-red-800 border-red-200',
  cancelled: 'bg-gray-100 text-gray-800 border-gray-200',
};

// Return status icons
const statusIcons = {
  pending: <ClockIcon className="h-5 w-5" />,
  approved: <CheckCircleIcon className="h-5 w-5" />,
  item_in_transit: <TruckIcon className="h-5 w-5" />,
  item_received: <PackageIcon className="h-5 w-5" />,
  replacement_in_transit: <TruckIcon className="h-5 w-5" />,
  refund_initiated: <RefreshCcwIcon className="h-5 w-5" />,
  refund_processed: <RefreshCcwIcon className="h-5 w-5" />,
  completed: <CheckCircleIcon className="h-5 w-5" />,
  rejected: <XCircleIcon className="h-5 w-5" />,
  cancelled: <XCircleIcon className="h-5 w-5" />,
};

// Format status for display
const formatStatus = (status: string) => {
  return status.split('_').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join(' ');
};

// Type for message form values
type MessageFormValues = z.infer<typeof messageSchema>;
// Type for tracking form values
type TrackingFormValues = z.infer<typeof trackingSchema>;

// Status progress steps based on request type
const getReturnSteps = (requestType: string) => {
  const commonSteps = [
    { status: 'pending', label: 'Request Submitted' },
    { status: 'approved', label: 'Request Approved' },
    { status: 'item_in_transit', label: 'Item in Transit' },
    { status: 'item_received', label: 'Item Received' },
  ];
  
  if (requestType === 'replacement') {
    return [
      ...commonSteps,
      { status: 'replacement_in_transit', label: 'Replacement Shipped' },
      { status: 'completed', label: 'Completed' },
    ];
  } else if (requestType === 'refund') {
    return [
      ...commonSteps,
      { status: 'refund_initiated', label: 'Refund Initiated' },
      { status: 'refund_processed', label: 'Refund Processed' },
      { status: 'completed', label: 'Completed' },
    ];
  } else {
    return [
      ...commonSteps,
      { status: 'refund_initiated', label: 'Refund Initiated' },
      { status: 'refund_processed', label: 'Refund Processed' },
      { status: 'completed', label: 'Completed' },
    ];
  }
};

export default function ReturnDetails() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { id } = useParams<{ id: string }>();
  const [activeTab, setActiveTab] = useState('details');
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [trackingDialogOpen, setTrackingDialogOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  
  // Fetch return request details
  const { 
    data: returnRequest, 
    isLoading, 
    error, 
    refetch 
  } = useQuery({
    queryKey: [`/api/returns/${id}`],
    enabled: !!id && !!user,
  });

  // Message form
  const messageForm = useForm<MessageFormValues>({
    resolver: zodResolver(messageSchema),
    defaultValues: {
      message: '',
    },
  });

  // Tracking info form
  const trackingForm = useForm<TrackingFormValues>({
    resolver: zodResolver(trackingSchema),
    defaultValues: {
      trackingNumber: '',
      courierName: '',
      trackingUrl: '',
    },
  });

  // Cancel return request mutation
  const cancelReturnMutation = useMutation({
    mutationFn: async (reason: string) => {
      const res = await apiRequest('POST', `/api/returns/${id}/cancel`, { reason });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Failed to cancel return request');
      }
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Return Request Cancelled",
        description: "Your return request has been cancelled successfully.",
      });
      refetch();
      setCancelDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to cancel return request",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Add message mutation
  const addMessageMutation = useMutation({
    mutationFn: async (data: MessageFormValues) => {
      const res = await apiRequest('POST', `/api/returns/${id}/message`, data);
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Failed to send message');
      }
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Message Sent",
        description: "Your message has been sent successfully.",
      });
      messageForm.reset();
      refetch();
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to send message",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update tracking info mutation
  const updateTrackingMutation = useMutation({
    mutationFn: async (data: TrackingFormValues) => {
      const res = await apiRequest('POST', `/api/returns/${id}/tracking`, data);
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Failed to update tracking information');
      }
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Tracking Updated",
        description: "Return shipping information has been updated successfully.",
      });
      trackingForm.reset();
      setTrackingDialogOpen(false);
      refetch();
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update tracking",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Handle form submit for messages
  const onMessageSubmit = (values: MessageFormValues) => {
    addMessageMutation.mutate(values);
  };

  // Handle form submit for tracking info
  const onTrackingSubmit = (values: TrackingFormValues) => {
    updateTrackingMutation.mutate(values);
  };

  // Handle cancel return request
  const handleCancelReturn = () => {
    if (!cancelReason.trim()) {
      toast({
        title: "Reason Required",
        description: "Please provide a reason for cancellation.",
        variant: "destructive",
      });
      return;
    }
    
    cancelReturnMutation.mutate(cancelReason);
  };

  // Render print return label button if return is approved
  const renderActionButton = () => {
    if (!returnRequest) return null;
    
    if (returnRequest.status === 'approved') {
      return (
        <>
          <Button
            variant="outline"
            className="w-full sm:w-auto mb-2 sm:mb-0 sm:mr-2"
            onClick={() => window.open(`/api/returns/${id}/label`, '_blank')}
          >
            <FileTextIcon className="mr-2 h-4 w-4" />
            Print Return Label
          </Button>
          
          <Button
            variant="default"
            className="w-full sm:w-auto"
            onClick={() => setTrackingDialogOpen(true)}
          >
            <TruckIcon className="mr-2 h-4 w-4" />
            Add Shipping Details
          </Button>
        </>
      );
    }
    
    if (returnRequest.status === 'pending') {
      return (
        <Button
          variant="destructive"
          onClick={() => setCancelDialogOpen(true)}
        >
          <XCircleIcon className="mr-2 h-4 w-4" />
          Cancel Request
        </Button>
      );
    }
    
    return null;
  };

  // Calculate status progress
  const calculateProgress = (status: string, requestType: string) => {
    const steps = getReturnSteps(requestType);
    const currentStepIndex = steps.findIndex(step => step.status === status);
    
    if (currentStepIndex === -1) return 0;
    return ((currentStepIndex + 1) / steps.length) * 100;
  };

  // Redirect to login if not authenticated
  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <p className="text-lg text-gray-600 mb-4">Please login to view return details</p>
        <Button asChild>
          <Link to="/auth">Login</Link>
        </Button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2Icon className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !returnRequest) {
    return (
      <div className="container max-w-4xl mx-auto py-6 px-4">
        <Alert variant="destructive" className="mb-6">
          <AlertCircleIcon className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            There was an error loading the return request details. Please try again.
          </AlertDescription>
        </Alert>
        <Button asChild variant="outline">
          <Link to="/returns">
            <ChevronLeftIcon className="mr-2 h-4 w-4" /> Back to Returns
          </Link>
        </Button>
      </div>
    );
  }

  // Extract useful data
  const { 
    id: returnId,
    orderId,
    orderNumber,
    requestType,
    orderItem,
    status,
    createdAt,
    reasonText,
    description,
    mediaUrls,
    messages,
    statusHistory,
    returnTrackingNumber,
    returnCourierName,
    returnTrackingUrl,
    replacementTrackingNumber,
    replacementCourierName,
    replacementTrackingUrl,
    refundAmount,
    refundMethod,
    refundStatus
  } = returnRequest;

  return (
    <div className="min-h-screen bg-[#F8F5E4]">
      <div className="container max-w-4xl mx-auto py-6 px-4">
        <Breadcrumb className="mb-6">
          <BreadcrumbItem>
            <BreadcrumbLink as={Link} to="/">Home</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbItem>
            <BreadcrumbLink as={Link} to="/returns">My Returns</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbItem isCurrentPage>
            <BreadcrumbLink>Return #{returnId}</BreadcrumbLink>
          </BreadcrumbItem>
        </Breadcrumb>
        
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight">Return Request #{returnId}</h1>
              <Badge className={`${statusColors[status]} font-normal`}>
                {formatStatus(status)}
              </Badge>
            </div>
            <p className="text-gray-500 mt-1">
              {requestType.charAt(0).toUpperCase() + requestType.slice(1)} Request for Order #{orderNumber}
            </p>
          </div>
          <Button asChild variant="outline" className="mt-4 sm:mt-0">
            <Link to="/returns">
              <ChevronLeftIcon className="mr-2 h-4 w-4" /> Back to Returns
            </Link>
          </Button>
        </div>
        
        {/* Status Progress */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="mb-2">
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm font-medium">Return Progress</span>
                <span className="text-sm text-gray-500">
                  {status === 'completed' ? 'Completed' : 'In Progress'}
                </span>
              </div>
              <Progress value={calculateProgress(status, requestType)} className="h-2" />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
              {getReturnSteps(requestType).map((step, index) => {
                const isCompleted = statusHistory.some(history => history.status === step.status);
                const isCurrent = status === step.status;
                
                return (
                  <div 
                    key={index} 
                    className={`flex items-center p-3 rounded-lg border ${
                      isCurrent 
                        ? 'border-primary bg-primary/5' 
                        : isCompleted 
                          ? 'border-green-200 bg-green-50' 
                          : 'border-gray-200'
                    }`}
                  >
                    <div className={`rounded-full p-2 mr-3 ${
                      isCurrent 
                        ? 'bg-primary/10 text-primary' 
                        : isCompleted 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-gray-100 text-gray-400'
                    }`}>
                      {isCurrent && statusIcons[step.status]}
                      {isCompleted && !isCurrent && <CheckCircleIcon className="h-5 w-5" />}
                      {!isCompleted && !isCurrent && <ClockIcon className="h-5 w-5" />}
                    </div>
                    <div>
                      <p className={`text-sm font-medium ${
                        isCurrent 
                          ? 'text-primary' 
                          : isCompleted 
                            ? 'text-green-700' 
                            : 'text-gray-500'
                      }`}>
                        {step.label}
                      </p>
                      {isCompleted && (
                        <p className="text-xs text-gray-500">
                          {format(
                            new Date(
                              statusHistory.find(h => h.status === step.status)?.createdAt || new Date()
                            ), 
                            'MMM d, h:mm a'
                          )}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <Tabs defaultValue="details" value={activeTab} onValueChange={setActiveTab} className="mb-6">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="details">Details</TabsTrigger>
                <TabsTrigger value="timeline">Timeline</TabsTrigger>
                <TabsTrigger value="communication">
                  Communication
                  {messages && messages.length > 0 && (
                    <Badge className="ml-2 bg-primary">{messages.length}</Badge>
                  )}
                </TabsTrigger>
              </TabsList>
            </Tabs>
            
            <TabsContent value="details" className="mt-0">
              <Card>
                <CardHeader>
                  <CardTitle>Return Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Product Information */}
                  <div className="space-y-3">
                    <h3 className="text-lg font-medium">Product Information</h3>
                    <div className="flex flex-col sm:flex-row gap-4">
                      <div className="w-24 h-24 rounded-md border overflow-hidden flex-shrink-0">
                        <img 
                          src={orderItem.product.image || "https://placehold.co/200x200?text=No+Image"} 
                          alt={orderItem.product.name} 
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div>
                        <h4 className="font-medium">{orderItem.product.name}</h4>
                        <p className="text-sm text-gray-500">Quantity: {orderItem.quantity}</p>
                        <p className="text-sm text-gray-500">Price: ₹{orderItem.price}</p>
                        <Button asChild variant="link" className="p-0 h-auto text-primary hover:text-primary/80">
                          <Link to={`/orders/${orderId}`}>
                            View Order Details
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  {/* Return Request Information */}
                  <div className="space-y-3">
                    <h3 className="text-lg font-medium">Request Information</h3>
                    <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3">
                      <div>
                        <dt className="text-sm text-gray-500">Request Type</dt>
                        <dd className="font-medium">
                          {requestType.charAt(0).toUpperCase() + requestType.slice(1)}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-sm text-gray-500">Request Date</dt>
                        <dd className="font-medium">
                          {format(new Date(createdAt), 'MMM d, yyyy, h:mm a')}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-sm text-gray-500">Reason</dt>
                        <dd className="font-medium">{reasonText}</dd>
                      </div>
                      <div>
                        <dt className="text-sm text-gray-500">Status</dt>
                        <dd>
                          <Badge className={`${statusColors[status]} font-normal`}>
                            {formatStatus(status)}
                          </Badge>
                        </dd>
                      </div>
                      {refundAmount && (
                        <div>
                          <dt className="text-sm text-gray-500">Refund Amount</dt>
                          <dd className="font-medium">₹{refundAmount}</dd>
                        </div>
                      )}
                      {refundMethod && (
                        <div>
                          <dt className="text-sm text-gray-500">Refund Method</dt>
                          <dd className="font-medium">
                            {refundMethod === 'original_method' 
                              ? 'Original Payment Method' 
                              : 'Wallet Credit'}
                          </dd>
                        </div>
                      )}
                    </dl>
                  </div>
                  
                  {/* Description */}
                  <div className="space-y-3">
                    <h3 className="text-lg font-medium">Description</h3>
                    <p className="text-gray-700">{description}</p>
                  </div>
                  
                  {/* Images */}
                  {mediaUrls && mediaUrls.length > 0 && (
                    <div className="space-y-3">
                      <h3 className="text-lg font-medium">Images</h3>
                      <div className="flex flex-wrap gap-3">
                        {mediaUrls.map((url, index) => (
                          <div 
                            key={index} 
                            className="w-24 h-24 rounded-md border overflow-hidden cursor-pointer"
                            onClick={() => setSelectedImage(url)}
                          >
                            <img 
                              src={url} 
                              alt={`Return image ${index + 1}`} 
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Shipping Information - Return */}
                  {returnTrackingNumber && (
                    <div className="space-y-3">
                      <h3 className="text-lg font-medium">Return Shipping Information</h3>
                      <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3">
                        <div>
                          <dt className="text-sm text-gray-500">Courier</dt>
                          <dd className="font-medium">{returnCourierName}</dd>
                        </div>
                        <div>
                          <dt className="text-sm text-gray-500">Tracking Number</dt>
                          <dd className="font-medium">
                            {returnTrackingUrl ? (
                              <a 
                                href={returnTrackingUrl} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-primary hover:underline"
                              >
                                {returnTrackingNumber}
                              </a>
                            ) : (
                              returnTrackingNumber
                            )}
                          </dd>
                        </div>
                      </dl>
                    </div>
                  )}
                  
                  {/* Shipping Information - Replacement */}
                  {replacementTrackingNumber && (
                    <div className="space-y-3">
                      <h3 className="text-lg font-medium">Replacement Shipping Information</h3>
                      <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3">
                        <div>
                          <dt className="text-sm text-gray-500">Courier</dt>
                          <dd className="font-medium">{replacementCourierName}</dd>
                        </div>
                        <div>
                          <dt className="text-sm text-gray-500">Tracking Number</dt>
                          <dd className="font-medium">
                            {replacementTrackingUrl ? (
                              <a 
                                href={replacementTrackingUrl} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-primary hover:underline"
                              >
                                {replacementTrackingNumber}
                              </a>
                            ) : (
                              replacementTrackingNumber
                            )}
                          </dd>
                        </div>
                      </dl>
                    </div>
                  )}
                </CardContent>
                <CardFooter className="flex justify-end flex-wrap gap-3 border-t pt-6">
                  {renderActionButton()}
                </CardFooter>
              </Card>
            </TabsContent>
            
            <TabsContent value="timeline" className="mt-0">
              <Card>
                <CardHeader>
                  <CardTitle>Status Timeline</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="relative pl-8 border-l-2 border-gray-200 space-y-8 py-2">
                    {statusHistory.map((event, index) => (
                      <div key={index} className="relative">
                        <div className="absolute -left-[27px] rounded-full w-6 h-6 flex items-center justify-center border-2 border-white bg-primary text-white">
                          {statusIcons[event.status] || <InfoIcon className="h-3 w-3" />}
                        </div>
                        <div className="mb-1">
                          <span className="font-medium">{formatStatus(event.status)}</span>
                          <span className="text-sm text-gray-500 ml-2">
                            {format(new Date(event.createdAt), 'MMM d, yyyy, h:mm a')}
                          </span>
                        </div>
                        <p className="text-gray-600 text-sm">{event.notes}</p>
                      </div>
                    ))}
                  </div>
                  
                  {statusHistory.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-6">
                      <div className="rounded-full bg-gray-100 p-3 mb-4">
                        <ClockIcon className="h-6 w-6 text-gray-400" />
                      </div>
                      <p className="text-gray-500">No status updates yet</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="communication" className="mt-0">
              <Card>
                <CardHeader>
                  <CardTitle>Communication</CardTitle>
                  <CardDescription>
                    Messages between you and the seller about this return
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6 mb-6">
                    {messages && messages.length > 0 ? (
                      messages.map((message, index) => (
                        <div 
                          key={index} 
                          className={`flex ${message.userId === user.id ? 'justify-end' : 'justify-start'}`}
                        >
                          <div 
                            className={`max-w-[80%] rounded-lg p-4 ${
                              message.userId === user.id 
                                ? 'bg-primary text-primary-foreground rounded-tr-none' 
                                : 'bg-gray-100 text-gray-800 rounded-tl-none'
                            }`}
                          >
                            <div className="flex items-center gap-2 mb-1">
                              <span className={`text-xs ${message.userId === user.id ? 'text-primary-foreground/80' : 'text-gray-500'}`}>
                                {message.user?.name || message.user?.username || 'User'}
                              </span>
                              <span className={`text-xs ${message.userId === user.id ? 'text-primary-foreground/80' : 'text-gray-500'}`}>
                                {format(new Date(message.createdAt), 'MMM d, h:mm a')}
                              </span>
                            </div>
                            <p className="whitespace-pre-wrap">{message.message}</p>
                            
                            {/* Message Images */}
                            {message.mediaUrls && message.mediaUrls.length > 0 && (
                              <div className="flex flex-wrap gap-2 mt-2">
                                {message.mediaUrls.map((url, imgIndex) => (
                                  <div 
                                    key={imgIndex} 
                                    className="w-16 h-16 rounded-md border overflow-hidden cursor-pointer"
                                    onClick={() => setSelectedImage(url)}
                                  >
                                    <img 
                                      src={url} 
                                      alt={`Message image ${imgIndex + 1}`} 
                                      className="w-full h-full object-cover"
                                    />
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="flex flex-col items-center justify-center py-6">
                        <div className="rounded-full bg-gray-100 p-3 mb-4">
                          <MessageSquareIcon className="h-6 w-6 text-gray-400" />
                        </div>
                        <p className="text-gray-500">No messages yet</p>
                      </div>
                    )}
                  </div>
                  
                  {/* Message Input */}
                  {['completed', 'cancelled', 'rejected'].includes(status) ? (
                    <Alert className="mb-4">
                      <InfoIcon className="h-4 w-4" />
                      <AlertTitle>Conversation Closed</AlertTitle>
                      <AlertDescription>
                        This return request is {status}, and no new messages can be sent.
                      </AlertDescription>
                    </Alert>
                  ) : (
                    <Form {...messageForm}>
                      <form onSubmit={messageForm.handleSubmit(onMessageSubmit)} className="space-y-4">
                        <FormField
                          control={messageForm.control}
                          name="message"
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Textarea 
                                  placeholder="Type your message here..." 
                                  className="resize-none min-h-[100px]" 
                                  {...field} 
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <div className="flex justify-end">
                          <Button 
                            type="submit" 
                            disabled={addMessageMutation.isPending}
                          >
                            {addMessageMutation.isPending ? (
                              <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                              <SendIcon className="mr-2 h-4 w-4" />
                            )}
                            Send Message
                          </Button>
                        </div>
                      </form>
                    </Form>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </div>
          
          {/* Sidebar */}
          <div>
            {/* Help Card */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Need Help?</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-gray-600">
                  If you have any questions or need assistance with your return, please contact our support team.
                </p>
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  asChild
                >
                  <Link to="/support">
                    <MessageSquareIcon className="mr-2 h-4 w-4" />
                    Contact Support
                  </Link>
                </Button>
              </CardContent>
            </Card>
            
            {/* Return Policy */}
            <Card>
              <CardHeader>
                <CardTitle>Return Policy</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <h4 className="font-medium">Return Window</h4>
                  <p className="text-sm text-gray-600">
                    Returns are typically accepted within 30 days of delivery, subject to seller's policy.
                  </p>
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-medium">Item Condition</h4>
                  <p className="text-sm text-gray-600">
                    The item must be unused, unworn, and in original packaging with all tags attached.
                  </p>
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-medium">Refund Processing</h4>
                  <p className="text-sm text-gray-600">
                    Refunds typically take 5-7 business days to be processed after the return is received.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
        
        {/* Image Viewer Dialog */}
        <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
          <DialogContent className="max-w-3xl p-0 overflow-hidden">
            <div className="relative w-full max-h-[80vh] overflow-auto">
              {selectedImage && (
                <img 
                  src={selectedImage} 
                  alt="Return image" 
                  className="w-full h-auto"
                />
              )}
            </div>
          </DialogContent>
        </Dialog>
        
        {/* Cancel Request Dialog */}
        <AlertDialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure you want to cancel this return request?</AlertDialogTitle>
              <AlertDialogDescription>
                Cancelling this request will stop the return process. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="py-4">
              <label className="text-sm font-medium mb-2 block">
                Please provide a reason for cancellation:
              </label>
              <Textarea 
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="I no longer need to return this item"
                className="w-full"
              />
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleCancelReturn}
                disabled={cancelReturnMutation.isPending}
              >
                {cancelReturnMutation.isPending && (
                  <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
                )}
                Confirm Cancellation
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
        
        {/* Add Tracking Dialog */}
        <Dialog open={trackingDialogOpen} onOpenChange={setTrackingDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Add Return Shipping Details</DialogTitle>
              <DialogDescription>
                Please provide the tracking information for your return shipment.
              </DialogDescription>
            </DialogHeader>
            <Form {...trackingForm}>
              <form onSubmit={trackingForm.handleSubmit(onTrackingSubmit)} className="space-y-4">
                <FormField
                  control={trackingForm.control}
                  name="courierName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Courier Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. BlueDart, DTDC, Delhivery" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={trackingForm.control}
                  name="trackingNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tracking Number</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter tracking number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={trackingForm.control}
                  name="trackingUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tracking URL (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="https://example.com/track/..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <Button type="submit" disabled={updateTrackingMutation.isPending}>
                    {updateTrackingMutation.isPending && (
                      <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Save Tracking Details
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}