import { Message } from '@appsemble/react-components';
import { type ReactNode } from 'react';
import { FormattedMessage } from 'react-intl';

import { messages } from './messages.js';

export function LoginBanner(): ReactNode {
  return (
    <Message color="warning">
      <div className="is-flex is-justify-content-space-between is-align-items-center">
        <FormattedMessage {...messages.notLoggedIn} />
      </div>
    </Message>
  );
}
