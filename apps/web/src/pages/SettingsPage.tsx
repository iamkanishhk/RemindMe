import { Fragment } from 'react';
import { Link } from 'react-router-dom';
import { iosTheme } from './iosTheme';

interface MenuRow {
  to: string;
  icon: string;
  color: string;
  title: string;
  description: string;
}

const rows: MenuRow[] = [
  {
    to: '/profile',
    icon: '☻',
    color: 'purple',
    title: 'Profile',
    description: 'Photo, sign out, delete account'
  },
  {
    to: '/subscriptions',
    icon: '▣',
    color: 'blue',
    title: 'Subscriptions',
    description: 'Plan and billing details'
  }
];

export default function SettingsPage() {
  return (
    <section className="ios-settings-page">
      <div className="ios-settings-container">
        {/* Header */}
        <header className="ios-settings-header">
          <div className="ios-settings-eyebrow">SETTINGS</div>

          <h1>Settings</h1>
        </header>

        {/* =========================================
            ACCOUNT
        ========================================== */}
        <section className="ios-settings-section">
          <div className="ios-section-label">ACCOUNT</div>

          <div className="ios-settings-card">
            {rows.map((row) => (
              <Fragment key={row.to}>
                {rows.indexOf(row) > 0 && <div className="ios-divider" />}

                <Link to={row.to} className="ios-link-row">
                  <div className="ios-row-leading">
                    <div className={`ios-setting-icon ${row.color}`}>
                      <span>{row.icon}</span>
                    </div>

                    <div>
                      <div className="ios-row-title">{row.title}</div>
                      <div className="ios-link-description">
                        {row.description}
                      </div>
                    </div>
                  </div>

                  <span className="ios-chevron" aria-hidden="true">
                    ›
                  </span>
                </Link>
              </Fragment>
            ))}
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