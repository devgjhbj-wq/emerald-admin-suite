import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight, Search, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

const PageContainer = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <div className={cn("space-y-1", className)}>{children}</div>
);

const SearchHeader = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <div className={cn("bg-card border border-border rounded-lg", className)}>
    <div className="flex flex-wrap items-center pb-[5px] pt-1 px-1.5 gap-[5px] text-xs">{children}</div>
  </div>
);

interface TableContainerProps {
  children: React.ReactNode;
  className?: string;
  loading?: boolean;
}
const TableContainer = ({ children, className, loading }: TableContainerProps) => (
  <div className={cn("relative w-full overflow-x-auto bg-card border border-border rounded-lg shadow-sm max-w-full", className)}>
    {loading && (
      <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/60 backdrop-blur-[1px]">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    )}
    {children}
  </div>
);

interface PaginationProps {
  page: number;
  totalPages: number;
  total?: number;
  loading?: boolean;
  onPageChange: (page: number) => void;
}

const Pagination = ({ page, totalPages, total, loading, onPageChange }: PaginationProps) => {
  if (totalPages <= 1) return null;

  const getPageNumbers = () => {
    const pages: number[] = [];
    const maxVisible = 5;
    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else if (page <= 3) {
      for (let i = 1; i <= maxVisible; i++) pages.push(i);
    } else if (page >= totalPages - 2) {
      for (let i = totalPages - 4; i <= totalPages; i++) pages.push(i);
    } else {
      for (let i = page - 2; i <= page + 2; i++) pages.push(i);
    }
    return pages;
  };

  return (
    <div className="flex items-center justify-end bg-card border border-border rounded-lg p-1.5 gap-2 shadow-sm">
      {total !== undefined && (
        <span className="text-xs text-muted-foreground">Total {total}</span>
      )}
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          disabled={page <= 1 || loading}
          onClick={() => onPageChange(page - 1)}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        {getPageNumbers().map((p) => (
          <Button
            key={p}
            variant={page === p ? "secondary" : "ghost"}
            size="sm"
            className={cn(
              "h-8 w-8 p-0 text-xs font-medium",
              page === p ? "text-primary" : "text-foreground"
            )}
            onClick={() => p !== page && onPageChange(p)}
          >
            {p}
          </Button>
        ))}
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          disabled={page >= totalPages || loading}
          onClick={() => onPageChange(page + 1)}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export { PageContainer, SearchHeader, TableContainer, Pagination };
