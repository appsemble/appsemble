import { Content, Title } from '@appsemble/react-components';
import React, { ReactElement } from 'react';
import { FormattedMessage } from 'react-intl';

import { HelmetIntl } from '../HelmetIntl';
import { messages } from './messages';
import { OAuth2Secrets } from './OAuth2Secrets';
import { SamlSecrets } from './SamlSecrets';

export function AppSecrets(): ReactElement {
  return (
    <Content>
      <HelmetIntl title={messages.title} />
      <Title level={1}>
        <FormattedMessage {...messages.title} />
      </Title>
      <OAuth2Secrets />
      <SamlSecrets />
    </Content>
  );
}
