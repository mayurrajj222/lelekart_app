import React, { useEffect, useState } from "react";
import { useAIAssistant } from "@/context/ai-assistant-context";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Ruler, Check, AlertCircle } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";

interface SizeRecommendationProps {
  productId: number;
  category?: string;
  availableSizes?: string[];
}

export const SizeRecommendation: React.FC<SizeRecommendationProps> = ({
  productId,
  category,
  availableSizes = [],
}) => {
  const { getSizeRecommendation } = useAIAssistant();
  const { user } = useAuth();
  const [recommendation, setRecommendation] = useState<{
    recommendedSize: string | null;
    confidence: number;
    message: string;
  }>({
    recommendedSize: null,
    confidence: 0,
    message: "",
  });
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);

  useEffect(() => {
    if (productId && user) {
      setIsLoading(true);
      getSizeRecommendation(productId, category)
        .then((result) => {
          setRecommendation(result);
          if (result.recommendedSize) {
            setSelectedSize(result.recommendedSize);
          }
        })
        .finally(() => {
          setIsLoading(false);
        });
    } else {
      setIsLoading(false);
      setRecommendation({
        recommendedSize: null,
        confidence: 0,
        message: user ? "Unable to determine size" : "Sign in for personalized size recommendations",
      });
    }
  }, [productId, category, user, getSizeRecommendation]);

  if (!availableSizes.length) {
    return null;
  }

  return (
    <div className="space-y-3 mt-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Ruler size={16} className="text-primary" />
          <h3 className="text-sm font-medium">Select Size</h3>
        </div>
        
        {isLoading ? (
          <div className="flex items-center gap-1 text-muted-foreground text-xs">
            <Loader2 size={12} className="animate-spin" />
            <span>Getting size recommendation...</span>
          </div>
        ) : recommendation.recommendedSize ? (
          <div className="flex items-center gap-1 text-xs">
            <Check size={12} className="text-green-500" />
            <span className="text-green-700">Recommended for you</span>
          </div>
        ) : null}
      </div>

      {/* Size buttons */}
      <div className="flex flex-wrap gap-2">
        {availableSizes.map((size) => (
          <Button
            key={size}
            type="button"
            variant={selectedSize === size ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedSize(size)}
            className={cn(
              "h-9 px-3",
              recommendation.recommendedSize === size && "border-green-500 border-2",
              !selectedSize && recommendation.recommendedSize === size && "ring-2 ring-green-200"
            )}
          >
            {size}
            {recommendation.recommendedSize === size && (
              <Check size={12} className="ml-1 text-green-500" />
            )}
          </Button>
        ))}
      </div>

      {/* Recommendation confidence */}
      {!isLoading && recommendation.recommendedSize && (
        <Card className="overflow-hidden">
          <CardContent className="p-3 text-xs">
            <div className="flex justify-between items-center mb-1">
              <span className="text-muted-foreground">Confidence</span>
              <span className="font-medium">{Math.round(recommendation.confidence * 100)}%</span>
            </div>
            <Progress value={recommendation.confidence * 100} className="h-1.5" />
            <p className="mt-2 text-muted-foreground">{recommendation.message}</p>
          </CardContent>
        </Card>
      )}

      {/* Not signed in message */}
      {!user && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
          <AlertCircle size={12} />
          <span>Sign in for personalized size recommendations</span>
        </div>
      )}
    </div>
  );
};