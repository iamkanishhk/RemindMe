import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth, useSignIn } from '@clerk/react';
import { ErrorBanner } from '../components/ErrorBanner';
import { Spinner } from '../components/Spinner';

export default function SignInPage() {
  const { isLoaded, isSignedIn } = useAuth();
  const { signIn } = useSignIn();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  if (isLoaded && isSignedIn) {
    return <Navigate to="/" replace />;
  }

  async function handleGoogle() {
    if (!isLoaded || !signIn) return;
    setBusy(true);
    setError('');
    try {
      const result = await signIn.sso({
        strategy: 'oauth_google',
        redirectUrl: `${window.location.origin}/`,
        redirectCallbackUrl: '/sso-callback'
      });
      setBusy(false);
      const err = result?.error;
      if (err) {
        const code = 'code' in err && typeof err.code === 'string' ? err.code : '';
        setError(code.includes('strategy') || code === 'form_identifier_not_found'
          ? 'Google sign-in is not enabled on this Clerk instance yet. Enable Google OAuth in the Clerk dashboard, then sign in again.'
          : (err.message ?? 'Google sign-in failed'));
      }
    } catch (e) {
      setBusy(false);
      setError(e instanceof Error ? e.message : 'Google sign-in failed');
    }
  }

  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <a className="auth-brand" href="/" aria-label="RemindMe home">
          <span className="brand-mark" aria-hidden="true">
            R
          </span>
          <span className="brand-name">RemindMe</span>
        </a>
        <h1>Welcome back</h1>
        <p className="auth-sub">Sign in to schedule phone-call reminders.</p>
        <ErrorBanner message={error} />
        <button type="button" className="btn btn-google" disabled={busy || !isLoaded} onClick={() => void handleGoogle()}>
          {busy ? <Spinner /> : (
            <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
              <path fill="#4285F4" d="M23.5 12.27c0-.85-.08-1.66-.22-2.44H12v4.62h6.46a5.53 5.53 0 0 1-2.4 3.63v3h3.87c2.27-2.09 3.57-5.17 3.57-8.81Z" />
              <path fill="#34A853" d="M12 24c3.24 0 5.96-1.07 7.94-2.91l-3.87-3c-1.08.72-2.45 1.15-4.07 1.15-3.13 0-5.78-2.11-6.73-4.96H1.27v3.1A12 12 0 0 0 12 24Z" />
              <path fill="#FBBC05" d="M5.27 14.29a7.21 7.21 0 0 1 0-4.58v-3.1H1.27a12 12 0 0 0 0 10.78Z" />
              <path fill="#EA4335" d="M12 4.76c1.76 0 3.34.6 4.58 1.79l3.44-3.44A12 12 0 0 0 1.27 6.6l4 3.1C6.22 6.88 8.87 4.76 12 4.76Z" />
            </svg>
          )}
          <span>Continue with Google</span>
        </button>
        {!isLoaded ? <p className="auth-hint">Loading…</p> : null}
      </div>
    </div>
  );
}