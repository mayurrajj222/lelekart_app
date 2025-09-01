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
  XIcon,
  MailIcon,
  AlertTriangleIcon,
  DownloadIcon,
  ExternalLinkIcon,
  UsersIcon
} from 'lucide-react';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { format } from 'date-fns';
import { AdminLayout } from '@/components/layout/admin-layout';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
  disputed: 'bg-red-100 text-red-800 border-red-200',
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
  disputed: <AlertTriangleIcon className="h-5 w-5" />,
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
  sendToCustomer: z.boolean().default(true),
  sendToSeller: z.boolean().default(true),
});

// Action note schema
const actionNoteSchema = z.object({
  note: z.string().optional(),
  reason: z.string().optional(),
  handlerId: z.string().optional(),
});

// Dispute escalation schema
const disputeEscalationSchema = z.object({
  severity: z.enum(['low', 'medium', 'high']),
  category: z.enum(['policy', 'fraud', 'quality', 'shipping', 'other']),
  handlerId: z.string(),
  notes: z.string().min(1, {
    message: "Notes cannot be empty",
  }),
});

type MessageFormValues = z.infer<typeof messageSchema>;
type ActionNoteFormValues = z.infer<typeof actionNoteSchema>;
type DisputeEscalationFormValues = z.infer<typeof disputeEscalationSchema>;

export default function AdminReturnDetails() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { id } = useParams<{ id: string }>();
  const [activeTab, setActiveTab] = useState('details');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [action, setAction] = useState<string | null>(null);
  const [actionDialogOpen, setActionDialogOpen] = useState(false);
  const [disputeDialogOpen, setDisputeDialogOpen] = useState(false);
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [emailTemplate, setEmailTemplate] = useState('');
  
  // Forms
  const messageForm = useForm<MessageFormValues>({
    resolver: zodResolver(messageSchema),
    defaultValues: {
      message: '',
      sendToCustomer: true,
      sendToSeller: true,
    },
  });
  
  const actionNoteForm = useForm<ActionNoteFormValues>({
    resolver: zodResolver(actionNoteSchema),
    defaultValues: {
      note: '',
      reason: '',
      handlerId: '',
    },
  });

  const disputeForm = useForm<DisputeEscalationFormValues>({
    resolver: zodResolver(disputeEscalationSchema),
    defaultValues: {
      severity: 'medium',
      category: 'policy',
      handlerId: '',
      notes: '',
    },
  });

  // Fetch return request details
  const { 
    data: returnRequest, 
    isLoading, 
    error,
    refetch 
  } = useQuery({
    queryKey: [`/api/admin/returns/${id}`],
    enabled: !!id && !!user && user.role === 'admin'
  });
  
  // Fetch dispute handlers (admin team members)
  const { 
    data: handlersData,
  } = useQuery({
    queryKey: ['/api/admin/dispute-handlers'],
    enabled: !!user && user.role === 'admin'
  });
  
  // Fetch email templates
  const { 
    data: emailTemplatesData,
  } = useQuery({
    queryKey: ['/api/admin/email-templates'],
    enabled: !!user && user.role === 'admin'
  });
  
  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (data: MessageFormValues) => {
      const res = await apiRequest('POST', `/api/admin/returns/${id}/message`, data);
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
      queryClient.invalidateQueries({ queryKey: [`/api/admin/returns/${id}`] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to send message",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Force approve return mutation
  const forceApproveMutation = useMutation({
    mutationFn: async (data: ActionNoteFormValues) => {
      const res = await apiRequest('POST', `/api/admin/returns/${id}/force-approve`, data);
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to approve return');
      }
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Return Approved",
        description: "The return request has been force approved by admin.",
      });
      actionNoteForm.reset();
      setActionDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: [`/api/admin/returns/${id}`] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to approve return",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Force refund mutation
  const forceRefundMutation = useMutation({
    mutationFn: async (data: ActionNoteFormValues) => {
      const res = await apiRequest('POST', `/api/admin/returns/${id}/force-refund`, data);
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to process refund');
      }
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Refund Processed",
        description: "The refund has been force processed by admin.",
      });
      actionNoteForm.reset();
      setActionDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: [`/api/admin/returns/${id}`] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to process refund",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Assign dispute handler mutation
  const assignDisputeMutation = useMutation({
    mutationFn: async (data: ActionNoteFormValues) => {
      const res = await apiRequest('POST', `/api/admin/returns/${id}/assign-dispute`, {
        handlerId: data.handlerId,
        note: data.note
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to assign dispute handler');
      }
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Dispute Handler Assigned",
        description: "The dispute handler has been assigned successfully.",
      });
      actionNoteForm.reset();
      setActionDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: [`/api/admin/returns/${id}`] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to assign handler",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Override policy mutation
  const overridePolicyMutation = useMutation({
    mutationFn: async (data: ActionNoteFormValues) => {
      const res = await apiRequest('POST', `/api/admin/returns/${id}/override-policy`, {
        action,
        reason: data.reason
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to override policy');
      }
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Policy Override Applied",
        description: "The return policy has been overridden successfully.",
      });
      actionNoteForm.reset();
      setActionDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: [`/api/admin/returns/${id}`] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to override policy",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Send custom email mutation
  const sendEmailMutation = useMutation({
    mutationFn: async (templateId: string) => {
      const res = await apiRequest('POST', `/api/admin/returns/${id}/send-email`, { templateId });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to send email');
      }
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Email Sent",
        description: "The email has been sent successfully.",
      });
      setEmailDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: [`/api/admin/returns/${id}`] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to send email",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Log dispute escalation mutation
  const logDisputeEscalationMutation = useMutation({
    mutationFn: async (data: DisputeEscalationFormValues) => {
      const res = await apiRequest('POST', `/api/admin/returns/${id}/escalate-dispute`, data);
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to escalate dispute');
      }
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Dispute Escalated",
        description: "The dispute has been escalated successfully.",
      });
      disputeForm.reset();
      setDisputeDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: [`/api/admin/returns/${id}`] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to escalate dispute",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Handle action dialog open
  const handleActionClick = (actionType: string) => {
    setAction(actionType);
    actionNoteForm.reset();
    setActionDialogOpen(true);
  };
  
  // Handle form submissions
  const onMessageSubmit = (values: MessageFormValues) => {
    sendMessageMutation.mutate(values);
  };
  
  const onActionSubmit = (values: ActionNoteFormValues) => {
    switch (action) {
      case 'force-approve':
        forceApproveMutation.mutate(values);
        break;
      case 'force-refund':
        forceRefundMutation.mutate(values);
        break;
      case 'assign-dispute':
        assignDisputeMutation.mutate(values);
        break;
      case 'extend-window':
      case 'bypass-eligibility':
        overridePolicyMutation.mutate(values);
        break;
      default:
        console.error('Unknown action:', action);
    }
  };
  
  const onDisputeSubmit = (values: DisputeEscalationFormValues) => {
    logDisputeEscalationMutation.mutate(values);
  };
  
  // Calculate progress
  const calculateProgress = (status: string, requestType: string) => {
    const steps = getReturnSteps(requestType);
    const currentStepIndex = steps.findIndex(step => step.status === status);
    
    if (currentStepIndex === -1) return 0;
    return ((currentStepIndex + 1) / steps.length) * 100;
  };
  
  // Get available admin actions for current state
  const getAvailableActions = (returnRequest: any) => {
    const { status, requestType, isDisputed } = returnRequest;

    const actions = [
      {
        label: 'Force Approve',
        action: 'force-approve',
        icon: <CheckIcon className="mr-2 h-4 w-4" />,
        variant: 'default' as const,
        description: 'Override seller decision and approve this return'
      },
      {
        label: 'Force Refund',
        action: 'force-refund',
        icon: <RefreshCcwIcon className="mr-2 h-4 w-4" />,
        variant: 'default' as const,
        description: 'Process an immediate refund for this return'
      },
      {
        label: 'Download Invoice',
        action: 'download-invoice',
        icon: <DownloadIcon className="mr-2 h-4 w-4" />,
        variant: 'outline' as const,
        description: 'Download the original order invoice'
      }
    ];
    
    if (status === 'pending' || status === 'rejected') {
      actions.push({
        label: 'Extend Return Window',
        action: 'extend-window',
        icon: <ClockIcon className="mr-2 h-4 w-4" />,
        variant: 'outline' as const,
        description: 'Allow a return beyond the normal return window'
      });
      
      actions.push({
        label: 'Bypass Eligibility',
        action: 'bypass-eligibility',
        icon: <XCircleIcon className="mr-2 h-4 w-4" />,
        variant: 'outline' as const,
        description: 'Allow an otherwise ineligible item to be returned'
      });
    }
    
    if (isDisputed) {
      actions.push({
        label: 'Assign Handler',
        action: 'assign-dispute',
        icon: <UsersIcon className="mr-2 h-4 w-4" />,
        variant: 'default' as const,
        description: 'Assign this dispute to a specialized handler'
      });
      
      actions.push({
        label: 'Escalate Dispute',
        action: 'escalate-dispute',
        icon: <AlertTriangleIcon className="mr-2 h-4 w-4" />,
        variant: 'destructive' as const,
        description: 'Escalate this dispute to a higher level'
      });
    }
    
    actions.push({
      label: 'Send Email',
      action: 'send-email',
      icon: <MailIcon className="mr-2 h-4 w-4" />,
      variant: 'outline' as const,
      description: 'Send a communication email to the customer or seller'
    });
    
    return actions;
  };

  // Dispute handlers
  const disputeHandlers = handlersData?.handlers || [];
  // Email templates
  const emailTemplates = emailTemplatesData?.templates || [];

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex justify-center items-center h-64">
          <Loader2Icon className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  if (error || !returnRequest) {
    return (
      <AdminLayout>
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
            <Link to="/admin/returns">
              <ChevronLeftIcon className="mr-2 h-4 w-4" /> Back to Returns
            </Link>
          </Button>
        </div>
      </AdminLayout>
    );
  }

  const availableActions = getAvailableActions(returnRequest);

  return (
    <AdminLayout>
      <div className="p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight">Return #{returnRequest.id}</h1>
              <Badge className={`${statusColors[returnRequest.status]} font-normal`}>
                {formatStatus(returnRequest.status)}
              </Badge>
              {returnRequest.isDisputed && (
                <Badge variant="destructive">Disputed</Badge>
              )}
            </div>
            <p className="text-gray-500 mt-1">
              Order #{returnRequest.orderNumber} | {format(new Date(returnRequest.createdAt), 'MMM d, yyyy')}
            </p>
          </div>
          <Button asChild variant="outline" className="mt-4 sm:mt-0">
            <Link to="/admin/returns">
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
                  {returnRequest.status === 'completed' ? 'Completed' : 'In Progress'}
                </span>
              </div>
              <Progress 
                value={calculateProgress(returnRequest.status, returnRequest.requestType)} 
                className="h-2" 
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
              {getReturnSteps(returnRequest.requestType).map((step, index) => {
                const isCompleted = returnRequest.statusHistory.some(
                  (history: any) => history.status === step.status
                );
                const isCurrent = returnRequest.status === step.status;
                
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
                              returnRequest.statusHistory.find(
                                (h: any) => h.status === step.status
                              )?.createdAt || new Date()
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
        
        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2 mb-6">
          {availableActions.map((actionItem) => (
            <Button
              key={actionItem.action}
              variant={actionItem.variant}
              onClick={() => {
                if (actionItem.action === 'download-invoice') {
                  window.open(`/api/admin/orders/${returnRequest.orderId}/invoice`, '_blank');
                } else if (actionItem.action === 'send-email') {
                  setEmailDialogOpen(true);
                } else if (actionItem.action === 'escalate-dispute') {
                  setDisputeDialogOpen(true);
                } else {
                  handleActionClick(actionItem.action);
                }
              }}
              title={actionItem.description}
            >
              {actionItem.icon}
              {actionItem.label}
            </Button>
          ))}
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <Tabs 
              defaultValue="details" 
              value={activeTab} 
              onValueChange={setActiveTab} 
              className="mb-6"
            >
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="details">Details</TabsTrigger>
                <TabsTrigger value="timeline">Timeline</TabsTrigger>
                <TabsTrigger value="communication">Communication</TabsTrigger>
                <TabsTrigger value="dispute">
                  Dispute
                  {returnRequest.isDisputed && (
                    <Badge variant="destructive" className="ml-2">!</Badge>
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
                        <dd className="font-medium">
                          <Link 
                            to={`/admin/users/${returnRequest.buyerId}`} 
                            className="text-primary hover:underline"
                          >
                            {returnRequest.buyerName || returnRequest.buyerUsername}
                          </Link>
                        </dd>
                      </div>
                      <div>
                        <dt className="text-sm text-gray-500">Email</dt>
                        <dd className="font-medium">{returnRequest.buyerEmail}</dd>
                      </div>
                      <div>
                        <dt className="text-sm text-gray-500">Contact</dt>
                        <dd className="font-medium">{returnRequest.buyerPhone || 'Not provided'}</dd>
                      </div>
                      <div>
                        <dt className="text-sm text-gray-500">Account Status</dt>
                        <dd className="font-medium">
                          {returnRequest.buyerStatus === 'active' ? (
                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                              Active
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                              {returnRequest.buyerStatus}
                            </Badge>
                          )}
                        </dd>
                      </div>
                    </dl>
                  </div>
                  
                  <Separator />
                  
                  {/* Seller Information */}
                  <div className="space-y-3">
                    <h3 className="text-lg font-medium">Seller Information</h3>
                    <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3">
                      <div>
                        <dt className="text-sm text-gray-500">Seller</dt>
                        <dd className="font-medium">
                          <Link 
                            to={`/admin/users/${returnRequest.sellerId}`} 
                            className="text-primary hover:underline"
                          >
                            {returnRequest.sellerName || returnRequest.sellerUsername}
                          </Link>
                        </dd>
                      </div>
                      <div>
                        <dt className="text-sm text-gray-500">Email</dt>
                        <dd className="font-medium">{returnRequest.sellerEmail}</dd>
                      </div>
                      <div>
                        <dt className="text-sm text-gray-500">Return Policy</dt>
                        <dd className="font-medium">
                          {returnRequest.sellerReturnPolicy || 'Standard platform policy'}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-sm text-gray-500">Return Rate</dt>
                        <dd className="font-medium">
                          {returnRequest.sellerReturnRate || '0'}%
                          {returnRequest.sellerReturnRate > 5 && (
                            <Badge variant="outline" className="ml-2 bg-yellow-50 text-yellow-700 border-yellow-200">
                              Above Average
                            </Badge>
                          )}
                        </dd>
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
                          src={returnRequest.product.image || "https://placehold.co/200x200?text=No+Image"} 
                          alt={returnRequest.product.name} 
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div>
                        <h4 className="font-medium">{returnRequest.product.name}</h4>
                        <p className="text-sm text-gray-500">Quantity: {returnRequest.product.quantity}</p>
                        <p className="text-sm text-gray-500">Price: ₹{returnRequest.product.price}</p>
                        <p className="text-sm text-gray-500">SKU: {returnRequest.product.sku || 'N/A'}</p>
                        <div className="flex flex-wrap gap-2 mt-2">
                          <Button asChild variant="outline" size="sm">
                            <Link to={`/admin/products/${returnRequest.product.productId}`}>
                              View Product
                            </Link>
                          </Button>
                          <Button asChild variant="outline" size="sm">
                            <Link to={`/admin/orders/${returnRequest.orderId}`}>
                              View Order
                            </Link>
                          </Button>
                        </div>
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
                          {returnRequest.requestType.charAt(0).toUpperCase() + returnRequest.requestType.slice(1)}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-sm text-gray-500">Request Date</dt>
                        <dd className="font-medium">
                          {format(new Date(returnRequest.createdAt), 'MMM d, yyyy, h:mm a')}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-sm text-gray-500">Days Since Order</dt>
                        <dd className="font-medium">
                          {returnRequest.daysSinceOrder}
                          {returnRequest.daysSinceOrder > returnRequest.returnWindowDays && (
                            <Badge variant="outline" className="ml-2 bg-yellow-50 text-yellow-700 border-yellow-200">
                              Outside Window
                            </Badge>
                          )}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-sm text-gray-500">Return Window</dt>
                        <dd className="font-medium">{returnRequest.returnWindowDays} days</dd>
                      </div>
                      <div>
                        <dt className="text-sm text-gray-500">Reason</dt>
                        <dd className="font-medium">{returnRequest.reasonText}</dd>
                      </div>
                      <div>
                        <dt className="text-sm text-gray-500">Status</dt>
                        <dd>
                          <Badge className={`${statusColors[returnRequest.status]} font-normal`}>
                            {formatStatus(returnRequest.status)}
                          </Badge>
                        </dd>
                      </div>
                      <div>
                        <dt className="text-sm text-gray-500">Refund Amount</dt>
                        <dd className="font-medium">
                          ₹{returnRequest.refundAmount || returnRequest.product.price}
                        </dd>
                      </div>
                      {returnRequest.refundStatus && (
                        <div>
                          <dt className="text-sm text-gray-500">Refund Status</dt>
                          <dd className="font-medium">
                            <Badge className={`${
                              returnRequest.refundStatus === 'completed' 
                                ? statusColors.completed 
                                : returnRequest.refundStatus === 'pending' 
                                  ? statusColors.pending
                                  : returnRequest.refundStatus === 'failed'
                                    ? statusColors.rejected
                                    : statusColors.refund_initiated
                            } font-normal`}>
                              {formatStatus(returnRequest.refundStatus)}
                            </Badge>
                          </dd>
                        </div>
                      )}
                      {returnRequest.paymentMethod && (
                        <div>
                          <dt className="text-sm text-gray-500">Payment Method</dt>
                          <dd className="font-medium">
                            {returnRequest.paymentMethod}
                            {returnRequest.paymentId && (
                              <Button
                                variant="link"
                                size="sm"
                                className="h-auto p-0 text-xs ml-2"
                                onClick={() => navigator.clipboard.writeText(returnRequest.paymentId)}
                              >
                                {returnRequest.paymentId.substring(0, 12)}...
                              </Button>
                            )}
                          </dd>
                        </div>
                      )}
                    </dl>
                  </div>
                  
                  {/* Description */}
                  <div className="space-y-3">
                    <h3 className="text-lg font-medium">Customer's Description</h3>
                    <p className="text-gray-700">{returnRequest.description}</p>
                  </div>
                  
                  {/* Images */}
                  {returnRequest.mediaUrls && returnRequest.mediaUrls.length > 0 && (
                    <div className="space-y-3">
                      <h3 className="text-lg font-medium">Images</h3>
                      <div className="flex flex-wrap gap-3">
                        {returnRequest.mediaUrls.map((url: string, index: number) => (
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
                  {returnRequest.returnShippingAddress && (
                    <div className="space-y-3">
                      <h3 className="text-lg font-medium">Return Shipping Address</h3>
                      <div className="p-4 border rounded-md">
                        <p className="font-medium">{returnRequest.returnShippingAddress.name}</p>
                        <p>{returnRequest.returnShippingAddress.address1}</p>
                        {returnRequest.returnShippingAddress.address2 && (
                          <p>{returnRequest.returnShippingAddress.address2}</p>
                        )}
                        <p>
                          {returnRequest.returnShippingAddress.city}, {returnRequest.returnShippingAddress.state} {returnRequest.returnShippingAddress.postalCode}
                        </p>
                        <p>{returnRequest.returnShippingAddress.country}</p>
                        {returnRequest.returnShippingAddress.phone && (
                          <p>Phone: {returnRequest.returnShippingAddress.phone}</p>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {/* Return Shipping Information */}
                  {returnRequest.returnTrackingNumber && (
                    <div className="space-y-3">
                      <h3 className="text-lg font-medium">Return Shipping Information</h3>
                      <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3">
                        <div>
                          <dt className="text-sm text-gray-500">Courier</dt>
                          <dd className="font-medium">{returnRequest.returnCourierName}</dd>
                        </div>
                        <div>
                          <dt className="text-sm text-gray-500">Tracking Number</dt>
                          <dd className="font-medium">
                            {returnRequest.returnTrackingUrl ? (
                              <a 
                                href={returnRequest.returnTrackingUrl} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-primary hover:underline flex items-center"
                              >
                                {returnRequest.returnTrackingNumber}
                                <ExternalLinkIcon className="h-3 w-3 ml-1" />
                              </a>
                            ) : (
                              returnRequest.returnTrackingNumber
                            )}
                          </dd>
                        </div>
                      </dl>
                    </div>
                  )}
                  
                  {/* Replacement Shipping Information */}
                  {returnRequest.replacementTrackingNumber && (
                    <div className="space-y-3">
                      <h3 className="text-lg font-medium">Replacement Shipping Information</h3>
                      <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3">
                        <div>
                          <dt className="text-sm text-gray-500">Courier</dt>
                          <dd className="font-medium">{returnRequest.replacementCourierName}</dd>
                        </div>
                        <div>
                          <dt className="text-sm text-gray-500">Tracking Number</dt>
                          <dd className="font-medium">
                            {returnRequest.replacementTrackingUrl ? (
                              <a 
                                href={returnRequest.replacementTrackingUrl} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-primary hover:underline flex items-center"
                              >
                                {returnRequest.replacementTrackingNumber}
                                <ExternalLinkIcon className="h-3 w-3 ml-1" />
                              </a>
                            ) : (
                              returnRequest.replacementTrackingNumber
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
                    {returnRequest.statusHistory.map((event: any, index: number) => (
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
                              {event.isAdminOverride && (
                                <Badge variant="outline" className="ml-2 text-xs bg-blue-50 text-blue-700 border-blue-200">
                                  Admin Override
                                </Badge>
                              )}
                            </span>
                          )}
                        </div>
                        {event.notes && <p className="text-gray-600 text-sm">{event.notes}</p>}
                      </div>
                    ))}
                  </div>
                  
                  {returnRequest.statusHistory.length === 0 && (
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
                  <CardTitle>Communication History</CardTitle>
                  <CardDescription>
                    All messages between customer, seller, and admin
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6 mb-6">
                    {returnRequest.messages && returnRequest.messages.length > 0 ? (
                      returnRequest.messages.map((message: any, index: number) => {
                        const isFromAdmin = message.userRole === 'admin';
                        const isFromSeller = message.userRole === 'seller';
                        const isFromBuyer = message.userRole === 'buyer';
                        
                        let bgColor = '';
                        let textColor = '';
                        let cornerClass = '';
                        
                        if (isFromAdmin) {
                          bgColor = 'bg-primary';
                          textColor = 'text-primary-foreground';
                          cornerClass = 'rounded-tr-none';
                        } else if (isFromSeller) {
                          bgColor = 'bg-blue-100';
                          textColor = 'text-blue-800';
                          cornerClass = 'rounded-tr-none';
                        } else {
                          bgColor = 'bg-gray-100';
                          textColor = 'text-gray-800';
                          cornerClass = 'rounded-tl-none';
                        }
                        
                        return (
                          <div 
                            key={index} 
                            className={`flex ${isFromBuyer ? 'justify-start' : 'justify-end'}`}
                          >
                            <div 
                              className={`max-w-[80%] rounded-lg p-4 ${bgColor} ${textColor} ${cornerClass}`}
                            >
                              <div className="flex items-center gap-2 mb-1">
                                <span className={`text-xs ${isFromAdmin ? 'text-primary-foreground/80' : isFromSeller ? 'text-blue-500' : 'text-gray-500'}`}>
                                  {message.userName || (
                                    isFromAdmin 
                                      ? 'Admin' 
                                      : isFromSeller 
                                        ? 'Seller' 
                                        : 'Customer'
                                  )}
                                </span>
                                <span className={`text-xs ${isFromAdmin ? 'text-primary-foreground/80' : isFromSeller ? 'text-blue-500' : 'text-gray-500'}`}>
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
                              
                              {message.sentToCustomer && message.sentToSeller && (
                                <div className="mt-2 text-xs">
                                  <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200 mr-2">
                                    Sent to Customer
                                  </Badge>
                                  <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                                    Sent to Seller
                                  </Badge>
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
                  
                  {/* Admin Message Form */}
                  <Form {...messageForm}>
                    <form onSubmit={messageForm.handleSubmit(onMessageSubmit)} className="space-y-4">
                      <FormField
                        control={messageForm.control}
                        name="message"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Send Admin Message</FormLabel>
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
                      
                      <div className="flex space-x-4">
                        <FormField
                          control={messageForm.control}
                          name="sendToCustomer"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                              <FormControl>
                                <Checkbox
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                              <FormLabel className="text-sm font-normal">
                                Send to Customer
                              </FormLabel>
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={messageForm.control}
                          name="sendToSeller"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                              <FormControl>
                                <Checkbox
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                              <FormLabel className="text-sm font-normal">
                                Send to Seller
                              </FormLabel>
                            </FormItem>
                          )}
                        />
                      </div>
                      
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
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="dispute" className="mt-0">
              <Card>
                <CardHeader>
                  <CardTitle>Dispute Management</CardTitle>
                  <CardDescription>
                    Manage dispute details and escalation process
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {returnRequest.isDisputed ? (
                    <div className="space-y-6">
                      <div className="p-4 border border-red-200 bg-red-50 rounded-md">
                        <div className="flex items-start">
                          <AlertTriangleIcon className="h-5 w-5 text-red-600 mr-3 mt-0.5" />
                          <div>
                            <h3 className="font-medium text-red-800">Dispute Detected</h3>
                            <p className="text-sm text-red-700 mt-1">
                              This return has been flagged for dispute. Please review the details below.
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="space-y-4">
                        <h3 className="text-lg font-medium">Dispute Details</h3>
                        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3">
                          <div>
                            <dt className="text-sm text-gray-500">Dispute Date</dt>
                            <dd className="font-medium">
                              {format(new Date(returnRequest.disputeDate), 'MMM d, yyyy')}
                            </dd>
                          </div>
                          <div>
                            <dt className="text-sm text-gray-500">Dispute Status</dt>
                            <dd className="font-medium">
                              <Badge variant={returnRequest.disputeStatus === 'resolved' ? 'outline' : 'destructive'}>
                                {returnRequest.disputeStatus.charAt(0).toUpperCase() + returnRequest.disputeStatus.slice(1)}
                              </Badge>
                            </dd>
                          </div>
                          <div>
                            <dt className="text-sm text-gray-500">Raised By</dt>
                            <dd className="font-medium">
                              {returnRequest.disputeRaisedBy}
                            </dd>
                          </div>
                          <div>
                            <dt className="text-sm text-gray-500">Assigned To</dt>
                            <dd className="font-medium">
                              {returnRequest.disputeHandler ? (
                                returnRequest.disputeHandler
                              ) : (
                                <span className="text-yellow-500">Unassigned</span>
                              )}
                              <Button
                                variant="outline"
                                size="sm"
                                className="ml-2"
                                onClick={() => handleActionClick('assign-dispute')}
                              >
                                <UsersIcon className="h-3 w-3 mr-1" />
                                Assign
                              </Button>
                            </dd>
                          </div>
                          <div className="col-span-2">
                            <dt className="text-sm text-gray-500">Dispute Reason</dt>
                            <dd className="font-medium">{returnRequest.disputeReason}</dd>
                          </div>
                          {returnRequest.disputeNotes && (
                            <div className="col-span-2">
                              <dt className="text-sm text-gray-500">Dispute Notes</dt>
                              <dd className="font-medium">{returnRequest.disputeNotes}</dd>
                            </div>
                          )}
                        </dl>
                      </div>
                      
                      {returnRequest.disputeHistory && returnRequest.disputeHistory.length > 0 && (
                        <div className="space-y-4">
                          <h3 className="text-lg font-medium">Dispute History</h3>
                          <div className="relative pl-8 border-l-2 border-red-200 space-y-6 py-2">
                            {returnRequest.disputeHistory.map((event: any, index: number) => (
                              <div key={index} className="relative">
                                <div className="absolute -left-[27px] rounded-full w-6 h-6 flex items-center justify-center border-2 border-white bg-red-600 text-white">
                                  <AlertTriangleIcon className="h-3 w-3" />
                                </div>
                                <div className="mb-1">
                                  <span className="font-medium">{event.action}</span>
                                  <span className="text-sm text-gray-500 ml-2">
                                    {format(new Date(event.date), 'MMM d, yyyy, h:mm a')}
                                  </span>
                                  {event.by && (
                                    <span className="text-sm text-gray-500 ml-2">
                                      by {event.by}
                                    </span>
                                  )}
                                </div>
                                {event.notes && <p className="text-gray-600 text-sm">{event.notes}</p>}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      <div className="flex items-center justify-between">
                        <Button 
                          variant="destructive"
                          onClick={() => setDisputeDialogOpen(true)}
                        >
                          <AlertTriangleIcon className="mr-2 h-4 w-4" />
                          Escalate Dispute
                        </Button>
                        
                        {returnRequest.disputeStatus !== 'resolved' && (
                          <Button variant="outline">
                            <CheckIcon className="mr-2 h-4 w-4" />
                            Mark as Resolved
                          </Button>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-10">
                      <div className="rounded-full bg-gray-100 p-4 mb-4">
                        <CheckCircleIcon className="h-8 w-8 text-green-500" />
                      </div>
                      <h3 className="text-lg font-medium text-gray-900">No Disputes</h3>
                      <p className="text-gray-500 text-center mt-1 max-w-md">
                        This return request is currently not under dispute. If any issues arise, 
                        you can flag it for review or escalate it to the appropriate team.
                      </p>
                      <Button 
                        variant="outline" 
                        className="mt-4"
                        onClick={() => setDisputeDialogOpen(true)}
                      >
                        <AlertTriangleIcon className="mr-2 h-4 w-4" />
                        Raise Dispute
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </div>
          
          {/* Sidebar */}
          <div>
            {/* Summary Card */}
            <Card className="mb-6">
              <CardHeader className="pb-3">
                <CardTitle>Return Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Order Total</h4>
                  <p className="text-2xl font-bold">₹{returnRequest.orderTotal}</p>
                  <p className="text-sm text-gray-500">
                    Order Date: {format(new Date(returnRequest.orderDate), 'MMM d, yyyy')}
                  </p>
                </div>
                <Separator />
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Customer Metrics</h4>
                  <dl className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <dt>Total Orders</dt>
                      <dd className="font-medium">{returnRequest.customerTotalOrders || 0}</dd>
                    </div>
                    <div className="flex justify-between text-sm">
                      <dt>Total Returns</dt>
                      <dd className="font-medium">{returnRequest.customerTotalReturns || 0}</dd>
                    </div>
                    <div className="flex justify-between text-sm">
                      <dt>Return Rate</dt>
                      <dd className="font-medium">
                        {returnRequest.customerReturnRate || '0'}%
                        {returnRequest.customerReturnRate > 15 && (
                          <Badge className="ml-1 bg-red-100 text-red-800 border-red-200 text-xs px-1.5 py-0">High</Badge>
                        )}
                      </dd>
                    </div>
                    <div className="flex justify-between text-sm">
                      <dt>Lifetime Value</dt>
                      <dd className="font-medium">₹{returnRequest.customerLifetimeValue || 0}</dd>
                    </div>
                  </dl>
                </div>
                <Separator />
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Risk Assessment</h4>
                  <div className="flex items-center">
                    <div className={`w-3 h-3 rounded-full mr-2 ${
                      returnRequest.riskLevel === 'high' 
                        ? 'bg-red-500' 
                        : returnRequest.riskLevel === 'medium' 
                          ? 'bg-yellow-500' 
                          : 'bg-green-500'
                    }`} />
                    <span className="font-medium capitalize">{returnRequest.riskLevel || 'Low'} Risk</span>
                  </div>
                  {returnRequest.riskLevel !== 'low' && returnRequest.riskFactors && (
                    <ul className="space-y-1 text-sm">
                      {returnRequest.riskFactors.map((factor: string, index: number) => (
                        <li key={index} className="flex items-start">
                          <AlertCircleIcon className="h-4 w-4 text-yellow-500 mr-1 mt-0.5 flex-shrink-0" />
                          <span>{factor}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </CardContent>
            </Card>
            
            {/* Related Returns */}
            {returnRequest.relatedReturns && returnRequest.relatedReturns.length > 0 && (
              <Card className="mb-6">
                <CardHeader className="pb-3">
                  <CardTitle>Related Returns</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {returnRequest.relatedReturns.map((related: any, index: number) => (
                      <div key={index} className="flex items-center justify-between p-3 border rounded-md">
                        <div>
                          <div className="font-medium">Return #{related.id}</div>
                          <div className="text-sm text-gray-500">{format(new Date(related.date), 'MMM d, yyyy')}</div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={`${statusColors[related.status]} font-normal text-xs`}>
                            {formatStatus(related.status)}
                          </Badge>
                          <Button asChild variant="ghost" size="icon">
                            <Link to={`/admin/returns/${related.id}`}>
                              <ChevronRightIcon className="h-4 w-4" />
                            </Link>
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
            
            {/* Quick Actions */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle>Quick Links</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button asChild variant="outline" className="w-full justify-start">
                  <Link to={`/admin/orders/${returnRequest.orderId}`}>
                    <ShoppingCartIcon className="mr-2 h-4 w-4" />
                    View Original Order
                  </Link>
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => window.open(`/api/admin/orders/${returnRequest.orderId}/invoice`, '_blank')}
                >
                  <FileTextIcon className="mr-2 h-4 w-4" />
                  Download Order Invoice
                </Button>
                <Button asChild variant="outline" className="w-full justify-start">
                  <Link to={`/admin/users/${returnRequest.buyerId}`}>
                    <ShoppingCartIcon className="mr-2 h-4 w-4" />
                    View Customer Profile
                  </Link>
                </Button>
                <Button asChild variant="outline" className="w-full justify-start">
                  <Link to={`/admin/users/${returnRequest.sellerId}`}>
                    <ShoppingCartIcon className="mr-2 h-4 w-4" />
                    View Seller Profile
                  </Link>
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => setEmailDialogOpen(true)}
                >
                  <MailIcon className="mr-2 h-4 w-4" />
                  Send Email Notification
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
      <Dialog open={actionDialogOpen} onOpenChange={setActionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {action === 'force-approve' && 'Force Approve Return'}
              {action === 'force-refund' && 'Force Process Refund'}
              {action === 'assign-dispute' && 'Assign Dispute Handler'}
              {action === 'extend-window' && 'Extend Return Window'}
              {action === 'bypass-eligibility' && 'Bypass Eligibility Check'}
            </DialogTitle>
            <DialogDescription>
              {action === 'force-approve' && 'Override seller decision and approve this return request.'}
              {action === 'force-refund' && 'Process an immediate refund for this return request.'}
              {action === 'assign-dispute' && 'Assign this dispute to a specialized handler for resolution.'}
              {action === 'extend-window' && 'Allow customer to return beyond the standard return window.'}
              {action === 'bypass-eligibility' && 'Allow return of an item that would normally be ineligible.'}
            </DialogDescription>
          </DialogHeader>
          
          <Form {...actionNoteForm}>
            <form onSubmit={actionNoteForm.handleSubmit(onActionSubmit)} className="space-y-4">
              {action === 'assign-dispute' && (
                <FormField
                  control={actionNoteForm.control}
                  name="handlerId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Dispute Handler</FormLabel>
                      <FormControl>
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select a handler" />
                          </SelectTrigger>
                          <SelectContent>
                            {disputeHandlers.map((handler: any) => (
                              <SelectItem key={handler.id} value={handler.id.toString()}>
                                {handler.name} ({handler.department})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
              
              {(action === 'extend-window' || action === 'bypass-eligibility') && (
                <FormField
                  control={actionNoteForm.control}
                  name="reason"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Override Reason (Required)</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Please provide a detailed justification for this policy override"
                          className="resize-none min-h-[100px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                      <div className="text-xs text-gray-500 mt-1">
                        Note: All policy overrides are logged for audit purposes.
                      </div>
                    </FormItem>
                  )}
                />
              )}
              
              <FormField
                control={actionNoteForm.control}
                name="note"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {action === 'assign-dispute' ? 'Notes for Handler' : 'Admin Notes'}
                      {action !== 'extend-window' && action !== 'bypass-eligibility' && ' (Required)'}
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Add additional notes or instructions"
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
                    (action === 'extend-window' || action === 'bypass-eligibility') 
                      ? !actionNoteForm.watch('reason')
                      : action === 'assign-dispute'
                        ? !actionNoteForm.watch('handlerId')
                        : !actionNoteForm.watch('note')
                  }
                  variant={
                    (action === 'extend-window' || action === 'bypass-eligibility') 
                      ? 'destructive' 
                      : 'default'
                  }
                >
                  {(forceApproveMutation.isPending ||
                    forceRefundMutation.isPending ||
                    assignDisputeMutation.isPending ||
                    overridePolicyMutation.isPending) && (
                    <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Confirm
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {/* Dispute Escalation Dialog */}
      <Dialog open={disputeDialogOpen} onOpenChange={setDisputeDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {returnRequest.isDisputed ? 'Escalate Existing Dispute' : 'Create New Dispute'}
            </DialogTitle>
            <DialogDescription>
              {returnRequest.isDisputed 
                ? 'Escalate this dispute to specialized teams for further review.' 
                : 'Flag this return request as disputed and assign for review.'}
            </DialogDescription>
          </DialogHeader>
          
          <Form {...disputeForm}>
            <form onSubmit={disputeForm.handleSubmit(onDisputeSubmit)} className="space-y-4">
              <FormField
                control={disputeForm.control}
                name="severity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Severity Level</FormLabel>
                    <FormControl>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Low</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={disputeForm.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Dispute Category</FormLabel>
                    <FormControl>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="policy">Policy Violation</SelectItem>
                          <SelectItem value="fraud">Potential Fraud</SelectItem>
                          <SelectItem value="quality">Product Quality</SelectItem>
                          <SelectItem value="shipping">Shipping Issue</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={disputeForm.control}
                name="handlerId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Assign To</FormLabel>
                    <FormControl>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select a handler" />
                        </SelectTrigger>
                        <SelectContent>
                          {disputeHandlers.map((handler: any) => (
                            <SelectItem key={handler.id} value={handler.id.toString()}>
                              {handler.name} ({handler.department})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={disputeForm.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Dispute Notes (Required)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Provide detailed information about the dispute"
                        className="resize-none min-h-[100px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button variant="outline" onClick={() => setDisputeDialogOpen(false)}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={
                    !disputeForm.watch('handlerId') ||
                    !disputeForm.watch('notes')
                  }
                  variant="destructive"
                >
                  {logDisputeEscalationMutation.isPending && (
                    <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {returnRequest.isDisputed ? 'Escalate Dispute' : 'Create Dispute'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {/* Email Template Dialog */}
      <Dialog open={emailDialogOpen} onOpenChange={setEmailDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send Email Notification</DialogTitle>
            <DialogDescription>
              Select an email template to send to the customer or seller
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <Label>Email Template</Label>
              <Select
                value={emailTemplate}
                onValueChange={setEmailTemplate}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a template" />
                </SelectTrigger>
                <SelectContent>
                  {emailTemplates.map((template: any) => (
                    <SelectItem key={template.id} value={template.id.toString()}>
                      {template.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {emailTemplate && (
              <div className="border rounded-md p-4 bg-gray-50">
                <h3 className="font-medium mb-2">Template Preview</h3>
                <div className="text-sm">
                  {emailTemplates.find((t: any) => t.id.toString() === emailTemplate)?.description}
                </div>
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setEmailDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => sendEmailMutation.mutate(emailTemplate)}
              disabled={!emailTemplate || sendEmailMutation.isPending}
            >
              {sendEmailMutation.isPending && (
                <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
              )}
              Send Email
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}