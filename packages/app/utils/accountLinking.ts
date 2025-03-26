const storageKey = 'linking';

interface Linking {
  externalId: string;
  secret: string;
  email: string;
  logins: string;
  showAppsembleOAuth2Login: boolean;
  showAppsembleLogin: boolean;
}

/**
 * Initiate the account linking process.
 *
 * @param linking the account information to be linked.
 * @returns whether to navigate back to login page to link the account.
 */
export function startAccountLinking(linking: Linking): boolean {
  const { email, externalId, logins, secret, showAppsembleLogin, showAppsembleOAuth2Login } =
    linking;
  const hasLogin = showAppsembleOAuth2Login || showAppsembleLogin || Boolean(logins);
  const shouldLink = externalId && secret && email && hasLogin;

  if (!shouldLink) {
    return false;
  }
  sessionStorage.setItem(storageKey, JSON.stringify(linking));

  return shouldLink;
}

/**
 * Load the state as stored in `sessionStorage`.
 *
 * @returns The account linking state as stored in `sessionStorage`.
 */
export function loadAccountLinkingState(): Linking | null {
  try {
    return JSON.parse(sessionStorage.getItem(storageKey)!);
  } catch {
    return null;
  }
}

/**
 * Clear the linking state from `sessionStorage`.
 */
export function clearAccountLinkingState(): void {
  sessionStorage.removeItem(storageKey);
}
