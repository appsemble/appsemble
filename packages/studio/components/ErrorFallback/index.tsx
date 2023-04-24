import { Button, Content, Message, SentryForm, Title, useMeta } from '@appsemble/react-components';
import { type ReactElement } from 'react';
import { FormattedMessage } from 'react-intl';
import { Link } from 'react-router-dom';

import { messages } from './messages.js';
import { sentryDsn } from '../../utils/settings.js';
import { Toolbar } from '../Toolbar/index.js';
import { useUser } from '../UserProvider/index.js';

interface ErrorFallbackProps {
  /**
   * The Sentry event ID that was generated.
   */
  eventId: string;

  /**
   * Resets ErrorBoundary state to be able to navigate back.
   */
  resetErrorBoundary: () => void;
}

/**
 * Capture renderer errors using Sentry.
 */
export function ErrorFallback({ eventId, resetErrorBoundary }: ErrorFallbackProps): ReactElement {
  useMeta(messages.title);
  const user = useUser();

  return (
    <>
      <Toolbar />
      <Content className="py-3">
        <Message color="danger">
          <FormattedMessage {...messages.message} />
        </Message>
        <hr />
        {sentryDsn ? (
          <>
            <Title level={3}>
              <FormattedMessage {...messages.feedback} />
            </Title>
            <SentryForm
              dsn={sentryDsn}
              email={user?.userInfo?.email}
              eventId={eventId}
              name={user?.userInfo?.name}
              recovery={
                <Button className="mb-3" component={Link} onClick={resetErrorBoundary} to="/apps">
                  <FormattedMessage {...messages.toApps} />
                </Button>
              }
            />
          </>
        ) : (
          <Button component={Link} onClick={resetErrorBoundary} to="/apps">
            <FormattedMessage {...messages.toApps} />
          </Button>
        )}
      </Content>
    </>
  );
}
