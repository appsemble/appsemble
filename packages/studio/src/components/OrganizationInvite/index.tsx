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
import axios from 'axios';
import React, { ReactElement, useCallback, useEffect, useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { Link } from 'react-router-dom';

import type { Organization } from '../../types';
import { useUser } from '../UserProvider';
import styles from './index.css';
import messages from './messages';

export default function OrganizationInvite(): ReactElement {
  const { formatMessage } = useIntl();
  const push = useMessages();
  const qs = useQuery();
  const { logout, organizations, setOrganizations, userInfo } = useUser();
  const redirect = useLocationString();

  const [success, setSuccess] = useState(false);
  const { data: organization, error, loading } = useData<Organization>(
    `/api/invites/${qs.get('token')}`,
  );
  const [submitting, setSubmitting] = useState(false);
  const [joined, setJoined] = useState(false);

  useEffect(() => {
    if (error && userInfo) {
      push({ body: formatMessage(messages.invalidInvite), timeout: 0, dismissable: true });
    }
  }, [error, formatMessage, push, userInfo]);

  const sendResponse = useCallback(
    async (response) => {
      setSubmitting(true);

      try {
        await axios.post(`/api/organizations/${organization.id}/join`, {
          token: qs.get('token'),
          response,
        });
        setSuccess(true);
        setJoined(response);

        if (response) {
          setOrganizations([...organizations, { ...organization, role: 'Member' }]);
        }
      } catch (exception) {
        if (exception?.response) {
          const { status } = exception.response;
          if (status === 404) {
            push(formatMessage(messages.invalidInvite));
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

  if (loading) {
    return <Loader />;
  }

  if (error) {
    return (
      <div className={`px-4 py-4 has-text-centered ${styles.noInvite}`}>
        <span>
          <i className={`fas fa-exclamation-circle ${styles.noInviteIcon}`} />
        </span>
        <span>
          <FormattedMessage
            {...messages.noInvite}
            values={{
              here: (
                <Link to="/">
                  <FormattedMessage {...messages.here} />
                </Link>
              ),
            }}
          />
        </span>
      </div>
    );
  }

  const title = (
    <>
      <Title className="pt-4" level={2}>
        <FormattedMessage
          {...messages.joining}
          values={{ organization: organization.name || organization.id }}
        />
      </Title>
      <Subtitle level={4}>@{organization.id}</Subtitle>
    </>
  );

  if (!userInfo) {
    const search = new URLSearchParams(qs);
    search.set('redirect', redirect);

    return (
      <Content className="has-text-centered">
        {title}
        <p>
          <FormattedMessage {...messages.loginPrompt} />
        </p>
        <div className="field is-grouped is-grouped-centered py-4">
          <Link className="button is-primary" to={{ pathname: '/login', search: `?${search}` }}>
            <Icon icon="sign-in-alt" />
            <span>
              <FormattedMessage {...messages.login} />
            </span>
          </Link>
        </div>
      </Content>
    );
  }

  if (success && joined) {
    return (
      <Message className={styles.root} color="success">
        <FormattedMessage
          {...messages.successJoined}
          values={{
            organization: <strong>{organization.name || organization.id}</strong>,
            makeApps: (
              <Link to="/apps">
                <FormattedMessage {...messages.appSettings} />
              </Link>
            ),
            viewOrganization: (
              <Link to="/settings/organizations">
                <FormattedMessage {...messages.organizationSettings} />
              </Link>
            ),
          }}
        />
      </Message>
    );
  }

  if (success && !joined) {
    return (
      <Message className={styles.root} color="info">
        <FormattedMessage
          {...messages.successDeclined}
          values={{
            makeApps: (
              <Link to="/apps">
                <FormattedMessage {...messages.here} />
              </Link>
            ),
          }}
        />
      </Message>
    );
  }

  if (organizations.some((org) => org.id === organization.id)) {
    return (
      <Content className="has-text-centered">
        {title}
        <p>
          <FormattedMessage {...messages.alreadyJoined} />
        </p>
        <div className="field is-grouped is-grouped-centered py-4">
          <p className="control">
            <Button color="primary" icon="sign-out-alt" onClick={logout}>
              <FormattedMessage {...messages.logout} />
            </Button>
          </p>
        </div>
      </Content>
    );
  }

  return (
    <Content className="has-text-centered">
      {title}
      <p>
        <FormattedMessage {...messages.invitePrompt} />
      </p>
      <div className="field is-grouped is-grouped-centered py-4">
        <p className="control">
          <Button
            className={styles.registerButton}
            color="danger"
            disabled={submitting}
            onClick={onDeclineClick}
          >
            <FormattedMessage {...messages.decline} />
          </Button>
        </p>
        <p className="control">
          <Button color="success" disabled={submitting} onClick={onAcceptClick}>
            <FormattedMessage {...messages.accept} />
          </Button>
        </p>
      </div>
    </Content>
  );
}
