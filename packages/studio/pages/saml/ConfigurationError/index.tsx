import { Content } from '@appsemble/react-components';
import { ReactElement } from 'react';
import { FormattedMessage, MessageDescriptor } from 'react-intl';

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
