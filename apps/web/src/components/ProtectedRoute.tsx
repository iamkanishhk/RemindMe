import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@clerk/react';
import { Skeleton } from './Skeleton';

export default function ProtectedRoute() {
  const { isLoaded, isSignedIn } = useAuth();

  if (!isLoaded) {
    return (
      <div className="page-loader">
        <div className="flex flex-col items-center gap-4 skeleton-area-light">
          <Skeleton className="h-16 w-16 rounded-full" />
          <Skeleton className="h-5 w-28" />
        </div>
      </div>
    );
  }

  if (!isSignedIn) {
    return <Navigate to="/sign-in" replace />;
  }

  return <Outlet />;
}