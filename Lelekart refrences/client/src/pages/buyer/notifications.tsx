import { NotificationList } from "@/components/notifications/notification-list";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { useNotifications } from "@/contexts/notification-context";

export default function BuyerNotificationsPage() {
  const [, setLocation] = useLocation();
  const { markAllAsRead } = useNotifications();
  return (
    <div className="min-h-screen bg-[#F8F5E4]">
      <div className="container mx-auto py-6 px-4">
        <div className="flex items-center gap-2 mb-4">
          <Button
            variant="outline"
            onClick={() => setLocation("/buyer/dashboard")}
          >
            Back to Dashboard
          </Button>
          <Button variant="ghost" onClick={markAllAsRead}>
            Mark all as read
          </Button>
        </div>
        <h2 className="text-2xl font-bold mb-4">All Notifications</h2>
        <NotificationList filter="all" />
      </div>
    </div>
  );
}
