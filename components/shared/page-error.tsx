import { AlertCircle } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

interface PageErrorProps {
  title: string;
  description?: string;
  error: Error | { message: string } | null;
  onRetry?: () => void;
}

/**
 * Standardized error state component for pages
 * Displays an error alert with optional retry button
 */
export function PageError({
  title,
  description,
  error,
  onRetry,
}: PageErrorProps) {
  return (
    <div className="space-y-6">
      <PageHeader title={title} description={description} />
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription className="flex items-center justify-between">
          <span>
            {error?.message || "An unexpected error occurred. Please try again."}
          </span>
          {onRetry && (
            <Button variant="outline" size="sm" onClick={onRetry}>
              Retry
            </Button>
          )}
        </AlertDescription>
      </Alert>
    </div>
  );
}
