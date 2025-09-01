import React from "react";
import { useAIAssistant } from "@/context/ai-assistant-context";
import { Button } from "@/components/ui/button";
import { Bot } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export const AIAssistantButton = () => {
  const { toggleAssistant, isAssistantVisible } = useAIAssistant();

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="fixed right-4 bottom-4 h-12 w-12 rounded-full shadow-md bg-white z-40 border-primary"
          onClick={toggleAssistant}
          data-state={isAssistantVisible ? "active" : "inactive"}
        >
          <Bot className="h-6 w-6 text-primary" />
          <span className="sr-only">Toggle AI Assistant</span>
        </Button>
      </TooltipTrigger>
      <TooltipContent side="left">
        <p>{isAssistantVisible ? "Hide AI Assistant" : "Get AI Shopping Help"}</p>
      </TooltipContent>
    </Tooltip>
  );
};