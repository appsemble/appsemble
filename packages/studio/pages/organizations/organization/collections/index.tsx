import { MetaSwitch } from '@appsemble/react-components';
import { type ReactElement } from 'react';
import { Route } from 'react-router-dom';

import { CollectionRoutes } from './collection/index.js';
import { CollectionsPage } from '../CollectionsPage/index.js';

export function CollectionsRoutes(): ReactElement {
  return (
    <MetaSwitch title="Collections">
      <Route element={<CollectionRoutes />} path="/:collectionId/*" />
      <Route element={<CollectionsPage />} path="/" />
    </MetaSwitch>
  );
}
