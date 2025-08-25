import React, {
  useState,
  useEffect,
  useRef,
  ReactNode,
  useCallback,
} from "react";
import { Loader2 } from "lucide-react";

interface InfiniteScrollProps {
  children: ReactNode;
  hasMore: boolean;
  isLoading: boolean;
  onLoadMore: () => void;
  threshold?: number;
  rootMargin?: string;
  className?: string;
}

export function InfiniteScroll({
  children,
  hasMore,
  isLoading,
  onLoadMore,
  threshold = 0.1,
  rootMargin = "100px",
  className = "",
}: InfiniteScrollProps) {
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadingRef = useRef<HTMLDivElement>(null);

  const handleLoadMore = useCallback(() => {
    if (!isLoading && hasMore) {
      onLoadMore();
    }
  }, [isLoading, hasMore, onLoadMore]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && hasMore && !isLoading) {
            setTimeout(() => {
              handleLoadMore();
            }, 100);
          }
        });
      },
      {
        threshold,
        rootMargin,
      }
    );

    observerRef.current = observer;

    if (loadingRef.current) {
      observer.observe(loadingRef.current);
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [hasMore, isLoading, threshold, rootMargin, handleLoadMore]);

  return (
    <div className={className}>
      {children}

      {hasMore && (
        <div ref={loadingRef} className="flex justify-center items-center py-8">
          {isLoading ? (
            <div className="flex items-center gap-2">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span className="text-sm text-gray-600">
                Loading more products...
              </span>
            </div>
          ) : (
            <div className="h-8" /> // Invisible spacer to trigger intersection
          )}
        </div>
      )}

      {!hasMore && (
        <div className="text-center py-8">
          <p className="text-sm text-gray-500">
            You've reached the end of the products
          </p>
        </div>
      )}
    </div>
  );
}
