import React, { createContext, useState, useContext, useCallback, useEffect } from "react";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";

// Define types for our context
type ConversationMessage = {
  role: "user" | "assistant";
  content: string;
};

type Product = {
  id: number;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  category: string;
};

type AIAssistantContextType = {
  isAssistantVisible: boolean;
  toggleAssistant: () => void;
  conversationHistory: ConversationMessage[];
  sendMessage: (message: string) => Promise<void>;
  clearConversation: () => void;
  isLoading: boolean;
  personalizedRecommendations: Product[];
  complementaryProducts: Product[];
  getComplementaryProducts: (productId: number, limit?: number) => Promise<Product[]>;
  askProductQuestion: (productId: number, question: string) => Promise<string>;
  getSizeRecommendation: (productId: number, category?: string) => Promise<{
    recommendedSize: string | null;
    confidence: number;
    message: string;
  }>;
  trackActivity: (
    activityType: string,
    productId?: number,
    categoryId?: number,
    searchQuery?: string,
    additionalData?: Record<string, any>
  ) => void;
};

const AIAssistantContext = createContext<AIAssistantContextType | undefined>(undefined);

export const AIAssistantProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAssistantVisible, setIsAssistantVisible] = useState(false);
  const [conversationHistory, setConversationHistory] = useState<ConversationMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [personalizedRecommendations, setPersonalizedRecommendations] = useState<Product[]>([]);
  const [complementaryProducts, setComplementaryProducts] = useState<Product[]>([]);
  // Safely get user from auth context
  let user;
  try {
    const authContext = useAuth();
    user = authContext.user;
  } catch (error) {
    console.warn("Auth context not available yet, user will be undefined");
    user = null;
  }
  
  const { toast } = useToast();

  // Fetch personalized recommendations when the component mounts
  useEffect(() => {
    const fetchRecommendations = async () => {
      try {
        const response = await apiRequest("GET", "/api/recommendations");
        const data = await response.json();
        setPersonalizedRecommendations(data);
      } catch (error) {
        console.error("Error fetching recommendations:", error);
      }
    };

    fetchRecommendations();
  }, [user?.id]);

  const toggleAssistant = useCallback(() => {
    setIsAssistantVisible((prev) => !prev);
  }, []);

  const clearConversation = useCallback(() => {
    setConversationHistory([]);
  }, []);

  // Session ID for tracking conversation
  const [sessionId] = useState(() => `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`);

  const sendMessage = useCallback(async (message: string) => {
    if (!message.trim()) return;

    // Add user message to conversation
    const userMessage: ConversationMessage = { role: "user", content: message };
    setConversationHistory((prev) => [...prev, userMessage]);
    setIsLoading(true);

    try {
      // Send message with session ID and conversation history
      const response = await apiRequest("POST", "/api/ai/chat", { 
        message, 
        sessionId,
        conversationHistory
      });
      const data = await response.json();

      // Add assistant response to conversation
      const assistantMessage: ConversationMessage = {
        role: "assistant",
        content: data.response,
      };
      setConversationHistory((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Error sending message to AI:", error);
      
      // Add error message to conversation
      const errorMessage: ConversationMessage = {
        role: "assistant",
        content: "I'm sorry, I encountered an error while processing your request. Please try again later.",
      };
      setConversationHistory((prev) => [...prev, errorMessage]);
      
      toast({
        title: "Error",
        description: "Failed to get a response from our AI assistant. Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast, sessionId, conversationHistory]);

  const getComplementaryProducts = useCallback(async (productId: number, limit = 4) => {
    try {
      const response = await apiRequest("GET", `/api/products/${productId}/complementary?limit=${limit}`);
      const data = await response.json();
      setComplementaryProducts(data);
      return data;
    } catch (error) {
      console.error("Error fetching complementary products:", error);
      return [];
    }
  }, []);

  const askProductQuestion = useCallback(async (productId: number, question: string) => {
    try {
      const response = await apiRequest("POST", `/api/products/${productId}/ask`, { question });
      const data = await response.json();
      return data.answer;
    } catch (error) {
      console.error("Error asking product question:", error);
      throw error;
    }
  }, []);

  const getSizeRecommendation = useCallback(async (productId: number, category?: string) => {
    try {
      const response = await apiRequest("GET", `/api/products/${productId}/size-recommendation${category ? `?category=${category}` : ""}`);
      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error getting size recommendation:", error);
      return {
        recommendedSize: null,
        confidence: 0,
        message: "Unable to determine size recommendation at this time."
      };
    }
  }, []);

  const trackActivity = useCallback(async (
    activityType: string,
    productId?: number,
    categoryId?: number,
    searchQuery?: string,
    additionalData?: Record<string, any>
  ) => {
    if (!user) return; // Only track activities for authenticated users
    
    try {
      await apiRequest("POST", "/api/track-activity", {
        activityType,
        productId,
        categoryId,
        searchQuery,
        additionalData: additionalData || {},
      });
    } catch (error) {
      console.error("Error tracking user activity:", error);
    }
  }, [user]);

  return (
    <AIAssistantContext.Provider
      value={{
        isAssistantVisible,
        toggleAssistant,
        conversationHistory,
        sendMessage,
        clearConversation,
        isLoading,
        personalizedRecommendations,
        complementaryProducts,
        getComplementaryProducts,
        askProductQuestion,
        getSizeRecommendation,
        trackActivity,
      }}
    >
      {children}
      {isAssistantVisible && <div id="ai-assistant-portal" />}
    </AIAssistantContext.Provider>
  );
};

export const useAIAssistant = () => {
  const context = useContext(AIAssistantContext);
  if (context === undefined) {
    throw new Error("useAIAssistant must be used within an AIAssistantProvider");
  }
  return context;
};