import { Skeleton } from "./skeleton";

interface LazyLoadingFallbackProps {
  variant?: "grid" | "list" | "cards";
  count?: number;
  className?: string;
}

export function LazyLoadingFallback({
  variant = "grid",
  count = 6,
  className = "",
}: LazyLoadingFallbackProps) {
  if (variant === "grid") {
    return (
      <div className={`grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4 ${className}`}>
        {[...Array(count)].map((_, i) => (
          <div key={i} className="flex flex-col items-center">
            <Skeleton className="h-32 w-28 mb-2" />
            <Skeleton className="h-4 w-24 mb-2" />
            <Skeleton className="h-3 w-16" />
          </div>
        ))}
      </div>
    );
  }

  if (variant === "list") {
    return (
      <div className={`space-y-4 ${className}`}>
        {[...Array(count)].map((_, i) => (
          <div key={i} className="flex items-center space-x-4">
            <Skeleton className="h-12 w-12 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-[250px]" />
              <Skeleton className="h-4 w-[200px]" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (variant === "cards") {
    return (
      <div className={`grid grid-cols-1 md:grid-cols-3 gap-6 ${className}`}>
        {[...Array(count)].map((_, i) => (
          <div key={i} className="bg-[#F8F5E4] rounded-2xl p-4 border border-[#e0c9a6] shadow-md">
            <Skeleton className="h-6 w-32 mb-4" />
            <div className="grid grid-cols-2 gap-2">
              {[...Array(4)].map((_, j) => (
                <div key={j} className="flex flex-col items-center">
                  <Skeleton className="h-32 w-28 mb-2" />
                  <Skeleton className="h-4 w-24 mb-2" />
                  <Skeleton className="h-3 w-16" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  return null;
}
