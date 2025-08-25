import React, { useState, Suspense, lazy } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Loader2,
  Save,
  Check,
  RefreshCw,
  TruckIcon,
  Settings,
  AlertTriangle,
  ExternalLink,
  ArrowRight,
  CheckCircle,
  Info,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import AdminLayout from "@/components/layout/admin-layout";
import ShiprocketErrorDisplay from "@/components/shiprocket/shiprocket-error-display";

// Lazy-load the shipment components for better initial loading performance
const PendingShipments = lazy(() => import("./shiprocket-pending-shipments"));
const ShiprocketShipments = lazy(() => import("./shiprocket-shipments"));

const ShiprocketDashboardContent = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("settings");

  // State for Shiprocket settings form
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [defaultCourier, setDefaultCourier] = useState("");
  const [autoShipEnabled, setAutoShipEnabled] = useState(false);

  // Check if Shiprocket API is connected and credentials are valid
  const {
    isError: apiError,
    error: apiErrorDetails,
    refetch: recheckApi,
  } = useQuery({
    queryKey: ["/api/shiprocket/couriers"],
    queryFn: async () => {
      try {
        const response = await apiRequest("GET", "/api/shiprocket/couriers");
        const text = await response.text();
        let data;
        try {
          // Try to parse as JSON first
          data = JSON.parse(text);
        } catch (parseError) {
          // If it's not valid JSON (e.g., it's HTML), throw error with the text
          if (text.includes("<!DOCTYPE") || text.includes("<html")) {
            throw new Error(
              "The API returned HTML instead of JSON. Please try generating a new API token."
            );
          } else {
            throw new Error(
              `Invalid API response: ${text.substring(0, 100)}...`
            );
          }
        }
        return data;
      } catch (error) {
        console.error("API test failed:", error);
        throw error;
      }
    },
    retry: 1, // Only retry once
  });

  // Get Shiprocket settings
  const {
    data: settings,
    isLoading: isLoadingSettings,
    isError: isErrorSettings,
    error: settingsError,
  } = useQuery({
    queryKey: ["/api/shiprocket/settings"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/shiprocket/settings");

      try {
        const text = await response.text();
        let data;

        try {
          // Try to parse as JSON first
          data = JSON.parse(text);
        } catch (parseError) {
          // If it's not valid JSON (e.g., it's HTML), throw error with the text
          if (text.includes("<!DOCTYPE") || text.includes("<html")) {
            throw new Error(
              "The API returned HTML instead of JSON. Please try generating a new API token."
            );
          } else {
            throw new Error(
              `Invalid API response: ${text.substring(0, 100)}...`
            );
          }
        }

        return data;
      } catch (error) {
        console.error("Settings API error:", error);
        throw error;
      }
    },
    onSuccess: (data) => {
      setEmail(data.email || "");
      setDefaultCourier(data.defaultCourier || "");
      setAutoShipEnabled(data.autoShipEnabled || false);
    },
    retry: (failureCount, error) => {
      // Don't retry if we get HTML response
      if (
        error instanceof Error &&
        (error.message.includes("<!DOCTYPE") ||
          error.message.includes("<html") ||
          error.message.includes("returned HTML"))
      ) {
        return false;
      }
      // For other errors, retry up to 2 times
      return failureCount < 2;
    },
  });

  // Save Shiprocket settings
  const saveSettingsMutation = useMutation({
    mutationFn: async (data: {
      email: string;
      password?: string;
      defaultCourier: string;
      autoShipEnabled: boolean;
    }) => {
      const response = await apiRequest(
        "POST",
        "/api/shiprocket/settings",
        data
      );

      try {
        const text = await response.text();
        let result;

        try {
          // Try to parse as JSON first
          result = JSON.parse(text);
        } catch (parseError) {
          // If it's not valid JSON (e.g., it's HTML), throw error with the text
          if (text.includes("<!DOCTYPE") || text.includes("<html")) {
            throw new Error(
              "The API returned HTML instead of JSON. Please try again or refresh the page."
            );
          } else {
            throw new Error(
              `Invalid API response: ${text.substring(0, 100)}...`
            );
          }
        }

        if (!response.ok) {
          throw new Error(
            result?.message || result?.error || "Failed to save settings"
          );
        }

        return result;
      } catch (error) {
        console.error("Settings save error:", error);
        throw error;
      }
    },
    onSuccess: () => {
      toast({
        title: "Settings saved",
        description: "Shiprocket settings have been saved successfully.",
        variant: "default",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/shiprocket/settings"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error saving settings",
        description:
          error.message || "There was an error saving your settings.",
        variant: "destructive",
      });

      // If the error is HTML-related, invalidate queries to force refresh
      if (
        error.message &&
        (error.message.includes("HTML") || error.message.includes("<!DOCTYPE"))
      ) {
        queryClient.invalidateQueries({
          queryKey: ["/api/shiprocket/settings"],
        });
        queryClient.invalidateQueries({
          queryKey: ["/api/shiprocket/couriers"],
        });
      }
    },
  });

  // Generate Shiprocket token
  const generateTokenMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/shiprocket/token");

      try {
        const text = await response.text();
        let result;

        try {
          // Try to parse as JSON first
          result = JSON.parse(text);
        } catch (parseError) {
          // If it's not valid JSON (e.g., it's HTML), throw error with the text
          if (text.includes("<!DOCTYPE") || text.includes("<html")) {
            throw new Error(
              "The API returned HTML instead of JSON. Please try again or refresh the page."
            );
          } else {
            throw new Error(
              `Invalid API response: ${text.substring(0, 100)}...`
            );
          }
        }

        if (!response.ok) {
          throw new Error(
            result?.message || result?.error || "Failed to generate token"
          );
        }

        return result;
      } catch (error) {
        console.error("Token generation error:", error);
        throw error;
      }
    },
    onSuccess: () => {
      toast({
        title: "Token generated",
        description: "Shiprocket API token has been generated successfully.",
        variant: "default",
      });
      // Invalidate all Shiprocket-related queries to refresh the data
      queryClient.invalidateQueries({ queryKey: ["/api/shiprocket/settings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/shiprocket/couriers"] });
      queryClient.invalidateQueries({
        queryKey: ["/api/shiprocket/orders/pending"],
      });
      queryClient.invalidateQueries({ queryKey: ["/api/shiprocket/orders"] });
    },
    onError: (error: any) => {
      // Extract the most relevant error message
      let errorMessage = "There was an error generating the token.";
      let errorTitle = "Error Generating Token";

      if (error.message) {
        if (error.message.includes("HTML")) {
          errorTitle = "API Response Error";
          errorMessage =
            "The API returned an invalid response. Please check your network connection and try again.";
        } else if (error.message.includes("credentials")) {
          errorTitle = "Authentication Failed";
          errorMessage =
            "The credentials provided were invalid. Please check your email and password.";
        } else {
          errorMessage = error.message;
        }
      }

      toast({
        title: errorTitle,
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const data: any = {
      email,
      defaultCourier,
      autoShipEnabled,
    };

    // Only include password if it's provided
    if (password) {
      data.password = password;
    }

    saveSettingsMutation.mutate(data);
  };

  return (
    <AdminLayout>
      <div className="px-2 sm:px-6 py-4 sm:py-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Shiprocket Integration</h1>
          <p className="text-gray-500 mt-2">
            Manage Shiprocket integration settings and shipments
          </p>

          {/* Show API error if present */}
          {apiError && (
            <ShiprocketErrorDisplay
              error={apiErrorDetails}
              onRetry={() => {
                recheckApi();
                // Also try regenerating the token if the error is related to the token
                if (
                  String(apiErrorDetails).includes("token") ||
                  String(apiErrorDetails).includes("<!DOCTYPE") ||
                  String(apiErrorDetails).includes("<html")
                ) {
                  generateTokenMutation.mutate();
                }
              }}
            />
          )}
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings size={16} />
              Settings
            </TabsTrigger>
            <TabsTrigger value="pending" className="flex items-center gap-2">
              <TruckIcon size={16} />
              Pending Shipments
            </TabsTrigger>
            <TabsTrigger value="shipped" className="flex items-center gap-2">
              <Check size={16} />
              Shipped Orders
            </TabsTrigger>
          </TabsList>

          <TabsContent value="settings">
            <Card>
              <CardHeader>
                <CardTitle>Shiprocket Account Settings</CardTitle>
                <CardDescription>
                  Configure your Shiprocket API credentials and settings
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingSettings ? (
                  <div className="flex items-center justify-center h-64">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : isErrorSettings ? (
                  <div className="py-4">
                    {settingsError instanceof Error &&
                    settingsError.message.includes("API returned HTML") ? (
                      <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-md">
                        <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5 flex-shrink-0" />
                        <div className="space-y-2">
                          <h4 className="font-medium text-amber-800">
                            Authentication Error
                          </h4>
                          <p className="text-sm text-amber-700">
                            {settingsError.message}
                          </p>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => generateTokenMutation.mutate()}
                            className="flex items-center gap-2 mt-2"
                          >
                            <RefreshCw className="h-4 w-4" /> Generate New Token
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <ShiprocketErrorDisplay
                        error={settingsError}
                        onRetry={() => {
                          queryClient.invalidateQueries({
                            queryKey: ["/api/shiprocket/settings"],
                          });
                          generateTokenMutation.mutate();
                        }}
                      />
                    )}
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="email">Email Address</Label>
                          <Input
                            id="email"
                            placeholder="Shiprocket account email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="password">
                            Password{" "}
                            <span className="text-gray-400 text-sm">
                              (leave empty to keep current password)
                            </span>
                          </Label>
                          <Input
                            id="password"
                            type="password"
                            placeholder="Shiprocket account password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="default-courier">Default Courier</Label>
                        <Input
                          id="default-courier"
                          placeholder="Default courier service ID"
                          value={defaultCourier}
                          onChange={(e) => setDefaultCourier(e.target.value)}
                        />
                        <p className="text-sm text-gray-400 mt-1">
                          Enter the numeric ID of your preferred courier service
                          (required for Auto-Ship functionality)
                        </p>

                        <Alert
                          variant="default"
                          className="mt-4 bg-blue-50 border-blue-100"
                        >
                          <Info className="h-4 w-4 text-blue-500" />
                          <AlertTitle className="text-blue-700 text-sm font-medium">
                            How to find your courier ID
                          </AlertTitle>
                          <AlertDescription className="text-blue-600 text-xs">
                            <ol className="mt-2 space-y-2 list-decimal pl-5">
                              <li>Log in to your Shiprocket dashboard</li>
                              <li>
                                Go to{" "}
                                <span className="font-medium">
                                  Settings &gt; Shipping &gt; Courier Priority
                                </span>
                              </li>
                              <li>
                                Note the ID of your preferred courier (it's the
                                number displayed in the table)
                              </li>
                              <li>Enter that ID in the field above</li>
                            </ol>
                            <div className="mt-3 flex items-center text-blue-700">
                              <a
                                href="https://app.shiprocket.in/courier-priority"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center text-xs font-medium text-blue-600 hover:text-blue-800"
                              >
                                Go to Shiprocket Courier Priority{" "}
                                <ExternalLink className="ml-1 h-3 w-3" />
                              </a>
                            </div>
                          </AlertDescription>
                        </Alert>
                      </div>

                      <div className="space-y-3">
                        <div className="flex items-center space-x-2">
                          <Switch
                            id="auto-ship"
                            checked={autoShipEnabled}
                            onCheckedChange={setAutoShipEnabled}
                          />
                          <Label htmlFor="auto-ship">
                            Auto-ship orders when payment is received
                          </Label>
                        </div>

                        {autoShipEnabled && !defaultCourier && (
                          <Alert variant="destructive" className="mt-2">
                            <AlertTriangle className="h-4 w-4" />
                            <AlertTitle>Default courier required</AlertTitle>
                            <AlertDescription>
                              Auto-ship requires a default courier to be
                              configured. Please enter a valid courier ID in the
                              field above.
                            </AlertDescription>
                          </Alert>
                        )}
                      </div>

                      <div className="pt-4">
                        <div className="flex flex-col sm:flex-row gap-3">
                          <Button
                            type="submit"
                            disabled={saveSettingsMutation.isPending}
                            className="flex gap-2"
                          >
                            {saveSettingsMutation.isPending ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Save className="h-4 w-4" />
                            )}
                            Save Settings
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => generateTokenMutation.mutate()}
                            disabled={generateTokenMutation.isPending}
                            className="flex gap-2"
                          >
                            {generateTokenMutation.isPending ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <RefreshCw className="h-4 w-4" />
                            )}
                            Generate API Token
                          </Button>
                        </div>
                        {settings?.token && (
                          <div className="mt-4 p-3 bg-green-50 border border-green-100 rounded-md">
                            <div className="flex items-center gap-2">
                              <Check className="h-5 w-5 text-green-500" />
                              <span className="text-green-700 font-medium">
                                API Token Status: Active
                              </span>
                            </div>
                            <p className="text-sm text-gray-500 mt-1">
                              Your Shiprocket API token is active and ready to
                              use.
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </form>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="pending">
            <Suspense
              fallback={
                <div className="flex items-center justify-center h-64">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <span className="ml-2">Loading pending shipments...</span>
                </div>
              }
            >
              {activeTab === "pending" && <PendingShipments />}
            </Suspense>
          </TabsContent>

          <TabsContent value="shipped">
            <Suspense
              fallback={
                <div className="flex items-center justify-center h-64">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <span className="ml-2">Loading shipped orders...</span>
                </div>
              }
            >
              {activeTab === "shipped" && <ShiprocketShipments />}
            </Suspense>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
};

const ShiprocketDashboard = () => {
  return (
    <AdminLayout>
      <ShiprocketDashboardContent />
    </AdminLayout>
  );
};

export default ShiprocketDashboard;
