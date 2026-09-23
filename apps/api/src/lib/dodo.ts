import DodoPayments from 'dodopayments';
import { env } from '../config';

let client: DodoPayments | null = null;

export function getDodoClient(): DodoPayments {
  if (!client) {
    client = new DodoPayments({
      bearerToken: env.DODO_PAYMENTS_API_KEY,
      webhookKey: env.DODO_PAYMENTS_WEBHOOK_KEY,
      environment: env.DODO_PAYMENTS_ENVIRONMENT
    });
  }
  return client;
}