import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { User } from "@shared/schema";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Bell, InfoIcon, ShoppingBag, User as UserIcon, UserCircle, Loader2, LockKeyhole } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";


// Profile form schema
const profileFormSchema = z.object({
  username: z.string().min(2, {
    message: "Username must be at least 2 characters.",
  }),
  email: z.string().email({
    message: "Please enter a valid email address.",
  }),
  phone: z.string().optional(),
  address: z.string().optional(),
});

// Security form schema
const securityFormSchema = z.object({
  currentPassword: z.string().optional(),
  newPassword: z.string().min(8, {
    message: "Password must be at least 8 characters.",
  }).optional(),
  confirmPassword: z.string().optional(),
}).refine((data) => {
  if (data.newPassword && !data.currentPassword) {
    return false;
  }
  return true;
}, {
  message: "Current password is required to set a new password",
  path: ["currentPassword"],
}).refine((data) => {
  if (data.newPassword && data.newPassword !== data.confirmPassword) {
    return false;
  }
  return true;
}, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

// Notification preferences schema
const notificationSchema = z.object({
  orderUpdates: z.boolean().default(true),
  promotions: z.boolean().default(true),
  priceAlerts: z.boolean().default(true),
  stockAlerts: z.boolean().default(true),
  accountUpdates: z.boolean().default(true),
  deliveryUpdates: z.boolean().default(true),
  recommendationAlerts: z.boolean().default(true),
  paymentReminders: z.boolean().default(true),
});

export default function BuyerSettingsPage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("profile");
  const [communicationPreference, setCommunicationPreference] = useState("email");
  const [imageUploadPending, setImageUploadPending] = useState(false);
  const [imageUploadError, setImageUploadError] = useState<string | null>(null);
  
  // Safely get user data directly from API
  const { data: user, isLoading } = useQuery<User | null>({
    queryKey: ['/api/user'],
    queryFn: async () => {
      const res = await fetch('/api/user', {
        credentials: 'include',
      });
      
      if (!res.ok) {
        if (res.status === 401) return null;
        throw new Error('Failed to fetch user');
      }
      
      return res.json();
    },
    staleTime: 60000, // 1 minute
  });

  // Profile form setup
  const profileForm = useForm<z.infer<typeof profileFormSchema>>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      username: "",
      email: "",
      phone: "",
      address: "",
    },
  });
  
  // Update form values when user data is loaded
  useEffect(() => {
    if (user) {
      profileForm.reset({
        username: user.username || "",
        email: user.email || "",
        phone: user.phone || "",
        address: user.address || "",
      });
    }
  }, [user, profileForm]);

  // Security form setup
  const securityForm = useForm<z.infer<typeof securityFormSchema>>({
    resolver: zodResolver(securityFormSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  // Notification preferences form setup
  const notificationForm = useForm<z.infer<typeof notificationSchema>>({
    resolver: zodResolver(notificationSchema),
    defaultValues: {
      orderUpdates: true,
      promotions: true,
      priceAlerts: true,
      stockAlerts: true,
      accountUpdates: true,
      deliveryUpdates: true,
      recommendationAlerts: true,
      paymentReminders: true,
    },
  });
  
  // Fetch user notification preferences if they exist
  const { data: userNotificationPreferences } = useQuery({
    queryKey: ['/api/user/notification-preferences'],
    queryFn: async () => {
      try {
        const res = await fetch('/api/user/notification-preferences', {
          credentials: 'include',
        });
        
        if (!res.ok) {
          if (res.status === 404) return null; // No preferences set yet
          throw new Error('Failed to fetch notification preferences');
        }
        
        return res.json();
      } catch (error) {
        console.error('Error fetching notification preferences:', error);
        return null;
      }
    },
    enabled: !!user, // Only run this query if user is logged in
  });
  
  // Load user notification preferences when available
  useEffect(() => {
    if (userNotificationPreferences) {
      // Set communication preference
      if (userNotificationPreferences.communicationPreference) {
        setCommunicationPreference(userNotificationPreferences.communicationPreference);
      }
      
      // Reset form with user preferences
      notificationForm.reset({
        orderUpdates: userNotificationPreferences.orderUpdates ?? true,
        promotions: userNotificationPreferences.promotions ?? true,
        priceAlerts: userNotificationPreferences.priceAlerts ?? true,
        stockAlerts: userNotificationPreferences.stockAlerts ?? true,
        accountUpdates: userNotificationPreferences.accountUpdates ?? true,
        deliveryUpdates: userNotificationPreferences.deliveryUpdates ?? true,
        recommendationAlerts: userNotificationPreferences.recommendationAlerts ?? true,
        paymentReminders: userNotificationPreferences.paymentReminders ?? true,
      });
    }
  }, [userNotificationPreferences, notificationForm]);

  // Profile update mutation
  const profileMutation = useMutation({
    mutationFn: async (data: z.infer<typeof profileFormSchema>) => {
      const res = await apiRequest("PATCH", "/api/user/profile", data);
      if (!res.ok) {
        throw new Error("Failed to update profile");
      }
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Profile updated",
        description: "Your profile information has been updated successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Security update mutation
  const securityMutation = useMutation({
    mutationFn: async (data: z.infer<typeof securityFormSchema>) => {
      const res = await apiRequest("POST", "/api/user/change-password", {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });
      if (!res.ok) {
        throw new Error("Failed to update password");
      }
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Password updated",
        description: "Your password has been updated successfully.",
      });
      securityForm.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Notification preferences mutation
  const notificationMutation = useMutation({
    mutationFn: async (data: z.infer<typeof notificationSchema>) => {
      const res = await apiRequest("POST", "/api/user/notification-preferences", {
        ...data,
        communicationPreference,
      });
      if (!res.ok) {
        throw new Error("Failed to update notification preferences");
      }
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Preferences updated",
        description: "Your notification preferences have been updated successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Handle profile form submission
  const onProfileSubmit = (data: z.infer<typeof profileFormSchema>) => {
    profileMutation.mutate(data);
  };

  // Handle security form submission
  const onSecuritySubmit = (data: z.infer<typeof securityFormSchema>) => {
    securityMutation.mutate(data);
  };

  // Handle notification preferences form submission
  const onNotificationSubmit = (data: z.infer<typeof notificationSchema>) => {
    notificationMutation.mutate(data);
  };
  
  // Handle profile image upload
  const handleProfileImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files || event.target.files.length === 0) {
      return;
    }
    
    setImageUploadPending(true);
    setImageUploadError(null);
    
    const file = event.target.files[0];
    
    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setImageUploadError("Image is too large. Maximum size is 5MB.");
      setImageUploadPending(false);
      return;
    }
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
      setImageUploadError("Only image files are allowed.");
      setImageUploadPending(false);
      return;
    }
    
    try {
      const formData = new FormData();
      formData.append('profileImage', file);
      
      const response = await fetch('/api/user/profile-image', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error('Failed to upload profile image');
      }
      
      const result = await response.json();
      
      // Refresh user data
      queryClient.invalidateQueries({ queryKey: ['/api/user'] });
      
      toast({
        title: "Profile image updated",
        description: "Your profile image has been updated successfully.",
      });
    } catch (error) {
      console.error('Error uploading profile image:', error);
      setImageUploadError(error instanceof Error ? error.message : 'Failed to upload image');
    } finally {
      setImageUploadPending(false);
      // Clear the file input
      event.target.value = '';
    }
  };
  
  // Handle profile image deletion
  const handleProfileImageDelete = async (event: React.MouseEvent) => {
    event.preventDefault();
    
    if (!user?.profileImage) return;
    
    setImageUploadPending(true);
    setImageUploadError(null);
    
    try {
      // Call API to remove profile image
      const response = await apiRequest('PATCH', '/api/user/profile', {
        profileImage: null // Setting to null will remove the profile image
      });
      
      if (!response.ok) {
        throw new Error('Failed to remove profile image');
      }
      
      // Refresh user data
      queryClient.invalidateQueries({ queryKey: ['/api/user'] });
      
      toast({
        title: "Profile image removed",
        description: "Your profile image has been removed successfully.",
      });
    } catch (error) {
      console.error('Error removing profile image:', error);
      setImageUploadError(error instanceof Error ? error.message : 'Failed to remove image');
    } finally {
      setImageUploadPending(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F5E4]">
      <DashboardLayout>
        <div className="w-full">
          <h1 className="text-2xl font-bold mb-6">Account Settings</h1>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <TabsList className="w-full bg-[#F8F5E4] p-0 flex justify-start gap-1 border-b">
              <TabsTrigger 
                value="profile" 
                className="data-[state=active]:border-primary data-[state=active]:border-b-2 rounded-none py-2 px-4 bg-transparent data-[state=active]:bg-transparent data-[state=active]:shadow-none"
              >
                <UserIcon className="h-4 w-4 mr-2" />
                Profile
              </TabsTrigger>
              <TabsTrigger 
                value="security" 
                className="data-[state=active]:border-primary data-[state=active]:border-b-2 rounded-none py-2 px-4 bg-transparent data-[state=active]:bg-transparent data-[state=active]:shadow-none"
              >
                <LockKeyhole className="h-4 w-4 mr-2" />
                Security
              </TabsTrigger>
              <TabsTrigger 
                value="notifications" 
                className="data-[state=active]:border-primary data-[state=active]:border-b-2 rounded-none py-2 px-4 bg-transparent data-[state=active]:bg-transparent data-[state=active]:shadow-none"
              >
                <Bell className="h-4 w-4 mr-2" />
                Notifications
              </TabsTrigger>
            </TabsList>

            {/* Profile Tab */}
            <TabsContent value="profile">
              <Card className="border shadow-sm bg-[#F8F5E4]">
                <CardHeader>
                  <CardTitle>Profile Information</CardTitle>
                  <CardDescription>
                    Update your personal information and contact details
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...profileForm}>
                    <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-6">
                      {/* Profile Image Upload */}
                      <div className="flex flex-col items-center mb-6">
                        <div className="relative group">
                          <div className="w-24 h-24 rounded-full border-2 border-primary overflow-hidden bg-gray-100 flex items-center justify-center">
                            {user?.profileImage ? (
                              <img 
                                src={user.profileImage} 
                                alt="Profile" 
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.src = `https://ui-avatars.com/api/?name=${user.name || user.username}&background=random&color=fff`;
                                }}
                              />
                            ) : (
                              <UserCircle className="w-20 h-20 text-gray-300" />
                            )}
                          </div>
                          <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                            <input
                              id="profileImage"
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={handleProfileImageUpload}
                            />
                            <label 
                              htmlFor="profileImage" 
                              className="cursor-pointer text-white text-xs font-medium py-1 px-2"
                            >
                              Change
                            </label>
                            {user?.profileImage && (
                              <button 
                                onClick={handleProfileImageDelete}
                                className="cursor-pointer text-white text-xs font-medium py-1 px-2 ml-1"
                                type="button"
                              >
                                Remove
                              </button>
                            )}
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground mt-2">Click to upload or change profile picture</p>
                        {imageUploadPending && <Loader2 className="mt-2 h-5 w-5 animate-spin text-primary" />}
                        {imageUploadError && <p className="text-sm text-red-500 mt-1">{imageUploadError}</p>}
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={profileForm.control}
                          name="username"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Full Name</FormLabel>
                              <FormControl>
                                <Input placeholder="Enter your full name" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={profileForm.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Email</FormLabel>
                              <FormControl>
                                <Input placeholder="your.email@example.com" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={profileForm.control}
                          name="phone"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Phone Number</FormLabel>
                              <FormControl>
                                <Input placeholder="Enter your phone number" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <FormField
                        control={profileForm.control}
                        name="address"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Address</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter your address" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <div className="flex justify-end">
                        <Button type="submit" disabled={profileMutation.isPending}>
                          {profileMutation.isPending ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Saving...
                            </>
                          ) : (
                            "Save Changes"
                          )}
                        </Button>
                      </div>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Security Tab */}
            <TabsContent value="security">
              <Card className="border shadow-sm bg-[#F8F5E4]">
                <CardHeader>
                  <CardTitle>Security Settings</CardTitle>
                  <CardDescription>
                    Manage your account security preferences
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="rounded-lg border p-6 space-y-4">
                    <div className="flex items-start gap-4">
                      <InfoIcon className="h-6 w-6 text-primary shrink-0 mt-1" />
                      <div>
                        <h3 className="text-base font-semibold">Secure Email Authentication</h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          Your account is secured with email OTP authentication. For account security,
                          we send a one-time verification code to your email whenever you sign in.
                        </p>
                      </div>
                    </div>
                    
                    <div className="pt-2 border-t">
                      <h4 className="text-sm font-medium mb-2">Email Address for Authentication</h4>
                      <div className="flex items-center gap-3">
                        <p className="text-sm font-semibold">{user?.email}</p>
                        <Button variant="outline" size="sm" onClick={() => setActiveTab("profile")}>
                          Change Email
                        </Button>
                      </div>
                    </div>
                  </div>
                  
                  <div className="rounded-lg border p-6">
                    <h3 className="text-base font-semibold mb-2">Account Protection Tips</h3>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-start gap-2">
                        <div className="h-5 w-5 rounded-full bg-primary/10 text-primary flex items-center justify-center flex-shrink-0 mt-0.5">✓</div>
                        <span>Keep your email account secure with a strong password</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <div className="h-5 w-5 rounded-full bg-primary/10 text-primary flex items-center justify-center flex-shrink-0 mt-0.5">✓</div>
                        <span>Ensure you can always access your verification email</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <div className="h-5 w-5 rounded-full bg-primary/10 text-primary flex items-center justify-center flex-shrink-0 mt-0.5">✓</div>
                        <span>Never share verification codes with anyone</span>
                      </li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Notifications Tab */}
            <TabsContent value="notifications">
              <Card className="border shadow-sm bg-[#F8F5E4]">
                <CardHeader>
                  <CardTitle>Notification Preferences</CardTitle>
                  <CardDescription>
                    Manage your notification preferences and communication settings
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-base font-medium mb-2">Communication Preference</h3>
                      <RadioGroup 
                        value={communicationPreference} 
                        onValueChange={setCommunicationPreference}
                        className="flex flex-col space-y-2"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="email" id="email" />
                          <Label htmlFor="email">Email</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="sms" id="sms" />
                          <Label htmlFor="sms">SMS</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="both" id="both" />
                          <Label htmlFor="both">Both Email and SMS</Label>
                        </div>
                      </RadioGroup>
                    </div>

                    <Form {...notificationForm}>
                      <form onSubmit={notificationForm.handleSubmit(onNotificationSubmit)} className="space-y-4">
                        <h3 className="text-base font-medium mb-2">Notification Categories</h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                            control={notificationForm.control}
                            name="orderUpdates"
                            render={({ field }) => (
                              <FormItem className="flex items-center justify-between space-y-0 rounded-lg border p-4">
                                <div className="space-y-0.5">
                                  <FormLabel className="text-sm font-medium">
                                    Order Updates
                                  </FormLabel>
                                  <FormDescription className="text-xs">
                                    Notifications about your orders and shipping
                                  </FormDescription>
                                </div>
                                <FormControl>
                                  <Switch
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={notificationForm.control}
                            name="promotions"
                            render={({ field }) => (
                              <FormItem className="flex items-center justify-between space-y-0 rounded-lg border p-4">
                                <div className="space-y-0.5">
                                  <FormLabel className="text-sm font-medium">
                                    Promotions & Offers
                                  </FormLabel>
                                  <FormDescription className="text-xs">
                                    Deals, discounts, and promotional offers
                                  </FormDescription>
                                </div>
                                <FormControl>
                                  <Switch
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={notificationForm.control}
                            name="priceAlerts"
                            render={({ field }) => (
                              <FormItem className="flex items-center justify-between space-y-0 rounded-lg border p-4">
                                <div className="space-y-0.5">
                                  <FormLabel className="text-sm font-medium">
                                    Price Alerts
                                  </FormLabel>
                                  <FormDescription className="text-xs">
                                    Notifications when prices drop on your wishlist items
                                  </FormDescription>
                                </div>
                                <FormControl>
                                  <Switch
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={notificationForm.control}
                            name="stockAlerts"
                            render={({ field }) => (
                              <FormItem className="flex items-center justify-between space-y-0 rounded-lg border p-4">
                                <div className="space-y-0.5">
                                  <FormLabel className="text-sm font-medium">
                                    Stock Alerts
                                  </FormLabel>
                                  <FormDescription className="text-xs">
                                    Notifications when out-of-stock items become available
                                  </FormDescription>
                                </div>
                                <FormControl>
                                  <Switch
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={notificationForm.control}
                            name="accountUpdates"
                            render={({ field }) => (
                              <FormItem className="flex items-center justify-between space-y-0 rounded-lg border p-4">
                                <div className="space-y-0.5">
                                  <FormLabel className="text-sm font-medium">
                                    Account Updates
                                  </FormLabel>
                                  <FormDescription className="text-xs">
                                    Important information about your account
                                  </FormDescription>
                                </div>
                                <FormControl>
                                  <Switch
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={notificationForm.control}
                            name="deliveryUpdates"
                            render={({ field }) => (
                              <FormItem className="flex items-center justify-between space-y-0 rounded-lg border p-4">
                                <div className="space-y-0.5">
                                  <FormLabel className="text-sm font-medium">
                                    Delivery Updates
                                  </FormLabel>
                                  <FormDescription className="text-xs">
                                    Realtime updates about your deliveries
                                  </FormDescription>
                                </div>
                                <FormControl>
                                  <Switch
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={notificationForm.control}
                            name="recommendationAlerts"
                            render={({ field }) => (
                              <FormItem className="flex items-center justify-between space-y-0 rounded-lg border p-4">
                                <div className="space-y-0.5">
                                  <FormLabel className="text-sm font-medium">
                                    Personalized Recommendations
                                  </FormLabel>
                                  <FormDescription className="text-xs">
                                    Personalized product recommendations based on your interests
                                  </FormDescription>
                                </div>
                                <FormControl>
                                  <Switch
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={notificationForm.control}
                            name="paymentReminders"
                            render={({ field }) => (
                              <FormItem className="flex items-center justify-between space-y-0 rounded-lg border p-4">
                                <div className="space-y-0.5">
                                  <FormLabel className="text-sm font-medium">
                                    Payment Reminders
                                  </FormLabel>
                                  <FormDescription className="text-xs">
                                    Reminders about pending payments and dues
                                  </FormDescription>
                                </div>
                                <FormControl>
                                  <Switch
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                        </div>

                        <div className="flex justify-end pt-4">
                          <Button type="submit" disabled={notificationMutation.isPending}>
                            {notificationMutation.isPending ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Saving...
                              </>
                            ) : (
                              "Save Preferences"
                            )}
                          </Button>
                        </div>
                      </form>
                    </Form>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </DashboardLayout>
    </div>
  );
}