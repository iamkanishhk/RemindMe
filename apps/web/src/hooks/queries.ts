import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuthedFetch } from './useAuthedFetch';
import type { BillingPlan, BillingStatus, CallAttempt, Me, PhoneNumber, PlanId, Reminder, ReminderDetail, ReminderStatus, RepeatRule } from '../lib/types';

export interface ReminderInputBody {
  title: string;
  message: string;
  timezone: string;
  localDateTime: string;
  repeatRule: RepeatRule;
  phoneNumberId: string;
}

export function useBillingStatus() {
  const authed = useAuthedFetch();
  return useQuery({
    queryKey: ['billing', 'status'],
    queryFn: async () => {
      const res = await authed<{ billing: BillingStatus }>('/api/billing/status');
      return res.billing;
    }
  });
}

export function useBillingPlans() {
  const authed = useAuthedFetch();
  return useQuery({
    // Prices live in Dodo, so keep them fresh for a while rather than
    // pinning them to the default stale window.
    queryKey: ['billing', 'plans'],
    staleTime: 60_000,
    queryFn: async () => {
      const res = await authed<{ plans: BillingPlan[] }>('/api/billing/plans');
      return res.plans;
    }
  });
}

export function useCreateCheckoutSession() {
  const authed = useAuthedFetch();
  return useMutation({
    mutationFn: async (planId: PlanId) => {
      const res = await authed<{ sessionId: string; checkoutUrl: string | null }>('/api/billing/checkout', { method: 'POST', body: JSON.stringify({ planId }) });
      return res;
    }
  });
}

export function useCancelSubscription() {
  const authed = useAuthedFetch();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const res = await authed<{ billing: BillingStatus }>('/api/billing/cancel', { method: 'POST', body: JSON.stringify({}) });
      return res.billing;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['billing', 'status'] });
    }
  });
}

export function useMe() {
  const authed = useAuthedFetch();
  return useQuery({
    queryKey: ['me'],
    queryFn: async () => {
      const res = await authed<{ user: Me }>('/api/users/me');
      return res.user;
    }
  });
}

export function useCompleteOnboarding() {
  const authed = useAuthedFetch();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const res = await authed<{ onboardingCompletedAt: string | null }>('/api/users/me/onboarding-complete', { method: 'POST', body: JSON.stringify({}) });
      return res;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['me'] });
    }
  });
}

export function useReminders(opts: { status?: ReminderStatus; upcoming?: boolean } = {}) {
  const authed = useAuthedFetch();
  return useQuery({
    queryKey: ['reminders', opts],
    queryFn: async () => {
      const q = new URLSearchParams();
      if (opts.status) q.set('status', opts.status);
      if (opts.upcoming) q.set('upcoming', 'true');
      const suffix = q.toString() ? `?${q.toString()}` : '';
      const res = await authed<{ reminders: Reminder[] }>(`/api/reminders${suffix}`);
      return res.reminders;
    }
  });
}

export function useReminder(id: string) {
  const authed = useAuthedFetch();
  return useQuery({
    queryKey: ['reminders', id],
    queryFn: async () => {
      const res = await authed<{ reminder: ReminderDetail }>(`/api/reminders/${id}`);
      return res.reminder;
    },
    enabled: id.length > 0
  });
}

export function useCreateReminder() {
  const authed = useAuthedFetch();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: ReminderInputBody) => {
      const res = await authed<{ reminder: Reminder }>('/api/reminders', { method: 'POST', body: JSON.stringify(body) });
      return res.reminder;
    },
    onSuccess: (r) => {
      void qc.invalidateQueries({ queryKey: ['reminders'] });
      void qc.invalidateQueries({ queryKey: ['me'] });
      void qc.setQueryData<ReminderDetail>(['reminders', r.id], { ...r, attempts: [] });
    }
  });
}

export function useUpdateReminder(id: string) {
  const authed = useAuthedFetch();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (patch: Partial<ReminderInputBody> & { isEnabled?: boolean }) => {
      const res = await authed<{ reminder: Reminder }>(`/api/reminders/${id}`, { method: 'PATCH', body: JSON.stringify(patch) });
      return res.reminder;
    },
    onSuccess: (r) => {
      void qc.invalidateQueries({ queryKey: ['reminders'] });
      void qc.invalidateQueries({ queryKey: ['me'] });
      void qc.invalidateQueries({ queryKey: ['reminders', r.id] });
    }
  });
}

export function useDeleteReminder() {
  const authed = useAuthedFetch();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await authed<{ deleted: boolean; id: string }>(`/api/reminders/${id}`, { method: 'DELETE' });
      return res;
    },
    onSuccess: (_r, id) => {
      void qc.invalidateQueries({ queryKey: ['reminders'] });
      void qc.invalidateQueries({ queryKey: ['me'] });
      void qc.removeQueries({ queryKey: ['reminders', id] });
    }
  });
}

export function usePhoneNumbers() {
  const authed = useAuthedFetch();
  return useQuery({
    queryKey: ['phoneNumbers'],
    queryFn: async () => {
      const res = await authed<{ phoneNumbers: PhoneNumber[] }>('/api/phone-numbers');
      return res.phoneNumbers;
    }
  });
}

export function useCreatePhoneNumber() {
  const authed = useAuthedFetch();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (e164: string) => {
      const res = await authed<{ phoneNumber: PhoneNumber }>('/api/phone-numbers', { method: 'POST', body: JSON.stringify({ e164 }) });
      return res.phoneNumber;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['phoneNumbers'] });
      void qc.invalidateQueries({ queryKey: ['me'] });
    }
  });
}

export function useVerifyPhoneNumber() {
  const authed = useAuthedFetch();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: { e164: string; clerkVerificationId: string }) => {
      const res = await authed<{ phoneNumber: PhoneNumber }>('/api/phone-numbers/verify', { method: 'POST', body: JSON.stringify(body) });
      return res.phoneNumber;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['phoneNumbers'] });
      void qc.invalidateQueries({ queryKey: ['me'] });
    }
  });
}

export function useDeletePhoneNumber() {
  const authed = useAuthedFetch();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, force }: { id: string; force?: boolean }) => {
      const q = force ? '?force=true' : '';
      const res = await authed<{ deleted: boolean }>(`/api/phone-numbers/${id}${q}`, { method: 'DELETE' });
      return res;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['phoneNumbers'] });
      void qc.invalidateQueries({ queryKey: ['me'] });
    }
  });
}

interface CallsPage {
  attempts: CallAttempt[];
  nextCursor: string | null;
}

export function useCalls() {
  const authed = useAuthedFetch();
  return useInfiniteQuery({
    queryKey: ['calls'],
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage: CallsPage) => lastPage.nextCursor ?? undefined,
    queryFn: async ({ pageParam }) => {
      const q = new URLSearchParams();
      if (pageParam) q.set('cursor', pageParam as string);
      const res = await authed<CallsPage>(`/api/calls?${q.toString()}`);
      return res;
    }
  });
}

export function useDeleteMe() {
  const authed = useAuthedFetch();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const res = await authed<{ deleted: boolean }>('/api/users/me', { method: 'DELETE' });
      return res;
    },
    onSuccess: () => {
      qc.clear();
    }
  });
}