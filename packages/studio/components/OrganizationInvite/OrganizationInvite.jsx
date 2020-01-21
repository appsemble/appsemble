import { Loader, Message } from '@appsemble/react-components';
import { MessagesContext } from '@appsemble/react-components/hooks/useMessages';
import axios from 'axios';
import classNames from 'classnames';
import PropTypes from 'prop-types';
import React from 'react';
import { FormattedMessage } from 'react-intl';
import { Link } from 'react-router-dom';

import messages from './messages';
import styles from './OrganizationInvite.css';

export default class OrganizationInvite extends React.Component {
  static propTypes = {
    location: PropTypes.shape().isRequired,
    intl: PropTypes.shape().isRequired,
    updateUser: PropTypes.func.isRequired,
  };

  state = {
    token: undefined,
    loading: true,
    organization: undefined,
    submitting: false,
    success: false,
    joined: false,
  };

  async componentDidMount() {
    const { location, intl } = this.props;
    const push = this.context;

    const params = new URLSearchParams(location.search);
    const token = params.get('token');

    let organization;

    try {
      const { data } = await axios.get(`/api/invites/${token}`);
      ({ organization } = data);
    } catch (exception) {
      push({ body: intl.formatMessage(messages.invalidInvite), timeout: 0, dismissable: true });
    }
    this.setState({ token, organization, loading: false });
  }

  onAcceptClick = async () => {
    await this.sendResponse(true);
  };

  onDeclineClick = async () => {
    await this.sendResponse(false);
  };

  sendResponse = async response => {
    const { token, organization } = this.state;
    const { intl } = this.props;
    const push = this.context;

    this.setState({ submitting: true });

    try {
      await axios.post(`/api/organizations/${organization.id}/join`, {
        token,
        response,
      });

      this.setState({ success: true, joined: response, submitting: false });
    } catch (exception) {
      if (exception?.response) {
        const { status } = exception.response;
        if (status === 404) {
          push(intl.formatMessage(messages.invalidInvite));
        }

        if (status === 406) {
          push(intl.formatMessage(messages.invalidOrganization));
        }
      } else {
        push(intl.formatMessage(messages.error));
      }

      this.setState({ success: false, submitting: false });
    }
  };

  static contextType = MessagesContext;

  render() {
    const { success, organization, submitting, loading, joined } = this.state;

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
              <button
                className={classNames('button', 'is-success', styles.registerButton)}
                disabled={submitting}
                onClick={this.onAcceptClick}
                type="button"
              >
                <FormattedMessage {...messages.accept} />
              </button>
            </p>
            <p className="control">
              <button
                className={classNames('button', 'is-danger', styles.registerButton)}
                disabled={submitting}
                onClick={this.onDeclineClick}
                type="button"
              >
                <FormattedMessage {...messages.decline} />
              </button>
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
      <div className={styles.noInvite}>
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
}
