import { clerkMiddleware } from '@clerk/express';
import cors from 'cors';
import express, { type Express } from 'express';
import helmet from 'helmet';
import { env, corsOriginList } from './config';
import { errorMiddleware, notFoundMiddleware } from './lib/errors';
import { requestLogger } from './middleware/httpLog';
import { callsRouter } from './routes/calls';
import healthRouter from './routes/health';
import { phoneNumbersRouter } from './routes/phoneNumbers';
import { remindersRouter } from './routes/reminders';
import { usersRouter } from './routes/users';
import { webhookRouter } from './routes/webhook';
import { billingRouter, billingWebhookRouter } from './routes/billing';

export function createApp(): Express {
  const app = express();
  app.disable('x-powered-by');

  app.use(helmet());

  const origins = corsOriginList();
  app.use(
    cors({
      origin: origins.length > 0 ? origins : '*'
    })
  );

  // Inbound telephony webhooks need the raw body for signature verification; mount before JSON parsing.
  app.use('/api/calls/webhook', express.text({ type: '*/*' }), webhookRouter);
  app.use('/api/billing/webhook', express.text({ type: '*/*' }), billingWebhookRouter);

  app.use(express.json({ limit: '1mb' }));
  app.use(requestLogger);

  // Clerk attaches req.auth (userId, claims); mount after body parsing, before the routers that gate on it.
  app.use(clerkMiddleware({ secretKey: env.CLERK_SECRET_KEY, publishableKey: env.CLERK_PUBLISHABLE_KEY }));

  app.use('/', healthRouter);
  app.use('/api/users', usersRouter);
  app.use('/api/phone-numbers', phoneNumbersRouter);
  app.use('/api/reminders', remindersRouter);
  app.use('/api/calls', callsRouter);
  app.use('/api/billing', billingRouter);

  app.use(notFoundMiddleware);
  app.use(errorMiddleware);

  return app;
}