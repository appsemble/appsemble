import { MetaSwitch } from '@appsemble/react-components';
import { type ReactElement } from 'react';
import { Route } from 'react-router-dom';

import { CollectionRoutes } from './collection/index.js';
import { CollectionsPage } from './CollectionsPage/index.js';
import { messages } from './messages.js';

export function CollectionsRoutes(): ReactElement {
  return (
    <MetaSwitch description={messages.description} title={messages.title}>
      <Route element={<CollectionRoutes />} path="/:collectionId/*" />
      <Route element={<CollectionsPage organizationId={null} />} path="/" />
    </MetaSwitch>
  );
}
