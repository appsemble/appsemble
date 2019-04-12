import { captureException, withScope } from '@sentry/browser';
import PropTypes from 'prop-types';
import React from 'react';

/**
 * Capture renderer errors using Sentry.
 */
export default class ErrorHandler extends React.Component {
  static propTypes = {
    children: PropTypes.node.isRequired,
    fallback: PropTypes.func.isRequired,
  };

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
    const { children, fallback: Fallback } = this.props;
    const { error } = this.state;

    return error ? <Fallback /> : children;
  }
}
