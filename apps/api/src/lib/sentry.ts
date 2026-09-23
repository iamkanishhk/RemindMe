import * as Sentry from '@sentry/node';
import { env } from '../config';

let initialized = false;

export function initSentry(): void {
  if (initialized || !env.SENTRY_DSN) return;
  Sentry.init({
    dsn: env.SENTRY_DSN,
    environment: env.NODE_ENV,
    serverName: 'remindme-api',
    // Never report personal data (phone numbers, reminder text, headers).
    beforeSend(event) {
      delete event.request;
      if (event.extra) {
        for (const key of Object.keys(event.extra)) {
          if (key.match(/phone|message|email|userId|title/i)) delete event.extra[key];
        }
      }
      return event;
    }
  });
  initialized = true;
}

export { Sentry };