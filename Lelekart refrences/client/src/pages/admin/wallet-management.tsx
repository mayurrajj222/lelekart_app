import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { AdminLayout } from "@/components/layout/admin-layout";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

// Define schemas for form validation
const walletSettingsSchema = z.object({
  firstPurchaseCoins: z.coerce
    .number()
    .int()
    .positive("Must be a positive number"),
  expiryDays: z.coerce.number().int().positive("Must be a positive number"),
  conversionRate: z.coerce.number().positive("Must be a positive number"),
  maxUsagePercentage: z.coerce
    .number()
    .min(0)
    .max(100, "Must be between 0 and 100"),
  minCartValue: z.coerce.number().min(0, "Must be a non-negative value"),
  applicableCategories: z.string().optional(),
  isActive: z.boolean(),
});

const walletAdjustmentSchema = z.object({
  userId: z.coerce.number().int().positive("User ID is required"),
  amount: z.coerce.number().int().min(1, "Amount must be at least 1"),
  reason: z.string().min(3, "Reason must be at least 3 characters"),
});

type WalletSettings = z.infer<typeof walletSettingsSchema>;
type WalletAdjustment = z.infer<typeof walletAdjustmentSchema>;

interface WalletUser {
  id: number;
  username: string;
  balance: number;
}

export default function WalletManagementPage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("settings");
  const [selectedUser, setSelectedUser] = useState<number | null>(null);

  // Query for wallet settings
  const { data: settings, isLoading: isSettingsLoading } = useQuery({
    queryKey: ["/api/wallet/settings"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/wallet/settings");
      if (!res.ok) {
        throw new Error("Failed to fetch wallet settings");
      }
      return res.json();
    },
  });

  // Query for users with wallets
  const { data: users = [], isLoading: isUsersLoading } = useQuery({
    queryKey: ["/api/wallet/users"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/wallet/users");
      if (!res.ok) {
        throw new Error("Failed to fetch users with wallets");
      }
      return res.json();
    },
  });

  // Query for user wallet transactions
  const {
    data: transactionsData = { transactions: [], total: 0 },
    isLoading: isTransactionsLoading,
  } = useQuery({
    queryKey: ["/api/wallet/user", selectedUser, "transactions"],
    queryFn: async () => {
      if (!selectedUser) return { transactions: [], total: 0 };
      const res = await apiRequest(
        "GET",
        `/api/wallet/user/${selectedUser}/transactions`
      );
      if (!res.ok) {
        throw new Error("Failed to fetch user transactions");
      }
      return res.json();
    },
    enabled: !!selectedUser,
  });
  const transactions = transactionsData.transactions || [];
  const transactionsTotal = transactionsData.total || 0;

  // Mutation for updating wallet settings
  const updateSettingsMutation = useMutation({
    mutationFn: async (data: WalletSettings) => {
      const res = await apiRequest("PUT", "/api/wallet/settings", data);
      if (!res.ok) {
        throw new Error("Failed to update wallet settings");
      }
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Settings Updated",
        description: "Wallet settings have been updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/wallet/settings"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Update Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Mutation for manual wallet adjustment
  const adjustWalletMutation = useMutation({
    mutationFn: async (data: WalletAdjustment) => {
      const res = await apiRequest("POST", "/api/wallet/adjust", data);
      if (!res.ok) {
        throw new Error("Failed to adjust wallet balance");
      }
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Wallet Adjusted",
        description: "User's wallet balance has been adjusted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/wallet/users"] });
      if (selectedUser) {
        queryClient.invalidateQueries({
          queryKey: ["/api/wallet/user", selectedUser, "transactions"],
        });
      }
      adjustForm.reset({
        userId: 0,
        amount: 0,
        reason: "",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Adjustment Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Form for wallet settings
  const settingsForm = useForm<WalletSettings>({
    resolver: zodResolver(walletSettingsSchema),
    defaultValues: {
      firstPurchaseCoins: 0,
      expiryDays: 0,
      conversionRate: 0,
      maxUsagePercentage: 20,
      minCartValue: 0,
      applicableCategories: "",
      isActive: false,
    },
  });

  // Form for wallet adjustment
  const adjustForm = useForm<WalletAdjustment>({
    resolver: zodResolver(walletAdjustmentSchema),
    defaultValues: {
      userId: 0,
      amount: 0,
      reason: "",
    },
  });

  // Update form when settings data is loaded
  useEffect(() => {
    if (settings && !settingsForm.formState.isDirty) {
      settingsForm.reset({
        firstPurchaseCoins: settings.firstPurchaseCoins,
        expiryDays: settings.coinExpiryDays,
        conversionRate: Number(settings.coinToCurrencyRatio),
        maxUsagePercentage: settings.maxUsagePercentage
          ? Number(settings.maxUsagePercentage)
          : 20,
        minCartValue: settings.minCartValue ? Number(settings.minCartValue) : 0,
        applicableCategories: settings.applicableCategories || "",
        isActive: settings.isEnabled,
      });
    }
  }, [settings, settingsForm]);

  // Handle form submissions
  const onSettingsSubmit = (data: WalletSettings) => {
    // Map client field names to server field names
    const serverData = {
      firstPurchaseCoins: data.firstPurchaseCoins,
      coinToCurrencyRatio: data.conversionRate,
      minOrderValue: 0, // Set default values for required fields
      maxRedeemableCoins: 10000, // Set default values for required fields
      coinExpiryDays: data.expiryDays,
      maxUsagePercentage: data.maxUsagePercentage,
      minCartValue: data.minCartValue,
      applicableCategories: data.applicableCategories,
      isEnabled: data.isActive,
    };

    updateSettingsMutation.mutate(serverData);
  };

  const onWalletAdjustSubmit = (data: WalletAdjustment) => {
    adjustWalletMutation.mutate(data);
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  // Get transaction type color
  const getTransactionTypeColor = (type: string) => {
    switch (type) {
      case "credit":
        return "text-green-600";
      case "debit":
        return "text-red-600";
      case "expired":
        return "text-orange-600";
      default:
        return "text-gray-600";
    }
  };

  return (
    <AdminLayout>
      <div className="px-2 sm:px-4 md:px-6 max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Wallet Management</h1>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <div className="overflow-x-auto">
            <TabsList className="min-w-max grid w-full max-w-md grid-cols-3">
              <TabsTrigger value="settings">Settings</TabsTrigger>
              <TabsTrigger value="users">User Wallets</TabsTrigger>
              <TabsTrigger value="adjust">Manual Adjust</TabsTrigger>
            </TabsList>
          </div>

          {/* Wallet Settings Tab */}
          <TabsContent value="settings">
            <Card>
              <CardHeader>
                <CardTitle>Wallet System Settings</CardTitle>
                <CardDescription>
                  Configure the behavior of the wallet system
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isSettingsLoading ? (
                  <div className="flex justify-center py-6">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : (
                  <Form {...settingsForm}>
                    <form
                      onSubmit={settingsForm.handleSubmit(onSettingsSubmit)}
                      className="space-y-4"
                    >
                      <FormField
                        control={settingsForm.control}
                        name="firstPurchaseCoins"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>First Purchase Reward (coins)</FormLabel>
                            <FormControl>
                              <Input type="number" {...field} />
                            </FormControl>
                            <FormDescription>
                              Number of coins awarded for a buyer's first
                              purchase
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={settingsForm.control}
                        name="expiryDays"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Coin Expiry Days</FormLabel>
                            <FormControl>
                              <Input type="number" {...field} />
                            </FormControl>
                            <FormDescription>
                              Number of days before unused coins expire
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={settingsForm.control}
                        name="conversionRate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              Conversion Rate (coins per ₹1)
                            </FormLabel>
                            <FormControl>
                              <Input type="number" {...field} />
                            </FormControl>
                            <FormDescription>
                              How many coins equal ₹1 when redeeming
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={settingsForm.control}
                        name="maxUsagePercentage"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Max Usage Percentage (%)</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                {...field}
                                min="0"
                                max="100"
                              />
                            </FormControl>
                            <FormDescription>
                              Maximum percentage of order value that can be paid
                              with coins
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={settingsForm.control}
                        name="minCartValue"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Minimum Cart Value (₹)</FormLabel>
                            <FormControl>
                              <Input type="number" {...field} min="0" />
                            </FormControl>
                            <FormDescription>
                              Minimum cart value required to use coins
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={settingsForm.control}
                        name="applicableCategories"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Applicable Categories</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormDescription>
                              Comma-separated list of categories where coins can
                              be applied (leave empty for all categories)
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Make the wallet enable/disable option more prominent */}
                      <Card className="border-2 border-primary/20 mt-6 mb-2">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-base">
                            Wallet System Status
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <FormField
                            control={settingsForm.control}
                            name="isActive"
                            render={({ field }) => (
                              <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                                <FormControl>
                                  <div className="flex items-center space-x-2">
                                    <Switch
                                      checked={field.value}
                                      onCheckedChange={field.onChange}
                                      className="data-[state=checked]:bg-green-500"
                                    />
                                    <span
                                      className={`font-semibold ${field.value ? "text-green-500" : "text-red-500"}`}
                                    >
                                      {field.value ? "ENABLED" : "DISABLED"}
                                    </span>
                                  </div>
                                </FormControl>
                                <div className="space-y-1 leading-none">
                                  <FormDescription>
                                    When disabled, users cannot earn or redeem
                                    coins throughout the platform
                                  </FormDescription>
                                </div>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </CardContent>
                      </Card>

                      <Button
                        type="submit"
                        disabled={updateSettingsMutation.isPending}
                        className="w-full sm:w-auto"
                      >
                        {updateSettingsMutation.isPending && (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        )}
                        Save Settings
                      </Button>
                    </form>
                  </Form>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* User Wallets Tab */}
          <TabsContent value="users">
            <Card>
              <CardHeader>
                <CardTitle>User Wallets</CardTitle>
                <CardDescription>
                  View and manage user wallet balances
                </CardDescription>
              </CardHeader>
              <CardContent className="px-2 sm:px-4">
                {isUsersLoading ? (
                  <div className="flex justify-center py-6">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table className="min-w-[800px]">
                      <TableHeader>
                        <TableRow>
                          <TableHead>ID</TableHead>
                          <TableHead>Username</TableHead>
                          <TableHead>Balance</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {users.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={4} className="text-center">
                              No users with wallets found
                            </TableCell>
                          </TableRow>
                        ) : (
                          users.map((user: WalletUser) => (
                            <TableRow key={user.id}>
                              <TableCell>{user.id}</TableCell>
                              <TableCell>{user.username}</TableCell>
                              <TableCell>{user.balance}</TableCell>
                              <TableCell>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setSelectedUser(user.id)}
                                  className="w-full sm:w-auto"
                                >
                                  View Transactions
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Manual Adjustment Tab */}
          <TabsContent value="adjust">
            <Card>
              <CardHeader>
                <CardTitle>Manual Wallet Adjustment</CardTitle>
                <CardDescription>
                  Manually adjust user wallet balances
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...adjustForm}>
                  <form
                    onSubmit={adjustForm.handleSubmit(onWalletAdjustSubmit)}
                    className="space-y-4"
                  >
                    <FormField
                      control={adjustForm.control}
                      name="userId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>User ID</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={adjustForm.control}
                      name="amount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Amount (coins)</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} />
                          </FormControl>
                          <FormDescription>
                            Positive for credit, negative for debit
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={adjustForm.control}
                      name="reason"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Reason</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormDescription>
                            Reason for this adjustment
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button
                      type="submit"
                      disabled={adjustWalletMutation.isPending}
                      className="w-full sm:w-auto"
                    >
                      {adjustWalletMutation.isPending && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      Apply Adjustment
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
