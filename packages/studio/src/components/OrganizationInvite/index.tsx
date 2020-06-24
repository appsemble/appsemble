import { Button, Loader, Message, useMessages, useQuery } from '@appsemble/react-components';
import axios from 'axios';
import React from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { Link } from 'react-router-dom';

import type { Organization } from '../../types';
import styles from './index.css';
import messages from './messages';

export default function OrganizationInvite(): React.ReactElement {
  const { formatMessage } = useIntl();
  const push = useMessages();
  const qs = useQuery();

  const [success, setSuccess] = React.useState(false);
  const [organization, setOrganization] = React.useState<Organization>();
  const [submitting, setSubmitting] = React.useState(false);
  const [loading, setLoading] = React.useState(true);
  const [joined, setJoined] = React.useState(false);

  const sendResponse = React.useCallback(
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

  const onAcceptClick = React.useCallback(() => sendResponse(true), [sendResponse]);

  const onDeclineClick = React.useCallback(() => sendResponse(false), [sendResponse]);

  React.useEffect(() => {
    const token = qs.get('token');

    axios
      .get(`/api/invites/${token}`)
      .then(({ data }) => setOrganization(data.organization))
      .catch(() => {
        push({ body: formatMessage(messages.invalidInvite), timeout: 0, dismissable: true });
      })
      .finally(() => {
        setLoading(false);
      });
  }, [formatMessage, push, qs]);

  if (loading) {
    return <Loader />;
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
            <Button
              className="mt-3"
              color="success"
              disabled={submitting}
              onClick={onAcceptClick}
              type="button"
            >
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
