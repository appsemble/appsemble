import { MarkdownContent, Title, useMeta } from '@appsemble/react-components';
import jsYaml from 'js-yaml';
import { ReactElement, useMemo } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { Link, useRouteMatch } from 'react-router-dom';

import { useApp } from '../../..';
import { CodeBlock } from '../../../../../../components/CodeBlock';
import { CollapsibleList } from '../../../../../../components/CollapsibleList';
import { Endpoint } from './Endpoint';
import { messages } from './messages';
import { Schema } from './Schema';

export function ResourceDefinitionDetailsPage(): ReactElement {
  const { app } = useApp();
  const {
    params: { lang, resourceName },
  } = useRouteMatch<{ lang: string; id: string; resourceName: string }>();
  const { formatMessage } = useIntl();
  useMeta(formatMessage(messages.pageTitle));

  const resource = app.definition.resources?.[resourceName];
  const yaml = useMemo(() => jsYaml.dump(resource), [resource]);

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
          <Schema nested={false} schema={resource.schema} />
        </>
      )}
      <hr />
      <Title size={4}>
        <FormattedMessage {...messages.endpoints} />
      </Title>
      <Endpoint type="query" />
      <Endpoint type="get" />
      <Endpoint type="$count" />
      <Endpoint type="create" />
      <Endpoint type="update" />
      <Endpoint type="delete" />
      <CollapsibleList size={4} title="YAML View">
        <CodeBlock className="mb-4" code={yaml} language="yaml" />
      </CollapsibleList>
    </>
  );
}
