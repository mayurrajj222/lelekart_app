import { NotificationList } from "@/components/notifications/notification-list";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";

export default function AdminNotificationsPage() {
  const [, setLocation] = useLocation();
  return (
    <div className="container mx-auto py-6 px-2 sm:px-4">
      <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-4">
        <Button
          variant="outline"
          onClick={() => setLocation("/admin/dashboard")}
        >
          Back to Dashboard
        </Button>
        <h2 className="text-2xl font-bold">All Notifications</h2>
      </div>
      <NotificationList filter="all" />
    </div>
  );
}
