import {
  AsyncButton,
  Content,
  Loader,
  Message,
  SSOLoginButton,
  Title,
  useConfirmation,
  useData,
  useLocationString,
  useMessages,
  useMeta,
  useToggle,
} from '@appsemble/react-components';
import { type OAuth2Provider } from '@appsemble/types';
import { noop } from '@appsemble/utils';
import axios from 'axios';
import { type ReactNode, useCallback } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { useNavigate } from 'react-router-dom';

import styles from './index.module.css';
import { messages } from './messages.js';
import { useUser } from '../../../components/UserProvider/index.js';
import { logins } from '../../../utils/settings.js';

interface ConnectedAccount {
  authorizationUrl: string;
}

interface OrganizationSsoIdentity {
  id: string;
  issuer: string;
  subject: string;
  username: string | null;
  organizations: { id: string; name: string | null; provider: string }[];
}

interface OrganizationSsoIdentityRowProps {
  readonly identity: OrganizationSsoIdentity;
  readonly onUnlink: (identity: OrganizationSsoIdentity) => Promise<void>;
}

function OrganizationSsoIdentityRow({
  identity,
  onUnlink,
}: OrganizationSsoIdentityRowProps): ReactNode {
  const unlink = useConfirmation({
    title: <FormattedMessage {...messages.unlink} />,
    body: (
      <FormattedMessage
        {...messages.confirmUnlink}
        values={{ issuer: identity.issuer, subject: identity.subject }}
      />
    ),
    cancelLabel: <FormattedMessage {...messages.cancel} />,
    confirmLabel: <FormattedMessage {...messages.unlink} />,
    action: () => onUnlink(identity),
  });

  return (
    <section
      aria-label={`${identity.issuer} (${identity.subject})`}
      className={`box ${styles.identity}`}
    >
      <Title level={3} size={5}>
        {identity.username ?? identity.subject}
      </Title>
      {identity.organizations.map((organization) => (
        <p key={organization.id}>
          <FormattedMessage
            {...messages.organization}
            values={{
              organization: organization.name || organization.id,
              provider: organization.provider,
            }}
          />
        </p>
      ))}
      <div className="is-size-7 has-text-grey mb-3">
        <p>
          <FormattedMessage {...messages.issuer} values={{ issuer: identity.issuer }} />
        </p>
        {identity.username ? (
          <p>
            <FormattedMessage {...messages.accountId} values={{ subject: identity.subject }} />
          </p>
        ) : null}
      </div>
      <AsyncButton onClick={() => unlink().catch(noop)}>
        <FormattedMessage {...messages.unlink} />
      </AsyncButton>
    </section>
  );
}

/**
 * Manage login accounts linked to the current user.
 */
export function SocialPage(): ReactNode {
  useMeta(messages.title);

  const { formatMessage } = useIntl();
  const push = useMessages();
  const navigate = useNavigate();
  const location = useLocationString();
  const connecting = useToggle();
  const { logout, setHasNoLoginMethods } = useUser();

  const {
    data: accounts,
    error,
    loading,
    setData: setAccounts,
  } = useData<ConnectedAccount[]>('/api/users/current/auth/oauth2/authorizations');
  const {
    data: identities,
    error: identitiesError,
    loading: identitiesLoading,
    setData: setIdentities,
  } = useData<OrganizationSsoIdentity[]>('/api/users/current/auth/oidc/identities');

  const disconnect = useCallback(
    async ({ authorizationUrl, name }: OAuth2Provider) => {
      try {
        const { data: hasNoLoginMethods } = await axios.delete<boolean>(
          '/api/users/current/auth/oauth2/authorizations',
          {
            params: { authorizationUrl },
          },
        );
        setHasNoLoginMethods(hasNoLoginMethods);
      } catch {
        push(formatMessage(messages.disconnectError, { name }));
        return;
      }
      push({
        body: formatMessage(messages.disconnectSuccess, { name }),
        color: 'success',
      });
      setAccounts(accounts.filter((account) => account.authorizationUrl !== authorizationUrl));
    },
    [accounts, formatMessage, push, setAccounts, setHasNoLoginMethods],
  );

  const unlinkIdentity = useCallback(
    async (identity: OrganizationSsoIdentity) => {
      try {
        const { data } = await axios.delete<{ sessionRevoked: boolean }>(
          `/api/users/current/auth/oidc/identities/${identity.id}`,
        );
        setIdentities((current) => current.filter((linked) => linked.id !== identity.id));
        if (data.sessionRevoked) {
          logout();
          navigate('/login', { replace: true });
          return;
        }
        push({ body: formatMessage(messages.unlinkSuccess), color: 'success' });
      } catch (err: unknown) {
        push(
          axios.isAxiosError<{ message?: string }>(err) && err.response?.data?.message
            ? err.response.data.message
            : formatMessage(messages.unlinkError),
        );
      }
    },
    [formatMessage, logout, navigate, push, setIdentities],
  );

  if (loading || identitiesLoading) {
    return <Loader />;
  }

  if (error || identitiesError) {
    return (
      <Message color="danger">
        <FormattedMessage {...messages.error} />
      </Message>
    );
  }

  return (
    <Content>
      <Title>
        <FormattedMessage {...messages.title} />
      </Title>
      {logins.map((provider) =>
        accounts.some((account) => account.authorizationUrl === provider.authorizationUrl) ? (
          <AsyncButton
            className={`${styles.button} mb-4`}
            disabled={connecting.enabled}
            icon={provider.icon}
            key={provider.authorizationUrl}
            onClick={() => disconnect(provider)}
          >
            <FormattedMessage {...messages.disconnectAccount} values={{ name: provider.name }} />
          </AsyncButton>
        ) : (
          <SSOLoginButton
            authorizationUrl={provider.authorizationUrl}
            className={`${styles.button} mb-4`}
            clientId={provider.clientId}
            disabled={connecting.enabled}
            icon={provider.icon}
            key={provider.authorizationUrl}
            onClick={connecting.enable}
            redirect={location}
            redirectUrl="/callback"
            scope={provider.scope}
          >
            <FormattedMessage {...messages.connectAccount} values={{ name: provider.name }} />
          </SSOLoginButton>
        ),
      )}
      <Title level={2}>
        <FormattedMessage {...messages.organizationSso} />
      </Title>
      {identities.length ? (
        identities.map((identity) => (
          <OrganizationSsoIdentityRow
            identity={identity}
            key={identity.id}
            onUnlink={unlinkIdentity}
          />
        ))
      ) : (
        <p>
          <FormattedMessage {...messages.noIdentities} />
        </p>
      )}
    </Content>
  );
}
