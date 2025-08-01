import { useEffect } from "react";
import { useLocation } from "wouter";
import { fbq } from "../lib/metaPixel";

export function useMetaPixelPageView() {
  const [location] = useLocation();
  useEffect(() => {
    fbq("track", "PageView");
  }, [location]);
}
