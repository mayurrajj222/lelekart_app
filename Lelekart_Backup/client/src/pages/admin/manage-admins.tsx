import { useEffect, useState, useContext } from "react";
import { AuthContext } from "@/hooks/use-auth";
import {
  useCoAdmins,
  CoAdminPermissions,
  CreateCoAdminData,
} from "@/hooks/use-co-admins";
import { useQuery } from "@tanstack/react-query";
import { User } from "@shared/schema";
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
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, UserPlus, Trash2, Shield, Edit } from "lucide-react";
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
} from "@/components/ui/alert-dialog";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

const createCoAdminSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  email: z.string().email("Invalid email address"),
  permissions: z.object({
    canAccessDashboard: z.boolean().default(true),
    canCreateProducts: z.boolean().default(false),
    canEditProducts: z.boolean().default(false),
    canDeleteProducts: z.boolean().default(false),
    canApproveProducts: z.boolean().default(false),
    canManageProductDisplay: z.boolean().default(false),
    canCreateCategories: z.boolean().default(false),
    canEditCategories: z.boolean().default(false),
    canDeleteCategories: z.boolean().default(false),
    canManageSubcategories: z.boolean().default(false),
    canManageBanners: z.boolean().default(false),
    canDesignHero: z.boolean().default(false),
    canManageFooter: z.boolean().default(false),
    canManageDocumentTemplates: z.boolean().default(false),
    canManageMediaLibrary: z.boolean().default(false),
    canViewSales: z.boolean().default(true),
    canViewReports: z.boolean().default(true),
    canExportReports: z.boolean().default(false),
    canManageAnalytics: z.boolean().default(false),
    canManageSellers: z.boolean().default(false),
    canApproveSellers: z.boolean().default(false),
    canManageSellerAgreements: z.boolean().default(false),
    canViewOrders: z.boolean().default(false),
    canManageOrders: z.boolean().default(false),
    canProcessRefunds: z.boolean().default(false),
    canViewUsers: z.boolean().default(false),
    canCreateUsers: z.boolean().default(false),
    canManageCustomers: z.boolean().default(false),
    canManageAdmins: z.boolean().default(false),
    canAccessShippingSettings: z.boolean().default(false),
    canManageShippingGeneral: z.boolean().default(false),
    canManageShiprocket: z.boolean().default(false),
    canViewShipmentDashboard: z.boolean().default(false),
    canManagePendingShipments: z.boolean().default(false),
    canManageShippingRates: z.boolean().default(false),
    canManageTrackingInfo: z.boolean().default(false),
    canAccessWalletDashboard: z.boolean().default(false),
    canManageWalletSettings: z.boolean().default(false),
    canViewTransactions: z.boolean().default(false),
    canManageRewards: z.boolean().default(false),
    canManageGiftCards: z.boolean().default(false),
    canManageGST: z.boolean().default(false),
    canSetTaxRates: z.boolean().default(false),
    canManageGSTReports: z.boolean().default(false),
    canManagePromotions: z.boolean().default(false),
    canManageCoupons: z.boolean().default(false),
    canViewFinancials: z.boolean().default(false),
    canManagePaymentSettings: z.boolean().default(false),
    canManageRazorpay: z.boolean().default(false),
    canManageStripe: z.boolean().default(false),
    canAccessSettings: z.boolean().default(false),
    canManageStoreSettings: z.boolean().default(false),
    canManageSystemSettings: z.boolean().default(false),
    canBackupDatabase: z.boolean().default(false),
  }),
});

const permissionDisplayNames = {
  canAccessDashboard: "Access Dashboard",
  canCreateProducts: "Create Products",
  canEditProducts: "Edit Products",
  canDeleteProducts: "Delete Products",
  canApproveProducts: "Approve Products",
  canManageProductDisplay: "Manage Product Display",
  canCreateCategories: "Create Categories",
  canEditCategories: "Edit Categories",
  canDeleteCategories: "Delete Categories",
  canManageSubcategories: "Manage Subcategories",
  canManageBanners: "Manage Banners",
  canDesignHero: "Design Hero Section",
  canManageFooter: "Manage Footer",
  canManageDocumentTemplates: "Manage Document Templates",
  canManageMediaLibrary: "Manage Media Library",
  canViewSales: "View Sales",
  canViewReports: "View Reports",
  canExportReports: "Export Reports",
  canManageAnalytics: "Manage Analytics",
  canManageSellers: "Manage Sellers",
  canApproveSellers: "Approve Sellers",
  canManageSellerAgreements: "Manage Seller Agreements",
  canViewOrders: "View Orders",
  canManageOrders: "Manage Orders",
  canProcessRefunds: "Process Refunds",
  canViewUsers: "View Users",
  canCreateUsers: "Create Users",
  canManageCustomers: "Manage Customers",
  canManageAdmins: "Manage Admins",
  canAccessShippingSettings: "Access Shipping Settings",
  canManageShippingGeneral: "Manage General Shipping",
  canManageShiprocket: "Manage Shiprocket Integration",
  canViewShipmentDashboard: "View Shipment Dashboard",
  canManagePendingShipments: "Manage Pending Shipments",
  canManageShippingRates: "Manage Shipping Rates",
  canManageTrackingInfo: "Manage Tracking Information",
  canAccessWalletDashboard: "Access Wallet Dashboard",
  canManageWalletSettings: "Manage Wallet Settings",
  canViewTransactions: "View Wallet Transactions",
  canManageRewards: "Manage Rewards System",
  canManageGiftCards: "Manage Gift Cards",
  canManageGST: "Manage GST",
  canSetTaxRates: "Set Tax Rates",
  canManageGSTReports: "Manage GST Reports",
  canManagePromotions: "Manage Promotions",
  canManageCoupons: "Manage Coupons",
  canViewFinancials: "View Financials",
  canManagePaymentSettings: "Manage Payment Settings",
  canManageRazorpay: "Manage Razorpay Integration",
  canManageStripe: "Manage Stripe Integration",
  canAccessSettings: "Access Settings",
  canManageStoreSettings: "Manage Store Settings",
  canManageSystemSettings: "Manage System Settings",
  canBackupDatabase: "Backup Database",
};

export default function ManageAdminsPage() {
  const authContext = useContext(AuthContext);

  const { data: apiUser, isLoading: apiLoading } = useQuery<User | null>({
    queryKey: ["/api/user"],
    queryFn: async () => {
      const res = await fetch("/api/user", {
        credentials: "include",
      });

      if (!res.ok) {
        if (res.status === 401) return null;
        throw new Error("Failed to fetch user");
      }

      return res.json();
    },
    staleTime: 60000,
  });

  const user = authContext?.user || apiUser;
  const authLoading = authContext ? authContext.isLoading : apiLoading;

  const { toast } = useToast();
  const {
    coAdmins,
    isLoading: coAdminsLoading,
    createCoAdmin,
    isCreating,
    updatePermissions,
    isUpdating,
    deleteCoAdmin,
    isDeleting,
  } = useCoAdmins();

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedCoAdmin, setSelectedCoAdmin] = useState<User | null>(null);
  const [editPermissions, setEditPermissions] = useState<CoAdminPermissions>({
    canAccessDashboard: true,
    canCreateProducts: false,
    canEditProducts: false,
    canDeleteProducts: false,
    canApproveProducts: false,
    canManageProductDisplay: false,
    canCreateCategories: false,
    canEditCategories: false,
    canDeleteCategories: false,
    canManageSubcategories: false,
    canManageBanners: false,
    canDesignHero: false,
    canManageFooter: false,
    canManageDocumentTemplates: false,
    canManageMediaLibrary: false,
    canViewSales: true,
    canViewReports: true,
    canExportReports: false,
    canManageAnalytics: false,
    canManageSellers: false,
    canApproveSellers: false,
    canManageSellerAgreements: false,
    canViewOrders: false,
    canManageOrders: false,
    canProcessRefunds: false,
    canViewUsers: false,
    canCreateUsers: false,
    canManageCustomers: false,
    canManageAdmins: false,
    canAccessShippingSettings: false,
    canManageShippingGeneral: false,
    canManageShiprocket: false,
    canViewShipmentDashboard: false,
    canManagePendingShipments: false,
    canManageShippingRates: false,
    canManageTrackingInfo: false,
    canAccessWalletDashboard: false,
    canManageWalletSettings: false,
    canViewTransactions: false,
    canManageRewards: false,
    canManageGiftCards: false,
    canManageGST: false,
    canSetTaxRates: false,
    canManageGSTReports: false,
    canManagePromotions: false,
    canManageCoupons: false,
    canViewFinancials: false,
    canManagePaymentSettings: false,
    canManageRazorpay: false,
    canManageStripe: false,
    canAccessSettings: false,
    canManageStoreSettings: false,
    canManageSystemSettings: false,
    canBackupDatabase: false,
  });

  useEffect(() => {
    console.log("User data:", user);
    if (user && user.role !== "admin") {
      console.log("Redirecting to home page");
      window.location.href = "/";
    }
  }, [user]);

  const form = useForm<z.infer<typeof createCoAdminSchema>>({
    resolver: zodResolver(createCoAdminSchema),
    defaultValues: {
      username: "",
      email: "",
      permissions: {
        canAccessDashboard: true,
        canCreateProducts: false,
        canEditProducts: false,
        canDeleteProducts: false,
        canApproveProducts: false,
        canManageProductDisplay: false,
        canCreateCategories: false,
        canEditCategories: false,
        canDeleteCategories: false,
        canManageSubcategories: false,
        canManageBanners: false,
        canDesignHero: false,
        canManageFooter: false,
        canManageDocumentTemplates: false,
        canManageMediaLibrary: false,
        canViewSales: true,
        canViewReports: true,
        canExportReports: false,
        canManageAnalytics: false,
        canManageSellers: false,
        canApproveSellers: false,
        canManageSellerAgreements: false,
        canViewOrders: false,
        canManageOrders: false,
        canProcessRefunds: false,
        canViewUsers: false,
        canCreateUsers: false,
        canManageCustomers: false,
        canManageAdmins: false,
        canAccessShippingSettings: false,
        canManageShippingGeneral: false,
        canManageShiprocket: false,
        canViewShipmentDashboard: false,
        canManagePendingShipments: false,
        canManageShippingRates: false,
        canManageTrackingInfo: false,
        canAccessWalletDashboard: false,
        canManageWalletSettings: false,
        canViewTransactions: false,
        canManageRewards: false,
        canManageGiftCards: false,
        canManageGST: false,
        canSetTaxRates: false,
        canManageGSTReports: false,
        canManagePromotions: false,
        canManageCoupons: false,
        canViewFinancials: false,
        canManagePaymentSettings: false,
        canManageRazorpay: false,
        canManageStripe: false,
        canAccessSettings: false,
        canManageStoreSettings: false,
        canManageSystemSettings: false,
        canBackupDatabase: false,
      },
    },
  });

  const onSubmit = (data: z.infer<typeof createCoAdminSchema>) => {
    createCoAdmin(data as CreateCoAdminData, {
      onSuccess: () => {
        setCreateModalOpen(false);
        form.reset();
      },
    });
  };

  const handleEditCoAdmin = (coAdmin: User) => {
    setSelectedCoAdmin(coAdmin);

    const defaultPermissions: CoAdminPermissions = {
      canAccessDashboard: true,
      canCreateProducts: false,
      canEditProducts: false,
      canDeleteProducts: false,
      canApproveProducts: false,
      canManageProductDisplay: false,
      canCreateCategories: false,
      canEditCategories: false,
      canDeleteCategories: false,
      canManageSubcategories: false,
      canManageBanners: false,
      canDesignHero: false,
      canManageFooter: false,
      canManageDocumentTemplates: false,
      canManageMediaLibrary: false,
      canViewSales: true,
      canViewReports: true,
      canExportReports: false,
      canManageAnalytics: false,
      canManageSellers: false,
      canApproveSellers: false,
      canManageSellerAgreements: false,
      canViewOrders: false,
      canManageOrders: false,
      canProcessRefunds: false,
      canViewUsers: false,
      canCreateUsers: false,
      canManageCustomers: false,
      canManageAdmins: false,
      canAccessShippingSettings: false,
      canManageShippingGeneral: false,
      canManageShiprocket: false,
      canViewShipmentDashboard: false,
      canManagePendingShipments: false,
      canManageShippingRates: false,
      canManageTrackingInfo: false,
      canAccessWalletDashboard: false,
      canManageWalletSettings: false,
      canViewTransactions: false,
      canManageRewards: false,
      canManageGiftCards: false,
      canManageGST: false,
      canSetTaxRates: false,
      canManageGSTReports: false,
      canManagePromotions: false,
      canManageCoupons: false,
      canViewFinancials: false,
      canManagePaymentSettings: false,
      canManageRazorpay: false,
      canManageStripe: false,
      canAccessSettings: false,
      canManageStoreSettings: false,
      canManageSystemSettings: false,
      canBackupDatabase: false,
    };

    const existingPermissions =
      (coAdmin.permissions as CoAdminPermissions) || {};
    const mergedPermissions = { ...defaultPermissions, ...existingPermissions };

    setEditPermissions(mergedPermissions);
    setEditModalOpen(true);
  };

  const handleUpdatePermissions = () => {
    if (selectedCoAdmin) {
      updatePermissions(
        {
          id: selectedCoAdmin.id,
          permissions: editPermissions,
        },
        {
          onSuccess: () => {
            setEditModalOpen(false);
            setSelectedCoAdmin(null);
          },
        }
      );
    }
  };

  const handleDeleteCoAdmin = (id: number) => {
    deleteCoAdmin(id);
  };

  if (!user || user.role !== "admin") {
    return <div>Not authorized</div>;
  }

  return (
    <AdminLayout>
      <div className="container mx-auto px-2 sm:px-4 py-6 sm:py-8">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold">Manage Co-Admins</h1>
          <Dialog open={createModalOpen} onOpenChange={setCreateModalOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2">
                <UserPlus size={18} />
                <span>Create Co-Admin</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-full sm:max-w-3xl w-[95vw]">
              <DialogHeader>
                <DialogTitle>Create New Co-Admin</DialogTitle>
                <DialogDescription>
                  Create a new co-admin account with specific permissions
                </DialogDescription>
              </DialogHeader>

              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="space-y-6"
                >
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-4">
                      <FormField
                        control={form.control}
                        name="username"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Username</FormLabel>
                            <FormControl>
                              <Input placeholder="username" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                              <Input
                                type="email"
                                placeholder="email@example.com"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="text-sm text-muted-foreground mt-2">
                        <p>Co-admin will use email OTP verification to login</p>
                        <p>No password is required</p>
                      </div>
                    </div>

                    <div className="border rounded-md p-4 overflow-y-auto max-h-[500px]">
                      <h3 className="text-lg font-medium mb-3">Permissions</h3>

                      {/* Dashboard */}
                      <div className="mb-4">
                        <h4 className="text-sm font-semibold mb-2 text-primary">
                          Dashboard
                        </h4>
                        <div className="grid grid-cols-1 gap-2 pl-2">
                          {["canAccessDashboard"].map((key) => (
                            <FormField
                              key={key}
                              control={form.control}
                              name={`permissions.${key}`}
                              render={({ field }) => (
                                <FormItem className="flex items-center space-x-2 space-y-0">
                                  <FormControl>
                                    <Checkbox
                                      checked={field.value}
                                      onCheckedChange={field.onChange}
                                    />
                                  </FormControl>
                                  <FormLabel className="text-sm font-normal">
                                    {permissionDisplayNames[key]}
                                  </FormLabel>
                                </FormItem>
                              )}
                            />
                          ))}
                        </div>
                      </div>

                      {/* Product Management */}
                      <div className="mb-4">
                        <h4 className="text-sm font-semibold mb-2 text-primary">
                          Product Management
                        </h4>
                        <div className="grid grid-cols-1 gap-2 pl-2">
                          {[
                            "canCreateProducts",
                            "canEditProducts",
                            "canDeleteProducts",
                            "canApproveProducts",
                            "canManageProductDisplay",
                          ].map((key) => (
                            <FormField
                              key={key}
                              control={form.control}
                              name={`permissions.${key}`}
                              render={({ field }) => (
                                <FormItem className="flex items-center space-x-2 space-y-0">
                                  <FormControl>
                                    <Checkbox
                                      checked={field.value}
                                      onCheckedChange={field.onChange}
                                    />
                                  </FormControl>
                                  <FormLabel className="text-sm font-normal">
                                    {permissionDisplayNames[key]}
                                  </FormLabel>
                                </FormItem>
                              )}
                            />
                          ))}
                        </div>
                      </div>

                      {/* Additional permission sections go here */}
                    </div>
                  </div>

                  <DialogFooter>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setCreateModalOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={isCreating}>
                      {isCreating && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      Create Co-Admin
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Co-Administrators</CardTitle>
            <CardDescription>
              Manage co-admin accounts and their permissions
            </CardDescription>
          </CardHeader>
          <CardContent>
            {authLoading || coAdminsLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : !coAdmins || coAdmins.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Shield className="h-12 w-12 mx-auto mb-3 opacity-20" />
                <p>No co-admins found</p>
                <p className="text-sm mt-1">
                  Create a co-admin to delegate administration tasks
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table className="min-w-[600px]">
                  <TableHeader>
                    <TableRow>
                      <TableHead>Username</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Permissions</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {coAdmins.map((coAdmin) => (
                      <TableRow key={coAdmin.id}>
                        <TableCell className="font-medium">
                          {coAdmin.username}
                        </TableCell>
                        <TableCell>{coAdmin.email}</TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {coAdmin.permissions &&
                              typeof coAdmin.permissions === "object" &&
                              Object.entries(
                                coAdmin.permissions as Record<string, boolean>
                              )
                                .filter(([_, value]) => Boolean(value))
                                .map(([key, _]) => (
                                  <span
                                    key={key}
                                    className="text-xs bg-muted px-2 py-1 rounded-full"
                                  >
                                    {permissionDisplayNames[key]}
                                  </span>
                                ))}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditCoAdmin(coAdmin)}
                              disabled={isUpdating}
                            >
                              <Edit size={16} className="mr-1" />
                              Edit
                            </Button>

                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  disabled={isDeleting}
                                >
                                  <Trash2 size={16} className="mr-1" />
                                  Delete
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>
                                    Are you sure?
                                  </AlertDialogTitle>
                                  <AlertDialogDescription>
                                    This action cannot be undone. This will
                                    permanently delete the co-admin account.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() =>
                                      handleDeleteCoAdmin(coAdmin.id)
                                    }
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  >
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Edit Permissions Dialog */}
        <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
          <DialogContent className="max-w-full sm:max-w-md w-[95vw]">
            <DialogHeader>
              <DialogTitle>Edit Co-Admin Permissions</DialogTitle>
              <DialogDescription>
                {selectedCoAdmin &&
                  `Update permissions for ${selectedCoAdmin.username}`}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 my-4">
              <div className="border rounded-md p-4 overflow-y-auto max-h-[400px]">
                <h3 className="text-lg font-medium mb-3">Permissions</h3>

                {/* Product Management */}
                <div className="mb-4">
                  <h4 className="text-sm font-semibold mb-2 text-primary">
                    Product Management
                  </h4>
                  <div className="grid grid-cols-1 gap-2 pl-2">
                    {[
                      "canCreateProducts",
                      "canEditProducts",
                      "canDeleteProducts",
                      "canApproveProducts",
                    ].map((key) => (
                      <div
                        key={key}
                        className="flex justify-between items-center"
                      >
                        <Label htmlFor={`edit-${key}`} className="text-sm">
                          {permissionDisplayNames[key]}
                        </Label>
                        <Switch
                          id={`edit-${key}`}
                          checked={
                            editPermissions[key as keyof CoAdminPermissions] ||
                            false
                          }
                          onCheckedChange={(checked) => {
                            setEditPermissions({
                              ...editPermissions,
                              [key]: checked,
                            });
                          }}
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Additional permission sections go here */}
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setEditModalOpen(false);
                  setSelectedCoAdmin(null);
                }}
              >
                Cancel
              </Button>
              <Button onClick={handleUpdatePermissions} disabled={isUpdating}>
                {isUpdating && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
