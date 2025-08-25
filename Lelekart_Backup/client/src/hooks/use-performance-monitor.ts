import { useEffect, useRef, useCallback } from "react";

interface PerformanceMetrics {
  initialLoadTime: number;
  sectionLoadTimes: Record<string, number>;
  apiCallTimes: Record<string, number>;
  totalProductsLoaded: number;
  averageLoadTime: number;
}

interface UsePerformanceMonitorOptions {
  onMetricsUpdate?: (metrics: PerformanceMetrics) => void;
  enableLogging?: boolean;
}

export function usePerformanceMonitor(
  options: UsePerformanceMonitorOptions = {}
) {
  const { onMetricsUpdate, enableLogging = false } = options;
  const metricsRef = useRef<PerformanceMetrics>({
    initialLoadTime: 0,
    sectionLoadTimes: {},
    apiCallTimes: {},
    totalProductsLoaded: 0,
    averageLoadTime: 0,
  });
  const startTimeRef = useRef<number>(Date.now());
  const timersRef = useRef<Record<string, number>>({});

  // Start timing a section or API call
  const startTimer = useCallback(
    (name: string) => {
      timersRef.current[name] = Date.now();
      if (enableLogging) {
        console.log(`🚀 Started timing: ${name}`);
      }
    },
    [enableLogging]
  );

  // End timing and record the result
  const endTimer = useCallback(
    (name: string, additionalData?: any) => {
      const startTime = timersRef.current[name];
      if (startTime) {
        const duration = Date.now() - startTime;

        if (name.startsWith("api:")) {
          metricsRef.current.apiCallTimes[name] = duration;
        } else {
          metricsRef.current.sectionLoadTimes[name] = duration;
        }

        if (enableLogging) {
          console.log(`⏱️ ${name}: ${duration}ms`, additionalData);
        }

        // Calculate average load time
        const allTimes = [
          ...Object.values(metricsRef.current.sectionLoadTimes),
          ...Object.values(metricsRef.current.apiCallTimes),
        ];
        metricsRef.current.averageLoadTime =
          allTimes.reduce((a, b) => a + b, 0) / allTimes.length;

        // Notify parent component
        onMetricsUpdate?.(metricsRef.current);
      }
    },
    [enableLogging, onMetricsUpdate]
  );

  // Record initial load time
  const recordInitialLoad = useCallback(() => {
    const initialLoadTime = Date.now() - startTimeRef.current;
    metricsRef.current.initialLoadTime = initialLoadTime;

    if (enableLogging) {
      console.log(`🎯 Initial page load: ${initialLoadTime}ms`);
    }

    onMetricsUpdate?.(metricsRef.current);
  }, [enableLogging, onMetricsUpdate]);

  // Record products loaded
  const recordProductsLoaded = useCallback(
    (count: number) => {
      metricsRef.current.totalProductsLoaded += count;

      if (enableLogging) {
        console.log(
          `📦 Products loaded: ${count} (Total: ${metricsRef.current.totalProductsLoaded})`
        );
      }

      onMetricsUpdate?.(metricsRef.current);
    },
    [enableLogging, onMetricsUpdate]
  );

  // Get current metrics
  const getMetrics = useCallback(() => {
    return { ...metricsRef.current };
  }, []);

  // Reset metrics
  const resetMetrics = useCallback(() => {
    metricsRef.current = {
      initialLoadTime: 0,
      sectionLoadTimes: {},
      apiCallTimes: {},
      totalProductsLoaded: 0,
      averageLoadTime: 0,
    };
    startTimeRef.current = Date.now();
    timersRef.current = {};
  }, []);

  // Auto-record initial load when component mounts
  useEffect(() => {
    const timer = setTimeout(recordInitialLoad, 100);
    return () => clearTimeout(timer);
  }, [recordInitialLoad]);

  return {
    startTimer,
    endTimer,
    recordInitialLoad,
    recordProductsLoaded,
    getMetrics,
    resetMetrics,
  };
}

// Hook for monitoring specific API calls
export function useApiPerformanceMonitor(apiName: string) {
  const { startTimer, endTimer } = usePerformanceMonitor({
    enableLogging: true,
  });

  const monitorApiCall = useCallback(
    async <T>(apiCall: () => Promise<T>): Promise<T> => {
      const timerName = `api:${apiName}`;
      startTimer(timerName);

      try {
        const result = await apiCall();
        endTimer(timerName, { success: true });
        return result;
      } catch (error) {
        endTimer(timerName, { success: false, error });
        throw error;
      }
    },
    [apiName, startTimer, endTimer]
  );

  return { monitorApiCall };
}

// Hook for monitoring section loading
export function useSectionPerformanceMonitor(sectionName: string) {
  const { startTimer, endTimer } = usePerformanceMonitor({
    enableLogging: true,
  });

  const monitorSection = useCallback(
    (sectionContent: React.ReactNode) => {
      startTimer(`section:${sectionName}`);

      // Use a timeout to simulate the section being rendered
      setTimeout(() => {
        endTimer(`section:${sectionName}`, { content: "rendered" });
      }, 0);

      return sectionContent;
    },
    [sectionName, startTimer, endTimer]
  );

  return { monitorSection };
}
