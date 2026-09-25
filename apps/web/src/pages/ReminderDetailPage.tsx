import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useDeleteReminder, useReminder, useUpdateReminder } from '../hooks/queries';
import { formatDateTimeLocal, formatRelative, formatTime, repeatLabel } from '../lib/format';
import { StatusChip } from '../components/StatusChip';
import { Spinner } from '../components/Spinner';
import { ErrorBanner } from '../components/ErrorBanner';
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

  if (reminder.isLoading) {
    return (
      <section className="ios-page">
        <div className="ios-loading">
          <Spinner label="Loading reminder…" />
        </div>
      </section>
    );
  }

  if (reminder.error || !reminder.data) {
    return (
      <section className="ios-page">

        <div className="ios-error-card">
          <ErrorBanner message={reminder.error?.message ?? 'Reminder not found'} />
        </div>
      </section>
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
      <div className="ios-container">
        {/* Header */}
        <header className="ios-header mt-10">
          <div className="ios-title-row">
            <div className="ios-title-wrap">
              <span className={`ios-status-dot ${r.isEnabled ? 'active' : 'paused'}`} />

              <div>
                <h1>{r.title}</h1>
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
                                    stroke="#FF3B30"
                                    stroke-width="1.8"
                                    stroke-linecap="round"/>

                              <path d="M9 4H15"
                                    stroke="#FF3B30"
                                    stroke-width="1.8"
                                    stroke-linecap="round"/>


                              <path d="M7 7.5L7.7 19C7.77 20.1 8.68 21 9.78 21H14.22C15.32 21 16.23 20.1 16.3 19L17 7.5"
                                    stroke="#FF3B30"
                                    stroke-width="1.8"
                                    stroke-linecap="round"
                                    stroke-linejoin="round"/>


                              <path d="M10 11V17"
                                    stroke="#FF3B30"
                                    stroke-width="1.6"
                                    stroke-linecap="round"/>

                              <path d="M14 11V17"
                                    stroke="#FF3B30"
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
            <span className="ios-back-icon text-white p-2">‹</span>
          </Link>
                    </LiquidGlass>
              </div>
            </div>
          </div>

         
        </header>

        {/* Error */}
        {error && (
          <div className="ios-error-wrapper">
            <ErrorBanner message={error} />
          </div>
        )}

        {/* Overview */}
        <section className="ios-section">
          <div className="ios-section-label">REMINDER</div>

          <div className="ios-card">
            <div className="ios-divider" />

            <div className="ios-row ios-row-top">
              <div className="ios-row-label">
                <span className="ios-row-icon blue">✦</span>
                Message
              </div>

              <div className="ios-row-value ios-message">
                {r.message}
              </div>
            </div>
          </div>
        </section>

        {/* Schedule */}
        <section className="ios-section">
          <div className="ios-section-label">SCHEDULE</div>

          <div className="ios-card">
            <div className="ios-row">
              <div className="ios-row-label">
                <span className="ios-row-icon orange">◷</span>
                Next call
              </div>

              <div className="ios-row-value">
                {r.nextLocal ? (
                  <div className="ios-primary-value">
                    <strong>
                      {formatTime(r.timezone, r.nextLocal)}
                    </strong>

                 

                    <span className="ios-relative-value">
                      {formatRelative(r.nextLocal)}
                    </span>
                  </div>
                ) : (
                  '—'
                )}
              </div>
            </div>

            <div className="ios-divider" />

            <div className="ios-row">
              <div className="ios-row-label">
                <span className="ios-row-icon pink">↻</span>
                Repeats
              </div>

              <div className="ios-row-value">
                {repeatLabel(r.repeatRule)}
              </div>
            </div>

            <div className="ios-divider" />

          </div>
        </section>

        {/* Call information */}
        <section className="ios-section">
          <div className="ios-section-label">CALL INFORMATION</div>

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
        {confirmingDelete && (
          <div className="ios-popup-backdrop fixed inset-0 z-[60] flex items-center justify-center bg-black/60 px-4 backdrop-blur-[3px]">
            <div
              className="
                ios-popup-card
                relative
                w-[430px]
                max-w-full
                rounded-[28px]
                border border-white/[0.07]
                bg-gradient-to-b from-[#2a2d32] to-[#1b1d21]
                px-5 pt-[25px] pb-5
                text-center
                shadow-[0_30px_70px_rgba(0,0,0,0.55),inset_0_1px_0_rgba(255,255,255,0.04)]
              "
            >
              {/* Title */}
              <h2
                className="
                  mb-[30px]
                  text-[24px]
                  font-medium
                  leading-[1.15]
                  tracking-[-0.5px]
                  text-[#f5f5f7]
                "
              >
                Delete Reminder
              </h2>

              {/* Message */}
              <p
                className="
                  mb-[43px]
                  text-[20px]
                  font-normal
                  leading-[1.35]
                  tracking-[-0.2px]
                  text-[#f5f5f7]
                "
              >
                Are you sure you want to delete this reminder? This action cannot be undone.
              </p>

              {/* Buttons */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void doDelete()}
                  className="
                    flex
                    h-[70px]
                    items-center
                    justify-center
                    gap-2
                    rounded-full
                    border-0
                    bg-gradient-to-b from-[#168cff] to-[#087cf0]
                    text-[21px]
                    font-medium
                    tracking-[-0.25px]
                    text-white
                    shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]
                    transition
                    active:scale-[0.97]
                    disabled:opacity-50
                  "
                >
                  {busy ? 'Deleting…' : 'Delete'}
                </button>

                <button
                  type="button"
                  disabled={busy}
                  onClick={() => setConfirmingDelete(false)}
                  className="
                    flex
                    h-[70px]
                    items-center
                    justify-center
                    rounded-full
                    border-0
                    bg-gradient-to-b from-[#41464e] to-[#373c43]
                    text-[21px]
                    font-medium
                    tracking-[-0.25px]
                    text-white/90
                    shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]
                    transition
                    active:scale-[0.97]
                    disabled:opacity-50
                  "
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

      <style>{`
        :root {
          color-scheme: dark;

          --ios-bg: #000000;
          --ios-card: #1c1c1e;
          --ios-card-secondary: #2c2c2e;

          --ios-text: #f5f5f7;
          --ios-secondary: #98989f;
          --ios-tertiary: #636366;

          --ios-separator: rgba(84, 84, 88, 0.55);

          --ios-blue: #0a84ff;
          --ios-green: #30d158;
          --ios-orange: #ff9f0a;
          --ios-red: #ff453a;
          --ios-purple: #bf5af2;
          --ios-pink: #ff375f;
          --ios-cyan: #64d2ff;
        }

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
          background: #2c2c2e;
          box-shadow:
            inset 0 0 0 1px rgba(255, 255, 255, 0.035),
            0 1px 2px rgba(0, 0, 0, 0.3);
        }

        .ios-action-button.secondary:hover {
          background: #38383a;
        }

        .ios-action-button.green {
          color: #061b0b;
          background: var(--ios-green);
        }

        .ios-action-button.destructive {
          color: white;
          background: var(--ios-red);
        }

        .ios-action-button.destructive-outline {
          color: var(--ios-red);
          background: rgba(255, 69, 58, 0.11);
        }

        .ios-action-button.destructive-outline:hover {
          background: rgba(255, 69, 58, 0.18);
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
          background: #3a3a3c;
        }

        .ios-row-icon.blue {
          background: rgba(10, 132, 255, 0.22);
          color: var(--ios-blue);
        }

        .ios-row-icon.green {
          background: rgba(48, 209, 88, 0.18);
          color: var(--ios-green);
        }

        .ios-row-icon.orange {
          background: rgba(255, 159, 10, 0.18);
          color: var(--ios-orange);
        }

        .ios-row-icon.purple {
          background: rgba(191, 90, 242, 0.18);
          color: var(--ios-purple);
        }

        .ios-row-icon.pink {
          background: rgba(255, 55, 95, 0.18);
          color: var(--ios-pink);
        }

        .ios-row-icon.cyan {
          background: rgba(100, 210, 255, 0.18);
          color: var(--ios-cyan);
        }

        .ios-row-icon.gray {
          background: rgba(142, 142, 147, 0.18);
          color: #aeaeb2;
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
          background: #2c2c2e;
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
          background: #2c2c2e;
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

        /* Popup */

        @keyframes ios-pop {
          0% {
            opacity: 0;
            transform: scale(0.6) translateY(16px);
          }

          60% {
            opacity: 1;
            transform: scale(1.05) translateY(-3px);
          }

          100% {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }

        .ios-popup-card {
          transform-origin: center;
          animation: ios-pop 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) both;
        }

        @keyframes ios-backdrop {
          from {
            opacity: 0;
          }

          to {
            opacity: 1;
          }
        }

        .ios-popup-backdrop {
          animation: ios-backdrop 0.22s ease-out both;
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

          .ios-popup-card,
          .ios-popup-backdrop {
            animation: none;
          }
        }
      `}</style>
    </section>
  );
}
