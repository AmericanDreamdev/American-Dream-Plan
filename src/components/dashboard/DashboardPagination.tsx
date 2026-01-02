import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface DashboardPaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  itemsPerPage: number;
  onItemsPerPageChange: (value: number) => void;
  totalItems: number;
}

export const DashboardPagination = ({
  currentPage,
  totalPages,
  onPageChange,
  itemsPerPage,
  onItemsPerPageChange,
  totalItems,
}: DashboardPaginationProps) => {
  // Logic to show page numbers (e.g. 1, 2, 3 ... 10)
  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;

    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Always show first, last, and pages around current
      if (currentPage <= 3) {
        pages.push(1, 2, 3, 4, '...', totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
      }
    }
    return pages;
  };

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between px-6 py-4 border-t border-gray-100">
      <div className="flex items-center text-sm text-gray-500 gap-2">
        <span>Mostrando</span>
        <Select
          value={itemsPerPage.toString()}
          onValueChange={(val) => {
             onItemsPerPageChange(Number(val));
             onPageChange(1); // Reset to first page
          }}
        >
          <SelectTrigger className="h-8 w-[70px]">
            <SelectValue placeholder={itemsPerPage} />
          </SelectTrigger>
          <SelectContent side="top">
            {[10, 20, 30, 50, 100].map((size) => (
              <SelectItem key={size} value={size.toString()}>
                {size}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span>de {totalItems} resultados</span>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8 text-gray-500"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          {getPageNumbers().map((page, index) => (
              <div key={index}>
                  {page === '...' ? (
                      <span className="px-2 text-gray-400 text-xs"><MoreHorizontal className="h-4 w-4" /></span>
                  ) : (
                      <Button
                          variant={currentPage === page ? "default" : "ghost"}
                          size="sm"
                          className={`h-8 w-8 text-xs ${
                              currentPage === page 
                                  ? "bg-blue-600 hover:bg-blue-700 text-white shadow-sm" 
                                  : "text-gray-600 hover:bg-gray-100"
                          }`}
                          onClick={() => typeof page === 'number' && onPageChange(page)}
                      >
                          {page}
                      </Button>
                  )}
              </div>
          ))}

          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8 text-gray-500"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
};
