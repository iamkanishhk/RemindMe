import { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useDeleteReminder, useReminder, useUpdateReminder } from '../hooks/queries';
import { formatDateTimeLocal } from '../lib/format';
import { Skeleton } from '../components/Skeleton';
import ErrorPage from '../components/ErrorPage';
import { useErrorToast } from '../components/Toast';
import ConfirmSheet from '../components/ConfirmSheet';
import LiquidGlass from 'liquid-glass-react';
import SoftAurora from '../components/SoftAurora';

export default function ReminderDetailPage() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const reminder = useReminder(id);
  const update = useUpdateReminder(id);
  const remove = useDeleteReminder();

  const [busy, setBusy] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [error, setError] = useState('');

  // Local optimistic state for instant toggle response
  const [localEnabled, setLocalEnabled] = useState<boolean | null>(null);

  // Sync local state when reminder data loads or changes
  useEffect(() => {
    if (reminder.data) {
      setLocalEnabled(reminder.data.isEnabled);
    }
  }, [reminder.data]);

  useErrorToast(error);

  if (reminder.isLoading) {
    return (
      <section
        className="min-h-screen w-full bg-[color:var(--bg)] text-[color:var(--text)] px-4 pt-12 pb-24"
        aria-busy="true"
      >
        <div className="mx-auto max-w-md space-y-6">
          {/* Header Skeleton */}
          <div className="flex flex-col items-center gap-3 pt-6 pb-2 text-center">
            <Skeleton className="h-20 w-20 rounded-full" />
            <Skeleton className="h-6 w-3/4 rounded-lg" />
            <Skeleton className="h-4 w-1/2 rounded-md" />
          </div>

          {/* Grouped List Skeleton */}
          <div className="space-y-2">
            <Skeleton className="h-3 w-28 ml-4 rounded" />
            <div className="rounded-2xl bg-[color:var(--surface)] p-4 space-y-4">
              <div className="flex justify-between items-center">
                <Skeleton className="h-4 w-20 rounded" />
                <Skeleton className="h-4 w-32 rounded" />
              </div>
              <div className="h-[0.5px] bg-[color:var(--border)]" />
              <div className="flex justify-between items-center">
                <Skeleton className="h-4 w-24 rounded" />
                <Skeleton className="h-4 w-28 rounded" />
              </div>
              <div className="h-[0.5px] bg-[color:var(--border)]" />
              <div className="flex justify-between items-center">
                <Skeleton className="h-4 w-16 rounded" />
                <Skeleton className="h-4 w-36 rounded" />
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (reminder.error || !reminder.data) {
    return (
      <ErrorPage
        message={reminder.error?.message ?? 'Reminder not found'}
        title="Couldn't load reminder"
        onRetry={() => void reminder.refetch()}
        secondary={{ label: 'Go to dashboard', onClick: () => navigate('/') }}
      />
    );
  }

  const r = reminder.data;
  const isEnabled = localEnabled ?? r.isEnabled;

  async function toggle() {
    const nextState = !isEnabled;
    // Instant UI feedback via local state
    setLocalEnabled(nextState);
    setError('');

    try {
      await update.mutateAsync({ isEnabled: nextState });
    } catch (e) {
      // Revert back on error
      setLocalEnabled(r.isEnabled);
      setError(e instanceof Error ? e.message : 'Could not update reminder');
    }
  }

  async function doDelete() {
    setBusy(true);
    setError('');

    try {
      await remove.mutateAsync(r.id);
      navigate('/', { replace: true });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not delete reminder');
      setBusy(false);
      setConfirmingDelete(false);
    }
  }

  return (
    <section className="ios-page">
      <SoftAurora
        colorStops={["#AE897F","#B26B56","#B35443"]}
        blend={0.5}
        amplitude={1}
        speed={1}
        className="fixed inset-0 w-full h-full opacity-20"
      />
      
      {/* Liquid Glass Floating Buttons */}
      <LiquidGlass
        displacementScale={64}
        saturation={130}
        aberrationIntensity={2}
        elasticity={0.35}
        cornerRadius={100}
        blurAmount={0.1}
        padding="15px"
        style={{
          width: 50,
          height: 20,
          top: 15,
          right: 60,
          position: 'fixed',
          zIndex: 50,
        }}
      >
        <div className="flex items-center gap-5 justify-center">
          <button
            onClick={() => void toggle()}
            className="w-10 text-[color:var(--text)] font-medium active:opacity-60 transition-opacity cursor-pointer"
            aria-label={isEnabled ? 'Pause reminder' : 'Play reminder'}
          >
            {isEnabled ? '| |' : '▶'}
          </button>

          <button
            type="button"
            className="w-10 active:opacity-60 transition-opacity cursor-pointer"
            onClick={() => setConfirmingDelete(true)}
            aria-label="Delete reminder"
          >
            <svg
              width="35"
              height="35"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M5 7H19"
                style={{ stroke: 'var(--danger, #FF453A)' }}
                strokeWidth="1.8"
                strokeLinecap="round"
              />
              <path
                d="M9 4H15"
                style={{ stroke: 'var(--danger, #FF453A)' }}
                strokeWidth="1.8"
                strokeLinecap="round"
              />
              <path
                d="M7 7.5L7.7 19C7.77 20.1 8.68 21 9.78 21H14.22C15.32 21 16.23 20.1 16.3 19L17 7.5"
                style={{ stroke: 'var(--danger, #FF453A)' }}
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M10 11V17"
                style={{ stroke: 'var(--danger, #FF453A)' }}
                strokeWidth="1.6"
                strokeLinecap="round"
              />
              <path
                d="M14 11V17"
                style={{ stroke: 'var(--danger, #FF453A)' }}
                strokeWidth="1.6"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>
      </LiquidGlass>

      <LiquidGlass
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
          zIndex: 50,
        }}
      >
        <Link to="/" className="ios-back flex items-center justify-center w-full h-full">
          <span className="text-[color:var(--text)] text-xl font-light">‹</span>
        </Link>
      </LiquidGlass>

      {/* Main Mobile Screen Layout */}
      <div className="ios-container">
        <div className="flex justify-center items-center mt-5 mb-5">
          <img
            src="./../assets/done.png"
            width="200"
            height="20vh"
            className="opacity-70"
            alt="Call icon"
          />
        </div>
        
        {/* Header Hero Section */}
        <header className="ios-hero-header">
          <div className="ios-status-badge">
            <span className={`ios-status-dot ${isEnabled ? 'active' : 'paused'}`} />
            <span className="ios-status-text">{isEnabled ? 'Active' : 'Paused'}</span>
          </div>

          <h1 className="ios-title">
            I'll Call You for <span className="text-[color:var(--text)] font-semibold">{r.title}</span>
          </h1>
          <p className="ios-subtitle">{formatDateTimeLocal(r.scheduledAt)}</p>
        </header>

        {/* Formatted Inset Grouped Section */}
        <section className="ios-group">
          <div className="ios-group-label">CALL INFORMATION</div>

          <div className="ios-card">
            <div className="ios-row">
              <span className="ios-row-label">Message</span>
              <span className="ios-row-value">{r.message || '—'}</span>
            </div>

            <div className="ios-divider" />

            <div className="ios-row">
              <span className="ios-row-label">Calls</span>
              <span className="ios-row-value mono">{r.phoneNumber?.e164 ?? '—'}</span>
            </div>

            <div className="ios-divider" />

            <div className="ios-row">
              <span className="ios-row-label">Created</span>
              <span className="ios-row-value">{formatDateTimeLocal(r.createdAt)}</span>
            </div>
          </div>
        </section>
      </div>

      {/* iOS Modal Popup Sheet */}
      <ConfirmSheet
        open={confirmingDelete}
        title="Delete Reminder"
        message="Are you sure you want to delete this reminder? This action cannot be undone."
        confirmLabel="Delete"
        tone="destructive"
        busy={busy}
        onConfirm={() => void doDelete()}
        onCancel={() => setConfirmingDelete(false)}
      />

      <style>{`
        .ios-page {
          min-height: 100vh;
          width: 100%;
          background-color: var(--bg);
          color: var(--text);
          font-family: var(--font);
          -webkit-font-smoothing: antialiased;
          padding-top: 80px;
          padding-bottom: 40px;
        }

        .ios-container {
          width: 100%;
          max-width: 440px;
          margin: 0 auto;
          padding: 0 16px;
        }

        /* Hero Header Styling */
        .ios-hero-header {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          margin-bottom: 32px;
          padding: 0 8px;
        }

        .ios-status-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: var(--ios-card);
          padding: 4px 12px;
          border-radius: 20px;
          margin-bottom: 16px;
        }

        .ios-status-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
        }

        .ios-status-dot.active {
          background-color: var(--success);
        }

        .ios-status-dot.paused {
          background-color: var(--text-dim);
        }

        .ios-status-text {
          font-size: 13px;
          font-weight: 500;
          color: var(--text-dim);
          text-transform: uppercase;
          letter-spacing: 0.02em;
        }

        .ios-title {
          font-size: 24px;
          line-height: 1.25;
          font-weight: 400;
          color: var(--text-dim);
          letter-spacing: -0.02em;
          margin: 0 0 8px 0;
        }

        .ios-subtitle {
          font-size: 15px;
          color: var(--primary);
          font-weight: 500;
          margin: 0;
        }

        /* Grouped Card Styling */
        .ios-group {
          margin-top: 24px;
        }

        .ios-group-label {
          padding: 0 0 8px 16px;
          color: var(--text-dim);
          font-size: 13px;
          font-weight: 400;
          letter-spacing: -0.01em;
          text-transform: uppercase;
        }

        .ios-card {
          background: var(--ios-card);
          border-radius: 16px;
          overflow: hidden;
        }

        .ios-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 14px 16px;
          min-height: 48px;
          gap: 16px;
        }

        .ios-row-label {
          color: var(--text);
          font-size: 16px;
          font-weight: 400;
          letter-spacing: -0.01em;
          flex-shrink: 0;
        }

        .ios-row-value {
          color: var(--text-dim);
          font-size: 16px;
          font-weight: 400;
          text-align: right;
          word-break: break-word;
        }

        .ios-row-value.mono {
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
          font-size: 15px;
        }

        .ios-divider {
          height: 0.5px;
          background-color: var(--border);
          margin-left: 16px;
        }
      `}</style>
    </section>
  );
}