import { Fragment, useEffect, useRef, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useCalls } from '../hooks/queries';
import { formatDateTimeLocal } from '../lib/format';
import { StatusChip } from '../components/StatusChip';
import { Spinner } from '../components/Spinner';
import { Skeleton } from '../components/Skeleton';
import ErrorPage from '../components/ErrorPage';
import CallDetailSheet from '../components/CallDetailSheet';
import { GlassButton } from '../components/GlassButton';
import type { CallAttempt } from '../lib/types';
import Image from '../../public/assets/call.png';
import SoftAurora from '../components/SoftAurora';
export default function HistoryPage() {
  const calls = useCalls();
  const navigate = useNavigate();
  const [selected, setSelected] = useState<CallAttempt | null>(null);
  const [searching, setSearching] = useState(false);
  const [query, setQuery] = useState('');
  const searchRef = useRef<HTMLInputElement | null>(null);

  // 1. ALL HOOKS MUST BE AT THE TOP (Before any return statement)
  useEffect(() => {
    if (searching) searchRef.current?.focus();
  }, [searching]);

  const attempts = useMemo(() => {
    return calls.data?.pages.flatMap((p) => p.attempts) ?? [];
  }, [calls.data]);

  const visibleAttempts = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return attempts;
    return attempts.filter((a) =>
      [a.reminderTitle, a.reminderId, a.status, a.detail, a.destinationE164]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(needle)
    );
  }, [attempts, query]);

  function closeSearch() {
    setSearching(false);
    setQuery('');
  }

  // 2. EARLY RETURNS CAN SAFELY HAPPEN AFTER ALL HOOKS ARE DECLARED
  if (calls.isLoading) {
    return (
      <section
        className="min-h-screen w-full bg-[color:var(--bg)] text-[color:var(--text)]"
        aria-busy="true"
      >
        <div className="mx-auto w-full max-w-[920px] px-4 pb-24 pt-9">
          {/* Header Skeleton */}
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

  return (
    <section className="ios-history-page">
      <SoftAurora
        colorStops={["#AE897F","#B26B56","#B35443"]}
        blend={0.5}
        amplitude={1}
        speed={1}
        className="fixed bottom-0 rotate-180 inset-0 w-full h-full opacity-20 pointer-events-none"
      />

      <div className="ios-history-container">
        {/* Page Header */}
        <header className="ios-page-header">
          <div className="flex mt-15 items-center justify-between gap-3">
            <span className="text-4xl">Call history</span>
            <div className="flex items-center justify-center w-fit">
              <GlassButton
                displacementScale={64}
                saturation={130}
                aberrationIntensity={2}
                elasticity={0.35}
                cornerRadius={100}
                blurAmount={0.1}
                padding="15px"
                style={{
                  top: 40,
                  position: 'fixed',
                  zIndex: 9999,
                }}
              >
                <motion.div
                  layout
                  transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                  className="flex items-center overflow-hidden"
                  style={{
                    borderRadius: 9999,
                  }}
                >
                  <AnimatePresence mode="wait">
                    {searching ? (
                      <motion.div
                        key="search-input-wrapper"
                        initial={{ opacity: 0, width: 40 }}
                        animate={{ opacity: 1, width: '85vw' }}
                        exit={{ opacity: 0, width: 40 }}
                        transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                        className="flex items-center gap-2 px-2"
                      >
                        <input
                          ref={searchRef}
                          type="search"
                          value={query}
                          onChange={(e) => setQuery(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Escape') closeSearch();
                          }}
                          placeholder="Search reminder or status"
                          aria-label="Search call history"
                          className="w-full bg-transparent border-none outline-none text-white text-base placeholder-gray-400"
                        />
                        <motion.button
                          type="button"
                          onClick={closeSearch}
                          aria-label="Close search"
                          whileTap={{ scale: 0.9 }}
                          className="pressable flex items-center justify-center p-1 text-white shrink-0 cursor-pointer"
                        >
                          {/* Cancel / X Icon */}
                          <svg
                            width="24"
                            height="24"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                          </svg>
                        </motion.button>
                      </motion.div>
                    ) : (
                      <motion.button
                        key="search-button"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.15 }}
                        type="button"
                        onClick={() => setSearching(true)}
                        aria-label="Search call history"
                        aria-expanded={searching}
                        className="pressable ios-search-btn"
                      >
                        <svg
                          width="24"
                          height="24"
                          viewBox="0 0 96 96"
                          xmlns="http://www.w3.org/2000/svg"
                          aria-hidden="true"
                        >
                          <circle
                            cx="42"
                            cy="42"
                            r="19"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="8"
                          />
                          <line
                            x1="56"
                            y1="56"
                            x2="73"
                            y2="73"
                            stroke="currentColor"
                            strokeWidth="8"
                            strokeLinecap="round"
                          />
                        </svg>
                      </motion.button>
                    )}
                  </AnimatePresence>
                </motion.div>
              </GlassButton>
            </div>
          </div>
        </header>

        {/* Empty State */}
        {attempts.length === 0 ? (
          <div className="w-full flex flex-col items-center justify-center gap-3 p-6 text-center">
            <img
              src={Image}
              width="auto"
              height="10vh"
              className="opacity-70"
              alt="Call icon"
            />
            <div> no call history yet</div>
          </div>
        ) : (
          <>
            {/* Grouped history list, settings-card style */}
            <section className="ios-history-section">
              <div className="ios-settings-card stagger">
                {visibleAttempts.map((a, index) => (
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

            {visibleAttempts.length === 0 && (
              <p className="ios-search-empty">
                No calls match &ldquo;{query.trim()}&rdquo;
              </p>
            )}

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
              var(--ios-glow),
              transparent 70%
            ),
            var(--ios-black);
          color: var(--ios-text);
          font-family: var(--font);
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

        /* Header */
        .ios-page-header {
          margin-bottom: 34px;
        }

        /* Section */
        .ios-history-section {
          margin-top: 4px;
        }

        /* Grouped card (settings style) */
        .ios-settings-card {
          overflow: hidden;
          background: var(--ios-card);
          border-radius: 17px;
          box-shadow: var(--shadow-card);
        }

        .ios-divider {
          height: 1px;
          margin-left: 17px;
          background: var(--ios-separator);
        }

        /* Call row */
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
          transition: background 0.15s ease, transform 0.1s ease;
          will-change: background, transform;
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

        /* Pagination */
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
          transition: background 0.15s ease, transform 0.12s ease, opacity 0.15s ease;
          will-change: background, transform;
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

        /* Search */
        .ios-search-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          background: none;
          border: 0;
          padding: 0;
          line-height: 0;
          color: var(--ios-text);
          cursor: pointer;
        }

        .ios-search-empty {
          margin-top: 18px;
          text-align: center;
          color: var(--ios-secondary);
          font-size: 15px;
          line-height: 1.4;
        }

        /* Tablet */
        @media (max-width: 720px) {
          .ios-history-container {
            width: min(100% - 24px, 920px);
            padding-top: 24px;
          }
        }

        /* Phone */
        @media (max-width: 480px) {
          .ios-history-container {
            width: min(100% - 20px, 920px);
            padding-top: 18px;
            padding-bottom: 150px;
          }

          .ios-page-header {
            margin-bottom: 27px;
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