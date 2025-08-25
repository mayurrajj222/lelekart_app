import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useMutation } from "@tanstack/react-query";
import { z } from "zod";
import { Subcategory, Category } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { AdminLayout } from "@/components/layout/admin-layout";
import { Button } from "@/components/ui/button";

// Define paginated subcategories interface
interface PaginatedSubcategories {
  subcategories: Subcategory[];
  pagination: {
    totalItems: number;
    totalPages: number;
    currentPage: number;
    perPage: number;
  };
}
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  Pencil,
  Trash,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

// Schema for subcategory form validation
const subcategorySchema = z.object({
  name: z.string().min(1, "Name is required"),
  image: z.string().url("Must be a valid URL").or(z.string().length(0)),
  categoryId: z.string().min(1, "Parent category is required"),
  displayOrder: z.number().int().min(0),
});

type SubcategoryFormValues = z.infer<typeof subcategorySchema>;

export default function AdminSubcategories() {
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedSubcategory, setSelectedSubcategory] =
    useState<Subcategory | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage] = useState(10);
  const { toast } = useToast();

  // Fetch subcategories with pagination
  const { data: subcategoriesData, isLoading: isLoadingSubcategories } =
    useQuery<PaginatedSubcategories>({
      queryKey: ["/api/subcategories", currentPage, perPage],
      queryFn: async () => {
        console.log(
          `Fetching subcategories page ${currentPage} with limit ${perPage}`
        );
        const response = await fetch(
          `/api/subcategories?page=${currentPage}&limit=${perPage}`
        );
        if (!response.ok) {
          throw new Error("Failed to fetch subcategories");
        }
        const data = await response.json();
        console.log("Subcategories API response:", data);
        return data;
      },
    });

  // Fetch categories for parent category dropdown
  const { data: categories, isLoading: isLoadingCategories } = useQuery<
    Category[]
  >({
    queryKey: ["/api/categories"],
  });

  // Form
  const form = useForm<SubcategoryFormValues>({
    resolver: zodResolver(subcategorySchema),
    defaultValues: {
      name: "",
      image: "",
      categoryId: "",
      displayOrder: 0,
    },
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (data: SubcategoryFormValues) => {
      // Convert categoryId from string to number
      const payload = {
        ...data,
        categoryId: parseInt(data.categoryId),
      };

      const res = await apiRequest("POST", "/api/subcategories", payload);
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to create subcategory");
      }
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Subcategory Created",
        description: "The subcategory has been created successfully",
      });
      form.reset();

      // Invalidate all subcategory queries, not just the current page
      queryClient.invalidateQueries({
        queryKey: ["/api/subcategories"],
        refetchType: "all",
      });

      // Force refetch the current page to immediately show the new subcategory
      queryClient.refetchQueries({
        queryKey: ["/api/subcategories", currentPage, perPage],
        type: "active",
      });
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
      data: SubcategoryFormValues;
    }) => {
      // Convert categoryId from string to number
      const payload = {
        ...data,
        categoryId: parseInt(data.categoryId),
      };

      const res = await apiRequest("PUT", `/api/subcategories/${id}`, payload);
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to update subcategory");
      }
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Subcategory Updated",
        description: "The subcategory has been updated successfully",
      });
      setEditDialogOpen(false);

      // Invalidate all subcategory queries
      queryClient.invalidateQueries({
        queryKey: ["/api/subcategories"],
        refetchType: "all",
      });

      // Force refetch the current page
      queryClient.refetchQueries({
        queryKey: ["/api/subcategories", currentPage, perPage],
        type: "active",
      });
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
      const res = await apiRequest("DELETE", `/api/subcategories/${id}`);
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to delete subcategory");
      }
      return true;
    },
    onSuccess: () => {
      toast({
        title: "Subcategory Deleted",
        description: "The subcategory has been deleted successfully",
      });
      setDeleteDialogOpen(false);

      // Invalidate all subcategory queries
      queryClient.invalidateQueries({
        queryKey: ["/api/subcategories"],
        refetchType: "all",
      });

      // Force refetch the current page
      queryClient.refetchQueries({
        queryKey: ["/api/subcategories", currentPage, perPage],
        type: "active",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Handle opening edit dialog
  const handleEdit = (subcategory: Subcategory) => {
    setSelectedSubcategory(subcategory);
    form.reset({
      name: subcategory.name,
      image: subcategory.image || "",
      categoryId: subcategory.categoryId.toString(),
      displayOrder: subcategory.displayOrder || 0,
    });
    setEditDialogOpen(true);
  };

  // Handle opening delete dialog
  const handleDelete = (subcategory: Subcategory) => {
    setSelectedSubcategory(subcategory);
    setDeleteDialogOpen(true);
  };

  // Handle form submission
  const onSubmit = (data: SubcategoryFormValues) => {
    if (selectedSubcategory) {
      updateMutation.mutate({
        id: selectedSubcategory.id,
        data,
      });
    } else {
      createMutation.mutate(data);
    }
  };

  // Handle page changes
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Handle moving a subcategory up in display order
  const handleMoveUp = (subcategory: Subcategory) => {
    // Find the subcategory with the next lower display order
    const sortedSubcategories = [
      ...(subcategoriesData?.subcategories || []),
    ].sort((a, b) => a.displayOrder - b.displayOrder);
    const currentIndex = sortedSubcategories.findIndex(
      (c) => c.id === subcategory.id
    );

    if (currentIndex > 0) {
      const targetSubcategory = sortedSubcategories[currentIndex - 1];
      const newDisplayOrder = targetSubcategory.displayOrder;

      updateMutation.mutate({
        id: subcategory.id,
        data: {
          ...subcategory,
          name: subcategory.name,
          image: subcategory.image || "",
          categoryId: subcategory.categoryId.toString(),
          displayOrder: newDisplayOrder,
        },
      });

      // Add a small delay before updating the second item
      setTimeout(() => {
        updateMutation.mutate({
          id: targetSubcategory.id,
          data: {
            ...targetSubcategory,
            name: targetSubcategory.name,
            image: targetSubcategory.image || "",
            categoryId: targetSubcategory.categoryId.toString(),
            displayOrder: subcategory.displayOrder,
          },
        });

        // Refresh the subcategories list after both updates
        setTimeout(() => {
          queryClient.invalidateQueries({
            queryKey: ["/api/subcategories"],
            refetchType: "all",
          });

          queryClient.refetchQueries({
            queryKey: ["/api/subcategories", currentPage, perPage],
            type: "active",
          });
        }, 300);
      }, 300);
    }
  };

  // Handle moving a subcategory down in display order
  const handleMoveDown = (subcategory: Subcategory) => {
    // Find the subcategory with the next higher display order
    const sortedSubcategories = [
      ...(subcategoriesData?.subcategories || []),
    ].sort((a, b) => a.displayOrder - b.displayOrder);
    const currentIndex = sortedSubcategories.findIndex(
      (c) => c.id === subcategory.id
    );

    if (currentIndex < sortedSubcategories.length - 1) {
      const targetSubcategory = sortedSubcategories[currentIndex + 1];
      const newDisplayOrder = targetSubcategory.displayOrder;

      updateMutation.mutate({
        id: subcategory.id,
        data: {
          ...subcategory,
          name: subcategory.name,
          image: subcategory.image || "",
          categoryId: subcategory.categoryId.toString(),
          displayOrder: newDisplayOrder,
        },
      });

      // Also update the other subcategory's display order
      updateMutation.mutate({
        id: targetSubcategory.id,
        data: {
          ...targetSubcategory,
          name: targetSubcategory.name,
          image: targetSubcategory.image || "",
          categoryId: targetSubcategory.categoryId.toString(),
          displayOrder: subcategory.displayOrder,
        },
      });
    }
  };

  // Get category name from categoryId
  const getCategoryName = (categoryId: number) => {
    const category = categories?.find((cat) => cat.id === categoryId);
    return category ? category.name : "Unknown";
  };

  // Loading state
  if (isLoadingSubcategories || isLoadingCategories) {
    return (
      <AdminLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Subcategories</h1>
            <p className="text-muted-foreground">
              Manage product subcategories that appear in the store
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Add New Subcategory</CardTitle>
              <CardDescription>
                Create a new subcategory for your products
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-1/3" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>All Subcategories</CardTitle>
              <CardDescription>Manage existing subcategories</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            </CardContent>
          </Card>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="px-2 sm:px-4 md:px-6 max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Subcategories</h1>
            <p className="text-muted-foreground">
              Manage product subcategories that appear in the store
            </p>
          </div>
          {/* Add New Subcategory Button or Actions can go here */}
        </div>
        {/* Add/Edit Subcategory Form/Card */}
        <Card>
          <CardHeader>
            <CardTitle>Add New Subcategory</CardTitle>
            <CardDescription>
              Create a new subcategory for your products
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-4"
              >
                {/* Form fields here, ensure all inputs/selects are w-full */}
                <FormField
                  control={form.control}
                  name="categoryId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Parent Category</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a parent category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {categories?.map((category) => (
                            <SelectItem
                              key={category.id}
                              value={category.id.toString()}
                            >
                              {category.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Subcategory Name</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter subcategory name"
                          {...field}
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
                      <FormLabel>Image URL (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter image URL" {...field} />
                      </FormControl>
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
                          min="0"
                          placeholder="Enter display order"
                          {...field}
                          onChange={(e) =>
                            field.onChange(parseInt(e.target.value))
                          }
                          value={field.value.toString()}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex flex-col sm:flex-row gap-2">
                  <Button type="submit" className="w-full sm:w-auto">
                    Save
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full sm:w-auto"
                    onClick={() => form.reset()}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
        {/* Table Section */}
        <div className="overflow-x-auto">
          <Table className="min-w-[600px]">
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Parent Category</TableHead>
                <TableHead>Display Order</TableHead>
                <TableHead>Image</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {subcategoriesData?.subcategories &&
              subcategoriesData.subcategories.length > 0 ? (
                subcategoriesData.subcategories
                  .sort((a, b) => a.displayOrder - b.displayOrder)
                  .map((subcategory) => (
                    <TableRow key={subcategory.id}>
                      <TableCell className="font-medium">
                        {subcategory.name}
                      </TableCell>
                      <TableCell>
                        {getCategoryName(subcategory.categoryId)}
                      </TableCell>
                      <TableCell>{subcategory.displayOrder}</TableCell>
                      <TableCell>
                        {subcategory.image ? (
                          <div className="w-10 h-10 overflow-hidden rounded-md">
                            <img
                              src={subcategory.image}
                              alt={subcategory.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ) : (
                          "No image"
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handleMoveUp(subcategory)}
                          >
                            <ArrowUp className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handleMoveDown(subcategory)}
                          >
                            <ArrowDown className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(subcategory)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(subcategory)}
                          >
                            <Trash className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-4">
                    No subcategories found. Create your first subcategory above.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        {/* Pagination Controls */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 mt-4">
          {subcategoriesData?.pagination && (
            <div className="text-sm text-muted-foreground">
              Showing page {currentPage} of{" "}
              {subcategoriesData.pagination.totalPages}
              {subcategoriesData.pagination.totalItems > 0 &&
                ` (${subcategoriesData.pagination.totalItems} ${subcategoriesData.pagination.totalItems === 1 ? "item" : "items"})`}
            </div>
          )}
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Previous
            </Button>
            {Array.from({
              length: subcategoriesData?.pagination?.totalPages || 0,
            }).map((_, index) => (
              <Button
                key={index}
                variant={currentPage === index + 1 ? "default" : "outline"}
                size="sm"
                onClick={() => handlePageChange(index + 1)}
                className={
                  subcategoriesData?.pagination?.totalPages > 5
                    ? (index + 1 < currentPage - 1 ||
                        index + 1 > currentPage + 1) &&
                      index + 1 !== 1 &&
                      index + 1 !== subcategoriesData?.pagination?.totalPages
                      ? "hidden sm:inline-flex"
                      : ""
                    : ""
                }
              >
                {index + 1}
              </Button>
            ))}
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                handlePageChange(
                  Math.min(
                    subcategoriesData?.pagination?.totalPages || 1,
                    currentPage + 1
                  )
                )
              }
              disabled={
                currentPage === subcategoriesData?.pagination?.totalPages || 1
              }
            >
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
        {/* Edit/Delete Dialogs */}
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent className="max-w-md w-full">
            <DialogHeader>
              <DialogTitle>Edit Subcategory</DialogTitle>
              <DialogDescription>
                Update the subcategory information below.
              </DialogDescription>
            </DialogHeader>

            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-4"
              >
                <FormField
                  control={form.control}
                  name="categoryId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Parent Category</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a parent category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {categories?.map((category) => (
                            <SelectItem
                              key={category.id}
                              value={category.id.toString()}
                            >
                              {category.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Subcategory Name</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter subcategory name"
                          {...field}
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
                      <FormLabel>Image URL (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter image URL" {...field} />
                      </FormControl>
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
                          min="0"
                          placeholder="Enter display order"
                          {...field}
                          onChange={(e) =>
                            field.onChange(parseInt(e.target.value))
                          }
                          value={field.value.toString()}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <DialogFooter>
                  <Button
                    variant="outline"
                    type="button"
                    onClick={() => setEditDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={updateMutation.isPending}>
                    {updateMutation.isPending
                      ? "Updating..."
                      : "Update Subcategory"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete the subcategory "
                {selectedSubcategory?.name}". This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                className="bg-red-600 hover:bg-red-700"
                onClick={() => {
                  if (selectedSubcategory) {
                    deleteMutation.mutate(selectedSubcategory.id);
                  }
                }}
              >
                {deleteMutation.isPending ? "Deleting..." : "Delete"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AdminLayout>
  );
}
