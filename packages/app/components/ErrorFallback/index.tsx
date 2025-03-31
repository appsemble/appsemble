import { Button, Content, Message, SentryForm } from '@appsemble/react-components';
import { type ReactNode } from 'react';
import { FormattedMessage } from 'react-intl';
import { Link } from 'react-router-dom';

import { messages } from './messages.js';
import { sentryDsn } from '../../utils/settings.js';
import { useAppMember } from '../AppMemberProvider/index.js';

interface ErrorFallbackProps {
  /**
   * The Sentry event ID that was generated.
   */
  readonly eventId?: string;

  /**
   * Resets ErrorBoundary state to be able to navigate back.
   */
  readonly resetErrorBoundary: () => void;
}

/**
 * Capture renderer errors using Sentry.
 */
export function ErrorFallback({ eventId, resetErrorBoundary }: ErrorFallbackProps): ReactNode {
  const appMemberContext = useAppMember();

  return (
    <Content className="py-3">
      <Message color="danger">
        <FormattedMessage {...messages.message} />
      </Message>
      <SentryForm
        dsn={sentryDsn}
        email={appMemberContext?.appMemberInfo?.email}
        eventId={eventId}
        name={appMemberContext?.appMemberInfo?.name}
        recovery={
          <Button className="mb-3" component={Link} onClick={resetErrorBoundary} to="/">
            <FormattedMessage {...messages.home} />
          </Button>
        }
      />
    </Content>
  );
}
