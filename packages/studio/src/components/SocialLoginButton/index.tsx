import { Button } from '@appsemble/react-components';
import * as React from 'react';
import { FormattedMessage, MessageDescriptor } from 'react-intl';

import type { OAuth2Provider } from '../../types';
import randomString from '../../utils/randomString';

interface SocialLoginButtonProps extends React.ComponentPropsWithoutRef<typeof Button> {
  /**
   * A message descriptor to format with the provider name.
   */
  label: MessageDescriptor;

  /**
   * The OAuth2 provider configuration for which to render a button.
   */
  provider: OAuth2Provider;
}

/**
 * A button which will initiate the OAuth2 login process.
 *
 * When the button is clicked, the user will be redirected to the authorization URL. The state and
 * authorization url will be stored in `sessionStorage`, so {@link OAuth2Connect} can load this.
 */
export default function SocialLoginButton({
  label,
  provider,
  ...props
}: SocialLoginButtonProps): React.ReactElement {
  const onClick = React.useCallback(() => {
    const url = new URL(provider.authorizationUrl);
    const state = randomString();
    url.searchParams.set('client_id', provider.clientId);
    url.searchParams.set('redirect_uri', `${window.location.origin}/callback`);
    url.searchParams.set('response_type', 'code');
    url.searchParams.set('scope', provider.scope);
    url.searchParams.set('state', state);
    sessionStorage.setItem(
      'oauth2Connecting',
      JSON.stringify({ state, authorizationUrl: provider.authorizationUrl }),
    );
    window.location.href = String(url);
  }, [provider]);

  return (
    <Button {...props} icon={provider.icon} iconPrefix="fab" onClick={onClick}>
      <FormattedMessage {...label} values={{ name: provider.name }} />
    </Button>
  );
}
