import {
  Button,
  Content,
  Icon,
  Loader,
  Message,
  Subtitle,
  Title,
  useData,
  useLocationString,
  useMessages,
  useQuery,
} from '@appsemble/react-components';
import { PredefinedOrganizationRole } from '@appsemble/types';
import axios from 'axios';
import { type ReactNode, useCallback, useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { Link } from 'react-router-dom';

import styles from './index.module.css';
import { messages } from './messages.js';
import { useUser } from '../../components/UserProvider/index.js';
import { type Organization } from '../../types.js';

export function OrganizationInvitePage(): ReactNode {
  const { formatMessage } = useIntl();
  const push = useMessages();
  const qs = useQuery();
  const { logout, organizations, setOrganizations, userInfo } = useUser();
  const redirect = useLocationString();

  const [success, setSuccess] = useState(false);
  const {
    data: organization,
    error,
    loading,
  } = useData<Organization>(`/api/organization-invites/${qs.get('token')}`);
  const [submitting, setSubmitting] = useState(false);
  const [joined, setJoined] = useState(false);

  const sendResponse = useCallback(
    async (response: boolean) => {
      setSubmitting(true);

      try {
        await axios.post(`/api/organization-invites/${qs.get('token')}/respond`, {
          response,
        });
        setSuccess(true);
        setJoined(response);

        if (response) {
          setOrganizations([
            ...organizations,
            { ...organization, role: PredefinedOrganizationRole.Member },
          ]);
        }
      } catch (err) {
        if (axios.isAxiosError(err)) {
          const { data, status } = err.response;
          if (status === 404) {
            if (data.message === 'Organization not found') {
              push(formatMessage(messages.deletedOrganization));
            } else {
              push(formatMessage(messages.invalidInvite));
            }
          }

          if (status === 406) {
            push(formatMessage(messages.invalidOrganization));
          }
        } else {
          push(formatMessage(messages.error));
        }
        setSuccess(false);
      }
      setSubmitting(false);
    },
    [formatMessage, organization, organizations, push, qs, setOrganizations],
  );

  const onAcceptClick = useCallback(() => sendResponse(true), [sendResponse]);
  const onDeclineClick = useCallback(() => sendResponse(false), [sendResponse]);

  if (loading || !organizations) {
    return <Loader />;
  }

  if (error) {
    const errorResponse = error as { response?: { data?: { message?: string } } };
    return (
      <Content className={`${styles.noInvite} has-text-centered`} padding>
        <Icon className={styles.noInviteIcon} icon="exclamation-circle" />
        <p>
          {errorResponse.response.data.message === 'Organization not found' ? (
            <FormattedMessage {...messages.deletedOrganization} />
          ) : (
            <FormattedMessage
              {...messages.noInvite}
              values={{
                link: (text) => <Link to="apps">{text}</Link>,
              }}
            />
          )}
        </p>
      </Content>
    );
  }

  const header = (
    <header className="py-4">
      <Title level={2}>
        <FormattedMessage
          {...messages.joining}
          values={{ organization: organization.name || organization.id }}
        />
      </Title>
      <Subtitle level={4}>@{organization.id}</Subtitle>
    </header>
  );

  if (!userInfo) {
    const search = new URLSearchParams(qs);
    search.set('redirect', redirect);

    return (
      <Content className="has-text-centered">
        {header}
        <p>
          <FormattedMessage {...messages.loginPrompt} />
        </p>
        <Button
          className="my-3"
          color="primary"
          component={Link}
          icon="sign-in-alt"
          to={{ pathname: '../login', search: `?${search}` }}
        >
          <FormattedMessage {...messages.login} />
        </Button>
      </Content>
    );
  }

  if (success && joined) {
    return (
      <Content padding>
        {joined ? (
          <Message className={styles.root} color="success">
            <FormattedMessage
              {...messages.successJoined}
              values={{
                organization: <strong>{organization.name || organization.id}</strong>,
                makeApps: (link) => <Link to="apps">{link}</Link>,
                viewOrganization: (link) => (
                  <Link to={`organizations/@${organization.id}`}>{link}</Link>
                ),
              }}
            />
          </Message>
        ) : (
          <Message className={styles.root} color="info">
            <FormattedMessage
              {...messages.successDeclined}
              values={{
                makeApps: (link) => <Link to="apps">{link}</Link>,
              }}
            />
          </Message>
        )}
      </Content>
    );
  }

  if (organizations.some((org) => org.id === organization.id)) {
    return (
      <Content className="has-text-centered">
        {header}
        <p>
          <FormattedMessage {...messages.alreadyJoined} />
        </p>
        <div className="py-4">
          <Button className="mr-3" color="primary" icon="sign-out-alt" onClick={logout}>
            <FormattedMessage {...messages.logout} />
          </Button>
        </div>
      </Content>
    );
  }

  return (
    <Content className="has-text-centered">
      {header}
      <p>
        <FormattedMessage {...messages.invitePrompt} />
      </p>
      <div className="py-4">
        <Button className="mx-2" color="danger" disabled={submitting} onClick={onDeclineClick}>
          <FormattedMessage {...messages.decline} />
        </Button>
        <Button className="mx-2" color="success" disabled={submitting} onClick={onAcceptClick}>
          <FormattedMessage {...messages.accept} />
        </Button>
      </div>
    </Content>
  );
}
