import { OAuth2LoginOptions, startOAuth2Login } from '@appsemble/web-utils';
import { ComponentPropsWithoutRef, ReactElement, useCallback, useState } from 'react';

import { Button } from '../index.js';

type OAuth2LoginButtonProps = ComponentPropsWithoutRef<typeof Button> & OAuth2LoginOptions;

/**
 * A button which will initiate the OAuth2 login process.
 *
 * When the button is clicked, the user will be redirected to the authorization URL. The state and
 * authorization url will be stored in `sessionStorage`.
 */
export function OAuth2LoginButton({
  authorizationUrl,
  clientId,
  onClick,
  redirect,
  redirectUrl,
  scope,
  ...props
}: OAuth2LoginButtonProps): ReactElement {
  const [loading, setLoading] = useState(false);

  const handleClick = useCallback(
    (event) => {
      setLoading(true);
      onClick?.(event);
      // This returns immediately, but loading the authorization URL may take some time. The user
      // will always be redirected to the authorization URL, even if it doesn’t load. This is why
      // the button is put in the loading state, but never leaves this state.
      startOAuth2Login({ authorizationUrl, clientId, redirect, redirectUrl, scope });
    },
    [authorizationUrl, clientId, onClick, redirect, redirectUrl, scope],
  );

  return <Button {...props} loading={loading} onClick={handleClick} />;
}
