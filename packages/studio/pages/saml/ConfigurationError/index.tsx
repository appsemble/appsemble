import { Content } from '@appsemble/react-components';
import { type ReactNode } from 'react';
import { FormattedMessage, type MessageDescriptor } from 'react-intl';

import { messages } from './messages.js';

interface ConfigurationErrorProps {
  readonly message: MessageDescriptor;
}

export function ConfigurationError({ message }: ConfigurationErrorProps): ReactNode {
  return (
    <Content main padding>
      <p>
        <FormattedMessage {...message} /> <FormattedMessage {...messages.configurationError} />
      </p>
    </Content>
  );
}
