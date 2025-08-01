import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { NotificationType } from '@shared/schema';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface Notification {
  id: number;
  userId: number;
  title: string;
  message: string;
  type: NotificationType;
  link?: string | null;
  read: boolean;
  createdAt: string;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  refetchNotifications: () => void;
  refetchUnreadCount: () => void;
  markAsRead: (id: number) => void;
  markAllAsRead: () => void;
  deleteNotification: (id: number) => void;
  deleteAllNotifications: () => void;
  socket: WebSocket | null;
}

const NotificationContext = createContext<NotificationContextType | null>(null);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  
  // Get notifications
  const { 
    data: notificationsData, 
    isLoading: isLoadingNotifications,
    refetch: refetchNotifications
  } = useQuery<{ notifications: Notification[], total: number, page: number, limit: number }>({
    queryKey: ['/api/notifications'],
    enabled: !!user,
  });
  
  // Get unread count
  const { 
    data: unreadCountData, 
    refetch: refetchUnreadCount
  } = useQuery<{ count: number }>({
    queryKey: ['/api/notifications/unread/count'],
    enabled: !!user,
  });
  
  // Mark as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/notifications/${id}/read`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error marking notification as read');
      }
      
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
      queryClient.invalidateQueries({ queryKey: ['/api/notifications/unread/count'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to mark notification as read',
        variant: 'destructive',
      });
    },
  });
  
  // Mark all as read mutation
  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/notifications/read/all', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error marking all notifications as read');
      }
      
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
      queryClient.invalidateQueries({ queryKey: ['/api/notifications/unread/count'] });
      toast({
        title: 'Success',
        description: 'All notifications marked as read',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to mark all notifications as read',
        variant: 'destructive',
      });
    },
  });
  
  // Delete notification mutation
  const deleteNotificationMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/notifications/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error deleting notification');
      }
      
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
      queryClient.invalidateQueries({ queryKey: ['/api/notifications/unread/count'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete notification',
        variant: 'destructive',
      });
    },
  });
  
  // Delete all notifications mutation
  const deleteAllNotificationsMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/notifications', {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error deleting all notifications');
      }
      
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
      queryClient.invalidateQueries({ queryKey: ['/api/notifications/unread/count'] });
      toast({
        title: 'Success',
        description: 'All notifications deleted',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete all notifications',
        variant: 'destructive',
      });
    },
  });
  
  // Setup WebSocket connection with reconnection support and heartbeat
  useEffect(() => {
    if (!user) return;
    
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    let heartbeatTimer: ReturnType<typeof setTimeout> | null = null;
    const maxReconnectDelay = 30000; // Max reconnect delay (30 seconds)
    const heartbeatInterval = 20000; // Send heartbeat every 20 seconds
    let reconnectAttempts = 0;
    let currentSocket: WebSocket | null = null;
    
    // Function to send heartbeat to keep connection alive
    const sendHeartbeat = () => {
      if (currentSocket && currentSocket.readyState === WebSocket.OPEN) {
        try {
          // Send a simple ping message to keep the connection alive
          currentSocket.send(JSON.stringify({ type: 'ping', timestamp: Date.now() }));
          console.log('WebSocket heartbeat sent');
        } catch (error) {
          console.warn('Failed to send WebSocket heartbeat:', error);
          // If sending fails, close the socket to trigger reconnection
          if (currentSocket) {
            currentSocket.close();
          }
        }
      }
    };

    // Schedule regular heartbeats
    const startHeartbeat = () => {
      if (heartbeatTimer) {
        clearInterval(heartbeatTimer);
      }
      
      // Send a heartbeat immediately
      sendHeartbeat();
      
      // Then send them at regular intervals
      heartbeatTimer = setInterval(sendHeartbeat, heartbeatInterval);
    };

    // Stop the heartbeat
    const stopHeartbeat = () => {
      if (heartbeatTimer) {
        clearInterval(heartbeatTimer);
        heartbeatTimer = null;
      }
    };
    
    // Function to connect to WebSocket with proper error handling
    const connectWebSocket = () => {
      try {
        // Clean up any existing socket before creating a new one
        if (currentSocket) {
          stopHeartbeat();
          try {
            currentSocket.close();
          } catch (e) {
            // Ignore errors when closing an already closed socket
          }
          currentSocket = null;
        }

        // Get protocol and hostname - ensure we only use relative paths with hostname
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const host = window.location.host;
        
        // Only create connection if we have a valid host
        if (!host) {
          console.warn('Cannot connect WebSocket: Invalid host');
          return;
        }
        
        // Make sure user ID exists
        if (!user || !user.id) {
          console.warn('Cannot connect WebSocket: User ID is missing');
          return;
        }
        
        // Create proper WebSocket URL with the same hostname but ws/wss protocol
        // For Replit deployments, we use the domain directly without any port specification
        const wsUrl = `${protocol}//${host}/ws?userId=${user.id}`;
        console.log(`Connecting to WebSocket at: ${wsUrl}`);
        
        // Use try/catch with specific error handling for WebSocket construction
        try {
          const newSocket = new WebSocket(wsUrl);
          currentSocket = newSocket;
          
          newSocket.onopen = () => {
            // Reset reconnect attempts on successful connection
            reconnectAttempts = 0;
            console.log('WebSocket connected successfully');
            
            // Start sending heartbeats to keep the connection alive
            startHeartbeat();
            
            // Set the socket in state for other components
            setSocket(newSocket);
          };
          
          newSocket.onmessage = (event) => {
            try {
              const data = JSON.parse(event.data);
              
              if (data.type === 'pong') {
                // Heartbeat response, just log it
                console.log('WebSocket heartbeat acknowledged');
              } else if (data.type === 'notification') {
                // Handle new notification
                // Add to notifications state instantly
                setNotifications((prev) => [data.notification, ...prev]);
                setUnreadCount((prev) => prev + 1);
                // Also invalidate queries for consistency
                queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
                queryClient.invalidateQueries({ queryKey: ['/api/notifications/unread/count'] });
                // Show toast for new notification
                toast({
                  title: data.notification.title,
                  description: data.notification.message,
                });
              }
            } catch (error) {
              // Error parsing WebSocket message, quietly fail
              console.warn('Error parsing WebSocket message:', error);
            }
          };
          
          newSocket.onerror = (event) => {
            // Log error but don't display to user
            console.warn('WebSocket connection error:', event);
            // On error, we'll let the onclose handler manage reconnection
          };
          
          newSocket.onclose = (event) => {
            // Log more details about the closure
            console.log(`WebSocket closed. Code: ${event.code}, Reason: ${event.reason || 'No reason provided'}`);
            
            // Stop heartbeats since the connection is closed
            stopHeartbeat();
            
            // Clear the socket reference
            if (currentSocket === newSocket) {
              currentSocket = null;
              setSocket(null);
            }
            
            // Don't reconnect on normal closure (code 1000)
            if (event.code === 1000 && event.reason === 'User logged out') {
              console.log('WebSocket closed normally, not reconnecting');
              return;
            }
            
            // Implement exponential backoff for reconnection
            const reconnectDelay = Math.min(
              1000 * Math.pow(2, reconnectAttempts),
              maxReconnectDelay
            );
            
            reconnectAttempts++;
            
            // Clear any existing reconnect timer
            if (reconnectTimer) {
              clearTimeout(reconnectTimer);
            }
            
            // Attempt to reconnect
            reconnectTimer = setTimeout(() => {
              console.log(`Attempting to reconnect WebSocket (attempt ${reconnectAttempts})`);
              connectWebSocket();
            }, reconnectDelay);
          };
        } catch (error) {
          console.error('WebSocket connection setup failed:', error);
          
          // If we fail with a syntax error, let's log more details about the URL
          if (error instanceof SyntaxError) {
            console.error('WebSocket URL syntax error. URL was:', wsUrl);
          }
          
          // Schedule a retry after a delay
          if (reconnectTimer) {
            clearTimeout(reconnectTimer);
          }
          
          reconnectTimer = setTimeout(() => {
            connectWebSocket();
          }, 5000); // Fixed 5-second delay for WebSocket construction errors
        }
      } catch (error) {
        console.warn('Error creating WebSocket connection:', error);
      }
    };
    
    // Initial connection
    connectWebSocket();
    
    // Cleanup on unmount
    return () => {
      stopHeartbeat();
      
      if (currentSocket) {
        try {
          // Use a clean close with a normal closure code
          currentSocket.close(1000, 'User logged out');
        } catch (e) {
          // Ignore errors when closing
        }
      }
      
      if (reconnectTimer) {
        clearTimeout(reconnectTimer);
      }
    };
  }, [user, queryClient, toast]);
  
  // Set notifications from API
  useEffect(() => {
    if (notificationsData && user) {
      // Filter: Only show notifications for this user (should already be the case)
      setNotifications(notificationsData.notifications);
    }
  }, [notificationsData, user]);
  
  // Function to mark notification as read
  const markAsRead = (id: number) => {
    markAsReadMutation.mutate(id);
  };
  
  // Function to mark all notifications as read
  const markAllAsRead = () => {
    markAllAsReadMutation.mutate();
  };
  
  // Function to delete notification
  const deleteNotification = (id: number) => {
    deleteNotificationMutation.mutate(id);
  };
  
  // Function to delete all notifications
  const deleteAllNotifications = () => {
    deleteAllNotificationsMutation.mutate();
  };
  
  return (
    <NotificationContext.Provider
      value={{
        notifications: notifications,
        unreadCount: unreadCount,
        isLoading: isLoadingNotifications,
        refetchNotifications,
        refetchUnreadCount,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        deleteAllNotifications,
        socket,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}