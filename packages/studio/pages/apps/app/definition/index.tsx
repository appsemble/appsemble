import { Button, Title, useMeta } from '@appsemble/react-components';
import { type ReactNode } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { Link } from 'react-router-dom';

import { messages } from './messages.js';
import { AppIcon } from '../../../../components/AppIcon/index.js';
import { CardHeaderControl } from '../../../../components/CardHeaderControl/index.js';
import { CloneButton } from '../../../../components/CloneButton/index.js';
import { CodeBlock } from '../../../../components/CodeBlock/index.js';
import { getAppUrl } from '../../../../utils/getAppUrl.js';
import { useApp } from '../index.js';

/**
 * A page for viewing the source code of an app definition.
 */
export function DefinitionPage(): ReactNode {
  const { app } = useApp();
  const { formatMessage } = useIntl();
  useMeta(messages.title, formatMessage(messages.description, { appName: app.definition.name }));

  return (
    <main>
      <CardHeaderControl
        controls={
          <>
            <Button
              className="mb-3 ml-4"
              color="primary"
              component="a"
              href={getAppUrl(app.OrganizationId, app.path, app.domain)}
              rel="noopener noreferrer"
              target="_blank"
            >
              <FormattedMessage {...messages.view} />
            </Button>
            <CloneButton app={app} />
          </>
        }
        description={app.definition.description}
        icon={<AppIcon app={app} />}
        subtitle={
          <Link to={`../../../organizations/${app.OrganizationId}`}>
            {app.OrganizationName || app.OrganizationId}
          </Link>
        }
        title={app.definition.name}
        titleLevel={2}
      >
        <div className="card-content content">
          <p>
            <FormattedMessage
              {...messages.cloneText}
              values={{ name: <strong>{app.definition.name}</strong> }}
            />
          </p>
        </div>
      </CardHeaderControl>
      <div className="card">
        <div className="card-content">
          <Title>
            <FormattedMessage {...messages.title} />
          </Title>
          <p className="content">
            <FormattedMessage {...messages.explanation} />{' '}
            <Link to="../../../docs/02-guides">
              <FormattedMessage {...messages.learnMore} />
            </Link>
          </p>
          <CodeBlock copy filename="app-definition.yaml" language="yaml">
            {app.yaml}
          </CodeBlock>
        </div>
      </div>
    </main>
  );
}
