import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { AdminLayout } from "@/components/layout/admin-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  Edit,
  Trash2,
  Plus,
  Grid,
  MoveUp,
  MoveDown,
  Image as ImageIcon,
  UploadCloud,
  Loader2,
  X,
} from "lucide-react";
import { Category, insertCategorySchema } from "@shared/schema";
import { FileUpload } from "@/components/ui/file-upload";

// Define schema for category form
const categorySchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters" }),
  image: z.string().url({ message: "Please enter a valid image URL" }),
  displayOrder: z.coerce.number().int().positive(),
  gstRate: z.coerce.string().default("0.00"), // Changed to string to match database schema
});

type CategoryFormValues = z.infer<typeof categorySchema>;

export default function AdminCategories() {
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(
    null
  );
  const { toast } = useToast();

  // Fetch categories
  const { data: categories, isLoading } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  // Form
  const form = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: "",
      image: "",
      displayOrder: 0,
      gstRate: "0.00", // Changed to string to match database schema
    },
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (data: CategoryFormValues) => {
      const res = await apiRequest("POST", "/api/categories", data);
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to create category");
      }
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Category Created",
        description: "The category has been created successfully",
      });
      form.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: number;
      data: CategoryFormValues;
    }) => {
      const res = await apiRequest("PUT", `/api/categories/${id}`, data);
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to update category");
      }
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Category Updated",
        description: "The category has been updated successfully",
      });
      setEditDialogOpen(false);
      setSelectedCategory(null);
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("DELETE", `/api/categories/${id}`);
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to delete category");
      }
      // Return true for 204 No Content responses (don't try to parse as JSON)
      return true;
    },
    onSuccess: () => {
      toast({
        title: "Category Deleted",
        description: "The category has been deleted successfully",
      });
      setDeleteDialogOpen(false);
      setSelectedCategory(null);
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Form handlers
  const onSubmit = (values: CategoryFormValues) => {
    createMutation.mutate(values);
  };

  const openEditDialog = (category: Category) => {
    setSelectedCategory(category);
    form.reset({
      name: category.name,
      image: category.image,
      displayOrder: category.displayOrder,
      gstRate: category.gstRate ? String(category.gstRate) : "0.00", // Changed to string to match database schema
    });
    setEditDialogOpen(true);
  };

  const openDeleteDialog = (category: Category) => {
    setSelectedCategory(category);
    setDeleteDialogOpen(true);
  };

  // Display order handlers
  const handleMoveUp = (category: Category) => {
    // Find the category with the next lower display order
    const sortedCategories = [...(categories || [])].sort(
      (a, b) => a.displayOrder - b.displayOrder
    );
    const currentIndex = sortedCategories.findIndex(
      (c) => c.id === category.id
    );

    if (currentIndex > 0) {
      const targetCategory = sortedCategories[currentIndex - 1];
      const newDisplayOrder = targetCategory.displayOrder;

      updateMutation.mutate({
        id: category.id,
        data: {
          ...category,
          displayOrder: newDisplayOrder,
        },
      });

      // Also update the other category's display order
      updateMutation.mutate({
        id: targetCategory.id,
        data: {
          ...targetCategory,
          displayOrder: category.displayOrder,
        },
      });
    }
  };

  const handleMoveDown = (category: Category) => {
    // Find the category with the next higher display order
    const sortedCategories = [...(categories || [])].sort(
      (a, b) => a.displayOrder - b.displayOrder
    );
    const currentIndex = sortedCategories.findIndex(
      (c) => c.id === category.id
    );

    if (currentIndex < sortedCategories.length - 1) {
      const targetCategory = sortedCategories[currentIndex + 1];
      const newDisplayOrder = targetCategory.displayOrder;

      updateMutation.mutate({
        id: category.id,
        data: {
          ...category,
          displayOrder: newDisplayOrder,
        },
      });

      // Also update the other category's display order
      updateMutation.mutate({
        id: targetCategory.id,
        data: {
          ...targetCategory,
          displayOrder: category.displayOrder,
        },
      });
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-4 sm:space-y-6 px-2 sm:px-4 lg:px-6">
        <div>
          <h1 className="text-lg sm:text-xl lg:text-2xl font-bold tracking-tight">
            Category Management
          </h1>
          <p className="text-muted-foreground text-xs sm:text-sm lg:text-base">
            Manage product categories and their display order
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          {/* Categories List */}
          <div>
            <Card>
              <CardHeader className="pb-3 sm:pb-4">
                <CardTitle className="text-base sm:text-lg lg:text-xl">
                  Categories
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  All categories displayed in order of appearance
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-3 sm:space-y-4">
                    {[...Array(5)].map((_, index) => (
                      <div
                        key={index}
                        className="flex items-center space-x-3 sm:space-x-4"
                      >
                        <Skeleton className="h-10 w-10 sm:h-12 sm:w-12 rounded" />
                        <div className="space-y-1 sm:space-y-2">
                          <Skeleton className="h-3 sm:h-4 w-32 sm:w-40" />
                          <Skeleton className="h-2 sm:h-3 w-20 sm:w-24" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : categories && categories.length > 0 ? (
                  <>
                    {/* Desktop Table */}
                    <div className="hidden md:block">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="text-xs sm:text-sm">
                              Image
                            </TableHead>
                            <TableHead className="text-xs sm:text-sm">
                              Name
                            </TableHead>
                            <TableHead className="text-xs sm:text-sm">
                              Display Order
                            </TableHead>
                            <TableHead className="text-xs sm:text-sm">
                              GST Rate (%)
                            </TableHead>
                            <TableHead className="text-xs sm:text-sm">
                              Actions
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {categories
                            .sort((a, b) => a.displayOrder - b.displayOrder)
                            .map((category) => (
                              <TableRow key={category.id}>
                                <TableCell>
                                  <div className="h-10 w-10 sm:h-12 sm:w-12 overflow-hidden rounded border border-gray-200">
                                    <img
                                      src={category.image}
                                      alt={category.name}
                                      className="h-full w-full object-contain"
                                      onError={(e) => {
                                        (e.target as HTMLImageElement).src =
                                          "https://placehold.co/48x48?text=No+Image";
                                      }}
                                    />
                                  </div>
                                </TableCell>
                                <TableCell className="font-medium text-xs sm:text-sm">
                                  {category.name}
                                </TableCell>
                                <TableCell className="text-xs sm:text-sm">
                                  {category.displayOrder}
                                </TableCell>
                                <TableCell className="text-xs sm:text-sm">
                                  {category.gstRate
                                    ? `${Number(category.gstRate).toFixed(2)}%`
                                    : "0.00%"}
                                </TableCell>
                                <TableCell>
                                  <div className="flex space-x-1 sm:space-x-2">
                                    <Button
                                      size="icon"
                                      variant="ghost"
                                      className="h-7 w-7 sm:h-8 sm:w-8"
                                      onClick={() => handleMoveUp(category)}
                                    >
                                      <MoveUp className="h-3 w-3 sm:h-4 sm:w-4" />
                                      <span className="sr-only">Move up</span>
                                    </Button>
                                    <Button
                                      size="icon"
                                      variant="ghost"
                                      className="h-7 w-7 sm:h-8 sm:w-8"
                                      onClick={() => handleMoveDown(category)}
                                    >
                                      <MoveDown className="h-3 w-3 sm:h-4 sm:w-4" />
                                      <span className="sr-only">Move down</span>
                                    </Button>
                                    <Button
                                      size="icon"
                                      variant="ghost"
                                      className="h-7 w-7 sm:h-8 sm:w-8"
                                      onClick={() => openEditDialog(category)}
                                    >
                                      <Edit className="h-3 w-3 sm:h-4 sm:w-4" />
                                      <span className="sr-only">Edit</span>
                                    </Button>
                                    <Button
                                      size="icon"
                                      variant="ghost"
                                      className="text-red-500 h-7 w-7 sm:h-8 sm:w-8"
                                      onClick={() => openDeleteDialog(category)}
                                    >
                                      <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                                      <span className="sr-only">Delete</span>
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))}
                        </TableBody>
                      </Table>
                    </div>

                    {/* Mobile Cards */}
                    <div className="md:hidden space-y-3 sm:space-y-4">
                      {categories
                        .sort((a, b) => a.displayOrder - b.displayOrder)
                        .map((category) => (
                          <Card key={category.id} className="p-3 sm:p-4">
                            <div className="flex items-center space-x-3 sm:space-x-4">
                              <div className="h-12 w-12 sm:h-16 sm:w-16 overflow-hidden rounded border border-gray-200 flex-shrink-0">
                                <img
                                  src={category.image}
                                  alt={category.name}
                                  className="h-full w-full object-contain"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).src =
                                      "https://placehold.co/64x64?text=No+Image";
                                  }}
                                />
                              </div>
                              <div className="flex-1 min-w-0">
                                <h3 className="font-medium text-sm sm:text-base truncate">
                                  {category.name}
                                </h3>
                                <div className="flex items-center space-x-3 sm:space-x-4 mt-1 text-xs sm:text-sm text-muted-foreground">
                                  <span>Order: {category.displayOrder}</span>
                                  <span>
                                    GST:{" "}
                                    {category.gstRate
                                      ? `${Number(category.gstRate).toFixed(2)}%`
                                      : "0.00%"}
                                  </span>
                                </div>
                              </div>
                              <div className="flex flex-col space-y-1">
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-7 w-7 sm:h-8 sm:w-8"
                                  onClick={() => handleMoveUp(category)}
                                >
                                  <MoveUp className="h-3 w-3 sm:h-4 sm:w-4" />
                                  <span className="sr-only">Move up</span>
                                </Button>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-7 w-7 sm:h-8 sm:w-8"
                                  onClick={() => handleMoveDown(category)}
                                >
                                  <MoveDown className="h-3 w-3 sm:h-4 sm:w-4" />
                                  <span className="sr-only">Move down</span>
                                </Button>
                              </div>
                              <div className="flex flex-col space-y-1">
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-7 w-7 sm:h-8 sm:w-8"
                                  onClick={() => openEditDialog(category)}
                                >
                                  <Edit className="h-3 w-3 sm:h-4 sm:w-4" />
                                  <span className="sr-only">Edit</span>
                                </Button>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-7 w-7 sm:h-8 sm:w-8 text-red-500"
                                  onClick={() => openDeleteDialog(category)}
                                >
                                  <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                                  <span className="sr-only">Delete</span>
                                </Button>
                              </div>
                            </div>
                          </Card>
                        ))}
                    </div>
                  </>
                ) : (
                  <div className="py-6 sm:py-8 text-center">
                    <Grid className="mx-auto h-8 w-8 sm:h-12 sm:w-12 text-gray-300" />
                    <h3 className="mt-2 text-base sm:text-lg font-medium">
                      No Categories Found
                    </h3>
                    <p className="mt-1 text-xs sm:text-sm text-gray-500">
                      Create your first category to get started
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Add Category Form */}
          <div>
            <Card>
              <CardHeader className="pb-3 sm:pb-4">
                <CardTitle className="text-base sm:text-lg lg:text-xl">
                  Add New Category
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  Create a new category for products
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form
                    onSubmit={form.handleSubmit(onSubmit)}
                    className="space-y-3 sm:space-y-4"
                  >
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs sm:text-sm">
                            Category Name
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Electronics"
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
                      name="image"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs sm:text-sm">
                            Category Image
                          </FormLabel>
                          <div className="space-y-3 sm:space-y-4">
                            {/* Image Upload */}
                            <div>
                              <p className="text-xs sm:text-sm mb-2 font-medium text-muted-foreground">
                                Option 1: Upload Image
                              </p>
                              <FileUpload
                                onChange={(url) => {
                                  console.log("Image uploaded:", url);
                                  // Update form field with the uploaded image URL
                                  field.onChange(url);
                                }}
                                value={field.value}
                                label="Category Image"
                                accept="image/*"
                                maxSizeMB={2}
                                multiple={false}
                              />
                            </div>

                            {/* URL Input */}
                            <div>
                              <p className="text-xs sm:text-sm mb-2 font-medium text-muted-foreground">
                                Option 2: Enter Image URL
                              </p>
                              <FormControl>
                                <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                                  <Input
                                    placeholder="https://example.com/image.png"
                                    value={field.value}
                                    onChange={field.onChange}
                                    className="flex-1 h-9 sm:h-10 text-xs sm:text-sm"
                                  />
                                  {field.value && (
                                    <div className="h-8 w-8 sm:h-10 sm:w-10 overflow-hidden rounded border border-gray-200 flex-shrink-0 self-start">
                                      <img
                                        src={field.value}
                                        alt="Preview"
                                        className="h-full w-full object-contain"
                                        onError={(e) => {
                                          (e.target as HTMLImageElement).src =
                                            "https://placehold.co/48x48?text=No+Image";
                                        }}
                                      />
                                    </div>
                                  )}
                                </div>
                              </FormControl>
                            </div>
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="displayOrder"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs sm:text-sm">
                            Display Order
                          </FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="1"
                              placeholder="1"
                              {...field}
                              className="h-9 sm:h-10 text-xs sm:text-sm"
                              onChange={(e) => {
                                const value = parseInt(e.target.value);
                                field.onChange(isNaN(value) ? 0 : value);
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="gstRate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs sm:text-sm">
                            GST Rate (%)
                          </FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="0"
                              max="100"
                              step="0.01"
                              placeholder="0.00"
                              {...field}
                              className="h-9 sm:h-10 text-xs sm:text-sm"
                              onChange={(e) => {
                                const value = e.target.value;
                                // Store as string but validate it's a valid number
                                const numValue = parseFloat(value);
                                if (isNaN(numValue)) {
                                  field.onChange("0.00");
                                } else {
                                  // Format to 2 decimal places as string
                                  field.onChange(numValue.toFixed(2));
                                }
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button
                      type="submit"
                      className="w-full"
                      disabled={createMutation.isPending}
                    >
                      {createMutation.isPending
                        ? "Creating..."
                        : "Create Category"}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-md md:max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Category</DialogTitle>
            <DialogDescription>
              Make changes to the category details below
            </DialogDescription>
          </DialogHeader>

          {selectedCategory && (
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit((data) => {
                  updateMutation.mutate({
                    id: selectedCategory.id,
                    data,
                  });
                })}
                className="space-y-4"
              >
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category Name</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="image"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category Image</FormLabel>
                      <div className="space-y-4">
                        {/* Image Upload */}
                        <div>
                          <p className="text-sm mb-2 font-medium text-muted-foreground">
                            Option 1: Upload Image
                          </p>
                          <FileUpload
                            onChange={(url) => {
                              console.log("Image uploaded in edit mode:", url);
                              // Update form field with the uploaded image URL
                              field.onChange(url);
                            }}
                            value={field.value}
                            label="Category Image"
                            accept="image/*"
                            maxSizeMB={2}
                            multiple={false}
                          />
                        </div>

                        {/* URL Input */}
                        <div>
                          <p className="text-sm mb-2 font-medium text-muted-foreground">
                            Option 2: Enter Image URL
                          </p>
                          <FormControl>
                            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                              <Input
                                placeholder="https://example.com/image.png"
                                value={field.value}
                                onChange={field.onChange}
                                className="flex-1"
                              />
                              {field.value && (
                                <div className="h-10 w-10 overflow-hidden rounded border border-gray-200 flex-shrink-0 self-start">
                                  <img
                                    src={field.value}
                                    alt="Preview"
                                    className="h-full w-full object-contain"
                                    onError={(e) => {
                                      (e.target as HTMLImageElement).src =
                                        "https://placehold.co/48x48?text=No+Image";
                                    }}
                                  />
                                </div>
                              )}
                            </div>
                          </FormControl>
                        </div>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="displayOrder"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Display Order</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="1"
                          {...field}
                          onChange={(e) => {
                            const value = parseInt(e.target.value);
                            field.onChange(isNaN(value) ? 0 : value);
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="gstRate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>GST Rate (%)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="0"
                          max="100"
                          step="0.01"
                          placeholder="0.00"
                          {...field}
                          onChange={(e) => {
                            const value = e.target.value;
                            // Store as string but validate it's a valid number
                            const numValue = parseFloat(value);
                            if (isNaN(numValue)) {
                              field.onChange("0.00");
                            } else {
                              // Format to 2 decimal places as string
                              field.onChange(numValue.toFixed(2));
                            }
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <DialogFooter className="flex flex-col sm:flex-row gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setEditDialogOpen(false)}
                    className="w-full sm:w-auto"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={updateMutation.isPending}
                    className="w-full sm:w-auto"
                  >
                    {updateMutation.isPending ? "Saving..." : "Save Changes"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the category "
              {selectedCategory?.name}". This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={() => {
                if (selectedCategory) {
                  deleteMutation.mutate(selectedCategory.id);
                }
              }}
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}
