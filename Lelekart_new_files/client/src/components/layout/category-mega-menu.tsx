import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronDown } from "lucide-react";
import { Link } from "wouter";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { useCategoryProducts } from "@/hooks/use-infinite-products";

type Category = {
  id: number;
  name: string;
  slug: string;
  description?: string;
  active: boolean;
  featured: boolean;
};

type Subcategory = {
  id: number;
  name: string;
  slug: string;
  categoryId: number;
  parentId?: number | null;
  description?: string;
  displayOrder: number;
  active: boolean;
  featured: boolean;
};

export function CategoryMegaMenu() {
  const [activeCategory, setActiveCategory] = useState<number | null>(null);
  const [expandedSubcategory, setExpandedSubcategory] = useState<number | null>(null);
  
  // Fetch categories
  const { data: categories, isLoading: categoriesLoading } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });
  
  // Fetch all subcategories
  const { data: subcategories, isLoading: subcategoriesLoading } = useQuery<Subcategory[]>({
    queryKey: ["/api/subcategories/all"],
  });
  
  // Get subcategories by category ID (only top-level, i.e., parentId is null/undefined)
  const getSubcategoriesForCategory = (categoryId: number): Subcategory[] => {
    if (!subcategories) return [];
    return subcategories.filter(subcategory => subcategory.categoryId === categoryId && subcategory.active && (!subcategory.parentId || subcategory.parentId === 0));
  };
  
  // Get subcategory2 (children) for a given subcategory
  const getSubcategory2ForSubcategory = (subcategoryId: number): Subcategory[] => {
    if (!subcategories) return [];
    return subcategories.filter(subcategory => subcategory.parentId === subcategoryId && subcategory.active);
  };
  
  // Check if a category has any active subcategories
  const hasSubcategories = (categoryId: number): boolean => {
    if (!subcategories) return false;
    return subcategories.some(subcategory => subcategory.categoryId === categoryId && subcategory.active);
  };
  
  // Add this mapping at the top, after imports
  const CATEGORY_IMAGE_MAP: Record<string, string> = {
    'Industrial & Scientific': 'https://www.amazon.in/Industrial-Scientific/b?ie=UTF8&node=5866078031',
    'Fashion': 'https://www.myntra.com/fashion-jeans',
    'Home': 'https://shriandsam.com/cdn/shop/articles/Picture11.jpg?v=1659353137&width=2048',
    'Appliances': 'https://numalis.com/wp-content/uploads/2023/10/Maxx-Studio-Shutterstock.jpg',
    'Grocery': 'https://hips.hearstapps.com/hmg-prod/images/healthy-groceries-bag-66eaef810acf6.jpg?crop=0.7501082719792118xw:1xh;center,top&resize=1200:*',
    'Beauty': 'https://beautybybie.com/cdn/shop/files/anti_pigmentation_facial_kit.jpg?v=1749274359',
    'Toys': 'https://images.indianexpress.com/2019/09/toys.jpg',
    'Electronics': 'https://www.retailmba.com/wp-content/uploads/2023/11/wholesale-electronics.jpeg',
    'Mobiles': 'https://www.top10mobileshop.com/images/top10mobiles.com/thumbnail/product/2024/08/795330468202408120724.jpg',
  };

  // Call useCategoryProducts for each special category
  const { data: homeProducts } = useCategoryProducts('Home', 1);
  const { data: industrialProducts } = useCategoryProducts('Industrial & Scientific', 1);
  const { data: fashionProducts } = useCategoryProducts('Fashion', 1);
  const { data: mobilesProducts } = useCategoryProducts('Mobiles', 10);
  const { data: healthProducts } = useCategoryProducts('Health & Wellness', 1);

  // Helper to get category image
  function getCategoryImage(categoryName: string) {
    switch (categoryName) {
      case 'Home':
        return homeProducts?.products?.[0]?.imageUrl || CATEGORY_IMAGE_MAP['Home'] || "/attached_assets/image_1744428587586.png";
      case 'Industrial & Scientific':
        return industrialProducts?.products?.[0]?.imageUrl || CATEGORY_IMAGE_MAP['Industrial & Scientific'] || "/attached_assets/image_1744428587586.png";
      case 'Fashion':
        return fashionProducts?.products?.[0]?.imageUrl || CATEGORY_IMAGE_MAP['Fashion'] || "/attached_assets/image_1744428587586.png";
      case 'Mobiles':
        return mobilesProducts?.products?.[0]?.imageUrl || CATEGORY_IMAGE_MAP['Mobiles'] || "/attached_assets/image_1744428587586.png";
      case 'Health & Wellness':
        return healthProducts?.products?.[0]?.imageUrl || CATEGORY_IMAGE_MAP['Health & Wellness'] || "/attached_assets/image_1744428587586.png";
      default:
        return CATEGORY_IMAGE_MAP[categoryName] || "/attached_assets/image_1744428587586.png";
    }
  }

  // Loading state
  if (categoriesLoading || subcategoriesLoading) {
    return (
      <div className="w-full bg-primary-foreground/20 h-10 flex justify-center items-center">
        <div className="flex space-x-8">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-6 w-20" />
          ))}
        </div>
      </div>
    );
  }
  
  // No categories to display
  if (!categories || categories.length === 0) {
    return null;
  }
  
  // Remove the filter that hides Health & Wellness
  const filteredCategories = categories;

  // If there are categories without subcategories, they should be shown as direct links
  const categoriesWithoutSubcategories = filteredCategories.filter(category => 
    category.active && !hasSubcategories(category.id)
  );

  // Categories with subcategories should be dropdown menus
  const categoriesWithSubcategories = filteredCategories.filter(category => 
    category.active && hasSubcategories(category.id)
  );
  
  return (
    <div className="w-full bg-[#F8F5E4] border-b border-[#EADDCB]">
      <div className="container mx-auto">
        <div className="flex justify-center">
          <div className="flex flex-nowrap gap-2 py-2 overflow-x-auto scrollbar-hide">
            {/* Categories with subcategories - shown as dropdowns */}
            {categoriesWithSubcategories.map(category => {
              let imageSrc = getCategoryImage(category.name);
              console.log('Rendering category:', category.name);
              return (
              <DropdownMenu key={category.id}>
                <DropdownMenuTrigger className="px-4 py-2 text-base font-bold bg-[#F8F5E4] text-black hover:bg-[#EADDCB] rounded-lg shadow-sm flex flex-col items-center transition-colors duration-150 border border-[#EADDCB] min-w-[120px]">
                  {/* Category image above name with skeleton loader */}
                  <div className="flex flex-col items-center mb-1">
                    <img
                      src={imageSrc}
                      alt={category.name || 'Category'}
                      className="w-32 h-20 object-contain border-2 border-[#e0c9a6] shadow-lg mb-2 bg-white transition-opacity duration-300 rounded-md"
                      style={{ aspectRatio: '16/9', objectFit: 'contain', objectPosition: 'center', maxWidth: '100%', maxHeight: '100%', display: 'block' }}
                      onError={e => { e.currentTarget.onerror = null; e.currentTarget.src = '/attached_assets/image_1744428587586.png'; }}
                    />
                    <span>{category.name}</span>
                  </div>
                  <ChevronDown className="ml-1 h-4 w-4 transition-transform duration-200 text-black" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="bg-[#F8F5E4] text-black border border-[#EADDCB] rounded-xl shadow-2xl p-2 mt-2 z-50">
                  {getSubcategoriesForCategory(category.id).map(subcategory => {
                    const subcategory2List = getSubcategory2ForSubcategory(subcategory.id);
                    return (
                      <div key={subcategory.id} className="relative group">
                        <div className={cn(
                          "flex items-center w-full px-3 py-2 rounded-lg transition-colors duration-150 cursor-pointer group-hover:bg-gray-50",
                          expandedSubcategory === subcategory.id ? "bg-gray-50" : ""
                        )}>
                          <span
                            className="flex-1 font-medium text-gray-900"
                            onClick={() => {
                              window.location.assign(`/category/${category.slug}?subcategory=${subcategory.slug}`);
                            }}
                          >
                            {subcategory.name}
                            {subcategory.featured && (
                              <span className="ml-2 px-1.5 py-0.5 text-[10px] leading-none bg-yellow-100 text-yellow-800 rounded-full">
                                Featured
                              </span>
                            )}
                          </span>
                          {subcategory2List.length > 0 && (
                            <span
                              onClick={e => {
                                e.stopPropagation();
                                setExpandedSubcategory(
                                  expandedSubcategory === subcategory.id ? null : subcategory.id
                                );
                              }}
                              className={cn(
                                "ml-2 flex items-center cursor-pointer transition-transform duration-200",
                                expandedSubcategory === subcategory.id ? "rotate-180 text-primary" : "text-gray-400"
                              )}
                              tabIndex={0}
                              role="button"
                              aria-label="Show subcategories"
                            >
                              <ChevronDown className="h-4 w-4" />
                            </span>
                          )}
                        </div>
                        {/* Inline subcategory2 list, with vertical line and animation */}
                        {subcategory2List.length > 0 && expandedSubcategory === subcategory.id && (
                          <div className="pl-7 border-l-2 border-gray-200 ml-2 mt-1 space-y-1 transition-all duration-200">
                            {subcategory2List.map(sub2 => (
                              <div
                                key={sub2.id}
                                className="flex items-center px-3 py-1 rounded-md hover:bg-gray-100 cursor-pointer text-sm text-gray-700 transition-colors duration-100"
                                onClick={e => {
                                  e.stopPropagation();
                                  window.location.assign(`/category/${category.slug}?subcategory=${subcategory.slug}&subcategory2=${sub2.slug}`);
                                }}
                              >
                                <span className="flex-1">{sub2.name}</span>
                                {sub2.featured && (
                                  <span className="ml-2 px-1 py-0.5 text-[10px] leading-none bg-yellow-100 text-yellow-800 rounded-full">
                                    Featured
                                  </span>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                  <div className="my-2 border-t border-gray-100" />
                  <DropdownMenuItem asChild>
                    <div 
                      onClick={() => {
                        window.location.href = `/category/${category.slug}`;
                      }}
                      className="cursor-pointer w-full text-center text-primary font-semibold text-base py-2 hover:bg-gray-50 rounded-lg"
                    >
                      View All {category.name}
                    </div>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            );
            })}
            
            {/* Categories without subcategories - shown as simple links */}
            {categoriesWithoutSubcategories.map(category => (
              <Link 
                key={category.id} 
                href={`/category/${category.slug}`}
                className="px-4 py-2 text-base font-bold bg-[#F8F5E4] text-black hover:bg-[#EADDCB] rounded-lg shadow-sm flex flex-col items-center border border-[#EADDCB] min-w-[120px]"
              >
                {/* Category image above name with skeleton loader */}
                <div className="flex flex-col items-center mb-1">
                  <img
                    src={CATEGORY_IMAGE_MAP[category.name] || "/attached_assets/image_1744428587586.png"}
                    alt={category.name || 'Category'}
                    className="w-32 h-20 object-cover border-2 border-[#e0c9a6] shadow-lg mb-2 bg-white transition-opacity duration-300 rounded-md"
                    style={{ aspectRatio: '16/9', objectFit: 'cover' }}
                    onError={e => { e.currentTarget.onerror = null; e.currentTarget.src = '/attached_assets/image_1744428587586.png'; }}
                  />
                  <span>{category.name}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}