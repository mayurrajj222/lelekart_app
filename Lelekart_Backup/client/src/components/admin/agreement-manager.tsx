import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { SellerAgreement } from "@shared/schema";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Loader2, Pencil, Plus, FileCheck } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import ReactMarkdown from "react-markdown";
import { ScrollArea } from "@/components/ui/scroll-area";

const agreementFormSchema = z.object({
  version: z.string().refine((v) => !isNaN(parseFloat(v)), {
    message: "Version must be a valid number",
  }),
  content: z.string().min(10, {
    message: "Agreement content must be at least 10 characters",
  }),
});

type AgreementFormValues = z.infer<typeof agreementFormSchema>;

export function AgreementManager() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [editingAgreement, setEditingAgreement] = useState<SellerAgreement | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [previewContent, setPreviewContent] = useState("");
  const [activeTab, setActiveTab] = useState("edit");

  const form = useForm<AgreementFormValues>({
    resolver: zodResolver(agreementFormSchema),
    defaultValues: {
      version: "",
      content: "",
    },
  });

  // Query to fetch all agreements and requirement setting
  const { data, isLoading: isLoadingAgreements } = useQuery({
    queryKey: ["/api/admin/agreements"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/admin/agreements");
      return response.json();
    },
  });
  
  const agreements = data?.agreements || [];
  const agreementRequired = data?.agreementRequired || false;
  const settingId = data?.settingId;

  // Mutation to create a new agreement
  const createAgreementMutation = useMutation({
    mutationFn: async (data: AgreementFormValues) => {
      const response = await apiRequest("POST", "/api/admin/agreements", {
        version: parseFloat(data.version),
        content: data.content,
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Agreement created",
        description: "The seller agreement has been created successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/agreements"] });
      setDialogOpen(false);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Failed to create agreement",
        description: error.message || "An error occurred while creating the agreement.",
        variant: "destructive",
      });
    },
  });

  // Mutation to update an existing agreement
  const updateAgreementMutation = useMutation({
    mutationFn: async (data: AgreementFormValues) => {
      if (!editingAgreement) return null;
      const response = await apiRequest("PUT", `/api/admin/agreements/${editingAgreement.id}`, {
        version: parseFloat(data.version),
        content: data.content,
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Agreement updated",
        description: "The seller agreement has been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/agreements"] });
      setDialogOpen(false);
      setEditingAgreement(null);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Failed to update agreement",
        description: error.message || "An error occurred while updating the agreement.",
        variant: "destructive",
      });
    },
  });

  // Handle form submission
  const onSubmit = (data: AgreementFormValues) => {
    if (formMode === "create") {
      createAgreementMutation.mutate(data);
    } else {
      updateAgreementMutation.mutate(data);
    }
  };

  // Handle editing an agreement
  const handleEdit = (agreement: SellerAgreement) => {
    setFormMode("edit");
    setEditingAgreement(agreement);
    form.reset({
      version: String(agreement.version),
      content: agreement.content,
    });
    setDialogOpen(true);
  };

  // Handle creating a new agreement
  const handleCreate = () => {
    setFormMode("create");
    setEditingAgreement(null);
    form.reset({
      version: "",
      content: "",
    });
    setDialogOpen(true);
  };

  // Mutation to toggle agreement requirement
  const toggleRequirementMutation = useMutation({
    mutationFn: async (required: boolean) => {
      const response = await apiRequest("PUT", `/api/admin/settings/seller_agreement_required`, {
        value: required.toString(),
        description: "Determines whether sellers must accept the seller agreement to use seller features"
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Setting updated",
        description: agreementRequired 
          ? "Seller agreement is now optional" 
          : "Seller agreement is now required",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/agreements"] });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to update setting",
        description: error.message || "An error occurred while updating the setting.",
        variant: "destructive",
      });
    },
  });

  // Handler for toggle change
  const handleRequirementToggle = (checked: boolean) => {
    toggleRequirementMutation.mutate(checked);
  };

  // Update preview when content changes
  const updatePreview = () => {
    setPreviewContent(form.getValues("content"));
    setActiveTab("preview");
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold">Seller Agreements</h2>
        <Button onClick={handleCreate}>
          <Plus className="mr-2 h-4 w-4" /> New Agreement
        </Button>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Agreement Requirement Setting</CardTitle>
          <CardDescription>
            Control whether seller agreement acceptance is required for sellers to use the platform.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-between">
          <div>
            <p className="font-medium">Require Seller Agreement</p>
            <p className="text-sm text-muted-foreground">
              When enabled, sellers must accept the latest agreement to access seller features
            </p>
          </div>
          <Switch 
            checked={agreementRequired} 
            onCheckedChange={handleRequirementToggle}
            disabled={toggleRequirementMutation.isPending}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Agreement History</CardTitle>
          <CardDescription>
            Manage seller agreements and versions. The latest version will be presented to sellers.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingAgreements ? (
            <div className="flex justify-center items-center py-10">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : !agreements || agreements.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              No agreements found. Create your first seller agreement.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Version</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {agreements.map((agreement) => (
                  <TableRow key={agreement.id}>
                    <TableCell>{agreement.id}</TableCell>
                    <TableCell>{agreement.version}</TableCell>
                    <TableCell>
                      {formatDistanceToNow(new Date(agreement.createdAt), { addSuffix: true })}
                    </TableCell>
                    <TableCell>
                      {agreement.isLatest ? (
                        <div className="flex items-center text-green-600">
                          <FileCheck className="mr-1 h-4 w-4" /> Active
                        </div>
                      ) : (
                        <span className="text-muted-foreground">Superseded</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(agreement)}
                      >
                        <Pencil className="h-4 w-4 mr-1" /> Edit
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {formMode === "create" ? "Create Agreement" : "Edit Agreement"}
            </DialogTitle>
          </DialogHeader>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid grid-cols-2 mb-4">
              <TabsTrigger value="edit">Edit</TabsTrigger>
              <TabsTrigger value="preview">Preview</TabsTrigger>
            </TabsList>
            <TabsContent value="edit">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="version"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Version</FormLabel>
                        <FormControl>
                          <Input placeholder="1.0" {...field} />
                        </FormControl>
                        <FormDescription>
                          Enter the version number (e.g., 1.0, 1.1, 2.0)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="content"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Content</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Enter the agreement content..."
                            className="h-[300px] font-mono"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Use Markdown formatting for headings, lists, and formatting.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button
                    type="button"
                    variant="outline"
                    onClick={updatePreview}
                    className="mr-2"
                  >
                    Preview
                  </Button>

                  <DialogFooter className="mt-4">
                    <Button
                      type="submit"
                      disabled={
                        createAgreementMutation.isPending || updateAgreementMutation.isPending
                      }
                    >
                      {createAgreementMutation.isPending || updateAgreementMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          {formMode === "create" ? "Creating..." : "Updating..."}
                        </>
                      ) : formMode === "create" ? (
                        "Create Agreement"
                      ) : (
                        "Update Agreement"
                      )}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </TabsContent>
            <TabsContent value="preview">
              <div className="border rounded-md p-4 min-h-[300px]">
                <ScrollArea className="h-[400px]">
                  <div className="prose prose-sm max-w-none">
                    <ReactMarkdown>{previewContent}</ReactMarkdown>
                  </div>
                </ScrollArea>
              </div>
              <div className="flex justify-end mt-4">
                <Button 
                  variant="outline" 
                  onClick={() => setActiveTab("edit")}
                  className="mr-2"
                >
                  Back to Edit
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </div>
  );
}