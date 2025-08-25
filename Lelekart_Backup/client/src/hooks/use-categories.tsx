import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

export interface Category {
  id: number;
  name: string;
  image: string;
  slug?: string;
}

export function useCategories() {
  return useQuery({
    queryKey: ["/api/categories"],
    queryFn: async () => {
      console.log("Fetching categories...");
      const res = await apiRequest("GET", "/api/categories");
      const data = await res.json();
      return data as Category[];
    },
  });
}