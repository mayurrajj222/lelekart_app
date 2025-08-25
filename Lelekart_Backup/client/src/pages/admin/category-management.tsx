import React, { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { AdminLayout } from "@/components/layout/admin-layout";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

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
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Check, Edit, Plus, Trash, X } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

// Schema for category form
const categorySchema = z.object({
  name: z.string().min(1, { message: "Category name is required" }),
  slug: z.string().optional(),
  description: z.string().optional(),
  image: z.string().min(0).default(""),
  active: z.boolean().default(true),
  featured: z.boolean().default(false),
});

// Schema for subcategory form (with parentId for nesting)
const subcategorySchema = z.object({
  name: z.string().min(1, { message: "Subcategory name is required" }),
  categoryId: z.number(),
  parentId: z.number().nullable().optional(),
  slug: z.string().optional(),
  description: z.string().optional(),
  displayOrder: z.number().default(0),
  active: z.boolean().default(true),
  featured: z.boolean().default(false),
});

type Category = {
  id: number;
  name: string;
  slug: string;
  description?: string;
  active: boolean;
  featured: boolean;
};

type Subcategory = {
  id: number;
  name: string;
  slug: string;
  categoryId: number;
  parentId?: number | null;
  description?: string;
  displayOrder: number;
  active: boolean;
  featured: boolean;
};

export default function CategoryManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false);
  const [isAddSubcategoryOpen, setIsAddSubcategoryOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [editingSubcategory, setEditingSubcategory] =
    useState<Subcategory | null>(null);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>("categories");

  // Fetch all categories
  const {
    data: categories,
    isLoading: categoriesLoading,
    error: categoriesError,
  } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/categories");
      const data = await res.json();
      console.log("[Admin] Categories API response:", data);
      return data;
    },
    onError: (err) => {
      console.error("[Admin] Categories API error:", err);
    },
  });

  // Fetch all subcategories
  const {
    data: allSubcategories,
    isLoading: subcategoriesLoading,
    error: subcategoriesError,
  } = useQuery<Subcategory[]>({
    queryKey: ["/api/subcategories/all"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/subcategories/all");
      const data = await res.json();
      console.log("[Admin] Subcategories API response:", data);
      return data;
    },
    onError: (err) => {
      console.error("[Admin] Subcategories API error:", err);
    },
  });

  // Form for adding/editing categories
  const categoryForm = useForm<z.infer<typeof categorySchema>>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: "",
      slug: "",
      description: "",
      image: "",
      active: true,
      featured: false,
    },
  });

  // Form for adding/editing subcategories
  const subcategoryForm = useForm<z.infer<typeof subcategorySchema>>({
    resolver: zodResolver(subcategorySchema),
    defaultValues: {
      name: "",
      categoryId: 0,
      parentId: null,
      slug: "",
      description: "",
      displayOrder: 0,
      active: true,
      featured: false,
    },
  });

  // Reset forms when dialogs close
  useEffect(() => {
    if (!isAddCategoryOpen) {
      categoryForm.reset();
      setEditingCategory(null);
    }
  }, [isAddCategoryOpen, categoryForm]);

  useEffect(() => {
    if (!isAddSubcategoryOpen) {
      subcategoryForm.reset();
      setEditingSubcategory(null);
    }
  }, [isAddSubcategoryOpen, subcategoryForm]);

  // Set form values when editing
  useEffect(() => {
    if (editingCategory) {
      categoryForm.reset({
        name: editingCategory.name,
        slug: editingCategory.slug,
        description: editingCategory.description || "",
        image: (editingCategory as any).image || "",
        active: editingCategory.active,
        featured: editingCategory.featured,
      });
      setIsAddCategoryOpen(true);
    }
  }, [editingCategory, categoryForm]);

  useEffect(() => {
    if (editingSubcategory) {
      subcategoryForm.reset({
        name: editingSubcategory.name,
        categoryId: editingSubcategory.categoryId,
        parentId: editingSubcategory.parentId ?? null,
        slug: editingSubcategory.slug,
        description: editingSubcategory.description || "",
        displayOrder: editingSubcategory.displayOrder,
        active: editingSubcategory.active,
        featured: editingSubcategory.featured,
      });
      setIsAddSubcategoryOpen(true);
    }
  }, [editingSubcategory, subcategoryForm]);

  // Create category mutation
  const createCategoryMutation = useMutation({
    mutationFn: async (data: z.infer<typeof categorySchema>) => {
      const payload = { ...data, image: data.image ?? "" };
      const res = await apiRequest("POST", "/api/categories", payload);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      setIsAddCategoryOpen(false);
      toast({
        title: "Success",
        description: "Category has been created successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: `Failed to create category: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Update category mutation
  const updateCategoryMutation = useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: number;
      data: z.infer<typeof categorySchema>;
    }) => {
      const payload = { ...data, image: data.image ?? "" };
      const res = await apiRequest("PUT", `/api/categories/${id}`, payload);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      setIsAddCategoryOpen(false);
      toast({
        title: "Success",
        description: "Category has been updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: `Failed to update category: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Delete category mutation
  const deleteCategoryMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/categories/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      toast({
        title: "Success",
        description: "Category has been deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: `Failed to delete category: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Create subcategory mutation
  const createSubcategoryMutation = useMutation({
    mutationFn: async (data: z.infer<typeof subcategorySchema>) => {
      const res = await apiRequest("POST", "/api/subcategories", data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/subcategories/all"] });
      setIsAddSubcategoryOpen(false);
      toast({
        title: "Success",
        description: "Subcategory has been created successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: `Failed to create subcategory: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Update subcategory mutation
  const updateSubcategoryMutation = useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: number;
      data: z.infer<typeof subcategorySchema>;
    }) => {
      const res = await apiRequest("PUT", `/api/subcategories/${id}`, data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/subcategories/all"] });
      setIsAddSubcategoryOpen(false);
      toast({
        title: "Success",
        description: "Subcategory has been updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: `Failed to update subcategory: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Delete subcategory mutation
  const deleteSubcategoryMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/subcategories/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/subcategories/all"] });
      toast({
        title: "Success",
        description: "Subcategory has been deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: `Failed to delete subcategory: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Submit handler for category form
  const onCategorySubmit = (data: z.infer<typeof categorySchema>) => {
    if (editingCategory) {
      updateCategoryMutation.mutate({ id: editingCategory.id, data });
    } else {
      createCategoryMutation.mutate(data);
    }
  };

  // Submit handler for subcategory form
  const onSubcategorySubmit = (data: z.infer<typeof subcategorySchema>) => {
    if (editingSubcategory) {
      updateSubcategoryMutation.mutate({ id: editingSubcategory.id, data });
    } else {
      createSubcategoryMutation.mutate(data);
    }
  };

  // Confirm delete handlers
  const handleDeleteCategory = (category: Category) => {
    if (
      window.confirm(
        `Are you sure you want to delete category "${category.name}"? This will also delete all associated subcategories.`
      )
    ) {
      deleteCategoryMutation.mutate(category.id);
    }
  };

  const handleDeleteSubcategory = (subcategory: Subcategory) => {
    if (
      window.confirm(
        `Are you sure you want to delete subcategory "${subcategory.name}"?`
      )
    ) {
      deleteSubcategoryMutation.mutate(subcategory.id);
    }
  };

  // Helper to get subcategories for a category
  const getSubcategoriesForCategory = (categoryId: number) => {
    return (
      allSubcategories?.filter(
        (s) => s.categoryId === categoryId && !s.parentId
      ) || []
    );
  };

  // Helper to get child subcategories for a given subcategory
  const getChildSubcategories = (parentId: number) => {
    return allSubcategories?.filter((s) => s.parentId === parentId) || [];
  };

  // Recursive render for nested subcategories
  const renderSubcategories = (
    categoryId: number,
    parentId: number | null = null,
    level: number = 0
  ) => {
    const subcategories =
      parentId === null
        ? getSubcategoriesForCategory(categoryId)
        : getChildSubcategories(parentId);
    if (!subcategories.length) return null;
    return (
      <ul className={`ml-${level * 4}`}>
        {subcategories.map((sub) => (
          <li key={sub.id} className="mb-2">
            <div className="flex items-center gap-2">
              <span>{sub.name}</span>
              <Button
                size="xs"
                variant="ghost"
                onClick={() => setEditingSubcategory(sub)}
              >
                <Edit className="h-4 w-4" />
              </Button>
              <Button
                size="xs"
                variant="ghost"
                onClick={() => handleDeleteSubcategory(sub)}
              >
                <Trash className="h-4 w-4" />
              </Button>
            </div>
            {renderSubcategories(categoryId, sub.id, level + 1)}
          </li>
        ))}
      </ul>
    );
  };

  // Loading state
  if (categoriesLoading || subcategoriesLoading) {
    return (
      <AdminLayout>
        <div className="container px-4 py-6">
          <h1 className="text-2xl font-bold mb-6">Category Management</h1>
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-6 w-40" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-20 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </AdminLayout>
    );
  }

  // Error state
  if (categoriesError || subcategoriesError) {
    return (
      <AdminLayout>
        <div className="container px-4 py-6">
          <h1 className="text-2xl font-bold mb-6">Category Management</h1>
          <Card className="bg-destructive/10">
            <CardHeader>
              <CardTitle>Error Loading Data</CardTitle>
            </CardHeader>
            <CardContent>
              <p>
                There was an error loading the categories or subcategories.
                Please try again later.
              </p>
              <Button
                className="mt-4"
                onClick={() => queryClient.invalidateQueries()}
              >
                Retry
              </Button>
            </CardContent>
          </Card>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="container px-2 sm:px-4 md:px-6 py-4 md:py-6 max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <h1 className="text-lg sm:text-xl md:text-2xl font-bold">
            Integrated Category Management
          </h1>
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 w-full sm:w-auto">
            <Button
              onClick={() => setIsAddCategoryOpen(true)}
              className="w-full sm:w-auto"
            >
              <Plus className="mr-2 h-4 w-4" /> Add Category
            </Button>
            <Button
              onClick={() => setIsAddSubcategoryOpen(true)}
              className="w-full sm:w-auto"
            >
              <Plus className="mr-2 h-4 w-4" /> Add Subcategory
            </Button>
          </div>
        </div>

        <Tabs
          defaultValue="categories"
          value={activeTab}
          onValueChange={setActiveTab}
        >
          <div className="overflow-x-auto">
            <TabsList className="mb-4 min-w-max">
              <TabsTrigger value="categories">
                Categories with Subcategories
              </TabsTrigger>
              <TabsTrigger value="subcategories">All Subcategories</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="categories">
            <div className="space-y-4">
              {categories && categories.length > 0 ? (
                categories.map((category) => (
                  <Card
                    key={category.id}
                    className={category.active ? "" : "opacity-60"}
                  >
                    <CardHeader className="px-4 md:px-6 pb-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <CardTitle className="text-base sm:text-lg md:text-xl flex flex-wrap items-center gap-2">
                          <span className="truncate">{category.name}</span>
                          {category.featured && (
                            <span className="px-2 py-0.5 text-xs bg-yellow-100 text-yellow-800 rounded-full flex-shrink-0">
                              Featured
                            </span>
                          )}
                          {!category.active && (
                            <span className="px-2 py-0.5 text-xs bg-gray-200 text-gray-700 rounded-full flex-shrink-0">
                              Inactive
                            </span>
                          )}
                        </CardTitle>
                        {category.description && (
                          <CardDescription className="mt-1 text-xs sm:text-sm">
                            {category.description}
                          </CardDescription>
                        )}
                      </div>
                      <div className="flex space-x-2 flex-shrink-0">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setEditingCategory(category)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteCategory(category)}
                        >
                          <Trash className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="px-4 md:px-6">
                      <div className="text-xs sm:text-sm text-muted-foreground">
                        Slug: {category.slug}
                      </div>

                      <Accordion
                        type="single"
                        collapsible
                        className="mt-4"
                        value={
                          expandedCategory === category.id.toString()
                            ? category.id.toString()
                            : undefined
                        }
                        onValueChange={(value) => setExpandedCategory(value)}
                      >
                        <AccordionItem value={category.id.toString()}>
                          <AccordionTrigger className="text-xs sm:text-sm font-medium">
                            Subcategories (
                            {getSubcategoriesForCategory(category.id).length})
                          </AccordionTrigger>
                          <AccordionContent>
                            <div className="space-y-2">
                              {renderSubcategories(category.id)}
                            </div>
                            <div className="mt-4">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  subcategoryForm.setValue(
                                    "categoryId",
                                    category.id
                                  );
                                  setIsAddSubcategoryOpen(true);
                                }}
                                className="w-full sm:w-auto"
                              >
                                <Plus className="mr-1 h-4 w-4" /> Add
                                Subcategory
                              </Button>
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      </Accordion>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <Card>
                  <CardContent className="flex items-center justify-center h-40">
                    <p className="text-muted-foreground">No categories found</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="subcategories">
            <Card>
              <CardContent className="p-2 sm:p-4 md:p-6">
                {/* Desktop Table */}
                <div className="hidden md:block overflow-x-auto">
                  <Table className="min-w-[600px]">
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Order</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {allSubcategories && allSubcategories.length > 0 ? (
                        allSubcategories.map((subcategory) => {
                          const parentCategory = categories?.find(
                            (c) => c.id === subcategory.categoryId
                          );
                          return (
                            <TableRow
                              key={subcategory.id}
                              className={subcategory.active ? "" : "opacity-60"}
                            >
                              <TableCell className="font-medium">
                                <div className="flex items-center space-x-2">
                                  <span>{subcategory.name}</span>
                                  {subcategory.featured && (
                                    <span className="px-2 py-0.5 text-xs bg-yellow-100 text-yellow-800 rounded-full">
                                      Featured
                                    </span>
                                  )}
                                </div>
                                <div className="text-xs text-muted-foreground mt-1">
                                  {subcategory.slug}
                                </div>
                              </TableCell>
                              <TableCell>
                                {parentCategory?.name || "Unknown Category"}
                              </TableCell>
                              <TableCell>
                                {subcategory.active ? (
                                  <span className="flex items-center text-green-600">
                                    <Check className="mr-1 h-4 w-4" /> Active
                                  </span>
                                ) : (
                                  <span className="flex items-center text-gray-500">
                                    <X className="mr-1 h-4 w-4" /> Inactive
                                  </span>
                                )}
                              </TableCell>
                              <TableCell>{subcategory.displayOrder}</TableCell>
                              <TableCell className="text-right">
                                <div className="flex justify-end space-x-2">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() =>
                                      setEditingSubcategory(subcategory)
                                    }
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() =>
                                      handleDeleteSubcategory(subcategory)
                                    }
                                  >
                                    <Trash className="h-4 w-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })
                      ) : (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center h-24">
                            No subcategories found
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>

                {/* Mobile Cards */}
                <div className="md:hidden space-y-4">
                  {allSubcategories && allSubcategories.length > 0 ? (
                    allSubcategories.map((subcategory) => {
                      const parentCategory = categories?.find(
                        (c) => c.id === subcategory.categoryId
                      );
                      return (
                        <Card
                          key={subcategory.id}
                          className={`p-4 ${subcategory.active ? "" : "opacity-60"}`}
                        >
                          <div className="space-y-3">
                            <div className="flex justify-between items-start">
                              <div className="min-w-0 flex-1">
                                <h3 className="font-medium text-sm md:text-base truncate">
                                  {subcategory.name}
                                </h3>
                                <p className="text-xs text-muted-foreground mt-1 truncate">
                                  {subcategory.slug}
                                </p>
                                <p className="text-xs text-muted-foreground mt-1">
                                  Category: {parentCategory?.name || "Unknown"}
                                </p>
                              </div>
                              <div className="flex flex-col items-end gap-2">
                                {subcategory.featured && (
                                  <span className="px-2 py-0.5 text-xs bg-yellow-100 text-yellow-800 rounded-full">
                                    Featured
                                  </span>
                                )}
                                <div className="flex space-x-1">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-8 p-0"
                                    onClick={() =>
                                      setEditingSubcategory(subcategory)
                                    }
                                  >
                                    <Edit className="h-3 w-3" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-8 p-0"
                                    onClick={() =>
                                      handleDeleteSubcategory(subcategory)
                                    }
                                  >
                                    <Trash className="h-3 w-3" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                            <div className="flex justify-between items-center text-xs">
                              <span>
                                {subcategory.active ? (
                                  <span className="flex items-center text-green-600">
                                    <Check className="mr-1 h-3 w-3" /> Active
                                  </span>
                                ) : (
                                  <span className="flex items-center text-gray-500">
                                    <X className="mr-1 h-3 w-3" /> Inactive
                                  </span>
                                )}
                              </span>
                              <span className="text-muted-foreground">
                                Order: {subcategory.displayOrder}
                              </span>
                            </div>
                          </div>
                        </Card>
                      );
                    })
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">
                        No subcategories found
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Add/Edit Category Dialog */}
        <Dialog open={isAddCategoryOpen} onOpenChange={setIsAddCategoryOpen}>
          <DialogContent className="max-w-md w-full">
            <DialogHeader>
              <DialogTitle>
                {editingCategory ? "Edit Category" : "Add New Category"}
              </DialogTitle>
              <DialogDescription>
                {editingCategory
                  ? "Edit the category details below"
                  : "Fill in the details to create a new category"}
              </DialogDescription>
            </DialogHeader>

            <Form {...categoryForm}>
              <form
                onSubmit={categoryForm.handleSubmit(onCategorySubmit)}
                className="space-y-4 md:space-y-6"
                id="category-form"
              >
                <FormField
                  control={categoryForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name*</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Electronics" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={categoryForm.control}
                  name="slug"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Slug</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g. electronics (leave empty to auto-generate)"
                          {...field}
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={categoryForm.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Enter a description for this category"
                          {...field}
                          value={field.value || ""}
                          rows={3}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex flex-col sm:flex-row sm:space-x-8 space-y-4 sm:space-y-0">
                  <FormField
                    control={categoryForm.control}
                    name="active"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between space-x-2">
                        <FormLabel>Active</FormLabel>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={categoryForm.control}
                    name="featured"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between space-x-2">
                        <FormLabel>Featured</FormLabel>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>

                <DialogFooter className="flex flex-col sm:flex-row gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsAddCategoryOpen(false)}
                    className="w-full sm:w-auto"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={
                      createCategoryMutation.isPending ||
                      updateCategoryMutation.isPending
                    }
                    className="w-full sm:w-auto"
                  >
                    {(createCategoryMutation.isPending ||
                      updateCategoryMutation.isPending) && (
                      <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    )}
                    {editingCategory ? "Update Category" : "Add Category"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        {/* Add/Edit Subcategory Dialog */}
        <Dialog
          open={isAddSubcategoryOpen}
          onOpenChange={setIsAddSubcategoryOpen}
        >
          <DialogContent className="max-w-md w-full">
            <DialogHeader>
              <DialogTitle>
                {editingSubcategory
                  ? "Edit Subcategory"
                  : "Add New Subcategory"}
              </DialogTitle>
              <DialogDescription>
                {editingSubcategory
                  ? "Edit the subcategory details below"
                  : "Fill in the details to create a new subcategory"}
              </DialogDescription>
            </DialogHeader>

            <Form {...subcategoryForm}>
              <form
                onSubmit={subcategoryForm.handleSubmit(onSubcategorySubmit)}
                className="space-y-4 md:space-y-6"
              >
                <FormField
                  control={subcategoryForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name*</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Smartphones" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={subcategoryForm.control}
                  name="categoryId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Parent Category*</FormLabel>
                      <FormControl>
                        <select
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          value={field.value}
                          onChange={(e) =>
                            field.onChange(parseInt(e.target.value))
                          }
                          title="Parent Category"
                        >
                          <option value="" disabled>
                            Select a category
                          </option>
                          {categories &&
                            categories.map((category) => (
                              <option key={category.id} value={category.id}>
                                {category.name}
                              </option>
                            ))}
                        </select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={subcategoryForm.control}
                  name="slug"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Slug</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g. smartphones (leave empty to auto-generate)"
                          {...field}
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={subcategoryForm.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Enter a description for this subcategory"
                          {...field}
                          value={field.value || ""}
                          rows={3}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={subcategoryForm.control}
                  name="displayOrder"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Display Order</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="0"
                          {...field}
                          onChange={(e) =>
                            field.onChange(parseInt(e.target.value))
                          }
                          value={field.value}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex flex-col sm:flex-row sm:space-x-8 space-y-4 sm:space-y-0">
                  <FormField
                    control={subcategoryForm.control}
                    name="active"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between space-x-2">
                        <FormLabel>Active</FormLabel>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={subcategoryForm.control}
                    name="featured"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between space-x-2">
                        <FormLabel>Featured</FormLabel>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={subcategoryForm.control}
                  name="parentId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Parent Subcategory (optional)</FormLabel>
                      <FormControl>
                        <select
                          id="parent-subcategory-select"
                          aria-label="Parent Subcategory"
                          title="Parent Subcategory"
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          value={field.value}
                          onChange={(e) =>
                            field.onChange(
                              e.target.value === ""
                                ? null
                                : parseInt(e.target.value)
                            )
                          }
                        >
                          <option value="">None (Top-level)</option>
                          {allSubcategories
                            ?.filter(
                              (s) =>
                                s.categoryId ===
                                  subcategoryForm.getValues("categoryId") &&
                                s.id !== subcategoryForm.getValues("id")
                            )
                            .map((s) => (
                              <option key={s.id} value={s.id}>
                                {s.name}
                              </option>
                            ))}
                        </select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <DialogFooter className="flex flex-col sm:flex-row gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsAddSubcategoryOpen(false)}
                    className="w-full sm:w-auto"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={
                      createSubcategoryMutation.isPending ||
                      updateSubcategoryMutation.isPending
                    }
                    className="w-full sm:w-auto"
                  >
                    {(createSubcategoryMutation.isPending ||
                      updateSubcategoryMutation.isPending) && (
                      <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    )}
                    {editingSubcategory
                      ? "Update Subcategory"
                      : "Add Subcategory"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
