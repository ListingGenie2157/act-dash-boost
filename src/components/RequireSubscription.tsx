import { Navigate } from 'react-router-dom';
import { useSubscription } from '@/hooks/useSubscription';
import { useIsAdmin } from '@/hooks/queries/useIsAdmin';
import { LoadingSpinner } from '@/components/LoadingSpinner';

interface RequireSubscriptionProps {
  children: React.ReactNode;
}

export function RequireSubscription({ children }: RequireSubscriptionProps) {
  const { isSubscribed, isLoading: subLoading } = useSubscription();
  const { data: isAdmin, isLoading: adminLoading } = useIsAdmin();

  if (subLoading || adminLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <LoadingSpinner />
      </div>
    );
  }

  // Admins bypass subscription requirement
  if (isAdmin) {
    return <>{children}</>;
  }

  if (!isSubscribed) {
    return <Navigate to="/pricing" replace />;
  }

  return <>{children}</>;
}
