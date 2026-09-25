import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useClerk, useUser } from '@clerk/react';
import { useDeleteMe, useMe } from '../hooks/queries';
import { formatDateTimeLocal } from '../lib/format';
import { Spinner } from '../components/Spinner';
import { ErrorBanner } from '../components/ErrorBanner';
import { iosTheme } from './iosTheme';

function displayNameFromEmail(email: string): string {
  const local = email.split('@')[0] ?? '';
  return local.charAt(0).toUpperCase() + local.slice(1);
}

export default function ProfilePage() {
  const me = useMe();
  const { user } = useUser();
  const { signOut } = useClerk();
  const navigate = useNavigate();
  const deleteMe = useDeleteMe();

  const [confirmText, setConfirmText] = useState('');
  const [busy, setBusy] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [error, setError] = useState('');

  const email =
    me.data?.email ?? user?.primaryEmailAddress?.emailAddress ?? '';

  const name =
    user?.fullName?.trim() ||
    (email ? displayNameFromEmail(email) : 'RemindMe');

  const avatarUrl = user?.imageUrl;

  async function doSignOut() {
    setSigningOut(true);

    try {
      await signOut();
      navigate('/sign-in', { replace: true });
    } catch {
      setSigningOut(false);
    }
  }

  async function doDelete() {
    setBusy(true);
    setError('');

    try {
      await deleteMe.mutateAsync();
      await signOut();
      navigate('/sign-in', { replace: true });
    } catch (e) {
      setError(
        e instanceof Error ? e.message : 'Could not delete your account'
      );
      setBusy(false);
    }
  }

  const confirmed = confirmText.trim().toLowerCase() === 'delete';

  return (
    <section className="ios-settings-page">
      <div className="ios-settings-container">
        {/* Header */}
        <header className="ios-settings-header">
          <div className="ios-settings-eyebrow">PROFILE</div>

          <h1>Profile</h1>
        </header>

        {/* Global error */}
        {error && (
          <div className="ios-global-error">
            <ErrorBanner message={error} />
          </div>
        )}

        {/* =========================================
            IDENTITY
        ========================================== */}
        <section className="ios-settings-section">
          <div className="ios-section-label">YOU</div>

          <div className="ios-settings-card">
            <div className="ios-profile-card">
              <div className="ios-avatar">
                {avatarUrl ? (
                  <img src={avatarUrl} alt={name} />
                ) : (
                  <span className="ios-avatar-fallback">
                    {name.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>

              <div>
                <div className="ios-profile-name">{name}</div>
                {email && <div className="ios-profile-email">{email}</div>}
              </div>
            </div>
          </div>
        </section>

        {/* =========================================
            ACCOUNT
        ========================================== */}
        <section className="ios-settings-section">
          <div className="ios-section-label">ACCOUNT</div>

          <div className="ios-settings-card">
            {me.isLoading ? (
              <div className="ios-loading-row">
                <Spinner label="Loading account…" />
              </div>
            ) : (
              <>
                <div className="ios-setting-row">
                  <div className="ios-row-leading">
                    <div className="ios-setting-icon blue">
                      <span>@</span>
                    </div>

                    <div className="ios-row-title">Email</div>
                  </div>

                  <div className="ios-row-value">{me.data?.email}</div>
                </div>

                <div className="ios-divider" />

                <div className="ios-setting-row">
                  <div className="ios-row-leading">
                    <div className="ios-setting-icon orange">
                      <span>◷</span>
                    </div>

                    <div className="ios-row-title">Member since</div>
                  </div>

                  <div className="ios-row-value">
                    {me.data?.createdAt
                      ? formatDateTimeLocal(me.data.createdAt)
                      : '—'}
                  </div>
                </div>
              </>
            )}
          </div>
        </section>

        {/* =========================================
            SESSION
        ========================================== */}
        <section className="ios-settings-section">
          <div className="ios-section-label">SESSION</div>

          <div className="ios-settings-card">
            <div className="ios-setting-row">
              <div className="ios-row-leading">
                <div className="ios-setting-icon blue">
                  <span>⎋</span>
                </div>

                <div className="ios-row-title">Sign out</div>
              </div>

              <div className="ios-row-value">
                <button
                  type="button"
                  className="ios-signout-button"
                  disabled={signingOut}
                  onClick={() => void doSignOut()}
                >
                  {signingOut ? <Spinner /> : 'Sign out'}
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* =========================================
            DANGER ZONE
        ========================================== */}
        <section className="ios-settings-section danger-section">
          <div className="ios-section-label danger-label">
            DANGER ZONE
          </div>

          <div className="ios-danger-card">
            <div className="ios-danger-header">
              <div className="ios-danger-icon">
                <span>!</span>
              </div>

              <div>
                <h2>Delete account</h2>

                <p>
                  Deleting your account permanently removes
                  your phone numbers and reminder history.
                </p>
              </div>
            </div>

            <div className="ios-delete-confirm">
              <label
                htmlFor="delete-confirm"
                className="ios-input-label"
              >
                Confirmation
              </label>

              <input
                id="delete-confirm"
                type="text"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder="type 'delete'"
                autoComplete="off"
                spellCheck={false}
              />

              <div className="ios-input-hint">
                Type <code>delete</code> to confirm.
              </div>
            </div>

            <button
              type="button"
              className="ios-delete-button"
              disabled={!confirmed || busy}
              onClick={() => void doDelete()}
            >
              {busy ? (
                <Spinner />
              ) : (
                <>
                  <span className="ios-delete-icon">⌫</span>
                  Delete my account
                </>
              )}
            </button>
          </div>
        </section>

        <div className="ios-footer-note">
          <span>Profile</span>
          <span>•</span>
          <span>Account &amp; Session</span>
        </div>
      </div>

      <style>{iosTheme}</style>
    </section>
  );
}