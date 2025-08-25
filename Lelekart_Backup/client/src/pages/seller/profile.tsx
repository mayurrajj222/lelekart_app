import { useState, useEffect, useContext } from "react";
import { useAuth, AuthContext } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { SellerDashboardLayout } from "@/components/layout/seller-dashboard-layout";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Upload,
  Edit2,
  FileText,
  ChevronRight,
  Building2,
  CreditCard,
  Shield,
  TrendingUp,
  Clock,
  Award,
  Save,
  Calendar,
  Clipboard,
  Briefcase,
  Check,
  AlertCircle,
  FileUp,
  User,
  X,
  Loader,
  CheckCircle,
} from "lucide-react";
import { User as UserType } from "@shared/schema";
import { useLocation } from "wouter";
import PublicSellerProfilePage from "./public-profile";

const SellerProfilePage = () => {
  // Auth-related setup
  const authContext = useContext(AuthContext);
  const [location, setLocation] = useLocation();

  // Get user data from direct API if context is not available
  const { data: apiUser, isLoading: apiLoading } = useQuery<UserType | null>({
    queryKey: ["/api/user"],
    queryFn: async () => {
      const res = await fetch("/api/user", {
        credentials: "include",
      });

      if (!res.ok) {
        if (res.status === 401) return null;
        throw new Error("Failed to fetch user");
      }

      return res.json();
    },
    staleTime: 60000, // 1 minute
  });

  // Use context user if available, otherwise use API user
  const user = authContext?.user || apiUser;
  const isLoadingUser = authContext ? authContext.isLoading : apiLoading;

  // UI state and utilities
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Read tab from query string for initial tab selection
  const getInitialTab = () => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const tab = params.get("tab");
      if (
        tab === "banking" ||
        tab === "business-details" ||
        tab === "documents" ||
        tab === "performance" ||
        tab === "compliance"
      ) {
        return tab;
      }
    }
    return "business-details";
  };
  const [activeTab, setActiveTab] = useState(getInitialTab());

  // Modal states
  const [isUploadDocumentOpen, setIsUploadDocumentOpen] = useState(false);
  const [isEditBusinessOpen, setIsEditBusinessOpen] = useState(false);
  const [isEditBankingOpen, setIsEditBankingOpen] = useState(false);

  // Form states
  const [documentType, setDocumentType] = useState("");
  const [documentFile, setDocumentFile] = useState<File | null>(null);
  const [isUploadingProfileImage, setIsUploadingProfileImage] = useState(false);

  const [businessDetails, setBusinessDetails] = useState({
    businessName: "",
    gstNumber: "",
    panNumber: "",
    businessType: "",
  });

  const [bankingInfo, setBankingInfo] = useState({
    accountHolderName: "",
    accountNumber: "",
    bankName: "",
    ifscCode: "",
  });

  // Query for seller status to check if approved
  const { data: sellerStatus, isLoading: isLoadingStatus } = useQuery({
    queryKey: ["/api/seller/status"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/seller/status");
      return await res.json();
    },
  });

  // Query for seller documents
  const { data: documents, isLoading: isLoadingDocuments } = useQuery({
    queryKey: ["/api/seller/documents"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/seller/documents");
      return await res.json();
    },
  });

  // Query for business details
  const { data: businessData, isLoading: isLoadingBusiness } = useQuery({
    queryKey: ["/api/seller/business-details"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/seller/business-details");
      return await res.json();
    },
  });

  // Query for banking information
  const { data: bankingData, isLoading: isLoadingBanking } = useQuery({
    queryKey: ["/api/seller/banking-information"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/seller/banking-information");
      return await res.json();
    },
  });

  // Query for seller dashboard summary/metrics
  const { data: dashboardSummary, isLoading: isLoadingSummary } = useQuery({
    queryKey: ["/api/seller/dashboard-summary"],
    queryFn: async () => {
      try {
        console.log("Fetching seller dashboard summary for profile page");
        const res = await apiRequest("GET", "/api/seller/dashboard-summary");
        return await res.json();
      } catch (error) {
        console.error("Error fetching dashboard summary:", error);
        return {
          totalRevenue: 0,
          totalOrders: 0,
          totalReturns: 0,
          totalProducts: 0,
        };
      }
    },
  });

  // Update useEffect to populate form states when data is loaded
  useEffect(() => {
    if (businessData) {
      setBusinessDetails({
        businessName: businessData.businessName || "",
        gstNumber: businessData.gstNumber || "",
        panNumber: businessData.panNumber || "",
        businessType: businessData.businessType || "",
      });
    }
  }, [businessData]);

  useEffect(() => {
    if (bankingData) {
      setBankingInfo({
        accountHolderName: bankingData.accountHolderName || "",
        accountNumber: bankingData.accountNumber || "",
        bankName: bankingData.bankName || "",
        ifscCode: bankingData.ifscCode || "",
      });
    }
  }, [bankingData]);

  // Mutations
  const uploadDocumentMutation = useMutation({
    mutationFn: async () => {
      if (!documentFile || !documentType) {
        throw new Error("Missing document file or type");
      }

      const formData = new FormData();
      formData.append("document", documentFile);
      formData.append("documentType", documentType);

      const res = await fetch("/api/seller/documents", {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to upload document");
      }

      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Document Uploaded",
        description: "Your document has been uploaded successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/seller/documents"] });
      setIsUploadDocumentOpen(false);
      setDocumentFile(null);
      setDocumentType("");
    },
    onError: (error) => {
      toast({
        title: "Upload Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Document download handler
  const handleDownloadDocument = async (documentId: number) => {
    try {
      const res = await fetch(`/api/seller/documents/${documentId}/download`, {
        method: "GET",
        credentials: "include",
      });

      if (!res.ok) {
        throw new Error("Failed to get download URL");
      }

      const data = await res.json();

      if (data.downloadUrl) {
        // Open the download URL in a new tab
        window.open(data.downloadUrl, "_blank");
      } else {
        throw new Error("Download URL not found in the response");
      }
    } catch (error) {
      console.error("Error downloading document:", error);
      toast({
        title: "Download Failed",
        description: "Unable to download the document. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Document delete mutation
  const deleteDocumentMutation = useMutation({
    mutationFn: async (documentId: number) => {
      const res = await apiRequest(
        "DELETE",
        `/api/seller/documents/${documentId}`
      );

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to delete document");
      }

      return true;
    },
    onSuccess: () => {
      toast({
        title: "Document Deleted",
        description: "Your document has been deleted successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/seller/documents"] });
    },
    onError: (error) => {
      toast({
        title: "Delete Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Document delete handler with confirmation
  const handleDeleteDocument = (documentId: number) => {
    // Show confirmation dialog before deletion
    if (
      confirm(
        "Are you sure you want to delete this document? This action cannot be undone."
      )
    ) {
      deleteDocumentMutation.mutate(documentId);
    }
  };

  const updateBusinessDetailsMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest(
        "PUT",
        "/api/seller/business-details",
        businessDetails
      );
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to update business details");
      }
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Business Details Updated",
        description: "Your business details have been updated successfully.",
      });
      queryClient.invalidateQueries({
        queryKey: ["/api/seller/business-details"],
      });
      setIsEditBusinessOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Update Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateBankingInfoMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest(
        "PUT",
        "/api/seller/banking-information",
        bankingInfo
      );
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(
          errorData.error || "Failed to update banking information"
        );
      }
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Banking Information Updated",
        description: "Your banking information has been updated successfully.",
      });
      queryClient.invalidateQueries({
        queryKey: ["/api/seller/banking-information"],
      });
      setIsEditBankingOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Update Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setDocumentFile(e.target.files[0]);
    }
  };

  const handleBusinessInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setBusinessDetails((prev) => ({ ...prev, [name]: value }));
  };

  const handleBankingInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setBankingInfo((prev) => ({ ...prev, [name]: value }));
  };

  const handleUploadDocument = (e: React.FormEvent) => {
    e.preventDefault();
    uploadDocumentMutation.mutate();
  };

  const handleUpdateBusinessDetails = (e: React.FormEvent) => {
    e.preventDefault();
    updateBusinessDetailsMutation.mutate();
  };

  const handleUpdateBankingInfo = (e: React.FormEvent) => {
    e.preventDefault();
    updateBankingInfoMutation.mutate();
  };

  // Profile image upload mutation
  const uploadProfileImageMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("profileImage", file);

      try {
        console.log("Uploading profile image...");
        const res = await fetch("/api/user/profile-image", {
          method: "POST",
          body: formData,
          credentials: "include",
        });

        // First check if response is JSON
        const contentType = res.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
          console.error("Non-JSON response from server:", await res.text());
          throw new Error("Server returned an invalid response format");
        }

        const data = await res.json();

        if (!res.ok) {
          throw new Error(
            data.error || data.details || "Failed to upload profile image"
          );
        }

        return data;
      } catch (err) {
        console.error("Profile image upload error:", err);
        throw err; // Re-throw to be caught by onError
      }
    },
    onSuccess: (data) => {
      toast({
        title: "Profile Image Updated",
        description: "Your profile image has been updated successfully.",
      });

      // Update the user data in the queryClient cache
      queryClient.setQueryData(["/api/user"], (oldData: any) => {
        if (oldData) {
          return {
            ...oldData,
            profileImage: data.profileImage,
          };
        }
        return oldData;
      });

      setIsUploadingProfileImage(false);
    },
    onError: (error) => {
      toast({
        title: "Upload Failed",
        description:
          error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
      setIsUploadingProfileImage(false);
    },
  });

  // Profile image change handler
  const handleProfileImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];

      // Validate file type
      if (!file.type.startsWith("image/")) {
        toast({
          title: "Invalid File Type",
          description: "Please select an image file (jpg, png, etc.)",
          variant: "destructive",
        });
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File Too Large",
          description: "Profile image must be less than 5MB",
          variant: "destructive",
        });
        return;
      }

      setIsUploadingProfileImage(true);
      uploadProfileImageMutation.mutate(file);
    }
  };

  const [showPublicProfile, setShowPublicProfile] = useState(false);

  // Show loading state while fetching user data
  if (isLoadingUser) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  // If no user (not authenticated) or wrong role, redirect to auth page
  if (!user || user.role !== "seller") {
    setLocation("/auth");
    return null;
  }

  return (
    <SellerDashboardLayout>
      <div className="min-h-screen bg-background">
        {/* Header section */}
        <div className="bg-gradient-to-r from-primary/5 to-primary/10 border-b">
          <div className="container py-6 md:py-8">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="relative group">
                  <Avatar className="h-16 w-16 md:h-20 md:w-20">
                    <AvatarImage
                      src={user?.profileImage}
                      alt={user?.username}
                    />
                    <AvatarFallback className="bg-primary/10 text-primary text-xl">
                      {user?.username?.charAt(0)?.toUpperCase() || "S"}
                    </AvatarFallback>
                  </Avatar>
                  <div
                    className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                    onClick={() => {
                      if (!isUploadingProfileImage) {
                        const fileInput = document.getElementById(
                          "profile-image-upload"
                        ) as HTMLInputElement;
                        if (fileInput) {
                          fileInput.click();
                        }
                      }
                    }}
                  >
                    {isUploadingProfileImage ? (
                      <div className="animate-spin h-6 w-6 border-2 border-white border-t-transparent rounded-full" />
                    ) : (
                      <Upload className="h-6 w-6 text-white" />
                    )}
                  </div>
                  <label htmlFor="profile-image-upload" className="sr-only">
                    Upload profile image
                  </label>
                  <input
                    type="file"
                    id="profile-image-upload"
                    className="hidden"
                    accept="image/*"
                    onChange={handleProfileImageChange}
                    title="Upload profile image"
                  />
                </div>
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold">
                    {user?.username}
                  </h1>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center text-muted-foreground mt-1 gap-1 sm:gap-2">
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-1" />
                      <span className="text-sm">Member since April 2023</span>
                    </div>
                    {user?.approved && (
                      <Badge
                        variant="outline"
                        className="bg-green-50 text-green-700 border-green-200 text-xs"
                      >
                        <Check className="h-3 w-3 mr-1" /> Verified
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 w-full md:w-auto">
                <Button
                  variant="outline"
                  className="gap-1 text-xs md:text-sm w-full md:w-auto"
                  onClick={() => setShowPublicProfile((v) => !v)}
                >
                  <User className="h-4 w-4" />
                  <span className="hidden sm:inline">
                    {showPublicProfile
                      ? "Hide Public Profile"
                      : "View Public Profile"}
                  </span>
                  <span className="sm:hidden">
                    {showPublicProfile ? "Hide Profile" : "View Profile"}
                  </span>
                </Button>
              </div>
            </div>

            {showPublicProfile && (
              <div className="my-6 md:my-8">
                <PublicSellerProfilePage
                  embedded
                  sellerId={user?.id?.toString()}
                />
              </div>
            )}

            {/* Navigation tabs */}
            <div className="mt-4 md:mt-6 flex space-x-1 overflow-x-auto pb-1 scrollbar-hide">
              <Button
                variant={activeTab === "business-details" ? "default" : "ghost"}
                className="rounded-full gap-1 md:gap-2 font-medium text-xs md:text-sm whitespace-nowrap"
                onClick={() => setActiveTab("business-details")}
              >
                <Building2 className="h-3 w-3 md:h-4 md:w-4" />
                <span className="hidden sm:inline">Business Details</span>
                <span className="sm:hidden">Business</span>
              </Button>
              <Button
                variant={activeTab === "banking" ? "default" : "ghost"}
                className="rounded-full gap-1 md:gap-2 font-medium text-xs md:text-sm whitespace-nowrap"
                onClick={() => setActiveTab("banking")}
              >
                <CreditCard className="h-3 w-3 md:h-4 md:w-4" />
                <span className="hidden sm:inline">Banking Information</span>
                <span className="sm:hidden">Banking</span>
              </Button>
              <Button
                variant={activeTab === "documents" ? "default" : "ghost"}
                className="rounded-full gap-1 md:gap-2 font-medium text-xs md:text-sm whitespace-nowrap"
                onClick={() => setActiveTab("documents")}
              >
                <FileText className="h-3 w-3 md:h-4 md:w-4" />
                <span className="hidden sm:inline">Documents</span>
                <span className="sm:hidden">Docs</span>
              </Button>
              <Button
                variant={activeTab === "performance" ? "default" : "ghost"}
                className="rounded-full gap-1 md:gap-2 font-medium text-xs md:text-sm whitespace-nowrap"
                onClick={() => setActiveTab("performance")}
              >
                <TrendingUp className="h-3 w-3 md:h-4 md:w-4" />
                <span className="hidden sm:inline">Performance</span>
                <span className="sm:hidden">Stats</span>
              </Button>
              <Button
                variant={activeTab === "compliance" ? "default" : "ghost"}
                className="rounded-full gap-1 md:gap-2 font-medium text-xs md:text-sm whitespace-nowrap"
                onClick={() => setActiveTab("compliance")}
              >
                <Shield className="h-3 w-3 md:h-4 md:w-4" />
                <span className="hidden sm:inline">Compliance</span>
                <span className="sm:hidden">Compliance</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Content area */}
        <div className="container py-4 md:py-8 px-4 md:px-0">
          {/* Business Details Section */}
          {activeTab === "business-details" && (
            <div className="space-y-4 md:space-y-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl md:text-2xl font-semibold flex items-center">
                    <Building2 className="h-4 w-4 md:h-5 md:w-5 mr-2 text-primary" />
                    Business Details
                  </h2>
                  <p className="text-sm md:text-base text-muted-foreground mt-1">
                    Manage your business registration information
                  </p>
                </div>
                <Button
                  onClick={() => setIsEditBusinessOpen(true)}
                  variant="outline"
                  className="gap-2 text-xs md:text-sm w-full sm:w-auto"
                >
                  <Edit2 className="h-4 w-4" /> Edit Details
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                <div className="bg-card rounded-xl border shadow-sm overflow-hidden">
                  <div className="bg-muted/50 px-4 md:px-6 py-3 md:py-4 border-b flex items-center justify-between">
                    <div className="flex items-center">
                      <Briefcase className="h-4 w-4 md:h-5 md:w-5 mr-2 text-primary" />
                      <h3 className="font-medium text-sm md:text-base">
                        Business Information
                      </h3>
                    </div>
                    <Badge
                      variant="outline"
                      className="bg-primary/5 text-primary text-xs"
                    >
                      Essential
                    </Badge>
                  </div>

                  {isLoadingBusiness ? (
                    <div className="px-4 md:px-6 py-4 space-y-4">
                      <div className="animate-pulse space-y-2">
                        <div className="h-4 bg-muted rounded w-1/4"></div>
                        <div className="h-6 bg-muted rounded w-3/4"></div>
                      </div>
                      <div className="animate-pulse space-y-2">
                        <div className="h-4 bg-muted rounded w-1/4"></div>
                        <div className="h-6 bg-muted rounded w-2/3"></div>
                      </div>
                      <div className="animate-pulse space-y-2">
                        <div className="h-4 bg-muted rounded w-1/4"></div>
                        <div className="h-6 bg-muted rounded w-1/2"></div>
                      </div>
                    </div>
                  ) : (
                    <div className="divide-y">
                      <div className="px-4 md:px-6 py-3 md:py-4 flex flex-col sm:flex-row sm:items-center justify-between">
                        <div>
                          <p className="text-xs md:text-sm font-medium text-muted-foreground">
                            Business Name
                          </p>
                          <p className="text-sm md:text-lg">
                            {businessData?.businessName || "Not provided"}
                          </p>
                        </div>
                      </div>

                      <div className="px-4 md:px-6 py-3 md:py-4 flex flex-col sm:flex-row sm:items-center justify-between">
                        <div>
                          <p className="text-xs md:text-sm font-medium text-muted-foreground">
                            Business Type
                          </p>
                          <p className="text-sm md:text-lg">
                            {businessData?.businessType || "Not specified"}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="bg-card rounded-xl border shadow-sm overflow-hidden">
                  <div className="bg-muted/50 px-4 md:px-6 py-3 md:py-4 border-b flex items-center justify-between">
                    <div className="flex items-center">
                      <Clipboard className="h-4 w-4 md:h-5 md:w-5 mr-2 text-primary" />
                      <h3 className="font-medium text-sm md:text-base">
                        Tax Information
                      </h3>
                    </div>
                    <Badge
                      variant="outline"
                      className="bg-primary/5 text-primary text-xs"
                    >
                      Required
                    </Badge>
                  </div>

                  {isLoadingBusiness ? (
                    <div className="px-4 md:px-6 py-4 space-y-4">
                      <div className="animate-pulse space-y-2">
                        <div className="h-4 bg-muted rounded w-1/4"></div>
                        <div className="h-6 bg-muted rounded w-3/4"></div>
                      </div>
                      <div className="animate-pulse space-y-2">
                        <div className="h-4 bg-muted rounded w-1/4"></div>
                        <div className="h-6 bg-muted rounded w-2/3"></div>
                      </div>
                      <div className="animate-pulse space-y-2">
                        <div className="h-4 bg-muted rounded w-1/4"></div>
                        <div className="h-6 bg-muted rounded w-1/2"></div>
                      </div>
                    </div>
                  ) : (
                    <div className="divide-y">
                      <div className="px-4 md:px-6 py-3 md:py-4 flex flex-col sm:flex-row sm:items-center justify-between">
                        <div>
                          <p className="text-xs md:text-sm font-medium text-muted-foreground">
                            GST Number
                          </p>
                          <p className="text-sm md:text-lg">
                            {businessData?.gstNumber || "Not provided"}
                          </p>
                        </div>
                      </div>

                      <div className="px-4 md:px-6 py-3 md:py-4 flex flex-col sm:flex-row sm:items-center justify-between">
                        <div>
                          <p className="text-xs md:text-sm font-medium text-muted-foreground">
                            PAN Number
                          </p>
                          <p className="text-sm md:text-lg">
                            {businessData?.panNumber || "Not provided"}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Banking Information Section */}
          {activeTab === "banking" && (
            <div className="space-y-4 md:space-y-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl md:text-2xl font-semibold flex items-center">
                    <CreditCard className="h-4 w-4 md:h-5 md:w-5 mr-2 text-primary" />
                    Banking Information
                  </h2>
                  <p className="text-sm md:text-base text-muted-foreground mt-1">
                    Manage your payment processing details
                  </p>
                </div>
                <Button
                  onClick={() => setIsEditBankingOpen(true)}
                  variant="outline"
                  className="gap-2 text-xs md:text-sm w-full sm:w-auto"
                >
                  <Edit2 className="h-4 w-4" /> Edit Details
                </Button>
              </div>

              <div className="bg-card rounded-xl border shadow-sm overflow-hidden">
                <div className="bg-muted/50 px-4 md:px-6 py-3 md:py-4 border-b flex items-center justify-between">
                  <div className="flex items-center">
                    <CreditCard className="h-4 w-4 md:h-5 md:w-5 mr-2 text-primary" />
                    <h3 className="font-medium text-sm md:text-base">
                      Account Information
                    </h3>
                  </div>
                  <Badge
                    variant="outline"
                    className="bg-primary/5 text-primary text-xs"
                  >
                    Confidential
                  </Badge>
                </div>

                {isLoadingBanking ? (
                  <div className="px-4 md:px-6 py-4 space-y-4">
                    <div className="animate-pulse space-y-2">
                      <div className="h-4 bg-muted rounded w-1/4"></div>
                      <div className="h-6 bg-muted rounded w-3/4"></div>
                    </div>
                    <div className="animate-pulse space-y-2">
                      <div className="h-4 bg-muted rounded w-1/4"></div>
                      <div className="h-6 bg-muted rounded w-2/3"></div>
                    </div>
                    <div className="animate-pulse space-y-2">
                      <div className="h-4 bg-muted rounded w-1/4"></div>
                      <div className="h-6 bg-muted rounded w-1/2"></div>
                    </div>
                  </div>
                ) : (
                  <div className="divide-y">
                    <div className="px-4 md:px-6 py-3 md:py-4 flex flex-col sm:flex-row sm:items-center justify-between">
                      <div>
                        <p className="text-xs md:text-sm font-medium text-muted-foreground">
                          Account Holder Name
                        </p>
                        <p className="text-sm md:text-lg">
                          {bankingData?.accountHolderName || "Not provided"}
                        </p>
                      </div>
                    </div>

                    <div className="px-4 md:px-6 py-3 md:py-4 flex flex-col sm:flex-row sm:items-center justify-between">
                      <div>
                        <p className="text-xs md:text-sm font-medium text-muted-foreground">
                          Bank Name
                        </p>
                        <p className="text-sm md:text-lg">
                          {bankingData?.bankName || "Not provided"}
                        </p>
                      </div>
                    </div>

                    <div className="px-4 md:px-6 py-3 md:py-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs md:text-sm font-medium text-muted-foreground">
                          Account Number
                        </p>
                        <p className="text-sm md:text-lg">
                          {bankingData?.accountNumber
                            ? `••••••••${bankingData.accountNumber.slice(-4)}`
                            : "Not provided"}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs md:text-sm font-medium text-muted-foreground">
                          IFSC Code
                        </p>
                        <p className="text-sm md:text-lg">
                          {bankingData?.ifscCode || "Not provided"}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="p-3 md:p-4 bg-primary/5 rounded-lg border border-primary/10">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-4 w-4 md:h-5 md:w-5 text-primary mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-medium text-sm md:text-base">
                      Security Notice
                    </h4>
                    <p className="text-xs md:text-sm text-muted-foreground mt-1">
                      Your banking information is encrypted and securely stored.
                      We never share these details with third parties.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Documents Section */}
          {activeTab === "documents" && (
            <div className="space-y-4 md:space-y-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl md:text-2xl font-semibold flex items-center">
                    <FileText className="h-4 w-4 md:h-5 md:w-5 mr-2 text-primary" />
                    Documents
                  </h2>
                  <p className="text-sm md:text-base text-muted-foreground mt-1">
                    Upload and manage verification documents
                  </p>
                </div>
                {/* Only show upload button if seller is not approved */}
                {(!sellerStatus || !sellerStatus.approved) && (
                  <Button
                    onClick={() => setIsUploadDocumentOpen(true)}
                    variant="outline"
                    className="gap-2 text-xs md:text-sm w-full sm:w-auto"
                  >
                    <FileUp className="h-4 w-4" /> Upload Document
                  </Button>
                )}
              </div>

              {/* If seller is approved, show approval message */}
              {sellerStatus && sellerStatus.approved && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3 md:p-4 mb-4">
                  <div className="flex items-start">
                    <CheckCircle className="h-4 w-4 md:h-5 md:w-5 text-green-600 mr-3 mt-0.5 flex-shrink-0" />
                    <div>
                      <h3 className="font-medium text-green-800 mb-1 text-sm md:text-base">
                        Documents Approved
                      </h3>
                      <p className="text-green-700 text-xs md:text-sm">
                        Your seller documents have been verified and approved.
                        No additional documents are required at this time.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* If seller is pending approval with documents, show pending message */}
              {(!sellerStatus || !sellerStatus.approved) &&
                documents &&
                documents.length > 0 && (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 md:p-4 mb-4">
                    <div className="flex items-start">
                      <Clock className="h-4 w-4 md:h-5 md:w-5 text-amber-600 mr-3 mt-0.5 flex-shrink-0" />
                      <div>
                        <h3 className="font-medium text-amber-800 mb-1 text-sm md:text-base">
                          Documents Pending Approval
                        </h3>
                        <p className="text-amber-700 text-xs md:text-sm">
                          Your documents are currently being reviewed by our
                          team. This process typically takes 1-2 business days.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

              <div className="bg-card rounded-xl border shadow-sm overflow-hidden">
                {isLoadingDocuments ? (
                  <div className="p-4 md:p-6 space-y-4">
                    <div className="animate-pulse space-y-2">
                      <div className="h-10 bg-muted rounded"></div>
                    </div>
                    <div className="animate-pulse space-y-2">
                      <div className="h-10 bg-muted rounded"></div>
                    </div>
                  </div>
                ) : documents && documents.length > 0 ? (
                  <div className="divide-y">
                    {documents.map((doc: any, index: number) => (
                      <div
                        key={doc.id}
                        className="p-3 md:p-4 hover:bg-muted/30 transition-colors"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 md:h-10 md:w-10 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0">
                              <FileText className="h-4 w-4 md:h-5 md:w-5 text-primary" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="font-medium text-sm md:text-base">
                                {doc.documentType}
                              </p>
                              <p className="text-xs md:text-sm text-muted-foreground">
                                {new Date(doc.uploadedAt).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge
                              className={
                                sellerStatus && sellerStatus.approved
                                  ? "bg-green-100 text-green-800 hover:bg-green-100 text-xs"
                                  : "bg-amber-100 text-amber-800 hover:bg-amber-100 text-xs"
                              }
                            >
                              {sellerStatus && sellerStatus.approved
                                ? "Approved"
                                : "Pending"}
                            </Badge>
                            <div className="flex gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0"
                                onClick={() => handleDownloadDocument(doc.id)}
                              >
                                <ChevronRight className="h-4 w-4" />
                              </Button>
                              {(!sellerStatus || !sellerStatus.approved) && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0 text-red-500 hover:text-red-600"
                                  onClick={() => handleDeleteDocument(doc.id)}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-6 text-center">
                    <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                    <h3 className="font-medium text-sm md:text-base mb-1">
                      No documents uploaded
                    </h3>
                    <p className="text-xs md:text-sm text-muted-foreground mb-4">
                      Upload your business documents to complete the
                      verification process.
                    </p>
                    {(!sellerStatus || !sellerStatus.approved) && (
                      <Button
                        onClick={() => setIsUploadDocumentOpen(true)}
                        variant="outline"
                        className="gap-2 text-xs md:text-sm"
                      >
                        <FileUp className="h-4 w-4" /> Upload First Document
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Performance Section */}
          {activeTab === "performance" && (
            <div className="space-y-4 md:space-y-6">
              <div>
                <h2 className="text-xl md:text-2xl font-semibold flex items-center">
                  <TrendingUp className="h-4 w-4 md:h-5 md:w-5 mr-2 text-primary" />
                  Performance Metrics
                </h2>
                <p className="text-sm md:text-base text-muted-foreground mt-1">
                  Track your business performance and growth
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                <div className="bg-card rounded-xl border shadow-sm p-4 md:p-6">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm md:text-base font-medium">
                      Total Revenue
                    </h3>
                    <TrendingUp className="h-4 w-4 md:h-5 md:w-5 text-green-600" />
                  </div>
                  <p className="text-2xl md:text-3xl font-bold">
                    ₹{dashboardSummary?.totalRevenue?.toLocaleString() || "0"}
                  </p>
                  <p className="text-xs md:text-sm text-muted-foreground mt-1">
                    Lifetime earnings
                  </p>
                </div>

                <div className="bg-card rounded-xl border shadow-sm p-4 md:p-6">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm md:text-base font-medium">
                      Total Orders
                    </h3>
                    <Award className="h-4 w-4 md:h-5 md:w-5 text-blue-600" />
                  </div>
                  <p className="text-2xl md:text-3xl font-bold">
                    {dashboardSummary?.totalOrders?.toLocaleString() || "0"}
                  </p>
                  <p className="text-xs md:text-sm text-muted-foreground mt-1">
                    Orders processed
                  </p>
                </div>

                <div className="bg-card rounded-xl border shadow-sm p-4 md:p-6">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm md:text-base font-medium">
                      Total Products
                    </h3>
                    <Building2 className="h-4 w-4 md:h-5 md:w-5 text-purple-600" />
                  </div>
                  <p className="text-2xl md:text-3xl font-bold">
                    {dashboardSummary?.totalProducts?.toLocaleString() || "0"}
                  </p>
                  <p className="text-xs md:text-sm text-muted-foreground mt-1">
                    Active listings
                  </p>
                </div>

                <div className="bg-card rounded-xl border shadow-sm p-4 md:p-6">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm md:text-base font-medium">
                      Returns
                    </h3>
                    <AlertCircle className="h-4 w-4 md:h-5 md:w-5 text-amber-600" />
                  </div>
                  <p className="text-2xl md:text-3xl font-bold">
                    {dashboardSummary?.totalReturns?.toLocaleString() || "0"}
                  </p>
                  <p className="text-xs md:text-sm text-muted-foreground mt-1">
                    Return requests
                  </p>
                </div>
              </div>

              <div className="bg-card rounded-xl border shadow-sm p-4 md:p-6">
                <h3 className="text-lg md:text-xl font-semibold mb-4">
                  Performance Insights
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 md:p-4 bg-muted/30 rounded-lg">
                    <div>
                      <p className="text-sm md:text-base font-medium">
                        Average Order Value
                      </p>
                      <p className="text-xs md:text-sm text-muted-foreground">
                        Last 30 days
                      </p>
                    </div>
                    <p className="text-lg md:text-xl font-bold">
                      ₹
                      {dashboardSummary?.totalRevenue &&
                      dashboardSummary?.totalOrders
                        ? Math.round(
                            dashboardSummary.totalRevenue /
                              dashboardSummary.totalOrders
                          ).toLocaleString()
                        : "0"}
                    </p>
                  </div>

                  <div className="flex items-center justify-between p-3 md:p-4 bg-muted/30 rounded-lg">
                    <div>
                      <p className="text-sm md:text-base font-medium">
                        Return Rate
                      </p>
                      <p className="text-xs md:text-sm text-muted-foreground">
                        Percentage of orders returned
                      </p>
                    </div>
                    <p className="text-lg md:text-xl font-bold">
                      {dashboardSummary?.totalOrders &&
                      dashboardSummary?.totalReturns
                        ? Math.round(
                            (dashboardSummary.totalReturns /
                              dashboardSummary.totalOrders) *
                              100
                          )
                        : "0"}
                      %
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Compliance Section */}
          {activeTab === "compliance" && (
            <div className="space-y-4 md:space-y-6">
              <div>
                <h2 className="text-xl md:text-2xl font-semibold flex items-center">
                  <Shield className="h-4 w-4 md:h-5 md:w-5 mr-2 text-primary" />
                  Compliance & Verification
                </h2>
                <p className="text-sm md:text-base text-muted-foreground mt-1">
                  Track your compliance status and verification progress
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                <div className="bg-card rounded-xl border shadow-sm overflow-hidden">
                  <div className="bg-muted/50 px-4 md:px-6 py-3 md:py-4 border-b flex items-center justify-between">
                    <div className="flex items-center">
                      <Shield className="h-4 w-4 md:h-5 md:w-5 mr-2 text-primary" />
                      <h3 className="font-medium text-sm md:text-base">
                        Verification Status
                      </h3>
                    </div>
                    <Badge
                      variant="outline"
                      className={
                        sellerStatus?.approved
                          ? "bg-green-50 text-green-700 border-green-200 text-xs"
                          : "bg-amber-50 text-amber-700 border-amber-200 text-xs"
                      }
                    >
                      {sellerStatus?.approved ? "Verified" : "Pending"}
                    </Badge>
                  </div>

                  <div className="p-4 md:p-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm md:text-base">
                        Business Details
                      </span>
                      <Badge
                        variant="outline"
                        className="bg-green-50 text-green-700 border-green-200 text-xs"
                      >
                        Complete
                      </Badge>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm md:text-base">
                        Banking Information
                      </span>
                      <Badge
                        variant="outline"
                        className="bg-green-50 text-green-700 border-green-200 text-xs"
                      >
                        Complete
                      </Badge>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm md:text-base">
                        Document Verification
                      </span>
                      <Badge
                        variant="outline"
                        className={
                          sellerStatus?.approved
                            ? "bg-green-50 text-green-700 border-green-200 text-xs"
                            : "bg-amber-50 text-amber-700 border-amber-200 text-xs"
                        }
                      >
                        {sellerStatus?.approved ? "Approved" : "Pending"}
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className="bg-card rounded-xl border shadow-sm overflow-hidden">
                  <div className="bg-muted/50 px-4 md:px-6 py-3 md:py-4 border-b flex items-center justify-between">
                    <div className="flex items-center">
                      <CheckCircle className="h-4 w-4 md:h-5 md:w-5 mr-2 text-primary" />
                      <h3 className="font-medium text-sm md:text-base">
                        Requirements
                      </h3>
                    </div>
                    <Badge
                      variant="outline"
                      className="bg-primary/5 text-primary text-xs"
                    >
                      Checklist
                    </Badge>
                  </div>

                  <div className="p-4 md:p-6 space-y-4">
                    <div className="flex items-center gap-3">
                      <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                      <span className="text-sm md:text-base">
                        Valid business registration
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                      <span className="text-sm md:text-base">
                        GST number verification
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                      <span className="text-sm md:text-base">
                        Bank account details
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                      <span className="text-sm md:text-base">
                        Identity verification
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {sellerStatus && sellerStatus.approved ? (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 md:p-6">
                  <div className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-600 mr-3 mt-0.5 flex-shrink-0" />
                    <div>
                      <h3 className="font-medium text-green-800 mb-1 text-sm md:text-base">
                        Verification Complete
                      </h3>
                      <p className="text-green-700 text-xs md:text-sm">
                        Your seller account has been verified and approved. You
                        can now list products and start selling on our platform.
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 md:p-6">
                  <div className="flex items-start">
                    <Clock className="h-5 w-5 text-amber-600 mr-3 mt-0.5 flex-shrink-0" />
                    <div>
                      <h3 className="font-medium text-amber-800 mb-1 text-sm md:text-base">
                        Verification in Progress
                      </h3>
                      <p className="text-amber-700 text-xs md:text-sm">
                        Your verification is being processed. This typically
                        takes 1-2 business days. You'll receive a notification
                        once your account is approved.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Upload Document Dialog */}
      <Dialog
        open={isUploadDocumentOpen}
        onOpenChange={setIsUploadDocumentOpen}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Upload Verification Document</DialogTitle>
            <DialogDescription>
              Upload documents to verify your seller account. Verification
              typically takes 1-2 business days.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleUploadDocument} className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="documentType">Document Type*</Label>
              <Select
                value={documentType}
                onValueChange={setDocumentType}
                required
              >
                <SelectTrigger className="h-11">
                  <SelectValue placeholder="Choose document type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="GST Certificate">
                    GST Certificate
                  </SelectItem>
                  <SelectItem value="PAN Card">PAN Card</SelectItem>
                  <SelectItem value="Business License">
                    Business License
                  </SelectItem>
                  <SelectItem value="Bank Statement">Bank Statement</SelectItem>
                  <SelectItem value="Other">Other Document</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="document">Upload File*</Label>
              <div className="border border-dashed rounded-lg p-4 text-center bg-muted/50">
                <Input
                  id="document"
                  type="file"
                  onChange={handleFileChange}
                  accept=".pdf,.jpg,.jpeg,.png"
                  required
                  className="hidden"
                />
                <label
                  htmlFor="document"
                  className="cursor-pointer flex flex-col items-center"
                >
                  <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                  {documentFile ? (
                    <p className="text-sm font-medium">{documentFile.name}</p>
                  ) : (
                    <>
                      <p className="text-sm font-medium mb-1">
                        Click to select a file
                      </p>
                      <p className="text-xs text-muted-foreground">
                        PDF, JPG, JPEG, PNG (5MB max)
                      </p>
                    </>
                  )}
                </label>
              </div>
            </div>

            <DialogFooter className="pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsUploadDocumentOpen(false)}
                className="gap-2"
              >
                <X className="h-4 w-4" /> Cancel
              </Button>
              <Button
                type="submit"
                disabled={
                  !documentFile ||
                  !documentType ||
                  uploadDocumentMutation.isPending
                }
                className="gap-2"
              >
                {uploadDocumentMutation.isPending ? (
                  <>
                    <Loader className="h-4 w-4 animate-spin" /> Uploading...
                  </>
                ) : (
                  <>
                    <FileUp className="h-4 w-4" /> Upload Document
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Business Details Dialog */}
      <Dialog open={isEditBusinessOpen} onOpenChange={setIsEditBusinessOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Update Business Details</DialogTitle>
            <DialogDescription>
              Provide accurate information about your business to comply with
              regulations.
            </DialogDescription>
          </DialogHeader>

          <form
            onSubmit={handleUpdateBusinessDetails}
            className="space-y-4 py-2"
          >
            <div className="space-y-2">
              <Label htmlFor="businessName">Business Name*</Label>
              <Input
                id="businessName"
                name="businessName"
                placeholder="Enter your official business name"
                value={businessDetails.businessName}
                onChange={handleBusinessInputChange}
                className="h-11"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="businessType">Business Type</Label>
              <Select
                value={businessDetails.businessType}
                onValueChange={(value) =>
                  setBusinessDetails((prev) => ({
                    ...prev,
                    businessType: value,
                  }))
                }
              >
                <SelectTrigger className="h-11">
                  <SelectValue placeholder="Select business structure" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Sole Proprietorship">
                    Sole Proprietorship
                  </SelectItem>
                  <SelectItem value="Partnership">Partnership</SelectItem>
                  <SelectItem value="Limited Liability Company">
                    Limited Liability Company
                  </SelectItem>
                  <SelectItem value="Corporation">Corporation</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="gstNumber">GST Number</Label>
                <Input
                  id="gstNumber"
                  name="gstNumber"
                  placeholder="e.g. 22AAAAA0000A1Z5"
                  value={businessDetails.gstNumber}
                  onChange={handleBusinessInputChange}
                  className="h-11"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="panNumber">PAN Number</Label>
                <Input
                  id="panNumber"
                  name="panNumber"
                  placeholder="e.g. ABCDE1234F"
                  value={businessDetails.panNumber}
                  onChange={handleBusinessInputChange}
                  className="h-11"
                />
              </div>
            </div>

            <DialogFooter className="pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditBusinessOpen(false)}
                className="gap-2"
              >
                <X className="h-4 w-4" /> Cancel
              </Button>
              <Button
                type="submit"
                disabled={
                  !businessDetails.businessName ||
                  updateBusinessDetailsMutation.isPending
                }
                className="gap-2"
              >
                {updateBusinessDetailsMutation.isPending ? (
                  <>
                    <Loader className="h-4 w-4 animate-spin" /> Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" /> Save Changes
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Banking Information Dialog */}
      <Dialog open={isEditBankingOpen} onOpenChange={setIsEditBankingOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Update Banking Information</DialogTitle>
            <DialogDescription>
              This information is used for payments and settlement of your
              sales.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleUpdateBankingInfo} className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="accountHolderName">Account Holder Name*</Label>
              <Input
                id="accountHolderName"
                name="accountHolderName"
                placeholder="Name as it appears on bank account"
                value={bankingInfo.accountHolderName}
                onChange={handleBankingInputChange}
                className="h-11"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bankName">Bank Name*</Label>
              <Input
                id="bankName"
                name="bankName"
                placeholder="e.g. State Bank of India"
                value={bankingInfo.bankName}
                onChange={handleBankingInputChange}
                className="h-11"
                required
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="accountNumber">Account Number*</Label>
                <Input
                  id="accountNumber"
                  name="accountNumber"
                  placeholder="Enter account number"
                  value={bankingInfo.accountNumber}
                  onChange={handleBankingInputChange}
                  className="h-11"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="ifscCode">IFSC Code*</Label>
                <Input
                  id="ifscCode"
                  name="ifscCode"
                  placeholder="e.g. SBIN0000123"
                  value={bankingInfo.ifscCode}
                  onChange={handleBankingInputChange}
                  className="h-11"
                  required
                />
              </div>
            </div>

            <div className="bg-amber-50 text-amber-800 p-3 rounded-md text-sm border border-amber-200 flex items-start gap-2">
              <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <p>
                For security reasons, please verify that all banking details are
                accurate. Incorrect details may lead to payment failures.
              </p>
            </div>

            <DialogFooter className="pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditBankingOpen(false)}
                className="gap-2"
              >
                <X className="h-4 w-4" /> Cancel
              </Button>
              <Button
                type="submit"
                disabled={
                  !bankingInfo.accountHolderName ||
                  !bankingInfo.accountNumber ||
                  !bankingInfo.bankName ||
                  !bankingInfo.ifscCode ||
                  updateBankingInfoMutation.isPending
                }
                className="gap-2"
              >
                {updateBankingInfoMutation.isPending ? (
                  <>
                    <Loader className="h-4 w-4 animate-spin" /> Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" /> Save Changes
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </SellerDashboardLayout>
  );
};

export default SellerProfilePage;
