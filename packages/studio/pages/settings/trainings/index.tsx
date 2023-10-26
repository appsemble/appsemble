import { MetaSwitch } from '@appsemble/react-components';
import { type ReactElement } from 'react';
import { Route } from 'react-router-dom';

import { IndexPage } from './IndexPage/index.js';
import { messages } from './messages.js';
import { TrainingHomePage } from './training/index.js';

export function TrainingRoutes(): ReactElement {
  return (
    <MetaSwitch description={messages.description} title={messages.title}>
      <Route element={<IndexPage />} path="/" />
      <Route element={<TrainingHomePage />} path="/:trainingId/" />
    </MetaSwitch>
  );
}
