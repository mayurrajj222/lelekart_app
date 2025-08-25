import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link, useLocation } from "wouter";

export default function RecentlyViewedPage() {
  const [recentlyViewed, setRecentlyViewed] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [, setLocation] = useLocation();

  useEffect(() => {
    async function fetchRecentlyViewed() {
      setLoading(true);
      try {
        const ids = JSON.parse(localStorage.getItem("recently_viewed_products") || "[]");
        console.log("[RecentlyViewedPage] ids from localStorage:", ids);
        if (!Array.isArray(ids) || ids.length === 0) {
          setRecentlyViewed([]);
          setLoading(false);
          return;
        }
        const res = await fetch(`/api/products?ids=${ids.join(",")}`);
        if (!res.ok) throw new Error("Failed to fetch products");
        const data = await res.json();
        console.log("[RecentlyViewedPage] API response data:", data);
        // Keep the order as in ids
        const ordered = ids.map((id: number) => (data.products || []).find((p: any) => p.id === id)).filter(Boolean);
        setRecentlyViewed(ordered);
      } catch (e) {
        setRecentlyViewed([]);
      } finally {
        setLoading(false);
      }
    }
    fetchRecentlyViewed();
  }, []);

  return (
    <div className="min-h-screen bg-[#F8F5E4]">
      <div className="container mx-auto py-6 px-4">
        <Button variant="outline" className="mb-4" onClick={() => setLocation("/buyer/dashboard")}>Back to Dashboard</Button>
        <Card className="shadow-sm bg-[#F8F5E4]">
          <CardHeader className="pb-3">
            <CardTitle>All Recently Viewed Products</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8 text-center flex-col">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-3"></div>
                <h3 className="text-sm font-medium">Loading recently viewed products...</h3>
              </div>
            ) : recentlyViewed.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
                {recentlyViewed.map((product: any) => (
                  <div key={product.id} className="flex flex-col items-center border rounded-md p-2">
                    <Link href={`/product/${product.id}`} className="block w-full">
                      <img src={product.imageUrl || (product.images && JSON.parse(product.images)[0]) || 'https://via.placeholder.com/100?text=Product'} alt={product.name} className="w-20 h-20 object-cover rounded mb-2 mx-auto" />
                      <div className="text-xs font-medium text-center line-clamp-2">{product.name}</div>
                    </Link>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center py-8 text-center flex-col">
                <h3 className="text-sm font-medium">No recently viewed products</h3>
                <p className="text-xs text-muted-foreground mt-1">Products you view will appear here</p>
                <Button variant="link" size="sm" className="mt-2" asChild>
                  <Link href="/">Browse Products</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 