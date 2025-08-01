import React, { useState } from "react";
import { useLocation } from "wouter";
import { Search, AlertTriangle, X } from "lucide-react";
import { ProductCard } from "@/components/ui/product-card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { SimplifiedSearchResults } from "@/components/search/simplified-search-results";
import { searchProducts } from "@/services/simplified-search-service";
import { Product } from "@shared/schema";
import { Helmet } from "react-helmet-async";

export default function SearchResultsPage() {
  // Use state to track current URL parameters to ensure component re-renders
  // when the URL changes but the component doesn't remount
  const [urlParams, setUrlParams] = useState(
    () => new URLSearchParams(window.location.search)
  );

  // Update URL parameters when component mounts or URL changes
  React.useEffect(() => {
    const handleUrlChange = () => {
      setUrlParams(new URLSearchParams(window.location.search));
    };

    // Set up the initial parameters
    handleUrlChange();

    // Listen for URL changes
    window.addEventListener("popstate", handleUrlChange);

    // Clean up
    return () => {
      window.removeEventListener("popstate", handleUrlChange);
    };
  }, []);

  // Get search parameters from URL params state variable
  const queryParam = urlParams.get("q") || "";
  const categoryParam = urlParams.get("category");
  const minPriceParam = urlParams.get("minPrice");
  const maxPriceParam = urlParams.get("maxPrice");
  const brandParam = urlParams.get("brand");
  const colorParam = urlParams.get("color");
  const sizeParam = urlParams.get("size");
  const sortParam = urlParams.get("sort");

  // Simple search state
  const [isSearching, setIsSearching] = useState(false);

  // Build page title based on search query
  let pageTitle = queryParam
    ? `Search results for "${queryParam}"`
    : "Product Search";

  // Add filter descriptions to title if applicable
  if (categoryParam || brandParam || colorParam || sizeParam) {
    const filters = [];
    if (colorParam) filters.push(`${colorParam}`);
    if (sizeParam) filters.push(`size ${sizeParam}`);
    if (brandParam) filters.push(`${brandParam}`);
    if (categoryParam) filters.push(`in ${categoryParam}`);

    if (filters.length > 0) {
      pageTitle = `Search results for ${filters.join(" ")}`;
      if (queryParam) pageTitle += ` matching "${queryParam}"`;
    }
  }

  // Build page title and meta description based on search query
  const metaTitle = queryParam
    ? `Search results for "${queryParam}" | LeleKart`
    : "Product Search | LeleKart";
  const metaDescription = queryParam
    ? `Find products matching '${queryParam}' on LeleKart. Discover the best deals and a wide range of products. Shop for affordable products at LeleKart. Buy online organic and herbal products. Shop now and save more.`
    : "Search for products on LeleKart. Discover the best deals and a wide range of products. Shop for affordable products at LeleKart. Buy online organic and herbal products. Shop now and save more.";
  const metaKeywords = queryParam
    ? `${queryParam}, online shopping, LeleKart, buy online, deals, affordable products, organic products, herbal products, shop now, save more`
    : "online shopping, LeleKart, buy online, deals, affordable products, organic products, herbal products, shop now, save more";

  // Fetch search results using the simplified search function
  const {
    data: results,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["search", queryParam], // queryParam comes from urlParams state, which updates on URL changes
    queryFn: async () => {
      if (!queryParam) return [];

      // Use the full, exact query string the user entered
      const exactQuery = queryParam.trim();
      console.log(
        "SIMPLIFIED SEARCH PAGE - Searching for exact query:",
        exactQuery
      );
      return await searchProducts(exactQuery);
    },
    enabled: !!queryParam,
    refetchOnWindowFocus: false,
    staleTime: 0, // Don't cache results between searches
    refetchOnMount: true, // Always refetch when the component mounts or remounts
    refetchOnReconnect: true, // Refetch when reconnecting after a disconnection
  });

  // Handle search submission
  const handleSearch = (query: string) => {
    console.log("Search submitted for:", query);
    setIsSearching(true);
  };

  // Render loading state
  const renderLoadingState = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {[...Array(8)].map((_, i) => (
        <div key={i} className="rounded-md overflow-hidden shadow-sm">
          <Skeleton className="h-48 w-full" />
          <div className="p-4">
            <Skeleton className="h-6 w-2/3 mb-2" />
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-6 w-1/3" />
          </div>
        </div>
      ))}
    </div>
  );

  // Render error state
  const renderErrorState = () => (
    <div className="bg-yellow-50 border border-yellow-200 rounded-md p-6 text-center">
      <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
      <h3 className="text-xl font-semibold mb-2">Something went wrong</h3>
      <p className="text-gray-600 mb-4">
        We couldn't process your search request. Please try again later.
      </p>
      <Button onClick={() => window.location.reload()}>Try Again</Button>
    </div>
  );

  // Render empty results state
  const renderEmptyState = () => (
    <div className="bg-gray-50 border border-gray-200 rounded-md p-10 text-center">
      <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
      <h3 className="text-xl font-semibold mb-2">No results found</h3>
      <p className="text-gray-600 mb-4">
        We couldn't find any products matching "{queryParam}".
      </p>
      <p className="text-gray-500 text-sm mb-6">
        Try checking your spelling or using more general terms.
      </p>
      <Button onClick={() => (window.location.href = "/")}>Back to Home</Button>
    </div>
  );

  // Render results grid
  const renderResults = () => {
    let sortedResults = results ? [...results] : [];
    if (sortParam && sortedResults.length > 0) {
      if (sortParam === "price_asc") {
        sortedResults.sort((a, b) => (a.price || 0) - (b.price || 0));
      } else if (sortParam === "price_desc") {
        sortedResults.sort((a, b) => (b.price || 0) - (a.price || 0));
      } else if (sortParam === "newest") {
        sortedResults.sort((a, b) => {
          // If createdAt is missing, treat as oldest
          const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return bTime - aTime;
        });
      }
      // else 'relevance' or unknown: do not sort
    }
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {sortedResults.map((product: Product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    );
  };

  // Render main content based on state
  const renderContent = () => {
    if (isLoading) return renderLoadingState();
    if (isError) return renderErrorState();
    if (!results || results.length === 0) return renderEmptyState();
    return renderResults();
  };

  return (
    <>
      <Helmet>
        <title>{metaTitle}</title>
        <meta name="description" content={metaDescription} />
        <meta name="keywords" content={metaKeywords} />
      </Helmet>
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="mb-8">
          <h1 className="text-2xl font-bold mb-4">{pageTitle}</h1>

          <div className="mb-6">
            {/* Search form using simplified component */}
            <SimplifiedSearchResults
              initialQuery={queryParam}
              onSearch={handleSearch}
            />

            {/* Active filters display */}
            {(categoryParam ||
              minPriceParam ||
              maxPriceParam ||
              brandParam ||
              colorParam ||
              sizeParam) && (
              <div className="mt-4 flex flex-wrap gap-2">
                <span className="text-sm text-gray-500 pt-1">
                  Active filters:
                </span>

                {/* Category filter tag */}
                {categoryParam && (
                  <Card className="bg-blue-50 border-blue-200">
                    <CardContent className="py-1 px-3 flex items-center">
                      <span className="text-sm">Category: {categoryParam}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-5 w-5 ml-1 text-gray-500"
                        onClick={() => {
                          const newParams = new URLSearchParams(urlParams);
                          newParams.delete("category");
                          window.location.href = `/search?${newParams.toString()}`;
                        }}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </CardContent>
                  </Card>
                )}

                {/* Color filter tag */}
                {colorParam && (
                  <Card className="bg-blue-50 border-blue-200">
                    <CardContent className="py-1 px-3 flex items-center">
                      <span className="text-sm">Color: {colorParam}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-5 w-5 ml-1 text-gray-500"
                        onClick={() => {
                          const newParams = new URLSearchParams(urlParams);
                          newParams.delete("color");
                          window.location.href = `/search?${newParams.toString()}`;
                        }}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </CardContent>
                  </Card>
                )}

                {/* Brand filter tag */}
                {brandParam && (
                  <Card className="bg-blue-50 border-blue-200">
                    <CardContent className="py-1 px-3 flex items-center">
                      <span className="text-sm">Brand: {brandParam}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-5 w-5 ml-1 text-gray-500"
                        onClick={() => {
                          const newParams = new URLSearchParams(urlParams);
                          newParams.delete("brand");
                          window.location.href = `/search?${newParams.toString()}`;
                        }}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </CardContent>
                  </Card>
                )}

                {/* Price range filter tag */}
                {(minPriceParam || maxPriceParam) && (
                  <Card className="bg-blue-50 border-blue-200">
                    <CardContent className="py-1 px-3 flex items-center">
                      <span className="text-sm">
                        Price: {minPriceParam ? `₹${minPriceParam}` : ""}
                        {minPriceParam && maxPriceParam ? " - " : ""}
                        {maxPriceParam ? `₹${maxPriceParam}` : ""}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-5 w-5 ml-1 text-gray-500"
                        onClick={() => {
                          const newParams = new URLSearchParams(urlParams);
                          newParams.delete("minPrice");
                          newParams.delete("maxPrice");
                          window.location.href = `/search?${newParams.toString()}`;
                        }}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </div>

          {/* Results count and sort options */}
          {results && results.length > 0 && (
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-gray-500">
                Found {results.length} result{results.length !== 1 ? "s" : ""}
              </p>

              {/* Sort options */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">Sort by:</span>
                <select
                  className="text-sm border rounded px-2 py-1"
                  value={sortParam || "relevance"}
                  onChange={(e) => {
                    const newParams = new URLSearchParams(urlParams);
                    if (e.target.value === "relevance") {
                      newParams.delete("sort");
                    } else {
                      newParams.set("sort", e.target.value);
                    }
                    window.location.href = `/search?${newParams.toString()}`;
                  }}
                  aria-label="Sort search results"
                >
                  <option value="relevance">Relevance</option>
                  <option value="price_asc">Price: Low to High</option>
                  <option value="price_desc">Price: High to Low</option>
                  <option value="newest">Newest</option>
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Render the appropriate content based on state */}
        {renderContent()}
      </div>
    </>
  );
}
