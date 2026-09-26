export const iosTheme = `
  .ios-settings-page {
    min-height: 100vh;
    width: 100%;

    background:
      radial-gradient(
        ellipse 850px 450px at 50% -150px,
        rgba(55, 55, 60, 0.28),
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

  .ios-settings-page *,
  .ios-settings-page *::before,
  .ios-settings-page *::after {
    box-sizing: border-box;
  }

  .ios-settings-container {
    width: min(100% - 32px, 720px);

    margin: 0 auto;

    padding: 36px 0 150px;
  }

  /* =========================================
     HEADER
  ========================================== */

  .ios-settings-header {
    margin-bottom: 34px;
  }

  .ios-settings-eyebrow {
    margin-bottom: 8px;

    color: var(--ios-secondary);

    font-size: 12px;
    line-height: 1;

    font-weight: 600;
    letter-spacing: 0.07em;

    text-transform: uppercase;
  }

  .ios-settings-header h1 {
    margin: 0;

    color: var(--ios-text);

    font-size: clamp(36px, 6vw, 46px);
    line-height: 1.05;

    font-weight: 700;

    letter-spacing: -0.045em;
  }

  /* =========================================
     SECTIONS
  ========================================== */

  .ios-settings-section {
    margin-top: 30px;
  }

  .ios-section-label {
    padding: 0 16px 9px;

    color: var(--ios-secondary);

    font-size: 12px;
    line-height: 1;

    font-weight: 600;
    letter-spacing: 0.06em;

    text-transform: uppercase;
  }

  .ios-settings-card {
    overflow: hidden;

    background: var(--ios-card);

    border-radius: 17px;

    box-shadow:
      inset 0 1px 0 rgba(255, 255, 255, 0.025),
      0 8px 30px rgba(0, 0, 0, 0.15);
  }

  /* =========================================
     LINK ROW
  ========================================== */

  .ios-link-row {
    min-height: 72px;

    padding: 12px 17px;

    display: flex;
    align-items: center;
    justify-content: space-between;

    gap: 12px;

    color: var(--ios-text);
    text-decoration: none;

    transition: background 0.15s ease;
  }

  .ios-link-row:hover {
    background: rgba(255, 255, 255, 0.04);
  }

  .ios-link-row:active {
    transform: scale(0.995);
  }

  .ios-link-description {
    margin-top: 2px;

    color: var(--ios-secondary);

    font-size: 12px;
    line-height: 1.35;
  }

  .ios-chevron {
    flex: 0 0 auto;

    color: var(--ios-tertiary);

    font-size: 20px;
    line-height: 1;
  }

  /* =========================================
     SETTING ROW
  ========================================== */

  .ios-setting-row {
    min-height: 62px;

    padding: 10px 17px;

    display: grid;

    grid-template-columns:
      minmax(150px, 0.8fr)
      minmax(0, 1.4fr);

    align-items: center;

    gap: 20px;
  }

  .ios-setting-row-top {
    align-items: start;
  }

  .ios-row-leading {
    min-width: 0;

    display: flex;
    align-items: center;

    gap: 12px;
  }

  .ios-row-title {
    color: var(--ios-text);

    font-size: 16px;
    line-height: 1.35;

    font-weight: 400;

    letter-spacing: -0.01em;
  }

  .ios-row-value {
    min-width: 0;

    color: var(--ios-secondary);

    text-align: right;

    font-size: 15px;
    line-height: 1.4;

    overflow-wrap: anywhere;
  }

  .ios-plan-value {
    color: var(--ios-text);
  }

  .ios-plan-value strong {
    font-weight: 600;
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

  .ios-divider {
    height: 1px;

    margin-left: 70px;

    background: var(--ios-separator);
  }

  /* =========================================
     ICONS
  ========================================== */

  .ios-setting-icon {
    width: 30px;
    height: 30px;

    flex: 0 0 30px;

    display: flex;
    align-items: center;
    justify-content: center;

    border-radius: 8px;

    font-size: 13px;
    font-weight: 700;
  }

  .ios-setting-icon.blue {
    color: var(--ios-blue);
    background: color-mix(in srgb, var(--ios-blue) 17%, transparent);
  }

  .ios-setting-icon.green {
    color: var(--ios-green);
    background: color-mix(in srgb, var(--ios-green) 17%, transparent);
  }

  .ios-setting-icon.orange {
    color: var(--ios-orange);
    background: color-mix(in srgb, var(--ios-orange) 17%, transparent);
  }

  .ios-setting-icon.purple {
    color: var(--ios-purple);
    background: color-mix(in srgb, var(--ios-purple) 17%, transparent);
  }

  .ios-setting-icon.gray {
    color: var(--text-muted);
    background: rgba(142, 142, 147, 0.16);
  }

  /* =========================================
     PROFILE IDENTITY
  ========================================== */

  .ios-profile-card {
    padding: 24px 17px 22px;

    display: flex;
    flex-direction: column;
    align-items: center;

    text-align: center;

    gap: 14px;
  }

  .ios-avatar {
    width: 88px;
    height: 88px;

    flex: 0 0 88px;

    display: flex;
    align-items: center;
    justify-content: center;

    overflow: hidden;

    border-radius: 50%;

    border: 1px solid rgba(255, 255, 255, 0.14);

    background:
      linear-gradient(
        135deg,
        color-mix(in srgb, var(--ios-blue) 35%, transparent),
        color-mix(in srgb, var(--ios-purple) 35%, transparent),
      );

    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.35);
  }

  .ios-avatar img {
    width: 100%;
    height: 100%;

    object-fit: cover;
  }

  .ios-avatar-fallback {
    color: white;

    font-size: 34px;
    font-weight: 700;
  }

  .ios-profile-name {
    color: var(--ios-text);

    font-size: 22px;
    line-height: 1.15;

    font-weight: 700;

    letter-spacing: -0.02em;
  }

  .ios-profile-email {
    color: var(--ios-secondary);

    font-size: 14px;
    line-height: 1.4;

    overflow-wrap: anywhere;
  }

  /* =========================================
     STATUS
  ========================================== */

  .ios-status-pill {
    display: inline-flex;
    align-items: center;
    gap: 6px;

    min-height: 27px;

    padding: 4px 9px;

    border-radius: 999px;

    font-size: 13px;
    font-weight: 600;

    white-space: nowrap;
  }

  .ios-status-pill.active {
    color: var(--ios-green);
    background: color-mix(in srgb, var(--ios-green) 12%, transparent);
  }

  .ios-status-pill.on-hold {
    color: var(--ios-orange);
    background: color-mix(in srgb, var(--ios-orange) 12%, transparent);
  }

  .ios-status-pill.cancelled,
  .ios-status-pill.expired {
    color: var(--ios-secondary);
    background: rgba(142, 142, 147, 0.13);
  }

  .ios-status-pill.failed {
    color: var(--ios-red);
    background: color-mix(in srgb, var(--ios-red) 12%, transparent);
  }

  .ios-status-dot {
    width: 6px;
    height: 6px;

    border-radius: 50%;

    background: currentColor;
  }

  /* =========================================
     NO SUBSCRIPTION
  ========================================== */

  .ios-no-subscription {
    min-height: 84px;

    padding: 17px;

    display: flex;
    align-items: center;

    gap: 13px;
  }

  .ios-subscription-icon {
    width: 38px;
    height: 38px;

    flex: 0 0 38px;

    display: flex;
    align-items: center;
    justify-content: center;

    border-radius: 10px;

    color: var(--ios-blue);
    background: color-mix(in srgb, var(--ios-blue) 14%, transparent);

    font-size: 16px;
  }

  .ios-no-subscription-title {
    color: var(--ios-text);

    font-size: 16px;
    font-weight: 500;
  }

  .ios-no-subscription-description {
    margin-top: 3px;

    color: var(--ios-secondary);

    font-size: 13px;
    line-height: 1.4;
  }

  /* =========================================
     SUBSCRIPTION ACTION
  ========================================== */

  .ios-subscription-action {
    display: flex;
    justify-content: flex-end;

    padding: 15px 17px 17px;
  }

  .ios-subscription-action > * {
    max-width: 100%;
  }

  /* =========================================
     CANCELLED NOTICE
  ========================================== */

  .ios-inline-notice {
    margin: 0 17px 17px;

    padding: 11px 12px;

    display: flex;
    align-items: flex-start;

    gap: 9px;

    border-radius: 11px;

    color: var(--ios-secondary);
    background: rgba(142, 142, 147, 0.09);

    font-size: 13px;
    line-height: 1.4;
  }

  .ios-inline-notice-icon {
    flex: 0 0 auto;

    color: var(--ios-green);

    font-weight: 700;
  }

  /* =========================================
     CANCEL ERROR
  ========================================== */

  .ios-cancel-error {
    padding: 0 17px 17px;
  }

  /* =========================================
     SIGN OUT
  ========================================== */

  .ios-signout-button {
    min-height: 34px;

    padding: 0 14px;

    display: inline-flex;
    align-items: center;
    justify-content: center;

    gap: 6px;

    border: 1px solid color-mix(in srgb, var(--ios-blue) 35%, transparent);
    border-radius: 10px;

    background: color-mix(in srgb, var(--ios-blue) 12%, transparent);
    color: var(--ios-blue);

    font-family: inherit;
    font-size: 14px;
    font-weight: 600;

    cursor: pointer;

    transition:
      background 0.15s ease,
      transform 0.12s ease;
  }

  .ios-signout-button:hover:not(:disabled) {
    background: color-mix(in srgb, var(--ios-blue) 20%, transparent);
  }

  .ios-signout-button:active:not(:disabled) {
    transform: scale(0.97);
  }

  .ios-signout-button:disabled {
    opacity: 0.6;
    cursor: default;
  }

  /* =========================================
     DANGER ZONE
  ========================================== */

  .danger-section {
    margin-top: 38px;
  }

  .danger-label {
    color: var(--ios-red);
  }

  .ios-danger-card {
    overflow: hidden;

    background: color-mix(in srgb, var(--ios-red) 5.5%, transparent);

    border: 1px solid color-mix(in srgb, var(--ios-red) 13%, transparent);

    border-radius: 17px;
  }

  .ios-danger-header {
    display: flex;
    align-items: flex-start;

    gap: 13px;

    padding: 18px 17px 17px;
  }

  .ios-danger-icon {
    width: 36px;
    height: 36px;

    flex: 0 0 36px;

    display: flex;
    align-items: center;
    justify-content: center;

    border-radius: 10px;

    background: color-mix(in srgb, var(--ios-red) 14%, transparent);
    color: var(--ios-red);

    font-size: 17px;
    font-weight: 700;
  }

  .ios-danger-header h2 {
    margin: 0;

    color: var(--ios-text);

    font-size: 17px;
    line-height: 1.25;

    font-weight: 600;

    letter-spacing: -0.015em;
  }

  .ios-danger-header p {
    margin: 5px 0 0;

    color: var(--ios-secondary);

    font-size: 13px;
    line-height: 1.5;
  }

  .ios-delete-confirm {
    padding: 0 17px 17px;
  }

  .ios-input-label {
    display: block;

    margin-bottom: 7px;

    color: var(--ios-secondary);

    font-size: 12px;
    font-weight: 600;

    text-transform: uppercase;
    letter-spacing: 0.04em;
  }

  .ios-delete-confirm input {
    width: 100%;
    height: 48px;

    padding: 0 14px;

    border: 1px solid rgba(255, 255, 255, 0.08);
    outline: none;

    border-radius: 11px;

    background: rgba(0, 0, 0, 0.28);
    color: var(--ios-text);

    font-family:
      ui-monospace,
      SFMono-Regular,
      Menlo,
      Monaco,
      Consolas,
      monospace;

    font-size: 15px;

    box-shadow:
      inset 0 1px 2px rgba(0, 0, 0, 0.25);

    transition:
      border-color 0.15s ease,
      background 0.15s ease,
      box-shadow 0.15s ease;
  }

  .ios-delete-confirm input::placeholder {
    color: var(--ios-tertiary);
  }

  .ios-delete-confirm input:focus {
    border-color: color-mix(in srgb, var(--ios-red) 55%, transparent);

    background: rgba(0, 0, 0, 0.4);

    box-shadow:
      0 0 0 3px color-mix(in srgb, var(--ios-red) 10%, transparent);
  }

  .ios-input-hint {
    margin-top: 7px;

    color: var(--ios-tertiary);

    font-size: 12px;
  }

  .ios-input-hint code {
    color: var(--ios-secondary);

    font-family:
      ui-monospace,
      SFMono-Regular,
      Menlo,
      Monaco,
      Consolas,
      monospace;
  }

  .ios-delete-button {
    width: calc(100% - 34px);

    min-height: 46px;

    margin: 0 17px 17px;

    border: 0;
    border-radius: 12px;

    display: flex;
    align-items: center;
    justify-content: center;

    gap: 8px;

    background: var(--ios-red);
    color: white;

    font-family: inherit;

    font-size: 15px;
    font-weight: 600;

    cursor: pointer;

    transition:
      transform 0.12s ease,
      opacity 0.15s ease,
      background 0.15s ease;
  }

  .ios-delete-button:hover:not(:disabled) {
    background: color-mix(in srgb, var(--ios-red) 88%, white);
  }

  .ios-delete-button:active:not(:disabled) {
    transform: scale(0.985);
  }

  .ios-delete-button:disabled {
    opacity: 0.35;

    cursor: default;
  }

  .ios-delete-icon {
    font-size: 17px;
  }

  /* =========================================
     LOADING
  ========================================== */

  .ios-loading-row {
    min-height: 100px;

    display: flex;
    align-items: center;
    justify-content: center;

    padding: 20px;
  }

  /* =========================================
     GLOBAL ERROR
  ========================================== */

  .ios-global-error {
    margin-bottom: 22px;

    overflow: hidden;

    border-radius: 15px;
  }

  /* =========================================
     FOOTER
  ========================================== */

  .ios-footer-note {
    padding: 25px 0 0;

    display: flex;
    justify-content: center;
    align-items: center;

    gap: 7px;

    color: var(--ios-tertiary);

    font-size: 11px;

    letter-spacing: 0.01em;
  }

  /* =========================================
     TABLET
  ========================================== */

  @media (max-width: 650px) {
    .ios-settings-container {
      width: min(100% - 24px, 720px);

      padding-top: 25px;
    }

    .ios-setting-row {
      grid-template-columns:
        minmax(130px, 0.75fr)
        minmax(0, 1.25fr);

      gap: 14px;
    }

    .ios-row-value {
      font-size: 14px;
    }
  }

  /* =========================================
     MOBILE
  ========================================== */

  @media (max-width: 480px) {
    .ios-settings-container {
      width: min(100% - 20px, 720px);

      padding-top: 19px;
      padding-bottom: 150px;
    }

    .ios-settings-header {
      margin-bottom: 27px;
    }

    .ios-settings-header h1 {
      font-size: 36px;
    }

    .ios-settings-section {
      margin-top: 27px;
    }

    .ios-section-label {
      padding-left: 13px;
    }

    .ios-settings-card,
    .ios-danger-card {
      border-radius: 15px;
    }

    .ios-link-row {
      padding: 13px 14px;
    }

    .ios-setting-row {
      grid-template-columns: 1fr;

      min-height: 0;

      gap: 6px;

      padding: 13px 14px;
    }

    .ios-row-leading {
      gap: 11px;
    }

    .ios-row-title {
      font-size: 15px;
    }

    .ios-row-value {
      padding-left: 41px;

      text-align: left;

      font-size: 14px;
    }

    .ios-mono {
      font-size: 11px;
      line-height: 1.45;
    }

    .ios-divider {
      margin-left: 55px;
    }

    .ios-profile-card {
      padding: 20px 14px 18px;
    }

    .ios-avatar {
      width: 80px;
      height: 80px;

      flex: 0 0 80px;
    }

    .ios-avatar-fallback {
      font-size: 30px;
    }

    .ios-profile-name {
      font-size: 20px;
    }

    .ios-status-pill {
      font-size: 12px;
    }

    .ios-subscription-action {
      padding: 13px 14px 15px;
    }

    .ios-inline-notice {
      margin-left: 14px;
      margin-right: 14px;
    }

    .ios-cancel-error {
      padding-left: 14px;
      padding-right: 14px;
    }

    .ios-danger-header {
      padding: 16px 14px;
    }

    .ios-delete-confirm {
      padding-left: 14px;
      padding-right: 14px;
    }

    .ios-delete-button {
      width: calc(100% - 28px);

      margin-left: 14px;
      margin-right: 14px;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .ios-delete-button,
    .ios-delete-confirm input,
    .ios-link-row {
      transition: none;
    }
  }
`;