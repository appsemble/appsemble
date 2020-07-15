import {
  Button,
  Icon,
  Loader,
  Message,
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
import { useOrganizations } from '../OrganizationsProvider';
import { useUser } from '../UserProvider';
import styles from './index.css';
import messages from './messages';

export default function OrganizationInvite(): ReactElement {
  const { formatMessage } = useIntl();
  const push = useMessages();
  const qs = useQuery();
  const { logout, userInfo } = useUser();
  const organizations = useOrganizations();
  const redirect = useLocationString();

  const [success, setSuccess] = useState(false);
  const { data, error, loading } = useData<{
    organization: Organization;
  }>(`/api/invites/${qs.get('token')}`);
  const [submitting, setSubmitting] = useState(false);
  const [joined, setJoined] = useState(false);
  const { organization } = data ?? {};

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
    [formatMessage, organization, push, qs],
  );

  const onAcceptClick = useCallback(() => sendResponse(true), [sendResponse]);

  const onDeclineClick = useCallback(() => sendResponse(false), [sendResponse]);

  if (loading) {
    return <Loader />;
  }

  if (userInfo && organizations.organizations.some((o) => o.id === organization.id)) {
    return (
      <div className={`${styles.root} content`}>
        <p>
          <FormattedMessage {...messages.alreadyJoined} />
        </p>
        <div className="field">
          <Button icon="sign-out-alt" onClick={logout}>
            <FormattedMessage {...messages.logout} />
          </Button>
        </div>
      </div>
    );
  }

  if (!userInfo) {
    const search = new URLSearchParams(qs);
    search.set('redirect', redirect);

    return (
      <div className={`${styles.root} content`}>
        <p>
          <FormattedMessage {...messages.loginPrompt} />
        </p>
        <div className="field">
          <Link className="button" to={{ pathname: '/login', search: `?${search}` }}>
            <Icon icon="sign-in-alt" />
            <span>
              <FormattedMessage {...messages.login} />
            </span>
          </Link>
        </div>
      </div>
    );
  }

  if (!success && organization?.id) {
    return (
      <div className={`${styles.root} content`}>
        <h2>
          <FormattedMessage
            {...messages.joining}
            values={{ organization: organization.name || organization.id }}
          />
        </h2>

        <p>
          <FormattedMessage {...messages.invitePrompt} />
        </p>

        <div className="field is-grouped">
          <p className="control">
            <Button color="success" disabled={submitting} onClick={onAcceptClick}>
              <FormattedMessage {...messages.accept} />
            </Button>
          </p>
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
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <Message className={styles.root} color={joined ? 'success' : 'info'}>
        {joined ? (
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
        ) : (
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
        )}
      </Message>
    );
  }

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
