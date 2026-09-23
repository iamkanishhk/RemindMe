export default function SetupRequiredPage() {
  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <a className="auth-brand" href="/" aria-label="RemindMe home">
          <span className="brand-mark" aria-hidden="true">
            R
          </span>
          <span className="brand-name">RemindMe</span>
        </a>
        <h1>Almost there</h1>
        <p className="auth-sub">RemindMe's web app can't start because Clerk isn't configured yet.</p>
        <ol className="setup-list">
          <li>
            Set <code>VITE_CLERK_PUBLISHABLE_KEY</code> in <code>apps/web/.env</code> (copy it from your{' '}
            <a href="https://dashboard.clerk.com" target="_blank" rel="noreferrer">
              Clerk dashboard
            </a>
            ).
          </li>
          <li>Enable <strong>Google</strong> as a social connection in the Clerk dashboard.</li>
          <li>Add the redirect URLs <code>http://localhost:5173/sso-callback</code> and <code>http://localhost:3000/api/calls/webhook</code> as needed.</li>
        </ol>
        <p className="auth-hint">
          The API server runs at <code>{import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}</code> — start it with{' '}
          <code>npm run dev</code> from the repo root.
        </p>
      </div>
    </div>
  );
}