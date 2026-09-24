import { Link } from 'react-router-dom';
import { useCalls } from '../hooks/queries';
import { formatDateTimeLocal } from '../lib/format';
import { StatusChip } from '../components/StatusChip';
import { Spinner } from '../components/Spinner';
import { ErrorBanner } from '../components/ErrorBanner';
import { EmptyState } from '../components/EmptyState';

export default function HistoryPage() {
  const calls = useCalls();

  if (calls.isLoading) {
    return (
      <section className="ios-history-page">
        <div className="ios-loading">
          <Spinner label="Loading call history…" />
        </div>
      </section>
    );
  }

  if (calls.isError) {
    return (
      <section className="ios-history-page">
        <div className="ios-history-container">
          <header className="ios-page-header">
            <div className="ios-eyebrow">ACTIVITY</div>
            <h1>Call history</h1>
            <p>Every call attempt and its result.</p>
          </header>

          <div className="ios-error-card">
            <ErrorBanner
              message={
                calls.error?.message ?? 'Could not load call history'
              }
            />
          </div>
        </div>
      </section>
    );
  }

  const attempts = calls.data?.pages.flatMap((p) => p.attempts) ?? [];

  return (
    <section className="ios-history-page">
      <div className="ios-history-container">
        {/* Page Header */}
        <header className="ios-page-header">
          <div className="ios-eyebrow">ACTIVITY</div>

          <div className="ios-title-row">
            <div>
              <h1>Call history</h1>
              <p>Every call attempt and its result.</p>
            </div>

            {attempts.length > 0 && (
              <div className="ios-count-badge">
                {attempts.length}
              </div>
            )}
          </div>
        </header>

        {/* Empty State */}
        {attempts.length === 0 ? (
          <div className="ios-empty-card">
            <EmptyState
              title="No calls yet"
              hint="Call attempts will appear here once reminders fire."
            />
          </div>
        ) : (
          <>
            {/* Mobile / iOS grouped history */}
            <section className="ios-history-section">
              <div className="ios-section-label">
                RECENT CALLS
              </div>

              <div className="ios-call-list">
                {attempts.map((a, index) => (
                  <article className="ios-call-card" key={a.id}>
                    {/* Top row */}
                    <div className="ios-call-top">
                      <div className="ios-status-wrapper">
                        <StatusChip status={a.status} />
                      </div>

                      <div className="ios-call-index">
                        #{attempts.length - index}
                      </div>
                    </div>

                    {/* Reminder */}
                    <div className="ios-call-reminder">
                      <div className="ios-call-icon purple">
                        <span>◷</span>
                      </div>

                      <div className="ios-call-reminder-content">
                        <span className="ios-field-label">
                          REMINDER
                        </span>

                        {a.reminderId ? (
                          <Link
                            to={`/reminders/${a.reminderId}`}
                            className="ios-reminder-link"
                          >
                            {a.reminderTitle ?? a.reminderId}
                            <span className="ios-chevron">›</span>
                          </Link>
                        ) : (
                          <span className="ios-value">—</span>
                        )}
                      </div>
                    </div>

                    <div className="ios-card-divider" />

                    {/* Call details */}
                    <div className="ios-call-grid">
                      <div className="ios-call-field">
                        <div className="ios-field-icon blue">
                          <span>☎</span>
                        </div>

                        <div className="ios-field-content">
                          <span className="ios-field-label">
                            NUMBER
                          </span>

                          <span className="ios-field-value ios-mono">
                            {a.destinationE164 ?? '—'}
                          </span>
                        </div>
                      </div>

                      <div className="ios-call-field">
                        <div className="ios-field-icon orange">
                          <span>■</span>
                        </div>

                        <div className="ios-field-content">
                          <span className="ios-field-label">
                            ENDED
                          </span>

                          <span className="ios-field-value">
                            {a.endedAt
                              ? formatDateTimeLocal(a.endedAt)
                              : '—'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Detail */}
                    <div className="ios-card-divider" />

                    <div className="ios-detail-row">
                      <div className="ios-detail-icon">
                        <span>i</span>
                      </div>

                      <div className="ios-detail-content">
                        <span className="ios-field-label">
                          DETAIL
                        </span>

                        <span className="ios-detail-value">
                          {a.detail ?? '—'}
                        </span>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </section>

            {/* Pagination */}
            {calls.hasNextPage ? (
              <div className="ios-pager">
                <button
                  type="button"
                  className="ios-load-more"
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

      <style>{`
        :root {
          color-scheme: dark;

          --ios-black: #000000;
          --ios-card: #1c1c1e;
          --ios-card-elevated: #2c2c2e;

          --ios-text: #f5f5f7;
          --ios-secondary: #98989f;
          --ios-tertiary: #636366;

          --ios-separator: rgba(84, 84, 88, 0.55);

          --ios-blue: #0a84ff;
          --ios-green: #30d158;
          --ios-orange: #ff9f0a;
          --ios-red: #ff453a;
          --ios-purple: #bf5af2;
          --ios-cyan: #64d2ff;
        }

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

        .ios-count-badge {
          min-width: 34px;
          height: 34px;

          padding: 0 10px;

          display: inline-flex;
          align-items: center;
          justify-content: center;

          border-radius: 999px;

          background: #2c2c2e;
          color: var(--ios-secondary);

          font-size: 14px;
          font-weight: 600;

          font-variant-numeric: tabular-nums;
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
           Call List
        -------------------------------- */

        .ios-call-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .ios-call-card {
          overflow: hidden;

          background: var(--ios-card);

          border-radius: 17px;

          box-shadow:
            inset 0 1px 0 rgba(255, 255, 255, 0.025),
            0 8px 30px rgba(0, 0, 0, 0.16);

          transition:
            background 0.15s ease,
            transform 0.15s ease;
        }

        .ios-call-card:hover {
          background: #202023;
        }

        /* --------------------------------
           Card top
        -------------------------------- */

        .ios-call-top {
          min-height: 58px;

          padding: 14px 17px;

          display: flex;
          align-items: center;
          justify-content: space-between;

          gap: 16px;
        }

        .ios-status-wrapper {
          display: flex;
          align-items: center;
        }

        .ios-call-index {
          color: var(--ios-tertiary);

          font-size: 12px;
          font-weight: 500;

          font-variant-numeric: tabular-nums;
        }

        /* --------------------------------
           Reminder
        -------------------------------- */

        .ios-call-reminder {
          display: flex;
          align-items: center;

          gap: 12px;

          padding: 0 17px 16px;
        }

        .ios-call-icon {
          width: 38px;
          height: 38px;

          flex: 0 0 38px;

          display: flex;
          align-items: center;
          justify-content: center;

          border-radius: 10px;

          font-size: 16px;
          font-weight: 600;
        }

        .ios-call-icon.purple {
          background: rgba(191, 90, 242, 0.16);
          color: var(--ios-purple);
        }

        .ios-call-reminder-content {
          min-width: 0;

          display: flex;
          flex-direction: column;
          gap: 3px;
        }

        .ios-field-label {
          display: block;

          color: var(--ios-tertiary);

          font-size: 10px;
          line-height: 1.2;

          font-weight: 700;
          letter-spacing: 0.055em;

          text-transform: uppercase;
        }

        .ios-reminder-link {
          display: inline-flex;
          align-items: center;
          gap: 7px;

          max-width: 100%;

          color: var(--ios-blue);

          font-size: 16px;
          line-height: 1.35;
          font-weight: 500;

          text-decoration: none;

          overflow-wrap: anywhere;
        }

        .ios-reminder-link:hover {
          text-decoration: underline;
        }

        .ios-chevron {
          flex: 0 0 auto;

          color: var(--ios-tertiary);

          font-size: 23px;
          line-height: 14px;
          font-weight: 300;
        }

        .ios-value {
          color: var(--ios-text);
          font-size: 16px;
        }

        /* --------------------------------
           Separators
        -------------------------------- */

        .ios-card-divider {
          height: 1px;

          margin-left: 67px;

          background: var(--ios-separator);
        }

        /* --------------------------------
           Fields
        -------------------------------- */

        .ios-call-grid {
          display: grid;

          grid-template-columns:
            repeat(3, minmax(0, 1fr));

          padding: 16px 17px;
        }

        .ios-call-field {
          min-width: 0;

          display: flex;
          align-items: flex-start;

          gap: 10px;

          padding-right: 16px;
        }

        .ios-call-field + .ios-call-field {
          padding-left: 16px;

          border-left: 1px solid var(--ios-separator);
        }

        .ios-field-icon {
          width: 28px;
          height: 28px;

          flex: 0 0 28px;

          display: flex;
          align-items: center;
          justify-content: center;

          border-radius: 8px;

          font-size: 11px;
          font-weight: 700;
        }

        .ios-field-icon.blue {
          color: var(--ios-blue);
          background: rgba(10, 132, 255, 0.16);
        }

        .ios-field-icon.green {
          color: var(--ios-green);
          background: rgba(48, 209, 88, 0.16);
        }

        .ios-field-icon.orange {
          color: var(--ios-orange);
          background: rgba(255, 159, 10, 0.16);
        }

        .ios-field-content {
          min-width: 0;

          display: flex;
          flex-direction: column;

          gap: 4px;
        }

        .ios-field-value {
          color: var(--ios-text);

          font-size: 13px;
          line-height: 1.4;

          overflow-wrap: anywhere;
        }

        .ios-mono {
          font-family:
            ui-monospace,
            SFMono-Regular,
            Menlo,
            Monaco,
            Consolas,
            monospace;

          font-size: 12px;
        }

        /* --------------------------------
           Detail
        -------------------------------- */

        .ios-detail-row {
          min-height: 64px;

          padding: 13px 17px;

          display: flex;
          align-items: flex-start;

          gap: 11px;
        }

        .ios-detail-icon {
          width: 28px;
          height: 28px;

          flex: 0 0 28px;

          display: flex;
          align-items: center;
          justify-content: center;

          margin-top: 1px;

          border-radius: 8px;

          background: rgba(142, 142, 147, 0.14);
          color: #aeaeb2;

          font-size: 14px;
          font-weight: 600;
          font-family: Georgia, serif;
        }

        .ios-detail-content {
          min-width: 0;

          display: flex;
          flex-direction: column;

          gap: 4px;
        }

        .ios-detail-value {
          color: var(--ios-secondary);

          font-size: 14px;
          line-height: 1.45;

          overflow-wrap: anywhere;
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

          background: #2c2c2e;
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
          background: #38383a;
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

          background: rgba(10, 132, 255, 0.14);
          color: var(--ios-blue);

          font-size: 25px;
        }

        /* --------------------------------
           Error
        -------------------------------- */

        .ios-error-card {
          overflow: hidden;

          padding: 16px;

          background: rgba(255, 69, 58, 0.08);

          border: 1px solid rgba(255, 69, 58, 0.16);

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

          .ios-call-grid {
            grid-template-columns: 1fr;
            gap: 0;

            padding: 7px 17px;
          }

          .ios-call-field {
            min-height: 56px;

            align-items: center;

            padding: 9px 0;
          }

          .ios-call-field + .ios-call-field {
            padding-left: 0;

            border-left: 0;
            border-top: 1px solid var(--ios-separator);
          }

          .ios-field-icon {
            width: 30px;
            height: 30px;
            flex-basis: 30px;
          }

          .ios-field-content {
            flex-direction: row;
            align-items: center;
            justify-content: space-between;

            width: 100%;

            gap: 12px;
          }

          .ios-field-label {
            flex: 0 0 auto;
          }

          .ios-field-value {
            text-align: right;
          }

          .ios-mono {
            max-width: 65%;
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

          .ios-count-badge {
            margin-top: 5px;
          }

          .ios-section-label {
            padding-left: 13px;
          }

          .ios-call-card {
            border-radius: 15px;
          }

          .ios-call-top {
            padding: 13px 14px;
          }

          .ios-call-reminder {
            padding-left: 14px;
            padding-right: 14px;
          }

          .ios-card-divider {
            margin-left: 60px;
          }

          .ios-call-grid {
            padding-left: 14px;
            padding-right: 14px;
          }

          .ios-detail-row {
            padding-left: 14px;
            padding-right: 14px;
          }

          .ios-mono {
            max-width: 60%;
            font-size: 11px;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .ios-call-card,
          .ios-load-more {
            transition: none;
          }
        }
      `}</style>
    </section>
  );
}
