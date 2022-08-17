import { Message, MetaSwitch } from '@appsemble/react-components';
import { ReactElement } from 'react';
import { FormattedMessage } from 'react-intl';
import { Redirect, Route, useRouteMatch } from 'react-router-dom';

import { useApp } from '../../index.js';
import { IndexPage } from './IndexPage/index.js';
import { messages } from './messages.js';
import { ResourceDefinitionDetailsPage } from './resource-definition-details/index.js';
import { ResourceDetailsPage } from './resource-details/index.js';

export function ResourceRoutes(): ReactElement {
  const { app } = useApp();
  const {
    params: { resourceName },
    path,
    url,
  } = useRouteMatch<{ resourceName: string }>();

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
      <Route exact path={path}>
        <IndexPage />
      </Route>
      <Route path={`${path}/details`}>
        <ResourceDefinitionDetailsPage />
      </Route>
      <Route path={`${path}/:resourceId(\\d+)`}>
        <ResourceDetailsPage />
      </Route>
      <Redirect to={url} />
    </MetaSwitch>
  );
}
