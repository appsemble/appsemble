import { Form, Input } from '@appsemble/react-components';
import normalize from '@appsemble/utils/normalize';
import classNames from 'classnames';
import PropTypes from 'prop-types';
import React from 'react';
import { FormattedMessage } from 'react-intl';

import HelmetIntl from '../HelmetIntl';
import messages from './messages';
import styles from './Register.css';

export default class Register extends React.Component {
  static propTypes = {
    registerEmail: PropTypes.func.isRequired,
    intl: PropTypes.shape().isRequired,
    push: PropTypes.func.isRequired,
  };

  state = {
    email: '',
    password: '',
    organization: '',
    submitting: false,
    success: false,
  };

  onChange = (event, value) => {
    const { name } = event.target;

    this.setState({ [name]: name === 'organization' ? normalize(value) : value });
  };

  onSubmit = async event => {
    event.preventDefault();

    const { email, password, organization } = this.state;
    const { registerEmail, intl, push } = this.props;

    this.setState({ submitting: true });

    try {
      await registerEmail(email, password, organization);
      this.setState({ submitting: false, success: true });
    } catch (error) {
      if (error?.response?.status !== 409) {
        push(intl.formatMessage(messages.registerFailed));
      } else if (error.response.data.message === 'User with this email address already exists.') {
        push(intl.formatMessage(messages.emailConflict));
      } else if (error.response.data.message === 'This organization already exists.') {
        push({
          body: intl.formatMessage(messages.organizationConflict),
          timeout: 0,
          dismissable: true,
        });
      } else {
        push(intl.formatMessage(messages.registerFailed));
      }

      this.setState({ submitting: false, success: false });
    }
  };

  render() {
    const { email, password, organization, submitting, success } = this.state;

    return (
      <React.Fragment>
        <HelmetIntl title={messages.title} />
        {success ? (
          <div className={classNames('container', styles.root)}>
            <article className="message is-success">
              <div className="message-body">
                <FormattedMessage {...messages.registerSuccess} />
              </div>
            </article>
          </div>
        ) : (
          <Form className={classNames('container', styles.root)} onSubmit={this.onSubmit}>
            <Input
              autoComplete="email"
              disabled={submitting}
              iconLeft="envelope"
              id="inputEmail"
              label={<FormattedMessage {...messages.usernameLabel} />}
              name="email"
              onChange={this.onChange}
              required
              type="email"
              value={email}
            />
            <Input
              autoComplete="new-password"
              disabled={submitting}
              iconLeft="unlock"
              id="inputPassword"
              label={<FormattedMessage {...messages.passwordLabel} />}
              name="password"
              onChange={this.onChange}
              required
              type="password"
              value={password}
            />
            <Input
              disabled={submitting}
              iconLeft="briefcase"
              id="inputOrganization"
              label={<FormattedMessage {...messages.organizationLabel} />}
              name="organization"
              onChange={this.onChange}
              value={organization}
            />
            <button
              className={classNames('button', 'is-primary', styles.submit)}
              disabled={submitting}
              type="submit"
            >
              <FormattedMessage {...messages.registerButton} />
            </button>
          </Form>
        )}
      </React.Fragment>
    );
  }
}
