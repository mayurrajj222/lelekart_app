import { useState, useEffect } from 'react';
import { Link, useLocation, useParams } from 'wouter';
import { useQuery, useMutation } from '@tanstack/react-query';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  ChevronLeftIcon,
  Loader2Icon,
  ImageIcon,
  XIcon,
  CheckCircleIcon,
  XCircleIcon,
  AlertCircleIcon,
  UploadIcon
} from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink } from '@/components/ui/breadcrumb';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { format } from 'date-fns';
import { queryClient, apiRequest } from '@/lib/queryClient';

// Schema for return request form validation
const returnRequestSchema = z.object({
  orderItemId: z.number({
    required_error: "Please select an item from your order",
  }),
  requestType: z.enum(['return', 'refund', 'replacement'], {
    required_error: "Please select a request type",
  }),
  reasonId: z.number({
    required_error: "Please select a reason for your request",
  }),
  description: z.string().min(10, {
    message: "Description must be at least 10 characters",
  }).max(500, {
    message: "Description cannot be more than 500 characters"
  }),
  mediaUrls: z.array(z.string()).min(1, { message: 'Please upload at least one image.' }),
});

// Type for the form data
type ReturnFormValues = z.infer<typeof returnRequestSchema>;

export default function CreateReturnRequest() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const { orderId } = useParams<{ orderId: string }>();
  
  // State for image uploads
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [eligibilityChecked, setEligibilityChecked] = useState<boolean>(false);
  const [selectedOrderItem, setSelectedOrderItem] = useState<any>(null);
  
  // Fetch order details
  const { 
    data: order,
    isLoading: isLoadingOrder,
    error: orderError
  } = useQuery({
    queryKey: [`/api/orders/${orderId}`],
    enabled: !!orderId && !!user,
  });

  // Fetch return reasons based on selected request type
  const [requestType, setRequestType] = useState<string | null>(null);
  const {
    data: returnReasons,
    isLoading: isLoadingReasons
  } = useQuery({
    queryKey: ['/api/return-reasons', requestType],
    enabled: !!requestType,
  });

  // Check return eligibility when order item is selected
  const {
    data: eligibility,
    isLoading: isCheckingEligibility,
    error: eligibilityError,
    refetch: recheckEligibility
  } = useQuery({
    queryKey: ['/api/orders/return-eligibility', selectedOrderItem?.id, requestType],
    enabled: !!selectedOrderItem && !!requestType && !eligibilityChecked,
    onSuccess: (data) => {
      setEligibilityChecked(true);
      
      if (!data.eligible) {
        toast({
          title: "Item not eligible for return",
          description: data.message,
          variant: "destructive"
        });
      }
    }
  });

  // Form setup with validation
  const form = useForm<ReturnFormValues>({
    resolver: zodResolver(returnRequestSchema),
    defaultValues: {
      orderItemId: 0,
      requestType: undefined,
      reasonId: 0,
      description: '',
      mediaUrls: [],
    },
  });

  // Create return request mutation
  const createReturnMutation = useMutation({
    mutationFn: async (values: ReturnFormValues) => {
      const res = await apiRequest('POST', '/api/returns', values);
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Failed to create return request');
      }
      return res.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Return Request Created",
        description: `Your return request has been submitted successfully.`,
      });
      
      // Redirect to the return details page
      setLocation(`/returns/${data.id}`);
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create return request",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Handle form submission
  const onSubmit = (values: ReturnFormValues) => {
    // Add uploaded images to the form values
    values.mediaUrls = uploadedImages;
    createReturnMutation.mutate(values);
  };

  // Handle image upload
  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files || event.target.files.length === 0) return;
    
    setIsUploading(true);
    
    try {
      const file = event.target.files[0];
      const formData = new FormData();
      formData.append('file', file);
      
      const res = await apiRequest('POST', '/api/upload/images', formData, {}, false);
      
      if (!res.ok) {
        throw new Error('Failed to upload image');
      }
      
      const data = await res.json();
      setUploadedImages([...uploadedImages, data.url]);
      
      toast({
        title: "Image uploaded",
        description: "Image has been uploaded successfully",
      });
    } catch (error) {
      toast({
        title: "Upload failed",
        description: "Failed to upload image. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      // Reset the input
      event.target.value = '';
    }
  };

  // Handle removing an uploaded image
  const handleRemoveImage = (index: number) => {
    const newImages = [...uploadedImages];
    newImages.splice(index, 1);
    setUploadedImages(newImages);
  };

  // Reset eligibility check when request type or order item changes
  useEffect(() => {
    if (requestType) {
      form.setValue('requestType', requestType as any);
      setEligibilityChecked(false);
    }
  }, [requestType, form]);

  useEffect(() => {
    if (selectedOrderItem) {
      form.setValue('orderItemId', selectedOrderItem.id);
      setEligibilityChecked(false);
    }
  }, [selectedOrderItem, form]);

  // Redirect to login if not authenticated
  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <p className="text-lg text-gray-600 mb-4">Please login to create a return request</p>
        <Button asChild>
          <Link to="/auth">Login</Link>
        </Button>
      </div>
    );
  }

  if (isLoadingOrder) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2Icon className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (orderError || !order) {
    return (
      <div className="container max-w-3xl mx-auto py-6 px-4">
        <Alert variant="destructive" className="mb-6">
          <AlertCircleIcon className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            There was an error loading the order details. Please try again.
          </AlertDescription>
        </Alert>
        <Button asChild variant="outline">
          <Link to="/orders">
            <ChevronLeftIcon className="mr-2 h-4 w-4" /> Back to Orders
          </Link>
        </Button>
      </div>
    );
  }

  // Check if there are returnable items in the order
  const returnableItems = order.orderItems.filter(item => 
    item.status === 'delivered' && 
    !item.returnRequested &&
    new Date(item.deliveredAt) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Less than 30 days old
  );

  if (returnableItems.length === 0) {
    return (
      <div className="container max-w-3xl mx-auto py-6 px-4">
        <Breadcrumb className="mb-6">
          <BreadcrumbItem>
            <BreadcrumbLink as={Link} to="/">Home</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbItem>
            <BreadcrumbLink as={Link} to="/orders">My Orders</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbItem>
            <BreadcrumbLink as={Link} to={`/orders/${orderId}`}>Order #{order.orderNumber}</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbItem isCurrentPage>
            <BreadcrumbLink>Create Return</BreadcrumbLink>
          </BreadcrumbItem>
        </Breadcrumb>
        
        <Card>
          <CardHeader>
            <CardTitle>No Eligible Items</CardTitle>
            <CardDescription>
              There are no eligible items for return in this order.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">
              Items may not be eligible for return if:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-gray-600">
              <li>They were delivered more than 30 days ago</li>
              <li>They have already been returned or replacement requested</li>
              <li>They are not eligible for return based on seller's policy</li>
              <li>They have not been delivered yet</li>
            </ul>
          </CardContent>
          <CardFooter className="flex justify-end">
            <Button asChild variant="outline">
              <Link to={`/orders/${orderId}`}>
                <ChevronLeftIcon className="mr-2 h-4 w-4" /> Back to Order Details
              </Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  // Fallback reasons if API returns nothing
  const fallbackReasons = [
    { id: 1, text: 'Wrong item received' },
    { id: 2, text: 'Item damaged' },
    { id: 3, text: 'Not as described' },
    { id: 4, text: 'Other' },
  ];
  const filteredReturnReasons = Array.isArray(returnReasons) && returnReasons.length > 0
    ? returnReasons.filter(r => r && r.id && r.text)
    : fallbackReasons;

  return (
    <div className="min-h-screen bg-[#F8F5E4]">
      <div className="container max-w-3xl mx-auto py-6 px-4">
        <Breadcrumb className="mb-6">
          <BreadcrumbItem>
            <BreadcrumbLink as={Link} to="/">Home</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbItem>
            <BreadcrumbLink as={Link} to="/orders">My Orders</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbItem>
            <BreadcrumbLink as={Link} to={`/orders/${orderId}`}>Order #{order.orderNumber}</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbItem isCurrentPage>
            <BreadcrumbLink>Create Return</BreadcrumbLink>
          </BreadcrumbItem>
        </Breadcrumb>
        
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold tracking-tight mb-1">Return Request</h1>
            <p className="text-gray-500">Order #{order.orderNumber} | Placed on {format(new Date(order.createdAt), 'MMMM d, yyyy')}</p>
          </div>
          <Button asChild variant="outline" className="mt-4 sm:mt-0">
            <Link to={`/orders/${orderId}`}>
              <ChevronLeftIcon className="mr-2 h-4 w-4" /> Back to Order
            </Link>
          </Button>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Create Return Request</CardTitle>
            <CardDescription>
              Please provide details about your return request
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* Request Type */}
                <FormField
                  control={form.control}
                  name="requestType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Request Type</FormLabel>
                      <Select
                        onValueChange={(value) => {
                          setRequestType(value);
                          field.onChange(value);
                        }}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select what you want to do" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="return">Return (Get Refund)</SelectItem>
                          <SelectItem value="replacement">Replacement (Get Same Item)</SelectItem>
                          <SelectItem value="refund">Refund Only (Keep Item)</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Choose whether you want a refund, replacement, or both
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Eligibility Check Result */}
                {eligibilityChecked && eligibility && (
                  <Alert variant={eligibility.eligible ? "default" : "destructive"}>
                    {eligibility.eligible ? (
                      <CheckCircleIcon className="h-4 w-4" />
                    ) : (
                      <XCircleIcon className="h-4 w-4" />
                    )}
                    <AlertTitle>
                      {eligibility.eligible ? "Item Eligible" : "Item Not Eligible"}
                    </AlertTitle>
                    <AlertDescription>
                      {eligibility.message}
                      {eligibility.remainingDays && eligibility.eligible && (
                        <span className="block mt-1">
                          You have {eligibility.remainingDays} days left to return this item.
                        </span>
                      )}
                    </AlertDescription>
                  </Alert>
                )}

                {/* Return Reason - always show */}
                <FormField
                  control={form.control}
                  name="reasonId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Reason</FormLabel>
                      <Select
                        onValueChange={(value) => field.onChange(parseInt(value))}
                        defaultValue={field.value === 0 ? undefined : field.value.toString()}
                        disabled={isLoadingReasons || filteredReturnReasons.length === 0}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={isLoadingReasons ? "Loading reasons..." : filteredReturnReasons.length === 0 ? "No reasons available" : "Select a reason"} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {filteredReturnReasons.length === 0 ? (
                            <SelectItem value="" disabled>No reasons available</SelectItem>
                          ) : (
                            filteredReturnReasons.map((reason) => (
                              <SelectItem key={reason.id} value={reason.id.toString()}>
                                {reason.text}
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Please select the reason that best describes your issue
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Description - always show */}
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Please describe your issue in detail" 
                          className="resize-none min-h-32" 
                          {...field} 
                        />
                      </FormControl>
                      <FormDescription>
                        Provide as much detail as possible about the issue with your order
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Image Upload - always show */}
                <div className="space-y-3">
                  <FormLabel>Upload Images (Optional)</FormLabel>
                  <div className="border border-input rounded-md p-4">
                    <div className="flex flex-wrap gap-4 mb-4">
                      {uploadedImages.map((image, index) => (
                        <div 
                          key={index} 
                          className="relative rounded-md overflow-hidden h-24 w-24 border"
                        >
                          <img 
                            src={image} 
                            alt={`Uploaded ${index + 1}`} 
                            className="h-full w-full object-cover"
                          />
                          <button
                            type="button"
                            onClick={() => handleRemoveImage(index)}
                            className="absolute top-1 right-1 bg-black bg-opacity-60 rounded-full p-1 text-white"
                            title="Remove image"
                          >
                            <XIcon className="h-4 w-4" />
                          </button>
                        </div>
                      ))}

                      {uploadedImages.length < 5 && (
                        <div className="h-24 w-24 flex flex-col items-center justify-center border border-dashed rounded-md p-2 text-gray-500">
                          <label 
                            htmlFor="image-upload" 
                            className="flex flex-col items-center justify-center w-full h-full cursor-pointer"
                          >
                            {isUploading ? (
                              <Loader2Icon className="h-6 w-6 animate-spin mb-1" />
                            ) : (
                              <UploadIcon className="h-6 w-6 mb-1" />
                            )}
                            <span className="text-xs text-center">
                              {isUploading ? "Uploading..." : "Add Image"}
                            </span>
                            <input
                              id="image-upload"
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={handleImageUpload}
                              disabled={isUploading}
                            />
                          </label>
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-gray-500">
                      Upload up to 5 images showing the issue with your order. Supported formats: JPEG, PNG, WebP (max 5MB each)
                    </p>
                  </div>
                </div>

                {/* Submit Button - only show if eligible */}
                {eligibilityChecked && eligibility?.eligible && (
                  <div className="flex justify-end">
                    <Button 
                      type="submit" 
                      disabled={createReturnMutation.isPending || isUploading}
                    >
                      {createReturnMutation.isPending && (
                        <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      Submit Return Request
                    </Button>
                  </div>
                )}
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}