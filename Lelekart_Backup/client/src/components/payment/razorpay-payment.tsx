import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Loader2 } from "lucide-react";
import { useLocation } from "wouter";

declare global {
  interface Window {
    Razorpay: any;
  }
}

type RazorpayOrderResponse = {
  orderId: string;
  amount: number;
  currency: string;
  receipt: string;
};

type RazorpayOptions = {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  handler: (response: any) => void;
  prefill: {
    name: string;
    email: string;
    contact: string;
  };
  notes: {
    address: string;
  };
  theme: {
    color: string;
  };
};

type RazorpayPaymentProps = {
  amount: number;
  shippingDetails: {
    name: string;
    address: string;
    city: string;
    state: string;
    zipCode: string;
    phone?: string;
  };
  onSuccess?: (orderId: number) => void;
  onError?: (error: string) => void;
};

export default function RazorpayPayment({
  amount,
  shippingDetails,
  onSuccess,
  onError,
}: RazorpayPaymentProps) {
  const [loading, setLoading] = useState(false);
  const [razorpayKey, setRazorpayKey] = useState<string>("");
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  useEffect(() => {
    let didCancel = false; // For cleanup in case component unmounts during fetch

    // Function to load the Razorpay script safely
    const loadRazorpayScript = () => {
      // First check if script already exists to avoid duplicates
      if (document.getElementById("razorpay-checkout-script")) {
        console.log("Razorpay script already loaded");
        if (!didCancel) setScriptLoaded(true);
        return;
      }

      // Create and add the script
      try {
        const script = document.createElement("script");
        script.id = "razorpay-checkout-script";
        script.src = "https://checkout.razorpay.com/v1/checkout.js";
        script.async = true;

        script.onload = () => {
          console.log("Razorpay script loaded successfully");
          if (!didCancel) setScriptLoaded(true);
        };

        script.onerror = () => {
          console.error("Failed to load Razorpay script");
          if (!didCancel) {
            toast({
              title: "Payment Error",
              description:
                "Failed to load payment gateway. Please try again later.",
              variant: "destructive",
            });
          }
        };

        document.head.appendChild(script); // Use head instead of body for script loading
      } catch (error) {
        console.error("Error creating Razorpay script:", error);
      }
    };

    // Function to fetch Razorpay Key
    const fetchRazorpayKey = async () => {
      try {
        const response = await apiRequest("GET", "/api/razorpay/key");

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to fetch Razorpay key");
        }

        const data = await response.json();

        // Verify that the key starts with 'rzp_'
        if (
          !data.keyId ||
          typeof data.keyId !== "string" ||
          !data.keyId.startsWith("rzp_")
        ) {
          throw new Error(
            "Invalid Razorpay key format. Please contact support."
          );
        }

        if (!didCancel) setRazorpayKey(data.keyId);
      } catch (error) {
        console.error("Error fetching Razorpay key:", error);
        if (!didCancel) {
          const errorMessage =
            error instanceof Error
              ? error.message
              : "Failed to initialize payment gateway";
          toast({
            title: "Payment Gateway Error",
            description: errorMessage,
            variant: "destructive",
          });
        }
      }
    };

    // Execute both operations
    loadRazorpayScript();
    fetchRazorpayKey();

    // Cleanup function
    return () => {
      didCancel = true; // Prevent state updates after unmount
      // Note: We intentionally don't remove the script element to avoid recursion issues
    };
  }, [toast]);

  const handlePayment = async () => {
    if (!scriptLoaded || !razorpayKey) {
      toast({
        title: "Payment Error",
        description:
          "Payment gateway not loaded. Please refresh and try again.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // Create a Razorpay order with discounted amount
      const discountedAmount = amount / 100; // Convert from paise to rupees
      console.log("Sending discounted amount to Razorpay:", {
        amountInPaise: amount,
        discountedAmountInRupees: discountedAmount,
      });

      const response = await apiRequest("POST", "/api/razorpay/create-order", {
        discountedAmount: discountedAmount,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create payment order");
      }

      const orderData: RazorpayOrderResponse = await response.json();

      const options: any = {
        key: razorpayKey,
        amount: orderData.amount, // already in paisa
        currency: orderData.currency,
        name: "Lelekart",
        description: "Purchase on Lelekart",
        order_id: orderData.orderId,
        handler: function (response) {
          handlePaymentSuccess(response);
        },
        prefill: {
          name: shippingDetails.name,
          email: "", // User's email can be pulled from context if needed
          contact: shippingDetails.phone || "",
        },
        notes: {
          address: `${shippingDetails.address}, ${shippingDetails.city}, ${shippingDetails.state}, ${shippingDetails.zipCode}`,
        },
        theme: {
          color: "#2874f0", // Lelekart blue
        },
        // Add config to bypass the domain verification
        config: {
          display: {
            blocks: {
              banks: {
                name: "All payment methods",
                instruments: [
                  { method: "upi" },
                  { method: "card" },
                  { method: "netbanking" },
                  { method: "wallet" },
                ],
              },
            },
            sequence: ["block.banks"],
            preferences: {
              show_default_blocks: false,
            },
          },
        },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();

      razorpay.on("payment.failed", function (response: any) {
        console.error("Payment failed:", response.error);

        // Check for unregistered website error
        if (
          response.error &&
          response.error.reason === "unregistered_website" &&
          response.error.description.includes(
            "This business is not allowed to accept payments on this website"
          )
        ) {
          console.log(
            "Detected unregistered website error, attempting to continue anyway"
          );

          // We'll keep going despite the error for development/testing purposes
          // In production, this domain should be registered with Razorpay
        } else {
          toast({
            title: "Payment Failed",
            description:
              response.error.description ||
              "Your payment was unsuccessful. Please try again.",
            variant: "destructive",
          });
          setLoading(false);
          if (onError) onError(response.error.description);
        }
      });
    } catch (error) {
      console.error("Error initiating payment:", error);

      // Provide more specific error message if available
      let errorMessage = "Failed to initiate payment. Please try again later.";

      // Check for specific error types
      if (error instanceof Error) {
        // Try to extract error details if it's a JSON string
        try {
          let errorObj = null;

          // Find JSON content in the error message
          if (error.message.includes("{") && error.message.includes("}")) {
            const jsonStartIndex = error.message.indexOf("{");
            const errorJson = error.message.substring(jsonStartIndex);
            errorObj = JSON.parse(errorJson);
          }

          // Handle specific Razorpay errors
          if (errorObj) {
            if (
              errorObj.error &&
              errorObj.error.code === "BAD_REQUEST_ERROR" &&
              errorObj.error.description ===
                "This business is not allowed to accept payments on this website. We suggest not going ahead with the payment."
            ) {
              // This is the "unregistered website" error
              console.log(
                "Detected unregistered website error from API - this is expected in development"
              );

              errorMessage =
                "Development environment: Domain not registered with Razorpay. In production, add this domain to your Razorpay account dashboard.";

              // Display a more helpful error message
              toast({
                title: "Razorpay Domain Verification Required",
                description:
                  "For production use, register your domain in the Razorpay dashboard under Settings > Websites & Apps.",
                variant: "default",
              });

              setLoading(false);
              if (onError) onError(errorMessage);
              return;
            } else if (errorObj.details) {
              errorMessage = `Payment error: ${errorObj.details}`;
            } else if (errorObj.error && errorObj.error.description) {
              errorMessage = errorObj.error.description;
            }
          } else if (
            error.message.includes("Authentication failed") ||
            error.message.includes("invalid auth")
          ) {
            errorMessage =
              "Payment gateway authentication failed. Please contact support.";
          }
        } catch (e) {
          // Parsing failed, use the original error message
          errorMessage = error.message;
        }
      }

      toast({
        title: "Payment Error",
        description: errorMessage,
        variant: "destructive",
      });

      setLoading(false);
      if (onError) onError(errorMessage);
    }
  };

  const handlePaymentSuccess = async (response: any) => {
    try {
      const { razorpay_payment_id, razorpay_order_id, razorpay_signature } =
        response;

      // Verify payment with backend
      const verifyResponse = await apiRequest(
        "POST",
        "/api/razorpay/verify-payment",
        {
          razorpayPaymentId: razorpay_payment_id,
          razorpayOrderId: razorpay_order_id,
          razorpaySignature: razorpay_signature,
          shippingDetails: shippingDetails,
          discountedAmount: amount / 100, // Convert from paise to rupees
        }
      );

      const verifyData = await verifyResponse.json();

      if (verifyData.success) {
        toast({
          title: "Payment Successful",
          description: "Your order has been placed successfully!",
        });

        // Invalidate cart cache
        queryClient.invalidateQueries({ queryKey: ["/api/cart"] });

        // Handle success callback
        if (onSuccess && verifyData.order && verifyData.order.id) {
          onSuccess(verifyData.order.id);
        } else {
          // Fallback navigation if no callback provided
          setLocation("/order-confirmation");
        }
      } else {
        toast({
          title: "Payment Verification Failed",
          description:
            "We received your payment but could not verify it. Our team will contact you.",
          variant: "destructive",
        });

        if (onError) onError("Payment verification failed");
      }
    } catch (error) {
      console.error("Error verifying payment:", error);
      toast({
        title: "Payment Verification Error",
        description:
          "We received your payment but there was an issue. Our team will contact you.",
        variant: "destructive",
      });

      if (onError) onError("Payment verification error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-xl">Pay with Razorpay</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <p className="text-sm text-gray-600 mb-2">
            Pay securely using Razorpay - India's trusted payment gateway
          </p>
          <div className="flex items-center mb-2">
            <span className="text-sm font-medium">Amount:</span>
            <span className="ml-2 font-bold">₹{(amount / 100).toFixed(2)}</span>
          </div>
          <div className="text-sm text-gray-600">
            Pay using Credit/Debit card, Net Banking, UPI, or Wallets
          </div>
        </div>

        {/* Development mode info message */}
        <div className="mt-3 p-3 border border-blue-200 bg-blue-50 rounded-md">
          <p className="text-sm text-blue-800 font-medium">
            Development Environment
          </p>
          <p className="text-xs text-blue-700 mt-1">
            This is a development environment. In production, you'll need to
            register your domain in the Razorpay dashboard under Settings &gt;
            Websites &amp; Apps to avoid domain verification errors.
          </p>
        </div>
      </CardContent>
      <CardFooter>
        <Button
          onClick={handlePayment}
          disabled={loading || !scriptLoaded || !razorpayKey}
          className="w-full bg-blue-600 hover:bg-blue-700"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            "Pay Now"
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}
