import { Title, useMeta } from '@appsemble/react-components';
import { ReactElement } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';

import { useApp } from '..';
import { CodeBlock } from '../../../../components/CodeBlock';
import { messages } from './messages';

/**
 * A page for viewing the source code of an app definition.
 */
export function DefinitionPage(): ReactElement {
  const { app } = useApp();
  const { formatMessage } = useIntl();
  useMeta(messages.title, formatMessage(messages.description, { appName: app.definition.name }));

  return (
    <main>
      <Title>
        <FormattedMessage {...messages.title} />
      </Title>
      <CodeBlock code={app.yaml} language="yaml" />
    </main>
  );
}
