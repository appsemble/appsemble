import { captureException, withScope } from '@sentry/browser';
import * as React from 'react';

export interface ErrorHandlerProps {
  children: React.ReactNode;
  fallback: React.ElementType;
}

interface ErrorHandlerState {
  error: boolean;
}

/**
 * Capture renderer errors using Sentry.
 */
export default class ErrorHandler extends React.Component<ErrorHandlerProps, ErrorHandlerState> {
  state: ErrorHandlerState = {
    error: false,
  };

  componentDidCatch(error: Error, info: React.ErrorInfo): void {
    this.setState({ error: true });
    withScope(scope => {
      Object.entries(info).forEach(([key, value]) => {
        scope.setExtra(key, value);
      });
      captureException(error);
    });
  }

  render(): React.ReactNode {
    const { children, fallback: Fallback } = this.props;
    const { error } = this.state;

    return error ? <Fallback /> : children;
  }
}
