import { useEffect, useState, memo } from "react";
import { X } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

// Define user type with impersonation properties
interface ImpersonatedUser {
  id: number;
  username: string;
  role: string;
  isImpersonating: boolean;
}

function ImpersonationBannerComponent() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [shouldRender, setShouldRender] = useState<boolean | null>(null);
  
  // Get current user data including impersonation status
  const { data, isLoading } = useQuery({ 
    queryKey: ["/api/user"],
    staleTime: 10000, // 10 seconds
  });
  
  // Cast user data to our expected type
  const user = data as ImpersonatedUser | undefined;
  
  // Use useEffect to handle state updates based on user data
  useEffect(() => {
    // Only update state if we have user data and it's not loading
    if (!isLoading && user) {
      // Set shouldRender based on the user's impersonation status
      setShouldRender(user.isImpersonating || false);
    }
  }, [isLoading, user]);
  
  // Separate effect to handle cache invalidation when impersonation state changes
  useEffect(() => {
    // Only run this effect if shouldRender is true (meaning we're impersonating)
    // and we have user data
    if (shouldRender && user) {
      console.log('Impersonation active - invalidating product queries for', user.id);
      
      // Invalidate seller-specific queries with correct query key format including the seller ID
      if (user.id) {
        queryClient.invalidateQueries({ 
          queryKey: ['/api/seller/products', user.id],
          exact: false 
        });
        queryClient.invalidateQueries({ 
          queryKey: ['/api/seller/inventory', user.id],
          exact: false 
        });
        queryClient.invalidateQueries({ 
          queryKey: ['/api/seller/orders', user.id],
          exact: false 
        });
      } else {
        // Fallback to general invalidation
        queryClient.invalidateQueries({ queryKey: ['/api/seller/products'] });
        queryClient.invalidateQueries({ queryKey: ['/api/seller/inventory'] });
        queryClient.invalidateQueries({ queryKey: ['/api/seller/orders'] });
      }
    }
  }, [shouldRender, user]);
  
  // Stop impersonation mutation
  const stopImpersonationMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/admin/stop-impersonation");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      toast({
        title: "Impersonation ended",
        description: "You have returned to your admin account.",
      });
      
      // Redirect back to admin dashboard
      setLocation("/admin");
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to end impersonation",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Handle closing the banner / stopping impersonation
  const handleStopImpersonation = () => {
    stopImpersonationMutation.mutate();
  };
  
  // If loading, still determining, or banner should not be shown, don't render anything
  if (isLoading || shouldRender === null || !shouldRender) return null;
  
  return (
    <div className="sticky top-0 left-0 right-0 z-50 flex items-center justify-between px-2 py-1 bg-yellow-500 text-yellow-900 text-xs">
      <div className="flex items-center">
        <span className="font-semibold">
          Impersonating: {user?.username || 'User'} ({user?.role || 'unknown'})
        </span>
        <span className="ml-2 text-xs">
          You are viewing the application as this user
        </span>
      </div>
      <button
        onClick={handleStopImpersonation}
        className="flex items-center px-2 py-0.5 ml-4 text-xs font-medium bg-yellow-600 hover:bg-yellow-700 text-white rounded-md transition-colors"
        disabled={stopImpersonationMutation.isPending}
      >
        {stopImpersonationMutation.isPending ? (
          "Exiting..."
        ) : (
          <>
            Exit Impersonation
            <X className="ml-1 h-3 w-3" />
          </>
        )}
      </button>
    </div>
  );
}

// Memoize the component to prevent unnecessary re-renders
export const ImpersonationBanner = memo(ImpersonationBannerComponent);