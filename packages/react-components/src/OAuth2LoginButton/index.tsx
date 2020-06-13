import { Button } from '@appsemble/react-components';
import { OAuth2LoginOptions, startOAuth2Login } from '@appsemble/web-utils';
import * as React from 'react';

type OAuth2LoginButtonProps = React.ComponentPropsWithoutRef<typeof Button> & OAuth2LoginOptions;

/**
 * A button which will initiate the OAuth2 login process.
 *
 * When the button is clicked, the user will be redirected to the authorization URL. The state and
 * authorization url will be stored in `sessionStorage`.
 */
export default function OAuth2LoginButton({
  authorizationUrl,
  clientId,
  redirectUrl,
  scope,
  ...props
}: OAuth2LoginButtonProps): React.ReactElement {
  const onClick = React.useCallback(() => {
    startOAuth2Login({ authorizationUrl, clientId, redirectUrl, scope });
  }, [authorizationUrl, clientId, redirectUrl, scope]);

  return <Button {...props} onClick={onClick} />;
}
