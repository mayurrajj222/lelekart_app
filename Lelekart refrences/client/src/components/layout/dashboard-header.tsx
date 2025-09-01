import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { ShoppingCart } from "lucide-react";
import { NotificationBell } from "@/components/notifications/notification-bell";

interface DashboardHeaderProps {
  userRole: string;
}

export function DashboardHeader({ userRole }: DashboardHeaderProps) {
  const { logoutMutation } = useAuth();
  
  // Different title based on user role
  const dashboardTitle = 
    userRole === 'admin' ? "Admin Dashboard" :
    userRole === 'seller' ? "Seller Dashboard" : 
    "Buyer Dashboard";
  
  return (
    <header className="bg-primary text-white py-4">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center">
          <div className="text-2xl font-bold">{dashboardTitle}</div>
          <div className="flex items-center gap-3">
            <Button 
              variant="outline" 
              className="bg-transparent text-white hover:bg-primary-foreground/10 border-2 border-white font-medium flex items-center gap-2"
              asChild
            >
              <Link to="/">
                <ShoppingCart className="h-4 w-4" />
                Go Shopping
              </Link>
            </Button>
            {/* Notification Bell for buyers */}
            {userRole === 'buyer' && (
              <NotificationBell 
                className="bg-transparent text-white hover:bg-primary-foreground/10 border-2 border-white font-medium flex items-center gap-2"
                iconClassName="text-white"
                badgeClassName="bg-red-600 text-white"
                onClick={() => window.location.href = '/buyer/notifications'}
              />
            )}
            <Button 
              variant="secondary" 
              className="bg-white text-primary hover:bg-gray-100 border-2 border-white font-medium flex items-center gap-2 shadow-sm"
              onClick={() => logoutMutation.mutate()}
            >
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                width="18" 
                height="18" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              >
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                <polyline points="16 17 21 12 16 7"></polyline>
                <line x1="21" y1="12" x2="9" y2="12"></line>
              </svg>
              Logout
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}