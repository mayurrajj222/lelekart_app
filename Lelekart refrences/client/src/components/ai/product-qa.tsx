import React, { useState } from "react";
import { useAIAssistant } from "@/context/ai-assistant-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, Loader2, Bot } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";

interface ProductQAProps {
  productId: number;
}

export const ProductQA: React.FC<ProductQAProps> = ({ productId }) => {
  const { askProductQuestion } = useAIAssistant();
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [previousQuestions, setPreviousQuestions] = useState<{ question: string; answer: string }[]>([]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!question.trim() || isLoading) return;
    
    try {
      setIsLoading(true);
      const response = await askProductQuestion(productId, question);
      
      // Add to previous questions
      setPreviousQuestions((prev) => [
        ...prev,
        { question, answer: response },
      ]);
      
      // Clear current question & answer
      setQuestion("");
      setAnswer(null);
    } catch (error) {
      console.error("Error asking product question:", error);
      setAnswer("Sorry, I couldn't process your question. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickQuestionClick = (quickQuestion: string) => {
    setQuestion(quickQuestion);
  };

  const quickQuestions = [
    "Is this product durable?",
    "What are the dimensions?",
    "How does this compare to similar products?",
    "Can you explain the warranty policy?",
  ];

  return (
    <Card className="mt-8">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Bot size={20} className="text-primary" />
          Ask About This Product
        </CardTitle>
      </CardHeader>
      <CardContent>
        {previousQuestions.length > 0 && (
          <div className="space-y-4 mb-6">
            {previousQuestions.map((item, index) => (
              <div key={index} className="space-y-2">
                <div className="font-medium text-sm">Q: {item.question}</div>
                <div className="flex items-start gap-2">
                  <Avatar className="h-6 w-6 mt-1 bg-primary/10 flex items-center justify-center">
                    <Bot size={14} className="text-primary" />
                  </Avatar>
                  <div className="flex-1 text-sm bg-primary/5 rounded-lg p-3">
                    {item.answer.split('\n').map((paragraph, i) => (
                      <p key={i} className={i > 0 ? "mt-2" : ""}>
                        {paragraph}
                      </p>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {quickQuestions.map((q, i) => (
              <Button
                key={i}
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleQuickQuestionClick(q)}
                className="text-xs h-auto py-1"
              >
                {q}
              </Button>
            ))}
          </div>
          
          <div className="flex gap-2">
            <Textarea
              placeholder="Ask about specifications, usage, compatibility..."
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              className="min-h-10 resize-none"
              disabled={isLoading}
            />
            <Button type="submit" size="icon" disabled={!question.trim() || isLoading}>
              {isLoading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
            </Button>
          </div>
          
          {answer && (
            <div className="bg-primary/5 p-4 rounded-lg mt-4">
              <p className="text-sm">{answer}</p>
            </div>
          )}
          
          {isLoading && (
            <div className="flex items-center gap-2 text-primary/60">
              <Loader2 size={16} className="animate-spin" />
              <span className="text-sm">AI Assistant is thinking...</span>
            </div>
          )}
        </form>
      </CardContent>
    </Card>
  );
};