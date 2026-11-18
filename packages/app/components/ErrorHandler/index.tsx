import { captureException } from '@sentry/browser';
import { Component, type ComponentChildren, type ComponentType, type ErrorInfo } from 'preact';

interface ErrorHandlerProps {
  /**
   * Children to render.
   */
  readonly children: ComponentChildren;

  /**
   * The fallback to render in case an error occurs rendering children.
   */
  readonly fallback: ComponentType<ErrorHandlerState & { resetErrorBoundary: () => void }>;
}

interface ErrorHandlerState {
  /**
   * The error that was thrown.
   */
  error?: Error;

  /**
   * The Sentry event ID that has been generated.
   */
  eventId?: string;
}

/**
 * Capture render errors.
 *
 * Captured errors are reported to Sentry.
 */
export class ErrorHandler extends Component<ErrorHandlerProps, ErrorHandlerState> {
  state: ErrorHandlerState = {
    error: undefined,
    eventId: undefined,
  };

  componentDidCatch(error: Error, { componentStack }: ErrorInfo): void {
    this.setState({
      error,
      eventId: captureException(error, { contexts: { react: { componentStack } } }),
    });
  }

  resetErrorBoundary = (): void => {
    this.setState({ error: undefined, eventId: undefined });
  };

  render(): ComponentChildren {
    const { children, fallback: Fallback } = this.props;
    const { error, eventId } = this.state;

    return error ? (
      <Fallback error={error} eventId={eventId} resetErrorBoundary={this.resetErrorBoundary} />
    ) : (
      children
    );
  }
}
