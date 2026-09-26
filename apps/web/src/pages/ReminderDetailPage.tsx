import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useDeleteReminder, useReminder, useUpdateReminder } from '../hooks/queries';
import { formatDateTimeLocal, formatRelative, formatTime, repeatLabel } from '../lib/format';
import { Skeleton } from '../components/Skeleton';
import ErrorPage from '../components/ErrorPage';
import { useErrorToast } from '../components/Toast';
import ConfirmSheet from '../components/ConfirmSheet';
import LiquidGlass from 'liquid-glass-react';

export default function ReminderDetailPage() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const reminder = useReminder(id);
  const update = useUpdateReminder(id);
  const remove = useDeleteReminder();

  const [busy, setBusy] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [error, setError] = useState('');

  useErrorToast(error);

  if (reminder.isLoading) {
    return (
      <section
        className="min-h-screen w-full bg-[color:var(--bg)] text-[color:var(--text)]"
        aria-busy="true"
      >
        <div className="mx-auto w-full max-w-[920px] px-4 pb-24 pt-9">
          {/* Header */}
          <div className="flex items-start gap-3.5 skeleton-area">
            <Skeleton className="mt-[13px] h-3 w-3 rounded-full" />
            <Skeleton className="h-[44px] w-3/5 rounded-xl" />
          </div>

          {/* REMINDER */}
          <div className="mt-7">
            <div className="px-4 pb-2.5">
              <Skeleton className="h-3 w-24" />
            </div>
            <div className="overflow-hidden rounded-[16px] bg-[color:var(--surface)] skeleton-area">
              <div className="grid grid-cols-[minmax(130px,0.75fr)_minmax(0,1.5fr)] items-center gap-5 px-[17px] py-3">
                <div className="flex items-center gap-[11px]">
                  <Skeleton className="h-7 w-7 rounded-lg" />
                  <Skeleton className="h-4 w-24" />
                </div>
                <div className="justify-self-end">
                  <Skeleton className="h-4 w-40" />
                </div>
              </div>
            </div>
          </div>

          {/* SCHEDULE */}
          <div className="mt-7">
            <div className="px-4 pb-2.5">
              <Skeleton className="h-3 w-28" />
            </div>
            <div className="overflow-hidden rounded-[16px] bg-[color:var(--surface)] skeleton-area">
              {[
                ['w-32', 'w-48'],
                ['w-44', 'w-36'],
                ['w-36', 'w-44'],
              ].map(([label, value], i) => (
                <div
                  key={i}
                  className={`grid grid-cols-[minmax(130px,0.75fr)_minmax(0,1.5fr)] items-center gap-5 px-[17px] py-3 ${
                    i < 2 ? 'border-b border-[rgba(84,84,88,0.55)]' : ''
                  }`}
                >
                  <Skeleton className={`h-4 ${label}`} />
                  <div className="justify-self-end">
                    <Skeleton className={`h-4 ${value}`} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* CALL INFORMATION */}
          <div className="mt-7">
            <div className="px-4 pb-2.5">
              <Skeleton className="h-3 w-[120px]" />
            </div>
            <div className="overflow-hidden rounded-[16px] bg-[color:var(--surface)] skeleton-area">
              {[0, 1].map((i) => (
                <div
                  key={i}
                  className={`grid grid-cols-[minmax(130px,0.75fr)_minmax(0,1.5fr)] items-center gap-5 px-[17px] py-3 ${
                    i === 0 ? 'border-b border-[rgba(84,84,88,0.55)]' : ''
                  }`}
                >
                  <Skeleton className="h-4 w-24" />
                  <div className="justify-self-end">
                    <Skeleton className="h-4 w-40" />
                  </div>
                </div>
              ))}
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

  async function toggle() {
    setBusy(true);
    setError('');

    try {
      await update.mutateAsync({ isEnabled: !r.isEnabled });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not update reminder');
    } finally {
      setBusy(false);
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
      <div className="ios-container rise-in">
        {/* Header */}
        <header className="ios-header mt-30 mb-20">
          <div className="">
            <div className="ios-title-wrap">
              <span className={`ios-status-dot ${r.isEnabled ? 'active' : 'paused'}`} />

              <div className="w-full h-[20vh] flex flex-col items-center justify-center gap-3  p-6 text-center">
                <img src="./../assets/done.png" width="200" height="20vh" className="opacity-70" alt="Call icon">
                </img>
                <h1>We'll Call You for {r.title} on {formatDateTimeLocal(r.scheduledAt)} at  {r.phoneNumber?.e164 ?? '—'} </h1>
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
                           }}
                            >
                           <div className="flex items-center gap-5 justify-center">
                             <button
                              disabled={busy}
                              onClick={() => void toggle()}
                              className="w-10">
                              {r.isEnabled ? '| |' : '▶'}
                            </button>


                                <button
                                  type="button"
                                  className="w-10"
                                  onClick={() => setConfirmingDelete(true)}
                                >
                                   <svg width="35" height="35" viewBox="0 0 24 24" fill="none " 
                                xmlns="http://www.w3.org/2000/svg">

                              <path d="M5 7H19"
                                    style={{ stroke: 'var(--danger)' }}
                                    stroke-width="1.8"
                                    stroke-linecap="round"/>

                              <path d="M9 4H15"
                                    style={{ stroke: 'var(--danger)' }}
                                    stroke-width="1.8"
                                    stroke-linecap="round"/>


                              <path d="M7 7.5L7.7 19C7.77 20.1 8.68 21 9.78 21H14.22C15.32 21 16.23 20.1 16.3 19L17 7.5"
                                    style={{ stroke: 'var(--danger)' }}
                                    stroke-width="1.8"
                                    stroke-linecap="round"
                                    stroke-linejoin="round"/>


                              <path d="M10 11V17"
                                    style={{ stroke: 'var(--danger)' }}
                                    stroke-width="1.6"
                                    stroke-linecap="round"/>

                              <path d="M14 11V17"
                                    style={{ stroke: 'var(--danger)' }}
                                    stroke-width="1.6"
                                    stroke-linecap="round"/>
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
             }}
              >
              <Link to="/" className="ios-back">
            <span className="ios-back-icon text-[color:var(--text)] p-2">‹</span>
          </Link>
                    </LiquidGlass>
              </div>
            </div>
          </div>

         
        </header>

    

        {/* Call information */}

        
        <section className="ios-section ">
          <div className="ios-section-label">CALL INFORMATION</div>
              
          <div className="ios-card">
                <div className="ios-row ">
              <div className="ios-row-label">
                <span className="ios-row-icon blue">✦</span>
                Message
              </div>

              <div className="ios-row-value ios-message">
                {r.message}
              </div>
            </div>
            </div>

          <div className="ios-card">
            <div className="ios-row">
              <div className="ios-row-label">
                <span className="ios-row-icon green">☎</span>
                Calls
              </div>

              <div className="ios-row-value ios-mono">
                {r.phoneNumber?.e164 ?? '—'}
              </div>
            </div>

            <div className="ios-divider" />

          
            <div className="ios-divider" />

            <div className="ios-row">
              <div className="ios-row-label">
                <span className="ios-row-icon gray">＋</span>
                Created
              </div>

              <div className="ios-row-value">
                {formatDateTimeLocal(r.createdAt)}
              </div>
            </div>
          </div>
        </section>

      </div>

        {/* iOS Popup */}
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
          background:
            radial-gradient(
              circle at 50% -10%,
              rgba(35, 35, 40, 0.8),
              transparent 38%
            ),
            var(--ios-bg);
          color: var(--ios-text);
          font-family:
            -apple-system,
            BlinkMacSystemFont,
            "SF Pro Display",
            "SF Pro Text",
            system-ui,
            sans-serif;
          -webkit-font-smoothing: antialiased;
          text-rendering: optimizeLegibility;
          box-sizing: border-box;
        }

        .ios-page *,
        .ios-page *::before,
        .ios-page *::after {
          box-sizing: border-box;
        }

        .ios-container {
          width: min(100% - 32px, 920px);
          margin: 0 auto;
          padding: 20px 0 80px;
        }

        /* Navigation */

        .ios-nav {
          height: 44px;
          display: flex;
          align-items: center;
          margin-bottom: 10px;
        }

        .ios-back {
          display: inline-flex;
          align-items: center;
          gap: 3px;
          color: var(--ios-blue);
          text-decoration: none;
          font-size: 17px;
          font-weight: 400;
          letter-spacing: -0.01em;
          transition: opacity 0.15s ease;
        }

        .ios-back:hover {
          opacity: 0.65;
        }

        .ios-back-icon {
          font-size: 34px;
          font-weight: 300;
          line-height: 16px;
          transform: translateY(-1px);
        }

        /* Header */

        .ios-header {
          padding: 18px 0 30px;
        }

        .ios-title-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
        }

        .ios-title-wrap {
          display: flex;
          align-items: flex-start;
          gap: 14px;
          min-width: 0;
        }

        .ios-status-dot {
          width: 12px;
          height: 12px;
          min-width: 12px;
          margin-top: 13px;
          border-radius: 50%;
          box-shadow: 0 0 18px currentColor;
        }

        .ios-status-dot.active {
          background: var(--ios-green);
          color: var(--ios-green);
        }

        .ios-status-dot.paused {
          background: var(--ios-tertiary);
          color: var(--ios-tertiary);
          box-shadow: none;
        }

        .ios-header h1 {
          margin: 0;
          color: var(--ios-text);
          font-size: clamp(30px, 5vw, 42px);
          line-height: 1.1;
          font-weight: 700;
          letter-spacing: -0.035em;
          overflow-wrap: anywhere;
        }

        .ios-title-meta {
          margin-top: 10px;
        }

        /* Actions */

        .ios-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 9px;
          margin-top: 24px;
        }

        .ios-action-button {
          appearance: none;
          border: 0;
          min-height: 42px;
          padding: 0 15px;
          border-radius: 12px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 7px;
          font-family: inherit;
          font-size: 15px;
          font-weight: 600;
          letter-spacing: -0.01em;
          text-decoration: none;
          cursor: pointer;
          transition:
            transform 0.12s ease,
            opacity 0.12s ease,
            background 0.12s ease;
        }

        .ios-action-button:active {
          transform: scale(0.97);
        }

        .ios-action-button:disabled {
          cursor: default;
          opacity: 0.45;
        }

        .ios-action-button.secondary {
          color: var(--ios-text);
          background: var(--surface-2);
          box-shadow:
            inset 0 0 0 1px rgba(255, 255, 255, 0.035),
            0 1px 2px rgba(0, 0, 0, 0.3);
        }

        .ios-action-button.secondary:hover {
          background: var(--surface-3);
        }

        .ios-action-button.green {
          color: var(--success);
          background: var(--ios-green);
        }

        .ios-action-button.destructive {
          color: white;
          background: var(--ios-red);
        }

        .ios-action-button.destructive-outline {
          color: var(--ios-red);
          background: color-mix(in srgb, var(--ios-red) 11%, transparent);
        }

        .ios-action-button.destructive-outline:hover {
          background: color-mix(in srgb, var(--ios-red) 18%, transparent);
        }

        .ios-action-icon {
          font-size: 15px;
          line-height: 1;
          opacity: 0.9;
        }

        /* Errors */

        .ios-error-wrapper,
        .ios-error-card {
          margin-bottom: 22px;
        }

        /* Sections */

        .ios-section {
          margin-top: 28px;
        }

        .ios-section-label {
          padding: 0 16px 9px;
          color: var(--ios-secondary);
          font-size: 12px;
          font-weight: 600;
          letter-spacing: 0.06em;
          text-transform: uppercase;
        }

        .ios-section-heading {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 16px 10px;
        }

        .ios-section-heading .ios-section-label {
          padding: 0;
        }

        .ios-section-heading h2 {
          margin: 4px 0 0;
          font-size: 22px;
          line-height: 1.2;
          font-weight: 700;
          letter-spacing: -0.025em;
        }

        /* Cards */

        .ios-card,
        .ios-history-card {
          overflow: hidden;
          background: var(--ios-card);
          border-radius: 16px;
          box-shadow:
            0 1px 0 rgba(255, 255, 255, 0.025) inset,
            0 10px 30px rgba(0, 0, 0, 0.14);
        }

        .ios-row {
          min-height: 60px;
          padding: 12px 17px;
          display: grid;
          grid-template-columns: minmax(130px, 0.75fr) minmax(0, 1.5fr);
          align-items: center;
          gap: 20px;
        }

        .ios-row-top {
          align-items: start;
        }

        .ios-divider {
          height: 1px;
          margin-left: 17px;
          background: var(--ios-separator);
        }

        .ios-row-label {
          display: flex;
          align-items: center;
          gap: 11px;
          color: var(--ios-secondary);
          font-size: 15px;
          font-weight: 400;
        }

        .ios-row-value {
          min-width: 0;
          color: var(--ios-text);
          text-align: right;
          font-size: 16px;
          font-weight: 400;
          line-height: 1.45;
          overflow-wrap: anywhere;
        }

        .ios-message {
          white-space: pre-wrap;
        }

        .ios-row-icon {
          width: 28px;
          height: 28px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          flex: 0 0 28px;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 700;
          color: white;
          background: var(--surface-3);
        }

        .ios-row-icon.blue {
          background: color-mix(in srgb, var(--ios-blue) 22%, transparent);
          color: var(--ios-blue);
        }

        .ios-row-icon.green {
          background: color-mix(in srgb, var(--ios-green) 18%, transparent);
          color: var(--ios-green);
        }

        .ios-row-icon.orange {
          background: color-mix(in srgb, var(--ios-orange) 18%, transparent);
          color: var(--ios-orange);
        }

        .ios-row-icon.purple {
          background: color-mix(in srgb, var(--ios-purple) 18%, transparent);
          color: var(--ios-purple);
        }

        .ios-row-icon.pink {
          background: color-mix(in srgb, var(--ios-pink) 18%, transparent);
          color: var(--ios-pink);
        }

        .ios-row-icon.cyan {
          background: rgba(100, 210, 255, 0.18);
          color: var(--ios-cyan);
        }

        .ios-row-icon.gray {
          background: rgba(142, 142, 147, 0.18);
          color: var(--text-muted);
        }

        .ios-primary-value {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 2px;
        }

        .ios-primary-value strong {
          font-size: 17px;
          font-weight: 600;
          color: var(--ios-text);
        }

        .ios-secondary-value {
          color: var(--ios-secondary);
          font-size: 13px;
        }

        .ios-relative-value {
          color: var(--ios-blue);
          font-size: 13px;
          font-weight: 500;
        }

        .ios-mono {
          font-family:
            ui-monospace,
            SFMono-Regular,
            Menlo,
            Monaco,
            Consolas,
            monospace;
          font-size: 14px;
        }

        /* History */

        .ios-count {
          min-width: 28px;
          height: 28px;
          padding: 0 8px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border-radius: 999px;
          color: var(--ios-secondary);
          background: var(--surface-2);
          font-size: 13px;
          font-weight: 600;
        }

        .ios-history-item {
          position: relative;
          padding: 17px;
        }

        .ios-history-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 15px;
        }

        .ios-history-duration {
          color: var(--ios-secondary);
          font-size: 14px;
          font-variant-numeric: tabular-nums;
        }

        .ios-history-details {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
          margin-top: 15px;
        }

        .ios-history-details > div {
          display: flex;
          flex-direction: column;
          gap: 3px;
          min-width: 0;
          color: var(--ios-text);
          font-size: 13px;
          line-height: 1.35;
        }

        .ios-history-label {
          color: var(--ios-tertiary);
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }

        .ios-history-detail {
          margin-top: 14px;
          padding: 11px 12px;
          border-radius: 10px;
          color: var(--ios-secondary);
          background: var(--surface-2);
          font-size: 13px;
          line-height: 1.45;
          overflow-wrap: anywhere;
        }

        .ios-history-divider {
          height: 1px;
          position: absolute;
          left: 17px;
          right: 0;
          bottom: 0;
          background: var(--ios-separator);
        }

        .ios-empty-card {
          padding: 30px 20px;
        }

        .ios-loading {
          min-height: 60vh;
          display: flex;
align-items: center;
            justify-content: center;
          }

          /* Responsive */

        @media (max-width: 680px) {
          .ios-container {
            width: min(100% - 24px, 920px);
            padding-top: 10px;
          }

          .ios-header {
            padding-top: 14px;
            padding-bottom: 22px;
          }

          .ios-header h1 {
            font-size: 30px;
          }

          .ios-actions {
            display: grid;
            grid-template-columns: 1fr 1fr;
          }

          .ios-action-button {
            width: 100%;
          }

          .ios-action-button.destructive,
          .ios-action-button.destructive-outline {
            grid-column: 1 / -1;
          }

          .ios-row {
            grid-template-columns: minmax(115px, 0.8fr) minmax(0, 1.2fr);
            gap: 14px;
            padding: 13px 14px;
          }

          .ios-divider {
            margin-left: 14px;
          }

          .ios-row-label {
            font-size: 14px;
          }

          .ios-row-value {
            font-size: 15px;
          }

          .ios-row-icon {
            width: 26px;
            height: 26px;
            flex-basis: 26px;
          }

          .ios-history-item {
            padding: 15px;
          }

          .ios-history-divider {
            left: 15px;
          }
        }

        @media (max-width: 430px) {
          .ios-row {
            grid-template-columns: 1fr;
            gap: 7px;
            min-height: 0;
          }

          .ios-row-value {
            padding-left: 39px;
            text-align: left;
          }

          .ios-primary-value {
            align-items: flex-start;
          }

          .ios-history-details {
            grid-template-columns: 1fr;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .ios-action-button,
          .ios-back {
            transition: none;
          }
        }
      `}</style>
    </section>
  );
}
