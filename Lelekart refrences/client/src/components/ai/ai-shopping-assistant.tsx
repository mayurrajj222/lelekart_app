import React, { useState, useRef, useEffect } from "react";
import { useAIAssistant } from "@/context/ai-assistant-context";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { X, Send, CornerDownRight, Bot, Loader2, Maximize2, Minimize2 } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

const AssistantMessage = ({ content }: { content: string }) => (
  <div className="flex gap-2 mb-4">
    <Avatar className="h-8 w-8 bg-primary/10 flex items-center justify-center">
      <Bot size={18} className="text-primary" />
    </Avatar>
    <div className="flex-1 bg-primary/5 rounded-lg p-3 text-sm">
      {content.split('\n').map((text, i) => (
        <p key={i} className={i > 0 ? "mt-2" : ""}>
          {text}
        </p>
      ))}
    </div>
  </div>
);

const UserMessage = ({ content }: { content: string }) => (
  <div className="flex gap-2 mb-4 justify-end">
    <div className="flex-1 bg-primary/10 rounded-lg p-3 text-sm">
      {content.split('\n').map((text, i) => (
        <p key={i} className={i > 0 ? "mt-2" : ""}>
          {text}
        </p>
      ))}
    </div>
    <Avatar className="h-8 w-8 bg-primary flex items-center justify-center text-white">
      <CornerDownRight size={16} />
    </Avatar>
  </div>
);

export const AISuggestions = ({ onSelectSuggestion }: { onSelectSuggestion: (suggestion: string) => void }) => {
  const suggestions = [
    "What are the trending products right now?",
    "Help me find a gift for my mother",
    "What size should I choose?",
    "Can you recommend similar products?"
  ];

  return (
    <div className="flex flex-wrap gap-2 mb-4">
      {suggestions.map((suggestion, index) => (
        <Button 
          key={index} 
          variant="outline" 
          size="sm" 
          onClick={() => onSelectSuggestion(suggestion)}
          className="text-xs py-1 h-auto"
        >
          {suggestion}
        </Button>
      ))}
    </div>
  );
};

type AssistantSize = "minimized" | "normal" | "fullscreen";

export const AIShoppingAssistant = () => {
  const {
    conversationHistory,
    isLoading,
    isAssistantVisible,
    sendMessage,
    toggleAssistant,
    clearConversation
  } = useAIAssistant();
  
  const [inputMessage, setInputMessage] = useState("");
  const [assistantSize, setAssistantSize] = useState<AssistantSize>("normal");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [conversationHistory]);
  
  if (!isAssistantVisible) return null;
  
  const handleSendMessage = () => {
    if (inputMessage.trim() && !isLoading) {
      sendMessage(inputMessage);
      setInputMessage("");
    }
  };
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };
  
  const handleSuggestionClick = (suggestion: string) => {
    sendMessage(suggestion);
  };
  
  const toggleSize = () => {
    setAssistantSize(prev => {
      if (prev === "normal") return "fullscreen";
      if (prev === "fullscreen") return "minimized";
      return "normal";
    });
  };
  
  return (
    <div 
      className={cn(
        "fixed right-4 bottom-4 z-50 transition-all duration-300 shadow-lg",
        assistantSize === "fullscreen" ? "w-full h-[calc(100vh-2rem)] inset-x-0 max-w-none" : 
        assistantSize === "normal" ? "w-96 h-[500px]" : 
        "w-96 h-16 overflow-hidden"
      )}
    >
      <Card className="h-full flex flex-col">
        <CardHeader className="px-4 py-2 flex flex-row items-center justify-between border-b">
          <CardTitle className="text-lg flex items-center">
            <Bot size={20} className="mr-2 text-primary" />
            LeleKart AI Assistant
          </CardTitle>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" onClick={toggleSize} className="h-8 w-8">
              {assistantSize === "fullscreen" ? (
                <Minimize2 size={16} />
              ) : (
                <Maximize2 size={16} />
              )}
            </Button>
            <Button variant="ghost" size="icon" onClick={toggleAssistant} className="h-8 w-8">
              <X size={16} />
            </Button>
          </div>
        </CardHeader>
        
        {assistantSize !== "minimized" && (
          <>
            <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
              {conversationHistory.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-4">
                  <Bot size={48} className="text-primary/20 mb-4" />
                  <h3 className="text-lg font-medium mb-2">How can I help you today?</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Ask me anything about products, size recommendations, or shopping advice.
                  </p>
                  <AISuggestions onSelectSuggestion={handleSuggestionClick} />
                </div>
              ) : (
                <div className="space-y-4">
                  {conversationHistory.map((msg, index) => (
                    msg.role === "assistant" ? (
                      <AssistantMessage key={index} content={msg.content} />
                    ) : (
                      <UserMessage key={index} content={msg.content} />
                    )
                  ))}
                  {isLoading && (
                    <div className="flex items-center gap-2 text-primary/60">
                      <Loader2 size={16} className="animate-spin" />
                      <span className="text-sm">AI Assistant is thinking...</span>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </CardContent>
            
            <CardFooter className="border-t p-3">
              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessage();
                }}
                className="flex items-end gap-2 w-full"
              >
                <Textarea
                  placeholder="Type your message..."
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="min-h-10 resize-none"
                  disabled={isLoading}
                />
                <Button 
                  type="submit" 
                  size="icon" 
                  disabled={!inputMessage.trim() || isLoading}
                >
                  {isLoading ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    <Send size={18} />
                  )}
                </Button>
              </form>
            </CardFooter>
          </>
        )}
      </Card>
    </div>
  );
};