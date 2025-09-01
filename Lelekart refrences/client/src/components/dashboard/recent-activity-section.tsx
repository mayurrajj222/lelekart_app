import { useQuery, useQueryClient } from "@tanstack/react-query";
import { 
  AlertCircle, 
  CheckCircle, 
  Loader2, 
  ShoppingCart, 
  Tag, 
  UserPlus, 
  XCircle 
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ErrorIndicator } from "./error-indicator";
import { Skeleton } from "@/components/ui/skeleton";

export function RecentActivitySection() {
  const queryClient = useQueryClient();
  
  // Fetch recent activity with improved error handling
  const { 
    data: recentActivity, 
    isLoading: activityLoading, 
    error: activityError,
    isError
  } = useQuery({
    queryKey: ['/api/admin/recent-activity'],
    queryFn: async () => {
      try {
        const res = await fetch('/api/admin/recent-activity', {
          credentials: 'include',
          headers: {
            'Cache-Control': 'no-cache'
          }
        });
        
        if (!res.ok) {
          throw new Error('Failed to fetch recent activity');
        }
        
        const data = await res.json();
        return data;
      } catch (error) {
        console.error('Error fetching recent activity:', error);
        throw error; // Let React Query handle the error
      }
    },
    staleTime: 60000, // 1 minute
    retry: 2,
    retryDelay: 1000,
    // Return a fallback empty array if there's an error
    placeholderData: { activities: [] }
  });
  
  const handleRetry = () => {
    queryClient.invalidateQueries({ queryKey: ['/api/admin/recent-activity'] });
  };
  
  if (activityLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-start p-3 rounded-md border border-gray-200">
            <Skeleton className="h-4 w-4 mr-3 rounded-full" />
            <div className="flex-1">
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
        ))}
      </div>
    );
  }
  
  if (isError) {
    return (
      <ErrorIndicator 
        title="Failed to Load Activity" 
        message="Could not retrieve recent activity information."
        onRetry={handleRetry} 
      />
    );
  }
  
  if (!recentActivity?.activities || recentActivity.activities.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-6 text-center">
        <div className="rounded-full bg-gray-100 p-3 mb-4">
          <AlertCircle className="h-6 w-6 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-medium">No recent activity</h3>
        <p className="text-sm text-muted-foreground mt-1">System activity will appear here</p>
      </div>
    );
  }
  
  // Helper function to determine the icon based on activity type
  const getActivityIcon = (activity: any) => {
    switch (activity.type) {
      case 'order':
        return <ShoppingCart className="h-4 w-4 text-purple-600" />;
      case 'product':
        return activity.status === 'approved' 
          ? <CheckCircle className="h-4 w-4 text-green-600" />
          : <XCircle className="h-4 w-4 text-red-600" />;
      case 'user':
        return <UserPlus className="h-4 w-4 text-blue-600" />;
      default:
        return <Tag className="h-4 w-4 text-gray-600" />;
    }
  };
  
  // Helper function to determine the activity style
  const getActivityStyle = (activity: any) => {
    switch (activity.type) {
      case 'order':
        return 'bg-purple-50 border-purple-200';
      case 'product':
        return activity.status === 'approved' 
          ? 'bg-green-50 border-green-200'
          : 'bg-red-50 border-red-200';
      case 'user':
        return 'bg-blue-50 border-blue-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };
  
  return (
    <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
      {recentActivity.activities.map((activity: any) => (
        <div 
          key={activity.id}
          className={`flex items-start p-3 rounded-md border ${getActivityStyle(activity)}`}
        >
          <div className="mr-3 mt-0.5">
            {getActivityIcon(activity)}
          </div>
          <div className="flex-1">
            <p className="text-sm">{activity.description}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}