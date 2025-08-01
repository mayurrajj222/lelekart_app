import { Loader2 } from "lucide-react";
import { Redirect, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { AuthContext, AuthProvider } from "@/hooks/use-auth";
import { CartProvider } from "@/context/cart-context";
import { useContext } from "react";

interface ProtectedRouteProps {
  path: string;
  component: React.ComponentType;
  role?: string;
}

export function ProtectedRoute({
  path,
  component: Component,
  role
}: ProtectedRouteProps) {
  // Try to use AuthContext first
  const authContext = useContext(AuthContext);
  
  // Fallback to direct API call if context is not available
  const { data: user, isLoading } = useQuery({
    queryKey: ['/api/user'],
    queryFn: async () => {
      console.log("ProtectedRoute: Fetching user data");
      const res = await fetch('/api/user', {
        credentials: 'include',
      });
      
      if (!res.ok) {
        if (res.status === 401) {
          console.log("ProtectedRoute: User not authenticated (401)");
          return null;
        }
        console.error("ProtectedRoute: Failed to fetch user", res.status);
        throw new Error('Failed to fetch user');
      }
      
      const userData = await res.json();
      console.log("ProtectedRoute: User authenticated", userData.role);
      return userData;
    },
    staleTime: 60000, // 1 minute
  });
  
  // Use context user if available, otherwise use query user
  const currentUser = authContext?.user || user;
  const isCurrentlyLoading = authContext ? authContext.isLoading : isLoading;
  
  // Use the path parameter from props for logging
  const pathForLogging = path || "unknown";
  console.log("ProtectedRoute for path:", pathForLogging, "role required:", role, "user role:", currentUser?.role);
  
  if (isCurrentlyLoading) {
    console.log("ProtectedRoute: Loading user data...");
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!currentUser) {
    console.log("ProtectedRoute: No user found, redirecting to /auth");
    return <Redirect to="/auth" />;
  }

  // Check if user has the required role
  if (role && currentUser.role !== role) {
    // Special case: Allow admins to access seller routes
    if (currentUser.role === 'admin' && role === 'seller') {
      console.log("ProtectedRoute: Admin accessing seller route");
      // Admin can access seller routes
    } else {
      // If there's a role mismatch, redirect to their own dashboard
      const dashboardPath = 
        currentUser.role === 'admin' ? '/admin' : // Changed from /admin/dashboard to /admin
        currentUser.role === 'seller' ? '/seller/dashboard' : 
        currentUser.role === 'buyer' ? '/buyer/dashboard' : '/';
      
      console.log(`ProtectedRoute: Role mismatch (required: ${role}, actual: ${currentUser.role}), redirecting to ${dashboardPath}`);
      return <Redirect to={dashboardPath} />;
    }
  }

  // Return the component directly as each layout now handles its own providers
  return <Component />;
}
