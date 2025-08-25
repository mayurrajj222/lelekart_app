import React from "react";
import { User, ReviewImage } from "@shared/schema";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/hooks/use-auth";
import {
  ThumbsUp,
  Edit2,
  Star,
  Loader2,
  MessageSquare,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
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
  productId?: number; // Add productId prop for ownership checks
}

interface ReviewReply {
  id: number;
  reviewId: number;
  userId: number;
  reply: string;
  createdAt: string;
  updatedAt: string;
  user: User;
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
  productId,
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

  // Reply state
  const [replies, setReplies] = React.useState<ReviewReply[]>([]);
  const [showReplies, setShowReplies] = React.useState(false);
  const [replyText, setReplyText] = React.useState("");
  const [isSubmittingReply, setIsSubmittingReply] = React.useState(false);
  const [showReplyForm, setShowReplyForm] = React.useState(false);
  const [isLoadingReplies, setIsLoadingReplies] = React.useState(false);

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

  // Reply functions
  const fetchReplies = async () => {
    console.log("=== FRONTEND: Starting fetchReplies ===");
    console.log("Review ID:", id);
    console.log("Current replies state:", replies);
    console.log("Show replies state:", showReplies);

    setIsLoadingReplies(true);
    try {
      console.log("Fetching replies for review ID:", id);
      const url = `/api/reviews/${id}/replies`;
      console.log("Request URL:", url);

      const response = await fetch(url);
      console.log("Response status:", response.status);
      console.log(
        "Response headers:",
        Object.fromEntries(response.headers.entries())
      );

      if (response.ok) {
        const data = await response.json();
        console.log("Replies data received:", data);
        console.log("Number of replies:", data.length);
        console.log("Data type:", typeof data);
        console.log("Is array:", Array.isArray(data));

        if (Array.isArray(data)) {
          console.log(
            "Reply details:",
            data.map((r) => ({
              id: r.id,
              userId: r.userId,
              reply: r.reply?.substring(0, 50) + "...",
              user: r.user
                ? { id: r.user.id, username: r.user.username }
                : "No user data",
            }))
          );
        }

        setReplies(data);
        console.log("Replies state updated with:", data);
        console.log("New replies state length:", data.length);
      } else {
        console.error("Failed to fetch replies:", response.statusText);
        const errorText = await response.text();
        console.error("Error response body:", errorText);
        console.error("Response status:", response.status);
      }
    } catch (error) {
      console.error("Error fetching replies:", error);
      console.error("Error details:", {
        name: error.name,
        message: error.message,
        stack: error.stack,
      });
      toast({
        title: "Error",
        description: "Failed to load replies",
        variant: "destructive",
      });
    } finally {
      setIsLoadingReplies(false);
      console.log("=== FRONTEND: Finished fetchReplies ===");
    }
  };

  const handleSubmitReply = async () => {
    console.log("=== FRONTEND: Starting handleSubmitReply ===");
    console.log("Reply text:", replyText);
    console.log("Current user:", currentUser);
    console.log("Review ID:", id);

    if (!replyText.trim() || !currentUser) {
      console.log("Validation failed - empty text or no user");
      return;
    }

    setIsSubmittingReply(true);
    try {
      console.log(
        "Submitting reply for review ID:",
        id,
        "with text:",
        replyText.trim()
      );
      const requestData = { reply: replyText.trim() };
      console.log("Request data:", requestData);

      const response = await apiRequest(
        "POST",
        `/api/reviews/${id}/replies`,
        requestData
      );
      console.log("Response received:", response);
      console.log("Response status:", response.status);

      const responseData = await response.json();
      console.log("Reply submitted successfully:", responseData);
      console.log("Response data type:", typeof responseData);
      console.log("Response data keys:", Object.keys(responseData || {}));

      toast({
        title: "Reply submitted",
        description: "Your reply has been added successfully",
      });

      setReplyText("");
      setShowReplyForm(false);

      // Add the new reply to the current replies array immediately
      if (responseData && responseData.user) {
        console.log("Adding reply to state immediately:", responseData);
        setReplies((prevReplies) => {
          const newReplies = [...prevReplies, responseData];
          console.log("Updated replies array:", newReplies);
          return newReplies;
        });
      } else {
        console.log("No user data in response, skipping immediate update");
      }

      // Also fetch fresh data to ensure consistency
      console.log("Fetching fresh replies data...");
      fetchReplies();
    } catch (error: any) {
      console.error("Error submitting reply:", error);
      console.error("Error details:", {
        name: error.name,
        message: error.message,
        stack: error.stack,
      });
      toast({
        title: "Error",
        description: error.message || "Failed to submit reply",
        variant: "destructive",
      });
    } finally {
      setIsSubmittingReply(false);
      console.log("=== FRONTEND: Finished handleSubmitReply ===");
    }
  };

  const toggleReplies = () => {
    console.log("=== FRONTEND: toggleReplies called ===");
    console.log("Current showReplies state:", showReplies);
    console.log("Current replies count:", replies.length);

    if (!showReplies) {
      console.log("Expanding replies section, fetching fresh data...");
      // Always fetch fresh data when expanding
      fetchReplies();
    } else {
      console.log("Collapsing replies section");
    }

    setShowReplies(!showReplies);
    console.log("New showReplies state will be:", !showReplies);
  };

  // Check if current user can reply to this review
  const canReply = React.useMemo(() => {
    if (!currentUser) return false;

    // Only sellers and admins can reply
    if (
      currentUser.role !== "seller" &&
      currentUser.role !== "admin" &&
      !currentUser.isCoAdmin
    ) {
      return false;
    }

    // Admins can reply to any review
    if (currentUser.role === "admin" || currentUser.isCoAdmin) {
      return true;
    }

    // Sellers can only reply to reviews of their own products
    // This will be checked on the backend, but we can show a hint here
    return currentUser.role === "seller";
  }, [currentUser]);

  // Load replies on component mount if there are any
  React.useEffect(() => {
    // We'll load replies when the user clicks "Show Replies"
  }, []);

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
                <div className="font-medium flex items-center gap-2">
                  {user.username}
                  {(user.role === "seller" ||
                    user.role === "admin" ||
                    user.isCoAdmin) && (
                    <Badge
                      variant="secondary"
                      className={`text-xs ${
                        user.role === "admin" || user.isCoAdmin
                          ? "bg-red-100 text-red-700 border-red-200"
                          : "bg-blue-100 text-blue-700 border-blue-200"
                      }`}
                    >
                      {user.role === "admin" || user.isCoAdmin
                        ? "Admin"
                        : "Seller"}
                    </Badge>
                  )}
                </div>
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

              {/* Reply button - only for sellers and admins */}
              {canReply && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowReplyForm(!showReplyForm)}
                  className="h-8 px-3"
                >
                  <MessageSquare className="h-4 w-4 mr-1" />
                  Reply
                </Button>
              )}
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

          {/* Reply form */}
          {showReplyForm && canReply && (
            <div className="mt-4 p-4 border rounded-lg bg-gray-50">
              <div className="mb-3">
                <h4 className="font-medium text-sm text-gray-700 mb-2">
                  {currentUser?.role === "admin" || currentUser?.isCoAdmin
                    ? "Admin Reply"
                    : "Seller Reply"}
                </h4>
                {currentUser?.role === "seller" && (
                  <p className="text-xs text-gray-600 mb-2">
                    You can only reply to reviews for your own products.
                  </p>
                )}
              </div>
              <Textarea
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Write your reply..."
                className="mb-3"
                rows={3}
              />
              <div className="flex gap-2">
                <Button
                  onClick={handleSubmitReply}
                  disabled={isSubmittingReply || !replyText.trim()}
                  size="sm"
                >
                  {isSubmittingReply ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    "Submit Reply"
                  )}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setShowReplyForm(false);
                    setReplyText("");
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {/* Show replies button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleReplies}
            className="mt-2 text-blue-600 hover:text-blue-800"
            disabled={isLoadingReplies}
          >
            {isLoadingReplies ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Loading...
              </>
            ) : (
              <>
                {showReplies ? (
                  <>
                    <ChevronUp className="h-4 w-4 mr-1" />
                    Hide Replies
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-4 w-4 mr-1" />
                    Show Replies ({replies.length})
                  </>
                )}
              </>
            )}
          </Button>

          {/* Replies section */}
          {showReplies && (
            <div className="mt-4 space-y-3">
              <h4 className="font-medium text-sm text-gray-700 flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                Replies ({replies.length})
              </h4>
              {isLoadingReplies ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-6 w-6 animate-spin" />
                  <span className="ml-2 text-sm text-gray-600">
                    Loading replies...
                  </span>
                </div>
              ) : replies.length > 0 ? (
                replies.map((reply) => (
                  <div
                    key={reply.id}
                    className="ml-4 p-3 border-l-2 border-gray-200 bg-gray-50 rounded-r-lg"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <Avatar className="h-6 w-6">
                        <AvatarImage
                          src={reply.user.avatar}
                          alt={reply.user.username}
                        />
                        <AvatarFallback className="text-xs">
                          {reply.user.username.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-medium text-sm">
                        {reply.user.username}
                      </span>
                      {(reply.user.role === "seller" ||
                        reply.user.role === "admin" ||
                        reply.user.isCoAdmin) && (
                        <Badge
                          variant="secondary"
                          className={`text-xs ${
                            reply.user.role === "admin" || reply.user.isCoAdmin
                              ? "bg-red-100 text-red-700 border-red-200"
                              : "bg-blue-100 text-blue-700 border-blue-200"
                          }`}
                        >
                          {reply.user.role === "admin" || reply.user.isCoAdmin
                            ? "Admin"
                            : "Seller"}
                        </Badge>
                      )}
                      <span className="text-xs text-gray-500">
                        {format(new Date(reply.createdAt), "MMM dd, yyyy")}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700">{reply.reply}</p>
                  </div>
                ))
              ) : (
                <div className="text-sm text-gray-500 text-center py-4">
                  No replies yet.
                </div>
              )}
            </div>
          )}
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
