import { useEffect, useState } from "react";

interface PerformanceMetrics {
  imagesLoaded: number;
  totalImages: number;
  averageLoadTime: number;
  cacheHitRate: number;
}

interface PerformanceMonitorProps {
  onMetricsUpdate?: (metrics: PerformanceMetrics) => void;
  showDebugInfo?: boolean;
}

export function PerformanceMonitor({
  onMetricsUpdate,
  showDebugInfo = process.env.NODE_ENV === "development",
}: PerformanceMonitorProps) {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    imagesLoaded: 0,
    totalImages: 0,
    averageLoadTime: 0,
    cacheHitRate: 0,
  });

  useEffect(() => {
    if (!showDebugInfo) return;

    // Monitor image loading performance
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      let totalLoadTime = 0;
      let loadedImages = 0;

      entries.forEach((entry) => {
        if (entry.entryType === "resource" && entry.name.includes("image")) {
          totalLoadTime += entry.duration;
          loadedImages++;
        }
      });

      if (loadedImages > 0) {
        const newMetrics = {
          imagesLoaded: loadedImages,
          totalImages: document.images.length,
          averageLoadTime: totalLoadTime / loadedImages,
          cacheHitRate: calculateCacheHitRate(),
        };

        setMetrics(newMetrics);
        onMetricsUpdate?.(newMetrics);
      }
    });

    observer.observe({ entryTypes: ["resource"] });

    return () => observer.disconnect();
  }, [showDebugInfo, onMetricsUpdate]);

  const calculateCacheHitRate = (): number => {
    // This is a simplified cache hit rate calculation
    // In a real implementation, you'd track actual cache hits
    const totalRequests = document.images.length;
    const cachedImages = Array.from(document.images).filter(
      (img) => img.complete && img.naturalWidth > 0
    ).length;

    return totalRequests > 0 ? (cachedImages / totalRequests) * 100 : 0;
  };

  if (!showDebugInfo) return null;

  return (
    <div className="fixed bottom-4 right-4 bg-black/80 text-white p-4 rounded-lg text-xs z-50">
      <h3 className="font-bold mb-2">Image Performance</h3>
      <div className="space-y-1">
        <div>
          Loaded: {metrics.imagesLoaded}/{metrics.totalImages}
        </div>
        <div>Avg Load Time: {metrics.averageLoadTime.toFixed(2)}ms</div>
        <div>Cache Hit Rate: {metrics.cacheHitRate.toFixed(1)}%</div>
      </div>
    </div>
  );
}
