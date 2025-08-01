import React from 'react';
import { Layout } from '@/components/layout/layout';
import { 
  Card,
  CardContent,
} from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

// Helper component to render content from footer management
export const StaticPageSection = ({ 
  section, 
  titleFilter, 
  defaultContent, 
  renderContent 
}: { 
  section: string;
  titleFilter: string; 
  defaultContent: React.ReactNode;
  renderContent?: (content: string) => React.ReactNode;
}) => {
  const { data: footerContents = [] } = useQuery({
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
        console.warn('Error fetching footer content in StaticPageSection:', err);
        return [];
      }
    },
    retry: false,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });
  
  // Find content with the specified section and title
  const contentItem = footerContents.find(
    (item: any) => item.section === section && item.title === titleFilter && item.isActive
  );
  
  if (!contentItem) {
    return <>{defaultContent}</>;
  }
  
  // Render custom content if a renderer is provided, otherwise return the content as is
  return renderContent ? renderContent(contentItem.content) : <div dangerouslySetInnerHTML={{ __html: contentItem.content }} />;
};

interface StaticPageTemplateProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  headerColor?: string;
  textColor?: string;
}

export function StaticPageTemplate({ 
  title, 
  subtitle, 
  children, 
  headerColor = "#2874f0", 
  textColor = "white" 
}: StaticPageTemplateProps) {
  return (
    <Layout>
      <div className="bg-[#f1f3f6] min-h-screen py-4">
        <div className="container mx-auto px-4">
          {/* Main Content Area */}
          <div className="bg-white shadow-sm rounded-md overflow-hidden mb-6">
            {/* Header Banner */}
            <div className={`bg-[${headerColor}] text-${textColor} p-8 md:p-12`}>
              <div className="max-w-4xl mx-auto">
                <h1 className="text-3xl md:text-4xl font-bold mb-3">{title}</h1>
                {subtitle && <p className="text-lg md:text-xl opacity-90">{subtitle}</p>}
              </div>
            </div>

            {/* Content */}
            <div className="p-6 md:p-8">
              <div className="max-w-4xl mx-auto">
                {children}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}