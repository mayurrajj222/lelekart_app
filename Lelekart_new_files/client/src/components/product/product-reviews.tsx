import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { User, Review, ReviewImage } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import ProductReview from "./product-review";
import ReviewForm from "./review-form";
import RatingSummary from "./rating-summary";

interface ProductReviewsProps {
  productId: number;
}

type ReviewWithUserAndImages = Review & {
  user: User;
  images?: ReviewImage[];
  isHelpful?: boolean;
};

const ProductReviews: React.FC<ProductReviewsProps> = ({ productId }) => {
  const { user } = useAuth();
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);

  const {
    data: reviews,
    isLoading,
    error,
    refetch,
  } = useQuery<ReviewWithUserAndImages[]>({
    queryKey: ["productReviews", productId],
    queryFn: async () => {
      const response = await fetch(`/api/products/${productId}/reviews`);
      if (!response.ok) {
        throw new Error("Failed to fetch reviews");
      }
      return response.json();
    },
  });

  const { data: userHelpfulStatuses, isLoading: isHelpfulStatusesLoading } =
    useQuery<Record<number, boolean>>({
      queryKey: ["reviewHelpfulStatuses", productId],
      queryFn: async () => {
        if (!user) return {};

        // If user is logged in, check which reviews they've marked as helpful
        const helpfulStatuses: Record<number, boolean> = {};

        if (reviews && reviews.length > 0) {
          // We need to check each review individually
          await Promise.all(
            reviews.map(async (review) => {
              try {
                const response = await fetch(
                  `/api/reviews/${review.id}/helpful`
                );
                if (response.ok) {
                  const { isHelpful } = await response.json();
                  helpfulStatuses[review.id] = isHelpful;
                }
              } catch (error) {
                console.error(
                  `Error checking helpful status for review ${review.id}:`,
                  error
                );
              }
            })
          );
        }

        return helpfulStatuses;
      },
      enabled: !!user && !!reviews && reviews.length > 0,
    });

  const userHasReviewed =
    reviews?.some((review) => review.userId === user?.id) || false;

  // Merge reviews with helpful status
  const reviewsWithHelpfulStatus = React.useMemo(() => {
    if (!reviews) return [];

    return reviews.map((review) => ({
      ...review,
      isHelpful: userHelpfulStatuses?.[review.id] || false,
    }));
  }, [reviews, userHelpfulStatuses]);

  const allReviews = reviewsWithHelpfulStatus;
  const verifiedReviews = reviewsWithHelpfulStatus.filter(
    (review) => review.verifiedPurchase
  );

  const handleReviewSubmitSuccess = () => {
    setReviewDialogOpen(false);
    refetch();
  };

  return (
    <div className="mt-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4">
        <h2 className="text-2xl font-bold">Customer Reviews</h2>

        {user && !userHasReviewed && (
          <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
            <DialogTrigger asChild>
              <Button className="mt-2 md:mt-0">
                <Plus className="h-4 w-4 mr-1" />
                Write a Review
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-xl">
              <ReviewForm
                productId={productId}
                onSuccess={handleReviewSubmitSuccess}
              />
            </DialogContent>
          </Dialog>
        )}
      </div>

      <RatingSummary productId={productId} />

      {isLoading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : error ? (
        <Alert variant="destructive" className="mt-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Failed to load reviews</AlertDescription>
        </Alert>
      ) : reviewsWithHelpfulStatus.length === 0 ? (
        <div className="text-center py-8 border rounded-md bg-gray-50">
          <p className="text-muted-foreground mb-2">No reviews yet</p>
          {user && !userHasReviewed && (
            <p className="text-sm">Be the first to review this product!</p>
          )}
        </div>
      ) : (
        <Tabs defaultValue="all" className="mt-6">
          <TabsList>
            <TabsTrigger value="all">
              All Reviews ({allReviews.length})
            </TabsTrigger>
            {verifiedReviews.length > 0 && (
              <TabsTrigger value="verified">
                Verified Purchases ({verifiedReviews.length})
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="all" className="mt-4">
            <div className="space-y-4">
              {allReviews.map((review) => (
                <ProductReview
                  key={review.id}
                  id={review.id}
                  title={review.title}
                  review={review.review}
                  rating={review.rating}
                  verifiedPurchase={review.verifiedPurchase}
                  helpfulCount={review.helpfulCount}
                  createdAt={new Date(review.createdAt)}
                  user={review.user}
                  images={review.images}
                  isHelpful={review.isHelpful}
                  onDelete={refetch}
                  onEdit={refetch}
                />
              ))}
            </div>
          </TabsContent>

          {verifiedReviews.length > 0 && (
            <TabsContent value="verified" className="mt-4">
              <div className="space-y-4">
                {verifiedReviews.map((review) => (
                  <ProductReview
                    key={review.id}
                    id={review.id}
                    title={review.title}
                    review={review.review}
                    rating={review.rating}
                    verifiedPurchase={review.verifiedPurchase}
                    helpfulCount={review.helpfulCount}
                    createdAt={new Date(review.createdAt)}
                    user={review.user}
                    images={review.images}
                    isHelpful={review.isHelpful}
                    onDelete={refetch}
                    onEdit={refetch}
                  />
                ))}
              </div>
            </TabsContent>
          )}
        </Tabs>
      )}
    </div>
  );
};

export default ProductReviews;
