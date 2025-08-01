import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
import { Product } from "@shared/schema";

interface VirtualScrollProps {
  items: Product[];
  itemHeight: number;
  containerHeight: number;
  renderItem: (item: Product, index: number) => React.ReactNode;
  overscan?: number;
  className?: string;
}

export function VirtualScroll({
  items,
  itemHeight,
  containerHeight,
  renderItem,
  overscan = 5,
  className = "",
}: VirtualScrollProps) {
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Calculate visible range
  const visibleRange = useMemo(() => {
    const start = Math.floor(scrollTop / itemHeight);
    const end = Math.min(
      start + Math.ceil(containerHeight / itemHeight) + overscan,
      items.length
    );
    const startWithOverscan = Math.max(0, start - overscan);

    return {
      start: startWithOverscan,
      end,
      startOffset: startWithOverscan * itemHeight,
    };
  }, [scrollTop, itemHeight, containerHeight, items.length, overscan]);

  // Handle scroll
  const handleScroll = useCallback((event: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(event.currentTarget.scrollTop);
  }, []);

  // Scroll to top when items change
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = 0;
      setScrollTop(0);
    }
  }, [items]);

  const totalHeight = items.length * itemHeight;

  return (
    <div
      ref={containerRef}
      className={`overflow-auto ${className}`}
      style={{ height: containerHeight }}
      onScroll={handleScroll}
    >
      <div style={{ height: totalHeight, position: "relative" }}>
        <div
          style={{
            position: "absolute",
            top: visibleRange.startOffset,
            left: 0,
            right: 0,
          }}
        >
          {items
            .slice(visibleRange.start, visibleRange.end)
            .map((item, index) => {
              const actualIndex = visibleRange.start + index;
              return (
                <div
                  key={item.id || actualIndex}
                  style={{ height: itemHeight }}
                >
                  {renderItem(item, actualIndex)}
                </div>
              );
            })}
        </div>
      </div>
    </div>
  );
}

// Hook for managing virtual scroll state
export function useVirtualScroll<T>(
  items: T[],
  itemHeight: number,
  containerHeight: number,
  overscan: number = 5
) {
  const [scrollTop, setScrollTop] = useState(0);

  const visibleRange = useMemo(() => {
    const start = Math.floor(scrollTop / itemHeight);
    const end = Math.min(
      start + Math.ceil(containerHeight / itemHeight) + overscan,
      items.length
    );
    const startWithOverscan = Math.max(0, start - overscan);

    return {
      start: startWithOverscan,
      end,
      startOffset: startWithOverscan * itemHeight,
    };
  }, [scrollTop, itemHeight, containerHeight, items.length, overscan]);

  const handleScroll = useCallback((event: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(event.currentTarget.scrollTop);
  }, []);

  const scrollToTop = useCallback(() => {
    setScrollTop(0);
  }, []);

  const scrollToIndex = useCallback(
    (index: number) => {
      setScrollTop(index * itemHeight);
    },
    [itemHeight]
  );

  return {
    scrollTop,
    visibleRange,
    handleScroll,
    scrollToTop,
    scrollToIndex,
  };
}
