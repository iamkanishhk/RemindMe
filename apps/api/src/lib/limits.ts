export const LIMITS = {
  phoneCreatePerUser: { limit: 10, windowSeconds: 3600 },
  callsPerUserHour: { limit: 20, windowSeconds: 3600 },
  callsPerUserDay: { limit: 100, windowSeconds: 86400 },
  callsPerDestinationHour: { limit: 10, windowSeconds: 3600 },
  callsPerDestinationDay: { limit: 50, windowSeconds: 86400 }
} as const;

export const STALE_CALLING_GRACE_MS = 5 * 60 * 1000;