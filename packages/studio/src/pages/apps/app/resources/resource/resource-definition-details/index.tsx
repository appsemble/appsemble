import { Title, useMeta } from '@appsemble/react-components';
import { ReactElement, useMemo } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { Link, useRouteMatch } from 'react-router-dom';
import { stringify } from 'yaml';

import { useApp } from '../../..';
import { CodeBlock } from '../../../../../../components/CodeBlock';
import { Collapsible } from '../../../../../../components/Collapsible';
import { MarkdownContent } from '../../../../../../components/MarkdownContent';
import { Schema } from '../../../../../../components/Schema';
import { Endpoint } from './Endpoint';
import { messages } from './messages';

/**
 * Render the page for resource definition details.
 */
export function ResourceDefinitionDetailsPage(): ReactElement {
  const { app } = useApp();
  const {
    params: { lang, resourceName },
  } = useRouteMatch<{ lang: string; id: string; resourceName: string }>();
  const { formatMessage } = useIntl();
  useMeta(formatMessage(messages.pageTitle));

  const resource = app.definition.resources[resourceName];
  const yaml = useMemo(() => stringify(resource), [resource]);

  return (
    <>
      <Title>
        <FormattedMessage {...messages.title} values={{ resourceName }} />
      </Title>
      <p>
        <FormattedMessage
          {...messages.description}
          values={{
            public: <code>$public</code>,
            securityLink: (content: string) => (
              <Link to={`/${lang}/docs/guide/api`}>{content}</Link>
            ),
            apiLink: (content: string) => (
              <Link to={`/${lang}/docs/guide/resources`}>{content}</Link>
            ),
          }}
        />
      </p>
      {resource.schema?.description && <MarkdownContent content={resource.schema.description} />}
      <hr />
      {resource.schema && (
        <>
          <Title size={4}>
            <FormattedMessage {...messages.properties} />
          </Title>
          <Schema schema={resource.schema} />
        </>
      )}
      <hr />
      <Title size={4}>
        <FormattedMessage {...messages.endpoints} />
      </Title>
      <Endpoint type="query" />
      <Endpoint type="get" />
      <Endpoint type="$count" />
      <Endpoint hasBody type="create" />
      <Endpoint hasBody type="update" />
      <Endpoint type="delete" />
      <hr />
      <Collapsible size={4} title="YAML View">
        <CodeBlock className="mb-4" language="yaml">
          {yaml}
        </CodeBlock>
      </Collapsible>
    </>
  );
}
