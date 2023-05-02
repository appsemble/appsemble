import { Content } from '@appsemble/react-components';
import { type ReactElement } from 'react';
import { FormattedMessage, type MessageDescriptor } from 'react-intl';

import { messages } from './messages.js';

interface ConfigurationErrorProps {
  message: MessageDescriptor;
}

export function ConfigurationError({ message }: ConfigurationErrorProps): ReactElement {
  return (
    <Content main padding>
      <p>
        <FormattedMessage {...message} /> <FormattedMessage {...messages.configurationError} />
      </p>
    </Content>
  );
}
