import {
  useQuery,
  useMutation,
  QueryClient
} from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { User } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

// Type definitions for permissions
export interface CoAdminPermissions {
  // Dashboard
  canAccessDashboard: boolean;
  
  // Product Management
  canCreateProducts: boolean;
  canEditProducts: boolean;
  canDeleteProducts: boolean;
  canApproveProducts: boolean;
  canManageProductDisplay: boolean;
  
  // Category Management
  canCreateCategories: boolean;
  canEditCategories: boolean;
  canDeleteCategories: boolean;
  canManageSubcategories: boolean;
  
  // Hero Management
  canManageBanners: boolean;
  canDesignHero: boolean;
  
  // Content Management
  canManageFooter: boolean;
  canManageDocumentTemplates: boolean;
  canManageMediaLibrary: boolean;
  
  // Sales & Analytics
  canViewSales: boolean;
  canViewReports: boolean;
  canExportReports: boolean;
  canManageAnalytics: boolean;
  
  // Seller Management
  canManageSellers: boolean;
  canApproveSellers: boolean;
  canManageSellerAgreements: boolean;
  
  // Order Management
  canViewOrders: boolean;
  canManageOrders: boolean;
  canProcessRefunds: boolean;
  
  // User Management
  canViewUsers: boolean;
  canCreateUsers: boolean;
  canManageCustomers: boolean;
  canManageAdmins: boolean;
  
  // Shipping Management
  canAccessShippingSettings: boolean;
  canManageShippingGeneral: boolean;
  canManageShiprocket: boolean;
  canViewShipmentDashboard: boolean;
  canManagePendingShipments: boolean;
  canManageShippingRates: boolean;
  canManageTrackingInfo: boolean;
  
  // Rewards & Gift Cards
  canManageRewards: boolean;
  canManageGiftCards: boolean;
  
  // Wallet Management
  canManageWallet: boolean;
  
  // GST Management
  canManageGST: boolean;
  
  // Marketing & Promotions
  canManagePromotions: boolean;
  canManageCoupons: boolean;
  
  // Financial Management
  canViewFinancials: boolean;
  canManagePaymentSettings: boolean;
  
  // System Settings
  canAccessSettings: boolean;
  canManageStoreSettings: boolean;
}

export interface CreateCoAdminData {
  username: string;
  email: string;
  permissions: CoAdminPermissions;
}

export const useCoAdmins = () => {
  const { toast } = useToast();

  // Fetch all co-admins
  const {
    data: coAdmins,
    isLoading,
    error,
    refetch
  } = useQuery<User[]>({
    queryKey: ["/api/co-admins"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/co-admins");
      return response.json();
    }
  });

  // Create a new co-admin
  const createCoAdminMutation = useMutation({
    mutationFn: async (coAdminData: CreateCoAdminData) => {
      const response = await apiRequest("POST", "/api/co-admins", coAdminData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/co-admins"] });
      toast({
        title: "Success",
        description: "Co-admin created successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to create co-admin: ${error.message}`,
        variant: "destructive",
      });
    }
  });

  // Update co-admin permissions
  const updatePermissionsMutation = useMutation({
    mutationFn: async ({ id, permissions }: { id: number, permissions: CoAdminPermissions }) => {
      const response = await apiRequest("PUT", `/api/co-admins/${id}/permissions`, { permissions });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/co-admins"] });
      toast({
        title: "Success",
        description: "Co-admin permissions updated successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to update permissions: ${error.message}`,
        variant: "destructive",
      });
    }
  });

  // Delete a co-admin
  const deleteCoAdminMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/co-admins/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/co-admins"] });
      toast({
        title: "Success",
        description: "Co-admin deleted successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to delete co-admin: ${error.message}`,
        variant: "destructive",
      });
    }
  });

  return {
    coAdmins,
    isLoading,
    error,
    refetch,
    createCoAdmin: createCoAdminMutation.mutate,
    isCreating: createCoAdminMutation.isPending,
    updatePermissions: updatePermissionsMutation.mutate,
    isUpdating: updatePermissionsMutation.isPending,
    deleteCoAdmin: deleteCoAdminMutation.mutate,
    isDeleting: deleteCoAdminMutation.isPending
  };
};