import { captureException } from '@sentry/browser';
import { Component, ElementType, ErrorInfo, ReactNode } from 'react';

interface ErrorHandlerProps {
  /**
   * Children to render.
   */
  children: ReactNode;

  /**
   * The fallback to render in case an error occurs rendering children.
   */
  fallback: ElementType<ErrorHandlerState | { resetErrorBoundary: () => void }>;
}

interface ErrorHandlerState {
  /**
   * The error that was thrown.
   */
  error: Error;

  /**
   * The Sentry event ID that has been generated.
   */
  eventId: string;
}

/**
 * Capture React render errors.
 *
 * The are captured errors using Sentry.
 */
class ErrorBoundary extends Component<ErrorHandlerProps, ErrorHandlerState> {
  state: ErrorHandlerState = {
    error: null,
    eventId: null,
  };

  componentDidCatch(error: Error, { componentStack }: ErrorInfo): void {
    this.setState({
      error,
      eventId: captureException(error, { contexts: { react: { componentStack } } }),
    });
  }

  resetErrorBoundary = (): void => {
    this.setState({ error: null, eventId: null });
  };

  render(): ReactNode {
    const { children, fallback: Fallback } = this.props;
    const { error, eventId } = this.state;

    return error ? (
      <Fallback error={error} eventId={eventId} resetErrorBoundary={this.resetErrorBoundary} />
    ) : (
      children
    );
  }
}

export const ErrorHandler = ErrorBoundary;
