import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AdminLayout } from "@/components/layout/admin-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { apiRequest } from "@/lib/queryClient";
import {
  Loader2,
  CheckCircle,
  XCircle,
  User,
  Mail,
  Phone,
  MapPin,
  Building,
  FileText,
  Calendar,
  Eye,
  MessageSquare,
  Tag,
  UserPlus,
  FileText as FileTextIcon,
  Search,
  Filter,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Type for auth-based sellers (existing system)
type AuthSeller = {
  id: number;
  name: string;
  email: string;
  phone?: string;
  username: string;
  role: string;
  approved: boolean;
  rejected: boolean;
  created_at: string;
  updated_at: string;
  source: "auth"; // Tag to identify source
};

// Type for registration-based seller applications (new system)
type SellerApplication = {
  id: number;
  email: string;
  phone: string;
  business_name: string;
  business_address: string;
  business_state: string;
  business_city: string;
  business_pincode: string;
  business_type: string;
  company_registration_number?: string;
  gst_number?: string;
  pan_number?: string;
  bank_name: string;
  bank_state: string;
  bank_city: string;
  bank_pincode: string;
  account_number: string;
  ifsc_code: string;
  government_id_type: string;
  government_id_number: string;
  government_id_photo: string;
  status: "pending" | "approved" | "rejected";
  admin_notes?: string;
  reviewed_by?: number;
  reviewed_by_name?: string;
  reviewed_at?: string;
  created_at: string;
  updated_at: string;
  source: "registration"; // Tag to identify source
};

// Combined type for display
type SellerItem = AuthSeller | SellerApplication;

export default function SellerApprovalPage() {
  const [selectedTab, setSelectedTab] = useState("pending");
  const [selectedItem, setSelectedItem] = useState<SellerItem | null>(null);
  const [adminNotes, setAdminNotes] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [sourceFilter, setSourceFilter] = useState<
    "all" | "auth" | "registration"
  >("all");
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch auth-based sellers statistics
  const { data: authStats = { pending: 0, approved: 0, rejected: 0 } } =
    useQuery({
      queryKey: ["/api/sellers/stats"],
      queryFn: async () => {
        const [pending, approved, rejected] = await Promise.all([
          apiRequest("GET", "/api/sellers/pending").then((res) => res.json()),
          apiRequest("GET", "/api/sellers/approved").then((res) => res.json()),
          apiRequest("GET", "/api/sellers/rejected").then((res) => res.json()),
        ]);
        return {
          pending: pending.length,
          approved: approved.length,
          rejected: rejected.length,
        };
      },
    });

  // Fetch registration-based applications statistics
  const { data: registrationStats = { pending: 0, approved: 0, rejected: 0 } } =
    useQuery({
      queryKey: ["/api/admin/seller-applications/stats"],
      queryFn: async () => {
        const res = await apiRequest(
          "GET",
          "/api/admin/seller-applications/stats"
        );
        return res.json();
      },
    });

  // Combined statistics
  const totalStats = {
    pending: authStats.pending + registrationStats.pending,
    approved: authStats.approved + registrationStats.approved,
    rejected: authStats.rejected + registrationStats.rejected,
    total:
      authStats.pending +
      authStats.approved +
      authStats.rejected +
      registrationStats.pending +
      registrationStats.approved +
      registrationStats.rejected,
  };

  // Fetch pending items (both auth sellers and registration applications)
  const { data: pendingItems = [], isLoading: isPendingLoading } = useQuery<
    SellerItem[]
  >({
    queryKey: ["seller-approval", "pending"],
    queryFn: async () => {
      const [authSellers, registrationApps] = await Promise.all([
        apiRequest("GET", "/api/sellers/pending").then((res) => res.json()),
        apiRequest("GET", "/api/admin/seller-applications?status=pending").then(
          (res) => res.json()
        ),
      ]);

      // Add source tags
      const authSellersWithTag = authSellers.map((seller: AuthSeller) => ({
        ...seller,
        source: "auth",
      }));
      const registrationAppsWithTag = registrationApps.map(
        (app: SellerApplication) => ({ ...app, source: "registration" })
      );

      return [...authSellersWithTag, ...registrationAppsWithTag];
    },
  });

  // Fetch approved items
  const { data: approvedItems = [], isLoading: isApprovedLoading } = useQuery<
    SellerItem[]
  >({
    queryKey: ["seller-approval", "approved"],
    queryFn: async () => {
      const [authSellers, registrationApps] = await Promise.all([
        apiRequest("GET", "/api/sellers/approved").then((res) => res.json()),
        apiRequest(
          "GET",
          "/api/admin/seller-applications?status=approved"
        ).then((res) => res.json()),
      ]);

      const authSellersWithTag = authSellers.map((seller: AuthSeller) => ({
        ...seller,
        source: "auth",
      }));
      const registrationAppsWithTag = registrationApps.map(
        (app: SellerApplication) => ({ ...app, source: "registration" })
      );

      return [...authSellersWithTag, ...registrationAppsWithTag];
    },
  });

  // Fetch rejected items
  const { data: rejectedItems = [], isLoading: isRejectedLoading } = useQuery<
    SellerItem[]
  >({
    queryKey: ["seller-approval", "rejected"],
    queryFn: async () => {
      const [authSellers, registrationApps] = await Promise.all([
        apiRequest("GET", "/api/sellers/rejected").then((res) => res.json()),
        apiRequest(
          "GET",
          "/api/admin/seller-applications?status=rejected"
        ).then((res) => res.json()),
      ]);

      const authSellersWithTag = authSellers.map((seller: AuthSeller) => ({
        ...seller,
        source: "auth",
      }));
      const registrationAppsWithTag = registrationApps.map(
        (app: SellerApplication) => ({ ...app, source: "registration" })
      );

      return [...authSellersWithTag, ...registrationAppsWithTag];
    },
  });

  // Combine loading states
  const isLoading = isPendingLoading || isApprovedLoading || isRejectedLoading;

  // Auth seller approval mutation
  const approveAuthSellerMutation = useMutation({
    mutationFn: async ({ sellerId }: { sellerId: number }) => {
      const res = await apiRequest("PUT", `/api/sellers/${sellerId}/approve`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["seller-approval"] });
      queryClient.invalidateQueries({ queryKey: ["/api/sellers/stats"] });
      toast({
        title: "Seller approved",
        description: "The seller has been approved successfully",
        variant: "success",
      });
      setIsDialogOpen(false);
      setSelectedItem(null);
      setAdminNotes("");
    },
    onError: (error: any) => {
      toast({
        title: "Failed to approve seller",
        description: error.message || "Something went wrong",
        variant: "destructive",
      });
    },
  });

  // Auth seller rejection mutation
  const rejectAuthSellerMutation = useMutation({
    mutationFn: async ({ sellerId }: { sellerId: number }) => {
      const res = await apiRequest("PUT", `/api/sellers/${sellerId}/reject`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["seller-approval"] });
      queryClient.invalidateQueries({ queryKey: ["/api/sellers/stats"] });
      toast({
        title: "Seller rejected",
        description: "The seller has been rejected",
        variant: "success",
      });
      setIsDialogOpen(false);
      setSelectedItem(null);
      setAdminNotes("");
    },
    onError: (error: any) => {
      toast({
        title: "Failed to reject seller",
        description: error.message || "Something went wrong",
        variant: "destructive",
      });
    },
  });

  // Registration application approval mutation
  const approveRegistrationMutation = useMutation({
    mutationFn: async ({
      applicationId,
      notes,
    }: {
      applicationId: number;
      notes: string;
    }) => {
      const res = await apiRequest(
        "PUT",
        `/api/admin/seller-applications/${applicationId}/approve`,
        {
          adminNotes: notes,
        }
      );
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["seller-approval"] });
      queryClient.invalidateQueries({
        queryKey: ["/api/admin/seller-applications/stats"],
      });
      toast({
        title: "Application approved",
        description:
          "The seller application has been approved and user account created",
        variant: "success",
      });
      setIsDialogOpen(false);
      setSelectedItem(null);
      setAdminNotes("");
    },
    onError: (error: any) => {
      toast({
        title: "Failed to approve application",
        description: error.message || "Something went wrong",
        variant: "destructive",
      });
    },
  });

  // Registration application rejection mutation
  const rejectRegistrationMutation = useMutation({
    mutationFn: async ({
      applicationId,
      notes,
    }: {
      applicationId: number;
      notes: string;
    }) => {
      const res = await apiRequest(
        "PUT",
        `/api/admin/seller-applications/${applicationId}/reject`,
        {
          adminNotes: notes,
        }
      );
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["seller-approval"] });
      queryClient.invalidateQueries({
        queryKey: ["/api/admin/seller-applications/stats"],
      });
      toast({
        title: "Application rejected",
        description: "The seller application has been rejected",
        variant: "success",
      });
      setIsDialogOpen(false);
      setSelectedItem(null);
      setAdminNotes("");
    },
    onError: (error: any) => {
      toast({
        title: "Failed to reject application",
        description: error.message || "Something went wrong",
        variant: "destructive",
      });
    },
  });

  const handleViewItem = (item: SellerItem) => {
    setSelectedItem(item);
    if (item.source === "registration") {
      setAdminNotes((item as SellerApplication).admin_notes || "");
    }
    setIsDialogOpen(true);
  };

  const handleApprove = () => {
    if (!selectedItem) return;

    if (selectedItem.source === "auth") {
      approveAuthSellerMutation.mutate({ sellerId: selectedItem.id });
    } else {
      approveRegistrationMutation.mutate({
        applicationId: selectedItem.id,
        notes: adminNotes,
      });
    }
  };

  const handleReject = () => {
    if (!selectedItem) return;

    if (selectedItem.source === "auth") {
      rejectAuthSellerMutation.mutate({ sellerId: selectedItem.id });
    } else {
      rejectRegistrationMutation.mutate({
        applicationId: selectedItem.id,
        notes: adminNotes,
      });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const isPending = (item: SellerItem) => {
    if (item.source === "auth") {
      return !(item as AuthSeller).approved && !(item as AuthSeller).rejected;
    } else {
      return (item as SellerApplication).status === "pending";
    }
  };

  const isApproved = (item: SellerItem) => {
    if (item.source === "auth") {
      return (item as AuthSeller).approved;
    } else {
      return (item as SellerApplication).status === "approved";
    }
  };

  const isRejected = (item: SellerItem) => {
    if (item.source === "auth") {
      return (item as AuthSeller).rejected;
    } else {
      return (item as SellerApplication).status === "rejected";
    }
  };

  // Filter items based on search query and source filter
  const filterItems = (items: SellerItem[]) => {
    return items.filter((item) => {
      // Source filter
      if (sourceFilter !== "all" && item.source !== sourceFilter) {
        return false;
      }

      // Search filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const isAuthSeller = item.source === "auth";
        const authSeller = item as AuthSeller;
        const registrationApp = item as SellerApplication;

        // Search by name/username/business name
        const name = isAuthSeller
          ? (authSeller.name || authSeller.username || "").toLowerCase()
          : registrationApp.business_name.toLowerCase();

        // Search by email
        const email = isAuthSeller
          ? authSeller.email.toLowerCase()
          : registrationApp.email.toLowerCase();

        return name.includes(query) || email.includes(query);
      }

      return true;
    });
  };

  // Apply filters to the data
  const filteredPendingItems = filterItems(pendingItems);
  const filteredApprovedItems = filterItems(approvedItems);
  const filteredRejectedItems = filterItems(rejectedItems);

  return (
    <AdminLayout>
      <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-6">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 mb-6">
          <h1 className="text-xl sm:text-2xl font-bold">
            Seller Approval Management
          </h1>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 w-full sm:w-auto">
            <Badge
              variant="outline"
              className="bg-amber-100 text-amber-800 hover:bg-amber-100"
            >
              {totalStats.pending} Pending
            </Badge>
            <Badge
              variant="outline"
              className="bg-green-100 text-green-800 hover:bg-green-100"
            >
              {totalStats.approved} Approved
            </Badge>
            <Badge
              variant="outline"
              className="bg-red-100 text-red-800 hover:bg-red-100"
            >
              {totalStats.rejected} Rejected
            </Badge>
          </div>
        </div>

        {/* Search and Filter Controls */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select
              value={sourceFilter}
              onValueChange={(value: "all" | "auth" | "registration") =>
                setSourceFilter(value)
              }
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by source" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sources</SelectItem>
                <SelectItem value="auth">Auth Registration</SelectItem>
                <SelectItem value="registration">Registration Page</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Source Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <UserPlus className="h-4 w-4" />
                Auth-Based Sellers
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2 text-sm">
                <Badge variant="outline" className="bg-amber-50 text-amber-700">
                  {authStats.pending} Pending
                </Badge>
                <Badge variant="outline" className="bg-green-50 text-green-700">
                  {authStats.approved} Approved
                </Badge>
                <Badge variant="outline" className="bg-red-50 text-red-700">
                  {authStats.rejected} Rejected
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <FileTextIcon className="h-4 w-4" />
                Registration Applications
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2 text-sm">
                <Badge variant="outline" className="bg-amber-50 text-amber-700">
                  {registrationStats.pending} Pending
                </Badge>
                <Badge variant="outline" className="bg-green-50 text-green-700">
                  {registrationStats.approved} Approved
                </Badge>
                <Badge variant="outline" className="bg-red-50 text-red-700">
                  {registrationStats.rejected} Rejected
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs
          defaultValue="pending"
          value={selectedTab}
          onValueChange={setSelectedTab}
        >
          <TabsList className="mb-6">
            <TabsTrigger value="pending">
              Pending ({filteredPendingItems.length})
            </TabsTrigger>
            <TabsTrigger value="approved">
              Approved ({filteredApprovedItems.length})
            </TabsTrigger>
            <TabsTrigger value="rejected">
              Rejected ({filteredRejectedItems.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="space-y-6">
            {isLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : filteredPendingItems.length === 0 ? (
              <div className="bg-muted rounded-lg p-8 text-center">
                <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium">
                  {pendingItems.length === 0
                    ? "No pending sellers"
                    : "No sellers match your search criteria"}
                </h3>
                <p className="text-muted-foreground mt-1">
                  {pendingItems.length === 0
                    ? "All sellers have been reviewed. Check the approved tab to see approved sellers."
                    : "Try adjusting your search terms or filters."}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6">
                {filteredPendingItems.map((item) => (
                  <SellerCard
                    key={`${item.source}-${item.id}`}
                    item={item}
                    onView={() => handleViewItem(item)}
                    formatDate={formatDate}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="approved" className="space-y-6">
            {isLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : filteredApprovedItems.length === 0 ? (
              <div className="bg-muted rounded-lg p-8 text-center">
                <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium">
                  {approvedItems.length === 0
                    ? "No approved sellers"
                    : "No sellers match your search criteria"}
                </h3>
                <p className="text-muted-foreground mt-1">
                  {approvedItems.length === 0
                    ? "Once you approve sellers, they will appear here."
                    : "Try adjusting your search terms or filters."}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6">
                {filteredApprovedItems.map((item) => (
                  <SellerCard
                    key={`${item.source}-${item.id}`}
                    item={item}
                    onView={() => handleViewItem(item)}
                    formatDate={formatDate}
                    approved={true}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="rejected" className="space-y-6">
            {isLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : filteredRejectedItems.length === 0 ? (
              <div className="bg-muted rounded-lg p-8 text-center">
                <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium">
                  {rejectedItems.length === 0
                    ? "No rejected sellers"
                    : "No sellers match your search criteria"}
                </h3>
                <p className="text-muted-foreground mt-1">
                  {rejectedItems.length === 0
                    ? "Rejected sellers will appear here."
                    : "Try adjusting your search terms or filters."}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6">
                {filteredRejectedItems.map((item) => (
                  <SellerCard
                    key={`${item.source}-${item.id}`}
                    item={item}
                    onView={() => handleViewItem(item)}
                    formatDate={formatDate}
                    rejected={true}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Details Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Building className="h-5 w-5" />
                {selectedItem?.source === "auth"
                  ? "Seller Details"
                  : "Seller Application Details"}
              </DialogTitle>
            </DialogHeader>

            {selectedItem && (
              <div className="space-y-6">
                {/* Source Tag */}
                <div className="flex items-center gap-2">
                  <Badge
                    variant="outline"
                    className={
                      selectedItem.source === "auth"
                        ? "bg-blue-50 text-blue-700"
                        : "bg-purple-50 text-purple-700"
                    }
                  >
                    <Tag className="h-3 w-3 mr-1" />
                    {selectedItem.source === "auth"
                      ? "From Auth Registration"
                      : "From Registration Page"}
                  </Badge>
                </div>

                {selectedItem.source === "auth" ? (
                  <AuthSellerDetails
                    seller={selectedItem as AuthSeller}
                    formatDate={formatDate}
                  />
                ) : (
                  <RegistrationApplicationDetails
                    application={selectedItem as SellerApplication}
                    formatDate={formatDate}
                    adminNotes={adminNotes}
                    setAdminNotes={setAdminNotes}
                  />
                )}

                {/* Action Buttons */}
                {isPending(selectedItem) && (
                  <div className="flex gap-3 pt-4">
                    <Button
                      onClick={handleApprove}
                      disabled={
                        approveAuthSellerMutation.isPending ||
                        rejectAuthSellerMutation.isPending ||
                        approveRegistrationMutation.isPending ||
                        rejectRegistrationMutation.isPending
                      }
                      className="flex-1"
                    >
                      {approveAuthSellerMutation.isPending ||
                      approveRegistrationMutation.isPending ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <CheckCircle className="mr-2 h-4 w-4" />
                      )}
                      Approve{" "}
                      {selectedItem.source === "auth"
                        ? "Seller"
                        : "Application"}
                    </Button>
                    <Button
                      onClick={handleReject}
                      variant="destructive"
                      disabled={
                        approveAuthSellerMutation.isPending ||
                        rejectAuthSellerMutation.isPending ||
                        approveRegistrationMutation.isPending ||
                        rejectRegistrationMutation.isPending
                      }
                      className="flex-1"
                    >
                      {rejectAuthSellerMutation.isPending ||
                      rejectRegistrationMutation.isPending ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <XCircle className="mr-2 h-4 w-4" />
                      )}
                      Reject{" "}
                      {selectedItem.source === "auth"
                        ? "Seller"
                        : "Application"}
                    </Button>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}

// Component for displaying auth-based seller details
function AuthSellerDetails({
  seller,
  formatDate,
}: {
  seller: AuthSeller;
  formatDate: (date: string) => string;
}) {
  return (
    <div className="space-y-6">
      {/* Basic Information */}
      <div>
        <h4 className="font-semibold mb-3 flex items-center gap-2">
          <User className="h-4 w-4" />
          Seller Information
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label className="text-sm font-medium">Name</Label>
            <p className="text-sm text-muted-foreground">{seller.name}</p>
          </div>
          <div>
            <Label className="text-sm font-medium">Username</Label>
            <p className="text-sm text-muted-foreground">{seller.username}</p>
          </div>
          <div>
            <Label className="text-sm font-medium">Email</Label>
            <p className="text-sm text-muted-foreground">{seller.email}</p>
          </div>
          {seller.phone && (
            <div>
              <Label className="text-sm font-medium">Phone</Label>
              <p className="text-sm text-muted-foreground">{seller.phone}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Component for displaying registration application details
function RegistrationApplicationDetails({
  application,
  formatDate,
  adminNotes,
  setAdminNotes,
}: {
  application: SellerApplication;
  formatDate: (date: string) => string;
  adminNotes: string;
  setAdminNotes: (notes: string) => void;
}) {
  return (
    <div className="space-y-6">
      {/* Application Status */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">{application.business_name}</h3>
          <p className="text-sm text-muted-foreground">
            Application ID: #{application.id}
          </p>
        </div>
        <Badge
          variant={
            application.status === "pending"
              ? "outline"
              : application.status === "approved"
                ? "default"
                : "destructive"
          }
          className={
            application.status === "pending"
              ? "bg-amber-100 text-amber-800"
              : ""
          }
        >
          {application.status.charAt(0).toUpperCase() +
            application.status.slice(1)}
        </Badge>
      </div>

      <Separator />

      {/* Contact Information */}
      <div>
        <h4 className="font-semibold mb-3 flex items-center gap-2">
          <User className="h-4 w-4" />
          Contact Information
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label className="text-sm font-medium">Email</Label>
            <p className="text-sm text-muted-foreground">{application.email}</p>
          </div>
          <div>
            <Label className="text-sm font-medium">Phone</Label>
            <p className="text-sm text-muted-foreground">{application.phone}</p>
          </div>
        </div>
      </div>

      {/* Business Information */}
      <div>
        <h4 className="font-semibold mb-3 flex items-center gap-2">
          <Building className="h-4 w-4" />
          Business Information
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label className="text-sm font-medium">Business Name</Label>
            <p className="text-sm text-muted-foreground">
              {application.business_name}
            </p>
          </div>
          <div>
            <Label className="text-sm font-medium">Business Type</Label>
            <p className="text-sm text-muted-foreground capitalize">
              {application.business_type.replace("_", " ")}
            </p>
          </div>
          <div className="md:col-span-2">
            <Label className="text-sm font-medium">Business Address</Label>
            <p className="text-sm text-muted-foreground">
              {application.business_address}
            </p>
          </div>
          <div>
            <Label className="text-sm font-medium">State</Label>
            <p className="text-sm text-muted-foreground">
              {application.business_state}
            </p>
          </div>
          <div>
            <Label className="text-sm font-medium">City</Label>
            <p className="text-sm text-muted-foreground">
              {application.business_city}
            </p>
          </div>
          <div>
            <Label className="text-sm font-medium">Pincode</Label>
            <p className="text-sm text-muted-foreground">
              {application.business_pincode}
            </p>
          </div>
          {application.company_registration_number && (
            <div>
              <Label className="text-sm font-medium">
                Company Registration Number
              </Label>
              <p className="text-sm text-muted-foreground">
                {application.company_registration_number}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Tax Information */}
      {(application.gst_number || application.pan_number) && (
        <div>
          <h4 className="font-semibold mb-3 flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Tax Information
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {application.gst_number && (
              <div>
                <Label className="text-sm font-medium">GST Number</Label>
                <p className="text-sm text-muted-foreground">
                  {application.gst_number}
                </p>
              </div>
            )}
            {application.pan_number && (
              <div>
                <Label className="text-sm font-medium">PAN Number</Label>
                <p className="text-sm text-muted-foreground">
                  {application.pan_number}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Bank Information */}
      <div>
        <h4 className="font-semibold mb-3 flex items-center gap-2">
          <Building className="h-4 w-4" />
          Bank Account Information
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label className="text-sm font-medium">Bank Name</Label>
            <p className="text-sm text-muted-foreground">
              {application.bank_name}
            </p>
          </div>
          <div>
            <Label className="text-sm font-medium">IFSC Code</Label>
            <p className="text-sm text-muted-foreground">
              {application.ifsc_code}
            </p>
          </div>
          <div>
            <Label className="text-sm font-medium">Account Number</Label>
            <p className="text-sm text-muted-foreground">
              {application.account_number}
            </p>
          </div>
          <div>
            <Label className="text-sm font-medium">Bank State</Label>
            <p className="text-sm text-muted-foreground">
              {application.bank_state}
            </p>
          </div>
          <div>
            <Label className="text-sm font-medium">Bank City</Label>
            <p className="text-sm text-muted-foreground">
              {application.bank_city}
            </p>
          </div>
          <div>
            <Label className="text-sm font-medium">Bank Pincode</Label>
            <p className="text-sm text-muted-foreground">
              {application.bank_pincode}
            </p>
          </div>
        </div>
      </div>

      {/* Identity Verification */}
      <div>
        <h4 className="font-semibold mb-3 flex items-center gap-2">
          <FileText className="h-4 w-4" />
          Identity Verification
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label className="text-sm font-medium">ID Type</Label>
            <p className="text-sm text-muted-foreground capitalize">
              {application.government_id_type.replace("_", " ")}
            </p>
          </div>
          <div>
            <Label className="text-sm font-medium">ID Number</Label>
            <p className="text-sm text-muted-foreground">
              {application.government_id_number}
            </p>
          </div>
          <div className="md:col-span-2">
            <Label className="text-sm font-medium">ID Document</Label>
            <a
              href={application.government_id_photo}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline text-sm"
            >
              View uploaded document
            </a>
          </div>
        </div>
      </div>

      {/* Application Timeline */}
      <div>
        <h4 className="font-semibold mb-3 flex items-center gap-2">
          <Calendar className="h-4 w-4" />
          Application Timeline
        </h4>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Submitted:</span>
            <span>{formatDate(application.created_at)}</span>
          </div>
          {application.reviewed_at && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Reviewed:</span>
              <span>{formatDate(application.reviewed_at)}</span>
            </div>
          )}
          {application.reviewed_by_name && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Reviewed by:</span>
              <span>{application.reviewed_by_name}</span>
            </div>
          )}
        </div>
      </div>

      {/* Admin Notes */}
      <div>
        <h4 className="font-semibold mb-3 flex items-center gap-2">
          <MessageSquare className="h-4 w-4" />
          Admin Notes
        </h4>
        <Textarea
          placeholder="Add notes about this application..."
          value={adminNotes}
          onChange={(e) => setAdminNotes(e.target.value)}
          rows={3}
        />
      </div>
    </div>
  );
}

// Component for displaying seller cards
type SellerCardProps = {
  item: SellerItem;
  onView: () => void;
  formatDate: (date: string) => string;
  approved?: boolean;
  rejected?: boolean;
};

function SellerCard({
  item,
  onView,
  formatDate,
  approved = false,
  rejected = false,
}: SellerCardProps) {
  const isAuthSeller = item.source === "auth";
  const authSeller = item as AuthSeller;
  const registrationApp = item as SellerApplication;

  const getDisplayName = () => {
    if (isAuthSeller) {
      return authSeller.name || authSeller.username;
    } else {
      return registrationApp.business_name;
    }
  };

  const getDisplayEmail = () => {
    if (isAuthSeller) {
      return authSeller.email;
    } else {
      return registrationApp.email;
    }
  };

  const getDisplayPhone = () => {
    if (isAuthSeller) {
      return authSeller.phone || "Not provided";
    } else {
      return registrationApp.phone;
    }
  };

  const getStatus = () => {
    if (isAuthSeller) {
      if (authSeller.approved) return "approved";
      if (authSeller.rejected) return "rejected";
      return "pending";
    } else {
      return registrationApp.status;
    }
  };

  const getCreatedDate = () => {
    if (isAuthSeller) {
      return authSeller.created_at;
    } else {
      return registrationApp.created_at;
    }
  };

  const status = getStatus();

  return (
    <Card className="shadow-sm hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex flex-col md:flex-row gap-6">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-3">
              <div className="bg-primary/10 rounded-full p-3">
                {isAuthSeller ? (
                  <User className="h-6 w-6 text-primary" />
                ) : (
                  <Building className="h-6 w-6 text-primary" />
                )}
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold">{getDisplayName()}</h3>
                <p className="text-sm text-muted-foreground">
                  {isAuthSeller
                    ? `User ID: #${item.id}`
                    : `Application ID: #${item.id}`}
                </p>
              </div>
              <div className="flex flex-col items-end gap-2">
                <Badge
                  variant={
                    status === "pending"
                      ? "outline"
                      : status === "approved"
                        ? "default"
                        : "destructive"
                  }
                  className={
                    status === "pending"
                      ? "bg-amber-100 text-amber-800 hover:bg-amber-100"
                      : ""
                  }
                >
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </Badge>
                <Badge
                  variant="outline"
                  className={
                    isAuthSeller
                      ? "bg-blue-50 text-blue-700 text-xs"
                      : "bg-purple-50 text-purple-700 text-xs"
                  }
                >
                  <Tag className="h-3 w-3 mr-1" />
                  {isAuthSeller ? "Auth" : "Registration"}
                </Badge>
              </div>
            </div>

            <Separator className="my-4" />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-start gap-2">
                <Mail className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Email</p>
                  <p className="text-sm text-muted-foreground">
                    {getDisplayEmail()}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <Phone className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Phone</p>
                  <p className="text-sm text-muted-foreground">
                    {getDisplayPhone()}
                  </p>
                </div>
              </div>

              {!isAuthSeller && (
                <>
                  <div className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">Business Location</p>
                      <p className="text-sm text-muted-foreground">
                        {registrationApp.business_city},{" "}
                        {registrationApp.business_state}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2">
                    <Building className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">Business Type</p>
                      <p className="text-sm text-muted-foreground capitalize">
                        {registrationApp.business_type.replace("_", " ")}
                      </p>
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="mt-4 pt-4 border-t">
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>Created: {formatDate(getCreatedDate())}</span>
                {!isAuthSeller && registrationApp.reviewed_at && (
                  <span>
                    Reviewed: {formatDate(registrationApp.reviewed_at)}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3 justify-center">
            <Button
              onClick={onView}
              variant="outline"
              className="flex gap-2 items-center w-40"
            >
              <Eye className="h-4 w-4" />
              View Details
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
