import { Content, Message } from '@appsemble/react-components';
import React, { ReactElement } from 'react';
import { FormattedMessage } from 'react-intl';

import { messages } from './messages';

/**
 * Capture renderer errors using Sentry.
 */
export function ErrorFallback(): ReactElement {
  return (
    <Content className="py-3">
      <Message color="danger">
        <FormattedMessage {...messages.message} />
      </Message>
    </Content>
  );
}
