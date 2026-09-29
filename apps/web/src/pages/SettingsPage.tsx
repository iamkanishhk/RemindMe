import { Fragment } from 'react';
import { Link } from 'react-router-dom';
import { iosTheme } from './iosTheme';
import { User, Dollar, Paintbrush } from 'reicon-react';
import type { ComponentType, CSSProperties } from 'react';
import { useTheme, type ThemeMode } from '../lib/theme';

interface MenuRow {
  to: string;
  icon: ComponentType<any>;
  title: string;
  description: string;
}

const rows: MenuRow[] = [
  {
    to: '/profile',
    icon: User,
    title: 'Profile',
    description: 'Photo, sign out, delete account',
  },
  {
    to: '/subscriptions',
    icon: Dollar,
    title: 'Subscriptions',
    description: 'Plan and billing details',
  },
];

const APPEARANCE_OPTIONS: { value: ThemeMode; label: string }[] = [
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
  { value: 'system', label: 'Auto' },
];

export default function SettingsPage() {
  const { mode, resolved, setMode } = useTheme();
  const activeIndex = APPEARANCE_OPTIONS.findIndex((option) => option.value === mode);

  const appearanceDescription =
    mode === 'system'
      ? `Following your device (${resolved === 'dark' ? 'Dark' : 'Light'})`
      : mode === 'dark'
        ? 'Always dark'
        : 'Always light';

  return (
    <section className="ios-settings-page">
      <div className="ios-settings-container">
        {/* Header */}
        <header className="ios-settings-header">
          <h1>Settings</h1>
        </header>

        {/* =========================================
            GENERAL
        ========================================== */}
        <section className="ios-settings-section">
          <div className="ios-section-label">GENERAL</div>

          <div className="ios-settings-card">
            <div className="ios-appearance-row">
              <div className="ios-row-leading">
                <div className="ios-setting-icon gray">
                  <Paintbrush />
                </div>

                <div>
                  <div className="ios-row-title">Appearance</div>
                  <div className="ios-link-description">{appearanceDescription}</div>
                </div>
              </div>

              <div
                className="ios-segmented"
                role="radiogroup"
                aria-label="Appearance"
                style={
                  {
                    '--seg-index': activeIndex < 0 ? 0 : activeIndex,
                    '--seg-count': APPEARANCE_OPTIONS.length,
                  } as CSSProperties
                }
              >
                <span className="ios-segmented-thumb" aria-hidden="true" />

                {APPEARANCE_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    role="radio"
                    aria-checked={option.value === mode}
                    className="ios-segmented-option"
                    onClick={() => setMode(option.value)}
                  >
                    {option.label}
                  </button>
                ))}
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
            {rows.map((row, index) => {
              const Icon = row.icon;

              return (
                <Fragment key={row.to}>
                  {index > 0 && <div className="ios-divider" />}

                  <Link to={row.to} className="ios-link-row">
                    <div className="ios-row-leading">
                      <div className="ios-setting-icon">
                        <Icon />
                      </div>

                      <div>
                        <div className="ios-row-title">{row.title}</div>
                        <div className="ios-link-description">{row.description}</div>
                      </div>
                    </div>

                    <span className="ios-chevron" aria-hidden="true">
                      ›
                    </span>
                  </Link>
                </Fragment>
              );
            })}
          </div>
        </section>

        <div className="ios-footer-note">
          <span>Settings</span>
          <span>•</span>
          <span>Profile &amp; Subscription</span>
        </div>
      </div>

      <style>{iosTheme}</style>
    </section>
  );
}
