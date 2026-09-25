import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useClerk } from '@clerk/react';
import { Skeleton } from '../components/Skeleton';
import ErrorPage from '../components/ErrorPage';

export default function SsoCallbackPage() {
  const { handleRedirectCallback } = useClerk();
  const navigate = useNavigate();
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        await handleRedirectCallback({});
        if (!cancelled) navigate('/', { replace: true });
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Could not complete sign-in');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [handleRedirectCallback, navigate]);

  if (error) {
    return (
      <ErrorPage
        light
        message={error}
        title="Couldn't complete sign-in"
        secondary={{
          label: 'Back to sign in',
          onClick: () => navigate('/sign-in'),
        }}
      />
    );
  }

  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <h1>Finishing sign-in</h1>
        <div className="flex flex-col gap-3 skeleton-area-light" aria-busy="true">
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="mt-2 h-11 w-full rounded-full" />
        </div>
      </div>
    </div>
  );
}