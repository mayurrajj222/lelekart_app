import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Helmet } from "react-helmet-async";
import { StaticPageSection } from "@/components/static-page-template";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import {
  Loader2,
  Upload,
  CheckCircle,
  AlertCircle,
  MapPin,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { indianStates, getCitiesByState } from "@/lib/indian-states-cities";

// Validation schemas
const phoneRegex = /^[6-9]\d{9}$/;
const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/;

// Enhanced validation functions
const validateIndianPhone = (phone: string) => {
  // Remove any spaces, dashes, or parentheses
  const cleanPhone = phone.replace(/[\s\-\(\)]/g, "");
  // Check if it's exactly 10 digits and starts with 6-9
  if (cleanPhone.length !== 10) {
    return false;
  }
  return phoneRegex.test(cleanPhone);
};

const validateGST = (gst: string) => {
  // Remove spaces and convert to uppercase
  const cleanGST = gst.replace(/\s/g, "").toUpperCase();
  return gstRegex.test(cleanGST);
};

const validatePAN = (pan: string) => {
  // Remove spaces and convert to uppercase
  const cleanPAN = pan.replace(/\s/g, "").toUpperCase();
  return panRegex.test(cleanPAN);
};

const validateIFSC = (ifsc: string) => {
  // Remove spaces and convert to uppercase
  const cleanIFSC = ifsc.replace(/\s/g, "").toUpperCase();
  return ifscRegex.test(cleanIFSC);
};

const becomeSellerSchema = z.object({
  // Contact Information
  email: z.string().email("Please enter a valid email address"),
  phone: z
    .string()
    .min(10, "Phone number must be exactly 10 digits")
    .max(10, "Phone number must be exactly 10 digits")
    .refine(
      validateIndianPhone,
      "Please enter a valid 10-digit Indian mobile number starting with 6, 7, 8, or 9"
    ),

  // Business Information
  businessName: z
    .string()
    .min(2, "Business name must be at least 2 characters"),
  businessAddress: z
    .string()
    .min(10, "Please enter a complete business address"),
  businessState: z.string().min(1, "Please select a state"),
  businessCity: z.string().min(1, "Please select a city"),
  businessPincode: z
    .string()
    .regex(/^[1-9][0-9]{5}$/, "Please enter a valid 6-digit pincode"),
  businessType: z.enum([
    "individual",
    "sole_proprietorship",
    "llc",
    "partnership",
    "corporation",
    "other",
  ]),
  companyRegistrationNumber: z.string().optional(),

  // Tax Information
  gstNumber: z
    .string()
    .optional()
    .refine((val) => !val || validateGST(val), {
      message: "Please enter a valid GST number",
    }),
  panNumber: z
    .string()
    .optional()
    .refine((val) => !val || validatePAN(val), {
      message: "Please enter a valid PAN number",
    }),

  // Bank Account Information
  bankName: z.string().min(2, "Bank name is required"),
  bankState: z.string().min(1, "Please select a state"),
  bankCity: z.string().min(1, "Please select a city"),
  bankPincode: z
    .string()
    .regex(/^[1-9][0-9]{5}$/, "Please enter a valid 6-digit pincode"),
  accountNumber: z.string().min(9, "Account number must be at least 9 digits"),
  ifscCode: z.string().refine(validateIFSC, "Please enter a valid IFSC code"),

  // Identity Verification
  governmentIdType: z.enum([
    "passport",
    "driving_license",
    "aadhaar",
    "voter_id",
  ]),
  governmentIdNumber: z.string().min(5, "Government ID number is required"),
  governmentIdPhoto: z
    .string()
    .min(1, "Please upload a photo of your government ID"),

  // Terms and Conditions
  agreeToTerms: z
    .boolean()
    .refine(
      (val) => val === true,
      "You must agree to the terms and conditions"
    ),
  agreeToPrivacyPolicy: z
    .boolean()
    .refine((val) => val === true, "You must agree to the privacy policy"),
});

type BecomeSellerFormData = z.infer<typeof becomeSellerSchema>;

export default function BecomeASellerPage() {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [panValidationStatus, setPanValidationStatus] = useState<
    "idle" | "validating" | "valid" | "invalid"
  >("idle");
  const [ifscValidationStatus, setIfscValidationStatus] = useState<
    "idle" | "validating" | "valid" | "invalid"
  >("idle");
  const [businessPincodeValidationStatus, setBusinessPincodeValidationStatus] =
    useState<"idle" | "validating" | "valid" | "invalid">("idle");
  const [bankPincodeValidationStatus, setBankPincodeValidationStatus] =
    useState<"idle" | "validating" | "valid" | "invalid">("idle");
  const [selectedBusinessState, setSelectedBusinessState] = useState("");
  const [selectedBankState, setSelectedBankState] = useState("");
  const [ifscBankData, setIfscBankData] = useState<any>(null);
  const [businessPincodeData, setBusinessPincodeData] = useState<any>(null);
  const [bankPincodeData, setBankPincodeData] = useState<any>(null);
  const [uploadedFileUrl, setUploadedFileUrl] = useState<string>("");
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFileName, setSelectedFileName] = useState<string>("");

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
    trigger,
  } = useForm<BecomeSellerFormData>({
    resolver: zodResolver(becomeSellerSchema),
    defaultValues: {
      businessType: "individual",
      governmentIdType: "aadhaar",
      governmentIdPhoto: "",
      agreeToTerms: false,
      agreeToPrivacyPolicy: false,
    },
  });

  const watchedPanNumber = watch("panNumber");

  // PAN validation function
  const validatePAN = async (panNumber: string) => {
    if (!panNumber || panNumber.length !== 10) return;

    setPanValidationStatus("validating");
    try {
      // You can integrate with a real PAN validation API here
      // For now, we'll simulate validation
      const response = await fetch("/api/validate-pan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ panNumber }),
      });

      if (response.ok) {
        const result = await response.json();
        setPanValidationStatus(result.isValid ? "valid" : "invalid");
      } else {
        setPanValidationStatus("invalid");
      }
    } catch (error) {
      console.error("PAN validation error:", error);
      // If API fails, just validate format locally
      const isValid = validatePAN(panNumber);
      setPanValidationStatus(isValid ? "valid" : "invalid");
    }
  };

  // Debounced PAN validation
  React.useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (watchedPanNumber && watchedPanNumber.length === 10) {
        validatePAN(watchedPanNumber);
      } else {
        setPanValidationStatus("idle");
      }
    }, 1000);

    return () => clearTimeout(timeoutId);
  }, [watchedPanNumber]);

  // IFSC validation function
  const validateIFSC = async (ifscCode: string) => {
    if (!ifscCode || ifscCode.length !== 11) return;

    setIfscValidationStatus("validating");
    try {
      const response = await fetch("/api/validate-ifsc", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ifscCode }),
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          setIfscValidationStatus("valid");
          setIfscBankData(result.data);
          // Auto-fill bank details
          setValue("bankName", result.data.bankName);
          setValue("bankState", result.data.state);
          setValue("bankCity", result.data.city);
          // Note: Razorpay API doesn't provide pincode, so we'll keep it empty
          setSelectedBankState(result.data.state);
        } else {
          setIfscValidationStatus("invalid");
          setIfscBankData(null);
        }
      } else {
        setIfscValidationStatus("invalid");
        setIfscBankData(null);
      }
    } catch (error) {
      console.error("IFSC validation error:", error);
      setIfscValidationStatus("invalid");
      setIfscBankData(null);
    }
  };

  const watchedIfscCode = watch("ifscCode");

  // Debounced IFSC validation
  React.useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (watchedIfscCode && watchedIfscCode.length === 11) {
        validateIFSC(watchedIfscCode);
      } else {
        setIfscValidationStatus("idle");
        setIfscBankData(null);
      }
    }, 1000);

    return () => clearTimeout(timeoutId);
  }, [watchedIfscCode]);

  // Pincode validation function
  const validatePincode = async (
    pincode: string,
    type: "business" | "bank"
  ) => {
    if (!pincode || pincode.length !== 6) return;

    const setValidationStatus =
      type === "business"
        ? setBusinessPincodeValidationStatus
        : setBankPincodeValidationStatus;
    const setPincodeData =
      type === "business" ? setBusinessPincodeData : setBankPincodeData;

    setValidationStatus("validating");
    try {
      const response = await fetch("/api/validate-pincode", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pincode }),
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          setValidationStatus("valid");
          setPincodeData(result.data);
          // Auto-fill state and city
          setValue(`${type}State`, result.data.state);
          setValue(`${type}City`, result.data.city);
          if (type === "business") {
            setSelectedBusinessState(result.data.state);
          } else {
            setSelectedBankState(result.data.state);
          }
        } else {
          setValidationStatus("invalid");
          setPincodeData(null);
        }
      } else {
        setValidationStatus("invalid");
        setPincodeData(null);
      }
    } catch (error) {
      console.error("Pincode validation error:", error);
      setValidationStatus("invalid");
      setPincodeData(null);
    }
  };

  const watchedBusinessPincode = watch("businessPincode");
  const watchedBankPincode = watch("bankPincode");

  // Debounced business pincode validation
  React.useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (watchedBusinessPincode && watchedBusinessPincode.length === 6) {
        validatePincode(watchedBusinessPincode, "business");
      } else {
        setBusinessPincodeValidationStatus("idle");
        setBusinessPincodeData(null);
      }
    }, 1000);

    return () => clearTimeout(timeoutId);
  }, [watchedBusinessPincode]);

  // Debounced bank pincode validation
  React.useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (watchedBankPincode && watchedBankPincode.length === 6) {
        validatePincode(watchedBankPincode, "bank");
      } else {
        setBankPincodeValidationStatus("idle");
        setBankPincodeData(null);
      }
    }, 1000);

    return () => clearTimeout(timeoutId);
  }, [watchedBankPincode]);

  // File upload function using existing upload endpoint
  const handleFileUpload = async (file: File) => {
    // Validate file size (5MB limit)
    const maxSize = 5 * 1024 * 1024; // 5MB in bytes
    if (file.size > maxSize) {
      toast({
        title: "File too large",
        description: "Please select a file smaller than 5MB.",
        variant: "destructive",
      });
      return;
    }

    // Validate file type
    const allowedTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/webp",
      "application/pdf",
    ];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Invalid file type",
        description: "Please select a JPG, PNG, or PDF file.",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      console.log(
        `Uploading file: ${file.name}, size: ${file.size}, type: ${file.type}`
      );

      const response = await fetch("/api/upload/public", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        const result = await response.json();
        console.log("Upload successful:", result);
        setUploadedFileUrl(result.url);
        setValue("governmentIdPhoto", result.url);
        toast({
          title: "File uploaded successfully",
          description: "Your government ID document has been uploaded.",
        });
      } else {
        const errorText = await response.text();
        console.error("Upload failed:", errorText);
        toast({
          title: "Upload failed",
          description: `Failed to upload file: ${errorText}`,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("File upload error:", error);
      toast({
        title: "Upload failed",
        description:
          "An error occurred while uploading the file. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const onSubmit = async (data: BecomeSellerFormData) => {
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/become-seller", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        toast({
          title: "Application Submitted Successfully!",
          description:
            "We've received your seller application. Our team will review it and contact you within 2-3 business days.",
        });

        // Reset form
        setValue("email", "");
        setValue("phone", "");
        setValue("businessName", "");
        setValue("businessAddress", "");
        setValue("companyRegistrationNumber", "");
        setValue("gstNumber", "");
        setValue("panNumber", "");
        setValue("bankName", "");
        setValue("bankLocation", "");
        setValue("accountNumber", "");
        setValue("ifscCode", "");
        setValue("governmentIdNumber", "");
        setValue("governmentIdPhoto", "");
        setValue("agreeToTerms", false);
        setValue("agreeToPrivacyPolicy", false);
        // Reset file upload state
        setUploadedFileUrl("");
        setSelectedFileName("");
      } else {
        const errorData = await response.json();
        toast({
          title: "Submission Failed",
          description:
            errorData.message || "Something went wrong. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Submission Failed",
        description:
          "Network error. Please check your connection and try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>Become a Seller - LeleKart</title>
        <meta
          name="description"
          content="Join LeleKart as a seller and start selling your products to millions of customers. Complete seller registration with business verification."
        />
        <meta
          name="keywords"
          content="become a seller, seller registration, sell online, ecommerce seller, LeleKart seller"
        />
      </Helmet>

      <div className="min-h-screen bg-[#F8F5E4] text-gray-800 py-4">
        <div className="container mx-auto px-4">
          {/* Hero Banner */}
          <div className="bg-[#2874f0] text-white p-6 md:p-8 lg:p-16 rounded-t-lg">
            <div className="max-w-4xl mx-auto text-center">
              <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-3 md:mb-4">
                Become a Seller on LeleKart
              </h1>
              <p className="text-base md:text-lg lg:text-xl mb-4 md:mb-6">
                Join thousands of successful sellers and reach millions of
                customers across India
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm md:text-base">
                <div className="flex items-center justify-center">
                  <CheckCircle className="h-5 w-5 mr-2" />
                  <span>Zero Registration Fee</span>
                </div>
                <div className="flex items-center justify-center">
                  <CheckCircle className="h-5 w-5 mr-2" />
                  <span>Quick Approval Process</span>
                </div>
                <div className="flex items-center justify-center">
                  <CheckCircle className="h-5 w-5 mr-2" />
                  <span>24/7 Seller Support</span>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="bg-white rounded-b-lg shadow-sm">
            <div className="p-4 md:p-6 lg:p-8">
              <div className="max-w-4xl mx-auto">
                <StaticPageSection
                  section="become_seller_page"
                  titleFilter="Introduction"
                  defaultContent={
                    <div className="mb-6 md:mb-8">
                      <h2 className="text-xl md:text-2xl font-semibold mb-4 text-gray-800">
                        Start Your Selling Journey
                      </h2>
                      <p className="text-gray-600 mb-4">
                        Complete the form below to register as a seller on
                        LeleKart. We'll review your application and get back to
                        you within 2-3 business days. All information provided
                        will be kept confidential and used only for verification
                        purposes.
                      </p>
                      <Alert className="mb-6">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                          <strong>Important:</strong> Please ensure all
                          information is accurate and up-to-date. Incorrect
                          information may delay your approval process.
                        </AlertDescription>
                      </Alert>
                    </div>
                  }
                />

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                  {/* Contact Information */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center text-lg">
                        <span className="bg-blue-100 text-blue-600 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-3">
                          1
                        </span>
                        Contact Information
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="email">Email Address *</Label>
                          <Input
                            id="email"
                            type="email"
                            placeholder="your.email@example.com"
                            {...register("email")}
                            className={errors.email ? "border-red-500" : ""}
                          />
                          {errors.email && (
                            <p className="text-red-500 text-sm mt-1">
                              {errors.email.message}
                            </p>
                          )}
                          <p className="text-gray-500 text-xs mt-1">
                            Used for communication and account verification
                          </p>
                        </div>
                        <div>
                          <Label htmlFor="phone">Phone Number *</Label>
                          <Input
                            id="phone"
                            type="tel"
                            placeholder="9876543210"
                            maxLength={10}
                            {...register("phone")}
                            onChange={(e) => {
                              // Only allow digits
                              const value = e.target.value.replace(/\D/g, "");
                              e.target.value = value;
                            }}
                            className={errors.phone ? "border-red-500" : ""}
                          />
                          {errors.phone && (
                            <p className="text-red-500 text-sm mt-1">
                              {errors.phone.message}
                            </p>
                          )}
                          <p className="text-gray-500 text-xs mt-1">
                            10-digit Indian mobile number (starts with 6, 7, 8,
                            or 9)
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Business Information */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center text-lg">
                        <span className="bg-blue-100 text-blue-600 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-3">
                          2
                        </span>
                        Business Information
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="businessName">Business Name *</Label>
                          <Input
                            id="businessName"
                            placeholder="Your Business Name"
                            {...register("businessName")}
                            className={
                              errors.businessName ? "border-red-500" : ""
                            }
                          />
                          {errors.businessName && (
                            <p className="text-red-500 text-sm mt-1">
                              {errors.businessName.message}
                            </p>
                          )}
                        </div>
                        <div>
                          <Label htmlFor="businessType">Business Type *</Label>
                          <Select
                            onValueChange={(value) =>
                              setValue("businessType", value as any)
                            }
                          >
                            <SelectTrigger
                              className={
                                errors.businessType ? "border-red-500" : ""
                              }
                            >
                              <SelectValue placeholder="Select business type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="individual">
                                Individual
                              </SelectItem>
                              <SelectItem value="sole_proprietorship">
                                Sole Proprietorship
                              </SelectItem>
                              <SelectItem value="llc">LLC</SelectItem>
                              <SelectItem value="partnership">
                                Partnership
                              </SelectItem>
                              <SelectItem value="corporation">
                                Corporation
                              </SelectItem>
                              <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                          {errors.businessType && (
                            <p className="text-red-500 text-sm mt-1">
                              {errors.businessType.message}
                            </p>
                          )}
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="businessAddress">
                          Business Address *
                        </Label>
                        <Textarea
                          id="businessAddress"
                          placeholder="Complete street address"
                          {...register("businessAddress")}
                          className={
                            errors.businessAddress ? "border-red-500" : ""
                          }
                          rows={3}
                        />
                        {errors.businessAddress && (
                          <p className="text-red-500 text-sm mt-1">
                            {errors.businessAddress.message}
                          </p>
                        )}
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <Label htmlFor="businessState">State *</Label>
                          <Select
                            onValueChange={(value) => {
                              setValue("businessState", value);
                              setValue("businessCity", "");
                              setSelectedBusinessState(value);
                            }}
                          >
                            <SelectTrigger
                              className={
                                errors.businessState ? "border-red-500" : ""
                              }
                            >
                              <SelectValue placeholder="Select state" />
                            </SelectTrigger>
                            <SelectContent>
                              {indianStates.map((state) => (
                                <SelectItem key={state.code} value={state.name}>
                                  {state.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {errors.businessState && (
                            <p className="text-red-500 text-sm mt-1">
                              {errors.businessState.message}
                            </p>
                          )}
                        </div>
                        <div>
                          <Label htmlFor="businessCity">City *</Label>
                          <Select
                            onValueChange={(value) =>
                              setValue("businessCity", value)
                            }
                            disabled={!selectedBusinessState}
                          >
                            <SelectTrigger
                              className={
                                errors.businessCity ? "border-red-500" : ""
                              }
                            >
                              <SelectValue placeholder="Select city" />
                            </SelectTrigger>
                            <SelectContent>
                              {selectedBusinessState &&
                                getCitiesByState(selectedBusinessState).map(
                                  (city) => (
                                    <SelectItem key={city} value={city}>
                                      {city}
                                    </SelectItem>
                                  )
                                )}
                            </SelectContent>
                          </Select>
                          {errors.businessCity && (
                            <p className="text-red-500 text-sm mt-1">
                              {errors.businessCity.message}
                            </p>
                          )}
                        </div>
                        <div>
                          <Label htmlFor="businessPincode">Pincode *</Label>
                          <div className="relative">
                            <Input
                              id="businessPincode"
                              placeholder="123456"
                              {...register("businessPincode")}
                              className={`${errors.businessPincode ? "border-red-500" : ""} pr-10`}
                              maxLength={6}
                              onChange={(e) => {
                                // Only allow digits
                                const value = e.target.value.replace(/\D/g, "");
                                e.target.value = value;
                              }}
                            />
                            {businessPincodeValidationStatus ===
                              "validating" && (
                              <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 animate-spin text-blue-500" />
                            )}
                            {businessPincodeValidationStatus === "valid" && (
                              <CheckCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-green-500" />
                            )}
                            {businessPincodeValidationStatus === "invalid" && (
                              <AlertCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-red-500" />
                            )}
                          </div>
                          {errors.businessPincode && (
                            <p className="text-red-500 text-sm mt-1">
                              {errors.businessPincode.message}
                            </p>
                          )}
                          {businessPincodeData && (
                            <p className="text-green-500 text-xs mt-1">
                              ✓ Auto-filled: {businessPincodeData.city},{" "}
                              {businessPincodeData.state}
                            </p>
                          )}
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="companyRegistrationNumber">
                          Company Registration Number (Optional)
                        </Label>
                        <Input
                          id="companyRegistrationNumber"
                          placeholder="CIN/LLPIN/Registration Number"
                          {...register("companyRegistrationNumber")}
                        />
                      </div>
                    </CardContent>
                  </Card>

                  {/* Tax Information */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center text-lg">
                        <span className="bg-blue-100 text-blue-600 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-3">
                          3
                        </span>
                        Tax Information
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="gstNumber">GST Number</Label>
                          <Input
                            id="gstNumber"
                            placeholder="22AAAAA0000A1Z5"
                            {...register("gstNumber")}
                            className={errors.gstNumber ? "border-red-500" : ""}
                          />
                          {errors.gstNumber && (
                            <p className="text-red-500 text-sm mt-1">
                              {errors.gstNumber.message}
                            </p>
                          )}
                          <p className="text-gray-500 text-xs mt-1">
                            15-character GST number (e.g., 22AAAAA0000A1Z5).
                            Optional.
                          </p>
                        </div>
                        <div>
                          <Label htmlFor="panNumber">PAN Number</Label>
                          <div className="relative">
                            <Input
                              id="panNumber"
                              placeholder="ABCDE1234F"
                              {...register("panNumber")}
                              className={`${errors.panNumber ? "border-red-500" : ""} pr-10`}
                            />
                            {panValidationStatus === "validating" && (
                              <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 animate-spin text-blue-500" />
                            )}
                            {panValidationStatus === "valid" && (
                              <CheckCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-green-500" />
                            )}
                            {panValidationStatus === "invalid" && (
                              <AlertCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-red-500" />
                            )}
                          </div>
                          {errors.panNumber && (
                            <p className="text-red-500 text-sm mt-1">
                              {errors.panNumber.message}
                            </p>
                          )}
                          <p className="text-gray-500 text-xs mt-1">
                            10-character PAN number (e.g., ABCDE1234F).
                            Optional.
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Bank Account Information */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center text-lg">
                        <span className="bg-blue-100 text-blue-600 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-3">
                          4
                        </span>
                        Bank Account Information
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="bankName">Bank Name *</Label>
                          <Input
                            id="bankName"
                            placeholder="e.g., State Bank of India"
                            {...register("bankName")}
                            className={errors.bankName ? "border-red-500" : ""}
                            readOnly={ifscBankData !== null}
                          />
                          {errors.bankName && (
                            <p className="text-red-500 text-sm mt-1">
                              {errors.bankName.message}
                            </p>
                          )}
                          {ifscBankData && (
                            <p className="text-green-500 text-xs mt-1">
                              ✓ Auto-filled from IFSC validation
                            </p>
                          )}
                        </div>
                        <div>
                          <Label htmlFor="ifscCode">IFSC Code *</Label>
                          <div className="relative">
                            <Input
                              id="ifscCode"
                              placeholder="SBIN0001234"
                              {...register("ifscCode")}
                              className={`${errors.ifscCode ? "border-red-500" : ""} pr-10`}
                            />
                            {ifscValidationStatus === "validating" && (
                              <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 animate-spin text-blue-500" />
                            )}
                            {ifscValidationStatus === "valid" && (
                              <CheckCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-green-500" />
                            )}
                            {ifscValidationStatus === "invalid" && (
                              <AlertCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-red-500" />
                            )}
                          </div>
                          {errors.ifscCode && (
                            <p className="text-red-500 text-sm mt-1">
                              {errors.ifscCode.message}
                            </p>
                          )}
                          <p className="text-gray-500 text-xs mt-1">
                            11-character IFSC code (e.g., SBIN0001234)
                          </p>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <Label htmlFor="bankState">State *</Label>
                          <Select
                            onValueChange={(value) => {
                              setValue("bankState", value);
                              setValue("bankCity", "");
                              setSelectedBankState(value);
                            }}
                          >
                            <SelectTrigger
                              className={
                                errors.bankState ? "border-red-500" : ""
                              }
                            >
                              <SelectValue placeholder="Select state" />
                            </SelectTrigger>
                            <SelectContent>
                              {indianStates.map((state) => (
                                <SelectItem key={state.code} value={state.name}>
                                  {state.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {errors.bankState && (
                            <p className="text-red-500 text-sm mt-1">
                              {errors.bankState.message}
                            </p>
                          )}
                        </div>
                        <div>
                          <Label htmlFor="bankCity">City *</Label>
                          <Select
                            onValueChange={(value) =>
                              setValue("bankCity", value)
                            }
                            disabled={!selectedBankState}
                          >
                            <SelectTrigger
                              className={
                                errors.bankCity ? "border-red-500" : ""
                              }
                            >
                              <SelectValue placeholder="Select city" />
                            </SelectTrigger>
                            <SelectContent>
                              {selectedBankState &&
                                getCitiesByState(selectedBankState).map(
                                  (city) => (
                                    <SelectItem key={city} value={city}>
                                      {city}
                                    </SelectItem>
                                  )
                                )}
                            </SelectContent>
                          </Select>
                          {errors.bankCity && (
                            <p className="text-red-500 text-sm mt-1">
                              {errors.bankCity.message}
                            </p>
                          )}
                        </div>
                        <div>
                          <Label htmlFor="bankPincode">Pincode *</Label>
                          <div className="relative">
                            <Input
                              id="bankPincode"
                              placeholder="123456"
                              {...register("bankPincode")}
                              className={`${errors.bankPincode ? "border-red-500" : ""} pr-10`}
                              maxLength={6}
                              onChange={(e) => {
                                // Only allow digits
                                const value = e.target.value.replace(/\D/g, "");
                                e.target.value = value;
                              }}
                            />
                            {bankPincodeValidationStatus === "validating" && (
                              <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 animate-spin text-blue-500" />
                            )}
                            {bankPincodeValidationStatus === "valid" && (
                              <CheckCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-green-500" />
                            )}
                            {bankPincodeValidationStatus === "invalid" && (
                              <AlertCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-red-500" />
                            )}
                          </div>
                          {errors.bankPincode && (
                            <p className="text-red-500 text-sm mt-1">
                              {errors.bankPincode.message}
                            </p>
                          )}
                          {bankPincodeData && (
                            <p className="text-green-500 text-xs mt-1">
                              ✓ Auto-filled: {bankPincodeData.city},{" "}
                              {bankPincodeData.state}
                            </p>
                          )}
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="accountNumber">Account Number *</Label>
                        <Input
                          id="accountNumber"
                          placeholder="Account number"
                          {...register("accountNumber")}
                          className={
                            errors.accountNumber ? "border-red-500" : ""
                          }
                          onChange={(e) => {
                            // Only allow digits
                            const value = e.target.value.replace(/\D/g, "");
                            e.target.value = value;
                          }}
                        />
                        {errors.accountNumber && (
                          <p className="text-red-500 text-sm mt-1">
                            {errors.accountNumber.message}
                          </p>
                        )}
                        <p className="text-gray-500 text-xs mt-1">
                          Enter only numeric digits (no letters or special
                          characters)
                        </p>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Identity Verification */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center text-lg">
                        <span className="bg-blue-100 text-blue-600 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-3">
                          5
                        </span>
                        Identity Verification
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="governmentIdType">
                            Government ID Type *
                          </Label>
                          <Select
                            onValueChange={(value) =>
                              setValue("governmentIdType", value as any)
                            }
                          >
                            <SelectTrigger
                              className={
                                errors.governmentIdType ? "border-red-500" : ""
                              }
                            >
                              <SelectValue placeholder="Select ID type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="aadhaar">
                                Aadhaar Card
                              </SelectItem>
                              <SelectItem value="passport">Passport</SelectItem>
                              <SelectItem value="driving_license">
                                Driving License
                              </SelectItem>
                              <SelectItem value="voter_id">Voter ID</SelectItem>
                            </SelectContent>
                          </Select>
                          {errors.governmentIdType && (
                            <p className="text-red-500 text-sm mt-1">
                              {errors.governmentIdType.message}
                            </p>
                          )}
                        </div>
                        <div>
                          <Label htmlFor="governmentIdNumber">
                            Government ID Number *
                          </Label>
                          <Input
                            id="governmentIdNumber"
                            placeholder="ID number"
                            {...register("governmentIdNumber")}
                            className={
                              errors.governmentIdNumber ? "border-red-500" : ""
                            }
                          />
                          {errors.governmentIdNumber && (
                            <p className="text-red-500 text-sm mt-1">
                              {errors.governmentIdNumber.message}
                            </p>
                          )}
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="governmentIdPhoto">
                          Photo of Government ID *
                        </Label>
                        <div
                          className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors cursor-pointer"
                          onDragOver={(e) => {
                            e.preventDefault();
                            e.currentTarget.classList.add(
                              "border-blue-400",
                              "bg-blue-50"
                            );
                          }}
                          onDragLeave={(e) => {
                            e.preventDefault();
                            e.currentTarget.classList.remove(
                              "border-blue-400",
                              "bg-blue-50"
                            );
                          }}
                          onDrop={(e) => {
                            e.preventDefault();
                            e.currentTarget.classList.remove(
                              "border-blue-400",
                              "bg-blue-50"
                            );
                            const files = e.dataTransfer.files;
                            if (files.length > 0) {
                              setSelectedFileName(files[0].name);
                              handleFileUpload(files[0]);
                            }
                          }}
                          onClick={() =>
                            document
                              .getElementById("governmentIdPhoto")
                              ?.click()
                          }
                        >
                          {isUploading ? (
                            <div className="flex flex-col items-center">
                              <Loader2 className="mx-auto h-12 w-12 text-blue-500 animate-spin" />
                              <p className="text-sm text-gray-600 mt-4">
                                Uploading {selectedFileName}...
                              </p>
                            </div>
                          ) : uploadedFileUrl ? (
                            <div className="flex flex-col items-center">
                              <CheckCircle className="mx-auto h-12 w-12 text-green-500" />
                              <p className="text-sm text-green-600 mt-4">
                                {selectedFileName} uploaded successfully!
                              </p>
                              <div className="flex gap-2 mt-2">
                                <a
                                  href={uploadedFileUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-500 text-xs hover:underline"
                                >
                                  View uploaded file
                                </a>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setUploadedFileUrl("");
                                    setValue("governmentIdPhoto", "");
                                    setSelectedFileName("");
                                  }}
                                  className="text-red-500 text-xs hover:underline"
                                >
                                  Remove file
                                </button>
                              </div>
                            </div>
                          ) : (
                            <>
                              <Upload className="mx-auto h-12 w-12 text-gray-400" />
                              <div className="mt-4">
                                <p className="text-sm text-gray-600">
                                  Upload a clear photo of your government ID
                                </p>
                                <p className="text-xs text-gray-500 mt-1">
                                  Supported formats: JPG, PNG, PDF (Max 5MB)
                                </p>
                              </div>
                            </>
                          )}
                          <input
                            type="file"
                            id="governmentIdPhoto"
                            accept="image/*,.pdf"
                            className="hidden"
                            aria-label="Upload government ID document"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                setSelectedFileName(file.name);
                                handleFileUpload(file);
                              }
                              // Reset the input value to allow selecting the same file again
                              e.target.value = "";
                            }}
                            disabled={isUploading}
                          />
                          <Button
                            type="button"
                            variant="outline"
                            className="mt-4"
                            onClick={() =>
                              document
                                .getElementById("governmentIdPhoto")
                                ?.click()
                            }
                            disabled={isUploading}
                          >
                            {isUploading ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Uploading...
                              </>
                            ) : (
                              <>
                                <Upload className="mr-2 h-4 w-4" />
                                Choose File
                              </>
                            )}
                          </Button>
                        </div>
                        {errors.governmentIdPhoto && (
                          <p className="text-red-500 text-sm mt-1">
                            {errors.governmentIdPhoto.message}
                          </p>
                        )}
                        <p className="text-gray-500 text-xs mt-2">
                          Upload a clear photo or scan of your government ID
                          (Aadhaar, Passport, Driving License, or Voter ID).
                          Supported formats: JPG, PNG, PDF. Maximum file size:
                          5MB.
                        </p>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Terms and Conditions */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center text-lg">
                        <span className="bg-blue-100 text-blue-600 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-3">
                          6
                        </span>
                        Terms and Conditions
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-start space-x-2">
                        <Checkbox
                          id="agreeToTerms"
                          checked={watch("agreeToTerms")}
                          onCheckedChange={(checked) =>
                            setValue("agreeToTerms", checked as boolean)
                          }
                        />
                        <div className="grid gap-1.5 leading-none">
                          <Label htmlFor="agreeToTerms" className="text-sm">
                            I agree to the{" "}
                            <a
                              href="/terms"
                              className="text-blue-600 hover:underline"
                              target="_blank"
                            >
                              Terms and Conditions
                            </a>{" "}
                            and{" "}
                            <a
                              href="/seller-agreement"
                              className="text-blue-600 hover:underline"
                              target="_blank"
                            >
                              Seller Agreement
                            </a>{" "}
                            *
                          </Label>
                          {errors.agreeToTerms && (
                            <p className="text-red-500 text-sm">
                              {errors.agreeToTerms.message}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-start space-x-2">
                        <Checkbox
                          id="agreeToPrivacyPolicy"
                          checked={watch("agreeToPrivacyPolicy")}
                          onCheckedChange={(checked) =>
                            setValue("agreeToPrivacyPolicy", checked as boolean)
                          }
                        />
                        <div className="grid gap-1.5 leading-none">
                          <Label
                            htmlFor="agreeToPrivacyPolicy"
                            className="text-sm"
                          >
                            I agree to the{" "}
                            <a
                              href="/privacy"
                              className="text-blue-600 hover:underline"
                              target="_blank"
                            >
                              Privacy Policy
                            </a>{" "}
                            and consent to the processing of my personal data *
                          </Label>
                          {errors.agreeToPrivacyPolicy && (
                            <p className="text-red-500 text-sm">
                              {errors.agreeToPrivacyPolicy.message}
                            </p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Submit Button */}
                  <div className="flex justify-center">
                    <Button
                      type="submit"
                      size="lg"
                      disabled={isSubmitting}
                      className="px-8 py-3 text-lg"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                          Submitting Application...
                        </>
                      ) : (
                        "Submit Application"
                      )}
                    </Button>
                  </div>
                </form>

                {/* Additional Information */}
                <StaticPageSection
                  section="become_seller_page"
                  titleFilter="Additional Info"
                  defaultContent={
                    <div className="mt-8 p-6 bg-gray-50 rounded-lg">
                      <h3 className="text-lg font-semibold mb-4">
                        What happens next?
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div className="text-center">
                          <div className="bg-blue-100 text-blue-600 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-2">
                            <span className="font-bold">1</span>
                          </div>
                          <h4 className="font-semibold mb-1">
                            Application Review
                          </h4>
                          <p className="text-gray-600">
                            Our team will review your application within 2-3
                            business days
                          </p>
                        </div>
                        <div className="text-center">
                          <div className="bg-blue-100 text-blue-600 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-2">
                            <span className="font-bold">2</span>
                          </div>
                          <h4 className="font-semibold mb-1">
                            Document Verification
                          </h4>
                          <p className="text-gray-600">
                            We'll verify your documents and business information
                          </p>
                        </div>
                        <div className="text-center">
                          <div className="bg-blue-100 text-blue-600 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-2">
                            <span className="font-bold">3</span>
                          </div>
                          <h4 className="font-semibold mb-1">
                            Account Activation
                          </h4>
                          <p className="text-gray-600">
                            Once approved, you'll receive login credentials to
                            start selling
                          </p>
                        </div>
                      </div>
                    </div>
                  }
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
