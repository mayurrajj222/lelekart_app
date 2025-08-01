import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import AdminLayout from "@/components/layout/admin-layout";
import EditProductForm from "@/components/product/edit-product-form";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { queryClient } from "@/lib/queryClient";
import { toast } from "@/hooks/use-toast";

/**
 * Admin Edit Product Page
 *
 * This page fetches the product data for the specified product ID
 * and loads the EditProductForm component with that data.
 */
export default function AdminEditProductPage() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();

  // Use TanStack Query to fetch product data
  const {
    data: product,
    isLoading,
    error,
  } = useQuery({
    queryKey: [`/api/products/${id}`],
    queryFn: async () => {
      const response = await fetch(`/api/products/${id}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch product: ${response.statusText}`);
      }
      return response.json();
    },
    enabled: !!id, // Only run if we have an ID
  });

  // Handle errors
  useEffect(() => {
    if (error) {
      toast({
        title: "Error",
        description: `Could not load product: ${error instanceof Error ? error.message : "Unknown error"}`,
        variant: "destructive",
      });
      navigate("/admin/products");
    }
  }, [error, navigate]);

  return (
    <AdminLayout>
      <div className="px-2 sm:px-4 lg:px-6 py-4 sm:py-6">
        <div className="mb-4 sm:mb-6 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              className="gap-1 h-9 sm:h-10 text-xs sm:text-sm"
              onClick={() => navigate("/admin/products")}
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Back to Products</span>
              <span className="sm:hidden">Back</span>
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg sm:text-xl">Edit Product</CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                Update product information and specifications
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-3 sm:space-y-4">
                  <Skeleton className="h-8 sm:h-10 w-full" />
                  <Skeleton className="h-16 sm:h-20 w-full" />
                  <Skeleton className="h-32 sm:h-40 w-full" />
                  <div className="flex items-center justify-center py-6 sm:py-8">
                    <Loader2 className="h-6 sm:h-8 w-6 sm:w-8 animate-spin text-primary" />
                  </div>
                </div>
              ) : product ? (
                <EditProductForm product={product} />
              ) : (
                <div className="py-6 sm:py-8 text-center text-xs sm:text-sm text-muted-foreground">
                  Product not found or could not be loaded.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}
