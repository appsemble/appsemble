import {
  Button,
  type LoginFormValues,
  Message,
  Login as PasswordLogin,
  useToggle,
} from '@appsemble/react-components';
import { type ReactNode, useCallback } from 'react';
import { FormattedMessage } from 'react-intl';
import { useNavigate, useParams } from 'react-router-dom';

import styles from './index.module.css';
import { messages } from './messages.js';
import { clearAccountLinkingState, loadAccountLinkingState } from '../../utils/accountLinking.js';
import {
  enableSelfRegistration,
  logins,
  showAppsembleLogin,
  showAppsembleOAuth2Login,
} from '../../utils/settings.js';
import { useAppDefinition } from '../AppDefinitionProvider/index.js';
import { useAppMember } from '../AppMemberProvider/index.js';
import { OpenIDLogin, type OpenIDLoginProps } from '../OpenIDLogin/index.js';

export function MainLogin(): ReactNode {
  const { lang } = useParams<{ lang: string }>();
  const busy = useToggle(false);

  const { definition } = useAppDefinition();
  const { logout, passwordLogin } = useAppMember();
  const linking = loadAccountLinkingState();

  const openIDLoginProps: OpenIDLoginProps = {
    disabled: busy.enabled,
    showAppsembleOAuth2Login:
      (linking && linking.showAppsembleOAuth2Login) ?? showAppsembleOAuth2Login,
    logins: linking
      ? logins.filter((login) => linking.logins.includes(`${login.type}:${login.id}`))
      : logins,
  };

  const navigate = useNavigate();

  const onPasswordLogin = useCallback(
    async (credentials: LoginFormValues): Promise<void> => {
      busy.enable();
      try {
        await passwordLogin({ username: credentials.email, password: credentials.password });
      } catch (error: unknown) {
        busy.disable();
        throw error;
      }
      busy.disable();
    },
    [busy, passwordLogin],
  );

  const handleReturn = useCallback((): void => {
    clearAccountLinkingState();
    logout();
    navigate('/Login');
  }, [logout, navigate]);

  return (
    <>
      {linking && definition.security?.default?.policy !== 'invite' ? (
        <Message>
          <FormattedMessage {...messages.link} values={{ email: linking.email }} />
        </Message>
      ) : null}
      {showAppsembleLogin ? (
        <PasswordLogin
          enableRegistration={enableSelfRegistration}
          onPasswordLogin={onPasswordLogin}
          registerLink={`/${lang}/Register`}
          resetPasswordLink={`/${lang}/Reset-Password`}
        />
      ) : null}
      {definition.security?.default?.policy === 'invite' ? null : (
        <>
          <OpenIDLogin {...openIDLoginProps} />
          {linking ? (
            <Button
              className={`is-fullwidth my-2 ${styles.button}`}
              icon="arrow-left"
              onClick={handleReturn}
            >
              <FormattedMessage {...messages.return} />
            </Button>
          ) : null}
        </>
      )}
    </>
  );
}
