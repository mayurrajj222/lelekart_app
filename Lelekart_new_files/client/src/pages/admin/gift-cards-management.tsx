import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import AdminLayout from "@/components/layout/admin-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  FileEdit,
  Trash2,
  Plus,
  Gift,
  Tag,
  RefreshCw,
  Copy,
  Eye,
  Calendar,
} from "lucide-react";
import {
  formatDistanceToNow,
  format,
  isValid,
  parseISO,
  addMonths,
} from "date-fns";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";

// Types for gift cards
type GiftCard = {
  id: number;
  code: string;
  initialValue: number;
  currentBalance: number;
  issuedTo: number | null;
  purchasedBy: number | null;
  isActive: boolean;
  expiryDate: string | null;
  createdAt: string;
  lastUsed: string | null;
  recipientEmail: string | null;
  recipientName: string | null;
  message: string | null;
  designTemplate: string;
};

type GiftCardTransaction = {
  id: number;
  giftCardId: number;
  userId: number | null;
  orderId: number | null;
  amount: number;
  type: string;
  transactionDate: string;
  note: string | null;
};

type GiftCardTemplate = {
  id: number;
  name: string;
  description: string | null;
  imageUrl: string | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
};

function GiftCardsManagement() {
  const [activeTab, setActiveTab] = useState("gift-cards");
  const [isAddCardDialogOpen, setIsAddCardDialogOpen] = useState(false);
  const [isEditCardDialogOpen, setIsEditCardDialogOpen] = useState(false);
  const [isAddTemplateDialogOpen, setIsAddTemplateDialogOpen] = useState(false);
  const [isEditTemplateDialogOpen, setIsEditTemplateDialogOpen] =
    useState(false);
  const [isViewTransactionsDialogOpen, setIsViewTransactionsDialogOpen] =
    useState(false);
  const [selectedGiftCard, setSelectedGiftCard] = useState<GiftCard | null>(
    null
  );
  const [selectedTemplate, setSelectedTemplate] =
    useState<GiftCardTemplate | null>(null);
  const [selectedCardForTransactions, setSelectedCardForTransactions] =
    useState<number | null>(null);
  const [newGiftCard, setNewGiftCard] = useState({
    code: "",
    initialValue: 500,
    currentBalance: 500,
    isActive: true,
    expiryDate: null as Date | null,
    expiryMonths: 12,
    recipientEmail: "",
    recipientName: "",
    message: "",
    designTemplate: "default",
  });
  const [newTemplate, setNewTemplate] = useState({
    name: "",
    description: "",
    imageUrl: "",
    active: true,
  });
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch gift cards with pagination
  const { data: giftCardsData, isLoading: isLoadingGiftCards } = useQuery({
    queryKey: ["/api/admin/gift-cards", page, limit, searchTerm],
    queryFn: async () => {
      const searchParams = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });

      if (searchTerm) {
        if (searchTerm.includes("@")) {
          searchParams.append("recipientEmail", searchTerm);
        } else {
          searchParams.append("code", searchTerm);
        }
      }

      const response = await apiRequest(
        "GET",
        `/api/admin/gift-cards?${searchParams.toString()}`
      );
      const data = await response.json();
      return data;
    },
  });

  // Fetch gift card templates
  const { data: templates = [], isLoading: isLoadingTemplates } = useQuery({
    queryKey: ["/api/admin/gift-cards/templates"],
    queryFn: async () => {
      const response = await apiRequest(
        "GET",
        "/api/admin/gift-cards/templates"
      );
      const data = await response.json();
      return data;
    },
  });

  // Fetch transactions for a specific gift card
  const { data: transactions, isLoading: isLoadingTransactions } = useQuery({
    queryKey: [
      "/api/admin/gift-cards/transactions",
      selectedCardForTransactions,
    ],
    queryFn: async () => {
      if (!selectedCardForTransactions) return { transactions: [] };
      const response = await apiRequest(
        "GET",
        `/api/admin/gift-cards/${selectedCardForTransactions}/transactions`
      );
      const data = await response.json();
      return data;
    },
    enabled: !!selectedCardForTransactions,
  });

  // Create gift card mutation
  const createGiftCardMutation = useMutation({
    mutationFn: async (cardData: any) => {
      const response = await apiRequest(
        "POST",
        "/api/admin/gift-cards",
        cardData
      );
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/gift-cards"] });
      toast({
        title: "Success",
        description: "Gift card created successfully",
      });
      setIsAddCardDialogOpen(false);
      resetNewGiftCard();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: `Failed to create gift card: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Update gift card mutation
  const updateGiftCardMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      const response = await apiRequest(
        "PUT",
        `/api/admin/gift-cards/${id}`,
        data
      );
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/gift-cards"] });
      toast({
        title: "Success",
        description: "Gift card updated successfully",
      });
      setIsEditCardDialogOpen(false);
      setSelectedGiftCard(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: `Failed to update gift card: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Delete gift card mutation
  const deleteGiftCardMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest(
        "DELETE",
        `/api/admin/gift-cards/${id}`
      );
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/gift-cards"] });
      toast({
        title: "Success",
        description: "Gift card deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: `Failed to delete gift card: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Create template mutation
  const createTemplateMutation = useMutation({
    mutationFn: async (templateData: any) => {
      const response = await apiRequest(
        "POST",
        "/api/admin/gift-cards/templates",
        templateData
      );
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/admin/gift-cards/templates"],
      });
      toast({
        title: "Success",
        description: "Template created successfully",
      });
      setIsAddTemplateDialogOpen(false);
      setNewTemplate({
        name: "",
        description: "",
        imageUrl: "",
        active: true,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: `Failed to create template: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Update template mutation
  const updateTemplateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      const response = await apiRequest(
        "PUT",
        `/api/admin/gift-cards/templates/${id}`,
        data
      );
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/admin/gift-cards/templates"],
      });
      toast({
        title: "Success",
        description: "Template updated successfully",
      });
      setIsEditTemplateDialogOpen(false);
      setSelectedTemplate(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: `Failed to update template: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Delete template mutation
  const deleteTemplateMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest(
        "DELETE",
        `/api/admin/gift-cards/templates/${id}`
      );
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/admin/gift-cards/templates"],
      });
      toast({
        title: "Success",
        description: "Template deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: `Failed to delete template: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const handleCreateGiftCard = () => {
    const cardData = { ...newGiftCard };

    // Convert the expiryDate to an ISO string for the API
    if (cardData.expiryDate) {
      cardData.expiryDate = (cardData.expiryDate as Date).toISOString();
    } else if (cardData.expiryMonths) {
      // Calculate expiry date based on months if direct date not set
      const expiryDate = addMonths(new Date(), cardData.expiryMonths);
      cardData.expiryDate = expiryDate.toISOString();
    }

    // Make sure currentBalance starts as initialValue
    cardData.currentBalance = cardData.initialValue;

    createGiftCardMutation.mutate(cardData);
  };

  const handleUpdateGiftCard = () => {
    if (!selectedGiftCard) return;

    const cardData = {
      isActive: selectedGiftCard.isActive,
      recipientEmail: selectedGiftCard.recipientEmail,
      recipientName: selectedGiftCard.recipientName,
      message: selectedGiftCard.message,
      designTemplate: selectedGiftCard.designTemplate,
    };

    // Only include expiryDate if it was modified
    if (
      selectedGiftCard.expiryDate &&
      typeof selectedGiftCard.expiryDate === "object"
    ) {
      cardData.expiryDate = (selectedGiftCard.expiryDate as Date).toISOString();
    }

    updateGiftCardMutation.mutate({ id: selectedGiftCard.id, data: cardData });
  };

  const handleCreateTemplate = () => {
    createTemplateMutation.mutate(newTemplate);
  };

  const handleUpdateTemplate = () => {
    if (!selectedTemplate) return;
    updateTemplateMutation.mutate({
      id: selectedTemplate.id,
      data: selectedTemplate,
    });
  };

  const handleDeleteGiftCard = (id: number) => {
    if (confirm("Are you sure you want to delete this gift card?")) {
      deleteGiftCardMutation.mutate(id);
    }
  };

  const handleDeleteTemplate = (id: number) => {
    if (confirm("Are you sure you want to delete this template?")) {
      deleteTemplateMutation.mutate(id);
    }
  };

  const handleEditGiftCard = (card: GiftCard) => {
    // Convert string dates to Date objects for the form
    const processedCard = { ...card };
    if (processedCard.expiryDate) {
      processedCard.expiryDate = parseISO(processedCard.expiryDate);
    }
    setSelectedGiftCard(processedCard);
    setIsEditCardDialogOpen(true);
  };

  const handleEditTemplate = (template: GiftCardTemplate) => {
    setSelectedTemplate(template);
    setIsEditTemplateDialogOpen(true);
  };

  const handleViewTransactions = (cardId: number) => {
    setSelectedCardForTransactions(cardId);
    setIsViewTransactionsDialogOpen(true);
  };

  const resetNewGiftCard = () => {
    setNewGiftCard({
      code: "",
      initialValue: 500,
      currentBalance: 500,
      isActive: true,
      expiryDate: null,
      expiryMonths: 12,
      recipientEmail: "",
      recipientName: "",
      message: "",
      designTemplate: "default",
    });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied",
      description: "Code copied to clipboard",
    });
  };

  // Helper function to format date relative to now
  const formatDate = (dateString: string | null) => {
    if (!dateString) return "No expiry";
    try {
      const date = parseISO(dateString);
      return isValid(date) ? format(date, "PPP") : "Invalid date";
    } catch (error) {
      return "Invalid date";
    }
  };

  // Helper function to format relative time
  const formatRelativeTime = (dateString: string) => {
    try {
      const date = parseISO(dateString);
      return formatDistanceToNow(date, { addSuffix: true });
    } catch (error) {
      return "Invalid date";
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-4 sm:space-y-6 px-2 sm:px-4 lg:px-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4 mb-2 sm:mb-4">
          <div>
            <h1 className="text-lg sm:text-xl lg:text-2xl font-bold">
              Gift Cards Management
            </h1>
            <p className="text-muted-foreground text-xs sm:text-sm lg:text-base">
              Manage, issue, and track gift cards and templates
            </p>
          </div>
          <Button
            onClick={() => setIsAddCardDialogOpen(true)}
            className="w-full sm:w-auto h-9 sm:h-10 text-xs sm:text-sm"
          >
            <Plus className="mr-1 sm:mr-2 h-4 w-4" />
            <span className="hidden sm:inline">Add Gift Card</span>
            <span className="sm:hidden">Add</span>
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-2 sm:grid-cols-3 gap-1">
            <TabsTrigger value="gift-cards" className="text-xs sm:text-sm">
              Gift Cards
            </TabsTrigger>
            <TabsTrigger value="templates" className="text-xs sm:text-sm">
              Templates
            </TabsTrigger>
            <TabsTrigger value="transactions" className="text-xs sm:text-sm">
              Transactions
            </TabsTrigger>
          </TabsList>
          <TabsContent value="gift-cards" className="pt-3 sm:pt-4">
            <div className="space-y-3 sm:space-y-4">
              {/* Table for desktop, cards for mobile */}
              <div className="hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs sm:text-sm">Code</TableHead>
                      <TableHead className="text-xs sm:text-sm">
                        Value
                      </TableHead>
                      <TableHead className="text-xs sm:text-sm">
                        Balance
                      </TableHead>
                      <TableHead className="text-xs sm:text-sm">
                        Recipient
                      </TableHead>
                      <TableHead className="text-xs sm:text-sm">
                        Expiry
                      </TableHead>
                      <TableHead className="text-xs sm:text-sm">
                        Status
                      </TableHead>
                      <TableHead className="text-xs sm:text-sm">
                        Actions
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {giftCardsData?.giftCards?.map((card: GiftCard) => (
                      <TableRow key={card.id}>
                        <TableCell className="text-xs sm:text-sm font-medium">
                          {card.code}
                        </TableCell>
                        <TableCell className="text-xs sm:text-sm">
                          ₹{card.initialValue}
                        </TableCell>
                        <TableCell className="text-xs sm:text-sm">
                          ₹{card.currentBalance}
                        </TableCell>
                        <TableCell className="text-xs sm:text-sm">
                          {card.recipientName || "-"}
                        </TableCell>
                        <TableCell className="text-xs sm:text-sm">
                          {card.expiryDate ? formatDate(card.expiryDate) : "-"}
                        </TableCell>
                        <TableCell className="text-xs sm:text-sm">
                          {card.isActive ? (
                            <Badge className="bg-green-100 text-green-800">
                              Active
                            </Badge>
                          ) : (
                            <Badge className="bg-red-100 text-red-800">
                              Inactive
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1 sm:gap-2">
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7 sm:h-8 sm:w-8"
                              onClick={() => handleEditGiftCard(card)}
                            >
                              <FileEdit className="h-4 w-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7 sm:h-8 sm:w-8 text-red-500"
                              onClick={() => handleDeleteGiftCard(card.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <div className="md:hidden grid grid-cols-1 gap-3 sm:gap-4">
                {giftCardsData?.giftCards?.map((card: GiftCard) => (
                  <Card key={card.id} className="p-3 sm:p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="font-medium text-xs sm:text-sm truncate">
                        {card.code}
                      </div>
                      <div className="flex gap-1 sm:gap-2">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7 sm:h-8 sm:w-8"
                          onClick={() => handleEditGiftCard(card)}
                        >
                          <FileEdit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7 sm:h-8 sm:w-8 text-red-500"
                          onClick={() => handleDeleteGiftCard(card.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="text-xs sm:text-sm mb-1">
                      Value: ₹{card.initialValue} | Balance: ₹
                      {card.currentBalance}
                    </div>
                    <div className="text-xs sm:text-sm mb-1">
                      Recipient: {card.recipientName || "-"}
                    </div>
                    <div className="text-xs sm:text-sm mb-1">
                      Expiry:{" "}
                      {card.expiryDate ? formatDate(card.expiryDate) : "-"}
                    </div>
                    <div className="text-xs sm:text-sm">
                      {card.isActive ? (
                        <Badge className="bg-green-100 text-green-800">
                          Active
                        </Badge>
                      ) : (
                        <Badge className="bg-red-100 text-red-800">
                          Inactive
                        </Badge>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          </TabsContent>
          {/* Similar responsive layouts for templates and transactions tabs would be implemented here */}
        </Tabs>
      </div>
    </AdminLayout>
  );
}

export default GiftCardsManagement;
