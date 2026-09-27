import { Navigate, Outlet } from 'react-router-dom';
import { useMe } from '../hooks/queries';
import { Skeleton } from './Skeleton';
import ErrorPage from './ErrorPage';

/**
 * Onboarding step 2 gate. Sends users who have not yet seen the Maya intro to
 * /onboarding/maya, and lets everyone else through to the app.
 */
export default function OnboardingGate() {
  const me = useMe();

  if (me.isLoading) {
    return (
      <div className="page-loader">
        <div className="flex flex-col items-center gap-4 skeleton-area-light">
          <Skeleton className="h-40 w-40 rounded-full" />
          <div className="flex w-56 flex-col gap-2.5">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/5" />
          </div>
        </div>
      </div>
    );
  }

  if (me.error) {
    return (
      <ErrorPage
        message={me.error.message}
        title="Couldn't load your profile"
        onRetry={() => void me.refetch()}
      />
    );
  }

  if (!me.data?.onboardingCompletedAt) {
    return <Navigate to="/onboarding/maya" replace />;
  }

  return <Outlet />;
}
