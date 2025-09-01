import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface SimplifiedSearchResultsProps {
  initialQuery?: string;
  onSearch?: (query: string) => void;
}

export function SimplifiedSearchResults({ 
  initialQuery = '', 
  onSearch
}: SimplifiedSearchResultsProps) {
  const [, setLocation] = useLocation();
  // Always use the initialQuery prop directly to ensure the search box stays updated
  // when navigating between searches
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  
  // Update search query when initialQuery changes (like when navigating
  // between different search results pages)
  React.useEffect(() => {
    setSearchQuery(initialQuery);
    // Reset the last search reference when initialQuery changes
    // This ensures we don't skip searches when navigating between pages
    lastSearchRef.current = '';
  }, [initialQuery]);
  
  // Keep track of the last submitted search to prevent submitting multiple searches
  const lastSearchRef = React.useRef<string>('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Skip empty searches
    if (!searchQuery.trim()) return;
    
    // Normalize the query
    const normalizedQuery = searchQuery.trim();
    
    // Log the search being submitted
    console.log('SIMPLIFIED SEARCH - Submitting new search:', normalizedQuery);
    
    // Update the last search query for reference
    lastSearchRef.current = normalizedQuery;
    
    // Notify parent component (for analytics or other custom behaviors)
    if (onSearch) {
      onSearch(normalizedQuery);
    }
    
    // Get current URL parameters to preserve filters when searching
    const currentParams = new URLSearchParams(window.location.search);
    
    // Create a new URL with just the search query (preserving other params)
    const newParams = new URLSearchParams();
    newParams.set('q', normalizedQuery);
    
    // Preserve other filters if they exist (except for the query)
    // Convert entries to array first to avoid iterator issues
    Array.from(currentParams.entries()).forEach(([key, value]) => {
      if (key !== 'q') {
        newParams.set(key, value);
      }
    });
    
    // Force a hard navigation instead of using setLocation for proper page reload
    // This ensures the React Query cache is properly invalidated
    window.location.href = `/search?${newParams.toString()}`;
  };

  return (
    <form onSubmit={handleSearch} className="flex w-full mb-4">
      <div className="relative flex-1">
        <Input
          type="text"
          className="w-full pl-14 pr-6 py-5 text-xl rounded-l-lg border-r-0 shadow-lg"
          placeholder="Search products..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          autoFocus
        />
        <Search className="absolute left-5 top-1/2 transform -translate-y-1/2 h-7 w-7 text-gray-500" />
      </div>
      <Button type="submit" className="rounded-l-none px-10 py-5 text-xl font-bold shadow-lg">Search</Button>
    </form>
  );
}