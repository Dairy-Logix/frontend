// Token persistence with "Remember me" support.
//
// Remember me CHECKED   → tokens live in localStorage and survive a browser restart.
// Remember me UNCHECKED → tokens live in sessionStorage and are dropped when the
//                         tab/window closes.
//
// Reads transparently check both stores, and the persisted Zustand auth state
// (see auth-store.ts) is pinned to the same store as the tokens so the cached
// user object never outlives its session.

const ACCESS_TOKEN_KEY = 'accessToken';
const REFRESH_TOKEN_KEY = 'refreshToken';

const isBrowser = () => typeof window !== 'undefined';

/**
 * The storage that currently holds the session. When no session exists yet it
 * defaults to localStorage; callers that need a definite target before any
 * token is written should pass an explicit `remember` to setTokens().
 */
export function getActiveStorage(): Storage | null {
  if (!isBrowser()) return null;
  if (window.localStorage.getItem(ACCESS_TOKEN_KEY)) return window.localStorage;
  if (window.sessionStorage.getItem(ACCESS_TOKEN_KEY)) return window.sessionStorage;
  return window.localStorage;
}

export function getAccessToken(): string | null {
  if (!isBrowser()) return null;
  return (
    window.localStorage.getItem(ACCESS_TOKEN_KEY) ??
    window.sessionStorage.getItem(ACCESS_TOKEN_KEY)
  );
}

export function getRefreshToken(): string | null {
  if (!isBrowser()) return null;
  return (
    window.localStorage.getItem(REFRESH_TOKEN_KEY) ??
    window.sessionStorage.getItem(REFRESH_TOKEN_KEY)
  );
}

/**
 * Persist a session's tokens. When `remember` is provided it picks the store
 * (true → local, false → session) and clears the other so tokens never live in
 * both. When omitted (e.g. a token refresh), tokens stay wherever the session
 * already lives.
 */
export function setTokens(
  accessToken: string,
  refreshToken: string,
  remember?: boolean,
): void {
  if (!isBrowser()) return;
  const target =
    remember === undefined
      ? (getActiveStorage() as Storage)
      : remember
        ? window.localStorage
        : window.sessionStorage;
  const other =
    target === window.localStorage ? window.sessionStorage : window.localStorage;

  target.setItem(ACCESS_TOKEN_KEY, accessToken);
  target.setItem(REFRESH_TOKEN_KEY, refreshToken);
  // Never leave a stale copy in the other store.
  other.removeItem(ACCESS_TOKEN_KEY);
  other.removeItem(REFRESH_TOKEN_KEY);
}

/** Replace just the access token (token refresh), preserving its location. */
export function setAccessToken(accessToken: string): void {
  if (!isBrowser()) return;
  (getActiveStorage() as Storage).setItem(ACCESS_TOKEN_KEY, accessToken);
}

export function clearTokens(): void {
  if (!isBrowser()) return;
  window.localStorage.removeItem(ACCESS_TOKEN_KEY);
  window.localStorage.removeItem(REFRESH_TOKEN_KEY);
  window.sessionStorage.removeItem(ACCESS_TOKEN_KEY);
  window.sessionStorage.removeItem(REFRESH_TOKEN_KEY);
}
