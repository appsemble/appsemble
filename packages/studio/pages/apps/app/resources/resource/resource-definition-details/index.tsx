import { Title, useMeta } from '@appsemble/react-components';
import { type ReactNode, useMemo } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { Link, useParams } from 'react-router-dom';
import { stringify } from 'yaml';

import { Endpoint } from './Endpoint/index.js';
import { messages } from './messages.js';
import { CodeBlock } from '../../../../../../components/CodeBlock/index.js';
import { Collapsible } from '../../../../../../components/Collapsible/index.js';
import { MarkdownContent } from '../../../../../../components/MarkdownContent/index.js';
import { Schema } from '../../../../../../components/Schema/index.js';
import { useApp } from '../../../index.js';

/**
 * Render the page for resource definition details.
 */
export function ResourceDefinitionDetailsPage(): ReactNode {
  const { app } = useApp();
  const { resourceName } = useParams<{ id: string; resourceName: string }>();
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
            securityLink: (content) => <Link to="../../../../../docs/03-guide/api">{content}</Link>,
            apiLink: (content) => (
              <Link to="../../../../../docs/03-guide/resources">{content}</Link>
            ),
          }}
        />
      </p>
      {resource.schema?.description ? (
        <MarkdownContent content={resource.schema.description} />
      ) : null}
      <hr />
      {resource.schema ? (
        <>
          <Title size={4}>
            <FormattedMessage {...messages.properties} />
          </Title>
          <Schema schema={resource.schema} />
        </>
      ) : null}
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
