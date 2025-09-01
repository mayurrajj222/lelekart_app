import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  MessageCircle,
  Send,
  X,
  Loader2,
  Users,
  Clock,
  CheckCircle,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import axiosClient from "@/lib/axiosClient";
import { AdminLayout } from "@/components/layout/admin-layout";

interface ChatMessage {
  id: string;
  sessionId: string;
  senderType: "user" | "admin";
  senderId: string | null;
  senderName: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

interface ChatSession {
  id: string;
  userId: string | null;
  userName: string;
  userEmail: string | null;
  status: "open" | "closed";
  isRead: boolean;
  createdAt: string;
  updatedAt: string;
  closedAt: string | null;
  closedBy: string | null;
}

export default function AdminChatPage() {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [selectedSession, setSelectedSession] = useState<ChatSession | null>(
    null
  );
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [socket, setSocket] = useState<WebSocket | null>(null);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Load chat sessions
  const loadSessions = async () => {
    try {
      const response = await axiosClient.get("/api/chat/admin/sessions");
      setSessions(response.data);

      // Count unread sessions
      const unread = response.data.filter(
        (session: ChatSession) => session.status === "open" && !session.isRead
      ).length;
      setUnreadCount(unread);
    } catch (error) {
      console.error("Error loading sessions:", error);
    }
  };

  // Load unread count
  const loadUnreadCount = async () => {
    try {
      const response = await axiosClient.get("/api/chat/admin/unread-count");
      setUnreadCount(response.data.count);
    } catch (error) {
      console.error("Error loading unread count:", error);
    }
  };

  // Initialize WebSocket connection
  useEffect(() => {
    if (user) {
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const host = window.location.host;
      const wsUrl = `${protocol}//${host}/ws?userId=${user.id}&admin=true`;
      console.log("Admin WebSocket URL:", wsUrl);

      const newSocket = new WebSocket(wsUrl);

      newSocket.onopen = () => {
        console.log("Admin WebSocket connected successfully");
      };

      newSocket.onmessage = (event) => {
        console.log("Admin WebSocket message received:", event.data);
        try {
          const data = JSON.parse(event.data);
          console.log("Parsed WebSocket data:", data);
          if (data.type === "chat_message") {
            // Add message to current session if it matches
            if (
              selectedSession &&
              data.message.sessionId === selectedSession.id
            ) {
              setMessages((prev) => [...prev, data.message]);
            }
            // Reload sessions to update unread status
            loadSessions();
          } else if (data.type === "new_chat_session") {
            // Reload sessions when new chat is created
            loadSessions();
            toast({
              title: "New Chat Request",
              description: `New chat request from ${data.session.userName}`,
            });
          }
        } catch (error) {
          console.error("Error parsing WebSocket message:", error);
        }
      };

      newSocket.onerror = (error) => {
        console.error("Admin WebSocket error:", error);
      };

      newSocket.onclose = () => {
        console.log("Admin WebSocket disconnected");
      };

      setSocket(newSocket);

      return () => {
        console.log("Cleaning up admin WebSocket connection");
        newSocket.close();
      };
    }
  }, [user]);

  useEffect(() => {
    loadSessions();
    const interval = setInterval(loadUnreadCount, 30000); // Check every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const selectSession = async (session: ChatSession) => {
    setSelectedSession(session);
    setIsLoading(true);

    try {
      const response = await axiosClient.get(
        `/api/chat/sessions/${session.id}`
      );
      setMessages(response.data.messages);

      // Mark messages as read
      const unreadMessageIds = response.data.messages
        .filter((msg: ChatMessage) => !msg.isRead && msg.senderType === "user")
        .map((msg: ChatMessage) => msg.id);

      if (unreadMessageIds.length > 0) {
        await axiosClient.post("/api/chat/admin/messages/read", {
          sessionId: session.id,
          messageIds: unreadMessageIds,
        });
      }
    } catch (error) {
      console.error("Error loading session:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedSession) return;

    const messageData = {
      sessionId: selectedSession.id,
      message: newMessage.trim(),
      senderType: "admin" as const,
      senderName: user?.name || "Admin",
      senderId: user?.id || null,
    };

    try {
      const response = await axiosClient.post(
        "/api/chat/messages",
        messageData
      );
      setMessages((prev) => [...prev, response.data]);
      setNewMessage("");
    } catch (error) {
      console.error("Error sending message:", error);
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    }
  };

  const closeSession = async () => {
    if (!selectedSession) return;

    try {
      await axiosClient.post(
        `/api/chat/admin/sessions/${selectedSession.id}/close`,
        {
          closedBy: user?.id || null,
        }
      );

      setSelectedSession((prev) =>
        prev ? { ...prev, status: "closed" } : null
      );
      loadSessions();

      toast({
        title: "Success",
        description: "Chat session closed successfully.",
      });
    } catch (error) {
      console.error("Error closing session:", error);
      toast({
        title: "Error",
        description: "Failed to close session. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString([], {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <AdminLayout>
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Live Chat Management</h1>
          <Badge variant="outline" className="flex items-center gap-1">
            <MessageCircle className="h-4 w-4" />
            {unreadCount} unread
          </Badge>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-200px)]">
          {/* Sessions List */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Chat Sessions
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="space-y-1 max-h-[calc(100vh-300px)] overflow-y-auto">
                {sessions.length === 0 ? (
                  <div className="p-4 text-center text-gray-500">
                    No chat sessions
                  </div>
                ) : (
                  sessions.map((session) => (
                    <div
                      key={session.id}
                      onClick={() => selectSession(session)}
                      className={`p-4 cursor-pointer border-l-4 transition-colors ${
                        selectedSession?.id === session.id
                          ? "bg-blue-50 border-blue-500"
                          : "border-transparent hover:bg-gray-50"
                      } ${!session.isRead && session.status === "open" ? "bg-yellow-50" : ""}`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="font-medium truncate">
                          {session.userName}
                        </div>
                        <div className="flex items-center gap-1">
                          {!session.isRead && session.status === "open" && (
                            <Badge variant="destructive" className="text-xs">
                              New
                            </Badge>
                          )}
                          <Badge
                            variant={
                              session.status === "open"
                                ? "default"
                                : "secondary"
                            }
                          >
                            {session.status}
                          </Badge>
                        </div>
                      </div>
                      <div className="text-sm text-gray-600 truncate">
                        {session.userEmail || "No email"}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {formatDate(session.updatedAt)}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Chat Area */}
          <Card className="lg:col-span-2 flex flex-col">
            {selectedSession ? (
              <>
                <CardHeader className="border-b">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <MessageCircle className="h-5 w-5" />
                        {selectedSession.userName}
                      </CardTitle>
                      <div className="text-sm text-gray-600">
                        {selectedSession.userEmail || "No email provided"}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={
                          selectedSession.status === "open"
                            ? "default"
                            : "secondary"
                        }
                      >
                        {selectedSession.status}
                      </Badge>
                      {selectedSession.status === "open" && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={closeSession}
                        >
                          <X className="h-4 w-4 mr-1" />
                          Close
                        </Button>
                      )}
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="flex-1 flex flex-col p-0">
                  {/* Messages Area */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {isLoading ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin" />
                      </div>
                    ) : messages.length === 0 ? (
                      <div className="text-center text-gray-500 py-8">
                        <MessageCircle className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                        <p>No messages yet</p>
                      </div>
                    ) : (
                      messages.map((message) => (
                        <div
                          key={message.id}
                          className={`flex ${
                            message.senderType === "admin"
                              ? "justify-end"
                              : "justify-start"
                          }`}
                        >
                          <div
                            className={`max-w-[70%] rounded-lg px-4 py-2 ${
                              message.senderType === "admin"
                                ? "bg-blue-600 text-white"
                                : "bg-gray-100 text-gray-900"
                            }`}
                          >
                            <div className="text-sm font-medium mb-1">
                              {message.senderName}
                            </div>
                            <div className="text-sm">{message.message}</div>
                            <div
                              className={`text-xs mt-1 ${
                                message.senderType === "admin"
                                  ? "text-blue-100"
                                  : "text-gray-500"
                              }`}
                            >
                              {formatTime(message.createdAt)}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Input Area */}
                  {selectedSession.status === "open" ? (
                    <div className="border-t p-4">
                      <div className="flex gap-2">
                        <Input
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          onKeyPress={handleKeyPress}
                          placeholder="Type your message..."
                          disabled={isLoading}
                          className="flex-1"
                        />
                        <Button
                          onClick={sendMessage}
                          disabled={isLoading || !newMessage.trim()}
                          size="icon"
                        >
                          <Send className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="border-t p-4 text-center text-gray-500">
                      This chat session has been closed.
                    </div>
                  )}
                </CardContent>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center text-gray-500">
                  <MessageCircle className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>Select a chat session to start messaging</p>
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}
