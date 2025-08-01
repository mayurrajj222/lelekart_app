import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
import { useWallet } from "@/context/wallet-context";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Loader2,
  CreditCard,
  Coins,
  ArrowDown,
  ArrowUp,
  AlertCircle,
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { format } from "date-fns";

// Schema for redeeming coins
const redeemFormSchema = z.object({
  amount: z.coerce.number().int().positive("Amount must be a positive number"),
  orderValue: z.coerce.number().optional(),
  category: z.string().optional(),
  description: z.string().optional(),
});

type RedeemFormValues = z.infer<typeof redeemFormSchema>;

// Type for redeemCoins return value
type RedeemCoinsResult = {
  voucherCode?: string;
  discountAmount?: number;
} | void;

export default function WalletPage() {
  const {
    wallet,
    transactions,
    settings,
    isLoading,
    isTransactionsLoading,
    isSettingsLoading,
    redeemCoins,
  } = useWallet();

  const [activeTab, setActiveTab] = useState("overview");
  const [voucherInfo, setVoucherInfo] = useState<{
    code: string;
    value: number;
  } | null>(null);

  // Set up form with validation
  const form = useForm<RedeemFormValues>({
    resolver: zodResolver(redeemFormSchema),
    defaultValues: {
      amount: 100,
    },
  });

  // Handle form submission
  async function onSubmit(data: RedeemFormValues) {
    try {
      const result = (await redeemCoins(data.amount, {
        referenceType: "MANUAL",
        description: data.description || "Manual redemption",
        orderValue: data.orderValue,
        category: data.category,
      })) as RedeemCoinsResult;
      // If backend returns voucher info, show it
      if (
        result &&
        typeof result === "object" &&
        result.voucherCode &&
        result.discountAmount
      ) {
        setVoucherInfo({
          code: result.voucherCode,
          value: result.discountAmount,
        });
      }
      form.reset({ amount: 100 });
    } catch (error) {
      console.error("Error redeeming coins:", error);
    }
  }

  // Format date for display
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "MMM dd, yyyy • HH:mm");
    } catch (e) {
      return "Invalid date";
    }
  };

  // Check if a coin balance is about to expire
  const getFirstExpiringTransaction = () => {
    // Make sure transactions is an array
    const safeTransactions = Array.isArray(transactions) ? transactions : [];
    if (safeTransactions.length === 0) return null;

    const now = new Date();
    const creditTransactions = safeTransactions.filter(
      (t) => t.type === "credit" && t.expiresAt
    );

    if (creditTransactions.length === 0) return null;

    // Sort by expiration date (closest first)
    creditTransactions.sort((a, b) => {
      const aDate = a.expiresAt
        ? new Date(a.expiresAt)
        : new Date(9999, 11, 31);
      const bDate = b.expiresAt
        ? new Date(b.expiresAt)
        : new Date(9999, 11, 31);
      return aDate.getTime() - bDate.getTime();
    });

    const closest = creditTransactions[0];
    if (!closest.expiresAt) return null;

    const expiryDate = new Date(closest.expiresAt);

    // If it's going to expire within the next 7 days
    const daysUntilExpiry = Math.ceil(
      (expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysUntilExpiry <= 7 && daysUntilExpiry > 0) {
      return {
        amount: closest.amount,
        days: daysUntilExpiry,
      };
    }

    return null;
  };

  const expiringCoins = getFirstExpiringTransaction();

  // Calculate conversion to INR if settings available
  const calculateInrValue = (coins: number) => {
    if (!settings || !settings.conversionRate) return 0;
    return (coins / (settings.conversionRate || 1)).toFixed(2);
  };

  // Get current month's transactions
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  // Make sure transactions is an array
  const safeTransactions = Array.isArray(transactions) ? transactions : [];
  const currentMonthTransactions = safeTransactions.filter((t) => {
    const date = new Date(t.createdAt);
    return (
      date.getMonth() === currentMonth && date.getFullYear() === currentYear
    );
  });

  // Calculate transactions statistics
  const stats = {
    credited: currentMonthTransactions
      .filter((t) => t.type === "credit")
      .reduce((acc, t) => acc + t.amount, 0),
    spent: currentMonthTransactions
      .filter((t) => t.type === "debit")
      .reduce((acc, t) => acc + Math.abs(t.amount), 0),
    expired: currentMonthTransactions
      .filter((t) => t.type === "expired")
      .reduce((acc, t) => acc + t.amount, 0),
  };

  if (isLoading || isSettingsLoading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center h-96">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  // If wallet system is disabled
  if (
    settings &&
    typeof settings.isActive === "boolean" &&
    !settings.isActive
  ) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <h1 className="text-3xl font-bold tracking-tight">My Wallet</h1>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Wallet System Disabled</AlertTitle>
            <AlertDescription>
              The wallet system is currently disabled by the administrator.
            </AlertDescription>
          </Alert>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 bg-[#F8F5E4] min-h-screen">
        <h1 className="text-3xl font-bold tracking-tight">My Wallet</h1>

        {/* Wallet Points and Redeem Coins Display */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Card className="flex-1 bg-[#F8F5E4] border border-gray-200">
            <CardHeader>
              <CardTitle>Wallet Points</CardTitle>
              <CardDescription>
                Your current wallet points balance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">
                {wallet?.balance ?? 0}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Show voucher info if available */}
        {voucherInfo && (
          <Alert variant="default">
            <AlertTitle>Voucher Generated!</AlertTitle>
            <AlertDescription>
              Voucher Code: <b>{voucherInfo.code}</b>
              <br />
              Value: ₹{voucherInfo.value}
              <br />
              <span>This voucher will be auto-applied to your next order.</span>
            </AlertDescription>
          </Alert>
        )}

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card className="bg-[#F8F5E4]">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Available Balance
              </CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ₹{wallet?.balance || 0} wallet rupees
              </div>
              <p className="text-xs text-muted-foreground">
                ≈ ₹{calculateInrValue(wallet?.balance || 0)} value
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Expiring coins alert */}
        {expiringCoins && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Coins Expiring Soon!</AlertTitle>
            <AlertDescription>
              {expiringCoins.amount} coins will expire in {expiringCoins.days}{" "}
              days. Redeem them before they expire!
            </AlertDescription>
          </Alert>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="transactions">Transactions</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
                      <Card className="bg-[#F8F5E4]">
            <CardHeader>
              <CardTitle>Wallet Overview</CardTitle>
              <CardDescription>
                Your wallet activity and coin statistics
              </CardDescription>
            </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <div>Month's Activity</div>
                    <div className="font-medium">
                      {stats.credited - stats.spent - stats.expired} coins (net
                      change)
                    </div>
                  </div>
                  <Progress
                    value={Math.min(
                      stats.credited > 0
                        ? ((stats.credited - stats.spent) / stats.credited) *
                            100
                        : 0,
                      100
                    )}
                  />
                </div>

                <div className="rounded-md border bg-[#F8F5E4]">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-[#F8F5E4] hover:bg-[#EADDCB]">
                        <TableHead className="bg-[#F8F5E4]">Description</TableHead>
                        <TableHead className="bg-[#F8F5E4]">Value</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow className="bg-[#F8F5E4] hover:bg-[#EADDCB]">
                        <TableCell className="bg-[#F8F5E4]">Conversion Rate</TableCell>
                        <TableCell className="bg-[#F8F5E4]">1 wallet rupee = ₹1</TableCell>
                      </TableRow>
                      <TableRow className="bg-[#F8F5E4] hover:bg-[#EADDCB]">
                        <TableCell className="bg-[#F8F5E4]">Coin Expiry</TableCell>
                        <TableCell className="bg-[#F8F5E4]">
                          {settings?.expiryDays || 0} days after earning
                        </TableCell>
                      </TableRow>
                      <TableRow className="bg-[#F8F5E4] hover:bg-[#EADDCB]">
                        <TableCell className="bg-[#F8F5E4]">First Purchase Bonus</TableCell>
                        <TableCell className="bg-[#F8F5E4]">3000 coins</TableCell>
                      </TableRow>
                      {settings &&
                        typeof settings.maxUsagePercentage === "number" &&
                        settings.maxUsagePercentage > 0 && (
                          <TableRow className="bg-[#F8F5E4] hover:bg-[#EADDCB]">
                            <TableCell className="bg-[#F8F5E4]">Maximum Usage</TableCell>
                            <TableCell className="bg-[#F8F5E4]">
                              {settings.maxUsagePercentage}% of order value
                            </TableCell>
                          </TableRow>
                        )}
                      {settings &&
                        typeof settings.minCartValue !== "undefined" &&
                        (settings.minCartValue ?? 0) > 0 && (
                          <TableRow className="bg-[#F8F5E4] hover:bg-[#EADDCB]">
                            <TableCell className="bg-[#F8F5E4]">Minimum Order Value</TableCell>
                            <TableCell className="bg-[#F8F5E4]">{settings?.minCartValue ?? 0}</TableCell>
                          </TableRow>
                        )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
              <CardFooter className="border-t px-6 py-4">
                <p className="text-xs text-muted-foreground">
                  Lelekart coins can be redeemed for discounts on your
                  purchases. Coins expire after {settings?.expiryDays || 30}{" "}
                  days from the date they were earned.
                </p>
              </CardFooter>
            </Card>
          </TabsContent>

          <TabsContent value="transactions" className="space-y-4">
            <Card className="bg-[#F8F5E4]">
              <CardHeader>
                <CardTitle>Transaction History</CardTitle>
                <CardDescription>
                  Your recent wallet transactions
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isTransactionsLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : (
                  <div className="rounded-md border bg-[#F8F5E4]">
                    <Table className="bg-[#F8F5E4]">
                      <TableHeader>
                        <TableRow className="bg-[#F8F5E4] hover:bg-[#EADDCB]">
                          <TableHead className="bg-[#F8F5E4]">Date</TableHead>
                          <TableHead className="bg-[#F8F5E4]">Amount</TableHead>
                          <TableHead className="bg-[#F8F5E4]">Description</TableHead>
                          <TableHead className="bg-[#F8F5E4]">Date</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {!Array.isArray(transactions) ||
                        transactions.length === 0 ? (
                          <TableRow className="bg-[#F8F5E4]">
                            <TableCell colSpan={4} className="text-center py-6 bg-[#F8F5E4]">
                              No transactions found
                            </TableCell>
                          </TableRow>
                        ) : (
                          // Make sure transactions is an array
                          Array.isArray(transactions) &&
                          transactions.map((transaction) => {
                            let typeStyle = "";
                            if (transaction.type === "credit")
                              typeStyle = "text-green-600 font-medium";
                            if (transaction.type === "debit")
                              typeStyle = "text-red-600 font-medium";
                            if (transaction.type === "expired")
                              typeStyle = "text-orange-600 font-medium";

                            return (
                              <TableRow key={transaction.id} className="bg-[#F8F5E4] hover:bg-[#EADDCB]">
                                <TableCell className="bg-[#F8F5E4]">
                                  {formatDate(transaction.createdAt)}
                                </TableCell>
                                <TableCell className={`${typeStyle} bg-[#F8F5E4]`}>
                                  {transaction.type
                                    ? transaction.type.charAt(0).toUpperCase() +
                                      transaction.type.slice(1)
                                    : "Unknown"}
                                </TableCell>
                                <TableCell className={`${typeStyle} bg-[#F8F5E4]`}>
                                  {transaction.type === "debit" ? "-" : ""}
                                  {transaction.amount}
                                </TableCell>
                                <TableCell className="bg-[#F8F5E4]">{transaction.description}</TableCell>
                                <TableCell className="bg-[#F8F5E4]">
                                  {transaction.expiresAt
                                    ? formatDate(transaction.expiresAt)
                                    : "N/A"}
                                </TableCell>
                              </TableRow>
                            );
                          })
                        )}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
