import { Navigate } from 'react-router-dom';
import { useIsAdmin } from '@/hooks/queries/useIsAdmin';
import { PageLoadingSpinner } from './LoadingSpinner';

export function ProtectedAdminRoute({ children }: { children: React.ReactNode }) {
  const { data: isAdmin, isLoading } = useIsAdmin();
  
  if (isLoading) return <PageLoadingSpinner />;
  if (!isAdmin) return <Navigate to="/" replace />;
  
  return <>{children}</>;
}
