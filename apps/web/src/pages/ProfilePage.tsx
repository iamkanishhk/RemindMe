import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useClerk, useUser } from '@clerk/react';
import { useDeleteMe, useMe } from '../hooks/queries';
import { formatDateTimeLocal } from '../lib/format';
import { Spinner } from '../components/Spinner';
import { SkeletonRow } from '../components/Skeleton';
import { useErrorToast } from '../components/Toast';
import ConfirmSheet from '../components/ConfirmSheet';
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
  const [confirmingSignOut, setConfirmingSignOut] = useState(false);
  const [error, setError] = useState('');

  useErrorToast(error);

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
          <h1>Profile</h1>
        </header>

        {/* =========================================
            IDENTITY
        ========================================== */}
        <section className="ios-settings-section">
      
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
        
        </section>

        {/* =========================================
            ACCOUNT
        ========================================== */}
        <section className="ios-settings-section">
          <div className="ios-section-label">ACCOUNT</div>

          <div
            className={`ios-settings-card${me.isLoading ? ' skeleton-area' : ''}`}
            aria-busy={me.isLoading}
          >
            {me.isLoading ? (
              <>
                <SkeletonRow />
                <div className="ios-divider" />
                <SkeletonRow />
              </>
            ) : (
              <>
                <div className="ios-setting-row">
                  <div className="ios-row-leading">
                  
                    <div className="ios-row-title">Email</div>
                  </div>

                  <div className="ios-row-value">{me.data?.email}</div>
                </div>

                <div className="ios-divider" />

                <div className="ios-setting-row">
                  <div className="ios-row-leading">
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
          
                <button
                  type="button"
                  className="ios-settings-card w-full h-[5vh] text-[#DC3E35]"
                  disabled={signingOut}
                  onClick={() => setConfirmingSignOut(true)}
                >
                  {signingOut ? <Spinner /> : 'Sign out'}
                </button>
            
        </section>

        {/* =========================================
            DANGER ZONE
        ========================================== */}
        <section className="ios-settings-section danger-section">
          <div className="ios-section-label danger-label">
            DANGER ZONE
          </div>

             <button
                  type="button"
                  className="ios-delete-button"
                  
                  onClick={() => {}}
                >
                  {signingOut ? <Spinner /> : 'Delete Account'}
                </button>

         
        </section>

        <div className="ios-footer-note">
          <span>Profile</span>
          <span>•</span>
          <span>Account &amp; Session</span>
        </div>
      </div>

      <ConfirmSheet
        open={confirmingSignOut}
        title="Sign out"
        message="You'll be signed out of RemindMe on this device."
        confirmLabel="Sign out"
        busy={signingOut}
        onConfirm={() => void doSignOut()}
        onCancel={() => setConfirmingSignOut(false)}
      />

      <style>{iosTheme}</style>
    </section>
  );
}