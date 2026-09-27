import { Fragment, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCalls } from '../hooks/queries';
import { formatDateTimeLocal } from '../lib/format';
import { StatusChip } from '../components/StatusChip';
import { Spinner } from '../components/Spinner';
import { Skeleton } from '../components/Skeleton';
import ErrorPage from '../components/ErrorPage';
import CallDetailSheet from '../components/CallDetailSheet';
import LiquidGlass from 'liquid-glass-react';
import type { CallAttempt } from '../lib/types';

export default function HistoryPage() {
  const calls = useCalls();
  const navigate = useNavigate();
  const [selected, setSelected] = useState<CallAttempt | null>(null);

  if (calls.isLoading) {
    return (
      <section
        className="min-h-screen w-full bg-[color:var(--bg)] text-[color:var(--text)]"
        aria-busy="true"
      >
        <div className="mx-auto w-full max-w-[920px] px-4 pb-24 pt-9">
          {/* Header */}
          <div className="skeleton-area pb-6">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="mt-3 h-[52px] w-2/3 rounded-xl" />
            <Skeleton className="mt-2.5 h-4 w-full" />
          </div>

          <div>
            <div className="px-4 pb-2.5">
              <Skeleton className="h-3 w-28" />
            </div>

            <div className="overflow-hidden rounded-[17px] bg-[color:var(--surface)] skeleton-area">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="flex min-h-[60px] items-center justify-between gap-4 px-[17px] py-3"
                >
                  <div className="min-w-0 flex-1">
                    <Skeleton className="h-4 w-2/3" />
                    <Skeleton className="mt-2 h-3 w-1/3" />
                  </div>

                  <div className="flex shrink-0 items-center gap-2">
                    <Skeleton className="h-6 w-16 rounded-full" />
                    <Skeleton className="h-3 w-10" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (calls.isError) {
    return (
      <ErrorPage
        message={calls.error?.message ?? 'Could not load call history'}
        title="Couldn't load call history"
        onRetry={() => void calls.refetch()}
        secondary={{ label: 'Go to dashboard', onClick: () => navigate('/') }}
      />
    );
  }

  const attempts = calls.data?.pages.flatMap((p) => p.attempts) ?? [];

  return (
    <section className="ios-history-page">
      <div className="ios-history-container">
        {/* Page Header */}
        <header className="ios-page-header">

        <div className="flex mt-15">
              <span className="w-full text-4xl">Call history</span>
           <div className="flex items-center justify-center w-fit">
              <LiquidGlass 
             displacementScale={64}
             saturation={130}
             aberrationIntensity={2}
             elasticity={0.35}
             cornerRadius={100}
            blurAmount={0.1}
            padding="15px"
            style={{ 
              width: 20,
              height: 20,
              top: 25,
              right: 50,
              position: 'fixed',
              zIndex: 9999,
             }}
              >
              <svg width="40" height="40" viewBox="0 0 96 96" xmlns="http://www.w3.org/2000/svg">
                  <circle
                    cx="42"
                    cy="42"
                    r="19"
                    fill="none"
                    stroke="white"
                    stroke-width="8"
                  />
                  <line
                    x1="56"
                    y1="56"
                    x2="73"
                    y2="73"
                    stroke="white"
                    stroke-width="8"
                    stroke-linecap="round"
                  />
                </svg>
                    </LiquidGlass>
           </div>
          </div>
        </header>

        {/* Empty State */}
        {attempts.length === 0 ? (
          <div className="w-full flex flex-col items-center justify-center gap-3  p-6 text-center">
             <img src="/public/assets/call.png" width="auto" height="10vh" className="opacity-70" alt="Call icon">
</img>
            <div> no call history yet</div>
           
          </div>
        ) : (
          <>
            {/* Grouped history list, settings-card style */}
            <section className="ios-history-section ">
              <div className="ios-settings-card stagger">
                {attempts.map((a, index) => (
                  <Fragment key={a.id}>
                    {index > 0 && <div className="ios-divider" />}

                    <button
                      type="button"
                      className="ios-call-row"
                      onClick={() => setSelected(a)}
                    >
                      <div className="ios-call-row-leading">
                        <div className="ios-call-row-title">
                          {a.reminderTitle ?? a.reminderId ?? 'Untitled reminder'}
                        </div>
                        <div className="ios-call-row-sub">
                          {formatDateTimeLocal(a.startedAt)}
                        </div>
                      </div>

                      <div className="ios-call-row-trailing">
                        <StatusChip status={a.status} />

                        <span className="ios-call-row-detail">Detail</span>
                        <span className="ios-chevron" aria-hidden="true">
                          ›
                        </span>
                      </div>
                    </button>
                  </Fragment>
                ))}
              </div>
            </section>

            {/* Pagination */}
            {calls.hasNextPage ? (
              <div className="ios-pager">
                <button
                  type="button"
                  className="pressable ios-load-more"
                  disabled={calls.isFetchingNextPage}
                  onClick={() => void calls.fetchNextPage()}
                >
                  {calls.isFetchingNextPage ? (
                    <Spinner />
                  ) : (
                    <>
                      <span>Load more</span>
                      <span className="ios-load-chevron">⌄</span>
                    </>
                  )}
                </button>
              </div>
            ) : null}
          </>
        )}
      </div>

      <CallDetailSheet
        attempt={selected}
        onClose={() => setSelected(null)}
        onViewReminder={(reminderId) => {
          setSelected(null);
          navigate(`/reminders/${reminderId}`);
        }}
      />

      <style>{`
        .ios-history-page {
          min-height: 100vh;
          width: 100%;

          background:
            radial-gradient(
              ellipse 900px 450px at 50% -150px,
              rgba(50, 50, 55, 0.32),
              transparent 70%
            ),
            var(--ios-black);

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

        .ios-history-page *,
        .ios-history-page *::before,
        .ios-history-page *::after {
          box-sizing: border-box;
        }

        .ios-history-container {
          width: min(100% - 32px, 920px);
          margin: 0 auto;
          padding: 34px 0 150px;
        }

        /* --------------------------------
           Header
        -------------------------------- */

        .ios-page-header {
          margin-bottom: 34px;
        }

        .ios-eyebrow {
          margin-bottom: 8px;

          color: var(--ios-secondary);

          font-size: 12px;
          line-height: 1;
          font-weight: 600;

          letter-spacing: 0.07em;
          text-transform: uppercase;
        }

        .ios-title-row {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 20px;
        }

        .ios-page-header h1 {
          margin: 0;

          color: var(--ios-text);

          font-size: clamp(34px, 5vw, 44px);
          line-height: 1.08;
          font-weight: 700;

          letter-spacing: -0.04em;
        }

        .ios-page-header p {
          margin: 9px 0 0;

          color: var(--ios-secondary);

          font-size: 16px;
          line-height: 1.45;

          letter-spacing: -0.01em;
        }

       

        /* --------------------------------
           Section
        -------------------------------- */

        .ios-history-section {
          margin-top: 4px;
        }

        .ios-section-label {
          padding: 0 16px 10px;

          color: var(--ios-secondary);

          font-size: 12px;
          line-height: 1;

          font-weight: 600;
          letter-spacing: 0.06em;

          text-transform: uppercase;
        }

        /* --------------------------------
           Grouped card (settings style)
        -------------------------------- */

        .ios-settings-card {
          overflow: hidden;

          background: var(--ios-card);

          border-radius: 17px;

          box-shadow:
            inset 0 1px 0 rgba(255, 255, 255, 0.025),
            0 8px 30px rgba(0, 0, 0, 0.16);
        }

        .ios-divider {
          height: 1px;

          margin-left: 17px;

          background: var(--ios-separator);
        }

        /* --------------------------------
           Call row
        -------------------------------- */

        .ios-call-row {
          width: 100%;

          min-height: 60px;

          padding: 11px 17px;

          display: flex;
          align-items: center;
          justify-content: space-between;

          gap: 12px;

          background: none;
          border: 0;

          text-align: left;

          color: var(--ios-text);

          cursor: pointer;

          transition: background 0.15s ease;
        }

        .ios-call-row:hover {
          background: color-mix(in srgb, var(--ios-text) 4%, transparent);
        }

        .ios-call-row:active {
          transform: scale(0.995);
        }

        .ios-call-row-leading {
          min-width: 0;

          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .ios-call-row-title {
          color: var(--ios-text);

          font-size: 16px;
          line-height: 1.3;
          font-weight: 500;

          overflow-wrap: anywhere;
        }

        .ios-call-row-sub {
          color: var(--ios-secondary);

          font-size: 12px;
          line-height: 1.3;
        }

        .ios-call-row-trailing {
          flex: 0 0 auto;

          display: flex;
          align-items: center;
          gap: 8px;
        }

        .ios-call-row-detail {
          color: var(--ios-secondary);

          font-size: 14px;
          font-weight: 500;
        }

        .ios-chevron {
          flex: 0 0 auto;

          color: var(--ios-tertiary);

          font-size: 23px;
          line-height: 14px;
          font-weight: 300;
        }


        /* --------------------------------
           Pagination
        -------------------------------- */

        .ios-pager {
          display: flex;
          justify-content: center;

          margin-top: 22px;
        }

        .ios-load-more {
          min-width: 150px;
          min-height: 44px;

          padding: 0 18px;

          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;

          border: 0;
          border-radius: 12px;

          background: var(--surface-2);
          color: var(--ios-blue);

          font-family: inherit;

          font-size: 15px;
          font-weight: 600;

          cursor: pointer;

          transition:
            background 0.15s ease,
            transform 0.12s ease,
            opacity 0.15s ease;
        }

        .ios-load-more:hover {
          background: var(--surface-3);
        }

        .ios-load-more:active {
          transform: scale(0.97);
        }

        .ios-load-more:disabled {
          cursor: default;
          opacity: 0.5;
        }

        .ios-load-chevron {
          font-size: 17px;
          line-height: 1;
        }

        /* --------------------------------
           Empty state
        -------------------------------- */

        .ios-empty-card {
          min-height: 260px;

          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;

          padding: 35px 20px;

          background: var(--ios-card);

          border-radius: 17px;
        }

        .ios-empty-icon {
          width: 58px;
          height: 58px;

          margin-bottom: 14px;

          display: flex;
          align-items: center;
          justify-content: center;

          border-radius: 16px;

          background: color-mix(in srgb, var(--ios-blue) 14%, transparent);
          color: var(--ios-blue);

          font-size: 25px;
        }

        /* --------------------------------
           Error
        -------------------------------- */

        .ios-error-card {
          overflow: hidden;

          padding: 16px;

          background: color-mix(in srgb, var(--ios-red) 8%, transparent);

          border: 1px solid color-mix(in srgb, var(--ios-red) 16%, transparent);

          border-radius: 16px;
        }

        /* --------------------------------
           Loading
        -------------------------------- */

        .ios-loading {
          min-height: 65vh;

          display: flex;
          align-items: center;
          justify-content: center;
        }

        /* --------------------------------
           Tablet
        -------------------------------- */

        @media (max-width: 720px) {
          .ios-history-container {
            width: min(100% - 24px, 920px);
            padding-top: 24px;
          }
        }

        /* --------------------------------
           Phone
        -------------------------------- */

        @media (max-width: 480px) {
          .ios-history-container {
            width: min(100% - 20px, 920px);
            padding-top: 18px;
            padding-bottom: 150px;
          }

          .ios-page-header {
            margin-bottom: 27px;
          }

          .ios-page-header h1 {
            font-size: 34px;
          }

          .ios-page-header p {
            font-size: 15px;
          }

          .ios-title-row {
            align-items: flex-start;
          }


          .ios-section-label {
            padding-left: 13px;
          }

          .ios-settings-card {
            border-radius: 15px;
          }

          .ios-call-row {
            padding-left: 14px;
            padding-right: 14px;
          }

          .ios-divider {
            margin-left: 14px;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .ios-call-row,
          .ios-load-more {
            transition: none;
          }
        }
      `}</style>
    </section>
  );
}
