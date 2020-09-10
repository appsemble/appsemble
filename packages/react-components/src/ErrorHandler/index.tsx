import { captureException, withScope } from '@sentry/browser';
import React, { Component, ElementType, ErrorInfo, ReactNode } from 'react';
import { RouteComponentProps, withRouter } from 'react-router-dom';

interface ErrorHandlerProps extends RouteComponentProps<any> {
  /**
   * Children to render.
   */
  children: ReactNode;

  /**
   * The fallback to render in case an error occurs rendering children.
   */
  fallback: ElementType;
}

interface ErrorHandlerState {
  error: boolean;
}

/**
 * Capture React render errors.
 *
 * The are captured errors using Sentry.
 */
class ErrorBoundary extends Component<ErrorHandlerProps, ErrorHandlerState> {
  state: ErrorHandlerState = {
    error: false,
  };

  componentDidMount(): void {
    const { history } = this.props;

    history.listen(() => {
      this.setState({ error: false });
    });
  }

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

export const ErrorHandler = withRouter(ErrorBoundary);
