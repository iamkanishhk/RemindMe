import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useClerk, useUser } from '@clerk/react';
import { useDeleteMe, useMe } from '../hooks/queries';
import { formatDateTimeLocal } from '../lib/format';
import { Spinner } from '../components/Spinner';
import { SkeletonRow } from '../components/Skeleton';
import { useErrorToast } from '../components/Toast';
import ConfirmSheet from '../components/ConfirmSheet';
import { iosTheme } from './iosTheme';
import { GlassButton } from '../components/GlassButton';
import { resolveDisplayName } from '../lib/displayName';
import SoftAurora from '../components/SoftAurora';

export default function ProfilePage() {
  const me = useMe();
  const { user } = useUser();
  const { signOut } = useClerk();
  const navigate = useNavigate();
  const deleteMe = useDeleteMe();

  const [busy, setBusy] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [confirmingSignOut, setConfirmingSignOut] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [error, setError] = useState('');

  useErrorToast(error);

  const email =
    me.data?.email ?? user?.primaryEmailAddress?.emailAddress ?? '';

  const name =
    resolveDisplayName(user?.fullName, email) ?? 'RemindMe';

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

  return (
    <section className="ios-settings-page">
          <SoftAurora
              colorStops={["#AE897F","#B26B56","#B35443"]}
              blend={0.5}
              amplitude={1}
              speed={1}
              className="fixed inset-0 w-full h-full opacity-20 pointer-events-none"
            />
            
      <div className="ios-settings-container max-h-[85vh]">
          <GlassButton 
                       displacementScale={64}
                       saturation={130}
                       aberrationIntensity={2}
                       elasticity={0.35}
                       cornerRadius={100}
                      blurAmount={0.1}
                      padding="15px"
                      style={{ 
                        width: 15,
                        height: 15,
                        top: 20,
                        left: 30,
                        position: 'fixed',
                       }}
                        >
                        <Link to="/settings" className="ios-back">
                      <span className="ios-back-icon text-[color:var(--text)] p-2">‹</span>
                    </Link>
                              </GlassButton>
        {/* Header */}
        <header className="ios-settings-header mt-15">
          <h1>Profile</h1>
         
        </header>

        {/* =========================================
            IDENTITY
        ========================================== */}
        <section className="ios-settings-section">
      
            <div className="ios-profile-card">
              <div className="ios-avatar">
                {avatarUrl ? (
                  <img src={avatarUrl} alt={name} className="z-10" />
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
                  className="ios-settings-card w-full h-[5vh] text-[color:var(--danger)]"
                  disabled={signingOut}
                  onClick={() => setConfirmingSignOut(true)}
                >
                  {signingOut ? <Spinner /> : 'Sign out'}
                </button>
            
        </section>

        {/* =========================================
            DANGER ZONE
        ========================================== */}
        {/* <section className="ios-settings-section danger-section">
          <div className="ios-section-label danger-label">
            DANGER ZONE
          </div>

             <button
                  type="button"
                  className="ios-delete-button"
                  disabled={busy}
                  onClick={() => setConfirmingDelete(true)}
                >
                  {busy ? <Spinner /> : 'Delete Account'}
                </button>

         
        </section> */}

        <div className="ios-footer-note">
          <span>Profile</span>
          <span>•</span>
          <span>Account &amp; Session</span>
        </div>
      </div>

      <ConfirmSheet
        open={confirmingDelete}
        title="Delete account"
        message="Your account, reminders, and phone numbers will be permanently deleted. This can't be undone."
        confirmLabel="Delete"
        tone="destructive"
        busy={busy}
        onConfirm={() => void doDelete().finally(() => setConfirmingDelete(false))}
        onCancel={() => setConfirmingDelete(false)}
      />

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