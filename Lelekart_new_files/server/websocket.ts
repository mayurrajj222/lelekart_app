import { WebSocketServer } from 'ws';
import * as http from 'http';
import WebSocket from 'ws';
import { storage } from './storage';
import { NotificationType, Notification, InsertNotification } from '@shared/schema';

// Notification delivery tracking
interface DeliveryTracker {
  notificationId: number;
  userId: number;
  attempts: number;
  lastAttempt: Date;
  delivered: boolean;
  read: boolean;
}

// Track notification delivery status
const deliveryTracking = new Map<number, DeliveryTracker>();

// Maximum number of delivery attempts
const MAX_DELIVERY_ATTEMPTS = 5;

// Interval (in ms) for retry attempts (30 seconds)
const RETRY_INTERVAL = 30000;

// User connection store - Maps userId to array of WebSocket connections
const userConnections = new Map<number, WebSocket[]>();

export function setupWebSocketServer(server: http.Server) {
  console.log('Setting up WebSocket server for real-time notifications');
  
  const wss = new WebSocketServer({ 
    server, 
    path: '/ws', // Use distinct path to avoid conflict with Vite's HMR WebSocket
    // Set ping interval and timeout to maintain connection health
    clientTracking: true, 
  });
  
  // Set up a server-side ping interval to keep connections alive
  const pingInterval = setInterval(() => {
    wss.clients.forEach((client: WebSocket & { isAlive?: boolean }) => {
      // Skip clients that aren't open
      if (client.readyState !== WebSocket.OPEN) return;
      
      // If client hasn't responded to the last ping, terminate the connection
      if (client.isAlive === false) {
        console.log('Terminating inactive WebSocket connection');
        client.terminate();
        return;
      }
      
      // Mark it as not alive, will be set to true when pong is received
      client.isAlive = false;
      
      try {
        // Send a ping to make sure the connection is still alive
        client.ping();
      } catch (err) {
        console.error('Error sending ping to client:', err);
        // If we can't even send a ping, terminate the connection
        client.terminate();
      }
    });
  }, 50000); // Check connections every 50 seconds
  
  // Make sure to clear interval when server closes
  wss.on('close', () => {
    clearInterval(pingInterval);
  });

  wss.on('connection', (ws: WebSocket & { isAlive?: boolean }, req: http.IncomingMessage) => {
    console.log('New WebSocket connection established');
    
    // Set isAlive flag on the WebSocket object itself so it can be accessed in the ping interval
    ws.isAlive = true;
    
    // Handle pong responses from the client
    ws.on('pong', () => {
      // Mark the connection as alive
      ws.isAlive = true;
      // console.log('Received pong from client'); // Uncomment for debugging
    });
    
    // Extract userId from URL query parameter (/ws?userId=123)
    const url = new URL(req.url || '', `http://${req.headers.host}`);
    const userId = parseInt(url.searchParams.get('userId') || '0');
    
    if (!userId) {
      console.log('WebSocket connection rejected - userId not provided');
      ws.close(4000, 'UserId is required');
      return;
    }
    
    // Store connection
    if (!userConnections.has(userId)) {
      userConnections.set(userId, []);
    }
    userConnections.get(userId)?.push(ws);
    
    console.log(`WebSocket connection associated with userId ${userId}`);
    
    // Send a welcome message
    const welcomeMessage = {
      type: 'connection',
      message: 'Successfully connected to notification service',
      timestamp: new Date().toISOString()
    };
    ws.send(JSON.stringify(welcomeMessage));
    
    // Handle connection close
    ws.on('close', () => {
      console.log(`WebSocket connection for user ${userId} closed`);
      
      // Remove this connection from the user's connection pool
      const connections = userConnections.get(userId);
      if (connections) {
        const index = connections.indexOf(ws);
        if (index !== -1) {
          connections.splice(index, 1);
        }
        
        // If no more connections, remove user from map
        if (connections.length === 0) {
          userConnections.delete(userId);
        }
      }
    });
    
    // Handle incoming messages (e.g., acknowledgements, heartbeats)
    ws.on('message', (message: string) => {
      try {
        const data = JSON.parse(message);
        
        // For heartbeat messages, just respond with pong
        if (data.type === 'ping') {
          // Respond with a pong to maintain the connection
          const pongResponse = {
            type: 'pong',
            timestamp: Date.now()
          };
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify(pongResponse));
          }
          return; // Don't log heartbeats to reduce noise
        }
        
        // Log other non-heartbeat messages
        console.log(`Received message from user ${userId}:`, data);
        
        // Handle specific message types
        if (data.type === 'ack') {
          // Handle notification acknowledgement (mark as read)
          if (data.notificationId) {
            storage.markNotificationAsRead(data.notificationId)
              .then(() => console.log(`Notification ${data.notificationId} marked as read`))
              .catch(err => console.error(`Error marking notification as read:`, err));
          }
        }
      } catch (err) {
        console.error('Error processing websocket message:', err);
      }
    });
    
    // Handle errors
    ws.on('error', (err) => {
      console.error(`WebSocket error for user ${userId}:`, err);
    });
  });
  
  console.log('WebSocket server setup complete');
  
  return wss;
}

/**
 * Send a notification to a specific user
 * This both persists the notification to the database and sends it via WebSocket
 */
export async function sendNotificationToUser(userId: number, notificationData: Omit<InsertNotification, 'userId'>) {
  try {
    // Create the notification in the database
    const notification = await storage.createNotification({
      userId,
      ...notificationData
    });
    
    // Send via WebSocket if user is connected
    const userSockets = userConnections.get(userId);
    if (userSockets && userSockets.length > 0) {
      const message = {
        type: 'notification',
        notification,
        timestamp: new Date().toISOString()
      };
      
      const messageJson = JSON.stringify(message);
      
      // Send to all connections for this user
      userSockets.forEach(socket => {
        if (socket.readyState === WebSocket.OPEN) {
          socket.send(messageJson);
        }
      });
      
      console.log(`Real-time notification sent to user ${userId}`);
    } else {
      console.log(`No active WebSocket connections for user ${userId}, notification persisted only`);
    }
    
    return notification;
  } catch (err) {
    console.error(`Error sending notification to user ${userId}:`, err);
    throw err;
  }
}

/**
 * Broadcast a notification to all connected users
 * Useful for system-wide announcements
 */
export async function broadcastNotification(notification: Omit<InsertNotification, 'userId'>) {
  try {
    const promises: Promise<Notification>[] = [];
    const connectedUserIds = Array.from(userConnections.keys());
    
    console.log(`Broadcasting notification to ${connectedUserIds.length} connected users`);
    
    // Create and send notifications for each connected user
    for (const userId of connectedUserIds) {
      promises.push(sendNotificationToUser(userId, notification));
    }
    
    // Wait for all notifications to be sent
    await Promise.all(promises);
    
    console.log('Broadcast notification completed');
  } catch (err) {
    console.error('Error broadcasting notification:', err);
    throw err;
  }
}