import React, { useState, useEffect } from "react";
import { SellerDashboardLayout } from "@/components/layout/seller-dashboard-layout";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Loader2,
  ArrowLeft,
  Star,
  Truck,
  ShieldCheck,
  Heart,
  Share2,
  Info,
  Check,
  Tag,
} from "lucide-react";
import { useLocation, useRoute } from "wouter";
import { toast, useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useIsMobile } from "@/hooks/use-mobile";
import { Product } from "@shared/schema";
import { RichTextContent } from "@/components/ui/rich-text-content";
import { ProductImageGallery } from "@/components/ui/product-image-gallery";

// Extract all images from product
const getProductImages = (product: Product): string[] => {
  const images: string[] = [];

  console.log("Product data:", product);

  // Add main image first if it exists
  if (product.imageUrl) {
    images.push(product.imageUrl);
    console.log("Added main image:", product.imageUrl);
  }

  // Try to extract additional images from the images field (could be stored as JSON string)
  if (product.images) {
    console.log(
      "Images field found:",
      product.images,
      "type:",
      typeof product.images
    );

    try {
      // If it's a string, try to parse it
      if (typeof product.images === "string") {
        console.log("Trying to parse JSON string:", product.images);
        const parsedImages = JSON.parse(product.images);
        console.log(
          "Parsed result:",
          parsedImages,
          "is array:",
          Array.isArray(parsedImages)
        );

        if (Array.isArray(parsedImages)) {
          images.push(...parsedImages);
          console.log("Added parsed images, total count now:", images.length);
        }
      }
      // If it's already an array, use it directly
      else if (Array.isArray(product.images)) {
        images.push(...product.images);
        console.log("Added array images, total count now:", images.length);
      }
    } catch (error) {
      console.error("Failed to parse product images:", error);
    }
  } else {
    console.log("No additional images found");
  }

  // Return unique images (no duplicates)
  const uniqueImages = Array.from(new Set(images));
  console.log("Final unique images:", uniqueImages);
  return uniqueImages;
};

export default function ProductPreviewPage() {
  const { toast } = useToast();
  const [location, setLocation] = useLocation();
  const [, params] = useRoute("/seller/products/preview/:id");
  const isMobile = useIsMobile();
  const productId = params?.id ? parseInt(params.id) : 0;

  // Fetch product data with variants
  const { data: product, isLoading } = useQuery({
    queryKey: ["/api/products", productId],
    queryFn: async () => {
      // Include variants query parameter to fetch variants data
      const res = await fetch(`/api/products/${productId}?variants=true`);
      if (!res.ok) {
        throw new Error("Failed to fetch product");
      }
      return res.json();
    },
    enabled: !!productId,
  });

  if (isLoading) {
    return (
      <SellerDashboardLayout>
        <div className="flex items-center justify-center h-[calc(100vh-200px)]">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="ml-2 text-xl">Loading product data...</p>
        </div>
      </SellerDashboardLayout>
    );
  }

  // Calculate discounted percentage if MRP is provided
  const discountPercentage = product?.mrp
    ? Math.round(((product.mrp - product.price) / product.mrp) * 100)
    : 0;

  // We'll use our helper function to get all images including additional ones
  // This is already defined above

  return (
    <SellerDashboardLayout>
      <div className="container mx-auto py-4 md:py-6 px-4 md:px-0">
        <Card className="mb-4">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setLocation("/seller/products")}
                className="flex-shrink-0"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div className="min-w-0 flex-1">
                <CardTitle className="text-base md:text-lg">
                  Product Preview
                </CardTitle>
                <CardDescription className="text-sm">
                  This is how your product will appear to customers
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 md:p-4 mb-4 text-xs md:text-sm flex items-start gap-2">
              <Info className="h-4 w-4 mt-0.5 text-yellow-600 flex-shrink-0" />
              <div className="text-yellow-800">
                <p>
                  This is a preview of how your product will appear. Not all
                  features are fully interactive in preview mode.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-6">
          {/* Left column with images - larger on desktop */}
          <div className="lg:col-span-5 xl:col-span-4">
            <Card>
              <CardContent className="pt-4 md:pt-6">
                <ProductImageGallery
                  imageUrl={product?.imageUrl || ""}
                  additionalImages={product?.images || null}
                  productName={product?.name || "Product"}
                />
                <div className="flex justify-between mt-4 gap-2">
                  <Button
                    variant="outline"
                    className="flex-1 text-xs md:text-sm"
                  >
                    <Heart className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
                    Wishlist
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1 text-xs md:text-sm"
                  >
                    <Share2 className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
                    Share
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right column with product details */}
          <div className="lg:col-span-7 xl:col-span-8 space-y-4">
            <Card>
              <CardContent className="pt-4 md:pt-6">
                <div className="space-y-4">
                  {/* Breadcrumbs */}
                  <div className="text-xs md:text-sm text-muted-foreground">
                    Home &gt; {product?.category || "Category"} &gt;{" "}
                    {product?.name || "Product"}
                  </div>

                  {/* Product title and badges */}
                  <div>
                    <h1 className="text-lg md:text-xl lg:text-2xl font-medium">
                      {product?.name || "Product Name"}
                    </h1>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 mt-1">
                      <Badge
                        variant="outline"
                        className="rounded-sm font-normal bg-green-50 text-green-600 border-green-200 text-xs w-fit"
                      >
                        {product?.approved ? "Approved" : "Pending Review"}
                      </Badge>
                      <div className="flex items-center text-xs md:text-sm">
                        <span className="bg-green-600 text-white px-1.5 py-0.5 rounded-sm flex items-center">
                          <span className="mr-0.5">4.2</span>
                          <Star className="h-3 w-3" />
                        </span>
                        <span className="text-muted-foreground ml-1">
                          ({Math.floor(Math.random() * 1000) + 100} ratings)
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Pricing */}
                  <div>
                    <div className="flex items-baseline gap-2 flex-wrap">
                      <span className="text-xl md:text-2xl lg:text-3xl font-medium">
                        ₹{product?.price?.toLocaleString() || "0"}
                      </span>
                      {discountPercentage > 0 && (
                        <>
                          <span className="text-muted-foreground line-through text-sm md:text-base">
                            ₹{product?.mrp?.toLocaleString()}
                          </span>
                          <span className="text-green-600 font-medium text-sm md:text-base">
                            {discountPercentage}% off
                          </span>
                        </>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Inclusive of all taxes
                    </div>
                  </div>

                  {/* Available offers */}

                  {/* Delivery options */}
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <h2 className="font-medium text-sm md:text-base">
                        Delivery
                      </h2>
                      <span className="text-primary text-xs md:text-sm font-medium">
                        Check
                      </span>
                    </div>
                    <div className="flex gap-2 items-center">
                      <Truck className="h-4 w-4 md:h-5 md:w-5 text-muted-foreground flex-shrink-0" />
                      <div>
                        <div className="font-medium text-sm md:text-base">
                          Free delivery
                        </div>
                        <div className="text-xs md:text-sm text-muted-foreground">
                          Delivery by{" "}
                          {new Date(
                            Date.now() + 86400000 * 3
                          ).toLocaleDateString("en-US", {
                            weekday: "long",
                            day: "numeric",
                            month: "long",
                          })}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Highlights & Seller */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h2 className="font-medium mb-2 text-sm md:text-base">
                        Highlights
                      </h2>
                      <ul className="text-xs md:text-sm space-y-1">
                        <li className="flex items-start gap-2">
                          <span className="text-muted-foreground">•</span>
                          <span>Stock: {product?.stock || 0} units</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-muted-foreground">•</span>
                          <span>Category: {product?.category || "N/A"}</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-muted-foreground">•</span>
                          <span>
                            Return Policy:{" "}
                            {product?.returnPolicy
                              ? `${product.returnPolicy} Days`
                              : "7 Days"}
                          </span>
                        </li>
                        {product?.warranty ? (
                          <li className="flex items-start gap-2">
                            <span className="text-muted-foreground">•</span>
                            <span>
                              Warranty:{" "}
                              {product.warranty % 12 === 0
                                ? `${product.warranty / 12} ${
                                    product.warranty / 12 === 1
                                      ? "Year"
                                      : "Years"
                                  }`
                                : `${product.warranty} Months`}
                            </span>
                          </li>
                        ) : null}
                      </ul>
                    </div>
                    <div>
                      <h2 className="font-medium mb-2 text-sm md:text-base">
                        Seller
                      </h2>
                      <div className="text-xs md:text-sm space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">Your Store</span>
                          <div className="flex items-center">
                            <span className="bg-green-600 text-white px-1 py-0.5 rounded-sm flex items-center text-xs">
                              <span className="mr-0.5">4.5</span>
                              <Star className="h-2.5 w-2.5" />
                            </span>
                          </div>
                        </div>
                        <ul className="mt-2">
                          <li className="flex items-start gap-2">
                            <span className="text-muted-foreground">•</span>
                            <span>
                              Replacement:{" "}
                              {product?.returnPolicy
                                ? `${product.returnPolicy} Days`
                                : "7 Days"}
                            </span>
                          </li>
                          <li className="flex items-start gap-2">
                            <Check className="h-3 w-3 md:h-4 md:w-4 text-green-600 flex-shrink-0" />
                            <span>GST Invoice Available</span>
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Protection plans */}
                  <div>
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="h-4 w-4 md:h-5 md:w-5 text-green-600 flex-shrink-0" />
                      <h2 className="font-medium text-sm md:text-base">
                        Protection Plans Available
                      </h2>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                      <div className="border rounded-md p-3 cursor-pointer hover:border-primary">
                        <div className="flex justify-between items-center">
                          <span className="font-medium text-sm md:text-base">
                            Extended Warranty
                          </span>
                          <span className="font-medium text-sm md:text-base">
                            ₹1,249
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {product?.warranty === 1
                            ? "1-year"
                            : product?.warranty > 1
                              ? `${product.warranty}-year`
                              : product?.warranty < 1 && product?.warranty > 0
                                ? `${Math.round(product.warranty * 12)}-month`
                                : "1-year"}{" "}
                          extended warranty
                        </p>
                      </div>
                      <div className="border rounded-md p-3 cursor-pointer hover:border-primary">
                        <div className="flex justify-between items-center">
                          <span className="font-medium text-sm md:text-base">
                            Damage Protection
                          </span>
                          <span className="font-medium text-sm md:text-base">
                            ₹799
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          Accidental & liquid damage
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Product details tabs */}
            <Card>
              <CardContent className="pt-2">
                <div className="overflow-x-auto">
                  <Tabs defaultValue="description">
                    <TabsList className="grid w-full grid-cols-3 md:grid-cols-5 min-w-max">
                      <TabsTrigger
                        value="description"
                        className="text-xs md:text-sm"
                      >
                        Description
                      </TabsTrigger>
                      <TabsTrigger
                        value="additional"
                        className="text-xs md:text-sm"
                      >
                        Additional information
                      </TabsTrigger>
                      <TabsTrigger
                        value="specifications"
                        className="text-xs md:text-sm"
                      >
                        Specifications
                      </TabsTrigger>
                      <TabsTrigger
                        value="variants"
                        className="text-xs md:text-sm"
                      >
                        Variants
                      </TabsTrigger>
                      <TabsTrigger
                        value="reviews"
                        className="text-xs md:text-sm"
                      >
                        Reviews
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="description" className="mt-4">
                      <div className="space-y-4">
                        <h3 className="font-medium text-sm md:text-base">
                          Product Description
                        </h3>
                        <RichTextContent
                          content={
                            product?.description || "No description available"
                          }
                        />
                      </div>
                    </TabsContent>
                    <TabsContent value="additional" className="p-2">
                      <h3 className="font-medium text-lg mb-3">
                        Additional Information
                      </h3>
                      <table className="w-full border rounded text-sm">
                        <tbody>
                          <tr className="border-b">
                            <td className="p-3 font-medium w-1/3 bg-gray-50">
                              Weight
                            </td>
                            <td className="p-3">
                              {product?.weight !== undefined &&
                              product?.weight !== null &&
                              product?.weight !== ""
                                ? `${product.weight} g`
                                : "No information available"}
                            </td>
                          </tr>
                          <tr>
                            <td className="p-3 font-medium w-1/3 bg-gray-50">
                              Dimensions
                            </td>
                            <td className="p-3">
                              {product?.length !== undefined &&
                              product?.width !== undefined &&
                              product?.height !== undefined &&
                              product?.length !== null &&
                              product?.width !== null &&
                              product?.height !== null &&
                              product?.length !== "" &&
                              product?.width !== "" &&
                              product?.height !== ""
                                ? `${product.length} × ${product.width} × ${product.height} cm`
                                : "No information available"}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </TabsContent>
                    <TabsContent value="specifications" className="mt-4">
                      <div className="space-y-4">
                        <h3 className="font-medium">Product Specifications</h3>

                        {/* Check if specifications are in HTML format from rich text editor */}
                        {product?.specifications &&
                        (product.specifications.includes("<p>") ||
                          product.specifications.includes("<h") ||
                          product.specifications.includes("<ul>")) ? (
                          <div className="specifications-content">
                            <RichTextContent
                              content={product.specifications}
                              className="text-sm"
                            />
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 gap-2">
                            <div className="grid grid-cols-2 py-2 even:bg-muted/50">
                              <span className="text-sm text-muted-foreground">
                                Brand
                              </span>
                              <span className="text-sm">
                                {product?.brand || "Your Brand"}
                              </span>
                            </div>
                            <div className="grid grid-cols-2 py-2 odd:bg-muted/50">
                              <span className="text-sm text-muted-foreground">
                                Model
                              </span>
                              <span className="text-sm">
                                {product?.sku || product?.id || "Model"}
                              </span>
                            </div>
                            <div className="grid grid-cols-2 py-2 even:bg-muted/50">
                              <span className="text-sm text-muted-foreground">
                                Category
                              </span>
                              <span className="text-sm">
                                {product?.category || "Category"}
                              </span>
                            </div>
                            <div className="grid grid-cols-2 py-2 odd:bg-muted/50">
                              <span className="text-sm text-muted-foreground">
                                Color
                              </span>
                              <span className="text-sm">
                                {product?.color || "Multiple"}
                              </span>
                            </div>
                            <div className="grid grid-cols-2 py-2 even:bg-muted/50">
                              <span className="text-sm text-muted-foreground">
                                Stock
                              </span>
                              <span className="text-sm">
                                {product?.stock || 0} units
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    </TabsContent>

                    <TabsContent value="variants" className="mt-4">
                      <div className="space-y-4">
                        <h3 className="font-medium">Product Variants</h3>
                        {product?.variants &&
                        Array.isArray(product.variants) &&
                        product.variants.length > 0 ? (
                          <div className="overflow-x-auto rounded-md border">
                            <table className="min-w-full divide-y divide-border">
                              <thead className="bg-muted text-sm">
                                <tr>
                                  <th
                                    scope="col"
                                    className="px-4 py-3 text-left font-medium text-muted-foreground"
                                  >
                                    Variant
                                  </th>
                                  <th
                                    scope="col"
                                    className="px-4 py-3 text-left font-medium text-muted-foreground"
                                  >
                                    Price
                                  </th>
                                  <th
                                    scope="col"
                                    className="px-4 py-3 text-left font-medium text-muted-foreground"
                                  >
                                    Stock
                                  </th>
                                  <th
                                    scope="col"
                                    className="px-4 py-3 text-left font-medium text-muted-foreground"
                                  >
                                    SKU
                                  </th>
                                  <th
                                    scope="col"
                                    className="px-4 py-3 text-left font-medium text-muted-foreground"
                                  >
                                    Images
                                  </th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-border bg-card text-sm">
                                {product.variants.map(
                                  (variant: any, index: number) => {
                                    // Parse variant images if stored as string
                                    let variantImages = [];
                                    try {
                                      if (variant.images) {
                                        if (
                                          typeof variant.images === "string"
                                        ) {
                                          variantImages = JSON.parse(
                                            variant.images
                                          );
                                        } else if (
                                          Array.isArray(variant.images)
                                        ) {
                                          variantImages = variant.images;
                                        }
                                      }
                                    } catch (e) {
                                      console.error(
                                        "Failed to parse variant images:",
                                        e
                                      );
                                    }

                                    return (
                                      <tr
                                        key={variant.id || index}
                                        className="hover:bg-muted/50"
                                      >
                                        <td className="px-4 py-3 whitespace-nowrap">
                                          <div>
                                            {variant.color && (
                                              <span className="font-medium">
                                                {variant.color}
                                              </span>
                                            )}
                                            {variant.size && (
                                              <span>
                                                {variant.color ? " / " : ""}
                                                {variant.size}
                                              </span>
                                            )}
                                            {!variant.color &&
                                              !variant.size && (
                                                <span>Default Variant</span>
                                              )}
                                          </div>
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap">
                                          <div className="flex flex-col">
                                            <span className="font-medium">
                                              ₹{variant.price}
                                            </span>
                                            {variant.mrp &&
                                              variant.mrp > variant.price && (
                                                <span className="text-xs text-muted-foreground line-through">
                                                  ₹{variant.mrp}
                                                </span>
                                              )}
                                          </div>
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap">
                                          {variant.stock}
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap text-xs">
                                          {variant.sku || "-"}
                                        </td>
                                        <td className="px-4 py-3">
                                          <div className="flex gap-1">
                                            {variantImages.length > 0 ? (
                                              <div className="flex items-center gap-1">
                                                {variantImages
                                                  .slice(0, 3)
                                                  .map(
                                                    (
                                                      img: string,
                                                      imgIndex: number
                                                    ) => (
                                                      <img
                                                        key={imgIndex}
                                                        src={img}
                                                        alt={`${
                                                          variant.color ||
                                                          "Variant"
                                                        } Image ${imgIndex + 1}`}
                                                        className="h-8 w-8 object-cover rounded-sm border"
                                                        onError={(e) => {
                                                          (
                                                            e.target as HTMLImageElement
                                                          ).src =
                                                            "/images/placeholder.svg";
                                                        }}
                                                      />
                                                    )
                                                  )}
                                                {variantImages.length > 3 && (
                                                  <span className="text-xs text-muted-foreground">
                                                    +{variantImages.length - 3}{" "}
                                                    more
                                                  </span>
                                                )}
                                              </div>
                                            ) : (
                                              <span className="text-xs text-muted-foreground italic">
                                                No images
                                              </span>
                                            )}
                                          </div>
                                        </td>
                                      </tr>
                                    );
                                  }
                                )}
                              </tbody>
                            </table>
                          </div>
                        ) : (
                          <div className="text-center py-6">
                            <p className="text-sm text-muted-foreground">
                              This product doesn't have any variants.
                            </p>
                          </div>
                        )}
                      </div>
                    </TabsContent>

                    <TabsContent value="reviews" className="mt-4">
                      <div className="space-y-4">
                        <h3 className="font-medium">Reviews & Ratings</h3>
                        <div className="text-center py-6">
                          <p className="text-sm text-muted-foreground">
                            This product doesn't have any reviews yet. Reviews
                            will show up here after customers purchase and
                            review the product.
                          </p>
                        </div>
                      </div>
                    </TabsContent>
                  </Tabs>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Fixed checkout buttons on mobile */}
        {isMobile && (
          <div className="fixed bottom-0 left-0 right-0 bg-background border-t p-3 flex justify-between gap-2 z-10">
            <Button
              variant="outline"
              className="w-1/2"
              onClick={() => setLocation(`/seller/products/edit/${productId}`)}
            >
              Edit
            </Button>
            <Button
              className="w-1/2"
              onClick={() => setLocation("/seller/products")}
            >
              Back to Products
            </Button>
          </div>
        )}

        {/* Floating action buttons on desktop */}
        {!isMobile && (
          <div className="fixed bottom-8 right-8 z-10">
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setLocation("/seller/products")}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <Button
                onClick={() =>
                  setLocation(`/seller/products/edit/${productId}`)
                }
              >
                Edit Product
              </Button>
            </div>
          </div>
        )}
      </div>
    </SellerDashboardLayout>
  );
}
