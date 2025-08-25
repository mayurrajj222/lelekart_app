import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { MessageCircle, Send, X, Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import axiosClient from "@/lib/axiosClient";

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

export default function ChatPage() {
  const { user } = useAuth();
  const [session, setSession] = useState<ChatSession | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [showChatForm, setShowChatForm] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [socket, setSocket] = useState<WebSocket | null>(null);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Initialize WebSocket connection
  useEffect(() => {
    if (session && session.status === "open") {
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const host = window.location.host;
      const wsUrl = `${protocol}//${host}/ws?userId=${user?.id || "guest"}&sessionId=${session.id}`;
      console.log("User WebSocket URL:", wsUrl);

      const newSocket = new WebSocket(wsUrl);

      newSocket.onopen = () => {
        console.log("User WebSocket connected successfully");
      };

      newSocket.onmessage = (event) => {
        console.log("User WebSocket message received:", event.data);
        try {
          const data = JSON.parse(event.data);
          console.log("Parsed WebSocket data:", data);
          if (data.type === "chat_message") {
            setMessages((prev) => [...prev, data.message]);
          }
        } catch (error) {
          console.error("Error parsing WebSocket message:", error);
        }
      };

      newSocket.onerror = (error) => {
        console.error("User WebSocket error:", error);
      };

      newSocket.onclose = () => {
        console.log("User WebSocket disconnected");
      };

      setSocket(newSocket);

      return () => {
        console.log("Cleaning up user WebSocket connection");
        newSocket.close();
      };
    }
  }, [session, user]);

  const createChatSession = async () => {
    if (!userName.trim()) {
      toast({
        title: "Error",
        description: "Please enter your name",
        variant: "destructive",
      });
      return;
    }

    setIsConnecting(true);
    try {
      const response = await axiosClient.post("/api/chat/sessions", {
        userName: userName.trim(),
        userEmail: userEmail.trim() || null,
        userId: user?.id || null,
      });

      setSession(response.data);
      setShowChatForm(false);
      toast({
        title: "Success",
        description: "Chat session created! An admin will join shortly.",
      });
    } catch (error) {
      console.error("Error creating chat session:", error);
      toast({
        title: "Error",
        description: "Failed to create chat session. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsConnecting(false);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !session) return;

    const messageData = {
      sessionId: session.id,
      message: newMessage.trim(),
      senderType: "user" as const,
      senderName: userName,
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

  const loadChatHistory = async () => {
    if (!session) return;

    try {
      const response = await axiosClient.get(
        `/api/chat/sessions/${session.id}`
      );
      setMessages(response.data.messages);
    } catch (error) {
      console.error("Error loading chat history:", error);
    }
  };

  useEffect(() => {
    if (session) {
      loadChatHistory();
    }
  }, [session]);

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

  if (showChatForm) {
    return (
      <div className="min-h-screen bg-[#F8F5E4] py-8">
        <div className="container mx-auto px-4 max-w-2xl">
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="flex items-center justify-center gap-2">
                <MessageCircle className="h-6 w-6 text-blue-600" />
                Start Live Chat
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Your Name *
                </label>
                <Input
                  type="text"
                  placeholder="Enter your name"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  disabled={isConnecting}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Email (Optional)
                </label>
                <Input
                  type="email"
                  placeholder="Enter your email"
                  value={userEmail}
                  onChange={(e) => setUserEmail(e.target.value)}
                  disabled={isConnecting}
                />
              </div>

              <Button
                onClick={createChatSession}
                disabled={isConnecting || !userName.trim()}
                className="w-full"
              >
                {isConnecting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  <>
                    <MessageCircle className="mr-2 h-4 w-4" />
                    Start Chat
                  </>
                )}
              </Button>

              <p className="text-sm text-gray-600 text-center">
                Our support team will join the chat shortly to help you.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F5E4] py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <Card className="h-[600px] flex flex-col">
          <CardHeader className="border-b">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5 text-blue-600" />
                <CardTitle>Live Chat Support</CardTitle>
                <Badge
                  variant={session?.status === "open" ? "default" : "secondary"}
                >
                  {session?.status === "open" ? "Active" : "Closed"}
                </Badge>
              </div>
              <div className="text-sm text-gray-600">
                Session: {session?.id.slice(0, 8)}...
              </div>
            </div>
          </CardHeader>

          <CardContent className="flex-1 flex flex-col p-0">
            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  <MessageCircle className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>No messages yet. Start the conversation!</p>
                </div>
              ) : (
                messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${
                      message.senderType === "user"
                        ? "justify-end"
                        : "justify-start"
                    }`}
                  >
                    <div
                      className={`max-w-[70%] rounded-lg px-4 py-2 ${
                        message.senderType === "user"
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
                          message.senderType === "user"
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
            {session?.status === "open" ? (
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
        </Card>
      </div>
    </div>
  );
}
