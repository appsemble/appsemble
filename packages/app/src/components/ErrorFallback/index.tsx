import { Button, Content, Message, SentryForm } from '@appsemble/react-components';
import { ReactElement } from 'react';
import { FormattedMessage } from 'react-intl';
import { Link } from 'react-router-dom';

import { sentryDsn } from '../../utils/settings';
import { useUser } from '../UserProvider';
import { messages } from './messages';

interface ErrorFallbackProps {
  /**
   * The Sentry event ID that was generated.
   */
  eventId: string;
}

/**
 * Capture renderer errors using Sentry.
 */
export function ErrorFallback({ eventId }: ErrorFallbackProps): ReactElement {
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
          <Button className="mb-3" component={Link} to="/">
            <FormattedMessage {...messages.home} />
          </Button>
        }
      />
    </Content>
  );
}
