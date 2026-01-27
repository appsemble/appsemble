import {
  Button,
  type LoginFormValues,
  Message,
  Login as PasswordLogin,
  useMessages,
  useToggle,
} from '@appsemble/react-components';
import { type ReactNode, useCallback } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
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
import { TotpLogin } from '../TotpLogin/index.js';
import { TotpSetup } from '../TotpSetup/index.js';

export function MainLogin(): ReactNode {
  const { lang } = useParams<{ lang: string }>();
  const busy = useToggle(false);
  const { formatMessage } = useIntl();
  const push = useMessages();

  const { definition } = useAppDefinition();
  const { cancelTotpLogin, logout, passwordLogin, totpLogin, totpPending } = useAppMember();
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

  const handleTotpLogin = useCallback(
    async (token: string, cancelOnError = false): Promise<void> => {
      busy.enable();
      try {
        await totpLogin(token);
      } catch (error: unknown) {
        busy.disable();
        push({ body: formatMessage(messages.totpError), color: 'danger' });
        if (cancelOnError) {
          cancelTotpLogin();
        }
        throw error;
      }
      busy.disable();
    },
    [busy, cancelTotpLogin, formatMessage, push, totpLogin],
  );

  const onTotpVerify = useCallback(
    async (token: string): Promise<void> => {
      await handleTotpLogin(token, false);
    },
    [handleTotpLogin],
  );

  const onTotpCancel = useCallback((): void => {
    cancelTotpLogin();
  }, [cancelTotpLogin]);

  const onTotpSetupComplete = useCallback(
    async (token: string): Promise<void> => {
      await handleTotpLogin(token, true);
    },
    [handleTotpLogin],
  );

  // Show TOTP setup or verification screen if pending
  if (totpPending) {
    // If user doesn't have TOTP enabled, show setup screen
    if (!totpPending.totpEnabled) {
      return (
        <TotpSetup
          isRequired
          memberId={totpPending.memberId}
          onCancel={onTotpCancel}
          onComplete={onTotpSetupComplete}
        />
      );
    }
    // User has TOTP enabled, show verification screen
    return <TotpLogin onCancel={onTotpCancel} onVerify={onTotpVerify} />;
  }

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
