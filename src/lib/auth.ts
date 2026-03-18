import type { AuthUser } from '@/types';

const COOKIE_NAME = 'snoonu_session';

/** Reads the auth user from the cookie (client-side). */
export function getUser(): AuthUser | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp('(?:^|; )' + COOKIE_NAME + '=([^;]*)'));
  if (!match) return null;
  try {
    return JSON.parse(decodeURIComponent(match[1])) as AuthUser;
  } catch {
    return null;
  }
}

/** Stores the auth user in a session cookie. */
export function setUser(user: AuthUser): void {
  document.cookie =
    COOKIE_NAME +
    '=' +
    encodeURIComponent(JSON.stringify(user)) +
    '; path=/; SameSite=Lax';
}

/** Clears the auth cookie. */
export function clearUser(): void {
  document.cookie = COOKIE_NAME + '=; path=/; max-age=0';
}

/** Returns the dashboard home path for a given role. */
export function roleHome(role: string): string {
  if (role === 'Admin')    return '/admin/schedule';
  if (role === 'Supplier') return '/supplier/schedule';
  return '/3pl/request';
}
