/**
 * Best-effort display name for a signed-in user.
 * Prefers the Clerk full name, then falls back to a capitalized email local-part.
 * Returns null when neither is available so callers can pick their own fallback copy.
 */
export function resolveDisplayName(
  fullName?: string | null,
  email?: string | null
): string | null {
  const full = fullName?.trim();
  if (full) return full;

  const local = email?.trim().split('@')[0]?.trim();
  if (local) return local.charAt(0).toUpperCase() + local.slice(1);

  return null;
}
