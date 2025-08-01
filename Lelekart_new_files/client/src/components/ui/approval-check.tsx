import { ReactNode, useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "./button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./card";
import { Loader2, AlertCircle, HelpCircle, CheckCircle2 } from "lucide-react";
import { useLocation } from "wouter";

interface ApprovalCheckProps {
  children: ReactNode;
}

export default function ApprovalCheck({ children }: ApprovalCheckProps) {
  const [location, setLocation] = useLocation();
  const [showRejectionReason, setShowRejectionReason] = useState(false);

  const {
    data: sellerStatus,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["/api/seller/status"],
    queryFn: async () => {
      try {
        const res = await fetch("/api/seller/status");
        if (!res.ok) {
          throw new Error("Failed to fetch seller status");
        }
        return res.json();
      } catch (error) {
        console.error("Error fetching seller status:", error);
        throw error;
      }
    },
  });

  // Redirect to profile if status isn't available and we're not already on the profile page
  useEffect(() => {
    if (
      sellerStatus &&
      sellerStatus.rejected &&
      !location.includes("/seller/profile")
    ) {
      setLocation("/seller/profile");
    }
  }, [sellerStatus, location, setLocation]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (isError) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardHeader className="pb-2">
          <CardTitle className="text-red-700 flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            Error Checking Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-600">
            There was an error checking your seller approval status. Please try
            again later or contact support.
          </p>
        </CardContent>
        <CardFooter>
          <Button
            variant="outline"
            onClick={() => window.location.reload()}
            className="text-red-600 border-red-200 hover:bg-red-50"
          >
            Retry
          </Button>
        </CardFooter>
      </Card>
    );
  }

  // If seller is rejected
  if (sellerStatus?.rejected) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardHeader className="pb-2">
          <CardTitle className="text-red-700 flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            Seller Account Rejected
          </CardTitle>
          <CardDescription className="text-red-600">
            Your seller account application has been rejected.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {showRejectionReason ? (
            <div className="space-y-4">
              <p className="text-red-600 font-medium">Reason for rejection:</p>
              <div className="bg-white p-3 rounded border border-red-200">
                <p className="text-gray-700">
                  {sellerStatus.message || "No specific reason provided."}
                </p>
              </div>
              <p className="text-sm text-gray-600">
                Please update your seller profile with the required information
                and resubmit your application.
              </p>
            </div>
          ) : (
            <p className="text-red-600">
              Your seller application has been reviewed and rejected. Please
              update your profile and resubmit.
            </p>
          )}
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button
            variant="ghost"
            onClick={() => setShowRejectionReason(!showRejectionReason)}
            className="text-red-600"
          >
            {showRejectionReason ? "Hide Details" : "View Details"}
          </Button>
          <Button onClick={() => setLocation("/seller/profile")}>
            Update Profile
          </Button>
        </CardFooter>
      </Card>
    );
  }

  // If seller is pending approval
  if (!sellerStatus?.approved) {
    return (
      <Card className="border-amber-200 bg-amber-50">
        <CardHeader className="pb-2">
          <CardTitle className="text-amber-700 flex items-center gap-2">
            <HelpCircle className="h-5 w-5" />
            Approval Pending
          </CardTitle>
          <CardDescription className="text-amber-600">
            Your seller account is pending approval from our team.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-amber-700">
            Our team is reviewing your seller information. You'll be notified
            once your account is approved. In the meantime, you can update your
            seller profile.
          </p>
          <div className="mt-4 bg-white p-3 rounded border border-amber-200">
            <h4 className="font-medium text-amber-700 mb-2">While you wait:</h4>
            <ul className="list-disc pl-5 space-y-1 text-sm text-gray-600">
              <li>
                Make sure your profile information is complete and accurate
              </li>
              <li>Prepare product information you want to list</li>
              <li>Review our seller policies and guidelines</li>
              <li>Update your details in Settings</li>
            </ul>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button
            variant="outline"
            onClick={() => setLocation("/seller/profile")}
            className="text-amber-600 border-amber-200 hover:bg-amber-50"
          >
            View Profile
          </Button>
          <Button
            variant="outline"
            onClick={() => setLocation("/seller/settings")}
            className="text-amber-600 border-amber-200 hover:bg-amber-50"
          >
            View Settings
          </Button>
        </CardFooter>
      </Card>
    );
  }

  // If seller is approved (sellerStatus?.approved is true)
  return (
    <div className="space-y-6">
      {/* Show small approved notification on some pages */}
      {!location.includes("/seller/dashboard") &&
        !location.includes("/seller/profile") && (
          <div className="flex items-center gap-2 p-3 bg-green-50 rounded-md border border-green-100 mb-4">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            <span className="text-sm text-green-700 font-medium">
              Your seller account is approved and active
            </span>
          </div>
        )}
      {children}
    </div>
  );
}
