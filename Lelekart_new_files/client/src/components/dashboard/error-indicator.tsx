import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ErrorIndicatorProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
}

export function ErrorIndicator({
  title = "Error",
  message = "Failed to load dashboard data",
  onRetry
}: ErrorIndicatorProps) {
  return (
    <div className="p-6 bg-destructive/10 border border-destructive rounded-md text-destructive">
      <div className="flex flex-col items-center text-center space-y-2">
        <AlertCircle className="h-10 w-10 mb-2" />
        <h3 className="font-medium text-lg">{title}</h3>
        <p className="text-sm">{message}</p>
        {onRetry && (
          <Button 
            variant="outline" 
            onClick={onRetry}
            className="mt-4 border-destructive text-destructive hover:bg-destructive/10"
          >
            Try Again
          </Button>
        )}
      </div>
    </div>
  );
}