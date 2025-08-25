import React from 'react';
import { Button } from './button';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  maxPageLinks?: number;
}

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  maxPageLinks = 5,
}: PaginationProps) {
  // Calculate range of visible page links
  const getPageRange = () => {
    // If total pages is less than max page links, show all pages
    if (totalPages <= maxPageLinks) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    // Calculate start and end of page range
    let start = Math.max(currentPage - Math.floor(maxPageLinks / 2), 1);
    let end = start + maxPageLinks - 1;

    // Adjust if end is beyond total pages
    if (end > totalPages) {
      end = totalPages;
      start = Math.max(end - maxPageLinks + 1, 1);
    }

    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  };

  const pageRange = getPageRange();

  return (
    <nav className="flex justify-center items-center space-x-1">
      {/* First page button */}
      <Button
        variant="outline"
        size="icon"
        onClick={() => onPageChange(1)}
        disabled={currentPage === 1}
        className="hidden sm:flex h-8 w-8"
        aria-label="First page"
      >
        <ChevronsLeft className="h-4 w-4" />
      </Button>

      {/* Previous page button */}
      <Button
        variant="outline"
        size="icon"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="h-8 w-8"
        aria-label="Previous page"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>

      {/* Page number buttons */}
      {pageRange.map((page) => (
        <Button
          key={page}
          variant={currentPage === page ? "default" : "outline"}
          onClick={() => onPageChange(page)}
          className={cn(
            "h-8 w-8",
            currentPage === page ? "bg-primary text-primary-foreground" : ""
          )}
          aria-label={`Page ${page}`}
          aria-current={currentPage === page ? "page" : undefined}
        >
          {page}
        </Button>
      ))}

      {/* Next page button */}
      <Button
        variant="outline"
        size="icon"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="h-8 w-8"
        aria-label="Next page"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>

      {/* Last page button */}
      <Button
        variant="outline"
        size="icon"
        onClick={() => onPageChange(totalPages)}
        disabled={currentPage === totalPages}
        className="hidden sm:flex h-8 w-8"
        aria-label="Last page"
      >
        <ChevronsRight className="h-4 w-4" />
      </Button>
    </nav>
  );
}