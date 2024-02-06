import { Message, MetaSwitch } from '@appsemble/react-components';
import { type ReactNode } from 'react';
import { FormattedMessage } from 'react-intl';
import { Navigate, Route, useParams } from 'react-router-dom';

import { IndexPage } from './IndexPage/index.js';
import { messages } from './messages.js';
import { ResourceDefinitionDetailsPage } from './resource-definition-details/index.js';
import { ResourceDetailsPage } from './resource-details/index.js';
import { useApp } from '../../index.js';

export function ResourceRoutes(): ReactNode {
  const { app } = useApp();
  const { resourceName } = useParams<{ resourceName: string }>();

  const definition = app?.definition?.resources?.[resourceName];

  if (!definition) {
    return (
      <Message color="warning">
        <FormattedMessage {...messages.notFound} />
      </Message>
    );
  }

  if (definition.url) {
    return (
      <p className="content">
        <FormattedMessage
          {...messages.notManaged}
          values={{
            link: (
              <a href={definition.url} rel="noopener noreferrer" target="blank">
                {definition.url}
              </a>
            ),
          }}
        />
      </p>
    );
  }

  return (
    <MetaSwitch title={resourceName}>
      <Route element={<IndexPage />} path="/" />
      <Route element={<ResourceDefinitionDetailsPage />} path="/details" />
      <Route element={<ResourceDetailsPage />} path="/:resourceId" />
      <Route element={<Navigate to="/" />} path="*" />
    </MetaSwitch>
  );
}
