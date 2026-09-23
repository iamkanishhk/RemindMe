import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useClerk } from '@clerk/react';
import { Spinner } from '../components/Spinner';
import { ErrorBanner } from '../components/ErrorBanner';

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

  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <h1>Finishing sign-in</h1>
        {error ? <ErrorBanner message={error} /> : <Spinner label="Completing Google sign-in…" />}
      </div>
    </div>
  );
}