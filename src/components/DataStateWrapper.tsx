import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

interface DataStateWrapperProps {
  isLoading?: boolean;
  error?: Error | null;
  isEmpty?: boolean;
  onRetry?: () => void;
  loadingSkeleton?: React.ReactNode;
  emptyStateTitle?: string;
  emptyStateDescription?: string;
  children: React.ReactNode;
}

export function DataStateWrapper({
  isLoading,
  error,
  isEmpty,
  onRetry,
  loadingSkeleton,
  emptyStateTitle = "No data found",
  emptyStateDescription = "There's no data to display at the moment.",
  children,
}: DataStateWrapperProps) {
  if (isLoading) {
    return loadingSkeleton || <DefaultLoadingSkeleton />;
  }

  if (error) {
    return (
      <ErrorState 
        error={error} 
        onRetry={onRetry} 
      />
    );
  }

  if (isEmpty) {
    return (
      <EmptyState 
        title={emptyStateTitle}
        description={emptyStateDescription}
      />
    );
  }

  return <>{children}</>;
}

function DefaultLoadingSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-8 w-[250px]" />
      <Skeleton className="h-4 w-[400px]" />
      <Skeleton className="h-4 w-[350px]" />
      <Skeleton className="h-32 w-full" />
    </div>
  );
}

function ErrorState({ error, onRetry }: { error: Error; onRetry?: () => void }) {
  return (
    <Card className="border-destructive/50">
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center">
          <AlertCircle className="h-6 w-6 text-destructive" />
        </div>
        <CardTitle className="text-lg text-destructive">Error Loading Data</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 text-center">
        <p className="text-sm text-muted-foreground">
          {error.message || 'An unexpected error occurred'}
        </p>
        {onRetry && (
          <Button onClick={onRetry} variant="outline" size="sm">
            <RefreshCw className="mr-2 h-4 w-4" />
            Try Again
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <Card>
      <CardContent className="pt-6 text-center">
        <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-muted flex items-center justify-center">
          <AlertCircle className="h-6 w-6 text-muted-foreground" />
        </div>
        <h3 className="font-semibold text-lg mb-2">{title}</h3>
        <p className="text-sm text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}