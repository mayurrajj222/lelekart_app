import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { insertReviewSchema } from "@shared/schema";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Loader2, Upload, X } from "lucide-react";
import { FileUpload } from "@/components/ui/file-upload";

interface ReviewFormProps {
  productId: number;
  onSuccess?: () => void;
}

// Extend schema for client-side validation
const reviewFormSchema = z.object({
  rating: z.number().min(1).max(5),
  title: z.string().max(100).optional(),
  review: z.string().max(1000).optional(),
  images: z.array(z.string()).optional(),
});

type ReviewFormValues = z.infer<typeof reviewFormSchema>;

const StarRatingInput = ({
  value,
  onChange,
}: {
  value: number;
  onChange: (value: number) => void;
}) => {
  const [hoverRating, setHoverRating] = useState(0);

  return (
    <div className="flex">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          type="button"
          key={star}
          onClick={() => onChange(star)}
          onMouseEnter={() => setHoverRating(star)}
          onMouseLeave={() => setHoverRating(0)}
          className="focus:outline-none"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className={`h-8 w-8 ${
              star <= (hoverRating || value)
                ? "text-yellow-400"
                : "text-gray-300"
            } transition-colors duration-150`}
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M10 15.934l-6.18 3.249 1.18-6.889L.083 7.514l6.91-1.004L10 0l3.008 6.51 6.909 1.004-4.917 4.78 1.18 6.89z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      ))}
    </div>
  );
};

const ReviewForm: React.FC<ReviewFormProps> = ({ productId, onSuccess }) => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [newImageUrl, setNewImageUrl] = useState("");
  const [uploadedImageUrls, setUploadedImageUrls] = useState<string[]>([]);

  const form = useForm<ReviewFormValues>({
    resolver: zodResolver(reviewFormSchema),
    defaultValues: {
      rating: 5,
      title: "",
      review: "",
      images: [],
    },
  });

  const addImageUrl = () => {
    if (!newImageUrl) return;
    if (imageUrls.includes(newImageUrl)) {
      toast({
        title: "Duplicate image",
        description: "This image URL is already added",
        variant: "destructive",
      });
      return;
    }

    setImageUrls([...imageUrls, newImageUrl]);
    setNewImageUrl("");
  };

  const allImageUrls = [...uploadedImageUrls, ...imageUrls];

  const removeImage = (url: string) => {
    setImageUrls((prev) => prev.filter((imageUrl) => imageUrl !== url));
    setUploadedImageUrls((prev) => prev.filter((imageUrl) => imageUrl !== url));
  };

  const onSubmit = async (data: ReviewFormValues) => {
    setIsSubmitting(true);
    try {
      const reviewData = {
        ...data,
        images: allImageUrls,
      };

      await apiRequest(
        "POST",
        `/api/products/${productId}/reviews`,
        reviewData
      );

      toast({
        title: "Review submitted",
        description:
          "Thank you for your review! You earned 50 reward points for writing this review.",
      });

      // Reset form
      form.reset();
      setImageUrls([]);
      setUploadedImageUrls([]);

      // Invalidate queries to refresh reviews
      queryClient.invalidateQueries({ queryKey: ["productReviews"] });
      queryClient.invalidateQueries({
        queryKey: [`product_${productId}_rating`],
      });

      if (onSuccess) onSuccess();
    } catch (error) {
      console.error("Error submitting review:", error);
      toast({
        title: "Error",
        description: "Failed to submit review. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <Card>
          <CardHeader>
            <CardTitle>Write a Review</CardTitle>
          </CardHeader>
          <CardContent className="max-h-[60vh] overflow-y-auto p-6">
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="rating"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Rating</FormLabel>
                    <FormControl>
                      <StarRatingInput
                        value={field.value}
                        onChange={field.onChange}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Review Title</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Summarize your experience"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="review"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Your Review</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="What did you like or dislike about this product?"
                        className="min-h-[120px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="space-y-2">
                <FormLabel>Add Images (Optional)</FormLabel>
                {/* File upload option */}
                <FileUpload
                  onChange={(urls) => {
                    const urlArray = Array.isArray(urls)
                      ? urls
                      : urls
                        ? [urls]
                        : [];
                    setUploadedImageUrls(urlArray);
                  }}
                  value={
                    uploadedImageUrls.length > 0 ? uploadedImageUrls : undefined
                  }
                  multiple
                  showMediaLibrary
                  label="Upload or select images"
                />
                {/* URL input option */}
                <div className="flex gap-2 mt-2">
                  <Input
                    placeholder="Enter image URL"
                    value={newImageUrl}
                    onChange={(e) => setNewImageUrl(e.target.value)}
                    className="flex-1"
                  />
                  <Button type="button" onClick={addImageUrl} variant="outline">
                    <Upload className="h-4 w-4 mr-1" />
                    Add
                  </Button>
                </div>
                <FormDescription>
                  Add image URLs or upload images to include photos with your
                  review
                </FormDescription>
                {/* Preview all images (uploaded + URLs) */}
                {allImageUrls.length > 0 && (
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2 mt-2">
                    {allImageUrls.map((url, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={url}
                          alt={`Review image ${index + 1}`}
                          className="h-24 w-full object-cover rounded-md"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = "/images/placeholder.svg";
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => removeImage(url)}
                          className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                          aria-label="Remove image"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
          <CardFooter className="pt-6">
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                "Submit Review"
              )}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </Form>
  );
};

export default ReviewForm;
