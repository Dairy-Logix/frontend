/**
 * Holds the short-lived impersonation token. Kept in sessionStorage (tab-scoped,
 * ephemeral) and separate from the super-admin's real tokens, so the admin's
 * own session is never overwritten — when impersonation ends, normal auth
 * simply resumes. The axios client prefers this token when present.
 */
const KEY = 'imp-token';

export function getImpToken(): string | null {
  if (typeof window === 'undefined') return null;
  return window.sessionStorage.getItem(KEY);
}

export function setImpToken(token: string): void {
  if (typeof window === 'undefined') return;
  window.sessionStorage.setItem(KEY, token);
}

export function clearImpToken(): void {
  if (typeof window === 'undefined') return;
  window.sessionStorage.removeItem(KEY);
}

export function isImpersonating(): boolean {
  return !!getImpToken();
}
