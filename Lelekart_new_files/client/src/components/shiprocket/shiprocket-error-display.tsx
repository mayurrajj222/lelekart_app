import React from 'react';
import {
  AlertTriangle,
  Shield,
  ShieldAlert,
  XCircle,
  RefreshCw,
  ExternalLink
} from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * ShiprocketErrorDisplay component
 * 
 * A reusable component for displaying standardized Shiprocket API error messages
 * with appropriate icons, descriptions, and action buttons based on error type.
 * 
 * @param {Object} props - Component props
 * @param {any} props.error - The error object or message
 * @param {Function} props.onRetry - Callback function to execute when retry button is clicked
 */
const ShiprocketErrorDisplay = ({ 
  error, 
  onRetry 
}: { 
  error: any;
  onRetry: () => void;
}) => {
  // Different error types
  const errorMessage = error?.message || "Unknown error";
  const htmlContent = (error as any)?.htmlContent || "";
  
  // Check for HTML response in both message and htmlContent
  const isHtmlResponse = errorMessage.includes("<!DOCTYPE") || 
                         errorMessage.includes("<html") ||
                         errorMessage.includes("Received HTML response") ||
                         htmlContent.includes("<!DOCTYPE") ||
                         htmlContent.includes("<html");
                         
  const isTokenMissing = errorMessage.includes("token not available") || 
                         errorMessage.includes("TOKEN_MISSING");
  const isTokenExpired = errorMessage.includes("TOKEN_EXPIRED") || 
                         errorMessage.includes("expired");
  const isAuthError = errorMessage.includes("AUTH_FAILED") || 
                      errorMessage.includes("credentials") ||
                      errorMessage.includes("authentication");
  const isPermissionError = errorMessage.includes("Permission") || 
                            errorMessage.includes("permission") ||
                            errorMessage.includes("PERMISSION_ERROR");

  // Select error type
  const errorType = isHtmlResponse ? "html" :
                   isTokenMissing ? "missing" :
                   isTokenExpired ? "expired" :
                   isAuthError ? "auth" :
                   isPermissionError ? "permission" : "other";
  
  // Error display configuration based on type
  const config = {
    html: {
      title: "API Response Error",
      description: "The Shiprocket API returned HTML instead of JSON. This typically happens when the API is down or returning an error page. Try refreshing the connection.",
      icon: <AlertTriangle className="h-5 w-5 text-amber-500" />,
      color: "amber",
      action: "Retry Connection",
      showHtmlDetails: true
    },
    missing: {
      title: "Token Missing",
      description: "Shiprocket API token is missing. Please generate a new token.",
      icon: <XCircle className="h-5 w-5 text-rose-500" />,
      color: "rose",
      action: "Generate Token"
    },
    expired: {
      title: "Token Expired",
      description: "Your Shiprocket API token has expired. Please refresh it.",
      icon: <AlertTriangle className="h-5 w-5 text-amber-500" />,
      color: "amber",
      action: "Refresh Token"
    },
    auth: {
      title: "Authentication Failed",
      description: "Shiprocket authentication failed. Please check your credentials and refresh the token.",
      icon: <ShieldAlert className="h-5 w-5 text-rose-500" />,
      color: "rose",
      action: "Refresh Token"
    },
    permission: {
      title: "Permission Error",
      description: "Your Shiprocket account doesn't have the necessary API permissions. This typically requires a paid plan.",
      icon: <Shield className="h-5 w-5 text-rose-500" />,
      color: "rose",
      action: "Refresh Token",
      showUpgradeLink: true
    },
    other: {
      title: "Shiprocket API Error",
      description: errorMessage,
      icon: <AlertTriangle className="h-5 w-5 text-amber-500" />,
      color: "amber",
      action: "Retry"
    }
  };

  const selected = config[errorType];
  
  return (
    <div className={`p-4 bg-${selected.color}-50 border border-${selected.color}-200 rounded-md`}>
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex-shrink-0">
          {selected.icon}
        </div>
        <div className="flex-1">
          <h4 className={`font-medium text-${selected.color}-800`}>{selected.title}</h4>
          <p className={`text-sm text-${selected.color}-700 mt-1`}>
            {selected.description}
          </p>
          
          {errorType === "permission" && (
            <div className="mt-3 p-3 bg-white border border-rose-100 rounded">
              <h5 className="font-medium text-rose-800 text-sm">How to Fix This:</h5>
              <ol className="text-sm text-rose-700 mt-2 ml-4 list-decimal">
                <li className="mb-1">Upgrade to a Shiprocket plan that includes API access (Business plan or higher)</li>
                <li className="mb-1">Once upgraded, return here and click "{selected.action}"</li>
              </ol>
              
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => window.open('https://app.shiprocket.in/plan-and-pricing', '_blank')}
                className="mt-3 flex items-center gap-2 text-xs"
              >
                <ExternalLink className="h-3 w-3" /> View Shiprocket Plans
              </Button>
            </div>
          )}
          
          {errorType === "html" && htmlContent && (
            <div className="mt-3 p-3 bg-white border border-amber-100 rounded">
              <h5 className="font-medium text-amber-800 text-sm">HTML Response Details:</h5>
              <div className="mt-2 text-xs text-amber-700 overflow-hidden">
                <p>Detected HTML response from Shiprocket API. This typically happens when:</p>
                <ul className="ml-4 list-disc mt-2">
                  <li className="mb-1">The Shiprocket API is temporarily down</li>
                  <li className="mb-1">Your authentication has expired</li>
                  <li className="mb-1">There's a network connectivity issue</li>
                </ul>
                <p className="mt-2 font-medium">Try reconnecting after a few minutes or check Shiprocket's status.</p>
              </div>
            </div>
          )}
          
          <div className="mt-3">
            <Button
              variant="outline"
              size="sm"
              onClick={onRetry}
              className="flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" /> {selected.action}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShiprocketErrorDisplay;