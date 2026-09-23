import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@clerk/react';
import { Spinner } from './Spinner';

export default function ProtectedRoute() {
  const { isLoaded, isSignedIn } = useAuth();

  if (!isLoaded) {
    return (
      <div className="page-loader">
        <Spinner />
      </div>
    );
  }

  if (!isSignedIn) {
    return <Navigate to="/sign-in" replace />;
  }

  return <Outlet />;
}