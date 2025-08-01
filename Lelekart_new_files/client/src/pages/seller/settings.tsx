import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { SellerDashboardLayout } from "@/components/layout/seller-dashboard-layout";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FileUpload } from "@/components/ui/file-upload";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  validateName,
  validatePhone,
  validatePincode,
  validateGstin,
  validatePan,
  validateIfsc,
} from "@/lib/validation";
import {
  Bell,
  Calendar,
  Check,
  CreditCard,
  HelpCircle,
  Loader2,
  LogOut,
  Mailbox,
  MessageSquare,
  Moon,
  Percent,
  Pencil,
  PhoneCall,
  Save,
  Settings,
  ShieldAlert,
  Sun,
  Trash2,
  Truck,
  UserCog,
  Wallet,
  X,
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useLocation } from "react-router-dom";

export default function SellerSettingsPage() {
  const location = useLocation();
  const [currentTab, setCurrentTab] = useState("account");
  const [holidayMode, setHolidayMode] = useState(false);
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSavingPersonalInfo, setIsSavingPersonalInfo] = useState(false);
  const [isSavingAddress, setIsSavingAddress] = useState(false);
  const [isSavingPickupAddress, setIsSavingPickupAddress] = useState(false);
  const [isSavingStoreSettings, setIsSavingStoreSettings] = useState(false);
  const [isSavingBillingInfo, setIsSavingBillingInfo] = useState(false);
  const [isSavingBankInfo, setIsSavingBankInfo] = useState(false);

  const [isEditingPersonalInfo, setIsEditingPersonalInfo] = useState(false);
  const [originalPersonalInfo, setOriginalPersonalInfo] = useState({
    name: "",
    email: "",
    phone: "",
    alternatePhone: "",
  });
  const [personalInfoErrors, setPersonalInfoErrors] = useState({
    name: "",
    phone: "",
    alternatePhone: "",
  });

  const [isEditingAddress, setIsEditingAddress] = useState(false);
  const [originalAddress, setOriginalAddress] = useState({
    line1: "",
    line2: "",
    city: "",
    state: "",
    pincode: "",
  });
  const [addressErrors, setAddressErrors] = useState({
    line1: "",
    city: "",
    state: "",
    pincode: "",
  });

  const [isEditingPickupAddress, setIsEditingPickupAddress] = useState(false);
  const [originalPickupAddress, setOriginalPickupAddress] = useState({
    businessName: "",
    gstin: "",
    contactName: "",
    phone: "",
    line1: "",
    line2: "",
    city: "",
    state: "",
    pincode: "",
    authorizationSignature: "",
  });
  const [pickupAddress, setPickupAddress] = useState({
    businessName: "",
    gstin: "",
    contactName: "",
    phone: "",
    line1: "",
    line2: "",
    city: "",
    state: "",
    pincode: "",
    authorizationSignature: "",
  });
  const [pickupAddressErrors, setPickupAddressErrors] = useState({
    businessName: "",
    contactName: "",
    phone: "",
    line1: "",
    city: "",
    state: "",
    pincode: "",
  });

  const [isEditingStoreInfo, setIsEditingStoreInfo] = useState(false);
  const [isEditingStoreBranding, setIsEditingStoreBranding] = useState(false);
  const [isEditingSocialLinks, setIsEditingSocialLinks] = useState(false);
  const [isEditingBusinessHours, setIsEditingBusinessHours] = useState(false);
  const [originalStoreSettings, setOriginalStoreSettings] = useState({
    name: "",
    description: "",
    contactEmail: "",
    contactPhone: "",
    logo: "",
    banner: "",
    socialLinks: {
      facebook: "",
      instagram: "",
      twitter: "",
      website: "",
    },
    businessHours: [
      { day: "Monday", open: true, openTime: "09:00", closeTime: "18:00" },
      { day: "Tuesday", open: true, openTime: "09:00", closeTime: "18:00" },
      { day: "Wednesday", open: true, openTime: "09:00", closeTime: "18:00" },
      { day: "Thursday", open: true, openTime: "09:00", closeTime: "18:00" },
      { day: "Friday", open: true, openTime: "09:00", closeTime: "18:00" },
      { day: "Saturday", open: true, openTime: "10:00", closeTime: "16:00" },
      { day: "Sunday", open: false, openTime: "", closeTime: "" },
    ],
  });
  const [storeInfoErrors, setStoreInfoErrors] = useState({
    name: "",
    contactEmail: "",
    contactPhone: "",
  });

  const [isEditingBillingInfo, setIsEditingBillingInfo] = useState(false);
  const [originalBillingInfo, setOriginalBillingInfo] = useState({
    gstin: "",
    businessName: "",
    panNumber: "",
    businessType: "individual",
  });
  const [billingInfoErrors, setBillingInfoErrors] = useState({
    gstin: "",
    businessName: "",
    panNumber: "",
  });

  const [isEditingBankInfo, setIsEditingBankInfo] = useState(false);
  const [originalBankInfo, setOriginalBankInfo] = useState({
    accountName: "",
    accountNumber: "",
    ifscCode: "",
    bankName: "",
    branchName: "",
  });
  const [bankInfoErrors, setBankInfoErrors] = useState({
    accountName: "",
    accountNumber: "",
    ifscCode: "",
    bankName: "",
  });

  const [notificationSettings, setNotificationSettings] = useState({
    email: {
      orders: true,
      payments: true,
      returns: true,
      reviews: true,
      promotions: false,
    },
    sms: {
      orders: true,
      payments: false,
      returns: false,
      reviews: false,
      promotions: false,
    },
    push: {
      orders: true,
      payments: true,
      returns: true,
      reviews: true,
      promotions: true,
    },
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch seller settings
  const { data: settings, isLoading: isSettingsLoading } = useQuery({
    queryKey: ["/api/seller/settings"],
    queryFn: async () => {
      const res = await fetch("/api/seller/settings");
      if (!res.ok) {
        throw new Error("Failed to fetch settings");
      }
      return res.json();
    },
  });

  // Process settings data when it changes
  useEffect(() => {
    if (settings) {
      setHolidayMode(settings.holidayMode || false);

      // Parse and set notification preferences
      if (settings.notificationPreferences) {
        try {
          setNotificationSettings(JSON.parse(settings.notificationPreferences));
        } catch (e) {
          console.error("Error parsing notification preferences:", e);
          setNotificationSettings({
            email: {
              orders: true,
              payments: true,
              returns: true,
              reviews: true,
              promotions: false,
            },
            sms: {
              orders: true,
              payments: false,
              returns: false,
              reviews: false,
              promotions: false,
            },
            push: {
              orders: true,
              payments: true,
              returns: true,
              reviews: true,
              promotions: true,
            },
          });
        }
      }

      // Parse and set personal info
      if (settings.personalInfo) {
        try {
          const parsedPersonalInfo = JSON.parse(settings.personalInfo);
          setOriginalPersonalInfo({
            name: parsedPersonalInfo.name || "",
            email: parsedPersonalInfo.email || "",
            phone: parsedPersonalInfo.phone || "",
            alternatePhone: parsedPersonalInfo.alternatePhone || "",
          });
        } catch (e) {
          console.error("Error parsing personal info:", e);
          setOriginalPersonalInfo({
            name: "",
            email: "",
            phone: "",
            alternatePhone: "",
          });
        }
      }

      // Parse and set address
      if (settings.address) {
        try {
          const parsedAddress = JSON.parse(settings.address);
          setOriginalAddress({
            line1: parsedAddress.line1 || "",
            line2: parsedAddress.line2 || "",
            city: parsedAddress.city || "",
            state: parsedAddress.state || "",
            pincode: parsedAddress.pincode || "",
          });
        } catch (e) {
          console.error("Error parsing address:", e);
          setOriginalAddress({
            line1: "",
            line2: "",
            city: "",
            state: "",
            pincode: "",
          });
        }
      }

      // Parse and set store settings
      if (settings.store) {
        try {
          const parsedStoreSettings = JSON.parse(settings.store);
          setOriginalStoreSettings({
            name: parsedStoreSettings.name || "",
            description: parsedStoreSettings.description || "",
            contactEmail: parsedStoreSettings.contactEmail || "",
            contactPhone: parsedStoreSettings.contactPhone || "",
            logo: parsedStoreSettings.logo || "",
            banner: parsedStoreSettings.banner || "",
            socialLinks: {
              facebook: parsedStoreSettings.socialLinks?.facebook || "",
              instagram: parsedStoreSettings.socialLinks?.instagram || "",
              twitter: parsedStoreSettings.socialLinks?.twitter || "",
              website: parsedStoreSettings.socialLinks?.website || "",
            },
            businessHours: parsedStoreSettings.businessHours || [
              {
                day: "Monday",
                open: true,
                openTime: "09:00",
                closeTime: "18:00",
              },
              {
                day: "Tuesday",
                open: true,
                openTime: "09:00",
                closeTime: "18:00",
              },
              {
                day: "Wednesday",
                open: true,
                openTime: "09:00",
                closeTime: "18:00",
              },
              {
                day: "Thursday",
                open: true,
                openTime: "09:00",
                closeTime: "18:00",
              },
              {
                day: "Friday",
                open: true,
                openTime: "09:00",
                closeTime: "18:00",
              },
              {
                day: "Saturday",
                open: true,
                openTime: "10:00",
                closeTime: "16:00",
              },
              { day: "Sunday", open: false, openTime: "", closeTime: "" },
            ],
          });
        } catch (e) {
          console.error("Error parsing store settings:", e);
          setOriginalStoreSettings({
            name: "",
            description: "",
            contactEmail: "",
            contactPhone: "",
            logo: "",
            banner: "",
            socialLinks: {
              facebook: "",
              instagram: "",
              twitter: "",
              website: "",
            },
            businessHours: [
              {
                day: "Monday",
                open: true,
                openTime: "09:00",
                closeTime: "18:00",
              },
              {
                day: "Tuesday",
                open: true,
                openTime: "09:00",
                closeTime: "18:00",
              },
              {
                day: "Wednesday",
                open: true,
                openTime: "09:00",
                closeTime: "18:00",
              },
              {
                day: "Thursday",
                open: true,
                openTime: "09:00",
                closeTime: "18:00",
              },
              {
                day: "Friday",
                open: true,
                openTime: "09:00",
                closeTime: "18:00",
              },
              {
                day: "Saturday",
                open: true,
                openTime: "10:00",
                closeTime: "16:00",
              },
              { day: "Sunday", open: false, openTime: "", closeTime: "" },
            ],
          });
        }
      }
    }
  }, [settings]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tab = params.get("tab");
    if (tab === "bank") {
      setCurrentTab("bank");
    }
  }, [location.search]);

  const handleEdit = (
    setOriginalState: Function,
    currentState: any,
    setEditingState: Function
  ) => {
    setOriginalState(currentState);
    setEditingState(true);
  };

  const handleCancel = (
    setEditingState: Function,
    setCurrentState: Function,
    originalState: any,
    setErrorsState?: Function,
    initialErrors?: any
  ) => {
    setEditingState(false);
    setCurrentState(originalState);
    if (setErrorsState && initialErrors) {
      setErrorsState(initialErrors);
    }
  };

  const toggleHolidayMode = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/seller/settings/holiday-mode", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          enabled: !holidayMode,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update holiday mode");
      }

      setHolidayMode(!holidayMode);
      toast({
        title: !holidayMode
          ? "Holiday Mode Activated"
          : "Holiday Mode Deactivated",
        description: !holidayMode
          ? "Your store is now in holiday mode and won't accept new orders."
          : "Your store is now active and accepting new orders.",
      });
    } catch (error) {
      console.error("Error toggling holiday mode:", error);
      toast({
        title: "Action Failed",
        description: "Could not update holiday mode. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const saveNotificationSettings = async () => {
    setIsLoading(true);
    try {
      // Transform the nested notification settings to the flat structure expected by the API
      const transformedSettings = {
        email:
          notificationSettings.email.orders ||
          notificationSettings.email.payments ||
          notificationSettings.email.returns ||
          notificationSettings.email.reviews ||
          notificationSettings.email.promotions,
        sms:
          notificationSettings.sms.orders ||
          notificationSettings.sms.payments ||
          notificationSettings.sms.returns,
        push:
          notificationSettings.push.orders ||
          notificationSettings.push.payments ||
          notificationSettings.push.returns ||
          notificationSettings.push.reviews ||
          notificationSettings.push.promotions,
        orderNotifications:
          notificationSettings.email.orders ||
          notificationSettings.sms.orders ||
          notificationSettings.push.orders,
        paymentNotifications:
          notificationSettings.email.payments ||
          notificationSettings.sms.payments ||
          notificationSettings.push.payments,
        returnNotifications:
          notificationSettings.email.returns ||
          notificationSettings.sms.returns ||
          notificationSettings.push.returns,
        promotionNotifications:
          notificationSettings.email.promotions ||
          notificationSettings.push.promotions,
      };

      const response = await fetch("/api/seller/settings/notifications", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(transformedSettings),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Server error:", errorData);
        throw new Error("Failed to update notification settings");
      }

      toast({
        title: "Settings Saved",
        description:
          "Your notification preferences have been updated successfully.",
      });
    } catch (error) {
      console.error("Error saving notification settings:", error);
      toast({
        title: "Save Failed",
        description:
          "Could not update notification settings. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleNotificationChange = (
    channel: "email" | "sms" | "push",
    setting: string,
    checked: boolean
  ) => {
    setNotificationSettings((prev) => ({
      ...prev,
      [channel]: {
        ...prev[channel],
        [setting]: checked,
      },
    }));
  };

  const savePersonalInfo = async () => {
    const errors = { name: "", phone: "", alternatePhone: "" };
    if (!validateName(originalPersonalInfo.name)) {
      errors.name = "Please enter a valid name (letters and spaces only).";
    }
    if (!validatePhone(originalPersonalInfo.phone)) {
      errors.phone = "Please enter a valid 10-digit Indian mobile number.";
    }
    if (
      originalPersonalInfo.alternatePhone &&
      !validatePhone(originalPersonalInfo.alternatePhone)
    ) {
      errors.alternatePhone =
        "Please enter a valid 10-digit Indian mobile number.";
    }

    setPersonalInfoErrors(errors);

    if (Object.values(errors).some((e) => e !== "")) {
      toast({
        title: "Validation Error",
        description: "Please fill all required fields.",
        variant: "destructive",
      });
      return;
    }

    setIsSavingPersonalInfo(true);
    try {
      const response = await fetch("/api/seller/settings/personal-info", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(originalPersonalInfo),
      });

      if (!response.ok) {
        throw new Error("Failed to update personal information");
      }

      toast({
        title: "Personal Information Saved",
        description: "Your personal information has been updated successfully.",
      });
      setIsEditingPersonalInfo(false);
    } catch (error) {
      console.error("Error saving personal information:", error);
      toast({
        title: "Save Failed",
        description: "Could not update personal information. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSavingPersonalInfo(false);
    }
  };

  const deletePersonalInfo = async () => {
    const clearedInfo = {
      ...originalPersonalInfo,
      name: "",
      phone: "",
      alternatePhone: "",
    };
    setOriginalPersonalInfo(clearedInfo);
    try {
      const response = await fetch("/api/seller/settings/personal-info", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(clearedInfo),
      });

      if (!response.ok) {
        throw new Error("Failed to delete personal information");
      }

      toast({
        title: "Personal Information Cleared",
        description: "Your personal information has been cleared.",
      });
      setIsEditingPersonalInfo(false);
    } catch (error) {
      console.error("Error deleting personal information:", error);
      toast({
        title: "Deletion Failed",
        description: "Could not clear personal information. Please try again.",
        variant: "destructive",
      });
      setOriginalPersonalInfo(originalPersonalInfo); // Revert on failure
    }
  };

  const saveAddress = async () => {
    if (!originalAddress.pincode || !validatePincode(originalAddress.pincode)) {
      toast({
        title: "Validation Error",
        description: "Please enter a valid 6-digit pincode",
        variant: "destructive",
      });
      return;
    }
    if (!originalAddress.line1.trim()) {
      setAddressErrors((prev) => ({
        ...prev,
        line1: "Address Line 1 is required.",
      }));
      return;
    } else {
      setAddressErrors((prev) => ({ ...prev, line1: "" }));
    }

    setIsSavingAddress(true);
    try {
      const response = await fetch("/api/seller/settings/address", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(originalAddress),
      });

      if (!response.ok) {
        throw new Error("Failed to update address information");
      }

      toast({
        title: "Address Information Saved",
        description: "Your address information has been updated successfully.",
      });
      setIsEditingAddress(false);
    } catch (error) {
      console.error("Error saving address information:", error);
      toast({
        title: "Save Failed",
        description: "Could not update address information. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSavingAddress(false);
    }
  };

  const deleteAddress = async () => {
    const clearedAddress = {
      line1: "",
      line2: "",
      city: "",
      state: "",
      pincode: "",
    };
    setOriginalAddress(clearedAddress);
    try {
      const response = await fetch("/api/seller/settings/address", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(clearedAddress),
      });

      if (!response.ok) {
        throw new Error("Failed to delete address information");
      }

      toast({
        title: "Address Information Cleared",
        description: "Your address has been cleared.",
      });
      setIsEditingAddress(false);
    } catch (error) {
      console.error("Error deleting address:", error);
      toast({
        title: "Deletion Failed",
        description: "Could not clear address. Please try again.",
        variant: "destructive",
      });
      setOriginalAddress(originalAddress); // Revert on failure
    }
  };

  const saveStoreSettings = async () => {
    setIsSavingStoreSettings(true);
    try {
      // We'll use the general settings endpoint and store our data in a "store" field
      const response = await fetch("/api/seller/settings", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          store: JSON.stringify(originalStoreSettings),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update store settings");
      }

      toast({
        title: "Store Settings Saved",
        description: "Your store settings have been updated successfully.",
      });
      setIsEditingStoreInfo(false);
      setIsEditingStoreBranding(false);
      setIsEditingSocialLinks(false);
      setIsEditingBusinessHours(false);
    } catch (error) {
      console.error("Error saving store settings:", error);
      toast({
        title: "Save Failed",
        description: "Could not update store settings. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSavingStoreSettings(false);
    }
  };

  const savePickupAddress = async () => {
    const errors = {
      businessName: "",
      contactName: "",
      phone: "",
      line1: "",
      city: "",
      state: "",
      pincode: "",
    };
    let hasError = false;

    if (!pickupAddress.businessName.trim()) {
      errors.businessName = "Business name is required.";
      hasError = true;
    }
    if (!pickupAddress.contactName.trim()) {
      errors.contactName = "Contact name is required.";
      hasError = true;
    }
    if (!validatePhone(pickupAddress.phone)) {
      errors.phone = "Please enter a valid 10-digit Indian mobile number.";
      hasError = true;
    }
    if (!pickupAddress.line1.trim()) {
      errors.line1 = "Address line 1 is required.";
      hasError = true;
    }
    if (!validatePincode(pickupAddress.pincode)) {
      errors.pincode = "Please enter a valid 6-digit Indian pincode.";
      hasError = true;
    }

    setPickupAddressErrors(errors);

    if (hasError) {
      toast({
        title: "Validation Error",
        description: "Please fill all required fields.",
        variant: "destructive",
      });
      return;
    }

    setIsSavingPickupAddress(true);
    try {
      const response = await fetch("/api/seller/settings/pickup-address", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          pickupAddress,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update pickup address");
      }

      // Invalidate the settings query to force a refetch
      queryClient.invalidateQueries({ queryKey: ["/api/seller/settings"] });

      toast({
        title: "Pickup Address Saved",
        description:
          "Your pickup address has been updated successfully. This address will be used on invoices.",
      });
      setIsEditingPickupAddress(false);
    } catch (error) {
      console.error("Error saving pickup address:", error);
      toast({
        title: "Save Failed",
        description: "Could not update pickup address. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSavingPickupAddress(false);
    }
  };

  const deletePickupAddress = async () => {
    const clearedPickupAddress = {
      businessName: "",
      gstin: "",
      contactName: "",
      phone: "",
      line1: "",
      line2: "",
      city: "",
      state: "",
      pincode: "",
      authorizationSignature: "",
    };
    setPickupAddress(clearedPickupAddress);

    try {
      await fetch("/api/seller/settings/pickup-address", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ pickupAddress: clearedPickupAddress }),
      });
      toast({
        title: "Pickup Address Cleared",
        description: "Your pickup address has been cleared.",
      });
      setIsEditingPickupAddress(false);
    } catch (error) {
      console.error("Error clearing pickup address:", error);
      toast({
        title: "Error",
        description: "Could not clear pickup address.",
        variant: "destructive",
      });
      setPickupAddress(pickupAddress); // Revert on failure
    }
  };

  const saveBillingInfo = async () => {
    const errors = { gstin: "", businessName: "", panNumber: "" };
    if (!validateGstin(originalBillingInfo.gstin)) {
      errors.gstin = "Please enter a valid GSTIN.";
    }
    if (!validateName(originalBillingInfo.businessName)) {
      errors.businessName = "Please enter a valid business name.";
    }
    if (!validatePan(originalBillingInfo.panNumber)) {
      errors.panNumber = "Please enter a valid PAN number.";
    }

    setBillingInfoErrors(errors);

    if (Object.values(errors).some((e) => e !== "")) {
      toast({
        title: "Validation Error",
        description: "Please fill all required fields.",
        variant: "destructive",
      });
      return;
    }

    setIsSavingBillingInfo(true);
    try {
      const response = await fetch("/api/seller/settings", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          taxInformation: JSON.stringify({
            ...originalBillingInfo,
            // Don't include bank info here, as we'll send it separately
          }),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update billing information");
      }

      toast({
        title: "Billing Information Saved",
        description: "Your billing information has been updated successfully.",
      });
      setIsEditingBillingInfo(false);
    } catch (error) {
      console.error("Error saving billing information:", error);
      toast({
        title: "Save Failed",
        description: "Could not update billing information. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSavingBillingInfo(false);
    }
  };

  const deleteBillingInfo = async () => {
    const clearedBillingInfo = {
      gstin: "",
      businessName: "",
      panNumber: "",
      businessType: "individual",
    };
    setOriginalBillingInfo(clearedBillingInfo);
    try {
      const response = await fetch("/api/seller/settings", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          taxInformation: JSON.stringify(clearedBillingInfo),
        }),
      });
      if (!response.ok) {
        throw new Error("Failed to delete billing info.");
      }
      toast({
        title: "Billing Info Cleared",
        description: "Billing info has been cleared.",
      });
      setIsEditingBillingInfo(false);
    } catch (error) {
      console.error("Error clearing billing info:", error);
      toast({
        title: "Error",
        description: "Could not clear billing info.",
        variant: "destructive",
      });
      setOriginalBillingInfo(originalBillingInfo);
    }
  };

  const saveBankInfo = async () => {
    const errors = {
      accountName: "",
      accountNumber: "",
      ifscCode: "",
      bankName: "",
    };
    if (!validateName(originalBankInfo.accountName)) {
      errors.accountName = "Please enter a valid account holder name.";
    }
    if (originalBankInfo.accountNumber.length < 9) {
      errors.accountNumber = "Account number must be at least 9 digits.";
    }
    if (!validateIfsc(originalBankInfo.ifscCode)) {
      errors.ifscCode = "Please enter a valid IFSC code.";
    }
    if (!originalBankInfo.bankName.trim()) {
      errors.bankName = "Please enter the bank name.";
    }

    setBankInfoErrors(errors);

    if (Object.values(errors).some((e) => e !== "")) {
      toast({
        title: "Validation Error",
        description: "Please fill all required fields.",
        variant: "destructive",
      });
      return;
    }

    setIsSavingBankInfo(true);
    try {
      const response = await fetch("/api/seller/settings", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          taxInformation: JSON.stringify({
            bankInfo: originalBankInfo,
          }),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update bank information");
      }

      toast({
        title: "Bank Information Saved",
        description:
          "Your bank account information has been updated successfully.",
      });
      setIsEditingBankInfo(false);
    } catch (error) {
      console.error("Error saving bank information:", error);
      toast({
        title: "Save Failed",
        description: "Could not update bank information. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSavingBankInfo(false);
    }
  };

  const deleteBankInfo = async () => {
    const clearedBankInfo = {
      accountName: "",
      accountNumber: "",
      ifscCode: "",
      bankName: "",
      branchName: "",
    };
    setOriginalBankInfo(clearedBankInfo);
    try {
      const response = await fetch("/api/seller/settings", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          taxInformation: JSON.stringify({ bankInfo: clearedBankInfo }),
        }),
      });
      if (!response.ok) {
        throw new Error("Failed to delete bank info.");
      }
      toast({
        title: "Bank Info Cleared",
        description: "Bank info has been cleared.",
      });
      setIsEditingBankInfo(false);
    } catch (error) {
      console.error("Error clearing bank info:", error);
      toast({
        title: "Error",
        description: "Could not clear bank info.",
        variant: "destructive",
      });
      setOriginalBankInfo(originalBankInfo);
    }
  };

  const changePassword = async (oldPassword: string, newPassword: string) => {
    setIsLoading(true);
    try {
      // Here would be the API call to change password
      // For demonstration, we're just simulating success
      await new Promise((resolve) => setTimeout(resolve, 1000));

      setIsPasswordDialogOpen(false);
      toast({
        title: "Password Changed",
        description: "Your password has been updated successfully.",
      });
    } catch (error) {
      toast({
        title: "Password Change Failed",
        description: "Could not update your password. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SellerDashboardLayout>
      <div className="container mx-auto py-4 md:py-6 px-4 md:px-0">
        <div className="mb-6">
          <h1 className="text-xl md:text-2xl font-bold">Settings</h1>
          <p className="text-sm md:text-base text-muted-foreground">
            Manage your account settings and preferences
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar Navigation */}
          <div className="lg:w-1/4">
            <Tabs
              value={currentTab}
              onValueChange={setCurrentTab}
              className="w-full"
            >
              <div className="overflow-x-auto">
                <TabsList className="flex flex-row lg:flex-col h-auto w-full bg-transparent space-y-1 p-0 lg:space-y-1 lg:space-x-0 space-x-1">
                  <TabsTrigger
                    value="account"
                    className="justify-start px-3 py-2 h-9 data-[state=active]:bg-muted text-xs md:text-sm whitespace-nowrap"
                  >
                    <UserCog className="mr-2 h-4 w-4" />
                    <span className="hidden sm:inline">Account</span>
                    <span className="sm:hidden">Account</span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="notifications"
                    className="justify-start px-3 py-2 h-9 data-[state=active]:bg-muted text-xs md:text-sm whitespace-nowrap"
                  >
                    <Bell className="mr-2 h-4 w-4" />
                    <span className="hidden sm:inline">Notifications</span>
                    <span className="sm:hidden">Notif</span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="store"
                    className="justify-start px-3 py-2 h-9 data-[state=active]:bg-muted text-xs md:text-sm whitespace-nowrap"
                  >
                    <Settings className="mr-2 h-4 w-4" />
                    <span className="hidden sm:inline">Store Settings</span>
                    <span className="sm:hidden">Store</span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="billing"
                    className="justify-start px-3 py-2 h-9 data-[state=active]:bg-muted text-xs md:text-sm whitespace-nowrap"
                  >
                    <CreditCard className="mr-2 h-4 w-4" />
                    <span className="hidden sm:inline">Billing</span>
                    <span className="sm:hidden">Billing</span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="pickup_address"
                    className="justify-start px-3 py-2 h-9 data-[state=active]:bg-muted text-xs md:text-sm whitespace-nowrap"
                  >
                    <Truck className="mr-2 h-4 w-4" />
                    <span className="hidden sm:inline">Pickup Address</span>
                    <span className="sm:hidden">Pickup</span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="security"
                    className="justify-start px-3 py-2 h-9 data-[state=active]:bg-muted text-xs md:text-sm whitespace-nowrap"
                  >
                    <ShieldAlert className="mr-2 h-4 w-4" />
                    <span className="hidden sm:inline">Security</span>
                    <span className="sm:hidden">Security</span>
                  </TabsTrigger>
                </TabsList>
              </div>
            </Tabs>
          </div>

          <div className="lg:w-3/4">
            <Tabs
              value={currentTab}
              onValueChange={setCurrentTab}
              className="w-full"
            >
              <TabsContent
                value="account"
                className="space-y-4 md:space-y-6 mt-0"
              >
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base md:text-lg">
                      Personal Information
                    </CardTitle>
                    <CardDescription className="text-sm">
                      Update your personal details
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="name" className="text-sm">
                          Full Name <span className="text-red-500">*</span>
                        </Label>
                        {isEditingPersonalInfo ? (
                          <>
                            <Input
                              id="name"
                              value={originalPersonalInfo.name}
                              onChange={(e) =>
                                setOriginalPersonalInfo({
                                  ...originalPersonalInfo,
                                  name: e.target.value,
                                })
                              }
                              className="text-sm"
                            />
                            {personalInfoErrors.name && (
                              <p className="text-xs text-red-500">
                                {personalInfoErrors.name}
                              </p>
                            )}
                          </>
                        ) : (
                          <p className="text-sm py-2">
                            {originalPersonalInfo.name}
                          </p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email" className="text-sm">
                          Email Address <span className="text-red-500">*</span>
                        </Label>
                        {isEditingPersonalInfo ? (
                          <Input
                            id="email"
                            type="email"
                            value={originalPersonalInfo.email}
                            onChange={e => setOriginalPersonalInfo({ ...originalPersonalInfo, email: e.target.value })}
                            className="text-sm"
                          />
                        ) : (
                          <p className="text-sm py-2">{originalPersonalInfo.email}</p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="phone" className="text-sm">
                          Phone Number <span className="text-red-500">*</span>
                        </Label>
                        {isEditingPersonalInfo ? (
                          <>
                            <Input
                              id="phone"
                              value={originalPersonalInfo.phone}
                              maxLength={10}
                              onKeyPress={(e) => {
                                // Allow only digits
                                if (!/[0-9]/.test(e.key)) {
                                  e.preventDefault();
                                }
                              }}
                              onChange={(e) => {
                                // Only allow digits in the field
                                const value = e.target.value.replace(
                                  /[^0-9]/g,
                                  ""
                                );
                                setOriginalPersonalInfo({
                                  ...originalPersonalInfo,
                                  phone: value,
                                });
                              }}
                              className="text-sm"
                            />
                            {personalInfoErrors.phone && (
                              <p className="text-xs text-red-500">
                                {personalInfoErrors.phone}
                              </p>
                            )}
                            <p className="text-xs text-muted-foreground">
                              Enter a 10-digit number without spaces or special
                              characters
                            </p>
                          </>
                        ) : (
                          <p className="text-sm py-2">
                            {originalPersonalInfo.phone}
                          </p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="alternatePhone" className="text-sm">
                          Alternate Phone (Optional)
                        </Label>
                        {isEditingPersonalInfo ? (
                          <>
                            <Input
                              id="alternatePhone"
                              value={originalPersonalInfo.alternatePhone}
                              maxLength={10}
                              onKeyPress={(e) => {
                                // Allow only digits
                                if (!/[0-9]/.test(e.key)) {
                                  e.preventDefault();
                                }
                              }}
                              onChange={(e) => {
                                // Only allow digits in the field
                                const value = e.target.value.replace(
                                  /[^0-9]/g,
                                  ""
                                );
                                setOriginalPersonalInfo({
                                  ...originalPersonalInfo,
                                  alternatePhone: value,
                                });
                              }}
                              className="text-sm"
                            />
                            {personalInfoErrors.alternatePhone && (
                              <p className="text-xs text-red-500">
                                {personalInfoErrors.alternatePhone}
                              </p>
                            )}
                            <p className="text-xs text-muted-foreground">
                              Enter a 10-digit number without spaces or special
                              characters
                            </p>
                          </>
                        ) : (
                          <p className="text-sm py-2">
                            {originalPersonalInfo.alternatePhone}
                          </p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-end space-x-2">
                    {isEditingPersonalInfo ? (
                      <>
                        <Button
                          variant="ghost"
                          onClick={() =>
                            handleCancel(
                              setIsEditingPersonalInfo,
                              setOriginalPersonalInfo,
                              originalPersonalInfo,
                              setPersonalInfoErrors,
                              { name: "", phone: "", alternatePhone: "" }
                            )
                          }
                          className="text-xs md:text-sm"
                        >
                          <X className="mr-2 h-4 w-4" />
                          Cancel
                        </Button>
                        <Button
                          onClick={savePersonalInfo}
                          disabled={isSavingPersonalInfo}
                          className="text-xs md:text-sm"
                        >
                          {isSavingPersonalInfo ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Saving...
                            </>
                          ) : (
                            <>
                              <Save className="mr-2 h-4 w-4" />
                              Save Changes
                            </>
                          )}
                        </Button>
                      </>
                    ) : (
                      <>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="destructive"
                              className="text-xs md:text-sm"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will clear your personal information. This
                                action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={deletePersonalInfo}>
                                Continue
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                        <Button
                          onClick={() =>
                            handleEdit(
                              setOriginalPersonalInfo,
                              originalPersonalInfo,
                              setIsEditingPersonalInfo
                            )
                          }
                          className="text-xs md:text-sm"
                        >
                          <Pencil className="mr-2 h-4 w-4" />
                          Edit
                        </Button>
                      </>
                    )}
                  </CardFooter>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base md:text-lg">
                      Address Information
                    </CardTitle>
                    <CardDescription className="text-sm">
                      Manage your address details
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="addressLine1" className="text-sm">
                        Address Line 1 <span className="text-red-500">*</span>
                      </Label>
                      {isEditingAddress ? (
                        <>
                          <Input
                            id="addressLine1"
                            value={originalAddress.line1}
                            onChange={(e) =>
                              setOriginalAddress({
                                ...originalAddress,
                                line1: e.target.value,
                              })
                            }
                            className="text-sm"
                          />
                          {addressErrors.line1 && (
                            <p className="text-xs text-red-500">
                              {addressErrors.line1}
                            </p>
                          )}
                        </>
                      ) : (
                        <p className="text-sm py-2">{originalAddress.line1}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="addressLine2" className="text-sm">
                        Address Line 2 (Optional)
                      </Label>
                      {isEditingAddress ? (
                        <Input
                          id="addressLine2"
                          value={originalAddress.line2}
                          onChange={(e) =>
                            setOriginalAddress({
                              ...originalAddress,
                              line2: e.target.value,
                            })
                          }
                          className="text-sm"
                        />
                      ) : (
                        <p className="text-sm py-2">{originalAddress.line2}</p>
                      )}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="pincode" className="text-sm">
                          Pincode <span className="text-red-500">*</span>
                        </Label>
                        {isEditingAddress ? (
                          <>
                            <Input
                              id="pincode"
                              value={originalAddress.pincode}
                              maxLength={6}
                              required
                              onKeyPress={(e) => {
                                // Allow only digits
                                if (!/[0-9]/.test(e.key)) {
                                  e.preventDefault();
                                }
                              }}
                              onChange={async (e) => {
                                // Only allow digits in the field
                                const value = e.target.value.replace(
                                  /[^0-9]/g,
                                  ""
                                );

                                const pincode = value;
                                setOriginalAddress({
                                  ...originalAddress,
                                  pincode,
                                });

                                if (validatePincode(pincode)) {
                                  setAddressErrors((prev) => ({
                                    ...prev,
                                    pincode: "",
                                  }));
                                } else {
                                  setAddressErrors((prev) => ({
                                    ...prev,
                                    pincode: "Invalid pincode.",
                                  }));
                                }

                                // If pincode is 6 digits, try to auto-populate city and state
                                if (pincode.length === 6) {
                                  try {
                                    const response = await fetch(
                                      `/api/pincode/${pincode}`
                                    );
                                    if (response.ok) {
                                      const data = await response.json();
                                      if (data && data.state) {
                                        setOriginalAddress((prev) => ({
                                          ...prev,
                                          pincode,
                                          city: data.district || prev.city,
                                          state: data.state || prev.state,
                                        }));
                                      }
                                    }
                                  } catch (error) {
                                    console.error(
                                      "Error fetching pincode data:",
                                      error
                                    );
                                  }
                                }
                              }}
                              className="text-sm"
                            />
                            {addressErrors.pincode && (
                              <p className="text-xs text-red-500">
                                {addressErrors.pincode}
                              </p>
                            )}
                          </>
                        ) : (
                          <p className="text-sm py-2">
                            {originalAddress.pincode}
                          </p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="city" className="text-sm">
                          City
                        </Label>
                        {isEditingAddress ? (
                          <Input
                            id="city"
                            value={originalAddress.city}
                            onChange={(e) =>
                              setOriginalAddress({
                                ...originalAddress,
                                city: e.target.value,
                              })
                            }
                            className="text-sm"
                          />
                        ) : (
                          <p className="text-sm py-2">{originalAddress.city}</p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="state" className="text-sm">
                          State
                        </Label>
                        {isEditingAddress ? (
                          <Input
                            id="state"
                            value={originalAddress.state}
                            onChange={(e) =>
                              setOriginalAddress({
                                ...originalAddress,
                                state: e.target.value,
                              })
                            }
                            className="text-sm"
                          />
                        ) : (
                          <p className="text-sm py-2">
                            {originalAddress.state}
                          </p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-end space-x-2">
                    {isEditingAddress ? (
                      <>
                        <Button
                          variant="ghost"
                          onClick={() =>
                            handleCancel(
                              setIsEditingAddress,
                              setOriginalAddress,
                              originalAddress,
                              setAddressErrors,
                              { line1: "", city: "", state: "", pincode: "" }
                            )
                          }
                          className="text-xs md:text-sm"
                        >
                          <X className="mr-2 h-4 w-4" />
                          Cancel
                        </Button>
                        <Button
                          onClick={saveAddress}
                          disabled={isSavingAddress}
                          className="text-xs md:text-sm"
                        >
                          {isSavingAddress ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Saving...
                            </>
                          ) : (
                            <>
                              <Save className="mr-2 h-4 w-4" />
                              Save Changes
                            </>
                          )}
                        </Button>
                      </>
                    ) : (
                      <>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="destructive"
                              className="text-xs md:text-sm"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will clear your address information. This
                                action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={deleteAddress}>
                                Continue
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                        <Button
                          onClick={() =>
                            handleEdit(
                              setOriginalAddress,
                              originalAddress,
                              setIsEditingAddress
                            )
                          }
                          className="text-xs md:text-sm"
                        >
                          <Pencil className="mr-2 h-4 w-4" />
                          Edit
                        </Button>
                      </>
                    )}
                  </CardFooter>
                </Card>
              </TabsContent>

              <TabsContent value="notifications" className="space-y-6 mt-0">
                <Card>
                  <CardHeader>
                    <CardTitle>Notification Preferences</CardTitle>
                    <CardDescription>
                      Choose how you want to be notified
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div>
                      <h3 className="text-sm font-medium mb-4">
                        Email Notifications
                      </h3>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <Mailbox className="h-4 w-4 text-muted-foreground" />
                            <Label htmlFor="email-orders" className="flex-1">
                              New Orders
                            </Label>
                          </div>
                          <Switch
                            id="email-orders"
                            checked={notificationSettings.email.orders}
                            onCheckedChange={(checked) =>
                              handleNotificationChange(
                                "email",
                                "orders",
                                checked
                              )
                            }
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <Wallet className="h-4 w-4 text-muted-foreground" />
                            <Label htmlFor="email-payments" className="flex-1">
                              Payment Updates
                            </Label>
                          </div>
                          <Switch
                            id="email-payments"
                            checked={notificationSettings.email.payments}
                            onCheckedChange={(checked) =>
                              handleNotificationChange(
                                "email",
                                "payments",
                                checked
                              )
                            }
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <Truck className="h-4 w-4 text-muted-foreground" />
                            <Label htmlFor="email-returns" className="flex-1">
                              Returns & Refunds
                            </Label>
                          </div>
                          <Switch
                            id="email-returns"
                            checked={notificationSettings.email.returns}
                            onCheckedChange={(checked) =>
                              handleNotificationChange(
                                "email",
                                "returns",
                                checked
                              )
                            }
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <MessageSquare className="h-4 w-4 text-muted-foreground" />
                            <Label htmlFor="email-reviews" className="flex-1">
                              Customer Reviews
                            </Label>
                          </div>
                          <Switch
                            id="email-reviews"
                            checked={notificationSettings.email.reviews}
                            onCheckedChange={(checked) =>
                              handleNotificationChange(
                                "email",
                                "reviews",
                                checked
                              )
                            }
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <Percent className="h-4 w-4 text-muted-foreground" />
                            <Label
                              htmlFor="email-promotions"
                              className="flex-1"
                            >
                              Promotions & Offers
                            </Label>
                          </div>
                          <Switch
                            id="email-promotions"
                            checked={notificationSettings.email.promotions}
                            onCheckedChange={(checked) =>
                              handleNotificationChange(
                                "email",
                                "promotions",
                                checked
                              )
                            }
                          />
                        </div>
                      </div>
                    </div>

                    <Separator />

                    <div>
                      <h3 className="text-sm font-medium mb-4">
                        SMS Notifications
                      </h3>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <Mailbox className="h-4 w-4 text-muted-foreground" />
                            <Label htmlFor="sms-orders" className="flex-1">
                              New Orders
                            </Label>
                          </div>
                          <Switch
                            id="sms-orders"
                            checked={notificationSettings.sms.orders}
                            onCheckedChange={(checked) =>
                              handleNotificationChange("sms", "orders", checked)
                            }
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <Wallet className="h-4 w-4 text-muted-foreground" />
                            <Label htmlFor="sms-payments" className="flex-1">
                              Payment Updates
                            </Label>
                          </div>
                          <Switch
                            id="sms-payments"
                            checked={notificationSettings.sms.payments}
                            onCheckedChange={(checked) =>
                              handleNotificationChange(
                                "sms",
                                "payments",
                                checked
                              )
                            }
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <Truck className="h-4 w-4 text-muted-foreground" />
                            <Label htmlFor="sms-returns" className="flex-1">
                              Returns & Refunds
                            </Label>
                          </div>
                          <Switch
                            id="sms-returns"
                            checked={notificationSettings.sms.returns}
                            onCheckedChange={(checked) =>
                              handleNotificationChange(
                                "sms",
                                "returns",
                                checked
                              )
                            }
                          />
                        </div>
                      </div>
                    </div>

                    <Separator />

                    <div>
                      <h3 className="text-sm font-medium mb-4">
                        Push Notifications
                      </h3>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <Mailbox className="h-4 w-4 text-muted-foreground" />
                            <Label htmlFor="push-orders" className="flex-1">
                              New Orders
                            </Label>
                          </div>
                          <Switch
                            id="push-orders"
                            checked={notificationSettings.push.orders}
                            onCheckedChange={(checked) =>
                              handleNotificationChange(
                                "push",
                                "orders",
                                checked
                              )
                            }
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <Wallet className="h-4 w-4 text-muted-foreground" />
                            <Label htmlFor="push-payments" className="flex-1">
                              Payment Updates
                            </Label>
                          </div>
                          <Switch
                            id="push-payments"
                            checked={notificationSettings.push.payments}
                            onCheckedChange={(checked) =>
                              handleNotificationChange(
                                "push",
                                "payments",
                                checked
                              )
                            }
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <Truck className="h-4 w-4 text-muted-foreground" />
                            <Label htmlFor="push-returns" className="flex-1">
                              Returns & Refunds
                            </Label>
                          </div>
                          <Switch
                            id="push-returns"
                            checked={notificationSettings.push.returns}
                            onCheckedChange={(checked) =>
                              handleNotificationChange(
                                "push",
                                "returns",
                                checked
                              )
                            }
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <MessageSquare className="h-4 w-4 text-muted-foreground" />
                            <Label htmlFor="push-reviews" className="flex-1">
                              Customer Reviews
                            </Label>
                          </div>
                          <Switch
                            id="push-reviews"
                            checked={notificationSettings.push.reviews}
                            onCheckedChange={(checked) =>
                              handleNotificationChange(
                                "push",
                                "reviews",
                                checked
                              )
                            }
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <Percent className="h-4 w-4 text-muted-foreground" />
                            <Label htmlFor="push-promotions" className="flex-1">
                              Promotions & Offers
                            </Label>
                          </div>
                          <Switch
                            id="push-promotions"
                            checked={notificationSettings.push.promotions}
                            onCheckedChange={(checked) =>
                              handleNotificationChange(
                                "push",
                                "promotions",
                                checked
                              )
                            }
                          />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-end space-x-2">
                    {isEditingStoreInfo ? (
                      <>
                        <Button
                          variant="ghost"
                          onClick={() =>
                            handleCancel(
                              setIsEditingStoreInfo,
                              setOriginalStoreSettings,
                              originalStoreSettings
                            )
                          }
                        >
                          Cancel
                        </Button>
                        <Button
                          onClick={saveStoreSettings}
                          disabled={isSavingStoreSettings}
                        >
                          {isSavingStoreSettings ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Saving...
                            </>
                          ) : (
                            <>
                              <Save className="mr-2 h-4 w-4" />
                              Save Changes
                            </>
                          )}
                        </Button>
                      </>
                    ) : (
                      <Button
                        onClick={() =>
                          handleEdit(
                            setOriginalStoreSettings,
                            originalStoreSettings,
                            setIsEditingStoreInfo
                          )
                        }
                      >
                        <Pencil className="mr-2 h-4 w-4" />
                        Edit
                      </Button>
                    )}
                  </CardFooter>
                </Card>
              </TabsContent>

              <TabsContent value="store" className="space-y-6 mt-0">
                <Card>
                  <CardHeader>
                    <CardTitle>Store Information</CardTitle>
                    <CardDescription>
                      Manage your store's basic information
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="storeName">Store Name</Label>
                      <Input
                        id="storeName"
                        value={originalStoreSettings.name}
                        onChange={(e) =>
                          setOriginalStoreSettings({
                            ...originalStoreSettings,
                            name: e.target.value,
                          })
                        }
                        placeholder="Your Store Name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="storeDescription">
                        Store Description
                      </Label>
                      <Textarea
                        id="storeDescription"
                        rows={4}
                        value={originalStoreSettings.description}
                        onChange={(e) =>
                          setOriginalStoreSettings({
                            ...originalStoreSettings,
                            description: e.target.value,
                          })
                        }
                        placeholder="Describe your store and what you sell..."
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="contactEmail">Contact Email</Label>
                        <Input
                          id="contactEmail"
                          type="email"
                          value={originalStoreSettings.contactEmail}
                          onChange={(e) =>
                            setOriginalStoreSettings({
                              ...originalStoreSettings,
                              contactEmail: e.target.value,
                            })
                          }
                          placeholder="store@example.com"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="contactPhone">Contact Phone</Label>
                        <Input
                          id="contactPhone"
                          value={originalStoreSettings.contactPhone}
                          maxLength={10}
                          onKeyPress={(e) => {
                            // Allow only digits
                            if (!/[0-9]/.test(e.key)) {
                              e.preventDefault();
                            }
                          }}
                          onChange={(e) => {
                            // Only allow digits in the field
                            const value = e.target.value.replace(/[^0-9]/g, "");
                            setOriginalStoreSettings({
                              ...originalStoreSettings,
                              contactPhone: value,
                            });
                          }}
                          placeholder="9876543210"
                        />
                        <p className="text-xs text-muted-foreground">
                          Enter a 10-digit number without spaces or special
                          characters
                        </p>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-end space-x-2">
                    {isEditingStoreInfo ? (
                      <>
                        <Button
                          variant="ghost"
                          onClick={() =>
                            handleCancel(
                              setIsEditingStoreInfo,
                              setOriginalStoreSettings,
                              originalStoreSettings
                            )
                          }
                        >
                          Cancel
                        </Button>
                        <Button
                          onClick={saveStoreSettings}
                          disabled={isSavingStoreSettings}
                        >
                          {isSavingStoreSettings ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Saving...
                            </>
                          ) : (
                            <>
                              <Save className="mr-2 h-4 w-4" />
                              Save Changes
                            </>
                          )}
                        </Button>
                      </>
                    ) : (
                      <Button
                        onClick={() =>
                          handleEdit(
                            setOriginalStoreSettings,
                            originalStoreSettings,
                            setIsEditingStoreInfo
                          )
                        }
                      >
                        <Pencil className="mr-2 h-4 w-4" />
                        Edit
                      </Button>
                    )}
                  </CardFooter>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Store Branding</CardTitle>
                    <CardDescription>
                      Customize your store's appearance
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="storeLogo">Store Logo</Label>
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <Input
                              id="storeLogo"
                              value={originalStoreSettings.logo}
                              onChange={(e) =>
                                setOriginalStoreSettings({
                                  ...originalStoreSettings,
                                  logo: e.target.value,
                                })
                              }
                              placeholder="https://example.com/logo.png"
                              className="flex-1"
                              readOnly={!isEditingStoreBranding}
                            />
                            <span className="text-sm text-muted-foreground">
                              or
                            </span>
                            <FileUpload
                              onChange={(url: string) =>
                                setOriginalStoreSettings({
                                  ...originalStoreSettings,
                                  logo: url,
                                })
                              }
                              value={originalStoreSettings.logo}
                              label="Upload Logo"
                              accept="image/*"
                              maxSizeMB={2}
                              id="logo-upload"
                            />
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Recommended size: 200x200px. Max file size: 2MB.
                            Supported formats: JPG, PNG, SVG.
                          </div>
                        </div>
                        {originalStoreSettings.logo && (
                          <div className="mt-2 p-2 border rounded-md flex justify-center">
                            <img
                              src={originalStoreSettings.logo}
                              alt="Store Logo"
                              className="h-20 w-auto object-contain"
                              onError={(e) =>
                                ((e.target as HTMLImageElement).src =
                                  "https://via.placeholder.com/150?text=Logo+Preview")
                              }
                            />
                          </div>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="storeBanner">Store Banner</Label>
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <Input
                              id="storeBanner"
                              value={originalStoreSettings.banner}
                              onChange={(e) =>
                                setOriginalStoreSettings({
                                  ...originalStoreSettings,
                                  banner: e.target.value,
                                })
                              }
                              placeholder="https://example.com/banner.jpg"
                              className="flex-1"
                              readOnly={!isEditingStoreBranding}
                            />
                            <span className="text-sm text-muted-foreground">
                              or
                            </span>
                            <FileUpload
                              onChange={(url: string) =>
                                setOriginalStoreSettings({
                                  ...originalStoreSettings,
                                  banner: url,
                                })
                              }
                              value={originalStoreSettings.banner}
                              label="Upload Banner"
                              accept="image/*"
                              maxSizeMB={5}
                              id="banner-upload"
                            />
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Recommended size: 1200x300px. Max file size: 5MB.
                            Supported formats: JPG, PNG.
                          </div>
                        </div>
                        {originalStoreSettings.banner && (
                          <div className="mt-2 p-2 border rounded-md flex justify-center">
                            <img
                              src={originalStoreSettings.banner}
                              alt="Store Banner"
                              className="h-20 w-full object-cover rounded-md"
                              onError={(e) =>
                                ((e.target as HTMLImageElement).src =
                                  "https://via.placeholder.com/800x200?text=Banner+Preview")
                              }
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-end space-x-2">
                    {isEditingStoreBranding ? (
                      <>
                        <Button
                          variant="ghost"
                          onClick={() =>
                            handleCancel(
                              setIsEditingStoreBranding,
                              setOriginalStoreSettings,
                              originalStoreSettings
                            )
                          }
                        >
                          Cancel
                        </Button>
                        <Button
                          onClick={saveStoreSettings}
                          disabled={isSavingStoreSettings}
                        >
                          {isSavingStoreSettings ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Saving...
                            </>
                          ) : (
                            <>
                              <Save className="mr-2 h-4 w-4" />
                              Save Changes
                            </>
                          )}
                        </Button>
                      </>
                    ) : (
                      <Button
                        onClick={() =>
                          handleEdit(
                            setOriginalStoreSettings,
                            originalStoreSettings,
                            setIsEditingStoreBranding
                          )
                        }
                      >
                        <Pencil className="mr-2 h-4 w-4" />
                        Edit
                      </Button>
                    )}
                  </CardFooter>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Social Media Links</CardTitle>
                    <CardDescription>
                      Connect your store to social networks
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="facebookLink">
                          <div className="flex items-center">
                            <span className="mr-2">Facebook</span>
                          </div>
                        </Label>
                        <Input
                          id="facebookLink"
                          value={originalStoreSettings.socialLinks.facebook}
                          onChange={(e) =>
                            setOriginalStoreSettings({
                              ...originalStoreSettings,
                              socialLinks: {
                                ...originalStoreSettings.socialLinks,
                                facebook: e.target.value,
                              },
                            })
                          }
                          placeholder="https://facebook.com/your-page"
                          readOnly={!isEditingSocialLinks}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="instagramLink">
                          <div className="flex items-center">
                            <span className="mr-2">Instagram</span>
                          </div>
                        </Label>
                        <Input
                          id="instagramLink"
                          value={originalStoreSettings.socialLinks.instagram}
                          onChange={(e) =>
                            setOriginalStoreSettings({
                              ...originalStoreSettings,
                              socialLinks: {
                                ...originalStoreSettings.socialLinks,
                                instagram: e.target.value,
                              },
                            })
                          }
                          placeholder="https://instagram.com/your-handle"
                          readOnly={!isEditingSocialLinks}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="twitterLink">
                          <div className="flex items-center">
                            <span className="mr-2">Twitter</span>
                          </div>
                        </Label>
                        <Input
                          id="twitterLink"
                          value={originalStoreSettings.socialLinks.twitter}
                          onChange={(e) =>
                            setOriginalStoreSettings({
                              ...originalStoreSettings,
                              socialLinks: {
                                ...originalStoreSettings.socialLinks,
                                twitter: e.target.value,
                              },
                            })
                          }
                          placeholder="https://twitter.com/your-handle"
                          readOnly={!isEditingSocialLinks}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="websiteLink">
                          <div className="flex items-center">
                            <span className="mr-2">Website</span>
                          </div>
                        </Label>
                        <Input
                          id="websiteLink"
                          value={originalStoreSettings.socialLinks.website}
                          onChange={(e) =>
                            setOriginalStoreSettings({
                              ...originalStoreSettings,
                              socialLinks: {
                                ...originalStoreSettings.socialLinks,
                                website: e.target.value,
                              },
                            })
                          }
                          placeholder="https://your-website.com"
                          readOnly={!isEditingSocialLinks}
                        />
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-end space-x-2">
                    {isEditingSocialLinks ? (
                      <>
                        <Button
                          variant="ghost"
                          onClick={() =>
                            handleCancel(
                              setIsEditingSocialLinks,
                              setOriginalStoreSettings,
                              originalStoreSettings
                            )
                          }
                        >
                          Cancel
                        </Button>
                        <Button
                          onClick={saveStoreSettings}
                          disabled={isSavingStoreSettings}
                        >
                          {isSavingStoreSettings ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Saving...
                            </>
                          ) : (
                            <>
                              <Save className="mr-2 h-4 w-4" />
                              Save Changes
                            </>
                          )}
                        </Button>
                      </>
                    ) : (
                      <Button
                        onClick={() =>
                          handleEdit(
                            setOriginalStoreSettings,
                            originalStoreSettings,
                            setIsEditingSocialLinks
                          )
                        }
                      >
                        <Pencil className="mr-2 h-4 w-4" />
                        Edit
                      </Button>
                    )}
                  </CardFooter>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Business Hours</CardTitle>
                    <CardDescription>
                      Set your store operating hours
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {originalStoreSettings.businessHours.map(
                        (dayHours, index) => (
                          <div
                            key={dayHours.day}
                            className="flex items-center space-x-4"
                          >
                            <div className="w-24">
                              <Label>{dayHours.day}</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Switch
                                checked={dayHours.open}
                                onCheckedChange={(checked) => {
                                  const newBusinessHours = [
                                    ...originalStoreSettings.businessHours,
                                  ];
                                  newBusinessHours[index] = {
                                    ...dayHours,
                                    open: checked,
                                  };
                                  setOriginalStoreSettings({
                                    ...originalStoreSettings,
                                    businessHours: newBusinessHours,
                                  });
                                }}
                                disabled={!isEditingBusinessHours}
                              />
                              <Label>{dayHours.open ? "Open" : "Closed"}</Label>
                            </div>
                            {dayHours.open && (
                              <>
                                <div className="flex items-center space-x-2">
                                  <Label
                                    htmlFor={`openTime-${dayHours.day}`}
                                    className="sr-only"
                                  >
                                    Open Time
                                  </Label>
                                  <Input
                                    id={`openTime-${dayHours.day}`}
                                    type="time"
                                    value={dayHours.openTime}
                                    onChange={(e) => {
                                      const newBusinessHours = [
                                        ...originalStoreSettings.businessHours,
                                      ];
                                      newBusinessHours[index] = {
                                        ...dayHours,
                                        openTime: e.target.value,
                                      };
                                      setOriginalStoreSettings({
                                        ...originalStoreSettings,
                                        businessHours: newBusinessHours,
                                      });
                                    }}
                                    className="w-24"
                                    readOnly={!isEditingBusinessHours}
                                  />
                                </div>
                                <span>to</span>
                                <div className="flex items-center space-x-2">
                                  <Label
                                    htmlFor={`closeTime-${dayHours.day}`}
                                    className="sr-only"
                                  >
                                    Close Time
                                  </Label>
                                  <Input
                                    id={`closeTime-${dayHours.day}`}
                                    type="time"
                                    value={dayHours.closeTime}
                                    onChange={(e) => {
                                      const newBusinessHours = [
                                        ...originalStoreSettings.businessHours,
                                      ];
                                      newBusinessHours[index] = {
                                        ...dayHours,
                                        closeTime: e.target.value,
                                      };
                                      setOriginalStoreSettings({
                                        ...originalStoreSettings,
                                        businessHours: newBusinessHours,
                                      });
                                    }}
                                    className="w-24"
                                    readOnly={!isEditingBusinessHours}
                                  />
                                </div>
                              </>
                            )}
                          </div>
                        )
                      )}
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-end space-x-2">
                    {isEditingBusinessHours ? (
                      <>
                        <Button
                          variant="ghost"
                          onClick={() =>
                            handleCancel(
                              setIsEditingBusinessHours,
                              setOriginalStoreSettings,
                              originalStoreSettings
                            )
                          }
                        >
                          Cancel
                        </Button>
                        <Button
                          onClick={saveStoreSettings}
                          disabled={isSavingStoreSettings}
                        >
                          {isSavingStoreSettings ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Saving...
                            </>
                          ) : (
                            <>
                              <Save className="mr-2 h-4 w-4" />
                              Save Changes
                            </>
                          )}
                        </Button>
                      </>
                    ) : (
                      <Button
                        onClick={() =>
                          handleEdit(
                            setOriginalStoreSettings,
                            originalStoreSettings,
                            setIsEditingBusinessHours
                          )
                        }
                      >
                        <Pencil className="mr-2 h-4 w-4" />
                        Edit
                      </Button>
                    )}
                  </CardFooter>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Holiday Mode</CardTitle>
                    <CardDescription>
                      Temporarily disable your store for vacation or other
                      reasons
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium">Holiday Mode</h3>
                        <p className="text-sm text-muted-foreground">
                          When enabled, your store will not accept new orders,
                          but customers can still browse products.
                        </p>
                      </div>
                      <Switch
                        checked={holidayMode}
                        onCheckedChange={toggleHolidayMode}
                        disabled={isLoading}
                      />
                    </div>

                    {holidayMode && (
                      <div className="rounded-md bg-amber-50 p-4 border border-amber-200">
                        <div className="flex items-start">
                          <Calendar className="h-5 w-5 text-amber-600 mt-0.5 mr-3" />
                          <div>
                            <h4 className="font-medium text-amber-800">
                              Holiday Mode Active
                            </h4>
                            <p className="text-sm text-amber-700 mt-1">
                              Your store is currently not accepting new orders.
                              Customers can browse but cannot place orders.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {holidayMode && (
                      <div className="space-y-2">
                        <Label htmlFor="holidayMessage">
                          Holiday Message (Optional)
                        </Label>
                        <Textarea
                          id="holidayMessage"
                          placeholder="Enter a message to display to customers while your store is in holiday mode..."
                          rows={3}
                          defaultValue={settings?.holidayMessage || ""}
                        />
                        <p className="text-xs text-muted-foreground">
                          This message will be displayed to customers when they
                          visit your store.
                        </p>
                      </div>
                    )}
                  </CardContent>
                  {holidayMode && (
                    <CardFooter className="flex justify-end">
                      <Button>
                        <Save className="mr-2 h-4 w-4" />
                        Save Message
                      </Button>
                    </CardFooter>
                  )}
                </Card>
              </TabsContent>

              <TabsContent value="billing" className="space-y-6 mt-0">
                <Card>
                  <CardHeader>
                    <CardTitle>Billing Information</CardTitle>
                    <CardDescription>
                      Manage your billing and tax information
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="gstin">
                        GSTIN Number <span className="text-red-500">*</span>
                      </Label>
                      {isEditingBillingInfo ? (
                        <>
                          <Input
                            id="gstin"
                            value={originalBillingInfo.gstin}
                            onChange={(e) =>
                              setOriginalBillingInfo({
                                ...originalBillingInfo,
                                gstin: e.target.value.toUpperCase(),
                              })
                            }
                          />
                          {billingInfoErrors.gstin && (
                            <p className="text-xs text-red-500">
                              {billingInfoErrors.gstin}
                            </p>
                          )}
                        </>
                      ) : (
                        <p className="text-sm py-2">
                          {originalBillingInfo.gstin}
                        </p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="businessName">
                        Legal Business Name{" "}
                        <span className="text-red-500">*</span>
                      </Label>
                      {isEditingBillingInfo ? (
                        <>
                          <Input
                            id="businessName"
                            value={originalBillingInfo.businessName}
                            onChange={(e) =>
                              setOriginalBillingInfo({
                                ...originalBillingInfo,
                                businessName: e.target.value,
                              })
                            }
                          />
                          {billingInfoErrors.businessName && (
                            <p className="text-xs text-red-500">
                              {billingInfoErrors.businessName}
                            </p>
                          )}
                        </>
                      ) : (
                        <p className="text-sm py-2">
                          {originalBillingInfo.businessName}
                        </p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="panNumber">
                        PAN Number <span className="text-red-500">*</span>
                      </Label>
                      {isEditingBillingInfo ? (
                        <>
                          <Input
                            id="panNumber"
                            value={originalBillingInfo.panNumber}
                            onChange={(e) =>
                              setOriginalBillingInfo({
                                ...originalBillingInfo,
                                panNumber: e.target.value.toUpperCase(),
                              })
                            }
                          />
                          {billingInfoErrors.panNumber && (
                            <p className="text-xs text-red-500">
                              {billingInfoErrors.panNumber}
                            </p>
                          )}
                        </>
                      ) : (
                        <p className="text-sm py-2">
                          {originalBillingInfo.panNumber}
                        </p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label>Business Type</Label>
                      {isEditingBillingInfo ? (
                        <RadioGroup
                          value={originalBillingInfo.businessType}
                          onValueChange={(value) =>
                            setOriginalBillingInfo({
                              ...originalBillingInfo,
                              businessType: value,
                            })
                          }
                        >
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem
                              value="individual"
                              id="individual"
                            />
                            <Label htmlFor="individual">
                              Individual/Proprietorship
                            </Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem
                              value="partnership"
                              id="partnership"
                            />
                            <Label htmlFor="partnership">Partnership</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="company" id="company" />
                            <Label htmlFor="company">
                              Private Limited/Limited Company
                            </Label>
                          </div>
                        </RadioGroup>
                      ) : (
                        <p className="text-sm py-2">
                          {originalBillingInfo.businessType}
                        </p>
                      )}
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-end space-x-2">
                    {isEditingBillingInfo ? (
                      <>
                        <Button
                          variant="ghost"
                          onClick={() =>
                            handleCancel(
                              setIsEditingBillingInfo,
                              setOriginalBillingInfo,
                              originalBillingInfo,
                              setBillingInfoErrors,
                              { gstin: "", businessName: "", panNumber: "" }
                            )
                          }
                        >
                          Cancel
                        </Button>
                        <Button
                          onClick={saveBillingInfo}
                          disabled={isSavingBillingInfo}
                        >
                          {isSavingBillingInfo ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Saving...
                            </>
                          ) : (
                            <>
                              <Save className="mr-2 h-4 w-4" />
                              Save Changes
                            </>
                          )}
                        </Button>
                      </>
                    ) : (
                      <>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="destructive"
                              className="text-xs md:text-sm"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will clear your billing information. This
                                action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={deleteBillingInfo}>
                                Continue
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                        <Button
                          onClick={() =>
                            handleEdit(
                              setOriginalBillingInfo,
                              originalBillingInfo,
                              setIsEditingBillingInfo
                            )
                          }
                        >
                          <Pencil className="mr-2 h-4 w-4" />
                          Edit
                        </Button>
                      </>
                    )}
                  </CardFooter>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Bank Account Information</CardTitle>
                    <CardDescription>
                      Manage your payout details
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="accountName">
                        Account Holder Name{" "}
                        <span className="text-red-500">*</span>
                      </Label>
                      {isEditingBankInfo ? (
                        <>
                          <Input
                            id="accountName"
                            value={originalBankInfo.accountName}
                            onChange={(e) =>
                              setOriginalBankInfo({
                                ...originalBankInfo,
                                accountName: e.target.value,
                              })
                            }
                          />
                          {bankInfoErrors.accountName && (
                            <p className="text-xs text-red-500">
                              {bankInfoErrors.accountName}
                            </p>
                          )}
                        </>
                      ) : (
                        <p className="text-sm py-2">
                          {originalBankInfo.accountName}
                        </p>
                      )}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="accountNumber">
                          Account Number <span className="text-red-500">*</span>
                        </Label>
                        {isEditingBankInfo ? (
                          <>
                            <Input
                              id="accountNumber"
                              value={originalBankInfo.accountNumber}
                              onChange={(e) =>
                                setOriginalBankInfo({
                                  ...originalBankInfo,
                                  accountNumber: e.target.value,
                                })
                              }
                            />
                            {bankInfoErrors.accountNumber && (
                              <p className="text-xs text-red-500">
                                {bankInfoErrors.accountNumber}
                              </p>
                            )}
                          </>
                        ) : (
                          <p className="text-sm py-2">
                            {originalBankInfo.accountNumber}
                          </p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="ifscCode">
                          IFSC Code <span className="text-red-500">*</span>
                        </Label>
                        {isEditingBankInfo ? (
                          <>
                            <Input
                              id="ifscCode"
                              value={originalBankInfo.ifscCode}
                              onChange={(e) =>
                                setOriginalBankInfo({
                                  ...originalBankInfo,
                                  ifscCode: e.target.value.toUpperCase(),
                                })
                              }
                            />
                            {bankInfoErrors.ifscCode && (
                              <p className="text-xs text-red-500">
                                {bankInfoErrors.ifscCode}
                              </p>
                            )}
                          </>
                        ) : (
                          <p className="text-sm py-2">
                            {originalBankInfo.ifscCode}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="bankName">
                        Bank Name <span className="text-red-500">*</span>
                      </Label>
                      {isEditingBankInfo ? (
                        <>
                          <Input
                            id="bankName"
                            value={originalBankInfo.bankName}
                            onChange={(e) =>
                              setOriginalBankInfo({
                                ...originalBankInfo,
                                bankName: e.target.value,
                              })
                            }
                          />
                          {bankInfoErrors.bankName && (
                            <p className="text-xs text-red-500">
                              {bankInfoErrors.bankName}
                            </p>
                          )}
                        </>
                      ) : (
                        <p className="text-sm py-2">
                          {originalBankInfo.bankName}
                        </p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="branchName">Branch Name</Label>
                      {isEditingBankInfo ? (
                        <Input
                          id="branchName"
                          value={originalBankInfo.branchName}
                          onChange={(e) =>
                            setOriginalBankInfo({
                              ...originalBankInfo,
                              branchName: e.target.value,
                            })
                          }
                        />
                      ) : (
                        <p className="text-sm py-2">
                          {originalBankInfo.branchName}
                        </p>
                      )}
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-end space-x-2">
                    {isEditingBankInfo ? (
                      <>
                        <Button
                          variant="ghost"
                          onClick={() =>
                            handleCancel(
                              setIsEditingBankInfo,
                              setOriginalBankInfo,
                              originalBankInfo,
                              setBankInfoErrors,
                              {
                                accountName: "",
                                accountNumber: "",
                                ifscCode: "",
                                bankName: "",
                              }
                            )
                          }
                        >
                          Cancel
                        </Button>
                        <Button
                          onClick={saveBankInfo}
                          disabled={isSavingBankInfo}
                        >
                          {isSavingBankInfo ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Saving...
                            </>
                          ) : (
                            <>
                              <Save className="mr-2 h-4 w-4" />
                              Save Changes
                            </>
                          )}
                        </Button>
                      </>
                    ) : (
                      <>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="destructive"
                              className="text-xs md:text-sm"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will clear your bank information. This
                                action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={deleteBankInfo}>
                                Continue
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                        <Button
                          onClick={() =>
                            handleEdit(
                              setOriginalBankInfo,
                              originalBankInfo,
                              setIsEditingBankInfo
                            )
                          }
                        >
                          <Pencil className="mr-2 h-4 w-4" />
                          Edit
                        </Button>
                      </>
                    )}
                  </CardFooter>
                </Card>
              </TabsContent>

              <TabsContent value="pickup_address" className="space-y-6 mt-0">
                <Card>
                  <CardHeader>
                    <CardTitle>Pickup Address</CardTitle>
                    <CardDescription>
                      Set your business pickup address for invoices and shipping
                      labels
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="businessName">
                          Business Name <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="businessName"
                          value={pickupAddress.businessName}
                          onChange={(e) =>
                            setPickupAddress({
                              ...pickupAddress,
                              businessName: e.target.value,
                            })
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="gstin">GSTIN</Label>
                        <Input
                          id="gstin"
                          value={pickupAddress.gstin}
                          onChange={(e) =>
                            setPickupAddress({
                              ...pickupAddress,
                              gstin: e.target.value,
                            })
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="contactName">
                          Contact Person <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="contactName"
                          value={pickupAddress.contactName}
                          onChange={(e) =>
                            setPickupAddress({
                              ...pickupAddress,
                              contactName: e.target.value,
                            })
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="pickupPhone">
                          Phone Number <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="pickupPhone"
                          value={pickupAddress.phone}
                          maxLength={10}
                          onKeyPress={(e) => {
                            // Allow only digits
                            if (!/[0-9]/.test(e.key)) {
                              e.preventDefault();
                            }
                          }}
                          onChange={(e) => {
                            // Only allow digits in the field
                            const value = e.target.value.replace(/[^0-9]/g, "");
                            setPickupAddress({
                              ...pickupAddress,
                              phone: value,
                            });
                          }}
                        />
                        <p className="text-xs text-muted-foreground">
                          Enter a 10-digit number without spaces or special
                          characters
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2 mt-4">
                      <Label htmlFor="authorizationSignature">
                        Authorization Signature
                      </Label>
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <Input
                            id="authorizationSignature"
                            value={pickupAddress.authorizationSignature}
                            onChange={(e) =>
                              setPickupAddress({
                                ...pickupAddress,
                                authorizationSignature: e.target.value,
                              })
                            }
                            placeholder="https://example.com/signature.png"
                            className="flex-1"
                          />
                          <span className="text-sm text-muted-foreground">
                            or
                          </span>
                          <FileUpload
                            onChange={(url: string) =>
                              setPickupAddress({
                                ...pickupAddress,
                                authorizationSignature: url,
                              })
                            }
                            value={pickupAddress.authorizationSignature}
                            label="Upload Signature"
                            accept="image/*"
                            maxSizeMB={1}
                            id="signature-upload"
                          />
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Upload your signature image. Max file size: 1MB.
                          Supported formats: JPG, PNG.
                        </div>
                        {pickupAddress.authorizationSignature && (
                          <div className="mt-2 p-2 border rounded-md flex justify-center">
                            <img
                              src={pickupAddress.authorizationSignature}
                              alt="Authorization Signature"
                              className="h-20 w-auto object-contain"
                              onError={(e) =>
                                ((e.target as HTMLImageElement).src =
                                  "https://via.placeholder.com/150?text=Signature+Preview")
                              }
                            />
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2 mt-4">
                      <Label htmlFor="pickupLine1">
                        Address Line 1 <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="pickupLine1"
                        value={pickupAddress.line1}
                        onChange={(e) =>
                          setPickupAddress({
                            ...pickupAddress,
                            line1: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="pickupLine2">
                        Address Line 2 (Optional)
                      </Label>
                      <Input
                        id="pickupLine2"
                        value={pickupAddress.line2}
                        onChange={(e) =>
                          setPickupAddress({
                            ...pickupAddress,
                            line2: e.target.value,
                          })
                        }
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
                      <div className="space-y-2">
                        <Label htmlFor="pickupPincode">
                          Pincode <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="pickupPincode"
                          value={pickupAddress.pincode}
                          maxLength={6}
                          required
                          onKeyPress={(e) => {
                            // Allow only digits
                            if (!/[0-9]/.test(e.key)) {
                              e.preventDefault();
                            }
                          }}
                          onChange={async (e) => {
                            // Only allow digits in the field
                            const value = e.target.value.replace(/[^0-9]/g, "");

                            const pincode = value;
                            setPickupAddress({ ...pickupAddress, pincode });

                            if (validatePincode(pincode)) {
                              setPickupAddressErrors((prev) => ({
                                ...prev,
                                pincode: "",
                              }));
                            } else if (pincode.length === 6) {
                              setPickupAddressErrors((prev) => ({
                                ...prev,
                                pincode: "Invalid pincode",
                              }));
                            }

                            // If pincode is 6 digits, try to auto-populate city and state
                            if (pincode.length === 6) {
                              try {
                                const response = await fetch(
                                  `/api/pincode/${pincode}`
                                );
                                if (response.ok) {
                                  const data = await response.json();
                                  if (data && data.state) {
                                    setPickupAddress((prev) => ({
                                      ...prev,
                                      pincode,
                                      city: data.district || prev.city,
                                      state: data.state || prev.state,
                                    }));
                                  }
                                }
                              } catch (error) {
                                console.error(
                                  "Error fetching pincode data:",
                                  error
                                );
                              }
                            }
                          }}
                        />
                        <p className="text-xs text-muted-foreground">
                          Enter a 6-digit pincode
                        </p>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="pickupCity">
                          City/District <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="pickupCity"
                          value={pickupAddress.city}
                          readOnly
                          className="bg-gray-50 cursor-not-allowed"
                        />
                        <p className="text-xs text-muted-foreground">
                          Auto-populated from PIN code
                        </p>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="pickupState">
                          State <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="pickupState"
                          value={pickupAddress.state}
                          readOnly
                          className="bg-gray-50 cursor-not-allowed"
                        />
                        <p className="text-xs text-muted-foreground">
                          Auto-populated from PIN code
                        </p>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-end space-x-2">
                    {isEditingPickupAddress ? (
                      <>
                        <Button
                          variant="ghost"
                          onClick={() =>
                            handleCancel(
                              setIsEditingPickupAddress,
                              setPickupAddress,
                              originalPickupAddress,
                              setPickupAddressErrors,
                              {
                                businessName: "",
                                gstin: "",
                                contactName: "",
                                phone: "",
                                line1: "",
                                city: "",
                                state: "",
                                pincode: "",
                                authorizationSignature: "",
                              }
                            )
                          }
                          className="text-xs md:text-sm"
                        >
                          <X className="mr-2 h-4 w-4" />
                          Cancel
                        </Button>
                        <Button
                          onClick={savePickupAddress}
                          disabled={isSavingPickupAddress}
                          className="text-xs md:text-sm"
                        >
                          {isSavingPickupAddress ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Saving...
                            </>
                          ) : (
                            <>
                              <Save className="mr-2 h-4 w-4" />
                              Save Pickup Address
                            </>
                          )}
                        </Button>
                      </>
                    ) : (
                      <>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="destructive"
                              className="text-xs md:text-sm"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will clear your pickup address. This action
                                cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={deletePickupAddress}>
                                Continue
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                        <Button
                          onClick={() =>
                            handleEdit(
                              setOriginalPickupAddress,
                              pickupAddress,
                              setIsEditingPickupAddress
                            )
                          }
                          className="text-xs md:text-sm"
                        >
                          <Pencil className="mr-2 h-4 w-4" />
                          Edit
                        </Button>
                      </>
                    )}
                  </CardFooter>
                </Card>
              </TabsContent>

              <TabsContent value="security" className="space-y-6 mt-0">
                <Card>
                  <CardHeader>
                    <CardTitle>Security Settings</CardTitle>
                    <CardDescription>
                      Manage your account security
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <h3 className="text-base font-medium">Change Password</h3>
                      <p className="text-sm text-muted-foreground">
                        Update your password to keep your account secure
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => setIsPasswordDialogOpen(true)}
                    >
                      Change Password
                    </Button>

                    <Separator className="my-4" />

                    <div className="space-y-2">
                      <h3 className="text-base font-medium">
                        Two-Factor Authentication
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Add an extra layer of security to your account
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch id="twoFactor" />
                      <Label htmlFor="twoFactor">
                        Enable Two-Factor Authentication
                      </Label>
                    </div>

                    <Separator className="my-4" />

                    <div className="space-y-2">
                      <h3 className="text-base font-medium">
                        Account Sessions
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Manage active sessions on your account
                      </p>
                    </div>
                    <Button variant="outline">View Active Sessions</Button>

                    <Separator className="my-4" />

                    <div className="space-y-2">
                      <h3 className="text-base font-medium text-destructive">
                        Danger Zone
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Permanently delete your seller account
                      </p>
                    </div>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive">
                          <LogOut className="mr-2 h-4 w-4" />
                          Delete Seller Account
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>
                            Are you absolutely sure?
                          </AlertDialogTitle>
                          <AlertDialogDescription>
                            This action cannot be undone. This will permanently
                            delete your seller account and remove your data from
                            our servers.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                            Delete Account
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>

      {/* Change Password Dialog */}
      <Dialog
        open={isPasswordDialogOpen}
        onOpenChange={setIsPasswordDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Password</DialogTitle>
            <DialogDescription>
              Enter your current password and a new password to update your
              credentials.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="currentPassword">Current Password</Label>
              <Input id="currentPassword" type="password" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password</Label>
              <Input id="newPassword" type="password" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <Input id="confirmPassword" type="password" />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsPasswordDialogOpen(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              onClick={() => changePassword("oldPassword", "newPassword")}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  <Check className="mr-2 h-4 w-4" />
                  Update Password
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SellerDashboardLayout>
  );
}
