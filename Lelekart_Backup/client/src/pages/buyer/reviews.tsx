import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Star,
  Edit2,
  Trash2,
  ThumbsUp,
  Clock,
  Loader2,
  ShoppingBag,
  Calendar,
  CheckCircle2,
} from "lucide-react";
import { Link } from "wouter";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { apiRequest } from "@/lib/queryClient";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Types
interface Product {
  id: number;
  name: string;
  price: number;
  imageUrl?: string;
  images?: string;
  description: string;
  category: string;
}

interface User {
  id: number;
  username: string;
}

interface ReviewImage {
  id: number;
  reviewId: number;
  imageUrl: string;
}

interface Review {
  id: number;
  userId: number;
  productId: number;
  orderId?: number;
  rating: number;
  title: string;
  review: string; // Changed from 'content' to 'review' to match database schema
  verified: boolean;
  createdAt: string;
  updatedAt: string;
  product: Product;
  images?: ReviewImage[];
  helpfulCount?: number;
  isHelpful?: boolean; // Whether the current user marked this as helpful
}

export default function BuyerReviewsPage() {
  const [activeTab, setActiveTab] = useState("all");
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editedTitle, setEditedTitle] = useState("");
  const [editedContent, setEditedContent] = useState("");
  const [editedRating, setEditedRating] = useState(0);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch user reviews
  const { data: reviews = [], isLoading } = useQuery<Review[]>({
    queryKey: ["/api/user/reviews"],
    queryFn: async () => {
      try {
        const res = await apiRequest("GET", "/api/user/reviews");
        return res.json();
      } catch (error) {
        console.error("Error fetching reviews:", error);
        return [];
      }
    },
  });

  // Filter reviews based on active tab
  const pendingReviews = reviews.filter((review) => !review.verified);
  const verifiedReviews = reviews.filter((review) => review.verified);
  const displayedReviews =
    activeTab === "pending"
      ? pendingReviews
      : activeTab === "verified"
        ? verifiedReviews
        : reviews;

  // Toggle helpful mutation
  const toggleHelpfulMutation = useMutation({
    mutationFn: async ({
      reviewId,
      isHelpful,
    }: {
      reviewId: number;
      isHelpful: boolean;
    }) => {
      if (isHelpful) {
        const res = await apiRequest(
          "DELETE",
          `/api/reviews/${reviewId}/helpful`
        );
        if (!res.ok) throw new Error("Failed to unmark review as helpful");
      } else {
        const res = await apiRequest(
          "POST",
          `/api/reviews/${reviewId}/helpful`
        );
        if (!res.ok) throw new Error("Failed to mark review as helpful");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user/reviews"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update review mutation
  const updateReviewMutation = useMutation({
    mutationFn: async (reviewData: {
      id: number;
      title: string;
      content: string;
      rating: number;
    }) => {
      const res = await apiRequest("PUT", `/api/reviews/${reviewData.id}`, {
        title: reviewData.title,
        review: reviewData.content, // Changed from 'content' to 'review' to match backend
        rating: reviewData.rating,
      });

      if (!res.ok) throw new Error("Failed to update review");
      return res.json();
    },
    onSuccess: () => {
      setIsEditDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ["/api/user/reviews"] });
      toast({
        title: "Review Updated",
        description: "Your review has been updated successfully.",
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

  // Delete review mutation
  const deleteReviewMutation = useMutation({
    mutationFn: async (reviewId: number) => {
      const res = await apiRequest("DELETE", `/api/reviews/${reviewId}`);
      if (!res.ok) throw new Error("Failed to delete review");
    },
    onSuccess: () => {
      setIsDeleteDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ["/api/user/reviews"] });
      toast({
        title: "Review Deleted",
        description: "Your review has been deleted successfully.",
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

  // Helper function to open edit dialog with review data
  const openEditDialog = (review: Review) => {
    setSelectedReview(review);
    setEditedTitle(review.title);
    setEditedContent(review.review);
    setEditedRating(review.rating);
    setIsEditDialogOpen(true);
  };

  // Helper function to open delete dialog with review data
  const openDeleteDialog = (review: Review) => {
    setSelectedReview(review);
    setIsDeleteDialogOpen(true);
  };

  // Helper to render star rating
  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-4 w-4 ${
              star <= rating
                ? "text-yellow-400 fill-yellow-400"
                : "text-gray-300"
            }`}
          />
        ))}
        <span className="ml-2 text-sm font-medium">{rating}/5</span>
      </div>
    );
  };

  // Helper for edit dialog star rating
  const renderEditStars = () => {
    return (
      <div className="flex items-center space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-6 w-6 cursor-pointer ${
              star <= editedRating
                ? "text-yellow-400 fill-yellow-400"
                : "text-gray-300"
            }`}
            onClick={() => setEditedRating(star)}
          />
        ))}
      </div>
    );
  };

  // Format date in "dd MMM yyyy" format (e.g., "15 Jan 2025")
  const formatReviewDate = (dateString: string) => {
    return format(new Date(dateString), "dd MMM yyyy");
  };

  // Get product image URL (handles different formats)
  const getProductImageUrl = (product: Product): string => {
    if (product.imageUrl) {
      return product.imageUrl;
    }

    if (product.images) {
      try {
        const parsedImages = JSON.parse(product.images);
        if (Array.isArray(parsedImages) && parsedImages.length > 0) {
          return parsedImages[0];
        }
      } catch (e) {
        console.error("Failed to parse product images:", e);
      }
    }

    return "https://via.placeholder.com/100?text=Product";
  };

  return (
    <div className="min-h-screen bg-[#F8F5E4]">
      <DashboardLayout>
        <div className="w-full">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
            <div>
              <h1 className="text-2xl font-bold mb-1">My Reviews</h1>
              <p className="text-muted-foreground">
                Manage reviews you've written for products
              </p>
            </div>
          </div>

          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="space-y-4"
          >
            <TabsList className="grid w-full grid-cols-3 max-w-md">
              <TabsTrigger value="all">
                All Reviews ({reviews.length})
              </TabsTrigger>
              <TabsTrigger value="verified">
                Verified ({verifiedReviews.length})
              </TabsTrigger>
              <TabsTrigger value="pending">
                Pending ({pendingReviews.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="space-y-4">
              {renderReviewsList()}
            </TabsContent>

            <TabsContent value="verified" className="space-y-4">
              {renderReviewsList(verifiedReviews)}
            </TabsContent>

            <TabsContent value="pending" className="space-y-4">
              {renderReviewsList(pendingReviews)}
            </TabsContent>
          </Tabs>

          {/* Edit Dialog */}
          <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>Edit Your Review</DialogTitle>
                <DialogDescription>
                  Make changes to your review for {selectedReview?.product.name}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Rating</label>
                  {renderEditStars()}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Title</label>
                  <input
                    className="w-full rounded-md border border-input bg-[#F8F5E4] px-3 py-2 text-sm"
                    value={editedTitle}
                    onChange={(e) => setEditedTitle(e.target.value)}
                    placeholder="Review Title"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Review</label>
                  <Textarea
                    value={editedContent}
                    onChange={(e) => setEditedContent(e.target.value)}
                    placeholder="Share details of your experience with this product"
                    className="min-h-[100px]"
                  />
                </div>
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setIsEditDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={() =>
                    selectedReview &&
                    updateReviewMutation.mutate({
                      id: selectedReview.id,
                      title: editedTitle,
                      content: editedContent,
                      rating: editedRating,
                    })
                  }
                  disabled={updateReviewMutation.isPending}
                >
                  {updateReviewMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save Changes"
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Delete Confirmation Dialog */}
          <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Delete Review</DialogTitle>
                <DialogDescription>
                  Are you sure you want to delete your review for{" "}
                  {selectedReview?.product.name}? This action cannot be undone.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setIsDeleteDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={() =>
                    selectedReview &&
                    deleteReviewMutation.mutate(selectedReview.id)
                  }
                  disabled={deleteReviewMutation.isPending}
                >
                  {deleteReviewMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    "Delete Review"
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </DashboardLayout>
    </div>
  );

  // Helper function to render the reviews list
  function renderReviewsList(reviewsToShow = displayedReviews) {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      );
    }

    if (reviewsToShow.length === 0) {
      return (
        <div className="text-center py-12 border rounded-lg">
          <div className="mb-4">
            <ShoppingBag className="w-16 h-16 mx-auto text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium mb-2">
            {activeTab === "pending"
              ? "No pending reviews"
              : activeTab === "verified"
                ? "No verified reviews yet"
                : "You haven't written any reviews yet"}
          </h3>
          <p className="text-muted-foreground mb-6">
            {activeTab === "pending"
              ? "All your reviews have been verified"
              : activeTab === "verified"
                ? "Your reviews will appear here once verified"
                : "Share your experiences with products you've purchased"}
          </p>
          <Button asChild>
            <Link href="/orders">View Your Orders</Link>
          </Button>
        </div>
      );
    }

    return reviewsToShow.map((review) => (
      <Card key={review.id} className="border shadow-sm bg-[#F8F5E4]">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-6">
            {/* Product Image */}
            <div className="md:w-1/6 flex-shrink-0">
              <Link href={`/product/${review.product.id}`}>
                <div className="relative h-24 w-24 overflow-hidden rounded-md border">
                  <img
                    src={getProductImageUrl(review.product)}
                    alt={review.product.name}
                    className="h-full w-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src =
                        "https://via.placeholder.com/100?text=Product";
                    }}
                  />
                </div>
              </Link>
            </div>

            {/* Review Content */}
            <div className="md:w-5/6 space-y-4">
              {/* Top row with product name and review date */}
              <div className="flex flex-col md:flex-row justify-between">
                <Link
                  href={`/product/${review.product.id}`}
                  className="hover:text-primary transition-colors"
                >
                  <h3 className="font-medium text-lg">{review.product.name}</h3>
                </Link>
                <div className="flex items-center space-x-2 mt-2 md:mt-0">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    Reviewed on {formatReviewDate(review.createdAt)}
                  </span>
                </div>
              </div>

              {/* Rating and Verified Badge */}
              <div className="flex items-center gap-3">
                {renderStars(review.rating)}
                {review.verified ? (
                  <Badge className="bg-green-100 text-green-800 flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" />
                    Verified Purchase
                  </Badge>
                ) : (
                  <Badge className="bg-orange-100 text-orange-800 flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    Pending Verification
                  </Badge>
                )}
              </div>

              {/* Review Title and Content */}
              <div>
                <h4 className="font-semibold text-base">{review.title}</h4>
                <p className="text-muted-foreground mt-1">{review.review}</p>
              </div>

              {/* Review Images if any */}
              {review.images && review.images.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {review.images.map((image) => (
                    <div
                      key={image.id}
                      className="h-20 w-20 rounded-md overflow-hidden"
                    >
                      <img
                        src={image.imageUrl}
                        alt="Review"
                        className="h-full w-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src =
                            "https://via.placeholder.com/80?text=Image";
                        }}
                      />
                    </div>
                  ))}
                </div>
              )}

              {/* Actions row */}
              <div className="flex justify-between items-center pt-2">
                <div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-muted-foreground hover:text-foreground"
                    onClick={() =>
                      review.isHelpful !== undefined &&
                      toggleHelpfulMutation.mutate({
                        reviewId: review.id,
                        isHelpful: review.isHelpful,
                      })
                    }
                    disabled={toggleHelpfulMutation.isPending}
                  >
                    <ThumbsUp
                      className={`h-4 w-4 mr-1 ${review.isHelpful ? "fill-primary text-primary" : ""}`}
                    />
                    <span>{review.helpfulCount || 0} Helpful</span>
                  </Button>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex items-center"
                    onClick={() => openEditDialog(review)}
                  >
                    <Edit2 className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex items-center text-destructive hover:text-destructive"
                    onClick={() => openDeleteDialog(review)}
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Delete
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    ));
  }
}
