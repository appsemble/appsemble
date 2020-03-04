import settings from './settings';

export default function redirectOAuth2(redirect: string): void {
  const href = new URL('/connect/authorize', settings.apiUrl);
  href.searchParams.set('client_id', `app:${settings.id}`);
  href.searchParams.set('redirect_uri', `${window.location.origin}/Callback`);
  href.searchParams.set('response_type', 'code');
  href.searchParams.set('scope', 'openid');
  localStorage.redirect = redirect;
  window.location.replace(`${href}`);
}
