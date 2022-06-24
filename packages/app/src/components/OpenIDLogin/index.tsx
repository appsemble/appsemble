import { OAuth2LoginButton, useQuery, useToggle } from '@appsemble/react-components';
import { ReactElement } from 'react';
import { FormattedMessage } from 'react-intl';

import { oauth2Scope } from '../../utils/constants';
import { apiUrl, appId, logins, showAppsembleOAuth2Login } from '../../utils/settings';
import styles from './index.module.css';
import { messages } from './messages';

interface OpenIDLoginProps {
  disabled: boolean;
}

export function OpenIDLogin({ disabled }: OpenIDLoginProps): ReactElement {
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
        <OAuth2LoginButton
          authorizationUrl={String(new URL('/connect/authorize', apiUrl))}
          className={buttonProps.className}
          icon="user"
          {...buttonProps}
        >
          <FormattedMessage {...messages.loginWith} values={{ name: 'Appsemble' }} />
        </OAuth2LoginButton>
      ) : null}
      {logins?.map(({ icon, id, name, type }) => (
        <OAuth2LoginButton
          authorizationUrl={String(new URL(`/connect/authorize/${type}/${id}`, apiUrl))}
          className={buttonProps.className}
          icon={icon}
          key={`${type} ${id}`}
          {...buttonProps}
        >
          <FormattedMessage {...messages.loginWith} values={{ name }} />
        </OAuth2LoginButton>
      ))}
    </>
  );
}
