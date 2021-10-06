import { Button, Title, useMeta } from '@appsemble/react-components';
import { ReactElement } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { Link, useParams } from 'react-router-dom';

import { useApp } from '..';
import { AppIcon } from '../../../../components/AppIcon';
import { CardHeaderControl } from '../../../../components/CardHeaderControl';
import { CloneButton } from '../../../../components/CloneButton';
import { CodeBlock } from '../../../../components/CodeBlock';
import { getAppUrl } from '../../../../utils/getAppUrl';
import { messages } from './messages';

/**
 * A page for viewing the source code of an app definition.
 */
export function DefinitionPage(): ReactElement {
  const { app } = useApp();
  const { formatMessage } = useIntl();
  useMeta(messages.title, formatMessage(messages.description, { appName: app.definition.name }));
  const { lang } = useParams<{ lang: string }>();

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
          <Link to={`/${lang}/organizations/${app.OrganizationId}`}>
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
            <Link to={`/${lang}/docs/guide`}>
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
