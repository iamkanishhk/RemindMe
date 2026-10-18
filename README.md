# RemindMe

> Automated Real voice call reminders App.

## 📑 Table of Contents

- [Description](#description)
- [Key Features](#key-features)
- [Use Cases](#use-cases)
- [Screenshots](#screenshots)
- [Tech Stack](#tech-stack)
- [Quick Start](#quick-start)
- [Environment Variables](#environment-variables)
- [Key Dependencies](#key-dependencies)
- [Available Scripts](#available-scripts)
- [Project Structure](#project-structure)
- [Development Setup](#development-setup)
- [Deployment](#deployment)
- [Contributors](#contributors)
- [Contributing](#contributing)

## 📝 Description

RemindMe is an automated phone reminder platform designed to schedule and deliver reminders via voice calls. By pairing scheduled background execution with telephony provider integration, the platform ensures that time-sensitive alerts are reliably placed to target phone numbers.

The system is architected as a monorepo featuring an Express API backend and a Vite-powered React client dashboard. The backend utilizes Prisma for data storage, Upstash Redis for state coordination, Clerk for authentication, Telnyx for automated calling, Google Gemini for AI-driven capabilities, and Dodo Payments for subscription billing.

## ✨ Key Features

- **📞 Automated Outbound Voice Calling** — Dispatches scheduled voice call reminders to recipient phone numbers using the Telnyx API.
- **🔐 Clerk Authentication Middleware** — Secures backend API routes and manages user sessions through Clerk integration.
- **🗄️ Prisma Database Layer** — Persists reminder data, user records, and application status using Prisma ORM.
- **💳 Subscription and Billing Support** — Handles subscription tiers and payment webhooks through Dodo Payments integration.
- **⚡ Vite and React Interface** — Provides a frontend client with React, TanStack Query, and Framer Motion.

## 🎯 Use Cases

- Scheduling automated phone call reminders for critical events and tasks.
- Building a recurring reminder service with tiered billing and call limits.
- Managing telephony workflows and phone number verifications using Telnyx.

## 📸 Screenshots

SOON

## 🛠️ Tech Stack

![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=white) ![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white) ![Prisma](https://img.shields.io/badge/Prisma-2D3748?style=for-the-badge&logo=prisma&logoColor=white) ![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)

**Notable libraries:** Framer Motion

## ⚡ Quick Start

```bash

# 1. Clone the repository
git clone https://github.com/iamkanishhk/RemindMe.git

# 2. Install dependencies
npm install

# 3. Configure environment
cp .env.example .env   # then fill in the values

# 4. Start the dev server
npm run dev
```

## 🔑 Environment Variables

The following environment variables are required (see `.env.example`):

```bash
NODE_ENV=
PORT=
API_BASE_URL=
VERSION=
CLERK_SECRET_KEY=
CLERK_PUBLISHABLE_KEY=
DATABASE_URL=
DATABASE_URL_UNPOOLED=
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
TELNYX_API_KEY=
TELNYX_CONNECTION_ID=
TELNYX_FROM_NUMBER=
TELNYX_PUBLIC_KEY=
GEO_ALLOW_PREFIXES=
SENTRY_DSN=
CORS_ORIGINS=
DODO_PAYMENTS_PRODUCT_ID=
DODO_PAYMENTS_ANUAL_PRODUCT_ID=
DODO_PAYMENTS_API_KEY=
DODO_PAYMENTS_WEBHOOK_KEY=
DODO_PAYMENTS_ENVIRONMENT=
DODO_PAYMENTS_RETURN_URL=
TRIAL_PERIOD_DAYS=
DAILY_REMINDER_LIMIT=
GEMINI_API_KEYS=
GEMINI_MODEL=
```

## 📦 Key Dependencies

```
@sentry/react: ^11.0.0
esbuild: ^0.28.2
framer-motion: ^13.4.3
```

## 🚀 Available Scripts

- **dev** — `npm run dev`
- **dev:web** — `npm run dev:web`
- **build** — `npm run build`
- **build:web** — `npm run build:web`
- **start** — `npm run start`
- **worker** — `npm run worker`
- **test** — `npm run test`
- **lint** — `npm run lint`
- **lint:web** — `npm run lint:web`
- **typecheck** — `npm run typecheck`
- **typecheck:web** — `npm run typecheck:web`
- **prisma:validate** — `npm run prisma:validate`
- **prisma:migrate** — `npm run prisma:migrate`
- **prisma:generate** — `npm run prisma:generate`
- **prisma:seed** — `npm run prisma:seed`

## 📁 Project Structure

```
.
├── apps
│   ├── api
│   │   ├── .env.example
│   │   ├── eslint.config.mjs
│   │   ├── package.json
│   │   ├── prisma
│   │   │   ├── migrations
│   │   │   │   ├── 20260922152359_init
│   │   │   │   │   └── ...
│   │   │   │   ├── 20260923110443_add_dodo_billing
│   │   │   │   │   └── ...
│   │   │   │   ├── 20260927091500_add_user_onboarding_completed_at
│   │   │   │   │   └── ...
│   │   │   │   ├── 20260927163019_add_free_reminder_call
│   │   │   │   │   └── ...
│   │   │   │   ├── 20260927164920_add_daily_reminder_quota
│   │   │   │   │   └── ...
│   │   │   │   ├── 20260929121108_add_user_timezone
│   │   │   │   │   └── ...
│   │   │   │   ├── 20261003101322_add_reminder_voice_message
│   │   │   │   │   └── ...
│   │   │   │   ├── 20261003111351_add_user_first_name
│   │   │   │   │   └── ...
│   │   │   │   ├── 20261003120000_drop_reminder_title
│   │   │   │   │   └── ...
│   │   │   │   └── migration_lock.toml
│   │   │   ├── schema.prisma
│   │   │   └── seed.ts
│   │   ├── src
│   │   │   ├── app.ts
│   │   │   ├── config.ts
│   │   │   ├── index.ts
│   │   │   ├── lib
│   │   │   │   ├── dodo.ts
│   │   │   │   ├── e164.ts
│   │   │   │   ├── errors.ts
│   │   │   │   ├── limits.ts
│   │   │   │   ├── logger.ts
│   │   │   │   ├── prisma.ts
│   │   │   │   ├── ratelimit.ts
│   │   │   │   ├── redis.ts
│   │   │   │   ├── schedule.ts
│   │   │   │   ├── sentry.ts
│   │   │   │   └── validators.ts
│   │   │   ├── middleware
│   │   │   │   ├── auth.ts
│   │   │   │   └── httpLog.ts
│   │   │   ├── repos
│   │   │   │   ├── attempts.ts
│   │   │   │   ├── phoneNumbers.ts
│   │   │   │   └── reminders.ts
│   │   │   ├── routes
│   │   │   │   ├── billing.ts
│   │   │   │   ├── calls.ts
│   │   │   │   ├── health.ts
│   │   │   │   ├── phoneNumbers.ts
│   │   │   │   ├── reminders.ts
│   │   │   │   ├── users.ts
│   │   │   │   └── webhook.ts
│   │   │   ├── services
│   │   │   │   ├── billingService.ts
│   │   │   │   ├── callService.ts
│   │   │   │   ├── messageEnhancer.ts
│   │   │   │   ├── phoneService.ts
│   │   │   │   ├── reminderService.ts
│   │   │   │   ├── schedulerService.ts
│   │   │   │   ├── spokenText.ts
│   │   │   │   └── userService.ts
│   │   │   ├── telephony
│   │   │   │   ├── signature.ts
│   │   │   │   ├── telnyx.ts
│   │   │   │   └── types.ts
│   │   │   ├── types.d.ts
│   │   │   └── worker
│   │   │       └── index.ts
│   │   ├── tests
│   │   │   ├── billing.test.ts
│   │   │   ├── e164.test.ts
│   │   │   ├── messageEnhancer.test.ts
│   │   │   ├── schedule.test.ts
│   │   │   ├── spokenText.test.ts
│   │   │   ├── validators.test.ts
│   │   │   └── webhook.test.ts
│   │   ├── tsconfig.build.json
│   │   ├── tsconfig.json
│   │   └── vitest.config.ts
│   └── web
│       ├── .env.example
│       ├── eslint.config.mjs
│       ├── index.html
│       ├── package.json
│       ├── public
│       │   └── assets
│       │       ├── 1.png
│       │       ├── 2.png
│       │       ├── SFPRODISPLAYREGULAR.OTF
│       │       ├── call.png
│       │       ├── done.png
│       │       ├── happy.png
│       │       ├── introduction.wav
│       │       ├── maya.gif
│       │       ├── not-found.png
│       │       ├── sad.png
│       │       ├── schedule.png
│       │       └── welcome.png
│       ├── src
│       │   ├── App.tsx
│       │   ├── components
│       │   │   ├── AppLayout.tsx
│       │   │   ├── BottomNav.tsx
│       │   │   ├── CallDetailSheet.tsx
│       │   │   ├── ConfirmSheet.tsx
│       │   │   ├── EmptyState.tsx
│       │   │   ├── ErrorPage.tsx
│       │   │   ├── GlassButton.tsx
│       │   │   ├── OnboardingGate.tsx
│       │   │   ├── PhoneVerifyOnboarding.tsx
│       │   │   ├── ProtectedRoute.tsx
│       │   │   ├── Skeleton.tsx
│       │   │   ├── SoftAurora.tsx
│       │   │   ├── Spinner.tsx
│       │   │   ├── StatusChip.tsx
│       │   │   ├── SubscribePrompt.tsx
│       │   │   ├── SubscribeSheet.tsx
│       │   │   └── Toast.tsx
│       │   ├── env.ts
│       │   ├── hooks
│       │   │   ├── queries.ts
│       │   │   └── useAuthedFetch.ts
│       │   ├── lib
│       │   │   ├── api.ts
│       │   │   ├── confetti.ts
│       │   │   ├── displayName.ts
│       │   │   ├── format.ts
│       │   │   ├── theme.tsx
│       │   │   └── types.ts
│       │   ├── main.tsx
│       │   ├── pages
│       │   │   ├── DashboardPage.tsx
│       │   │   ├── HistoryPage.tsx
│       │   │   ├── OnboardingMayaPage.tsx
│       │   │   ├── PlansPage.tsx
│       │   │   ├── ProfilePage.tsx
│       │   │   ├── ReminderDetailPage.tsx
│       │   │   ├── ReminderNewPage.tsx
│       │   │   ├── SettingsPage.tsx
│       │   │   ├── SetupRequiredPage.tsx
│       │   │   ├── SignInPage.tsx
│       │   │   ├── SsoCallbackPage.tsx
│       │   │   ├── SubscriptionsPage.tsx
│       │   │   └── iosTheme.ts
│       │   └── styles.css
│       ├── tsconfig.json
│       ├── vercel.json
│       └── vite.config.ts
└── package.json
```

## 🛠️ Development Setup

### Node.js / JavaScript
1. Install Node.js (v18+ recommended)
2. Install dependencies: `npm install` (or `yarn` / `pnpm install` / `bun install`)
3. Start the dev server: see the **Quick Start** above

## 🚢 Deployment

### Vercel

This project is configured for [Vercel](https://vercel.com). Push to the connected branch or run `vercel` locally.

> ⚙️ CI/CD is configured via GitHub Actions (see `.github/workflows/`).

## 👥 Contributors

Thanks to everyone who has contributed to this project:

<p align="left">
<a href="https://github.com/iamkanishhk" title="iamkanishhk"><img src="https://avatars.githubusercontent.com/u/208489037?v=4&s=64" width="64" height="64" alt="iamkanishhk" style="border-radius:50%" /></a>
</p>

[See the full list of contributors →](https://github.com/iamkanishhk/RemindMe/graphs/contributors)

## 👥 Contributing

Contributions are welcome! Here's the standard flow:

1. **Fork** the repository
2. **Clone** your fork: `git clone https://github.com/iamkanishhk/RemindMe.git`
3. **Branch**: `git checkout -b feature/your-feature`
4. **Commit**: `git commit -m 'feat: add some feature'`
5. **Push**: `git push origin feature/your-feature`
6. **Open** a pull request

Please follow the existing code style and include tests for new behavior where applicable.

---

