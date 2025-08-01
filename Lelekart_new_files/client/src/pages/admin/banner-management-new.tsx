import React, { useState } from "react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  Loader2,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  EyeOff,
  Eye,
  Search,
  X,
  Edit,
  ArrowUpDown,
  SlidersHorizontal,
  LayoutGrid,
  List,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  type ToastActionElement,
  type ToastProps,
} from "@/components/ui/toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
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
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// Banner type matching the database schema
interface Banner {
  id: number;
  title: string;
  subtitle: string;
  imageUrl: string;
  buttonText: string;
  category: string;
  position: number;
  active: boolean;
  badgeText: string | null;
  productId: number | null;
  createdAt: string;
  updatedAt: string;
}

interface Category {
  id: number;
  name: string;
  image: string;
}

// Mock useCategories hook until we create the real one
const useCategories = () => {
  const { data } = useQuery({
    queryKey: ["/api/categories"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/categories");
      return (await res.json()) as Category[];
    },
  });

  return { data: data || [] };
};

export default function BannerManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isAddingBanner, setIsAddingBanner] = useState(false);
  const [newBanner, setNewBanner] = useState<
    Omit<Banner, "id" | "createdAt" | "updatedAt">
  >({
    title: "",
    subtitle: "",
    imageUrl: "",
    buttonText: "Shop Now",
    category: "",
    position: 1,
    active: true,
    badgeText: "HOT DEAL",
    productId: null,
  });
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterActive, setFilterActive] = useState<boolean | null>(null);
  const { data: categories = [] } = useCategories();

  // Fetch all banners
  const { data: banners = [], isLoading } = useQuery({
    queryKey: ["/api/banners"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/banners");
      const data = await res.json();
      return data as Banner[];
    },
  });

  // Create a new banner
  const createBannerMutation = useMutation({
    mutationFn: async (
      banner: Omit<Banner, "id" | "createdAt" | "updatedAt">
    ) => {
      const res = await apiRequest("POST", "/api/banners", banner);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/banners"] });
      queryClient.invalidateQueries({
        queryKey: ["/api/featured-hero-products"],
      });
      setIsAddingBanner(false);
      setNewBanner({
        title: "",
        subtitle: "",
        imageUrl: "",
        buttonText: "Shop Now",
        category: "",
        position: 1,
        active: true,
        badgeText: "HOT DEAL",
        productId: null,
      });
      toast({
        title: "Banner created",
        description: "Your banner has been created successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error creating banner",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update a banner
  const updateBannerMutation = useMutation({
    mutationFn: async (banner: Banner) => {
      const { id, ...data } = banner;
      const res = await apiRequest("PUT", `/api/banners/${id}`, data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/banners"] });
      queryClient.invalidateQueries({
        queryKey: ["/api/featured-hero-products"],
      });
      setEditingBanner(null);
      toast({
        title: "Banner updated",
        description: "Your banner has been updated successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error updating banner",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete a banner
  const deleteBannerMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/banners/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/banners"] });
      queryClient.invalidateQueries({
        queryKey: ["/api/featured-hero-products"],
      });
      toast({
        title: "Banner deleted",
        description: "Your banner has been deleted successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error deleting banner",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Toggle banner active status
  const toggleBannerMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("PATCH", `/api/banners/${id}/toggle-active`);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/banners"] });
      queryClient.invalidateQueries({
        queryKey: ["/api/featured-hero-products"],
      });
      toast({
        title: "Banner status updated",
        description: "Your banner status has been updated successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error updating banner status",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update banner position
  const updateBannerPositionMutation = useMutation({
    mutationFn: async ({ id, position }: { id: number; position: number }) => {
      const res = await apiRequest("PATCH", `/api/banners/${id}/position`, {
        position,
      });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/banners"] });
      queryClient.invalidateQueries({
        queryKey: ["/api/featured-hero-products"],
      });
      toast({
        title: "Banner position updated",
        description: "Your banner position has been updated successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error updating banner position",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleCreateBanner = () => {
    createBannerMutation.mutate(newBanner);
  };

  const handleSaveChanges = () => {
    if (editingBanner) {
      updateBannerMutation.mutate(editingBanner);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) {
      return;
    }

    const file = e.target.files[0];
    const formData = new FormData();
    formData.append("bannerImage", file);

    try {
      // Show loading toast
      toast({
        title: "Uploading image...",
        description: "Please wait while we upload your image.",
      });

      const res = await fetch("/api/upload/banner", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (data.success && data.imageUrl) {
        // Update the banner state with the new image URL
        setNewBanner((prev) => ({
          ...prev,
          imageUrl: data.imageUrl,
        }));

        // Show success message
        toast({
          title: "Banner image uploaded",
          description:
            data.message || "Your banner image has been uploaded successfully.",
          variant: "default",
        });
      } else {
        // Show error message
        toast({
          title: "Upload failed",
          description:
            data.message ||
            "There was an error uploading your image. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error uploading image:", error);
      toast({
        title: "Upload failed",
        description:
          "There was an error uploading your image. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleEditImageUpload = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    if (!e.target.files || e.target.files.length === 0 || !editingBanner) {
      return;
    }

    const file = e.target.files[0];
    const formData = new FormData();
    formData.append("bannerImage", file);

    try {
      // Show loading toast
      toast({
        title: "Uploading image...",
        description: "Please wait while we upload your image.",
      });

      const res = await fetch("/api/upload/banner", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (data.success && data.imageUrl) {
        // Update the banner state with the new image URL
        setEditingBanner((prev) => {
          if (!prev) return null;
          return {
            ...prev,
            imageUrl: data.imageUrl,
          };
        });

        // Show success message
        toast({
          title: "Banner image uploaded",
          description:
            data.message || "Your banner image has been uploaded successfully.",
          variant: "default",
        });
      } else {
        // Show error message
        toast({
          title: "Upload failed",
          description:
            data.message ||
            "There was an error uploading your image. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error uploading image:", error);
      toast({
        title: "Upload failed",
        description:
          "There was an error uploading your image. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleMoveUp = (banner: Banner) => {
    if (banner.position > 1) {
      updateBannerPositionMutation.mutate({
        id: banner.id,
        position: banner.position - 1,
      });
    }
  };

  const handleMoveDown = (banner: Banner) => {
    updateBannerPositionMutation.mutate({
      id: banner.id,
      position: banner.position + 1,
    });
  };

  const handleNewBannerChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setNewBanner((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleEditingBannerChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    if (!editingBanner) return;

    const { name, value } = e.target;
    setEditingBanner((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        [name]: value,
      };
    });
  };

  const handleToggleActive = (bannerId: number) => {
    toggleBannerMutation.mutate(bannerId);
  };

  // Filter and search banners
  const filteredBanners = [...banners]
    .filter((banner) => {
      // Filter by active status if selected
      if (filterActive !== null) {
        return banner.active === filterActive;
      }
      return true;
    })
    .filter((banner) => {
      // Search in title and subtitle
      if (searchQuery.trim() === "") return true;
      const query = searchQuery.toLowerCase();
      return (
        banner.title.toLowerCase().includes(query) ||
        banner.subtitle.toLowerCase().includes(query) ||
        banner.category.toLowerCase().includes(query)
      );
    })
    .sort((a, b) => a.position - b.position);

  return (
    <AdminLayout>
      <div className="container mx-auto py-4 md:py-8 px-4 md:px-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <h1 className="text-2xl md:text-3xl font-bold">Banner Management</h1>
          {!isAddingBanner && (
            <Button
              onClick={() => setIsAddingBanner(true)}
              className="flex items-center gap-2 w-full sm:w-auto"
            >
              <Plus size={16} />
              Add New Banner
            </Button>
          )}
        </div>

        {!isAddingBanner && !editingBanner && banners.length > 0 && (
          <div className="flex flex-col sm:flex-row flex-wrap gap-3 md:gap-4 bg-muted/30 p-3 md:p-4 rounded-lg mb-6">
            <div className="relative flex-grow min-w-0">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search banners..."
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-9 w-9"
                  onClick={() => setSearchQuery("")}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() =>
                        setFilterActive(filterActive === true ? null : true)
                      }
                      className={
                        filterActive === true
                          ? "bg-primary text-primary-foreground"
                          : ""
                      }
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Show active banners only</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() =>
                        setFilterActive(filterActive === false ? null : false)
                      }
                      className={
                        filterActive === false
                          ? "bg-primary text-primary-foreground"
                          : ""
                      }
                    >
                      <EyeOff className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Show inactive banners only</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <div className="border-l mx-2 h-9 hidden sm:block"></div>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setViewMode("grid")}
                      className={
                        viewMode === "grid"
                          ? "bg-primary text-primary-foreground"
                          : ""
                      }
                    >
                      <LayoutGrid className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Grid view</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setViewMode("list")}
                      className={
                        viewMode === "list"
                          ? "bg-primary text-primary-foreground"
                          : ""
                      }
                    >
                      <List className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>List view</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
        )}

        {isAddingBanner && (
          <Card className="mb-6 md:mb-8">
            <CardHeader>
              <CardTitle>Add New Banner</CardTitle>
              <CardDescription>
                Create a new banner for the hero section of your store.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
              <div className="flex flex-col gap-4">
                <div>
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    name="title"
                    value={newBanner.title}
                    onChange={handleNewBannerChange}
                    placeholder="e.g. Summer Sale"
                  />
                </div>
                <div>
                  <Label htmlFor="subtitle">Subtitle</Label>
                  <Input
                    id="subtitle"
                    name="subtitle"
                    value={newBanner.subtitle}
                    onChange={handleNewBannerChange}
                    placeholder="e.g. Up to 50% off"
                  />
                </div>
                <div>
                  <Label htmlFor="buttonText">Button Text</Label>
                  <Input
                    id="buttonText"
                    name="buttonText"
                    value={newBanner.buttonText}
                    onChange={handleNewBannerChange}
                    placeholder="e.g. Shop Now"
                  />
                </div>
                <div>
                  <Label htmlFor="badgeText">Badge Text (Optional)</Label>
                  <Input
                    id="badgeText"
                    name="badgeText"
                    value={newBanner.badgeText || ""}
                    onChange={handleNewBannerChange}
                    placeholder="e.g. HOT DEAL"
                  />
                </div>
              </div>
              <div className="flex flex-col gap-4">
                <div className="space-y-2">
                  <Label>Banner Image</Label>
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <Label
                        htmlFor="imageUpload"
                        className="text-sm text-muted-foreground"
                      >
                        Upload Image
                      </Label>
                      <Input
                        id="imageUpload"
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="mt-1"
                      />
                    </div>
                    <div className="-- OR --">
                      <div className="relative flex items-center my-2">
                        <div className="flex-grow border-t border-gray-300"></div>
                        <span className="flex-shrink mx-4 text-gray-400 text-sm">
                          OR
                        </span>
                        <div className="flex-grow border-t border-gray-300"></div>
                      </div>
                    </div>
                    <div>
                      <Label
                        htmlFor="imageUrl"
                        className="text-sm text-muted-foreground"
                      >
                        Image URL
                      </Label>
                      <Input
                        id="imageUrl"
                        name="imageUrl"
                        value={newBanner.imageUrl}
                        onChange={handleNewBannerChange}
                        placeholder="https://example.com/image.jpg"
                        className="mt-1"
                      />
                    </div>
                  </div>
                  {newBanner.imageUrl && (
                    <div className="mt-2">
                      <Label className="text-sm text-muted-foreground">
                        Image Preview
                      </Label>
                      <div className="mt-1 border rounded-md overflow-hidden w-full h-32 relative">
                        <img
                          src={newBanner.imageUrl}
                          alt="Banner preview"
                          className="object-cover w-full h-full"
                          onError={(e) =>
                            (e.currentTarget.src =
                              "https://via.placeholder.com/300x150?text=Invalid+Image+URL")
                          }
                        />
                      </div>
                    </div>
                  )}
                </div>
                <div>
                  <Label htmlFor="category">Category</Label>
                  <Select
                    name="category"
                    value={newBanner.category}
                    onValueChange={(value) =>
                      setNewBanner((prev) => ({ ...prev, category: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.name}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="productId">Product ID (Optional)</Label>
                  <Input
                    id="productId"
                    name="productId"
                    type="number"
                    value={newBanner.productId || ""}
                    onChange={(e) =>
                      setNewBanner((prev) => ({
                        ...prev,
                        productId: e.target.value
                          ? parseInt(e.target.value)
                          : null,
                      }))
                    }
                    placeholder="e.g. 123"
                  />
                </div>
                <div className="flex items-center space-x-2 mt-2">
                  <Switch
                    id="active"
                    checked={newBanner.active}
                    onCheckedChange={(checked) =>
                      setNewBanner((prev) => ({ ...prev, active: checked }))
                    }
                  />
                  <Label htmlFor="active">Active</Label>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col sm:flex-row justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setIsAddingBanner(false)}
                className="w-full sm:w-auto"
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateBanner}
                disabled={
                  createBannerMutation.isPending ||
                  !newBanner.title ||
                  !newBanner.imageUrl
                }
                className="w-full sm:w-auto"
              >
                {createBannerMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Create Banner
              </Button>
            </CardFooter>
          </Card>
        )}

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : banners.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 md:py-24 bg-muted/30 rounded-lg">
            <div className="bg-muted/50 rounded-full p-4 mb-4">
              <LayoutGrid className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg md:text-xl font-semibold mb-1 text-center">
              No banners yet
            </h3>
            <p className="text-muted-foreground max-w-md text-center mb-6 px-4">
              Create your first banner to start showcasing products in the hero
              section of your store.
            </p>
            <Button
              onClick={() => setIsAddingBanner(true)}
              className="flex items-center gap-2"
            >
              <Plus size={16} />
              Add Your First Banner
            </Button>
          </div>
        ) : filteredBanners.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 md:py-16 bg-muted/30 rounded-lg">
            <div className="bg-muted/50 rounded-full p-4 mb-4">
              <Search className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="text-lg md:text-xl font-semibold mb-1 text-center">
              No matching banners
            </h3>
            <p className="text-muted-foreground max-w-md text-center mb-6 px-4">
              No banners match your current search or filters. Try adjusting
              your search terms or clear filters.
            </p>
            <Button
              variant="outline"
              onClick={() => {
                setSearchQuery("");
                setFilterActive(null);
              }}
              className="flex items-center gap-2"
            >
              <X size={16} />
              Clear Filters
            </Button>
          </div>
        ) : (
          <div className="mb-6 md:mb-8">
            {!isAddingBanner && !editingBanner && (
              <div className="flex justify-between items-center mb-4">
                <p className="text-sm md:text-base text-muted-foreground">
                  {filteredBanners.length} banner
                  {filteredBanners.length !== 1 ? "s" : ""} found
                  {filterActive !== null && (
                    <span>
                      {" "}
                      • {filterActive ? "Active only" : "Inactive only"}
                    </span>
                  )}
                  {searchQuery && <span> • Filtered by "{searchQuery}"</span>}
                </p>
              </div>
            )}

            {/* Grid View Mode */}
            {viewMode === "grid" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                {filteredBanners.map((banner) => (
                  <Card
                    key={banner.id}
                    className={`group overflow-hidden transition-all duration-300 hover:shadow-md ${banner.active ? "" : "opacity-80"}`}
                  >
                    <div className="relative aspect-[16/9] overflow-hidden">
                      <img
                        src={banner.imageUrl}
                        alt={banner.title}
                        className="object-cover w-full h-full transition-transform duration-300 group-hover:scale-105"
                        onError={(e) =>
                          (e.currentTarget.src =
                            "https://via.placeholder.com/300x150?text=Invalid+Image+URL")
                        }
                      />
                      {banner.badgeText && (
                        <div className="absolute top-2 left-2 bg-primary text-primary-foreground text-xs font-bold px-2 py-1 rounded">
                          {banner.badgeText}
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
                        <div className="flex gap-2">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  size="icon"
                                  variant="secondary"
                                  onClick={() => setEditingBanner(banner)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Edit banner</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>

                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  size="icon"
                                  variant="secondary"
                                  onClick={() => handleToggleActive(banner.id)}
                                >
                                  {banner.active ? (
                                    <EyeOff className="h-4 w-4" />
                                  ) : (
                                    <Eye className="h-4 w-4" />
                                  )}
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>
                                  {banner.active ? "Deactivate" : "Activate"}{" "}
                                  banner
                                </p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>

                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button size="icon" variant="destructive">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>
                                  Delete banner
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete this banner?
                                  This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() =>
                                    deleteBannerMutation.mutate(banner.id)
                                  }
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  {deleteBannerMutation.isPending && (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  )}
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                    </div>
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <div className="min-w-0 flex-1">
                          <CardTitle className="flex items-center text-sm md:text-base">
                            <span className="truncate">{banner.title}</span>
                            {!banner.active && (
                              <Badge
                                variant="outline"
                                className="ml-2 text-xs flex-shrink-0"
                              >
                                Inactive
                              </Badge>
                            )}
                          </CardTitle>
                          <CardDescription className="text-xs md:text-sm truncate">
                            {banner.subtitle}
                          </CardDescription>
                        </div>
                        <Badge
                          variant="outline"
                          title="Display order"
                          className="text-xs flex-shrink-0"
                        >
                          #{banner.position}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="pb-2">
                      <div className="grid grid-cols-1 gap-1 md:gap-2 text-xs md:text-sm">
                        <div>
                          <span className="text-muted-foreground">Button:</span>{" "}
                          {banner.buttonText}
                        </div>
                        <div>
                          <span className="text-muted-foreground">
                            Category:
                          </span>{" "}
                          {banner.category || "None"}
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter className="flex flex-col sm:flex-row justify-between gap-2 pt-2">
                      <div className="flex gap-1 w-full sm:w-auto justify-center sm:justify-start">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleMoveUp(banner)}
                          disabled={banner.position <= 1}
                        >
                          <ArrowUp className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleMoveDown(banner)}
                          disabled={banner.position >= filteredBanners.length}
                        >
                          <ArrowDown className="h-4 w-4" />
                        </Button>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEditingBanner(banner)}
                        className="h-8 w-full sm:w-auto"
                      >
                        <Edit className="h-3.5 w-3.5 mr-1" />
                        Edit
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            )}

            {/* List View Mode */}
            {viewMode === "list" && (
              <div className="space-y-4">
                {filteredBanners.map((banner) => (
                  <Card
                    key={banner.id}
                    className={`overflow-hidden hover:shadow-md transition-all duration-300 ${banner.active ? "" : "opacity-70"}`}
                  >
                    <div className="flex flex-col md:flex-row">
                      <div className="relative w-full md:w-48 h-40">
                        <img
                          src={banner.imageUrl}
                          alt={banner.title}
                          className="w-full h-full object-cover"
                          onError={(e) =>
                            (e.currentTarget.src =
                              "https://via.placeholder.com/300x150?text=Invalid+Image+URL")
                          }
                        />
                        {banner.badgeText && (
                          <div className="absolute top-2 left-2 bg-primary text-primary-foreground text-xs font-bold px-2 py-1 rounded">
                            {banner.badgeText}
                          </div>
                        )}
                      </div>
                      <div className="flex-1 flex flex-col">
                        <CardHeader className="pb-2">
                          <div className="flex justify-between items-start">
                            <div className="min-w-0 flex-1">
                              <CardTitle className="group flex items-center gap-2 text-sm md:text-base">
                                <span className="truncate">{banner.title}</span>
                                {!banner.active && (
                                  <Badge
                                    variant="outline"
                                    className="text-xs flex-shrink-0"
                                  >
                                    Inactive
                                  </Badge>
                                )}
                              </CardTitle>
                              <CardDescription className="text-xs md:text-sm truncate">
                                {banner.subtitle}
                              </CardDescription>
                            </div>
                            <div className="flex items-center gap-1">
                              <Badge
                                variant="outline"
                                title="Display position"
                                className="text-xs"
                              >
                                #{banner.position}
                              </Badge>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="pb-2 flex-grow">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 md:gap-4 text-xs md:text-sm">
                            <div>
                              <span className="text-muted-foreground">
                                Button Text:
                              </span>{" "}
                              {banner.buttonText}
                            </div>
                            <div>
                              <span className="text-muted-foreground">
                                Category:
                              </span>{" "}
                              {banner.category || "None"}
                            </div>
                          </div>
                        </CardContent>
                        <CardFooter className="flex flex-col sm:flex-row justify-between gap-2 pt-2">
                          <div className="flex gap-1 w-full sm:w-auto justify-center sm:justify-start">
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => handleMoveUp(banner)}
                              disabled={banner.position <= 1}
                              className="h-8 w-8"
                            >
                              <ArrowUp className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => handleMoveDown(banner)}
                              disabled={
                                banner.position >= filteredBanners.length
                              }
                              className="h-8 w-8"
                            >
                              <ArrowDown className="h-4 w-4" />
                            </Button>
                          </div>
                          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 w-full sm:w-auto"
                              onClick={() => handleToggleActive(banner.id)}
                            >
                              {banner.active ? (
                                <>
                                  <EyeOff className="h-3.5 w-3.5 mr-1" />
                                  Deactivate
                                </>
                              ) : (
                                <>
                                  <Eye className="h-3.5 w-3.5 mr-1" />
                                  Activate
                                </>
                              )}
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 w-full sm:w-auto"
                              onClick={() => setEditingBanner(banner)}
                            >
                              <Edit className="h-3.5 w-3.5 mr-1" />
                              Edit
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-8 w-full sm:w-auto text-destructive border-destructive hover:bg-destructive/10"
                                >
                                  <Trash2 className="h-3.5 w-3.5 mr-1" />
                                  Delete
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>
                                    Delete banner
                                  </AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete this banner?
                                    This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() =>
                                      deleteBannerMutation.mutate(banner.id)
                                    }
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  >
                                    {deleteBannerMutation.isPending && (
                                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    )}
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </CardFooter>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Edit Banner Modal */}
      {editingBanner && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle>Edit Banner</CardTitle>
              <CardDescription>
                Update the details of your banner.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
              <div className="flex flex-col gap-4">
                <div>
                  <Label htmlFor="edit-title">Title</Label>
                  <Input
                    id="edit-title"
                    name="title"
                    value={editingBanner.title}
                    onChange={handleEditingBannerChange}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-subtitle">Subtitle</Label>
                  <Input
                    id="edit-subtitle"
                    name="subtitle"
                    value={editingBanner.subtitle}
                    onChange={handleEditingBannerChange}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-buttonText">Button Text</Label>
                  <Input
                    id="edit-buttonText"
                    name="buttonText"
                    value={editingBanner.buttonText}
                    onChange={handleEditingBannerChange}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-badgeText">Badge Text (Optional)</Label>
                  <Input
                    id="edit-badgeText"
                    name="badgeText"
                    value={editingBanner.badgeText || ""}
                    onChange={handleEditingBannerChange}
                  />
                </div>
              </div>
              <div className="flex flex-col gap-4">
                <div className="space-y-2">
                  <Label>Banner Image</Label>
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <Label
                        htmlFor="edit-imageUpload"
                        className="text-sm text-muted-foreground"
                      >
                        Upload Image
                      </Label>
                      <Input
                        id="edit-imageUpload"
                        type="file"
                        accept="image/*"
                        onChange={handleEditImageUpload}
                        className="mt-1"
                      />
                    </div>
                    <div className="-- OR --">
                      <div className="relative flex items-center my-2">
                        <div className="flex-grow border-t border-gray-300"></div>
                        <span className="flex-shrink mx-4 text-gray-400 text-sm">
                          OR
                        </span>
                        <div className="flex-grow border-t border-gray-300"></div>
                      </div>
                    </div>
                    <div>
                      <Label
                        htmlFor="edit-imageUrl"
                        className="text-sm text-muted-foreground"
                      >
                        Image URL
                      </Label>
                      <Input
                        id="edit-imageUrl"
                        name="imageUrl"
                        value={editingBanner.imageUrl}
                        onChange={handleEditingBannerChange}
                        placeholder="https://example.com/image.jpg"
                        className="mt-1"
                      />
                    </div>
                  </div>
                  {editingBanner.imageUrl && (
                    <div className="mt-2">
                      <Label className="text-sm text-muted-foreground">
                        Image Preview
                      </Label>
                      <div className="mt-1 border rounded-md overflow-hidden w-full h-32 relative">
                        <img
                          src={editingBanner.imageUrl}
                          alt="Banner preview"
                          className="object-cover w-full h-full"
                          onError={(e) =>
                            (e.currentTarget.src =
                              "https://via.placeholder.com/300x150?text=Invalid+Image+URL")
                          }
                        />
                      </div>
                    </div>
                  )}
                </div>
                <div>
                  <Label htmlFor="edit-category">Category</Label>
                  <Select
                    name="category"
                    value={editingBanner.category}
                    onValueChange={(value) =>
                      setEditingBanner((prev) => {
                        if (!prev) return null;
                        return { ...prev, category: value };
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.name}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="edit-productId">Product ID (Optional)</Label>
                  <Input
                    id="edit-productId"
                    name="productId"
                    type="number"
                    value={editingBanner.productId || ""}
                    onChange={(e) =>
                      setEditingBanner((prev) => {
                        if (!prev) return null;
                        return {
                          ...prev,
                          productId: e.target.value
                            ? parseInt(e.target.value)
                            : null,
                        };
                      })
                    }
                  />
                </div>
                <div className="flex items-center space-x-2 mt-2">
                  <Switch
                    id="edit-active"
                    checked={editingBanner.active}
                    onCheckedChange={(checked) =>
                      setEditingBanner((prev) => {
                        if (!prev) return null;
                        return { ...prev, active: checked };
                      })
                    }
                  />
                  <Label htmlFor="edit-active">Active</Label>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col sm:flex-row justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setEditingBanner(null)}
                className="w-full sm:w-auto"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSaveChanges}
                disabled={
                  updateBannerMutation.isPending ||
                  !editingBanner.title ||
                  !editingBanner.imageUrl
                }
                className="w-full sm:w-auto"
              >
                {updateBannerMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Save Changes
              </Button>
            </CardFooter>
          </Card>
        </div>
      )}
    </AdminLayout>
  );
}
