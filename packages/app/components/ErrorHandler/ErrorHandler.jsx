import { Container } from '@appsemble/react-bulma';
import { captureException, withScope } from '@sentry/browser';
import PropTypes from 'prop-types';
import React from 'react';
import { FormattedMessage } from 'react-intl';

import TitleBar from '../TitleBar';
import styles from './ErrorHandler.css';
import messages from './messages';

/**
 * Capture renderer errors using Sentry.
 */
export default class ErrorHandler extends React.Component {
  static propTypes = PropTypes.node.isRequired;

  state = {
    error: false,
  };

  componentDidCatch(error, info) {
    this.setState({ error: true });
    withScope(scope => {
      Object.entries(info).forEach(([key, value]) => {
        scope.setExtra(key, value);
      });
      captureException(error);
    });
  }

  render() {
    const { children } = this.props;
    const { error } = this.state;

    if (error) {
      return (
        <React.Fragment>
          <TitleBar>
            <FormattedMessage {...messages.title} />
          </TitleBar>
          <Container className={styles.container} role="alert">
            <FormattedMessage {...messages.message} />
          </Container>
        </React.Fragment>
      );
    }

    return children;
  }
}
