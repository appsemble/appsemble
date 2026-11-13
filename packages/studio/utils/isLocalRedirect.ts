export function isLocalRedirect(redirect: unknown): redirect is string {
  if (typeof redirect !== 'string' || !redirect.startsWith('/')) {
    return false;
  }
  try {
    return new URL(redirect, window.location.origin).origin === window.location.origin;
  } catch {
    return false;
  }
}
