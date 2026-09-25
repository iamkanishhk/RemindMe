import { Outlet } from 'react-router-dom';
import { useMe } from '../hooks/queries';
import { Skeleton } from './Skeleton';
import ErrorPage from './ErrorPage';
import PhoneVerifyOnboarding from './PhoneVerifyOnboarding';

export default function PhoneVerifiedGate() {
  const me = useMe();

  if (me.isLoading) {
    return (
      <div className="page-loader">
        <div className="flex flex-col items-center gap-4 skeleton-area-light">
          <Skeleton className="h-24 w-24 rounded-full" />
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

  const verified = (me.data?.phoneNumbers ?? []).some((p) => p.verified);
  if (!verified) {
    return <PhoneVerifyOnboarding />;
  }

  return <Outlet />;
}