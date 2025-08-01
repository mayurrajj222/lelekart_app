import React from 'react';
import { Progress } from '@/components/ui/progress';
import { useQuery } from '@tanstack/react-query';

interface RatingSummaryProps {
  productId: number;
}

interface RatingSummary {
  averageRating: number;
  totalReviews: number;
  ratingCounts: { rating: number; count: number }[];
}

const StarRating = ({ rating }: { rating: number }) => {
  return (
    <div className="flex">
      {[1, 2, 3, 4, 5].map((star) => (
        <svg
          key={star}
          xmlns="http://www.w3.org/2000/svg"
          className={`h-5 w-5 ${
            star <= rating ? 'text-yellow-400' : 'text-gray-300'
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

const RatingSummary: React.FC<RatingSummaryProps> = ({ productId }) => {
  const { data, isLoading, error } = useQuery<RatingSummary>({
    queryKey: [`product_${productId}_rating`],
    queryFn: async () => {
      const response = await fetch(`/api/products/${productId}/rating`);
      if (!response.ok) {
        throw new Error('Failed to fetch rating summary');
      }
      return response.json();
    },
  });
  
  if (isLoading) {
    return (
      <div className="animate-pulse">
        <div className="h-20 bg-gray-200 rounded-md mb-4"></div>
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center space-x-2">
              <div className="w-12 h-5 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded flex-1"></div>
              <div className="w-8 h-5 bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }
  
  if (error || !data) {
    return <div className="text-red-500">Failed to load ratings</div>;
  }
  
  const { averageRating, totalReviews, ratingCounts } = data;
  
  // Create a map for all ratings, including those with 0 count
  const ratingsMap = new Map<number, number>();
  for (let i = 5; i >= 1; i--) {
    ratingsMap.set(i, 0);
  }
  
  // Update the map with actual counts
  ratingCounts.forEach(({ rating, count }) => {
    ratingsMap.set(rating, count);
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-center gap-4 pb-4 border-b">
        <div className="text-center sm:text-left">
          <div className="text-4xl font-bold">{averageRating.toFixed(1)}</div>
          <div className="flex justify-center sm:justify-start mt-1">
            <StarRating rating={Math.round(averageRating)} />
          </div>
          <div className="text-sm text-muted-foreground mt-1">
            {totalReviews} {totalReviews === 1 ? 'review' : 'reviews'}
          </div>
        </div>
        
        <div className="flex-1 w-full">
          {Array.from(ratingsMap.entries())
            .sort((a, b) => b[0] - a[0]) // Sort by rating (5 -> 1)
            .map(([rating, count]) => {
              const percentage = totalReviews > 0 ? (count / totalReviews) * 100 : 0;
              
              return (
                <div key={rating} className="flex items-center space-x-2 mb-1">
                  <div className="w-12 text-sm">{rating} stars</div>
                  <Progress value={percentage} className="h-2.5 flex-1" />
                  <div className="text-xs w-8 text-right">{count}</div>
                </div>
              );
            })}
        </div>
      </div>
    </div>
  );
};

export default RatingSummary;