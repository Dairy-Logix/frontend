import { Loader2 } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Skeleton } from "@/components/ui/skeleton";

interface PageLoadingProps {
  title: string;
  description?: string;
  showSkeleton?: boolean;
}

/**
 * Standardized loading state component for pages
 * Displays a spinner with optional skeleton UI
 */
export function PageLoading({
  title,
  description,
  showSkeleton = false,
}: PageLoadingProps) {
  if (showSkeleton) {
    return (
      <div className="space-y-6">
        <PageHeader title={title} description={description} />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center space-y-4">
        <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
        <div>
          <p className="text-lg font-medium">{title}</p>
          {description && (
            <p className="text-sm text-muted-foreground mt-1">{description}</p>
          )}
        </div>
      </div>
    </div>
  );
}
