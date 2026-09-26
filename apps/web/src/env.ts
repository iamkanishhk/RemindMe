const read = (key: string): string | undefined => import.meta.env[key] as string | undefined;

export const config = {
  apiBaseUrl: read('VITE_API_BASE_URL') ?? 'https://remindmeapi-production.up.railway.app',
  clerkPublishableKey: read('VITE_CLERK_PUBLISHABLE_KEY') ?? ''
};