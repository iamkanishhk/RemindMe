const read = (key: string): string | undefined => import.meta.env[key] as string | undefined;

export const config = {
  apiBaseUrl: read('VITE_API_BASE_URL') ?? 'http://localhost:3000',
  clerkPublishableKey: read('VITE_CLERK_PUBLISHABLE_KEY') ?? ''
};