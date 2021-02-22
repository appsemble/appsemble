import { Content, Title, useMeta } from '@appsemble/react-components';
import { ReactElement } from 'react';
import { FormattedMessage } from 'react-intl';

import { messages } from './messages';
import { OAuth2Secrets } from './OAuth2Secrets';
import { SamlSecrets } from './SamlSecrets';

export function SecretsPage(): ReactElement {
  useMeta(messages.title);

  return (
    <Content>
      <Title>
        <FormattedMessage {...messages.title} />
      </Title>
      <OAuth2Secrets />
      <SamlSecrets />
    </Content>
  );
}
