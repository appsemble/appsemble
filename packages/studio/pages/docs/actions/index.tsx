import { MetaSwitch, useMeta } from '@appsemble/react-components';
import { defaultLocale } from '@appsemble/utils';
import { type ReactNode } from 'react';
import { Route } from 'react-router-dom';

import ResourcesActionDocs from './docs/00-resources.mdx';
import StorageActionDocs from './docs/01-storage.mdx';
import UserActionDocs from './docs/02-users.mdx';
import TeamActionDocs from './docs/03-teams.mdx';
import FlowActionDocs from './docs/04-flow.mdx';
import LinkActionDocs from './docs/05-link.mdx';
import MiscellaneousActionDocs from './docs/06-miscellaneous.mdx';
import Introduction from './introduction.mdx';
import { messages } from './messages.js';

export function ActionRoutes(): ReactNode {
  useMeta(messages.title, messages.description);
  return (
    <main lang={defaultLocale}>
      <MetaSwitch>
        <Route element={<Introduction />} path="/" />
        <Route element={<ResourcesActionDocs />} path="/resources" />
        <Route element={<StorageActionDocs />} path="/storage" />
        <Route element={<UserActionDocs />} path="/user" />
        <Route element={<TeamActionDocs />} path="/team" />
        <Route element={<FlowActionDocs />} path="/flow" />
        <Route element={<LinkActionDocs />} path="/link" />
        <Route element={<MiscellaneousActionDocs />} path="/miscellaneous" />
      </MetaSwitch>
    </main>
  );
}
