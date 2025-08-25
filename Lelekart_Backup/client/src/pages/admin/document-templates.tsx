import React, { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { AdminLayout } from "@/components/layout/admin-layout";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  AlertCircle,
  Check,
  Edit,
  FileEdit,
  FileText,
  Loader2,
  PlusCircle,
  Trash,
} from "lucide-react";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import axiosClient from "@/lib/axiosClient";

// Define the document template type
interface DocumentTemplate {
  id?: number;
  name: string;
  type: string;
  content: string;
  isDefault: boolean;
  createdAt?: string;
  updatedAt?: string;
}

// Form validation schema
const templateSchema = z.object({
  name: z.string().min(1, { message: "Template name is required" }),
  type: z.string().min(1, { message: "Template type is required" }),
  content: z
    .string()
    .min(10, { message: "Template content must be at least 10 characters" }),
  isDefault: z.boolean().default(false),
});

export default function DocumentTemplatesPage() {
  const { toast } = useToast();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] =
    useState<DocumentTemplate | null>(null);
  const [activeTab, setActiveTab] = useState<string>("all");

  // Form for creating/editing templates
  const form = useForm<z.infer<typeof templateSchema>>({
    resolver: zodResolver(templateSchema),
    defaultValues: {
      name: "",
      type: "",
      content: "",
      isDefault: false,
    },
  });

  // Fetch all templates
  const {
    data: templates = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["/api/admin/document-templates"],
    queryFn: async () => {
      try {
        // Use axios for better cookie handling
        const response = await axiosClient.get("/api/admin/document-templates");
        console.log("Template API response:", response);
        return response.data;
      } catch (err) {
        console.error("Axios error:", err);
        throw new Error(
          err.response?.data?.error ||
            err.message ||
            "Failed to fetch templates"
        );
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to load templates: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Create template mutation
  const createTemplateMutation = useMutation({
    mutationFn: async (template: DocumentTemplate) => {
      const response = await axiosClient.post(
        "/api/admin/document-templates",
        template
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/admin/document-templates"],
      });
      setIsCreateDialogOpen(false);
      form.reset();
      toast({
        title: "Success",
        description: "Template created successfully",
        variant: "success",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to create template: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Update template mutation
  const updateTemplateMutation = useMutation({
    mutationFn: async (template: DocumentTemplate) => {
      const response = await axiosClient.put(
        `/api/admin/document-templates/${template.id}`,
        template
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/admin/document-templates"],
      });
      setIsEditDialogOpen(false);
      setSelectedTemplate(null);
      form.reset();
      toast({
        title: "Success",
        description: "Template updated successfully",
        variant: "success",
      });
    },
    onError: (error: Error) => {
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
      const response = await axiosClient.delete(
        `/api/admin/document-templates/${id}`
      );
      return response.status === 204 ? null : response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/admin/document-templates"],
      });
      setIsDeleteDialogOpen(false);
      setSelectedTemplate(null);
      toast({
        title: "Success",
        description: "Template deleted successfully",
        variant: "success",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to delete template: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const handleCreateSubmit = (data: z.infer<typeof templateSchema>) => {
    createTemplateMutation.mutate(data);
  };

  const handleEditSubmit = (data: z.infer<typeof templateSchema>) => {
    if (selectedTemplate?.id) {
      updateTemplateMutation.mutate({ ...data, id: selectedTemplate.id });
    }
  };

  const handleEditClick = (template: DocumentTemplate) => {
    setSelectedTemplate(template);
    form.reset({
      name: template.name,
      type: template.type,
      content: template.content,
      isDefault: template.isDefault,
    });
    setIsEditDialogOpen(true);
  };

  const handleDeleteClick = (template: DocumentTemplate) => {
    setSelectedTemplate(template);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (selectedTemplate?.id) {
      deleteTemplateMutation.mutate(selectedTemplate.id);
    }
  };

  // Filter templates based on the active tab
  const filteredTemplates = templates.filter((template: DocumentTemplate) => {
    if (activeTab === "all") return true;
    return template.type === activeTab;
  });

  // Get unique template types for tabs
  const templateTypes = [
    "all",
    ...new Set(templates.map((t: DocumentTemplate) => t.type)),
  ];

  return (
    <AdminLayout>
      <div className="space-y-4 sm:space-y-6 px-2 sm:px-4 lg:px-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4 mb-2 sm:mb-4">
          <div>
            <h1 className="text-lg sm:text-xl lg:text-2xl font-bold">
              Document Templates
            </h1>
            <p className="text-muted-foreground text-xs sm:text-sm lg:text-base">
              Manage and edit your document templates
            </p>
          </div>
          <Button
            onClick={() => setIsCreateDialogOpen(true)}
            className="w-full sm:w-auto h-9 sm:h-10 text-xs sm:text-sm"
          >
            <PlusCircle className="mr-1 sm:mr-2 h-4 w-4" />
            <span className="hidden sm:inline">Add Template</span>
            <span className="sm:hidden">Add</span>
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-2 sm:grid-cols-{templateTypes.length} gap-1">
            {templateTypes.map((type) => (
              <TabsTrigger
                key={type}
                value={type}
                className="text-xs sm:text-sm"
              >
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </TabsTrigger>
            ))}
          </TabsList>
          {templateTypes.map((type) => (
            <TabsContent key={type} value={type} className="pt-3 sm:pt-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                {filteredTemplates.length === 0 && (
                  <Card className="col-span-full text-center py-8">
                    <CardContent>
                      <FileText className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                      <p className="text-xs sm:text-sm text-muted-foreground">
                        No templates found.
                      </p>
                    </CardContent>
                  </Card>
                )}
                {filteredTemplates.map((template: DocumentTemplate) => (
                  <TemplateCard
                    key={template.id}
                    template={template}
                    onEdit={handleEditClick}
                    onDelete={handleDeleteClick}
                  />
                ))}
              </div>
            </TabsContent>
          ))}
        </Tabs>

        {/* Create/Edit Dialogs */}
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogContent className="max-w-lg w-full">
            <DialogHeader>
              <DialogTitle className="text-base sm:text-lg">
                Create Template
              </DialogTitle>
              <DialogDescription className="text-xs sm:text-sm">
                Fill in the details to create a new document template.
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(handleCreateSubmit)}
                className="space-y-3 sm:space-y-4"
              >
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs sm:text-sm">
                        Template Name
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          className="h-9 sm:h-10 text-xs sm:text-sm"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs sm:text-sm">Type</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          className="h-9 sm:h-10 text-xs sm:text-sm"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="content"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs sm:text-sm">
                        Content
                      </FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          className="min-h-[120px] text-xs sm:text-sm"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="isDefault"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center gap-2">
                      <FormControl>
                        <input
                          type="checkbox"
                          checked={field.value}
                          onChange={field.onChange}
                          className="h-4 w-4"
                          title="Set as default template"
                          placeholder="Set as default template"
                        />
                      </FormControl>
                      <FormLabel className="text-xs sm:text-sm">
                        Set as default
                      </FormLabel>
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <Button
                    type="submit"
                    className="w-full sm:w-auto h-9 sm:h-10 text-xs sm:text-sm"
                  >
                    {createTemplateMutation.isLoading ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <PlusCircle className="mr-2 h-4 w-4" />
                    )}
                    Create
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-lg w-full">
            <DialogHeader>
              <DialogTitle className="text-base sm:text-lg">
                Edit Template
              </DialogTitle>
              <DialogDescription className="text-xs sm:text-sm">
                Update the details of your document template.
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(handleEditSubmit)}
                className="space-y-3 sm:space-y-4"
              >
                {/* Same fields as create */}
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs sm:text-sm">
                        Template Name
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          className="h-9 sm:h-10 text-xs sm:text-sm"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs sm:text-sm">Type</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          className="h-9 sm:h-10 text-xs sm:text-sm"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="content"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs sm:text-sm">
                        Content
                      </FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          className="min-h-[120px] text-xs sm:text-sm"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="isDefault"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center gap-2">
                      <FormControl>
                        <input
                          type="checkbox"
                          checked={field.value}
                          onChange={field.onChange}
                          className="h-4 w-4"
                          title="Set as default template"
                          placeholder="Set as default template"
                        />
                      </FormControl>
                      <FormLabel className="text-xs sm:text-sm">
                        Set as default
                      </FormLabel>
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <Button
                    type="submit"
                    className="w-full sm:w-auto h-9 sm:h-10 text-xs sm:text-sm"
                  >
                    {updateTemplateMutation.isLoading ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Edit className="mr-2 h-4 w-4" />
                    )}
                    Update
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        {/* Delete Dialog */}
        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogContent className="max-w-sm w-full">
            <DialogHeader>
              <DialogTitle className="text-base sm:text-lg">
                Delete Template
              </DialogTitle>
              <DialogDescription className="text-xs sm:text-sm">
                Are you sure you want to delete this template?
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="flex flex-col sm:flex-row gap-2 sm:gap-4">
              <Button
                variant="outline"
                onClick={() => setIsDeleteDialogOpen(false)}
                className="w-full sm:w-auto h-9 sm:h-10 text-xs sm:text-sm"
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={confirmDelete}
                className="w-full sm:w-auto h-9 sm:h-10 text-xs sm:text-sm"
              >
                {deleteTemplateMutation.isLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Trash className="mr-2 h-4 w-4" />
                )}
                Delete
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}

function TemplateCard({
  template,
  onEdit,
  onDelete,
}: {
  template: DocumentTemplate;
  onEdit: (template: DocumentTemplate) => void;
  onDelete: (template: DocumentTemplate) => void;
}) {
  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="mb-1">{template.name}</CardTitle>
            <CardDescription className="capitalize">
              {template.type.replace("_", " ")}
            </CardDescription>
          </div>
          {template.isDefault && (
            <div className="rounded-full bg-primary/10 text-primary text-xs px-2 py-1 flex items-center">
              <Check className="h-3 w-3 mr-1" />
              Default
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="bg-gray-50 p-2 rounded font-mono text-xs overflow-hidden text-gray-700 h-24">
          <div className="line-clamp-6">{template.content}</div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <div className="text-xs text-gray-500">
          {template.createdAt
            ? new Date(template.createdAt).toLocaleDateString()
            : "N/A"}
        </div>
        <div className="flex space-x-2">
          <Button variant="ghost" size="icon" onClick={() => onEdit(template)}>
            <Edit className="h-4 w-4" />
            <span className="sr-only">Edit</span>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onDelete(template)}
          >
            <Trash className="h-4 w-4" />
            <span className="sr-only">Delete</span>
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
