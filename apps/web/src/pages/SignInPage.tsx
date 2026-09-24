import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth, useSignIn } from '@clerk/react';
import { ErrorBanner } from '../components/ErrorBanner';
import { Spinner } from '../components/Spinner';
import illustration from '../../assets/2.png';

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
      const err = result?.error;
      if (err) {
        setBusy(false);
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
    <div className="min-h-screen bg-slate-300 flex flex-col items-center justify-center p-6 select-none">
      <div className="flex-1 min-h-0 w-full max-w-[310px] flex flex-col items-center justify-center gap-2 animate-fade-in">
        <img
          src={illustration}
          alt="Welcome illustration"
          className="max-w-[240px] max-h-[220px] w-auto h-auto object-contain transition-transform duration-300 hover:scale-[1.02]"
        />

        <div className="text-center px-2 space-y-3 my-2">
          <h1 className="text-[26px] font-bold text-slate-900 tracking-tight leading-tight">
            Welcome to RemindMe
          </h1>
          <p className="text-[13px] text-slate-400 font-normal leading-relaxed px-2 max-w-[300px] mx-auto">
            Sign in to schedule phone-call reminders so nothing slips through.
          </p>
        </div>
      </div>

      <div className="w-full max-w-[310px] space-y-3.5 pb-4">
        <ErrorBanner message={error} />
        <button
          type="button"
          className="w-full py-3.5 rounded-full font-semibold text-[14px] flex items-center justify-center gap-3 bg-[#e9ecef] text-[#2b303a] transition active:scale-[0.97] active:bg-[#dee2e6] disabled:opacity-60 disabled:cursor-not-allowed focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
          disabled={busy || !isLoaded}
          onClick={() => void handleGoogle()}
        >
          {busy ? <Spinner /> : (
            <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
            </svg>
          )}
          <span>Continue with Google</span>
        </button>
        {!isLoaded ? <p className="text-center text-xs text-slate-400 font-medium">Loading…</p> : null}
      </div>
    </div>
  );
}