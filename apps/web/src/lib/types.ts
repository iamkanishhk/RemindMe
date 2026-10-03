export type RepeatRule = 'NONE' | 'DAILY' | 'WEEKLY';

export type BillingMode = 'none' | 'trial' | 'paid' | 'blocked';

export type SubscriptionStatus =
  | 'ACTIVE'
  | 'ON_HOLD'
  | 'CANCELLED'
  | 'EXPIRED'
  | 'FAILED';

export interface BillingStatus {
  mode: BillingMode;
  status: SubscriptionStatus | null;
  providerCustomerId: string | null;
  providerSubscriptionId: string | null;
  productId: string | null;
  currency: string | null;
  amountMinorUnits: number | null;
  interval: string | null;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  trial: { endsAt: string | null; callsUsed: number; callLimit: number } | null;
}

export type PlanId = 'monthly' | 'annual';

export interface BillingPlan {
  id: PlanId;
  productId: string;
  name: string;
  amountMinorUnits: number;
  currency: string;
  interval: string;
  intervalCount: number;
  monthsPerCharge: number;
  monthlyEquivalentMinorUnits: number | null;
  savingsPercent: number | null;
  trialDays: number;
  taxInclusive: boolean;
}

export type ReminderStatus =
  | 'SCHEDULED'
  | 'CALLING'
  | 'ANSWERED'
  | 'COMPLETED'
  | 'NO_ANSWER'
  | 'BUSY'
  | 'FAILED'
  | 'CANCELED';

export interface PhoneNumber {
  id: string;
  e164: string;
  verified: boolean;
  createdAt?: string;
}

export interface Reminder {
  id: string;
  message: string;
  timezone: string;
  scheduledAt: string;
  nextRunAt: string | null;
  nextLocal: string | null;
  repeatRule: RepeatRule;
  isEnabled: boolean;
  status: ReminderStatus;
  lastCallAt: string | null;
  phoneNumber: { id: string; e164: string } | null;
  createdAt: string;
  updatedAt: string;
}

export interface CallAttempt {
  id: string;
  status: ReminderStatus;
  startedAt: string;
  endedAt: string | null;
  detail: string | null;
  providerCallId?: string | null;
  reminderId?: string;
  reminderMessage?: string;
  destinationE164?: string | null;
}

export interface ReminderDetail extends Reminder {
  attempts: CallAttempt[];
}

export interface Me {
  id: string;
  email: string;
  phoneNumbers: { id: string; e164: string; verified: boolean }[];
  counts: { phoneNumbers: number; reminders: number };
  onboardingCompletedAt: string | null;
  createdAt: string;
}

export interface Page<T> {
  items: T[];
  nextCursor: string | null;
}

export interface ApiErrorBody {
  error: { code: string; message: string; details?: unknown };
}