import { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { SellerAgreement } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface AgreementStatus {
  hasAcceptedLatest: boolean;
  needsToAccept: boolean;
}

export function useSellerAgreement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showAgreementModal, setShowAgreementModal] = useState(false);

  // Fetch agreement status (whether seller has accepted latest agreement)
  const {
    data: agreementStatus,
    isLoading: isStatusLoading,
    refetch: refetchStatus,
  } = useQuery<AgreementStatus>({
    queryKey: ["/api/seller/agreements/status"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/seller/agreements/status");
      return response.json();
    },
    retry: false,
  });

  // Fetch latest agreement content (only if needed)
  const {
    data: latestAgreement,
    isLoading: isAgreementLoading,
    refetch: refetchAgreement,
  } = useQuery<SellerAgreement>({
    queryKey: ["/api/seller/agreements/latest"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/seller/agreements/latest");
      return response.json();
    },
    enabled: !!agreementStatus?.needsToAccept,
    retry: false,
  });

  // Mutation for accepting agreement
  const { mutate: acceptMutation, isPending: isAccepting } = useMutation({
    mutationFn: async (agreementId: number) => {
      const response = await apiRequest("POST", "/api/seller/agreements/accept", {
        agreementId,
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Agreement accepted",
        description: "You have successfully accepted the seller agreement.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/seller/agreements/status"] });
      setShowAgreementModal(false);
    },
    onError: (error: any) => {
      toast({
        title: "Failed to accept agreement",
        description: error.message || "An error occurred. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Check if seller needs to accept agreement and show modal
  useEffect(() => {
    if (agreementStatus?.needsToAccept && latestAgreement) {
      setShowAgreementModal(true);
    }
  }, [agreementStatus, latestAgreement]);

  // Function to accept agreement
  const acceptAgreement = useCallback((agreementId: number) => {
    acceptMutation(agreementId);
  }, [acceptMutation]);

  // Combine loading states
  const isLoading = isStatusLoading || isAgreementLoading;

  // Force refresh agreement data
  const refreshAgreementData = useCallback(async () => {
    await refetchStatus();
    await refetchAgreement();
  }, [refetchStatus, refetchAgreement]);

  return {
    agreementStatus,
    latestAgreement,
    showAgreementModal,
    setShowAgreementModal,
    acceptAgreement,
    isAccepting,
    isLoading,
    refreshAgreementData,
  };
}