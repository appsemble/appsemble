import { SSOLoginButton, useQuery, useToggle } from '@appsemble/react-components';
import { type ReactNode } from 'react';
import { FormattedMessage } from 'react-intl';

import styles from './index.module.css';
import { messages } from './messages.js';
import { type Login } from '../../types.js';
import { oauth2Scope } from '../../utils/constants.js';
import { apiUrl, appId } from '../../utils/settings.js';

export interface OpenIDLoginProps {
  readonly disabled: boolean;
  readonly logins: Login[];
  readonly showAppsembleOAuth2Login: boolean;
}

export function OpenIDLogin({
  disabled,
  logins,
  showAppsembleOAuth2Login,
}: OpenIDLoginProps): ReactNode {
  const qs = useQuery();
  const busy = useToggle();

  const buttonProps = {
    className: `is-fullwidth my-2 ${styles.button}`,
    clientId: `app:${appId}`,
    disabled: disabled || busy.enabled,
    onClick: busy.enable,
    redirectUrl: '/Callback',
    scope: oauth2Scope,
    redirect: qs.get('redirect'),
  };

  return (
    <>
      {showAppsembleOAuth2Login ? (
        // @ts-expect-error 2322 null is not assignable to type (strictNullChecks)
        <SSOLoginButton
          authorizationUrl={String(new URL('/connect/authorize', apiUrl))}
          data-testid="login-with-appsemble"
          icon="user"
          {...buttonProps}
        >
          <FormattedMessage {...messages.loginWith} values={{ name: 'Appsemble' }} />
        </SSOLoginButton>
      ) : null}
      {logins?.map(({ icon, id, name, type }) => (
        // @ts-expect-error 2322 null is not assignable to type (strictNullChecks)
        <SSOLoginButton
          authorizationUrl={String(new URL(`/connect/authorize/${type}/${id}`, apiUrl))}
          icon={icon}
          key={`${type} ${id}`}
          {...buttonProps}
        >
          <FormattedMessage {...messages.loginWith} values={{ name }} />
        </SSOLoginButton>
      ))}
    </>
  );
}
