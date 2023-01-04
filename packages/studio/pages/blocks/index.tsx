import { MetaSwitch } from '@appsemble/react-components';
import { ReactElement } from 'react';
import { Navigate, Route } from 'react-router-dom';

import { BlockPage } from './block/index.js';
import { IndexPage } from './IndexPage/index.js';
import { messages } from './messages.js';

/**
 * Render routes related to blocks.
 */
export function BlockRoutes(): ReactElement {
  return (
    <MetaSwitch description={messages.description} title={messages.title}>
      <Route element={<IndexPage />} path="/" />
      <Route element={<BlockPage />} path="/:organization/:blockName/:version" />
      <Route element={<BlockPage />} path="/:organization/:blockName/*" />
      <Route element={<Navigate to="/" />} path="*" />
    </MetaSwitch>
  );
}
