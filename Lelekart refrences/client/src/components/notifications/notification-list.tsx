import { useNotifications } from "@/contexts/notification-context";
import { useAuth } from "@/hooks/use-auth";
import { formatDistanceToNow } from "date-fns";
import { Link, useLocation } from "wouter";
import {
  Trash2,
  CheckSquare,
  ShoppingBag,
  CreditCard,
  Bell,
  CheckCircle2,
  MessageSquare,
  Tag,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { NotificationType } from "@shared/schema";
import { Badge } from "@/components/ui/badge";

// Extend notification type to include metadata
interface NotificationWithMetadata {
  id: number;
  userId?: number;
  title: string;
  message: string;
  type: NotificationType;
  link?: string | null;
  read: boolean;
  createdAt: string;
  metadata?: { [key: string]: any };
}

interface NotificationListProps {
  filter?: "all" | "unread" | "important";
  sellerId?: number;
}

export function NotificationList({
  filter = "all",
  sellerId,
}: NotificationListProps) {
  const { notifications, isLoading, markAsRead, deleteNotification } =
    useNotifications();
  const { user } = useAuth();
  const [, navigate] = useLocation();

  // Cast notifications to NotificationWithMetadata for filtering
  const filteredNotifications = (
    notifications as NotificationWithMetadata[]
  ).filter((notification) => {
    // If sellerId is provided, show all notifications for this seller
    if (sellerId) {
      return notification.userId === sellerId;
    }

    // For buyers, hide ORDER_STATUS notifications only if they are admin notifications
    if (
      user?.role === "buyer" &&
      notification.type === NotificationType.ORDER_STATUS
    ) {
      // Hide if link is for admin
      if (notification.link && notification.link.startsWith("/admin")) {
        return false;
      }
      // Otherwise, show (for buyer)
      return true;
    }

    if (filter === "all") return true;
    if (filter === "unread") return !notification.read;
    if (filter === "important") {
      // Consider ORDER_STATUS, WALLET, and PRODUCT_APPROVAL as important
      return (
        notification.type === NotificationType.ORDER_STATUS ||
        notification.type === NotificationType.WALLET ||
        notification.type === NotificationType.PRODUCT_APPROVAL
      );
    }
    return true;
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-[200px] p-4">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (filteredNotifications.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-6 sm:p-8 text-center">
        <Bell className="h-12 w-12 text-muted-foreground mb-4" />
        <p className="text-muted-foreground mb-2 text-sm sm:text-base">
          {filter === "all"
            ? "No notifications yet"
            : filter === "unread"
              ? "No unread notifications"
              : "No important notifications"}
        </p>
        <p className="text-xs sm:text-sm text-muted-foreground">
          {filter === "all"
            ? "When you receive notifications, they will appear here"
            : filter === "unread"
              ? "All notifications have been read"
              : "You have no important notifications at this time"}
        </p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-gray-100">
      {filteredNotifications.map((notification) => (
        <NotificationItem
          key={notification.id}
          notification={notification}
          onMarkAsRead={markAsRead}
          onDelete={deleteNotification}
          sellerId={sellerId}
        />
      ))}
    </div>
  );
}

interface NotificationItemProps {
  notification: {
    id: number;
    title: string;
    message: string;
    read: boolean;
    type: NotificationType;
    link?: string | null;
    createdAt: string;
  };
  onMarkAsRead: (id: number) => void;
  onDelete: (id: number) => void;
  sellerId?: number;
}

function NotificationItem({
  notification,
  onMarkAsRead,
  onDelete,
  sellerId,
}: NotificationItemProps) {
  const [, navigate] = useLocation();
  const handleClick = () => {
    if (!notification.read) {
      onMarkAsRead(notification.id);
    }
  };

  // Highlight 'Order Placed Successfully' notification
  const isOrderPlacedSuccess =
    notification.type === NotificationType.ORDER_STATUS &&
    notification.title === "Order Placed Successfully";

  const getTypeColor = (type: NotificationType) => {
    if (isOrderPlacedSuccess) return "bg-green-100 text-green-800";
    switch (type) {
      case NotificationType.ORDER_STATUS:
        return "bg-blue-100 text-blue-800";
      case NotificationType.WALLET:
        return "bg-green-100 text-green-800";
      case NotificationType.PRODUCT_APPROVAL:
        return "bg-purple-100 text-purple-800";
      case NotificationType.PRICE_DROP:
        return "bg-orange-100 text-orange-800";
      case NotificationType.NEW_MESSAGE:
        return "bg-yellow-100 text-yellow-800";
      case NotificationType.SYSTEM:
      default:
        return "bg-red-100 text-red-800";
    }
  };

  const getTypeLabel = (type: NotificationType) => {
    if (isOrderPlacedSuccess) return "Order Placed";
    switch (type) {
      case NotificationType.ORDER_STATUS:
        return "Order";
      case NotificationType.WALLET:
        return "Wallet";
      case NotificationType.PRODUCT_APPROVAL:
        return "Product";
      case NotificationType.PRICE_DROP:
        return "Price Alert";
      case NotificationType.NEW_MESSAGE:
        return "Message";
      case NotificationType.SYSTEM:
      default:
        return "System";
    }
  };

  const getTypeIcon = (type: NotificationType) => {
    if (isOrderPlacedSuccess)
      return <CheckCircle2 className="h-4 w-4 text-green-600" />;
    switch (type) {
      case NotificationType.ORDER_STATUS:
        return <ShoppingBag className="h-4 w-4 text-blue-600" />;
      case NotificationType.WALLET:
        return <CreditCard className="h-4 w-4 text-green-600" />;
      case NotificationType.PRODUCT_APPROVAL:
        return <CheckCircle2 className="h-4 w-4 text-purple-600" />;
      case NotificationType.PRICE_DROP:
        return <Tag className="h-4 w-4 text-orange-600" />;
      case NotificationType.NEW_MESSAGE:
        return <MessageSquare className="h-4 w-4 text-yellow-600" />;
      case NotificationType.SYSTEM:
      default:
        return <Bell className="h-4 w-4 text-red-600" />;
    }
  };

  const getTypeIconBackground = (type: NotificationType) => {
    if (isOrderPlacedSuccess) return "bg-green-100";
    switch (type) {
      case NotificationType.ORDER_STATUS:
        return "bg-blue-100";
      case NotificationType.WALLET:
        return "bg-green-100";
      case NotificationType.PRODUCT_APPROVAL:
        return "bg-purple-100";
      case NotificationType.PRICE_DROP:
        return "bg-orange-100";
      case NotificationType.NEW_MESSAGE:
        return "bg-yellow-100";
      case NotificationType.SYSTEM:
      default:
        return "bg-red-100";
    }
  };

  const NotificationContent = () => (
    <div className="flex-1 min-w-0">
      <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
        <h5 className="font-semibold text-gray-900 text-sm sm:text-base line-clamp-2">
          {notification.title}
        </h5>
        <div className="flex items-center gap-2">
          <Badge
            variant="outline"
            className={`text-[10px] px-1.5 py-0.5 rounded-full ${getTypeColor(notification.type)}`}
          >
            {getTypeLabel(notification.type)}
          </Badge>
          {!notification.read && (
            <div className="w-2 h-2 rounded-full bg-blue-600 flex-shrink-0"></div>
          )}
        </div>
      </div>
      <div className="space-y-2">
        <p className="text-sm text-gray-700 line-clamp-3">
          {notification.message}
        </p>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <p className="text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(notification.createdAt), {
              addSuffix: true,
            })}
          </p>
          {/* For seller notifications, always go to /seller/orders */}
          {sellerId ? (
            <button
              className="text-xs text-primary font-medium underline hover:no-underline self-start sm:self-auto"
              onClick={() => navigate("/seller/orders")}
            >
              View Details
            </button>
          ) : notification.link && notification.link.startsWith("/admin/") ? (
            <button
              className="text-xs text-primary font-medium underline hover:no-underline self-start sm:self-auto"
              onClick={() => {
                const match = (
                  notification.link
                    ? notification.link.replace(
                        "/admin/roders/",
                        "/admin/orders/"
                      )
                    : ""
                ).match(/\/admin\/orders\/(\d+)/);
                if (match && match[1]) {
                  navigate(`/admin/orders?viewOrder=${match[1]}`);
                } else {
                  navigate("/admin/orders");
                }
              }}
            >
              View Details
            </button>
          ) : notification.link ? (
            <Link
              to={
                notification.link
                  ? notification.link.replace(
                      "/admin/roders/",
                      "/admin/orders/"
                    )
                  : ""
              }
              className="text-xs text-primary font-medium underline hover:no-underline self-start sm:self-auto"
            >
              View Details
            </Link>
          ) : null}
        </div>
      </div>
    </div>
  );

  return (
    <div
      className={`flex flex-col sm:flex-row items-start gap-3 p-4 sm:p-6 hover:bg-muted/50 transition-colors ${!notification.read ? "bg-blue-50" : ""}`}
    >
      {/* Notification icon based on type */}
      <div
        className={`flex-shrink-0 rounded-full p-2 sm:p-3 mt-1 ${getTypeIconBackground(notification.type)}`}
      >
        {getTypeIcon(notification.type)}
      </div>
      <NotificationContent />
      <div className="flex flex-col gap-2 ml-2">
        {!notification.read && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 sm:h-7 sm:w-7"
            onClick={() => onMarkAsRead(notification.id)}
            title="Mark as read"
          >
            <CheckSquare className="h-4 w-4" />
          </Button>
        )}
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 sm:h-7 sm:w-7 text-muted-foreground hover:text-destructive"
          onClick={() => onDelete(notification.id)}
          title="Delete notification"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
