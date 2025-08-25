import { ReactNode, useEffect } from "react";
import { Redirect } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useSellerAgreement } from "@/hooks/use-seller-agreement";
import { AgreementModal } from "./agreement-modal";
import { Loader2 } from "lucide-react";

interface SellerPortalLayoutProps {
  children: ReactNode;
}

export function SellerPortalLayout({ children }: SellerPortalLayoutProps) {
  const { user, isLoading: authLoading } = useAuth();
  const { 
    agreementStatus, 
    latestAgreement, 
    showAgreementModal, 
    setShowAgreementModal, 
    acceptAgreement, 
    isAccepting,
    isLoading: agreementLoading
  } = useSellerAgreement();

  // Force check for agreement status on component mount
  useEffect(() => {
    // This effect will trigger the agreement check when needed
  }, []);

  // Show loading state while checking authentication and agreement status
  if (authLoading || agreementLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <span className="ml-2">Loading...</span>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!user) {
    return <Redirect to="/auth" />;
  }

  // Redirect to home page if not a seller
  if (user.role !== "seller") {
    return <Redirect to="/" />;
  }

  return (
    <>
      {/* Agreement Modal - will only show if agreement status requires it */}
      <AgreementModal
        open={showAgreementModal}
        onOpenChange={setShowAgreementModal}
        agreement={latestAgreement}
        onAccept={acceptAgreement}
        isAccepting={isAccepting}
        canClose={false} // Prevent closing without acceptance
      />

      {/* Seller Portal Content */}
      <div className="container mx-auto py-6 px-4">
        {children}
      </div>
    </>
  );
}