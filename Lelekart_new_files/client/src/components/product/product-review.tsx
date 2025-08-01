import React from "react";
import { User, ReviewImage } from "@shared/schema";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/hooks/use-auth";
import { ThumbsUp, Edit2, Star, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";

interface ProductReviewProps {
  id: number;
  title?: string | null;
  review?: string | null;
  rating: number;
  verifiedPurchase: boolean;
  helpfulCount: number;
  createdAt: Date;
  user: User;
  images?: ReviewImage[];
  isHelpful?: boolean;
  onDelete?: () => void;
  onEdit?: () => void;
}

const StarRating = ({ rating }: { rating: number }) => {
  return (
    <div className="flex">
      {[1, 2, 3, 4, 5].map((star) => (
        <svg
          key={star}
          xmlns="http://www.w3.org/2000/svg"
          className={`h-5 w-5 ${
            star <= rating ? "text-yellow-400" : "text-gray-300"
          }`}
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fillRule="evenodd"
            d="M10 15.934l-6.18 3.249 1.18-6.889L.083 7.514l6.91-1.004L10 0l3.008 6.51 6.909 1.004-4.917 4.78 1.18 6.89z"
            clipRule="evenodd"
          />
        </svg>
      ))}
    </div>
  );
};

const ProductReview: React.FC<ProductReviewProps> = ({
  id,
  title,
  review,
  rating,
  verifiedPurchase,
  helpfulCount,
  createdAt,
  user,
  images,
  isHelpful,
  onDelete,
  onEdit,
}) => {
  const { user: currentUser } = useAuth();
  const { toast } = useToast();
  const [helpful, setHelpful] = React.useState(isHelpful || false);
  const [helpfulCountState, setHelpfulCountState] =
    React.useState(helpfulCount);

  // Edit dialog state
  const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false);
  const [editedTitle, setEditedTitle] = React.useState(title || "");
  const [editedContent, setEditedContent] = React.useState(review || "");
  const [editedRating, setEditedRating] = React.useState(rating);

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
        review: reviewData.content, // Backend expects 'review' field
        rating: reviewData.rating,
      });

      if (!res.ok) throw new Error("Failed to update review");
      return res.json();
    },
    onSuccess: () => {
      setIsEditDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ["productReviews"] });
      toast({
        title: "Review Updated",
        description: "Your review has been updated successfully.",
      });
      if (onEdit) onEdit();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

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

  // Handle edit dialog open
  const handleEditClick = () => {
    setEditedTitle(title || "");
    setEditedContent(review || "");
    setEditedRating(rating);
    setIsEditDialogOpen(true);
  };

  // Handle edit form submission
  const handleEditSubmit = () => {
    updateReviewMutation.mutate({
      id,
      title: editedTitle,
      content: editedContent,
      rating: editedRating,
    });
  };

  const markAsHelpful = async () => {
    if (!currentUser) {
      toast({
        title: "Please login",
        description: "You need to be logged in to mark a review as helpful",
        variant: "destructive",
      });
      return;
    }

    if (user.id === currentUser.id) {
      toast({
        title: "Cannot mark own review",
        description: "You cannot mark your own review as helpful",
        variant: "destructive",
      });
      return;
    }

    try {
      if (helpful) {
        // Remove helpful mark
        await apiRequest("DELETE", `/api/reviews/${id}/helpful`);
        setHelpful(false);
        setHelpfulCountState((prev) => Math.max(0, prev - 1));
      } else {
        // Mark as helpful
        await apiRequest("POST", `/api/reviews/${id}/helpful`);
        setHelpful(true);
        setHelpfulCountState((prev) => prev + 1);
      }
    } catch (error) {
      console.error("Error marking review as helpful:", error);
      toast({
        title: "Error",
        description: "Failed to mark review as helpful",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async () => {
    if (!currentUser) return;

    if (currentUser.id !== user.id && currentUser.role !== "admin") {
      toast({
        title: "Not authorized",
        description: "You cannot delete this review",
        variant: "destructive",
      });
      return;
    }

    try {
      await apiRequest("DELETE", `/api/reviews/${id}`);
      toast({
        title: "Review deleted",
        description: "Your review has been deleted successfully",
      });
      // Trigger refresh of reviews
      queryClient.invalidateQueries({ queryKey: ["productReviews"] });
      if (onDelete) onDelete();
    } catch (error) {
      console.error("Error deleting review:", error);
      toast({
        title: "Error",
        description: "Failed to delete review",
        variant: "destructive",
      });
    }
  };

  return (
    <>
      <Card className="mb-4">
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <Avatar className="h-10 w-10">
                <AvatarImage src={user.avatar} alt={user.username} />
                <AvatarFallback>
                  {user.username.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="font-medium">{user.username}</div>
                <div className="text-xs text-muted-foreground">
                  {format(new Date(createdAt), "MMM dd, yyyy")}
                </div>
              </div>
            </div>
            <div className="flex flex-col items-end gap-1">
              <StarRating rating={rating} />
              {verifiedPurchase && (
                <Badge
                  variant="outline"
                  className="text-xs bg-green-50 text-green-700 border-green-200"
                >
                  Verified Purchase
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {title && <h4 className="font-semibold mb-2">{title}</h4>}
          {review && <p className="text-sm mb-4">{review}</p>}

          {images && images.length > 0 && (
            <div className="grid grid-cols-5 gap-2 mb-4">
              {images.map((image) => (
                <div
                  key={image.id}
                  className="aspect-square rounded-md overflow-hidden"
                >
                  <img
                    src={image.imageUrl}
                    alt="Review image"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = "/images/placeholder.svg";
                    }}
                  />
                </div>
              ))}
            </div>
          )}

          <Separator className="my-3" />

          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Button
                variant={helpful ? "secondary" : "outline"}
                size="sm"
                onClick={markAsHelpful}
                className="h-8 px-3"
              >
                <ThumbsUp
                  className={`h-4 w-4 mr-1 ${helpful ? "fill-current" : ""}`}
                />
                Helpful ({helpfulCountState})
              </Button>
            </div>

            {currentUser &&
              (currentUser.id === user.id || currentUser.role === "admin") && (
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleEditClick}
                    className="flex items-center"
                  >
                    <Edit2 className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleDelete}
                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                  >
                    Delete
                  </Button>
                </div>
              )}
          </div>
        </CardContent>
      </Card>

      {/* Edit Review Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Your Review</DialogTitle>
            <DialogDescription>Make changes to your review</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Rating</label>
              {renderEditStars()}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Title</label>
              <Input
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
              onClick={handleEditSubmit}
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
    </>
  );
};

export default ProductReview;
