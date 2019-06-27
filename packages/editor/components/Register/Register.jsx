import { Form } from '@appsemble/react-components';
import normalize from '@appsemble/utils/normalize';
import classNames from 'classnames';
import PropTypes from 'prop-types';
import React from 'react';
import { FormattedMessage } from 'react-intl';

import HelmetIntl from '../HelmetIntl';
import styles from './Register.css';
import messages from './messages';

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

  onChange = event => {
    const { target } = event;

    if (target.name === 'organization') {
      target.value = normalize(target.value);
    }

    this.setState({ [target.name]: target.value });
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
            <div className="field is-horizontal">
              <div className="field-label is-normal">
                <label className="label" htmlFor="inputEmail">
                  <FormattedMessage {...messages.usernameLabel} />
                </label>
              </div>
              <div className="field-body">
                <div className="field">
                  <div className="control has-icons-left">
                    <input
                      autoComplete="email"
                      className="input"
                      disabled={submitting}
                      id="inputEmail"
                      name="email"
                      onChange={this.onChange}
                      required
                      type="email"
                      value={email}
                    />
                    <span className="icon is-left">
                      <i className="fas fa-envelope" />
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <div className="field is-horizontal">
              <div className="field-label is-normal">
                <label className="label" htmlFor="inputPassword">
                  <FormattedMessage {...messages.passwordLabel} />
                </label>
              </div>
              <div className="field-body">
                <div className="field">
                  <div className="control has-icons-left">
                    <input
                      autoComplete="new-password"
                      className="input"
                      disabled={submitting}
                      id="inputPassword"
                      name="password"
                      onChange={this.onChange}
                      required
                      type="password"
                      value={password}
                    />
                    <span className="icon is-left">
                      <i className="fas fa-unlock" />
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="field is-horizontal">
              <div className="field-label is-normal">
                <label className="label is-inline" htmlFor="inputOrganization">
                  <FormattedMessage {...messages.organizationLabel} />
                  <i className="is-inline has-text-weight-normal">
                    {' - '}
                    <FormattedMessage {...messages.optional} />
                  </i>
                </label>
              </div>
              <div className="field-body">
                <div className="field">
                  <div className="control has-icons-left">
                    <input
                      className="input"
                      disabled={submitting}
                      id="inputOrganization"
                      name="organization"
                      onChange={this.onChange}
                      required
                      value={organization}
                    />
                    <span className="icon is-left">
                      <i className="fas fa-briefcase" />
                    </span>
                  </div>
                </div>
              </div>
            </div>
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
