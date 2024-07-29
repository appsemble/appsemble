import { useNavigate } from 'react-router-dom';

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
 * @returns the navigate callback towards the login page.
 */
export function useStartAccountLinking(linking: Linking): {
  /**
   * Links to the `Login` page where the account associated login methods are shown to link the
   * account with.
   */
  navigate: () => void;
  shouldLink: boolean;
} {
  const navigate = useNavigate();

  const { email, externalId, logins, secret, showAppsembleLogin, showAppsembleOAuth2Login } =
    linking;
  const hasLogin = showAppsembleOAuth2Login || showAppsembleLogin || Boolean(logins);
  const shouldLink = externalId && secret && email && hasLogin;

  // TODO handle differently
  if (!shouldLink) {
    return { navigate: () => null, shouldLink };
  }
  sessionStorage.setItem(storageKey, JSON.stringify(linking));

  return { navigate: () => navigate('/Login'), shouldLink };
}

/**
 * Load the state as stored in `sessionStorage`.
 *
 * @returns The account linking state as stored in `sessionStorage`.
 */
export function loadAccountLinkingState(): Linking | null {
  try {
    return JSON.parse(sessionStorage.getItem(storageKey));
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
