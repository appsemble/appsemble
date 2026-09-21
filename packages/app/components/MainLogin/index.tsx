import {
  Button,
  type LoginFormValues,
  Message,
  Login as PasswordLogin,
  useQuery,
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
import { TotpSetup, type TotpSetupTokenResponse } from '../TotpSetup/index.js';

export function MainLogin(): ReactNode {
  const { lang } = useParams<{ lang: string }>();
  const busy = useToggle(false);
  const { formatMessage } = useIntl();
  const push = useMessages();
  const qs = useQuery();

  const { definition } = useAppDefinition();
  const { cancelTotpLogin, completeTotpLogin, logout, passwordLogin, totpLogin, totpPending } =
    useAppMember();
  const linking = loadAccountLinkingState();
  const redirect = qs.get('redirect');

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
        await passwordLogin({
          username: credentials.email,
          password: credentials.password,
          redirect: redirect ?? undefined,
        });
      } catch (error: unknown) {
        busy.disable();
        throw error;
      }
      busy.disable();
    },
    [busy, passwordLogin, redirect],
  );

  const handleReturn = useCallback((): void => {
    clearAccountLinkingState();
    logout();
    navigate('/Login');
  }, [logout, navigate]);

  const onTotpVerify = useCallback(
    async (token: string): Promise<void> => {
      busy.enable();
      try {
        await totpLogin(token);
      } catch (error: unknown) {
        busy.disable();
        push({ body: formatMessage(messages.totpError), color: 'danger' });
        throw error;
      }
      busy.disable();
    },
    [busy, formatMessage, push, totpLogin],
  );

  const onTotpCancel = useCallback((): void => {
    cancelTotpLogin();
  }, [cancelTotpLogin]);

  const onTotpSetupComplete = useCallback(
    async (tokens: TotpSetupTokenResponse | null): Promise<void> => {
      // Enrollment completes the pending login itself, so the code is never submitted twice.
      if (!tokens) {
        cancelTotpLogin();
        return;
      }
      busy.enable();
      try {
        await completeTotpLogin(tokens);
      } catch (error: unknown) {
        busy.disable();
        push({ body: formatMessage(messages.totpError), color: 'danger' });
        cancelTotpLogin();
        throw error;
      }
      busy.disable();
    },
    [busy, cancelTotpLogin, completeTotpLogin, formatMessage, push],
  );

  // Show TOTP setup or verification screen if pending
  if (totpPending) {
    // If user doesn't have TOTP enabled, show setup screen
    if (!totpPending.totpEnabled) {
      return (
        <TotpSetup
          isRequired
          onCancel={onTotpCancel}
          onComplete={onTotpSetupComplete}
          totpToken={totpPending.totpToken}
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
