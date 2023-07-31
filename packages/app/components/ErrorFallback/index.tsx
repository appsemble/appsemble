import { Button, Content, Message, SentryForm } from '@appsemble/react-components';
import { type ReactElement } from 'react';
import { FormattedMessage } from 'react-intl';
import { Link } from 'react-router-dom';

import { messages } from './messages.js';
import { sentryDsn } from '../../utils/settings.js';
import { useUser } from '../UserProvider/index.js';

interface ErrorFallbackProps {
  /**
   * The Sentry event ID that was generated.
   */
  readonly eventId: string;

  /**
   * Resets ErrorBoundary state to be able to navigate back.
   */
  readonly resetErrorBoundary: () => void;
}

/**
 * Capture renderer errors using Sentry.
 */
export function ErrorFallback({ eventId, resetErrorBoundary }: ErrorFallbackProps): ReactElement {
  const user = useUser();

  return (
    <Content className="py-3">
      <Message color="danger">
        <FormattedMessage {...messages.message} />
      </Message>
      <SentryForm
        dsn={sentryDsn}
        email={user?.userInfo?.email}
        eventId={eventId}
        name={user?.userInfo?.name}
        recovery={
          <Button className="mb-3" component={Link} onClick={resetErrorBoundary} to="/">
            <FormattedMessage {...messages.home} />
          </Button>
        }
      />
    </Content>
  );
}
