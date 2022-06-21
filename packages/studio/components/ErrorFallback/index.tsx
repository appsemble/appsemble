import { Button, Content, Message, SentryForm, Title, useMeta } from '@appsemble/react-components';
import { ReactElement } from 'react';
import { FormattedMessage } from 'react-intl';
import { Link } from 'react-router-dom';

import { sentryDsn } from '../../utils/settings';
import { Toolbar } from '../Toolbar';
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
                <Button className="mb-3" component={Link} to="/apps">
                  <FormattedMessage {...messages.toApps} />
                </Button>
              }
            />
          </>
        ) : (
          <Button component={Link} to="/apps">
            <FormattedMessage {...messages.toApps} />
          </Button>
        )}
      </Content>
    </>
  );
}
