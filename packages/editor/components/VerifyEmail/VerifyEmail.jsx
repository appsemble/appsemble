import PropTypes from 'prop-types';
import React from 'react';
import { FormattedMessage } from 'react-intl';
import classNames from 'classnames';
import { Loader } from '@appsemble/react-components';

import styles from './VerifyEmail.css';
import messages from './messages';

export default class VerifyEmail extends React.Component {
  static propTypes = {
    verifyEmail: PropTypes.func.isRequired,
    location: PropTypes.shape().isRequired,
  };

  state = { submitting: true };

  async componentDidMount() {
    const { verifyEmail, location } = this.props;
    const token = new URLSearchParams(location.search).get('token');

    try {
      await verifyEmail(token);
      this.setState({ submitting: false, success: true });
    } catch (error) {
      this.setState({ submitting: false, success: false });
    }
  }

  render() {
    const { submitting, success } = this.state;

    if (submitting) {
      return <Loader />;
    }

    if (success) {
      return (
        <div className={classNames('container', styles.root)}>
          <article className="message is-success">
            <div className="message-body">
              <FormattedMessage {...messages.requestSuccess} />
            </div>
          </article>
        </div>
      );
    }

    return (
      <div className={classNames('container', styles.root)}>
        <article className="message is-danger">
          <div className="message-body">
            <FormattedMessage {...messages.requestFailed} />
          </div>
        </article>
      </div>
    );
  }
}
