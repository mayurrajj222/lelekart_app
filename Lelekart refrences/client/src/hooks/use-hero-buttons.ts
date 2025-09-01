import { useQuery } from "@tanstack/react-query";

export interface HeroButton {
  id: number;
  title: string;
  link: string;
  icon?: string;
  variant?: 'default' | 'outline' | 'ghost' | 'link';
  order: number;
}

export function useHeroButtons() {
  const { data: footerContents = [], isLoading, error } = useQuery({
    queryKey: ["/api/footer-content"],
    queryFn: async () => {
      try {
        const res = await fetch("/api/footer-content");
        if (!res.ok) {
          console.warn('Footer content API returned status:', res.status);
          return [];
        }
        return res.json();
      } catch (err) {
        console.warn('Error fetching footer content in useHeroButtons:', err);
        return [];
      }
    },
    retry: false,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  // Process content string to extract additional properties
  const processContent = (content: string): { link: string; variant?: string; icon?: string } => {
    try {
      // Check if content is a valid JSON with our expected format
      const parsedContent = JSON.parse(content);
      return {
        link: parsedContent.link || '/',
        variant: parsedContent.variant || 'outline',
        icon: parsedContent.icon
      };
    } catch (e) {
      // If not JSON, assume it's just a link
      return { link: content };
    }
  };

  // Determine icon based on button title or specified icon
  const getIconFromTitle = (title: string, specifiedIcon?: string): string | undefined => {
    if (specifiedIcon) return specifiedIcon;
    
    const lowerTitle = title.toLowerCase();
    if (lowerTitle.includes('shop') || lowerTitle.includes('home')) return 'home';
    if (lowerTitle.includes('detail') || lowerTitle.includes('view order')) return 'package';
    if (lowerTitle.includes('all orders') || lowerTitle.includes('orders')) return 'shopping-bag';
    if (lowerTitle.includes('account') || lowerTitle.includes('profile')) return 'user';
    if (lowerTitle.includes('cart') || lowerTitle.includes('bag')) return 'shopping-cart';
    if (lowerTitle.includes('wishlist') || lowerTitle.includes('favorite')) return 'heart';
    
    return undefined;
  };

  // Determine variant based on button position or specified variant
  const getVariant = (title: string, specifiedVariant?: string, order?: number): 'default' | 'outline' | 'ghost' | 'link' => {
    if (specifiedVariant) return specifiedVariant as 'default' | 'outline' | 'ghost' | 'link';
    
    const lowerTitle = title.toLowerCase();
    if (lowerTitle.includes('view order detail') || 
        lowerTitle.includes('track') || 
        order === 1) {
      return 'default';
    }
    
    return 'outline';
  };

  // Filter for hero section buttons and transform data
  const heroButtons: HeroButton[] = footerContents
    .filter((item: any) => item.section === 'hero' && item.isActive)
    .map((item: any) => {
      const { link, variant, icon } = processContent(item.content);
      
      return {
        id: item.id,
        title: item.title,
        link,
        icon: getIconFromTitle(item.title, icon),
        variant: getVariant(item.title, variant, item.order),
        order: item.order
      };
    })
    .sort((a: HeroButton, b: HeroButton) => a.order - b.order);

  // Fallback hero buttons if none are defined in the admin panel
  const defaultHeroButtons: HeroButton[] = [
    {
      id: -1,
      title: "Continue Shopping",
      link: "/",
      icon: "home",
      variant: "outline",
      order: 1
    },
    {
      id: -2,
      title: "View Order Details",
      link: "/order/{orderId}",
      icon: "package",
      variant: "default",
      order: 2
    },
    {
      id: -3,
      title: "View All Orders",
      link: "/orders",
      icon: "shopping-bag",
      variant: "outline",
      order: 3
    }
  ];

  return {
    heroButtons: heroButtons.length > 0 ? heroButtons : defaultHeroButtons,
    isLoading,
    error
  };
}