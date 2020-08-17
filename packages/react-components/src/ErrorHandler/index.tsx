import { captureException, withScope } from '@sentry/browser';
import React, { Component, ElementType, ErrorInfo, ReactNode } from 'react';

interface ErrorHandlerProps {
  children: ReactNode;
  fallback: ElementType;
}

interface ErrorHandlerState {
  error: boolean;
}

/**
 * Capture renderer errors using Sentry.
 */
export class ErrorHandler extends Component<ErrorHandlerProps, ErrorHandlerState> {
  state: ErrorHandlerState = {
    error: false,
  };

  componentDidCatch(error: Error, info: ErrorInfo): void {
    this.setState({ error: true });
    withScope((scope) => {
      Object.entries(info).forEach(([key, value]) => {
        scope.setExtra(key, value);
      });
      captureException(error);
    });
  }

  render(): ReactNode {
    const { children, fallback: Fallback } = this.props;
    const { error } = this.state;

    return error ? <Fallback /> : children;
  }
}
