import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation, useParams } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

import { Subcategory } from "@shared/schema";

export default function SubcategoryListingPage() {
  const [location, setLocation] = useLocation();
  const params = useParams();
  
  // Extract the category and subcategory from the URL path
  const urlParts = location.split('/');
  let categorySlug, subcategorySlug;
  
  // Check if we're on the new subcategory route or old route
  if (location.startsWith('/subcategory/')) {
    // New URL format: /subcategory/:category/:subcategory
    categorySlug = params?.category;
    subcategorySlug = params?.subcategory;
  } else {
    // Old URL format: /subcategories/:category
    categorySlug = decodeURIComponent(urlParts[urlParts.length - 1]);
  }
  
  // Fetch categories to get the categoryId for the current category
  const { data: categories, isLoading: isCategoriesLoading } = useQuery<any[]>({
    queryKey: ["/api/categories"],
  });
  
  const category = categories?.find((cat: any) => cat.slug === categorySlug);
  const categoryId = category?.id;
  const categoryName = category?.name || categorySlug;
  
  // Fetch subcategories for the current category
  const { data: subcategories, isLoading: isSubcategoriesLoading } = useQuery({
    queryKey: ['/api/subcategories', categoryId],
    queryFn: async () => {
      if (!categoryId) return [];
      const response = await fetch(`/api/subcategories?categoryId=${categoryId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch subcategories');
      }
      return response.json();
    },
    enabled: !!categoryId,
    onSuccess: (data) => {
      // If there are no subcategories, automatically redirect to the category page
      if (data && data.length === 0 && categoryName) {
        console.log('No subcategories found, redirecting to category page:', categoryName);
        handleViewAllClick();
      }
      
      // If we have a specific subcategory in the URL and we're in the new route format
      // direct to the category page with the subcategory as a query parameter
      if (subcategorySlug && location.startsWith('/subcategory/')) {
        const matchingSubcategory = data.find((sub: Subcategory) => sub.slug === subcategorySlug);
        if (matchingSubcategory) {
          console.log(`Redirecting to category ${categorySlug} with subcategory ${subcategorySlug}`);
          window.location.href = `/category/${categorySlug}?subcategory=${subcategorySlug}`;
        }
      }
    }
  });
  
  // Handle navigation to dedicated subcategory page 
  const handleSubcategoryClick = (subcategory: Subcategory) => {
    // Redirect to the category page with subcategory filter
    window.location.href = `/category/${categorySlug}?subcategory=${subcategory.slug}`;
  };
  
  // Handle navigation to all products in the category
  const handleViewAllClick = () => {
    window.location.href = `/category/${categorySlug}`;
  };
  
  const isLoading = isCategoriesLoading || isSubcategoriesLoading;
  
  return (
    <>
      <div className="container mx-auto py-8">
        {/* Header section with category title */}
        <div className="flex items-center mb-6">
          <Button 
            variant="outline" 
            size="icon"
            onClick={() => setLocation('/')}
            className="mr-3"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold">{categoryName} - Browse by Subcategory</h1>
        </div>
        
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white rounded-md shadow-md p-6 flex flex-col items-center">
                <Skeleton className="h-24 w-24 rounded-full mb-4" />
                <Skeleton className="h-6 w-32 mb-2" />
                <Skeleton className="h-4 w-48" />
              </div>
            ))}
          </div>
        ) : subcategories && subcategories.length > 0 ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {/* Card to view all products in the category */}
              <div 
                className="bg-white rounded-md shadow-md p-6 flex flex-col items-center cursor-pointer transform transition hover:scale-105 hover:shadow-lg"
                onClick={handleViewAllClick}
              >
                <div className="h-24 w-24 rounded-full bg-blue-100 flex items-center justify-center mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
                  </svg>
                </div>
                <h2 className="text-xl font-semibold mb-2">All {categoryName}</h2>
                <p className="text-gray-600 text-center">Browse all products in this category</p>
              </div>
              
              {/* Individual subcategory cards */}
              {subcategories.map((subcategory: Subcategory) => (
                <div 
                  key={subcategory.id} 
                  className="bg-white rounded-md shadow-md p-6 flex flex-col items-center cursor-pointer transform transition hover:scale-105 hover:shadow-lg"
                  onClick={() => handleSubcategoryClick(subcategory)}
                >
                  <div className="h-24 w-24 rounded-full bg-blue-50 flex items-center justify-center mb-4">
                    {subcategory.image ? (
                      <img 
                        src={subcategory.image} 
                        alt={subcategory.name} 
                        className="h-20 w-20 object-contain rounded-full"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.onerror = null;
                          target.src = '/images/placeholder.svg';
                        }}
                      />
                    ) : (
                      <div className="h-20 w-20 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 text-3xl font-bold">
                        {subcategory.name.charAt(0)}
                      </div>
                    )}
                  </div>
                  <h2 className="text-xl font-semibold mb-2">{subcategory.name}</h2>
                  <p className="text-gray-600 text-center">
                    {subcategory.description || `Browse ${subcategory.name} products in ${categoryName}`}
                  </p>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="text-center py-8">
            <h2 className="text-xl font-semibold mb-2">No Subcategories Found</h2>
            <p className="text-gray-600 mb-4">There are no subcategories available for {categoryName}.</p>
            <Button 
              variant="default" 
              onClick={handleViewAllClick}
            >
              Browse All {categoryName} Products
            </Button>
          </div>
        )}
      </div>
    </>
  );
}