import { useState } from 'react';
import { Link, useParams } from 'wouter';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription, 
  CardFooter 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
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
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from '@/components/ui/tabs';
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
  ShoppingCartIcon,
  CheckIcon,
  PrinterIcon,
  XIcon
} from 'lucide-react';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { format } from 'date-fns';
import { SellerDashboardLayout } from '@/components/layout/seller-dashboard-layout';

// Status badge colors
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

// Format status labels for display
const formatStatus = (status: string) => {
  return status.split('_').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join(' ');
};

// Status progress steps
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

// Message form schema
const messageSchema = z.object({
  message: z.string().min(1, {
    message: "Message cannot be empty",
  }).max(500, {
    message: "Message cannot be more than 500 characters"
  }),
});

// Tracking form schema
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

// Action note schema
const actionNoteSchema = z.object({
  note: z.string().optional(),
});

type MessageFormValues = z.infer<typeof messageSchema>;
type TrackingFormValues = z.infer<typeof trackingSchema>;
type ActionNoteFormValues = z.infer<typeof actionNoteSchema>;

export default function SellerReturnDetails() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { id } = useParams<{ id: string }>();
  const [activeTab, setActiveTab] = useState('details');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [action, setAction] = useState<string | null>(null);
  const [actionDialogOpen, setActionDialogOpen] = useState(false);
  
  // Forms
  const messageForm = useForm<MessageFormValues>({
    resolver: zodResolver(messageSchema),
    defaultValues: {
      message: '',
    },
  });
  
  const trackingForm = useForm<TrackingFormValues>({
    resolver: zodResolver(trackingSchema),
    defaultValues: {
      trackingNumber: '',
      courierName: '',
      trackingUrl: '',
    },
  });
  
  const actionNoteForm = useForm<ActionNoteFormValues>({
    resolver: zodResolver(actionNoteSchema),
    defaultValues: {
      note: '',
    },
  });

  // Fetch return request details
  const { 
    data: returnRequest, 
    isLoading, 
    error,
    refetch 
  } = useQuery({
    queryKey: [`/api/seller/returns/${id}`],
    enabled: !!id && !!user && user.role === 'seller'
  });
  
  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (data: MessageFormValues) => {
      const res = await apiRequest('POST', `/api/seller/returns/${id}/message`, data);
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to send message');
      }
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Message Sent",
        description: "Your message has been sent successfully.",
      });
      messageForm.reset();
      queryClient.invalidateQueries({ queryKey: [`/api/seller/returns/${id}`] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to send message",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Approve return mutation
  const approveReturnMutation = useMutation({
    mutationFn: async (data: ActionNoteFormValues) => {
      const res = await apiRequest('POST', `/api/seller/returns/${id}/approve`, data);
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to approve return');
      }
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Return Approved",
        description: "The return request has been approved successfully.",
      });
      actionNoteForm.reset();
      setActionDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: [`/api/seller/returns/${id}`] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to approve return",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Reject return mutation
  const rejectReturnMutation = useMutation({
    mutationFn: async (data: ActionNoteFormValues) => {
      const res = await apiRequest('POST', `/api/seller/returns/${id}/reject`, data);
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to reject return');
      }
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Return Rejected",
        description: "The return request has been rejected successfully.",
      });
      actionNoteForm.reset();
      setActionDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: [`/api/seller/returns/${id}`] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to reject return",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Mark as received mutation
  const markReceivedMutation = useMutation({
    mutationFn: async (data: ActionNoteFormValues) => {
      const res = await apiRequest('POST', `/api/seller/returns/${id}/received`, data);
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to mark as received');
      }
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Return Marked as Received",
        description: "The return has been marked as received successfully.",
      });
      actionNoteForm.reset();
      setActionDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: [`/api/seller/returns/${id}`] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to mark as received",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Process refund mutation
  const processRefundMutation = useMutation({
    mutationFn: async (data: ActionNoteFormValues) => {
      const res = await apiRequest('POST', `/api/seller/returns/${id}/process-refund`, data);
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to process refund');
      }
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Refund Processed",
        description: "The refund has been processed successfully.",
      });
      actionNoteForm.reset();
      setActionDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: [`/api/seller/returns/${id}`] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to process refund",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Ship replacement mutation
  const shipReplacementMutation = useMutation({
    mutationFn: async (data: TrackingFormValues) => {
      const res = await apiRequest('POST', `/api/seller/returns/${id}/ship-replacement`, {
        ...data,
        note: actionNoteForm.getValues().note
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to ship replacement');
      }
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Replacement Shipped",
        description: "The replacement has been marked as shipped successfully.",
      });
      trackingForm.reset();
      actionNoteForm.reset();
      setActionDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: [`/api/seller/returns/${id}`] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to ship replacement",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Handle action dialog open
  const handleActionClick = (actionType: string) => {
    setAction(actionType);
    actionNoteForm.reset();
    trackingForm.reset();
    setActionDialogOpen(true);
  };
  
  // Handle form submissions
  const onMessageSubmit = (values: MessageFormValues) => {
    sendMessageMutation.mutate(values);
  };
  
  const onActionSubmit = (values: ActionNoteFormValues) => {
    switch (action) {
      case 'approve':
        approveReturnMutation.mutate(values);
        break;
      case 'reject':
        rejectReturnMutation.mutate(values);
        break;
      case 'received':
        markReceivedMutation.mutate(values);
        break;
      case 'process-refund':
        processRefundMutation.mutate(values);
        break;
      default:
        console.error('Unknown action:', action);
    }
  };
  
  const onTrackingSubmit = (values: TrackingFormValues) => {
    shipReplacementMutation.mutate(values);
  };
  
  // Calculate progress
  const calculateProgress = (status: string, requestType: string) => {
    const steps = getReturnSteps(requestType);
    const currentStepIndex = steps.findIndex(step => step.status === status);
    
    if (currentStepIndex === -1) return 0;
    return ((currentStepIndex + 1) / steps.length) * 100;
  };
  
  // Get available actions for current status
  const getAvailableActions = (status: string, requestType: string) => {
    if (status === 'pending') {
      return [
        {
          label: 'Approve Return',
          action: 'approve',
          icon: <CheckIcon className="mr-2 h-4 w-4" />,
          variant: 'default' as const
        },
        {
          label: 'Reject Return',
          action: 'reject',
          icon: <XIcon className="mr-2 h-4 w-4" />,
          variant: 'destructive' as const
        }
      ];
    }
    
    if (status === 'approved') {
      return [
        {
          label: 'Print Return Label',
          action: 'print-label',
          icon: <PrinterIcon className="mr-2 h-4 w-4" />,
          variant: 'outline' as const
        }
      ];
    }
    
    if (status === 'item_in_transit') {
      return [
        {
          label: 'Mark as Received',
          action: 'received',
          icon: <PackageIcon className="mr-2 h-4 w-4" />,
          variant: 'default' as const
        }
      ];
    }
    
    if (status === 'item_received') {
      if (requestType === 'replacement') {
        return [
          {
            label: 'Ship Replacement',
            action: 'ship-replacement',
            icon: <TruckIcon className="mr-2 h-4 w-4" />,
            variant: 'default' as const
          }
        ];
      } else {
        return [
          {
            label: 'Process Refund',
            action: 'process-refund',
            icon: <RefreshCcwIcon className="mr-2 h-4 w-4" />,
            variant: 'default' as const
          }
        ];
      }
    }
    
    return [];
  };

  if (isLoading) {
    return (
      <SellerDashboardLayout>
        <div className="flex justify-center items-center h-64">
          <Loader2Icon className="h-8 w-8 animate-spin text-primary" />
        </div>
      </SellerDashboardLayout>
    );
  }

  if (error || !returnRequest) {
    return (
      <SellerDashboardLayout>
        <div className="p-6">
          <div className="bg-destructive/10 border border-destructive text-destructive px-4 py-3 rounded-md mb-6">
            <div className="flex items-center">
              <AlertCircleIcon className="h-4 w-4 mr-2" />
              <div>
                <h3 className="font-medium">Error</h3>
                <p className="text-sm">Failed to load return request details.</p>
              </div>
            </div>
          </div>
          <Button asChild variant="outline">
            <Link to="/seller/returns">
              <ChevronLeftIcon className="mr-2 h-4 w-4" /> Back to Returns
            </Link>
          </Button>
        </div>
      </SellerDashboardLayout>
    );
  }

  // Destructure return data
  const {
    id: returnId,
    buyerId,
    buyerName,
    buyerUsername,
    buyerEmail,
    orderId,
    orderNumber,
    orderItemId,
    requestType,
    reasonId,
    reasonText,
    description,
    status,
    product,
    mediaUrls,
    messages,
    statusHistory,
    createdAt,
    returnShippingAddress,
    returnTrackingNumber,
    returnCourierName,
    returnTrackingUrl,
    replacementTrackingNumber,
    replacementCourierName,
    replacementTrackingUrl,
    refundAmount,
    refundStatus,
  } = returnRequest;

  const availableActions = getAvailableActions(status, requestType);

  return (
    <SellerDashboardLayout>
      <div className="p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight">Return Request #{returnId}</h1>
              <Badge className={`${statusColors[status as keyof typeof statusColors]} font-normal`}>
                {formatStatus(status)}
              </Badge>
            </div>
            <p className="text-gray-500 mt-1">
              Order #{orderNumber} | {format(new Date(createdAt), 'MMM d, yyyy')}
            </p>
          </div>
          <Button asChild variant="outline" className="mt-4 sm:mt-0">
            <Link to="/seller/returns">
              <ChevronLeftIcon className="mr-2 h-4 w-4" /> Back to All Returns
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
                      {isCurrent && statusIcons[step.status as keyof typeof statusIcons]}
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
        
        {/* Available Actions */}
        {availableActions.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-6">
            {availableActions.map(({ label, action, icon, variant }) => (
              <Button
                key={action}
                variant={variant}
                onClick={() => {
                  if (action === 'print-label') {
                    window.open(`/api/seller/returns/${id}/label`, '_blank');
                  } else {
                    handleActionClick(action);
                  }
                }}
              >
                {icon}
                {label}
              </Button>
            ))}
          </div>
        )}
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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
                  {/* Customer Information */}
                  <div className="space-y-3">
                    <h3 className="text-lg font-medium">Customer Information</h3>
                    <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3">
                      <div>
                        <dt className="text-sm text-gray-500">Name</dt>
                        <dd className="font-medium">{buyerName || buyerUsername}</dd>
                      </div>
                      <div>
                        <dt className="text-sm text-gray-500">Email</dt>
                        <dd className="font-medium">{buyerEmail}</dd>
                      </div>
                    </dl>
                  </div>
                  
                  <Separator />
                  
                  {/* Product Information */}
                  <div className="space-y-3">
                    <h3 className="text-lg font-medium">Product Information</h3>
                    <div className="flex flex-col sm:flex-row gap-4">
                      <div className="w-24 h-24 rounded-md border overflow-hidden flex-shrink-0">
                        <img 
                          src={product.image || "https://placehold.co/200x200?text=No+Image"} 
                          alt={product.name} 
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div>
                        <h4 className="font-medium">{product.name}</h4>
                        <p className="text-sm text-gray-500">Quantity: {product.quantity}</p>
                        <p className="text-sm text-gray-500">Price: ₹{product.price}</p>
                        <Button asChild variant="link" className="p-0 h-auto text-primary hover:text-primary/80">
                          <Link to={`/seller/orders/${orderId}`}>
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
                          <Badge className={`${statusColors[status as keyof typeof statusColors]} font-normal`}>
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
                      {refundStatus && (
                        <div>
                          <dt className="text-sm text-gray-500">Refund Status</dt>
                          <dd className="font-medium">{formatStatus(refundStatus)}</dd>
                        </div>
                      )}
                    </dl>
                  </div>
                  
                  {/* Description */}
                  <div className="space-y-3">
                    <h3 className="text-lg font-medium">Customer's Description</h3>
                    <p className="text-gray-700">{description}</p>
                  </div>
                  
                  {/* Images */}
                  {mediaUrls && mediaUrls.length > 0 && (
                    <div className="space-y-3">
                      <h3 className="text-lg font-medium">Images</h3>
                      <div className="flex flex-wrap gap-3">
                        {mediaUrls.map((url: string, index: number) => (
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
                  
                  {/* Return Shipping Address */}
                  {returnShippingAddress && (
                    <div className="space-y-3">
                      <h3 className="text-lg font-medium">Return Shipping Address</h3>
                      <div className="p-4 border rounded-md">
                        <p className="font-medium">{returnShippingAddress.name}</p>
                        <p>{returnShippingAddress.address1}</p>
                        {returnShippingAddress.address2 && <p>{returnShippingAddress.address2}</p>}
                        <p>
                          {returnShippingAddress.city}, {returnShippingAddress.state} {returnShippingAddress.postalCode}
                        </p>
                        <p>{returnShippingAddress.country}</p>
                        {returnShippingAddress.phone && <p>Phone: {returnShippingAddress.phone}</p>}
                      </div>
                    </div>
                  )}
                  
                  {/* Return Shipping Information */}
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
                  
                  {/* Replacement Shipping Information */}
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
              </Card>
            </TabsContent>
            
            <TabsContent value="timeline" className="mt-0">
              <Card>
                <CardHeader>
                  <CardTitle>Status Timeline</CardTitle>
                  <CardDescription>History of status changes and actions taken</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="relative pl-8 border-l-2 border-gray-200 space-y-8 py-2">
                    {statusHistory.map((event: any, index: number) => (
                      <div key={index} className="relative">
                        <div className="absolute -left-[27px] rounded-full w-6 h-6 flex items-center justify-center border-2 border-white bg-primary text-white">
                          {statusIcons[event.status as keyof typeof statusIcons] || <InfoIcon className="h-3 w-3" />}
                        </div>
                        <div className="mb-1">
                          <span className="font-medium">{formatStatus(event.status)}</span>
                          <span className="text-sm text-gray-500 ml-2">
                            {format(new Date(event.createdAt), 'MMM d, yyyy, h:mm a')}
                          </span>
                          {event.userId && (
                            <span className="text-sm text-gray-500 ml-2">
                              by {event.userName || event.userRole || 'User'}
                            </span>
                          )}
                        </div>
                        {event.notes && <p className="text-gray-600 text-sm">{event.notes}</p>}
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
                  <CardTitle>Communication with Customer</CardTitle>
                  <CardDescription>
                    Messages between you and the customer about this return
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6 mb-6">
                    {messages && messages.length > 0 ? (
                      messages.map((message: any, index: number) => {
                        const isFromSeller = message.userRole === 'seller';
                        
                        return (
                          <div 
                            key={index} 
                            className={`flex ${isFromSeller ? 'justify-end' : 'justify-start'}`}
                          >
                            <div 
                              className={`max-w-[80%] rounded-lg p-4 ${
                                isFromSeller
                                  ? 'bg-primary text-primary-foreground rounded-tr-none' 
                                  : 'bg-gray-100 text-gray-800 rounded-tl-none'
                              }`}
                            >
                              <div className="flex items-center gap-2 mb-1">
                                <span className={`text-xs ${isFromSeller ? 'text-primary-foreground/80' : 'text-gray-500'}`}>
                                  {message.userName || (message.userRole === 'buyer' ? 'Customer' : 'You')}
                                </span>
                                <span className={`text-xs ${isFromSeller ? 'text-primary-foreground/80' : 'text-gray-500'}`}>
                                  {format(new Date(message.createdAt), 'MMM d, h:mm a')}
                                </span>
                              </div>
                              <p className="whitespace-pre-wrap">{message.message}</p>
                              
                              {/* Message Images */}
                              {message.mediaUrls && message.mediaUrls.length > 0 && (
                                <div className="flex flex-wrap gap-2 mt-2">
                                  {message.mediaUrls.map((url: string, imgIndex: number) => (
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
                        );
                      })
                    ) : (
                      <div className="flex flex-col items-center justify-center py-6">
                        <div className="rounded-full bg-gray-100 p-3 mb-4">
                          <MessageSquareIcon className="h-6 w-6 text-gray-400" />
                        </div>
                        <p className="text-gray-500">No messages yet</p>
                      </div>
                    )}
                  </div>
                  
                  {/* Message Form */}
                  {!['completed', 'cancelled', 'rejected'].includes(status) && (
                    <Form {...messageForm}>
                      <form onSubmit={messageForm.handleSubmit(onMessageSubmit)} className="space-y-4">
                        <FormField
                          control={messageForm.control}
                          name="message"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Send Message to Customer</FormLabel>
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
                            disabled={sendMessageMutation.isPending}
                          >
                            {sendMessageMutation.isPending ? (
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
            {/* Related Information Card */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Policy & Guidelines</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <h4 className="font-medium">Return Window</h4>
                  <p className="text-sm text-gray-600">
                    Returns are accepted within 30 days of delivery, subject to your store's policy.
                  </p>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium">Inspection Guidelines</h4>
                  <p className="text-sm text-gray-600">
                    Check returned items carefully for signs of use, damage, or tampering that differs from the buyer's description.
                  </p>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium">Refund Processing</h4>
                  <p className="text-sm text-gray-600">
                    Refunds should be processed within 48 hours of receiving the returned item in acceptable condition.
                  </p>
                </div>
                <div className="mt-4">
                  <Button asChild variant="outline" className="w-full">
                    <Link to="/seller/settings/return-policy">
                      View Store Return Policy
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
            
            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Links</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button asChild variant="outline" className="w-full justify-start">
                  <Link to={`/seller/orders/${orderId}`}>
                    <ShoppingCartIcon className="mr-2 h-4 w-4" />
                    View Original Order
                  </Link>
                </Button>
                {status === 'approved' && (
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={() => window.open(`/api/seller/returns/${id}/label`, '_blank')}
                  >
                    <FileTextIcon className="mr-2 h-4 w-4" />
                    Print Return Label
                  </Button>
                )}
                <Button asChild variant="outline" className="w-full justify-start">
                  <Link to={`/seller/products/${product.productId}`}>
                    <PackageIcon className="mr-2 h-4 w-4" />
                    View Product Details
                  </Link>
                </Button>
                <Button asChild variant="outline" className="w-full justify-start">
                  <Link to={`/seller/reports/returns`}>
                    <RefreshCcwIcon className="mr-2 h-4 w-4" />
                    View Return Analytics
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
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
      
      {/* Action Dialogs */}
      {action !== 'ship-replacement' ? (
        <Dialog open={actionDialogOpen} onOpenChange={setActionDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {action === 'approve' && 'Approve Return Request'}
                {action === 'reject' && 'Reject Return Request'}
                {action === 'received' && 'Mark Return as Received'}
                {action === 'process-refund' && 'Process Refund'}
              </DialogTitle>
              <DialogDescription>
                {action === 'approve' && 'Approve this return request and generate a return label.'}
                {action === 'reject' && 'Reject this return request with a reason.'}
                {action === 'received' && 'Mark this return as received at your facility.'}
                {action === 'process-refund' && 'Process a refund for this return request.'}
              </DialogDescription>
            </DialogHeader>
            
            <Form {...actionNoteForm}>
              <form onSubmit={actionNoteForm.handleSubmit(onActionSubmit)} className="space-y-4">
                <FormField
                  control={actionNoteForm.control}
                  name="note"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        {action === 'reject' ? 'Reason for Rejection' : 'Notes (Optional)'}
                      </FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder={
                            action === 'reject'
                              ? "Please provide a reason for rejecting this return"
                              : "Add any additional notes"
                          }
                          className="resize-none min-h-[100px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <DialogFooter>
                  <Button variant="outline" onClick={() => setActionDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={
                      action === 'reject' && !actionNoteForm.watch('note') ||
                      approveReturnMutation.isPending ||
                      rejectReturnMutation.isPending ||
                      markReceivedMutation.isPending ||
                      processRefundMutation.isPending
                    }
                  >
                    {(approveReturnMutation.isPending ||
                      rejectReturnMutation.isPending ||
                      markReceivedMutation.isPending ||
                      processRefundMutation.isPending) && (
                      <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Confirm
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      ) : (
        <Dialog open={actionDialogOpen} onOpenChange={setActionDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Ship Replacement</DialogTitle>
              <DialogDescription>
                Enter shipping details for the replacement item.
              </DialogDescription>
            </DialogHeader>
            
            <Form {...trackingForm}>
              <form onSubmit={trackingForm.handleSubmit(onTrackingSubmit)} className="space-y-4">
                <FormField
                  control={trackingForm.control}
                  name="courierName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Courier Service</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g. FedEx, DHL, DTDC"
                          {...field}
                        />
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
                        <Input
                          placeholder="Enter tracking number"
                          {...field}
                        />
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
                        <Input
                          placeholder="https://example.com/track/..."
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <Form {...actionNoteForm}>
                  <FormField
                    control={actionNoteForm.control}
                    name="note"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Additional Notes (Optional)</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Add any additional notes about this shipment"
                            className="resize-none min-h-[80px]"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </Form>
                
                <DialogFooter>
                  <Button variant="outline" onClick={() => setActionDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={
                      !trackingForm.watch('courierName') ||
                      !trackingForm.watch('trackingNumber') ||
                      shipReplacementMutation.isPending
                    }
                  >
                    {shipReplacementMutation.isPending && (
                      <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Confirm Shipment
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      )}
    </SellerDashboardLayout>
  );
}